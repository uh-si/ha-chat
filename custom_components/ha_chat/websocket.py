"""WebSocket-API der Chat-Karte."""
from __future__ import annotations

from functools import wraps
from typing import Any

import base64
import binascii

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback

from .const import DOMAIN, MAX_DESCRIPTION, REACTIONS, VERSION
from . import i18n
from .manager import ChatError, ChatManager


def _manager(hass: HomeAssistant) -> ChatManager | None:
    return hass.data.get(DOMAIN, {}).get("manager")


def _guarded(func):
    """Prüft Berechtigung und wandelt ChatError in WS-Fehler um."""

    @wraps(func)
    async def wrapper(hass: HomeAssistant, connection, msg: dict[str, Any]) -> None:
        manager = _manager(hass)
        if manager is None:
            connection.send_error(
                msg["id"], "not_loaded", i18n.error("HA Chat ist nicht eingerichtet", hass.config.language)
            )
            return
        lang = manager.lang(connection.user.id)
        if not manager.is_allowed(connection.user.id):
            connection.send_error(msg["id"], "not_allowed", i18n.error("Kein Zugriff auf den Chat", lang))
            return
        try:
            await func(hass, connection, msg, manager)
        except ChatError as err:
            connection.send_error(msg["id"], err.code, i18n.error(err.message, lang))

    return wrapper


def _admin_only(func):
    """Nur für Administratoren (Speicher-Übersicht, Geräte-Übersicht)."""

    @wraps(func)
    async def wrapper(hass: HomeAssistant, connection, msg: dict[str, Any], manager) -> None:
        if not connection.user.is_admin:
            connection.send_error(
                msg["id"], "unauthorized", i18n.error("Nur für Administratoren", manager.lang(connection.user.id))
            )
            return
        await func(hass, connection, msg, manager)

    return wrapper


def _decode_image(raw: str) -> bytes | None:
    if raw.startswith("data:"):
        raw = raw.split(",", 1)[-1]
    try:
        return base64.b64decode(raw, validate=True)
    except (binascii.Error, ValueError):
        return None


@callback
def async_register(hass: HomeAssistant) -> None:
    for handler in (
        ws_info, ws_conversations, ws_messages, ws_create, ws_update_group, ws_leave,
        ws_delete_conversation, ws_send, ws_edit, ws_delete, ws_react, ws_read,
        ws_typing, ws_focus, ws_subscribe, ws_set_avatar, ws_remove_avatar, ws_search,
        ws_forward, ws_press, ws_read_info, ws_media, ws_locate,
        ws_set_group_avatar, ws_remove_group_avatar, ws_hide, ws_clear_history,
        ws_set_presence, ws_storage, ws_storage_action, ws_devices, ws_test_push,
        ws_view_path,
        ws_set_language,
    ):
        websocket_api.async_register_command(hass, handler)


@websocket_api.websocket_command({vol.Required("type"): "ha_chat/info"})
@websocket_api.async_response
async def ws_info(hass, connection, msg):
    manager = _manager(hass)
    allowed = bool(manager and manager.is_allowed(connection.user.id))
    result = {"version": VERSION, "allowed": allowed, "me": connection.user.id}
    if allowed:
        uid = connection.user.id
        result["users"] = manager.users_view(connection.refresh_token_id)
        result["reactions"] = REACTIONS
        result["is_admin"] = bool(connection.user.is_admin)
        result["show_presence"] = manager.show_presence(uid)
        result["presence"] = manager.presence_view(uid)
    connection.send_result(msg["id"], result)


@websocket_api.websocket_command({vol.Required("type"): "ha_chat/conversations"})
@websocket_api.async_response
@_guarded
async def ws_conversations(hass, connection, msg, manager):
    connection.send_result(
        msg["id"], await manager.async_list(connection.user.id, connection.refresh_token_id)
    )


@websocket_api.websocket_command({
    vol.Required("type"): "ha_chat/messages",
    vol.Required("conversation_id"): int,
    vol.Optional("before"): vol.Any(int, None),
    vol.Optional("after"): vol.Any(int, None),
    vol.Optional("around"): vol.Any(int, None),
    vol.Optional("limit", default=50): int,
})
@websocket_api.async_response
@_guarded
async def ws_messages(hass, connection, msg, manager):
    connection.send_result(msg["id"], await manager.async_messages(
        connection.user.id, msg["conversation_id"], msg.get("before"), msg["limit"],
        connection.refresh_token_id, after=msg.get("after"), around=msg.get("around"),
    ))


