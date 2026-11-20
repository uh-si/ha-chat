"""HA Chat – privater Messenger in Home Assistant."""
from __future__ import annotations

import logging
import os
from datetime import timedelta

import voluptuous as vol

from homeassistant.components import frontend
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, ServiceCall, ServiceResponse, SupportsResponse
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.event import async_track_time_interval

from .const import (
    CARD_URL,
    DB_FILE,
    DOMAIN,
    STATIC_URL,
    STORAGE_DIR,
    SYSTEM_SENDER,
    VERSION,
)
from .http import ChatAvatarView, ChatGroupAvatarView, ChatMediaView, ChatUploadView
from .manager import ChatError, ChatManager
from .store import ChatStore
from .websocket import async_register as async_register_ws

_LOGGER = logging.getLogger(__name__)

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)

SERVICE_SEND = "send_message"
SEND_SCHEMA = vol.Schema({
    vol.Optional("message", default=""): cv.string,
    vol.Optional("conversation"): cv.string,
    vol.Optional("user"): cv.string,
    vol.Optional("title"): cv.string,
    vol.Optional("file"): cv.string,
    vol.Optional("buttons"): vol.All(
        cv.ensure_list,
        [vol.Any(
            cv.string,
            {
                vol.Required("title"): cv.string,
                vol.Optional("action"): cv.string,
                vol.Optional("confirm"): cv.string,
            },
        )],
        vol.Length(max=6),
    ),
    vol.Optional("important", default=False): cv.boolean,
})


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Einmalige Registrierung von Endpunkten, Karte und Dienst."""
    hass.data.setdefault(DOMAIN, {})

    hass.http.register_view(ChatUploadView(hass))
    hass.http.register_view(ChatMediaView(hass))
    hass.http.register_view(ChatAvatarView(hass))
    hass.http.register_view(ChatGroupAvatarView(hass))
    await hass.http.async_register_static_paths([
        StaticPathConfig(STATIC_URL, os.path.join(os.path.dirname(__file__), "frontend"), False)
    ])
    frontend.add_extra_js_url(hass, f"{CARD_URL}?v={VERSION}")
    async_register_ws(hass)

    async def handle_send(call: ServiceCall) -> ServiceResponse:
        manager: ChatManager | None = hass.data[DOMAIN].get("manager")
        if manager is None:
            raise ServiceValidationError("HA Chat ist nicht eingerichtet")
        target = call.data.get("conversation")
        user = call.data.get("user")
        conv_id = None
        if user and target:
            raise ServiceValidationError("Bitte entweder „conversation“ oder „user“ angeben, nicht beides")
        if user:
            try:
                conv_id = await manager.async_personal_home(manager.resolve_user(user))
            except ChatError as err:
                raise ServiceValidationError(err.message) from err
        elif not target:
            conv_id = await hass.async_add_executor_job(manager.store.find_system)
        elif target.isdigit():
            conv_id = int(target)
        else:
            conv_id = await hass.async_add_executor_job(manager.store.find_by_name, target)
        if conv_id is None:
            raise ServiceValidationError(f"Unterhaltung '{target}' nicht gefunden")
        try:
            attachment_id = None
            if call.data.get("file"):
                attachment_id = await manager.async_attach_file(conv_id, call.data["file"])
            buttons = [
                b if isinstance(b, dict) else {"title": b} for b in call.data.get("buttons", [])
            ]
            msg_id = await manager.async_send(
                SYSTEM_SENDER, conv_id, call.data.get("message", ""),
                attachment_id=attachment_id,
                buttons=buttons or None,
                push_title=call.data.get("title"),
                important=call.data.get("important", False),
            )
        except ChatError as err:
            raise ServiceValidationError(err.message) from err
        return {"message_id": msg_id, "conversation_id": conv_id}

    hass.services.async_register(
        DOMAIN, SERVICE_SEND, handle_send, schema=SEND_SCHEMA,
        supports_response=SupportsResponse.OPTIONAL,
    )
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    store = ChatStore(hass.config.path(STORAGE_DIR))
    await hass.async_add_executor_job(store.open, DB_FILE)
    manager = ChatManager(hass, store, dict(entry.options))
    await manager.async_load_users()
    await manager.async_load_avatars()
    await manager.async_load_settings()
    await manager.async_ensure_house()
    hass.data[DOMAIN]["manager"] = manager
    hass.data[DOMAIN]["store"] = store

    async def _on_action(event) -> None:
        await manager.async_handle_notification_action(event)

    async def _on_user_change(event) -> None:
        await manager.async_load_users()

    entry.async_on_unload(hass.bus.async_listen("mobile_app_notification_action", _on_action))
    for ev in ("user_added", "user_updated", "user_removed"):
        entry.async_on_unload(hass.bus.async_listen(ev, _on_user_change))
    entry.async_on_unload(
        async_track_time_interval(hass, manager.async_cleanup, timedelta(hours=6))
    )
    entry.async_on_unload(entry.add_update_listener(_async_reload))
    entry.async_create_background_task(hass, manager.async_cleanup(), "ha_chat_cleanup")
    _LOGGER.info("HA Chat %s gestartet, %d berechtigte Benutzer", VERSION, len(manager.allowed))
    return True


async def _async_reload(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Optionen ohne Neustart übernehmen (offene Karten bleiben verbunden)."""
    manager: ChatManager | None = hass.data.get(DOMAIN, {}).get("manager")
    if manager is None:
        return
    manager.options = dict(entry.options)
    await manager.async_load_users()
    await manager.async_ensure_house()
    manager.emit_users_changed()


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    data = hass.data.get(DOMAIN, {})
    manager: ChatManager | None = data.pop("manager", None)
    if manager:
        await manager.async_shutdown()
    store: ChatStore | None = data.pop("store", None)
    if store:
        await hass.async_add_executor_job(store.close)
    return True
