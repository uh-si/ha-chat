"""Einrichtung und Optionen für HA Chat."""
from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.config_entries import ConfigEntry, ConfigFlow, ConfigFlowResult, OptionsFlow
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import selector

from .const import (
    CONF_DASHBOARD_PATH,
    CONF_EVENTS,
    CONF_PUSH,
    CONF_RETENTION_DAYS,
    CONF_USERS,
    DEFAULT_DASHBOARD_PATH,
    DEFAULT_RETENTION_DAYS,
    DOMAIN,
)


async def _schema(hass: HomeAssistant, current: dict[str, Any]) -> vol.Schema:
    users = [
        selector.SelectOptionDict(value=u.id, label=u.name or u.id)
        for u in await hass.auth.async_get_users()
        if not u.system_generated and u.is_active
    ]
    valid_ids = {o["value"] for o in users}
    default_users = [u for u in current.get(CONF_USERS, []) if u in valid_ids] or list(valid_ids)
    return vol.Schema({
        vol.Required(CONF_USERS, default=default_users): selector.SelectSelector(
            selector.SelectSelectorConfig(
                options=users, multiple=True, mode=selector.SelectSelectorMode.LIST
            )
        ),
        vol.Required(
            CONF_RETENTION_DAYS, default=current.get(CONF_RETENTION_DAYS, DEFAULT_RETENTION_DAYS)
        ): selector.NumberSelector(
            selector.NumberSelectorConfig(
                min=7, max=3650, step=1, mode=selector.NumberSelectorMode.BOX,
                unit_of_measurement="Tage",
            )
        ),
        vol.Required(CONF_PUSH, default=current.get(CONF_PUSH, True)): selector.BooleanSelector(),
        vol.Required(CONF_EVENTS, default=current.get(CONF_EVENTS, True)): selector.BooleanSelector(),
        vol.Required(
            CONF_DASHBOARD_PATH, default=current.get(CONF_DASHBOARD_PATH, DEFAULT_DASHBOARD_PATH)
        ): selector.TextSelector(),
    })


def _clean(user_input: dict[str, Any]) -> dict[str, Any]:
    data = dict(user_input)
    data[CONF_RETENTION_DAYS] = int(data.get(CONF_RETENTION_DAYS, DEFAULT_RETENTION_DAYS))
    path = str(data.get(CONF_DASHBOARD_PATH) or DEFAULT_DASHBOARD_PATH).strip()
    if not path.startswith("/"):
        path = "/" + path
    data[CONF_DASHBOARD_PATH] = path
    data[CONF_USERS] = list(dict.fromkeys(data.get(CONF_USERS, [])))
    return data


class HaChatConfigFlow(ConfigFlow, domain=DOMAIN):
    """Config-Flow."""

    VERSION = 1

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        if self._async_current_entries():
            return self.async_abort(reason="single_instance_allowed")
        errors = {}
        if user_input is not None:
            if not user_input.get(CONF_USERS):
                errors["base"] = "no_users"
            else:
                return self.async_create_entry(title="HA Chat", data={}, options=_clean(user_input))
        return self.async_show_form(
            step_id="user", data_schema=await _schema(self.hass, user_input or {}), errors=errors
        )

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> OptionsFlow:
        return HaChatOptionsFlow()


class HaChatOptionsFlow(OptionsFlow):
    """Optionen: berechtigte Benutzer, Aufbewahrung, Push."""

    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        errors = {}
        if user_input is not None:
            if not user_input.get(CONF_USERS):
                errors["base"] = "no_users"
            else:
                return self.async_create_entry(data=_clean(user_input))
        return self.async_show_form(
            step_id="init",
            data_schema=await _schema(self.hass, dict(self.config_entry.options)),
            errors=errors,
        )
