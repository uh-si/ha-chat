"""Zentrale Logik für HA Chat: Unterhaltungen, Nachrichten, Live-Events, Push."""
from __future__ import annotations

import asyncio
import logging
import mimetypes
import os
import re
import secrets
import shutil
import time
import sqlite3
from datetime import datetime, timedelta, timezone
from typing import Any, Callable

from homeassistant.components import websocket_api
from homeassistant.components.http.auth import async_sign_path
from homeassistant.core import Context, Event, HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.util import slugify

from .const import (
    ACTION_BUTTON,
    CONF_EVENTS,
    EVENT_BUTTON,
    EVENT_MESSAGE,
    MAX_BUTTONS,
    MAX_AVATAR_BYTES,
    MAX_DESCRIPTION,
    MAX_UPLOAD_BYTES,
    ACTION_READ,
    ACTION_REPLY,
    CONF_DASHBOARD_PATH,
    CONF_PUSH,
    CONF_RETENTION_DAYS,
    CONF_USERS,
    DEFAULT_DASHBOARD_PATH,
    DEFAULT_RETENTION_DAYS,
    HOUSE_CONVERSATION_NAME,
    MAX_TEXT_LENGTH,
    PERSONAL_HOME_NAME,
    REACTIONS,
    SYSTEM_SENDER,
    SYSTEM_SENDER_NAME,
)
from . import i18n
from .store import ChatStore

_LOGGER = logging.getLogger(__name__)

SIGN_EXPIRY = timedelta(days=1)
# So lange wird gewartet, ob die Nachricht direkt gelesen wird, bevor eine Push-Nachricht rausgeht.
PUSH_DELAY_SECONDS = 4
# Die kostenlose Push-Zustellung von Home Assistant erlaubt 500 Pushs pro Gerät und Tag (UTC).
# Ab dieser Anzahl Chat-Pushs wird gedrosselt, damit genug für andere Meldungen
# (z. B. Alarme aus Automationen) übrig bleibt.
PUSH_SOFT_LIMIT = 350
PUSH_THROTTLE_SECONDS = 600
TEST_PUSH_DELAY = 10
# Erlaubte Dashboard-Pfade für den Sprung aus der Push (z. B. /dashboard-chat/0)
VIEW_PATH_RE = re.compile(r"^/[A-Za-z0-9._~\-]+(/[A-Za-z0-9._~\-]+)*/?$")


class ChatError(HomeAssistantError):
    """Fehler, der an die Karte zurückgegeben wird."""

    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