@websocket_api.websocket_command({
    vol.Required("type"): "ha_chat/search",
    vol.Required("query"): vol.All(str, vol.Length(max=100)),
    vol.Optional("conversation_id"): vol.Any(int, None),
    vol.Optional("limit", default=50): int,
})
@websocket_api.async_response
@_guarded
async def ws_search(hass, connection, msg, manager):
    connection.send_result(msg["id"], await manager.async_search(
        connection.user.id, msg["query"], msg.get("conversation_id"), msg["limit"],
        connection.refresh_token_id,
    ))


@websocket_api.websocket_command({
    vol.Required("type"): "ha_chat/create",
    vol.Required("members"): [str],
    vol.Optional("name"): vol.Any(str, None),
})
@websocket_api.async_response
@_guarded
async def ws_create(hass, connection, msg, manager):
    conv_id = await manager.async_create(connection.user.id, msg["members"], msg.get("name"))
    connection.send_result(msg["id"], {"conversation_id": conv_id})


@websocket_api.websocket_command({
    vol.Required("type"): "ha_chat/update_group",
    vol.Required("conversation_id"): int,
    vol.Optional("name"): vol.Any(str, None),
    vol.Optional("description"): vol.Any(vol.All(str, vol.Length(max=MAX_DESCRIPTION * 2)), None),
    vol.Optional("add", default=[]): [str],
    vol.Optional("remove", default=[]): [str],
})
@websocket_api.async_response
@_guarded
async def ws_update_group(hass, connection, msg, manager):
    await manager.async_update_group(
        connection.user.id, msg["conversation_id"], msg.get("name"), msg["add"], msg["remove"],
        description=msg.get("description"),
    )
    connection.send_result(msg["id"])


@websocket_api.websocket_command({
    vol.Required("type"): "ha_chat/leave",
    vol.Required("conversation_id"): int,
})
@websocket_api.async_response
@_guarded
async def ws_leave(hass, connection, msg, manager):
    await manager.async_leave(connection.user.id, msg["conversation_id"])
    connection.send_result(msg["id"])


@websocket_api.websocket_command({
    vol.Required("type"): "ha_chat/delete_conversation",
    vol.Required("conversation_id"): int,
})
@websocket_api.async_response
@_guarded
async def ws_delete_conversation(hass, connection, msg, manager):
    await manager.async_delete_conversation(connection.user.id, msg["conversation_id"])
    connection.send_result(msg["id"])


@websocket_api.websocket_command({
    vol.Required("type"): "ha_chat/send",
    vol.Required("conversation_id"): int,
    vol.Optional("text", default=""): str,
    vol.Optional("reply_to"): vol.Any(int, None),
    vol.Optional("attachment_id"): vol.Any(str, None),
    vol.Optional("location"): vol.Any(dict, None),
    vol.Optional("important", default=False): bool,
})
@websocket_api.async_response
@_guarded
async def ws_send(hass, connection, msg, manager):
    msg_id = await manager.async_send(
        connection.user.id, msg["conversation_id"], msg["text"], msg.get("reply_to"),
        msg.get("attachment_id"), location=msg.get("location"), important=msg["important"],
    )
    connection.send_result(msg["id"], {"message_id": msg_id})


@websocket_api.websocket_command({
    vol.Required("type"): "ha_chat/edit",
    vol.Required("message_id"): int,
    vol.Required("text"): str,
})
@websocket_api.async_response
@_guarded
async def ws_edit(hass, connection, msg, manager):
    await manager.async_edit(connection.user.id, msg["message_id"], msg["text"])
    connection.send_result(msg["id"])


@websocket_api.websocket_command({
    vol.Required("type"): "ha_chat/delete",
    vol.Required("message_id"): int,
})
@websocket_api.async_response
@_guarded
async def ws_delete(hass, connection, msg, manager):
    await manager.async_delete(connection.user.id, msg["message_id"])
    connection.send_result(msg["id"])


@websocket_api.websocket_command({
    vol.Required("type"): "ha_chat/react",
    vol.Required("message_id"): int,
    vol.Required("emoji"): str,
})
@websocket_api.async_response
@_guarded
async def ws_react(hass, connection, msg, manager):
    await manager.async_react(connection.user.id, msg["message_id"], msg["emoji"])
    connection.send_result(msg["id"])


@websocket_api.websocket_command({
    vol.Required("type"): "ha_chat/read",
    vol.Required("conversation_id"): int,
    vol.Optional("message_id"): vol.Any(int, None),
})
@websocket_api.async_response
@_guarded
async def ws_read(hass, connection, msg, manager):
    await manager.async_read(connection.user.id, msg["conversation_id"], msg.get("message_id"))
    connection.send_result(msg["id"])


