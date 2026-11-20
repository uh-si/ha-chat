"""Konstanten für HA Chat."""

DOMAIN = "ha_chat"
VERSION = "1.9.0"

CONF_USERS = "users"
CONF_RETENTION_DAYS = "retention_days"
CONF_PUSH = "push_enabled"
CONF_DASHBOARD_PATH = "dashboard_path"
CONF_EVENTS = "fire_events"

EVENT_MESSAGE = "ha_chat_message"
EVENT_BUTTON = "ha_chat_button"
MAX_BUTTONS = 6

DEFAULT_RETENTION_DAYS = 90
DEFAULT_DASHBOARD_PATH = "/lovelace"

STORAGE_DIR = "ha_chat"
DB_FILE = "chat.db"
MEDIA_DIR = "media"

MAX_UPLOAD_BYTES = 100 * 1024 * 1024
MAX_TEXT_LENGTH = 4000
MAX_AVATAR_BYTES = 512 * 1024
MAX_DESCRIPTION = 500

SYSTEM_SENDER = "__system__"
SYSTEM_SENDER_NAME = "Home"
HOUSE_CONVERSATION_NAME = "Home"
# Persönlicher Kanal: Meldungen von Home nur für einen Benutzer (Dienst-Feld „user“)
PERSONAL_HOME_NAME = "Home – Messages"

CARD_URL = "/ha_chat_static/ha-chat-card.js"
STATIC_URL = "/ha_chat_static"

ACTION_REPLY = "HACHAT_REPLY_"
ACTION_READ = "HACHAT_READ_"
ACTION_BUTTON = "HACHAT_BTN_"

REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"]