class ChatManager:
    """Hält Zustand und Logik des Chats."""

    def __init__(self, hass: HomeAssistant, store: ChatStore, options: dict[str, Any]) -> None:
        self.hass = hass
        self.store = store
        self.options = options
        self.user_names: dict[str, str] = {}
        # user_id -> {"path": ..., "updated_at": ...}
        self.avatars: dict[str, dict[str, Any]] = {}
        # user_id -> {key: (connection, msg_id)}
        self._subs: dict[str, dict[int, tuple[Any, int]]] = {}
        # id(connection) -> conversation_id, das gerade offen und sichtbar ist
        self._focus: dict[int, int | None] = {}
        # id(connection) -> user_id, solange die Karte dort aktiv benutzt wird ("online")
        self._active: dict[int, str] = {}
        # user_id -> {"show_presence": bool, "last_seen": float | None}
        self.settings: dict[str, dict[str, Any]] = {}
        # Notify-Dienst -> [UTC-Tag, Anzahl Chat-Pushs]
        self._push_count: dict[str, list[Any]] = {}
        # (Notify-Dienst, conversation_id) -> Zeitpunkt der letzten Push
        self._push_last: dict[tuple[str, int], float] = {}
        self._throttle_warned: set[str] = set()
        self.closed = False

    # ------------------------------------------------------------ Optionen
    @property
    def allowed(self) -> list[str]:
        return list(self.options.get(CONF_USERS, []))

    @property
    def retention_days(self) -> int:
        return int(self.options.get(CONF_RETENTION_DAYS, DEFAULT_RETENTION_DAYS))

    def is_allowed(self, user_id: str | None) -> bool:
        return bool(user_id) and user_id in self.allowed

    async def async_load_users(self) -> None:
        """Anzeigenamen (nicht die Anmeldenamen) aller Benutzer laden."""
        names = {}
        for user in await self.hass.auth.async_get_users():
            if not user.system_generated:
                names[user.id] = (user.name or "").strip() or "Benutzer"
        changed = names != self.user_names
        self.user_names = names
        if changed:
            self.emit_users_changed()

    async def async_load_avatars(self) -> None:
        self.avatars = await self._run(self.store.get_avatars)

    async def async_load_settings(self) -> None:
        self.settings = await self._run(self.store.get_user_settings)

    @callback
    def emit_users_changed(self) -> None:
        """Offene Karten laden Namen und Profilbilder neu."""
        self._emit(self.allowed, lambda _t: {"event": "users_changed"})

    async def async_ensure_house(self) -> None:
        """Gemeinsamer Kanal 'Home' mit allen berechtigten Benutzern."""
        conv_id = await self._run(self.store.find_system)
        allowed = self.allowed
        if conv_id is None:
            await self._run(
                self.store.create_conversation, HOUSE_CONVERSATION_NAME, True, True,
                SYSTEM_SENDER, allowed,
            )
            return
        conv = await self._run(self.store.get_conversation, conv_id)
        if conv["name"] != HOUSE_CONVERSATION_NAME:
            # z. B. Update von einer Version, in der der Kanal noch "Haus" hieß
            await self._run(self.store.rename, conv_id, HOUSE_CONVERSATION_NAME)
        # persönliche Kanäle heißen immer wie PERSONAL_HOME_NAME (1.8.0 hieß er noch „Home – privat“)
        await self._run(self.store.rename_personal, PERSONAL_HOME_NAME)
        current = {m["user_id"] for m in conv["members"]}
        add = [u for u in allowed if u not in current]
        remove = [u for u in current if u not in allowed]
        if add or remove:
            await self._run(self.store.set_members, conv_id, add, remove)

    async def _run(self, fn: Callable, *args: Any) -> Any:
        return await self.hass.async_add_executor_job(fn, *args)

    def resolve_user(self, value: str) -> str:
        """Chat-Benutzer aus Benutzer-ID, Anzeigename oder Person (person.xyz) ermitteln."""
        raw = str(value or "").strip()
        if not raw:
            raise ChatError("invalid", "Kein Benutzer angegeben")
        allowed = self.allowed
        if raw in allowed:
            return raw
        if raw.startswith("person."):
            state = self.hass.states.get(raw)
            uid = state.attributes.get("user_id") if state else None
            if uid in allowed:
                return uid
            raise ChatError("not_found", f"Zur Person „{raw}“ gehört kein Chat-Benutzer")
        low = raw.casefold()
        hits = [u for u in allowed if self.user_name(u).casefold() == low]
        if not hits:
            # auch nur der Vorname, z. B. „Max“ für „Max Mustermann“
            hits = [u for u in allowed if self.user_name(u).casefold().split(" ")[0] == low]
        if len(hits) == 1:
            return hits[0]
        if len(hits) > 1:
            raise ChatError("invalid", f"„{raw}“ passt auf mehrere Chat-Benutzer – bitte den vollen Namen angeben")
        raise ChatError("not_found", f"Chat-Benutzer „{raw}“ nicht gefunden")

    async def async_personal_home(self, user_id: str) -> int:
        """Persönlicher Kanal „Home – Messages“ eines Benutzers (wird bei Bedarf angelegt)."""
        conv_id = await self._run(self.store.find_personal, user_id)
        if conv_id is None:
            conv_id = await self._run(self.store.create_personal, user_id, PERSONAL_HOME_NAME, SYSTEM_SENDER)
            await self._emit_conversation(conv_id, [user_id])
        return conv_id

    # ------------------------------------------------------------ Darstellung
    def user_name(self, user_id: str | None) -> str:
        if user_id == SYSTEM_SENDER:
            return SYSTEM_SENDER_NAME
        return self.user_names.get(user_id or "", "Unbekannt")

    @callback
    def user_picture(self, user_id: str, token_id: str | None = None) -> str | None:
        """Eigenes Chat-Profilbild, sonst das Bild der Person in Home Assistant."""
        av = self.avatars.get(user_id)
        if av and token_id:
            url = f"/api/ha_chat/avatar/{user_id}?v={int(av['updated_at'])}"
            return async_sign_path(self.hass, url, SIGN_EXPIRY, refresh_token_id=token_id)
        for state in self.hass.states.async_all("person"):
            if state.attributes.get("user_id") == user_id:
                return state.attributes.get("entity_picture")
        return None

    @callback
    def users_view(self, token_id: str | None = None) -> list[dict[str, Any]]:
        return [
            {
                "id": uid, "name": self.user_name(uid),
                "picture": self.user_picture(uid, token_id),
                "has_avatar": uid in self.avatars,
            }
            for uid in self.allowed
        ]

    @callback
    def present_message(self, msg: dict[str, Any] | None, token_id: str | None) -> dict[str, Any] | None:
        if msg is None:
            return None
        out = {
            "id": msg["id"],
            "conversation_id": msg["conversation_id"],
            "sender_id": msg["sender_id"],
            "sender_name": self.user_name(msg["sender_id"]),
            "text": msg["text"],
            "created_at": msg["created_at"],
            "edited_at": msg["edited_at"],
            "deleted": bool(msg["deleted"]),
            "reactions": msg.get("reactions", []),
            "attachment": None,
            "reply": None,
            "forwarded": bool(msg.get("forwarded")),
            "buttons": [b.get("title", "") for b in (msg.get("buttons") or [])],
            "confirms": [b.get("confirm") or "" for b in (msg.get("buttons") or [])],
            "answer": None,
            "location": msg.get("location"),
            "important": bool(msg.get("important")),
        }
        ans = msg.get("answer")
        if ans:
            out["answer"] = {
                "index": ans.get("index"), "title": ans.get("title"),
                "user_id": ans.get("user_id"), "user_name": self.user_name(ans.get("user_id")),
                "at": ans.get("at"),
            }
        att = msg.get("attachment")
        if att:
            url = f"/api/ha_chat/media/{att['id']}"
            if token_id:
                url = async_sign_path(self.hass, url, SIGN_EXPIRY, refresh_token_id=token_id)
            out["attachment"] = {
                "id": att["id"], "filename": att["filename"], "mime": att["mime"],
                "size": att["size"], "url": url,
            }
        rep = msg.get("reply")
        if rep:
            out["reply"] = {
                "id": rep["id"], "sender_id": rep["sender_id"], "sender_name": self.user_name(rep["sender_id"]),
                "text": rep["text"], "deleted": bool(rep["deleted"]),
                "has_attachment": bool(rep["attachment_id"]),
            }
        return out

    async def async_conversation_view(
        self, conv_id: int, user_id: str, token_id: str | None
    ) -> dict[str, Any] | None:
        conv = await self._run(self.store.get_conversation, conv_id)
        if conv is None:
            return None
        last = await self._run(self.store.last_message, conv_id, user_id)
        unread = await self._run(self.store.unread_count, conv_id, user_id)
        member_ids = [m["user_id"] for m in conv["members"]]
        name = conv["name"]
        picture = None
        other = None
        if conv["is_group"] and conv.get("avatar_path") and token_id:
            url = f"/api/ha_chat/group_avatar/{conv_id}?v={int(conv.get('avatar_updated') or 0)}"
            picture = async_sign_path(self.hass, url, SIGN_EXPIRY, refresh_token_id=token_id)
        if not conv["is_group"]:
            others = [u for u in member_ids if u != user_id]
            other = others[0] if others else user_id
            name = self.user_name(other)
            picture = self.user_picture(other, token_id)
        return {
            "id": conv["id"],
            "name": name or "Gruppe",
            "picture": picture,
            "is_group": bool(conv["is_group"]),
            "is_system": bool(conv["is_system"]),
            "personal": bool(conv.get("owner_id")),
            "has_picture": bool(conv["is_group"] and conv.get("avatar_path")),
            "description": (conv.get("description") or "") if conv["is_group"] else "",
            "other_id": other,
            "created_by": conv["created_by"],
            "members": [
                {
                    "user_id": m["user_id"], "name": self.user_name(m["user_id"]),
                    "picture": self.user_picture(m["user_id"], token_id), "last_read": m["last_read"],
                }
                for m in conv["members"]
            ],
            "unread": unread,
            "updated_at": conv["updated_at"],
            "last_message": self.present_message(last, token_id),
        }

    # ------------------------------------------------------------ Live-Events
    @callback
    def subscribe(self, user_id: str, connection: Any, msg_id: int) -> Callable[[], None]:
        key = id(connection) * 100000 + msg_id
        self._subs.setdefault(user_id, {})[key] = (connection, msg_id)

        @callback
        def unsub() -> None:
            self._subs.get(user_id, {}).pop(key, None)
            self._focus.pop(id(connection), None)
            self._set_active(id(connection), user_id, False)

        return unsub

    @callback
    def set_focus(self, connection: Any, conv_id: int | None, active: bool | None = None) -> None:
        self._focus[id(connection)] = conv_id
        if active is None:  # ältere Karten senden nur den offenen Chat
            active = conv_id is not None
        uid = connection.user.id
        # Nur Verbindungen mit Live-Abo zählen – nur dann wird "offline" beim Trennen sicher erkannt.
        subscribed = any(conn is connection for conn, _ in self._subs.get(uid, {}).values())
        self._set_active(id(connection), uid, bool(active) and subscribed)

    # ------------------------------------------------------------ Online-Status
    def show_presence(self, user_id: str) -> bool:
        return bool(self.settings.get(user_id, {}).get("show_presence", True))

    def is_online(self, user_id: str) -> bool:
        return user_id in self._active.values()

    def _presence_of(self, user_id: str) -> dict[str, Any]:
        return {
            "online": self.is_online(user_id),
            "last_seen": self.settings.get(user_id, {}).get("last_seen"),
        }

    @callback
    def presence_view(self, viewer: str) -> dict[str, dict[str, Any]]:
        """Wer seinen eigenen Status verbirgt, sieht auch den der anderen nicht."""
        if not self.show_presence(viewer):
            return {}
        return {
            uid: self._presence_of(uid)
            for uid in self.allowed if uid != viewer and self.show_presence(uid)
        }

    @callback
    def _set_active(self, key: int, user_id: str, active: bool) -> None:
        was = self.is_online(user_id)
        if active:
            self._active[key] = user_id
        else:
            self._active.pop(key, None)
        now = self.is_online(user_id)
        if was != now:
            self._presence_changed(user_id, now)

    @callback
    def _presence_changed(self, user_id: str, online: bool) -> None:
        ts = time.time()
        self.settings.setdefault(user_id, {"show_presence": True})["last_seen"] = ts
        if not self.closed:
            self.hass.async_create_background_task(
                self._save_last_seen(user_id, ts), "ha_chat_last_seen"
            )
        if not self.show_presence(user_id):
            return
        receivers = [u for u in self.allowed if u != user_id and self.show_presence(u)]
        payload = {"event": "presence", "user_id": user_id, **self._presence_of(user_id)}
        self._emit(receivers, lambda _t: payload)

    async def _save_last_seen(self, user_id: str, ts: float) -> None:
        if self.closed:
            return
        try:
            await self._run(self.store.set_last_seen, user_id, ts)
        except (sqlite3.Error, RuntimeError):
            _LOGGER.debug("Zuletzt-online konnte nicht gespeichert werden", exc_info=True)

    async def async_set_presence_visibility(self, user_id: str, show: bool) -> None:
        await self._run(self.store.set_show_presence, user_id, show)
        self.settings.setdefault(user_id, {})["show_presence"] = show
        others = [u for u in self.allowed if u != user_id and self.show_presence(u)]
        if show:
            payload = {"event": "presence", "user_id": user_id, **self._presence_of(user_id)}
        else:
            payload = {"event": "presence", "user_id": user_id, "online": None, "last_seen": None, "hidden": True}
        self._emit(others, lambda _t: payload)
        self._emit([user_id], lambda _t: {
            "event": "presence_snapshot", "show_presence": show, "presence": self.presence_view(user_id),
        })

    async def async_shutdown(self) -> None:
        """Beim Entladen: "zuletzt online" der gerade aktiven Benutzer sichern."""
        now = time.time()
        for uid in set(self._active.values()):
            try:
                await self._run(self.store.set_last_seen, uid, now)
            except (sqlite3.Error, RuntimeError):
                pass
        self.closed = True

    @callback
    def _is_watching(self, user_id: str, conv_id: int) -> bool:
        for conn, _ in self._subs.get(user_id, {}).values():
            if self._focus.get(id(conn)) == conv_id:
                return True
        return False

    @callback
    def _emit(self, user_ids: list[str], build: Callable[[str | None], dict[str, Any]]) -> None:
        for uid in user_ids:
            for conn, msg_id in list(self._subs.get(uid, {}).values()):
                try:
                    conn.send_message(
                        websocket_api.event_message(msg_id, build(conn.refresh_token_id))
                    )
                except Exception:  # noqa: BLE001
                    _LOGGER.debug("Event konnte nicht gesendet werden", exc_info=True)

    async def _emit_conversation(self, conv_id: int, user_ids: list[str]) -> None:
        for uid in user_ids:
            for conn, msg_id in list(self._subs.get(uid, {}).values()):
                view = await self.async_conversation_view(conv_id, uid, conn.refresh_token_id)
                if view is not None:
                    conn.send_message(
                        websocket_api.event_message(msg_id, {"event": "conversation", "conversation": view})
                    )

    async def _members(self, conv_id: int) -> list[str]:
        conv = await self._run(self.store.get_conversation, conv_id)
        return [m["user_id"] for m in conv["members"]] if conv else []

    # ------------------------------------------------------------ Prüfungen
    async def _check_member(self, conv_id: int, user_id: str) -> dict[str, Any]:
        conv = await self._run(self.store.get_conversation, conv_id)
        if conv is None or user_id not in [m["user_id"] for m in conv["members"]]:
            raise ChatError("not_found", "Unterhaltung nicht gefunden")
        return conv

    async def _check_own_message(self, msg_id: int, user_id: str) -> dict[str, Any]:
        msg = await self._run(self.store.get_message, msg_id)
        if msg is None or msg["sender_id"] != user_id or msg["deleted"]:
            raise ChatError("not_allowed", "Nur eigene Nachrichten können geändert werden")
        return msg

    # ------------------------------------------------------------ Aktionen
    async def async_list(self, user_id: str, token_id: str | None) -> list[dict[str, Any]]:
        ids = await self._run(self.store.conversations_for, user_id)
        result = []
        for cid in ids:
            view = await self.async_conversation_view(cid, user_id, token_id)
            if view:
                result.append(view)
        result.sort(key=lambda c: c["updated_at"], reverse=True)
        return result

    async def async_messages(
        self, user_id: str, conv_id: int, before: int | None, limit: int, token_id: str | None,
        after: int | None = None, around: int | None = None,
    ) -> list[dict[str, Any]]:
        await self._check_member(conv_id, user_id)
        limit = max(1, min(limit, 200))
        if around:
            msgs = await self._run(self.store.get_messages_around, conv_id, around, 25, user_id)
        elif after is not None:
            msgs = await self._run(self.store.get_messages_after, conv_id, after, limit, user_id)
        else:
            msgs = await self._run(self.store.get_messages, conv_id, before, limit, user_id)
        return [self.present_message(m, token_id) for m in msgs]

    async def async_search(
        self, user_id: str, query: str, conv_id: int | None, limit: int, token_id: str | None
    ) -> list[dict[str, Any]]:
        query = (query or "").strip()
        if len(query) < 2:
            return []
        if conv_id:
            await self._check_member(conv_id, user_id)
        msgs = await self._run(self.store.search, user_id, query, conv_id, max(1, min(limit, 100)))
        names: dict[int, dict[str, Any] | None] = {}
        results = []
        for m in msgs:
            cid = m["conversation_id"]
            if cid not in names:
                names[cid] = await self.async_conversation_view(cid, user_id, token_id)
            view = names[cid]
            if view is None:
                continue
            item = self.present_message(m, token_id)
            item["conversation_name"] = view["name"]
            item["conversation_picture"] = view["picture"]
            item["conversation_is_group"] = view["is_group"]
            item["conversation_is_system"] = view["is_system"]
            results.append(item)
        return results

    async def async_create(
        self, user_id: str, members: list[str], name: str | None
    ) -> int:
        others = [m for m in dict.fromkeys(members) if m != user_id]
        if not others:
            raise ChatError("invalid", "Bitte mindestens eine Person auswählen")
        for m in others:
            if not self.is_allowed(m):
                raise ChatError("invalid", "Person ist nicht für den Chat freigegeben")
        if len(others) == 1 and not name:
            existing = await self._run(self.store.find_direct, user_id, others[0])
            if existing:
                return existing
            conv_id = await self._run(
                self.store.create_conversation, None, False, False, user_id, [user_id, *others]
            )
        else:
            conv_id = await self._run(
                self.store.create_conversation, (name or "Neue Gruppe").strip()[:60],
                True, False, user_id, [user_id, *others],
            )
        await self._emit_conversation(conv_id, [user_id, *others])
        return conv_id

    async def async_update_group(
        self, user_id: str, conv_id: int, name: str | None,
        add: list[str], remove: list[str], description: str | None = None,
    ) -> None:
        conv = await self._check_member(conv_id, user_id)
        if not conv["is_group"] or conv["is_system"]:
            raise ChatError("not_allowed", "Diese Unterhaltung kann nicht geändert werden")
        before = [m["user_id"] for m in conv["members"]]
        if remove and conv["created_by"] != user_id:
            raise ChatError("not_allowed", "Nur der Ersteller kann Mitglieder entfernen")
        add = [u for u in add if self.is_allowed(u) and u not in before]
        remove = [u for u in remove if u in before and u != user_id]
        if name and name.strip():
            await self._run(self.store.rename, conv_id, name.strip()[:60])
        if description is not None:
            await self._run(self.store.set_description, conv_id, description.strip()[:MAX_DESCRIPTION])
        if add or remove:
            await self._run(self.store.set_members, conv_id, add, remove)
        await self._emit_conversation(conv_id, await self._members(conv_id))
        if remove:
            self._emit(remove, lambda _t: {"event": "conversation_removed", "conversation_id": conv_id})

    async def async_leave(self, user_id: str, conv_id: int) -> None:
        conv = await self._check_member(conv_id, user_id)
        if not conv["is_group"] or conv["is_system"]:
            raise ChatError("not_allowed", "Diese Unterhaltung kann nicht verlassen werden")
        await self._run(self.store.set_members, conv_id, [], [user_id])
        remaining = await self._members(conv_id)
        self._emit([user_id], lambda _t: {"event": "conversation_removed", "conversation_id": conv_id})
        if not remaining:
            for p in await self._run(self.store.delete_conversation, conv_id):
                await self._run(_remove_file, p)
            return
        await self.async_send(SYSTEM_SENDER, conv_id, f"{self.user_name(user_id)} hat die Gruppe verlassen")

    async def async_delete_conversation(self, user_id: str, conv_id: int) -> None:
        conv = await self._check_member(conv_id, user_id)
        if conv["is_system"] or (conv["is_group"] and conv["created_by"] != user_id):
            raise ChatError("not_allowed", "Nur der Ersteller kann die Gruppe löschen")
        members = [m["user_id"] for m in conv["members"]]
        for p in await self._run(self.store.delete_conversation, conv_id):
            await self._run(_remove_file, p)
        self._emit(members, lambda _t: {"event": "conversation_removed", "conversation_id": conv_id})

    async def _check_group(self, conv_id: int, user_id: str) -> dict[str, Any]:
        conv = await self._check_member(conv_id, user_id)
        if not conv["is_group"] or conv["is_system"]:
            raise ChatError("not_allowed", "Diese Unterhaltung kann nicht geändert werden")
        return conv

    async def async_set_group_avatar(self, user_id: str, conv_id: int, data: bytes) -> None:
        await self._check_group(conv_id, user_id)
        ext = _image_ext(data)
        path = os.path.join(self.store.media_dir, f"group_{secrets.token_urlsafe(12)}{ext}")
        await self._run(_write_file, path, data)
        old = await self._run(self.store.set_group_avatar, conv_id, path)
        if old and old != path:
            await self._run(_remove_file, old)
        await self._emit_conversation(conv_id, await self._members(conv_id))

    async def async_remove_group_avatar(self, user_id: str, conv_id: int) -> None:
        await self._check_group(conv_id, user_id)
        old = await self._run(self.store.set_group_avatar, conv_id, None)
        if old:
            await self._run(_remove_file, old)
        await self._emit_conversation(conv_id, await self._members(conv_id))

    async def async_group_avatar_for(self, user_id: str, conv_id: int) -> str | None:
        conv = await self._run(self.store.get_conversation, conv_id)
        if conv is None or user_id not in [m["user_id"] for m in conv["members"]]:
            return None
        return conv.get("avatar_path")

    async def async_hide(self, user_id: str, msg_id: int) -> None:
        """Nachricht nur für sich selbst ausblenden ("Für mich löschen")."""
        msg = await self._run(self.store.get_message, msg_id)
        if msg is None:
            raise ChatError("not_found", "Nachricht nicht gefunden")
        conv_id = msg["conversation_id"]
        await self._check_member(conv_id, user_id)
        await self._run(self.store.hide_message, user_id, msg_id)
        self._emit([user_id], lambda _t: {
            "event": "messages_hidden", "conversation_id": conv_id, "message_ids": [msg_id],
        })
        await self._emit_conversation(conv_id, [user_id])

    async def async_clear_history(self, user_id: str, conv_id: int) -> None:
        """Alle bisherigen Nachrichten eines Chats nur für sich selbst ausblenden."""
        await self._check_member(conv_id, user_id)
        upto = await self._run(self.store.clear_history, conv_id, user_id)
        self._emit([user_id], lambda _t: {
            "event": "history_cleared", "conversation_id": conv_id, "upto": upto,
        })
        await self._emit_conversation(conv_id, [user_id])
        await self._clear_push(user_id, conv_id)

    async def async_send(
        self, sender_id: str, conv_id: int, text: str,
        reply_to: int | None = None, attachment_id: str | None = None,
        push_title: str | None = None, forwarded: bool = False,
        buttons: list[dict[str, str]] | None = None,
        location: dict[str, Any] | None = None,
        important: bool = False,
    ) -> int:
        text = (text or "").strip()[:MAX_TEXT_LENGTH]
        if sender_id != SYSTEM_SENDER:
            await self._check_member(conv_id, sender_id)
        elif await self._run(self.store.get_conversation, conv_id) is None:
            raise ChatError("not_found", "Unterhaltung nicht gefunden")
        if attachment_id:
            att = await self._run(self.store.get_attachment, attachment_id)
            if att is None or att["conversation_id"] != conv_id or (
                sender_id != SYSTEM_SENDER and att["uploader_id"] != sender_id
            ) or await self._run(self.store.attachment_used, attachment_id):
                raise ChatError("invalid", "Anhang ungültig")
        if location is not None:
            location = _clean_location(location)
        if not text and not attachment_id and not location:
            raise ChatError("invalid", "Leere Nachricht")
        if reply_to:
            ref = await self._run(self.store.get_message, reply_to)
            if ref is None or ref["conversation_id"] != conv_id:
                reply_to = None
        if buttons:
            buttons = [
                {
                    "title": str(b.get("title", ""))[:40],
                    "action": str(b.get("action") or b.get("title", ""))[:100],
                    **({"confirm": str(b["confirm"]).strip()[:80]} if str(b.get("confirm") or "").strip() else {}),
                }
                for b in buttons[:MAX_BUTTONS] if str(b.get("title", "")).strip()
            ] or None
        msg_id = await self._run(
            self.store.add_message, conv_id, sender_id, text, reply_to, attachment_id,
            forwarded, buttons, location, important,
        )
        msg = await self._run(self.store.get_message, msg_id)
        members = await self._members(conv_id)
        if sender_id != SYSTEM_SENDER and self.options.get(CONF_EVENTS, True):
            await self._fire_message_event(conv_id, msg, members)
        self._emit(members, lambda t: {"event": "message", "message": self.present_message(msg, t)})
        await self._emit_conversation(conv_id, members)
        if self.options.get(CONF_PUSH, True):
            self.hass.async_create_background_task(
                self._push_when_unread(conv_id, msg_id, push_title), f"ha_chat_push_{msg_id}"
            )
        return msg_id

    # ------------------------------------------------------------ Erwähnungen & Ereignisse
    def mentioned(self, members: list[str], sender_id: str, text: str) -> list[str]:
        """Mitglieder, die mit @Anzeigename erwähnt wurden."""
        low = (text or "").lower()
        if "@" not in low:
            return []
        return [
            uid for uid in members
            if uid != sender_id and f"@{self.user_name(uid).lower()}" in low
        ]

    async def _fire_message_event(self, conv_id: int, msg: dict[str, Any], members: list[str]) -> None:
        """Ereignis "ha_chat_message" für Automationen (nicht für eigene Home-Meldungen)."""
        conv = await self._run(self.store.get_conversation, conv_id)
        if conv is None:
            return
        att = msg.get("attachment")
        self.hass.bus.async_fire(
            EVENT_MESSAGE,
            {
                "message_id": msg["id"],
                "conversation_id": conv_id,
                "conversation_name": conv["name"] or "",
                "is_group": bool(conv["is_group"]),
                "is_home": bool(conv["is_system"]),
                "sender_id": msg["sender_id"],
                "sender_name": self.user_name(msg["sender_id"]),
                "text": msg["text"],
                "attachment": i18n.attachment_label(att["mime"], self.hass.config.language) if att else None,
                "has_location": bool(msg.get("location")),
                "mentions": self.mentioned(members, msg["sender_id"], msg["text"]),
                "forwarded": bool(msg.get("forwarded")),
                "important": bool(msg.get("important")),
            },
            context=Context(user_id=msg["sender_id"]),
        )

    # ------------------------------------------------------------ Standort
    @callback
    def _tracker_fixes(self, user_id: str) -> tuple[bool, list[dict[str, Any]]]:
        """Positionen aller Geräte-Tracker der Person, die mit diesem Benutzer verknüpft ist."""
        person = next(
            (s for s in self.hass.states.async_all("person") if s.attributes.get("user_id") == user_id),
            None,
        )
        if person is None:
            return False, []
        fixes = []
        for ent in person.attributes.get("device_trackers") or []:
            st = self.hass.states.get(ent)
            if st is None:
                continue
            lat, lon = st.attributes.get("latitude"), st.attributes.get("longitude")
            if not isinstance(lat, (int, float)) or not isinstance(lon, (int, float)):
                continue
            reported = getattr(st, "last_reported", None) or st.last_updated
            fixes.append({
                "entity_id": ent, "name": st.name, "lat": float(lat), "lon": float(lon),
                "acc": st.attributes.get("gps_accuracy"), "ts": reported.timestamp(),
            })
        return True, fixes

    async def async_locate(self, user_id: str, refresh: bool, wait_seconds: int = 25) -> dict[str, Any]:
        """Ermittelt den Standort aus der Companion App; fordert auf Wunsch einen frischen an."""
        has_person, before = self._tracker_fixes(user_id)
        if not has_person:
            return {"status": "no_person", "fixes": []}
        start = time.time()
        requested = []
        if refresh:
            for service in self.notify_services(user_id):
                try:
                    await self.hass.services.async_call(
                        "notify", service, {"message": "request_location_update"}, blocking=False
                    )
                    requested.append(service)
                except Exception:  # noqa: BLE001
                    _LOGGER.debug("Standortanfrage an %s fehlgeschlagen", service, exc_info=True)
        fresh: list[dict[str, Any]] = []
        if requested:
            deadline = start + max(5, min(wait_seconds, 40))
            while time.time() < deadline:
                await asyncio.sleep(1)
                _, now_fixes = self._tracker_fixes(user_id)
                fresh = [f for f in now_fixes if f["ts"] >= start - 1]
                if any((f["acc"] or 9999) <= 100 for f in fresh):
                    break
        _, fixes = self._tracker_fixes(user_id)
        fixes.sort(key=lambda f: (f["ts"] < start - 1, (f["acc"] or 9999)))
        return {
            "status": "ok" if fixes else "no_tracker",
            "requested": len(requested),
            "fresh": any(f["ts"] >= start - 1 for f in fixes),
            "fixes": fixes[:5],
            "now": time.time(),
        }

    # ------------------------------------------------------------ Weiterleiten
    async def async_forward(self, user_id: str, msg_id: int, targets: list[int]) -> int:
        src = await self._run(self.store.get_message, msg_id)
        if src is None or src["deleted"]:
            raise ChatError("not_found", "Nachricht nicht gefunden")
        await self._check_member(src["conversation_id"], user_id)
        count = 0
        for conv_id in dict.fromkeys(targets):
            await self._check_member(conv_id, user_id)
            att_id = None
            if src.get("attachment_id"):
                att = await self._run(self.store.get_attachment, src["attachment_id"])
                if att:
                    # Anhänge sind pro Unterhaltung geschützt – daher eine Kopie anlegen
                    att_id, path = self.new_attachment_path(att["filename"])
                    await self._run(_copy_file, att["path"], path)
                    await self.async_register_attachment(
                        user_id, conv_id, att_id, att["filename"], att["mime"], att["size"], path
                    )
            if not src["text"] and not att_id and not src.get("location"):
                continue
            await self.async_send(
                user_id, conv_id, src["text"], attachment_id=att_id, forwarded=True,
                location=src.get("location"),
            )
            count += 1
        return count

    # ------------------------------------------------------------ Antwortknöpfe
    async def async_press(self, user_id: str, msg_id: int, index: int) -> None:
        msg = await self._run(self.store.get_message, msg_id)
        if msg is None or msg["deleted"]:
            raise ChatError("not_found", "Nachricht nicht gefunden")
        await self._check_member(msg["conversation_id"], user_id)
        buttons = msg.get("buttons") or []
        if not 0 <= index < len(buttons):
            raise ChatError("invalid", "Unbekannter Knopf")
        btn = buttons[index]
        answer = {"index": index, "title": btn["title"], "user_id": user_id, "at": time.time()}
        if not await self._run(self.store.set_answer, msg_id, answer):
            raise ChatError("answered", "Diese Frage wurde bereits beantwortet")
        conv = await self._run(self.store.get_conversation, msg["conversation_id"])
        self.hass.bus.async_fire(
            EVENT_BUTTON,
            {
                "message_id": msg_id,
                "conversation_id": msg["conversation_id"],
                "conversation_name": (conv or {}).get("name") or "",
                "button": btn["title"],
                "action": btn.get("action") or btn["title"],
                "index": index,
                "user_id": user_id,
                "user_name": self.user_name(user_id),
                "question": msg["text"],
            },
            context=Context(user_id=user_id),
        )
        await self._emit_updated(msg["conversation_id"], msg_id)
        await self.async_read(user_id, msg["conversation_id"], None)

    # ------------------------------------------------------------ Gelesen von …
    async def async_read_info(self, user_id: str, msg_id: int) -> list[dict[str, Any]]:
        msg = await self._run(self.store.get_message, msg_id)
        if msg is None or msg["sender_id"] != user_id:
            raise ChatError("not_allowed", "Nur für eigene Nachrichten verfügbar")
        times = await self._run(self.store.read_times, msg["conversation_id"], msg_id)
        return [
            {"user_id": uid, "name": self.user_name(uid), "read_at": at}
            for uid, at in times.items() if uid != user_id
        ]

    # ------------------------------------------------------------ Medien-Übersicht
    async def async_media(
        self, user_id: str, conv_id: int, kind: str, before: int | None, limit: int, token_id: str | None
    ) -> list[dict[str, Any]]:
        await self._check_member(conv_id, user_id)
        msgs = await self._run(self.store.media_list, conv_id, kind, before, max(1, min(limit, 120)), user_id)
        return [self.present_message(m, token_id) for m in msgs]

    async def async_edit(self, user_id: str, msg_id: int, text: str) -> None:
        msg = await self._check_own_message(msg_id, user_id)
        text = (text or "").strip()[:MAX_TEXT_LENGTH]
        if not text:
            raise ChatError("invalid", "Leere Nachricht")
        await self._run(self.store.edit_message, msg_id, text)
        await self._emit_updated(msg["conversation_id"], msg_id)

    async def async_delete(self, user_id: str, msg_id: int) -> None:
        msg = await self._check_own_message(msg_id, user_id)
        path = await self._run(self.store.delete_message, msg_id)
        if path:
            await self._run(_remove_file, path)
        await self._emit_updated(msg["conversation_id"], msg_id)
        await self._emit_conversation(msg["conversation_id"], await self._members(msg["conversation_id"]))

    async def async_react(self, user_id: str, msg_id: int, emoji: str) -> None:
        msg = await self._run(self.store.get_message, msg_id)
        if msg is None or msg["deleted"]:
            raise ChatError("not_found", "Nachricht nicht gefunden")
        await self._check_member(msg["conversation_id"], user_id)
        if emoji not in REACTIONS:
            raise ChatError("invalid", "Unbekannte Reaktion")
        current = await self._run(self.store.get_reaction, msg_id, user_id)
        await self._run(self.store.set_reaction, msg_id, user_id, None if current == emoji else emoji)
        await self._emit_updated(msg["conversation_id"], msg_id)

    async def _emit_updated(self, conv_id: int, msg_id: int) -> None:
        msg = await self._run(self.store.get_message, msg_id)
        hidden = await self._run(self.store.hidden_for, msg_id)
        members = [u for u in await self._members(conv_id) if u not in hidden]
        self._emit(members, lambda t: {"event": "message_updated", "message": self.present_message(msg, t)})

    async def async_read(self, user_id: str, conv_id: int, msg_id: int | None) -> None:
        await self._check_member(conv_id, user_id)
        if not msg_id:
            msg_id = await self._run(self.store.last_message_id, conv_id)
        changed = await self._run(self.store.mark_read, conv_id, user_id, msg_id)
        if not changed:
            return
        members = await self._members(conv_id)
        self._emit(members, lambda _t: {
            "event": "read", "conversation_id": conv_id, "user_id": user_id, "last_read": msg_id,
        })
        await self._emit_conversation(conv_id, [user_id])
        await self._clear_push(user_id, conv_id)

    async def async_typing(self, user_id: str, conv_id: int) -> None:
        await self._check_member(conv_id, user_id)
        others = [u for u in await self._members(conv_id) if u != user_id]
        self._emit(others, lambda _t: {
            "event": "typing", "conversation_id": conv_id, "user_id": user_id,
            "name": self.user_name(user_id),
        })

    # ------------------------------------------------------------ Anhänge
    def new_attachment_path(self, filename: str) -> tuple[str, str]:
        att_id = secrets.token_urlsafe(16)
        ext = os.path.splitext(filename)[1][:10].lower()
        safe_ext = "".join(c for c in ext if c.isalnum() or c == ".")
        return att_id, os.path.join(self.store.media_dir, att_id + safe_ext)

    async def async_register_attachment(
        self, user_id: str, conv_id: int, att_id: str, filename: str,
        mime: str | None, size: int, path: str,
    ) -> dict[str, Any]:
        mime = mime or mimetypes.guess_type(filename)[0] or "application/octet-stream"
        name = os.path.basename(filename)[:120] or "datei"
        await self._run(self.store.add_attachment, att_id, conv_id, user_id, name, mime, size, path)
        return {"id": att_id, "filename": name, "mime": mime, "size": size}

    async def async_attach_file(self, conv_id: int, file_path: str) -> str:
        def _check() -> int | None:
            if not self.hass.config.is_allowed_path(file_path) or not os.path.isfile(file_path):
                return None
            return os.path.getsize(file_path)

        size = await self._run(_check)
        if size is None:
            raise ChatError("invalid", f"Datei nicht erlaubt oder nicht gefunden: {file_path}")
        if size > MAX_UPLOAD_BYTES:
            raise ChatError("invalid", "Datei zu groß (max. 100 MB)")
        att_id, path = self.new_attachment_path(file_path)
        data = await self._run(_read_file, file_path)
        await self._run(_write_file, path, data)
        await self.async_register_attachment(
            SYSTEM_SENDER, conv_id, att_id, os.path.basename(file_path), None, len(data), path
        )
        return att_id

    async def async_media_for(self, user_id: str, att_id: str) -> dict[str, Any] | None:
        att = await self._run(self.store.get_attachment, att_id)
        if att is None:
            return None
        if not await self._run(self.store.is_member, att["conversation_id"], user_id):
            return None
        return att

    # ------------------------------------------------------------ Profilbilder
    async def async_set_avatar(self, user_id: str, data: bytes) -> None:
        ext = _image_ext(data)
        path = os.path.join(self.store.media_dir, f"avatar_{secrets.token_urlsafe(12)}{ext}")
        await self._run(_write_file, path, data)
        old = await self._run(self.store.set_avatar, user_id, path)
        if old and old != path:
            await self._run(_remove_file, old)
        await self.async_load_avatars()
        self.emit_users_changed()

    async def async_remove_avatar(self, user_id: str) -> None:
        old = await self._run(self.store.delete_avatar, user_id)
        if old:
            await self._run(_remove_file, old)
        await self.async_load_avatars()
        self.emit_users_changed()

    @callback
    def avatar_path(self, user_id: str) -> str | None:
        av = self.avatars.get(user_id)
        return av["path"] if av else None

    # ------------------------------------------------------------ Push
    @callback
    def push_devices(self, user_id: str) -> list[dict[str, Any]]:
        """Smartphones/Tablets (Companion App) eines Benutzers und ihr Push-Zustand."""
        devices = []
        for entry in self.hass.config_entries.async_entries("mobile_app"):
            if entry.data.get("user_id") != user_id:
                continue
            raw_name = entry.data.get("device_name") or ""
            service = "mobile_app_" + slugify(raw_name)
            app_data = entry.data.get("app_data") or {}
            devices.append({
                "name": raw_name or entry.title or i18n.text("device", self.lang(user_id)),
                "os": entry.data.get("os_name") or "",
                "model": " ".join(
                    x for x in (entry.data.get("manufacturer"), entry.data.get("model")) if x
                ),
                "app_version": entry.data.get("app_version") or "",
                "service": service if self.hass.services.has_service("notify", service) else None,
                "push": bool(app_data.get("push_url") or app_data.get("push_websocket_channel")),
                "cloud_push": bool(app_data.get("push_url")),
                "sent_today": self._sent_today(service),
            })
        return devices

    @callback
    def notify_services(self, user_id: str) -> list[str]:
        return [d["service"] for d in self.push_devices(user_id) if d["service"]]

    @staticmethod
    def _utc_day() -> str:
        return datetime.now(timezone.utc).strftime("%Y-%m-%d")

    def _sent_today(self, service: str) -> int:
        cnt = self._push_count.get(service)
        return cnt[1] if cnt and cnt[0] == self._utc_day() else 0

    def _push_allowed(self, service: str, conv_id: int) -> bool:
        """Drosselt Chat-Pushs, wenn ein Gerät heute schon sehr viele bekommen hat."""
        if self._sent_today(service) < PUSH_SOFT_LIMIT:
            return True
        if service not in self._throttle_warned:
            self._throttle_warned.add(service)
            _LOGGER.warning(
                "HA Chat: %s hat heute schon %d Chat-Pushs erhalten – ab jetzt höchstens eine "
                "Push je Unterhaltung alle %d Minuten (Tageslimit der Push-Zustellung: 500)",
                service, PUSH_SOFT_LIMIT, PUSH_THROTTLE_SECONDS // 60,
            )
        return time.time() - self._push_last.get((service, conv_id), 0) >= PUSH_THROTTLE_SECONDS

    def _push_sent(self, service: str, conv_id: int) -> None:
        day = self._utc_day()
        cnt = self._push_count.get(service)
        if not cnt or cnt[0] != day:
            cnt = self._push_count[service] = [day, 0]
            self._throttle_warned.discard(service)
        cnt[1] += 1
        self._push_last[(service, conv_id)] = time.time()

    def lang(self, user_id: str | None) -> str:
        """Sprache eines Benutzers ("de"/"en"): von der Karte gemeldet, sonst die der Instanz."""
        stored = self.settings.get(user_id or "", {}).get("language")
        return i18n.norm(stored or self.hass.config.language)

    async def async_set_language(self, user_id: str, language: str) -> str:
        lang = i18n.norm(language)
        current = self.settings.setdefault(user_id, {"show_presence": True})
        if current.get("language") != lang:
            current["language"] = lang
            await self._run(self.store.set_language, user_id, lang)
        return lang

    async def async_set_view_path(self, user_id: str, kind: str, path: str) -> bool:
        """Die Karte meldet, auf welchem Dashboard sie angezeigt wird."""
        path = (path or "").split("?", 1)[0].split("#", 1)[0].strip()
        if len(path) > 200 or not VIEW_PATH_RE.match(path) or kind not in ("card", "compact"):
            return False
        key = "card_path" if kind == "card" else "compact_path"
        current = self.settings.setdefault(user_id, {"show_presence": True})
        if current.get(key) == path:
            return True
        current[key] = path
        await self._run(self.store.set_view_path, user_id, kind, path)
        return True

    def _dashboard_link(self, conv_id: int | None, user_id: str | None = None) -> str:
        """Ziel beim Tippen auf die Push: dort, wo der Benutzer die Chat-Karte nutzt.

        Reihenfolge: zuletzt benutzte Chat-Karte > Dashboard mit der Chat-Kachel >
        eingestellter Dashboard-Pfad der Integration.
        """
        learned = self.settings.get(user_id or "", {})
        base = (
            learned.get("card_path") or learned.get("compact_path")
            or (self.options.get(CONF_DASHBOARD_PATH) or DEFAULT_DASHBOARD_PATH).strip()
        )
        if conv_id is None:
            return base
        sep = "&" if "?" in base else "?"
        return f"{base}{sep}ha_chat={conv_id}"

    @staticmethod
    def _push_data(tag: str, link: str, important: bool = False) -> dict[str, Any]:
        """Gemeinsame Push-Einstellungen.

        Zustellung (alle Nachrichten): Android priority "high" – kommt sofort an, auch wenn das
        Handy schläft (Doze). Bewusst ohne "ttl": 0 – das hieße bei Google "jetzt oder nie",
        eine Nachricht an ein Handy ohne Empfang ginge dann verloren.

        Normale Nachrichten halten sich an Fokus, "Nicht stören" und Stummschaltung.
        Höchste Priorität: iOS "time-sensitive" (kommt durch Fokus/Nicht stören, sofern
        erlaubt), Android eigener Kanal "Chat – Wichtig" (dort kann man "Nicht stören
        ignorieren" erlauben). Eigenes Tag, damit die nächste normale Push sie nicht ersetzt.
        """
        data = {
            "tag": f"{tag}_prio" if important else tag,
            "group": tag,
            "channel": "Chat – Wichtig" if important else "Chat",
            "importance": "max" if important else "high",
            "priority": "high",
            "notification_icon": "mdi:message-alert" if important else "mdi:message-text",
            "clickAction": link,
            "url": link,
            "push": {"sound": "default", "interruption-level": "time-sensitive" if important else "active"},
        }
        if important:
            data["color"] = "#d32f2f"
        return data

    async def _push_when_unread(self, conv_id: int, msg_id: int, title: str | None) -> None:
        """Push nur an Empfänger, die die Nachricht nicht inzwischen aktiv gelesen haben.

        Ein irgendwo geöffneter Chat (z. B. am PC) unterdrückt die Push-Nachricht nicht mehr:
        "gelesen" meldet die Karte nur, wenn jemand das Gerät tatsächlich benutzt.
        """
        await asyncio.sleep(PUSH_DELAY_SECONDS)
        msg = await self._run(self.store.get_message, msg_id)
        conv = await self._run(self.store.get_conversation, conv_id)
        if msg is None or msg["deleted"] or conv is None:
            return
        # Kurz hintereinander geschriebene Nachrichten ergeben nur eine Push (die der neuesten,
        # mit Anzahl) – das spart das Tageslimit und nervt weniger.
        # Fragen mit Antwortknöpfen werden nie zusammengefasst (Knöpfe in der Push).
        # Wichtige Nachrichten ebenso nicht.
        newer = (
            set() if msg.get("buttons") or msg.get("important")
            else await self._run(self.store.newer_senders, conv_id, msg_id)
        )
        unread = [
            m["user_id"] for m in conv["members"]
            if m["last_read"] < msg_id and not any(s != m["user_id"] for s in newer)
        ]
        await self._push(conv_id, msg, unread, title)

    async def _push(
        self, conv_id: int, msg: dict[str, Any], members: list[str], title: str | None
    ) -> None:
        sender = msg["sender_id"]
        mentions = self.mentioned(members, sender, msg["text"])
        for uid in members:
            if uid == sender or not self.is_allowed(uid):
                continue
            view = await self.async_conversation_view(conv_id, uid, None)
            if view is None:
                continue
            lang = self.lang(uid)
            body = msg["text"] or ""
            if sender == SYSTEM_SENDER and body:
                body = i18n.system_text(body, lang)
            if msg.get("location") and not body:
                body = i18n.text("location", lang)
            att = msg.get("attachment")
            if att:
                kind = i18n.attachment_label(att["mime"], lang)
                body = f"{kind}: {body}" if body else kind
            count = await self._run(self.store.unread_count, conv_id, uid)
            if title:
                head = title
            elif uid in mentions:
                head = i18n.text("mentioned", lang, name=self.user_name(sender))
                if view["is_group"]:
                    head += f" · {view['name']}"
            elif view["is_group"]:
                head = f"{view['name']} · {self.user_name(sender)}"
            else:
                head = self.user_name(sender)
            important = bool(msg.get("important"))
            if count > 1 and not title and not important:
                head += " " + i18n.text("new_count", lang, n=count)
            if important:
                head = f"❗ {head}"
            data = self._push_data(f"ha_chat_{conv_id}", self._dashboard_link(conv_id, uid), important)
            data.update({
                "actions": [
                    {
                        "action": f"{ACTION_REPLY}{conv_id}",
                        "title": i18n.text("reply", lang),
                        "behavior": "textInput",
                        "textInputButtonTitle": i18n.text("send", lang),
                        "textInputPlaceholder": i18n.text("message", lang),
                    },
                    {"action": f"{ACTION_READ}{conv_id}", "title": i18n.text("mark_read", lang)},
                ],
            })
            if msg.get("buttons") and not msg.get("answer"):
                # Antwortknöpfe direkt in der Benachrichtigung (Android zeigt höchstens 3)
                # Knöpfe mit Rückfrage („Sicher?“) nur im Chat – die Push kann nicht nachfragen
                acts = [
                    {"action": f"{ACTION_BUTTON}{msg['id']}_{i}", "title": b["title"]}
                    for i, b in enumerate(msg["buttons"]) if not b.get("confirm")
                ][:3]
                if acts:
                    data["actions"] = acts
            for service in self.notify_services(uid):
                if not important and not self._push_allowed(service, conv_id):
                    continue
                try:
                    await self.hass.services.async_call(
                        "notify", service,
                        {"title": head, "message": body[:500], "data": data},
                        blocking=False,
                    )
                    self._push_sent(service, conv_id)
                except Exception:  # noqa: BLE001
                    _LOGGER.warning("Push an %s fehlgeschlagen", service, exc_info=True)

    async def async_test_push(self, user_id: str) -> dict[str, Any]:
        """Test-Push an alle eigenen Geräte – verzögert, damit man die App vorher schließen kann."""
        devices = self.push_devices(user_id)
        services = [d["service"] for d in devices if d["service"]]
        if services:
            self.hass.async_create_background_task(
                self._send_test_push(services, user_id), f"ha_chat_test_push_{user_id}"
            )
        return {
            "devices": devices, "delay": TEST_PUSH_DELAY, "sent": len(services),
            "link": self._dashboard_link(None, user_id),
        }

    async def _send_test_push(self, services: list[str], user_id: str) -> None:
        await asyncio.sleep(TEST_PUSH_DELAY)
        data = self._push_data("ha_chat_test", self._dashboard_link(None, user_id))
        for service in services:
            try:
                await self.hass.services.async_call(
                    "notify", service,
                    {
                        "title": "HA Chat – Test",
                        "message": i18n.text("test_message", self.lang(user_id)),
                        "data": data,
                    },
                    blocking=False,
                )
                self._push_sent(service, 0)
            except Exception:  # noqa: BLE001
                _LOGGER.warning("Test-Push an %s fehlgeschlagen", service, exc_info=True)

    @callback
    def reachability(self) -> list[dict[str, Any]]:
        """Für Administratoren: Wer ist per Push erreichbar?"""
        return [
            {"user_id": uid, "name": self.user_name(uid), "devices": self.push_devices(uid)}
            for uid in self.allowed
        ]

    async def _clear_push(self, user_id: str, conv_id: int) -> None:
        # Befehle wie clear_notification zählen nicht zum Tageslimit der Push-Zustellung.
        for service in self.notify_services(user_id):
            for tag in (f"ha_chat_{conv_id}", f"ha_chat_{conv_id}_prio"):
                try:
                    await self.hass.services.async_call(
                        "notify", service,
                        {"message": "clear_notification", "data": {"tag": tag}},
                        blocking=False,
                    )
                except Exception:  # noqa: BLE001
                    _LOGGER.debug("clear_notification fehlgeschlagen", exc_info=True)

    async def async_handle_notification_action(self, event: Event) -> None:
        action = str(event.data.get("action", ""))
        if not action.startswith(("HACHAT_",)):
            return
        user_id = event.context.user_id
        if not self.is_allowed(user_id):
            return
        try:
            if action.startswith(ACTION_REPLY):
                conv_id = int(action[len(ACTION_REPLY):])
                text = event.data.get("reply_text") or event.data.get("textInput") or ""
                if text.strip():
                    await self.async_send(user_id, conv_id, text)
            elif action.startswith(ACTION_READ):
                conv_id = int(action[len(ACTION_READ):])
                await self.async_read(user_id, conv_id, None)
            elif action.startswith(ACTION_BUTTON):
                msg_part, idx_part = action[len(ACTION_BUTTON):].split("_", 1)
                await self.async_press(user_id, int(msg_part), int(idx_part))
        except (ValueError, ChatError) as err:
            _LOGGER.warning("Benachrichtigungs-Aktion fehlgeschlagen: %s", err)

    # ------------------------------------------------------------ Speicher (Administratoren)
    def _disk_usage(self) -> dict[str, Any]:
        """Läuft im Executor: Belegung auf der Festplatte."""
        refs = self.store.referenced_paths()
        avatars = {os.path.abspath(p) for p in self.store.avatar_paths()}
        now = time.time()
        out = {
            "db_bytes": 0, "media_bytes": 0, "media_files": 0, "avatar_bytes": 0,
            "orphan_files": 0, "orphan_bytes": 0,
        }
        for path in self.store.db_files():
            if os.path.isfile(path):
                out["db_bytes"] += os.path.getsize(path)
        try:
            entries = list(os.scandir(self.store.media_dir))
        except FileNotFoundError:
            entries = []
        for entry in entries:
            if not entry.is_file():
                continue
            st = entry.stat()
            full = os.path.abspath(entry.path)
            out["media_files"] += 1
            out["media_bytes"] += st.st_size
            if full in avatars:
                out["avatar_bytes"] += st.st_size
            elif full not in refs and now - st.st_mtime > 3600:
                out["orphan_files"] += 1
                out["orphan_bytes"] += st.st_size
        out["total_bytes"] = out["db_bytes"] + out["media_bytes"]
        return out

    def _orphan_paths(self) -> list[str]:
        refs = self.store.referenced_paths()
        now = time.time()
        paths = []
        try:
            entries = list(os.scandir(self.store.media_dir))
        except FileNotFoundError:
            return []
        for entry in entries:
            if (
                entry.is_file() and os.path.abspath(entry.path) not in refs
                and now - entry.stat().st_mtime > 3600  # laufende Uploads nicht anfassen
            ):
                paths.append(entry.path)
        return paths

    async def async_storage(self) -> dict[str, Any]:
        stats = await self._run(self.store.storage_stats)
        convs = []
        for c in stats:
            if c["is_system"] and c.get("owner_id"):
                kind, name = "home", f"{PERSONAL_HOME_NAME} ({self.user_name(c['owner_id'])})"
            elif c["is_system"]:
                kind, name = "home", HOUSE_CONVERSATION_NAME
            elif c["is_group"]:
                kind, name = "group", c["name"] or "Gruppe"
            else:
                kind = "direct"
                name = " & ".join(self.user_name(u) for u in c["members"]) or "Direktchat"
            convs.append({
                "id": c["id"], "name": name, "kind": kind,
                "member_names": [self.user_name(u) for u in c["members"]],
                "messages": c["messages"], "oldest": c["oldest"],
                "attachments": c["attachments"], "attachment_bytes": c["attachment_bytes"],
            })
        convs.sort(key=lambda c: (c["attachment_bytes"], c["messages"]), reverse=True)
        return {
            "conversations": convs,
            "totals": await self._run(self._disk_usage),
            "retention_days": self.retention_days,
        }

    async def async_storage_action(
        self, action: str, conv_id: int | None = None, days: int | None = None
    ) -> dict[str, Any]:
        conv = None
        members: list[str] = []
        if action in ("purge_media", "clear_messages", "delete_conversation"):
            conv = await self._run(self.store.get_conversation, conv_id or 0)
            if conv is None:
                raise ChatError("not_found", "Unterhaltung nicht gefunden")
            members = [m["user_id"] for m in conv["members"]]
        removed_messages = 0
        if action == "purge_media":
            paths = await self._run(self.store.purge_attachments, conv_id)
        elif action == "clear_messages":
            paths = await self._run(self.store.delete_all_messages, conv_id)
        elif action == "delete_conversation":
            if conv["is_system"] and not conv.get("owner_id"):
                raise ChatError("not_allowed", "Der Kanal „Home“ kann nur geleert, nicht gelöscht werden")
            paths = await self._run(self.store.delete_conversation, conv_id)
            self._emit(members, lambda _t: {"event": "conversation_removed", "conversation_id": conv_id})
            members = []
        elif action == "older_than":
            if not days or days < 1:
                raise ChatError("invalid", "Bitte eine Anzahl Tage angeben")
            paths, removed_messages = await self._run(self.store.cleanup_counted, days * 86400)
            members = self.allowed
        elif action == "orphans":
            paths = await self._run(self._orphan_paths)
        else:
            raise ChatError("invalid", "Unbekannte Aktion")
        for p in paths:
            await self._run(_remove_file, p)
        try:
            await self._run(self.store.vacuum)
        except sqlite3.Error:
            _LOGGER.debug("VACUUM nicht möglich", exc_info=True)
        if members:
            # Offene Karten laden Liste und Nachrichten neu
            self._emit(members, lambda _t: {"event": "resync"})
        result = await self.async_storage()
        result["done"] = {"action": action, "files": len(paths), "messages": removed_messages}
        return result

    # ------------------------------------------------------------ Bereinigung
    async def async_cleanup(self, *_: Any) -> None:
        paths = await self._run(self.store.cleanup, self.retention_days * 86400)
        for p in paths:
            await self._run(_remove_file, p)
        if paths:
            _LOGGER.info("HA Chat: %d alte Dateien entfernt", len(paths))