@websocket_api.websocket_command({
    vol.Required("type"): "ha_chat/typing",
    vol.Required("conversation_id"): int,
})
@websocket_api.async_response
@_guarded
async def ws_typing(hass, connection, msg, manager):
    await manager.async_typing(connection.user.id, msg["conversation_id"])
    connection.send_result(msg["id"])


@websocket_api.websocket_command({
    vol.Required("type"): "ha_chat/focus",
    vol.Optional("conversation_id"): vol.Any(int, None),
    vol.Optional("active"): bool,
})
@websocket_api.async_response
@_guarded
async def ws_focus(hass, connection, msg, manager):
    """Welcher Chat offen ist und ob die Karte gerade benutzt wird (für "online")."""
    manager.set_focus(connection, msg.get("conversation_id"), msg.get("active"))
    connection.send_result(msg["id"])


@websocket_api.websocket_command({vol.Required("type"): "ha_chat/subscribe"})
@websocket_api.async_response
@_guarded
async def ws_subscribe(hass, connection, msg, manager):
    connection.subscriptions[msg["id"]] = manager.subscribe(connection.user.id, connection, msg["id"])
    connection.send_result(msg["id"])


@websocket_api.websocket_command({
    vol.Required("type"): "ha_chat/set_avatar",
    vol.Required("image"): vol.All(str, vol.Length(max=800_000)),
})
@websocket_api.async_response
@_guarded
async def ws_set_avatar(hass, connection, msg, manager):
    """Eigenes Profilbild setzen (Base64, von der Karte auf 256x256 JPEG verkleinert)."""
    data = _decode_image(msg["image"])
    if data is None:
        connection.send_error(msg["id"], "invalid", i18n.error("Ungültige Bilddaten", manager.lang(connection.user.id)))
        return
    await manager.async_set_avatar(connection.user.id, data)
    connection.send_result(msg["id"])


@websocket_api.websocket_command({vol.Required("type"): "ha_chat/remove_avatar"})
@websocket_api.async_response
@_guarded
async def ws_remove_avatar(hass, connection, msg, manager):
    await manager.async_remove_avatar(connection.user.id)
    connection.send_result(msg["id"])


@websocket_api.websocket_command({
    vol.Required("type"): "ha_chat/forward",
    vol.Required("message_id"): int,
    vol.Required("conversation_ids"): vol.All([int], vol.Length(min=1, max=10)),
})
@websocket_api.async_response
@_guarded
async def ws_forward(hass, connection, msg, manager):
    count = await manager.async_forward(connection.user.id, msg["message_id"], msg["conversation_ids"])
    connection.send_result(msg["id"], {"count": count})


@websocket_api.websocket_command({
    vol.Required("type"): "ha_chat/press",
    vol.Required("message_id"): int,
    vol.Required("index"): int,
})
@websocket_api.async_response
@_guarded
async def ws_press(hass, connection, msg, manager):
    await manager.async_press(connection.user.id, msg["message_id"], msg["index"])
    connection.send_result(msg["id"])


@websocket_api.websocket_command({
    vol.Required("type"): "ha_chat/read_info",
    vol.Required("message_id"): int,
})
@websocket_api.async_response
@_guarded
async def ws_read_info(hass, connection, msg, manager):
    connection.send_result(msg["id"], await manager.async_read_info(connection.user.id, msg["message_id"]))


@websocket_api.websocket_command({
    vol.Required("type"): "ha_chat/media",
    vol.Required("conversation_id"): int,
    vol.Required("kind"): vol.In(["media", "files", "links"]),
    vol.Optional("before"): vol.Any(int, None),
    vol.Optional("limit", default=60): int,
})
@websocket_api.async_response
@_guarded
async def ws_media(hass, connection, msg, manager):
    connection.send_result(msg["id"], await manager.async_media(
        connection.user.id, msg["conversation_id"], msg["kind"], msg.get("before"), msg["limit"],
        connection.refresh_token_id,
    ))


@websocket_api.websocket_command({
    vol.Required("type"): "ha_chat/locate",
    vol.Optional("refresh", default=True): bool,
})
@websocket_api.async_response
@_guarded
async def ws_locate(hass, connection, msg, manager):
    """Eigenen Standort aus der Companion App ermitteln (nur der eigene, nie der anderer)."""
    connection.send_result(msg["id"], await manager.async_locate(connection.user.id, msg["refresh"]))


@websocket_api.websocket_command({
    vol.Required("type"): "ha_chat/set_group_avatar",
    vol.Required("conversation_id"): int,
    vol.Required("image"): vol.All(str, vol.Length(max=800_000)),
})
@websocket_api.async_response
@_guarded
async def ws_set_group_avatar(hass, connection, msg, manager):
    data = _decode_image(msg["image"])
    if data is None:
        connection.send_error(msg["id"], "invalid", i18n.error("Ungültige Bilddaten", manager.lang(connection.user.id)))
        return
    await manager.async_set_group_avatar(connection.user.id, msg["conversation_id"], data)
    connection.send_result(msg["id"])


