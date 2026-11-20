"""HTTP-Endpunkte für Datei-Upload und Medien-Abruf."""
from __future__ import annotations

import os
from urllib.parse import quote

from aiohttp import web

from homeassistant.components.http import HomeAssistantView

from .const import DOMAIN, MAX_UPLOAD_BYTES

# Nur diese Typen werden im Browser direkt angezeigt; alles andere (z. B. SVG, HTML, PDF)
# wird als Download ausgeliefert, damit hochgeladene Dateien keinen Code im
# Home-Assistant-Kontext ausführen können.
INLINE_TYPES = {
    "image/jpeg", "image/png", "image/gif", "image/webp", "image/avif", "image/heic", "image/heif", "image/bmp",
    "video/mp4", "video/webm", "video/quicktime", "video/ogg", "video/3gpp",
    "audio/mpeg", "audio/mp4", "audio/aac", "audio/ogg", "audio/webm", "audio/wav", "audio/x-wav",
    "audio/x-m4a", "audio/m4a", "audio/flac", "audio/3gpp", "audio/amr",
}

try:
    from homeassistant.helpers.http import KEY_HASS_USER
except ImportError:  # ältere Versionen
    KEY_HASS_USER = "hass_user"


def _user(request: web.Request):
    return request.get(KEY_HASS_USER)


class _BaseView(HomeAssistantView):
    def __init__(self, hass) -> None:
        self.hass = hass

    def _manager(self):
        return self.hass.data.get(DOMAIN, {}).get("manager")


class ChatUploadView(_BaseView):
    """Nimmt Dateien (Bilder, Videos, Dokumente) entgegen."""

    url = "/api/ha_chat/upload"
    name = "api:ha_chat:upload"
    requires_auth = True

    async def post(self, request: web.Request) -> web.Response:
        hass = self.hass
        manager = self._manager()
        user = _user(request)
        if manager is None or user is None or not manager.is_allowed(user.id):
            return self.json_message("Kein Zugriff", 403)

        reader = await request.multipart()
        conv_id: int | None = None
        result = None
        while True:
            part = await reader.next()
            if part is None:
                break
            if part.name == "conversation_id":
                try:
                    conv_id = int(await part.text())
                except ValueError:
                    return self.json_message("Ungültige Unterhaltung", 400)
                if conv_id <= 0 or not await hass.async_add_executor_job(manager.store.is_member, conv_id, user.id):
                    return self.json_message("Kein Mitglied", 403)
            elif part.name == "file":
                if conv_id is None:
                    return self.json_message("conversation_id muss vor der Datei kommen", 400)
                filename = part.filename or "datei"
                att_id, path = manager.new_attachment_path(filename)
                size = 0
                fh = await hass.async_add_executor_job(open, path, "wb")
                try:
                    while True:
                        chunk = await part.read_chunk(256 * 1024)
                        if not chunk:
                            break
                        size += len(chunk)
                        if size > MAX_UPLOAD_BYTES:
                            await hass.async_add_executor_job(fh.close)
                            await hass.async_add_executor_job(os.remove, path)
                            return self.json_message("Datei zu groß (max. 100 MB)", 413)
                        await hass.async_add_executor_job(fh.write, chunk)
                finally:
                    if not fh.closed:
                        await hass.async_add_executor_job(fh.close)
                result = await manager.async_register_attachment(
                    user.id, conv_id, att_id, filename,
                    (part.headers.get("Content-Type") or "").split(";")[0].strip().lower() or None, size, path,
                )
        if result is None:
            return self.json_message("Keine Datei erhalten", 400)
        return self.json(result)


class ChatMediaView(_BaseView):
    """Liefert Anhänge nur an Mitglieder der jeweiligen Unterhaltung aus."""

    url = "/api/ha_chat/media/{att_id}"
    name = "api:ha_chat:media"
    requires_auth = True

    async def get(self, request: web.Request, att_id: str) -> web.StreamResponse:
        manager = self._manager()
        user = _user(request)
        if manager is None or user is None or not manager.is_allowed(user.id):
            return web.Response(status=403)
        att = await manager.async_media_for(user.id, att_id)
        if att is None or not await self.hass.async_add_executor_job(os.path.isfile, att["path"]):
            return web.Response(status=404)
        mime = (att["mime"] or "").split(";")[0].strip().lower()
        inline = mime in INLINE_TYPES
        safe = quote(att["filename"])
        return web.FileResponse(
            att["path"],
            headers={
                "Content-Type": mime if inline else "application/octet-stream",
                "Content-Disposition": f"{'inline' if inline else 'attachment'}; filename*=UTF-8''{safe}",
                "Cache-Control": "private, max-age=86400",
                "X-Content-Type-Options": "nosniff",
                "Content-Security-Policy": "default-src 'none'; sandbox",
            },
        )


class ChatAvatarView(_BaseView):
    """Liefert Profilbilder nur an berechtigte Chat-Benutzer aus."""

    url = "/api/ha_chat/avatar/{user_id}"
    name = "api:ha_chat:avatar"
    requires_auth = True

    async def get(self, request: web.Request, user_id: str) -> web.StreamResponse:
        manager = self._manager()
        user = _user(request)
        if manager is None or user is None or not manager.is_allowed(user.id):
            return web.Response(status=403)
        path = manager.avatar_path(user_id)
        if not path or not await self.hass.async_add_executor_job(os.path.isfile, path):
            return web.Response(status=404)
        return web.FileResponse(
            path,
            headers={
                "Content-Type": "image/png" if path.endswith(".png") else "image/jpeg",
                "Cache-Control": "private, max-age=604800",
                "X-Content-Type-Options": "nosniff",
                "Content-Security-Policy": "default-src 'none'; sandbox",
            },
        )


class ChatGroupAvatarView(_BaseView):
    """Liefert Gruppenbilder nur an Mitglieder der Gruppe aus."""

    url = "/api/ha_chat/group_avatar/{conv_id}"
    name = "api:ha_chat:group_avatar"
    requires_auth = True

    async def get(self, request: web.Request, conv_id: str) -> web.StreamResponse:
        manager = self._manager()
        user = _user(request)
        if manager is None or user is None or not manager.is_allowed(user.id):
            return web.Response(status=403)
        try:
            cid = int(conv_id)
        except ValueError:
            return web.Response(status=404)
        path = await manager.async_group_avatar_for(user.id, cid)
        if not path or not await self.hass.async_add_executor_job(os.path.isfile, path):
            return web.Response(status=404)
        return web.FileResponse(
            path,
            headers={
                "Content-Type": "image/png" if path.endswith(".png") else "image/jpeg",
                "Cache-Control": "private, max-age=604800",
                "X-Content-Type-Options": "nosniff",
                "Content-Security-Policy": "default-src 'none'; sandbox",
            },
        )