def _image_ext(data: bytes) -> str:
    """Prüft ein Profil-/Gruppenbild und liefert die Dateiendung."""
    if len(data) > MAX_AVATAR_BYTES:
        raise ChatError("invalid", "Bild zu groß (max. 512 KB)")
    if data[:3] == b"\xff\xd8\xff":
        return ".jpg"
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return ".png"
    raise ChatError("invalid", "Nur JPEG- oder PNG-Bilder sind erlaubt")




def _write_file(path: str, data: bytes) -> None:
    with open(path, "wb") as fh:
        fh.write(data)


def _read_file(path: str) -> bytes:
    with open(path, "rb") as fh:
        return fh.read()


def _remove_file(path: str) -> None:
    try:
        os.remove(path)
    except FileNotFoundError:
        pass


def _copy_file(src: str, dst: str) -> None:
    shutil.copyfile(src, dst)


def _clean_location(loc: dict[str, Any]) -> dict[str, Any]:
    """Prüft und begrenzt Standortdaten aus der Karte."""
    try:
        lat = float(loc["lat"])
        lon = float(loc["lon"])
    except (KeyError, TypeError, ValueError) as err:
        raise ChatError("invalid", "Ungültiger Standort") from err
    if not (-90 <= lat <= 90 and -180 <= lon <= 180) or (lat == 0 and lon == 0):
        raise ChatError("invalid", "Ungültiger Standort")
    acc = loc.get("acc")
    acc = round(float(acc)) if isinstance(acc, (int, float)) and acc >= 0 else None
    ts = loc.get("ts")
    ts = float(ts) if isinstance(ts, (int, float)) else time.time()
    source = loc.get("source") if loc.get("source") in ("gps", "app", "app_old") else "app"
    return {"lat": round(lat, 6), "lon": round(lon, 6), "acc": acc, "ts": ts, "source": source}
