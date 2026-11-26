"""Sprache der Texte, die der Server erzeugt: Push-Mitteilungen und Fehlermeldungen.

Die Karte meldet die Sprache jedes Benutzers (ha_chat/set_language); ohne Angabe gilt die
Sprache der Home-Assistant-Instanz. Deutsch bleibt Deutsch, alle anderen Sprachen bekommen
Englisch. Fehlermeldungen werden im Code auf Deutsch geschrieben und hier übersetzt.
"""

from __future__ import annotations

import re

SUPPORTED = ("de", "en")


def norm(code: str | None) -> str:
    """Sprachcode (z. B. "de-AT", "en-GB", "fr") auf "de" oder "en" abbilden."""
    return "de" if str(code or "").lower().startswith("de") else "en"


TEXTS: dict[str, dict[str, str]] = {
    "location": {"de": "📍 Standort", "en": "📍 Location"},
    "photo": {"de": "Foto", "en": "Photo"},
    "video": {"de": "Video", "en": "Video"},
    "audio": {"de": "Audiodatei", "en": "Audio file"},
    "file": {"de": "Datei", "en": "File"},
    "mentioned": {"de": "{name} hat dich erwähnt", "en": "{name} mentioned you"},
    "new_count": {"de": "({n} neue)", "en": "({n} new)"},
    "reply": {"de": "Antworten", "en": "Reply"},
    "send": {"de": "Senden", "en": "Send"},
    "message": {"de": "Nachricht", "en": "Message"},
    "mark_read": {"de": "Als gelesen markieren", "en": "Mark as read"},
    "test_message": {
        "de": "✅ Angekommen! Tippe hier – dann sollte sich der Chat öffnen.",
        "en": "✅ It works! Tap here – the chat should open.",
    },
    "device": {"de": "Gerät", "en": "Device"},
}


def text(key: str, lang: str | None, **kwargs: object) -> str:
    """Fester Text in der gewünschten Sprache."""
    return TEXTS[key][norm(lang)].format(**kwargs)


def attachment_label(mime: str, lang: str | None) -> str:
    if mime.startswith("image/"):
        return text("photo", lang)
    if mime.startswith("video/"):
        return text("video", lang)
    if mime.startswith("audio/"):
        return text("audio", lang)
    return text("file", lang)


# Systemmeldungen werden auf Deutsch gespeichert und beim Anzeigen bzw. in der Push übersetzt
_SYSTEM_EN: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"(.+) hat die Gruppe verlassen"), "{0} left the group"),
]

# Fehlermeldungen: deutscher Text (als Muster) -> englischer Text
_ERRORS_EN: list[tuple[re.Pattern[str], str]] = [
    (re.compile(p), en)
    for p, en in (
        (r"HA Chat ist nicht eingerichtet", "HA Chat is not set up"),
        (r"Bitte entweder „conversation“ oder „user“ angeben, nicht beides",
         'Please specify either "conversation" or "user", not both'),
        (r"Unterhaltung '(.+)' nicht gefunden", "Conversation '{0}' not found"),
        (r"Kein Benutzer angegeben", "No user specified"),
        (r"Zur Person „(.+)“ gehört kein Chat-Benutzer", 'Person "{0}" has no chat user'),
        (r"„(.+)“ passt auf mehrere Chat-Benutzer – bitte den vollen Namen angeben",
         '"{0}" matches several chat users – please use the full name'),
        (r"Chat-Benutzer „(.+)“ nicht gefunden", 'Chat user "{0}" not found'),
        (r"Unterhaltung nicht gefunden", "Conversation not found"),
        (r"Nur eigene Nachrichten können geändert werden", "Only your own messages can be changed"),
        (r"Bitte mindestens eine Person auswählen", "Please select at least one person"),
        (r"Person ist nicht für den Chat freigegeben", "This person does not have access to the chat"),
        (r"Diese Unterhaltung kann nicht geändert werden", "This conversation can't be changed"),
        (r"Nur der Ersteller kann Mitglieder entfernen", "Only the creator can remove members"),
        (r"Diese Unterhaltung kann nicht verlassen werden", "This conversation can't be left"),
        (r"Nur der Ersteller kann die Gruppe löschen", "Only the creator can delete the group"),
        (r"Nachricht nicht gefunden", "Message not found"),
        (r"Anhang ungültig", "Invalid attachment"),
        (r"Leere Nachricht", "Empty message"),
        (r"Unbekannter Knopf", "Unknown button"),
        (r"Diese Frage wurde bereits beantwortet", "This question has already been answered"),
        (r"Nur für eigene Nachrichten verfügbar", "Only available for your own messages"),
        (r"Unbekannte Reaktion", "Unknown reaction"),
        (r"Datei nicht erlaubt oder nicht gefunden: (.+)", "File not allowed or not found: {0}"),
        (r"Datei zu groß \(max\. 100 MB\)", "File too large (max. 100 MB)"),
        (r"Der Kanal „Home“ kann nur geleert, nicht gelöscht werden",
         'The "Home" channel can only be cleared, not deleted'),
        (r"Bitte eine Anzahl Tage angeben", "Please specify a number of days"),
        (r"Unbekannte Aktion", "Unknown action"),
        (r"Bild zu groß \(max\. 512 KB\)", "Image too large (max. 512 KB)"),
        (r"Nur JPEG- oder PNG-Bilder sind erlaubt", "Only JPEG or PNG images are allowed"),
        (r"Ungültiger Standort", "Invalid location"),
        (r"Kein Zugriff auf den Chat", "No access to the chat"),
        (r"Nur für Administratoren", "Administrators only"),
        (r"Ungültige Bilddaten", "Invalid image data"),
        (r"Kein Zugriff", "No access"),
        (r"Ungültige Unterhaltung", "Invalid conversation"),
        (r"Kein Mitglied", "Not a member of this conversation"),
        (r"conversation_id muss vor der Datei kommen", "conversation_id must come before the file"),
        (r"Keine Datei erhalten", "No file received"),
    )
]


def _translate(table: list[tuple[re.Pattern[str], str]], message: str, lang: str | None) -> str:
    if norm(lang) == "de":
        return message
    for pattern, english in table:
        match = pattern.fullmatch(message)
        if match:
            return english.format(*match.groups())
    return message


def error(message: str, lang: str | None) -> str:
    """Fehlermeldung (auf Deutsch geschrieben) in der Sprache des Empfängers."""
    return _translate(_ERRORS_EN, message, lang)


def system_text(message: str, lang: str | None) -> str:
    """Systemmeldung (z. B. „… hat die Gruppe verlassen“) in der Sprache des Empfängers."""
    return _translate(_SYSTEM_EN, message, lang)