@websocket_api.websocket_command({
    vol.Required("type"): "ha_chat/remove_group_avatar",
    vol.Required("conversation_id"): int,
})
@websocket_api.async_response
@_guarded
async def ws_remove_group_avatar(hass, connection, msg, manager):
    await manager.async_remove_group_avatar(connection.user.id, msg["conversation_id"])
    connection.send_result(msg["id"])


@websocket_api.websocket_command({
    vol.Required("type"): "ha_chat/hide",
    vol.Required("message_id"): int,
})
@websocket_api.async_response
@_guarded
async def ws_hide(hass, connection, msg, manager):
    """Nachricht nur für mich löschen."""
    await manager.async_hide(connection.user.id, msg["message_id"])
    connection.send_result(msg["id"])


@websocket_api.websocket_command({
    vol.Required("type"): "ha_chat/clear_history",
    vol.Required("conversation_id"): int,
})
@websocket_api.async_response
@_guarded
async def ws_clear_history(hass, connection, msg, manager):
    """Verlauf eines Chats nur für mich leeren."""
    await manager.async_clear_history(connection.user.id, msg["conversation_id"])
    connection.send_result(msg["id"])


@websocket_api.websocket_command({
    vol.Required("type"): "ha_chat/set_presence",
    vol.Required("show"): bool,
})
@websocket_api.async_response
@_guarded
async def ws_set_presence(hass, connection, msg, manager):
    """Eigenen Online-Status anzeigen oder verbergen."""
    await manager.async_set_presence_visibility(connection.user.id, msg["show"])
    connection.send_result(msg["id"])


@websocket_api.websocket_command({vol.Required("type"): "ha_chat/storage"})
@websocket_api.async_response
@_guarded
@_admin_only
async def ws_storage(hass, connection, msg, manager):
    connection.send_result(msg["id"], await manager.async_storage())


@websocket_api.websocket_command({
    vol.Required("type"): "ha_chat/storage_action",
    vol.Required("action"): vol.In(
        ["purge_media", "clear_messages", "delete_conversation", "older_than", "orphans"]
    ),
    vol.Optional("conversation_id"): vol.Any(int, None),
    vol.Optional("days"): vol.Any(vol.All(int, vol.Range(min=1, max=3650)), None),
})
@websocket_api.async_response
@_guarded
@_admin_only
async def ws_storage_action(hass, connection, msg, manager):
    connection.send_result(msg["id"], await manager.async_storage_action(
        msg["action"], msg.get("conversation_id"), msg.get("days"),
    ))


@websocket_api.websocket_command({vol.Required("type"): "ha_chat/devices"})
@websocket_api.async_response
@_guarded
@_admin_only
async def ws_devices(hass, connection, msg, manager):
    """Für Administratoren: Push-Erreichbarkeit aller Chat-Benutzer."""
    connection.send_result(msg["id"], manager.reachability())


@websocket_api.websocket_command({vol.Required("type"): "ha_chat/test_push"})
@websocket_api.async_response
@_guarded
async def ws_test_push(hass, connection, msg, manager):
    """Test-Push an die eigenen Geräte (nach kurzer Verzögerung)."""
    connection.send_result(msg["id"], await manager.async_test_push(connection.user.id))


@websocket_api.websocket_command({
    vol.Required("type"): "ha_chat/set_language",
    vol.Required("language"): vol.All(str, vol.Length(max=20)),
})
@websocket_api.async_response
@_guarded
async def ws_set_language(hass, connection, msg, manager):
    """Die Karte meldet die Sprache des Benutzers (für Push-Mitteilungen und Fehlermeldungen)."""
    lang = await manager.async_set_language(connection.user.id, msg["language"])
    connection.send_result(msg["id"], {"language": lang})


@websocket_api.websocket_command({
    vol.Required("type"): "ha_chat/view_path",
    vol.Required("path"): vol.All(str, vol.Length(max=500)),
    vol.Optional("kind", default="card"): vol.In(["card", "compact"]),
})
@websocket_api.async_response
@_guarded
async def ws_view_path(hass, connection, msg, manager):
    """Die Karte meldet ihr Dashboard – Ziel für den Sprung aus der Push."""
    ok = await manager.async_set_view_path(connection.user.id, msg["kind"], msg["path"])
    connection.send_result(msg["id"], {"stored": ok})
