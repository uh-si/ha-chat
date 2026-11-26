/* HA Chat – Karten für Home Assistant
 * custom:ha-chat-card          Vollständiger Chat (zweispaltig ab 640 px Breite, sonst einspaltig)
 * custom:ha-chat-compact-card  Kompakte Kachel mit ungelesenen Nachrichten und Schnellantwort
 */
(() => {
  const VERSION = "2.0.0";
  const SYSTEM = "__system__";
  if (customElements.get("ha-chat-card")) return;

  // ------------------------------------------------------------ Sprache (Deutsch / Englisch)
  // Alle Texte stehen hier auf Deutsch; EN enthält die englische Übersetzung. Welche Sprache gilt:
  // Kartenoption „language“ (de/en), sonst die Sprache aus dem Home-Assistant-Profil des Benutzers
  // (Deutsch → Deutsch, alle anderen → Englisch). Weitere Sprachen: neue Tabelle wie EN anlegen.
  const EN = {
    "Dateien hier ablegen": "Drop files here",
    "Ich": "Me",
    " und ": " and ",
    "1 Anhang": "1 attachment",
    "1 Datei": "1 file",
    "1 Nachricht": "1 message",
    "1 verwaiste Datei": "1 orphaned file",
    "<b>In {s} Sekunden</b> kommt eine Test-Benachrichtigung auf dein Gerät.": "<b>In {s} seconds</b> a test notification will arrive on your device.",
    "<b>In {s} Sekunden</b> kommt eine Test-Benachrichtigung auf {n} Geräte.": "<b>In {s} seconds</b> a test notification will arrive on {n} devices.",
    "<b>Kein Standort verfügbar.</b> Bitte prüfen:<br>• Ist auf dem Handy die Standortermittlung (GPS) eingeschaltet?<br>• Darf die Companion App den Standort verwenden – auch im Hintergrund? (In der App: Einstellungen → Companion App → Sensoren bzw. Standort)<br>• Ist dein Home-Assistant-Benutzer einer Person mit diesem Handy zugeordnet? (Einstellungen → Personen)": "<b>No location available.</b> Please check:<br>• Is location (GPS) turned on on the phone?<br>• May the Companion app use your location – also in the background? (In the app: Settings → Companion app → Sensors or Location)<br>• Is your Home Assistant user assigned to a person with this phone? (Settings → People)",
    "Abbrechen": "Cancel",
    "Abfrage fehlgeschlagen": "Request failed",
    "Achtung: Ein aktueller Standort war nicht verfügbar. Das ist der <b>letzte bekannte Standort von vor {age}</b>.": "Note: a current location was not available. This is the <b>last known location from {age} ago</b>.",
    "Akku: „Nicht eingeschränkt“ bzw. Akku-Optimierung für Home Assistant ausschalten.": "Battery: set to “Unrestricted” or turn off battery optimisation for Home Assistant.",
    "Alle": "All",
    "Alle Bilder, Videos und Dateien in „{name}“ löschen?": "Delete all photos, videos and files in “{name}”?",
    "Alle Nachrichten in „{name}“ löschen?": "Delete all messages in “{name}”?",
    "Alle Nachrichten löschen, die älter als {n} Tage sind?": "Delete all messages older than {n} days?",
    "Alle bisherigen Nachrichten verschwinden nur bei dir. Die anderen sehen sie weiterhin, neue Nachrichten kommen ganz normal an.": "All previous messages disappear for you only. The others still see them, and new messages arrive as usual.",
    "Alter in Tagen": "Age in days",
    "An {n} Chats weitergeleitet": "Forwarded to {n} chats",
    "Andere sehen, ob du gerade online bist und wann du zuletzt online warst. Schaltest du das aus, siehst du auch den Status der anderen nicht.": "Others can see whether you are online and when you were last online. If you turn this off, you won't see the status of others either.",
    "Anhang": "Attachment",
    "Anhängen": "Attach",
    "Anhängen: Kamera, Fotos, Datei oder Standort": "Attach: camera, photos, file or location",
    "Antwort": "Answer",
    "Antwort an {name} …": "Reply to {name} …",
    "Antworten": "Reply",
    "Anzahl angezeigter Nachrichten": "Number of messages shown",
    "App nicht erreichbar": "app not reachable",
    "Audiodatei": "Audio file",
    "Auf dem Handy bildschirmfüllend": "Fill the screen on phones",
    "Automatisch (Sprache des Benutzerprofils)": "Automatic (language of the user profile)",
    "Bearbeiten": "Edit",
    "Benachrichtigungsdienst fehlt (Home Assistant neu starten)": "notification service missing (restart Home Assistant)",
    "Beschreibung bearbeiten": "Edit description",
    "Beschreibung entfernt": "Description removed",
    "Beschreibung gespeichert": "Description saved",
    "Beschreibung hinzufügen": "Add description",
    "Bild": "Image",
    "Bilder, Videos & Dateien": "Photos, videos & files",
    "Bitte Gruppennamen eingeben": "Please enter a group name",
    "Bitte warten, das kann bis zu 25 Sekunden dauern …": "Please wait, this can take up to 25 seconds …",
    "Chat": "Chat",
    "Chat für beide löschen": "Delete chat for both",
    "Chat löschen": "Delete chat",
    "Chat schließen": "Close chat",
    "Chat starten": "Start chat",
    "Chat und alle Nachrichten löschen?": "Delete the chat and all messages?",
    "Chat {name} öffnen": "Open chat {name}",
    "Chat „{name}“ komplett löschen?": "Delete chat “{name}” completely?",
    "Chats durchsuchen": "Search chats",
    "Dashboard zum Öffnen (statt Fenster)": "Dashboard to open (instead of a pop-up)",
    "Datei": "File",
    "Dateien": "Files",
    "Dein Benutzer ist keiner Person zugeordnet": "your user is not assigned to a person",
    "Dein persönlicher Kanal: Hier schickt Home Assistant Meldungen aus Automationen, die nur für dich bestimmt sind. Niemand sonst sieht diesen Chat.": "Your personal channel: Home Assistant sends messages from automations here that are meant only for you. Nobody else sees this chat.",
    "Deine Geräte können zurzeit keine Push empfangen. Öffne die Companion App einmal, erlaube Benachrichtigungen und starte Home Assistant ggf. neu.": "Your devices can't receive push notifications right now. Open the Companion app once, allow notifications and restart Home Assistant if needed.",
    "Der Chat wird für euch beide gelöscht.": "The chat will be deleted for both of you.",
    "Der Name ist dein Anzeigename aus deinem Home-Assistant-Profil (unten links auf deinen Namen tippen).": "The name is the display name from your Home Assistant profile (tap your name at the bottom left).",
    "Der Standort ist ungenau (±{acc} m).": "The location is inaccurate (±{acc} m).",
    "Die App darf im Hintergrund bleiben; Wegwischen schadet nicht – die Push kommt von Apple.": "The app may stay in the background; swiping it away does no harm – the push comes from Apple.",
    "Die App nie mit „Beenden erzwingen“ stoppen – danach kommen keine Pushs, bis sie wieder geöffnet wurde.": "Never stop the app with “Force stop” – after that no pushes arrive until it is opened again.",
    "Die Integration „HA Chat“ ist noch nicht eingerichtet (Einstellungen → Geräte & Dienste).": "The “HA Chat” integration is not set up yet (Settings → Devices & services).",
    "Die Nachricht verschwindet nur bei dir. Alle anderen sehen sie weiterhin.": "The message disappears for you only. Everyone else still sees it.",
    "Die kostenlose Push-Zustellung von Home Assistant erlaubt 500 Benachrichtigungen pro Gerät und Tag – für alle Automationen zusammen. Kurz hintereinander geschriebene Nachrichten fasst HA Chat zu einer Push zusammen. Ab 350 Chat-Pushs an einem Tag wird gedrosselt (höchstens eine je Chat alle 10 Minuten, Nachrichten mit höchster Priorität ausgenommen), damit z. B. Alarm-Meldungen nicht ausfallen.": "Home Assistant's free push delivery allows 500 notifications per device and day – for all automations together. HA Chat combines messages written in quick succession into one push. From 350 chat pushes a day it throttles (at most one per chat every 10 minutes, highest-priority messages excepted) so that e.g. alarm notifications don't get lost.",
    "Dienst fehlt – Home Assistant neu starten": "service missing – restart Home Assistant",
    "Diese Dateien gehören zu keiner Nachricht mehr (z. B. abgebrochene Uploads).": "These files no longer belong to any message (e.g. cancelled uploads).",
    "Diese Nachricht wurde gelöscht": "This message was deleted",
    "Dieses Bildformat kann hier nicht gelesen werden. Bitte ein JPEG- oder PNG-Bild wählen.": "This image format can't be read here. Please choose a JPEG or PNG image.",
    "Direktchat": "Direct chat",
    "Direktnachricht": "Direct message",
    "Dort „Zeitkritische Mitteilungen“ erlauben – nötig, damit Nachrichten mit <b>höchster Priorität</b> auch im Fokus- bzw. „Nicht stören“-Modus durchkommen.": "Allow “Time Sensitive Notifications” there – needed so that messages with <b>highest priority</b> also get through in Focus / Do Not Disturb mode.",
    "Du": "You",
    "Du bist für den Chat nicht freigeschaltet.": "You don't have access to the chat.",
    "Du bist für den Chat nicht freigeschaltet. Ein Administrator kann dich unter Einstellungen → Geräte & Dienste → HA Chat → Konfigurieren hinzufügen.": "You don't have access to the chat. An administrator can add you under Settings → Devices & services → HA Chat → Configure.",
    "Ein genauerer Standort kann noch kommen …": "A more accurate location may still arrive …",
    "Einstellungen → Apps → Home Assistant → Benachrichtigungen: erlauben; Kategorie „Chat“ auf „Ton und Pop-up“.": "Settings → Apps → Home Assistant → Notifications: allow; set the “Chat” category to “Sound and pop-up”.",
    "Einstellungen → Mitteilungen → Home Assistant: „Mitteilungen erlauben“, Sperrbildschirm, Banner und Töne einschalten.": "Settings → Notifications → Home Assistant: turn on “Allow Notifications”, Lock Screen, Banners and Sounds.",
    "Emoji": "Emoji",
    "Emoji einfügen": "Insert emoji",
    "Entfernen": "Remove",
    "Erledigt": "Done",
    "Erledigt – {what} entfernt": "Done – {what} removed",
    "Erreichbarkeit": "Reachability",
    "Erreichbarkeit testen": "Test reachability",
    "Ersteller": "creator",
    "Es werden die 80 neuesten Treffer angezeigt – Suchbegriff genauer fassen.": "Showing the 80 newest results – try a more specific search term.",
    "Essen & Trinken": "Food & drink",
    "Fokus-Modi (Einstellungen → Fokus): bei Home Assistant „Zeitkritische Mitteilungen“ zulassen. Normale Chat-Nachrichten halten sich an den Fokus.": "Focus modes (Settings → Focus): allow “Time Sensitive Notifications” for Home Assistant. Normal chat messages respect Focus.",
    "Foto": "Photo",
    "Foto aufnehmen": "Take photo",
    "Fotos & Videos aus der Galerie": "Photos & videos from the gallery",
    "Für Dringendes: kommt auch bei „Nicht stören“ an": "For urgent things: gets through Do Not Disturb",
    "Für alle Mitglieder, mit allen Nachrichten und Dateien.": "For all members, with all messages and files.",
    "Für alle Mitglieder, mitsamt Anhängen. Der Chat selbst bleibt bestehen.": "For all members, including attachments. The chat itself remains.",
    "Für alle Mitglieder. Textnachrichten bleiben erhalten. Das lässt sich nicht rückgängig machen.": "For all members. Text messages are kept. This can't be undone.",
    "Für alle löschen": "Delete for everyone",
    "Für deinen Benutzer ist kein Smartphone mit der <b>Home Assistant Companion App</b> angemeldet. Installiere die App und melde dich mit deinem Benutzer an – dann bekommst du Chat-Nachrichten als Push.": "No phone with the <b>Home Assistant Companion app</b> is signed in for your user. Install the app and sign in with your user – then you'll get chat messages as push notifications.",
    "Für mich löschen": "Delete for me",
    "GPS dieses Geräts": "This device's GPS",
    "Gelesen": "Read",
    "Gelesen ({n})": "Read ({n})",
    "Gelöschte Nachricht": "Deleted message",
    "Gemeinsamer Kanal aller {n} Chat-Benutzer. Hier schreibt auch Home Assistant selbst (z. B. Meldungen aus Automationen).": "Shared channel of all {n} chat users. Home Assistant itself writes here too (e.g. messages from automations).",
    "Gesamt": "Total",
    "Gesendet": "Sent",
    "Gesichter": "Faces",
    "Gesten & Menschen": "Gestures & people",
    "Gestern": "Yesterday",
    "Gruppe": "Group",
    "Gruppe für alle löschen?": "Delete the group for everyone?",
    "Gruppe löschen": "Delete group",
    "Gruppe umbenennen": "Rename group",
    "Gruppe verlassen": "Leave group",
    "Gruppe verlassen?": "Leave the group?",
    "Gruppe · {n} Mitglieder": "Group · {n} members",
    "Gruppenbeschreibung": "Group description",
    "Gruppenbild entfernen": "Remove group picture",
    "Gruppenbild festlegen": "Set group picture",
    "Gruppenbild gespeichert": "Group picture saved",
    "Gruppenbild ändern": "Change group picture",
    "Gruppeninfo": "Group info",
    "Gruppeninfo: Bild, Name & Beschreibung": "Group info: picture, name & description",
    "Gruppenname (bei mehreren Personen)": "Group name (for several people)",
    "HA Chat ist noch nicht eingerichtet.": "HA Chat is not set up yet.",
    "Herunterladen": "Download",
    "Herzen & Symbole": "Hearts & symbols",
    "Heute": "Today",
    "Hinzufügen": "Add",
    "Häufig": "Frequent",
    "Höchste Priorität": "Highest priority",
    "Höchste Priorität ausschalten": "Turn off highest priority",
    "Höchstens 10 Chats": "At most 10 chats",
    "Höchstens 10 Dateien auf einmal": "At most 10 files at once",
    "Höhe auf PC/Tablet": "Height on PC/tablet",
    "Im Chat zeigen": "Show in chat",
    "In allen Chats": "In all chats",
    "In allen Chats und für alle Benutzer, mitsamt Anhängen.": "In all chats and for all users, including attachments.",
    "In allen Nachrichten nach „{q}“ suchen": "Search all messages for “{q}”",
    "In diesem Chat suchen": "Search in this chat",
    "In „{name}“": "In “{name}”",
    "Info": "Info",
    "Info: gelesen von …": "Info: read by …",
    "Jeder kann seine Erreichbarkeit unter Profil → „Erreichbarkeit testen“ selbst prüfen.": "Everyone can check their own reachability under Profile → “Test reachability”.",
    "Kanal": "Channel",
    "Karte {card} ≠ Integration {server} · neu laden": "Card {card} ≠ integration {server} · reload",
    "Kategorie „Chat – Wichtig“ (erscheint nach der ersten Nachricht mit höchster Priorität): „Nicht stören ignorieren“ erlauben.": "Category “Chat – Important” (appears after the first highest-priority message): allow “Override Do Not Disturb”.",
    "Kein Smartphone mit der Companion App – bekommt keine Push-Nachrichten": "No phone with the Companion app – gets no push notifications",
    "Keine Chats mit diesem Namen": "No chats with this name",
    "Keine Nachrichten mit „{q}“ gefunden.": "No messages found for “{q}”.",
    "Keine neuen Nachrichten": "No new messages",
    "Keine weiteren berechtigten Personen vorhanden.": "There are no other people with access.",
    "Kommt bei den Empfängern auch durch „Nicht stören“ bzw. den Fokus-Modus (wenn erlaubt). Gilt für die nächste Nachricht.": "Gets through Do Not Disturb / Focus mode for the recipients (if allowed). Applies to the next message.",
    "Kompakt": "Compact",
    "Kontaktinfo": "Contact info",
    "Lade Nachrichten …": "Loading messages …",
    "Lade …": "Loading …",
    "Laden fehlgeschlagen": "Loading failed",
    "Leeren": "Clear",
    "Links": "Links",
    "Löschen": "Delete",
    "Medien": "Media",
    "Medien löschen": "Delete media",
    "Medien, Dateien & Links": "Media, files & links",
    "Mehr laden": "Load more",
    "Mein Profil": "My profile",
    "Mindestens 2 Zeichen eingeben. Gesucht wird in Texten und Dateinamen.": "Enter at least 2 characters. Texts and file names are searched.",
    "Mit höchster Priorität senden": "Send with highest priority",
    "Mitglieder": "Members",
    "Mitglieder ({n})": "Members ({n})",
    "Mitglieder hinzufügen": "Add members",
    "Nachricht bearbeiten": "Edit message",
    "Nachricht für alle löschen?": "Delete the message for everyone?",
    "Nachricht gelöscht": "Message deleted",
    "Nachricht schreiben": "Write a message",
    "Nachrichten (Datenbank)": "Messages (database)",
    "Nachrichten durchsuchen": "Search messages",
    "Nachrichten werden automatisch nach {n} Tagen gelöscht (änderbar unter Einstellungen → Geräte & Dienste → HA Chat → Konfigurieren).": "Messages are deleted automatically after {n} days (can be changed under Settings → Devices & services → HA Chat → Configure).",
    "Nachrichteninfo": "Message info",
    "Neuer Chat": "New chat",
    "Neuere Nachrichten werden geladen …": "Loading newer messages …",
    "Noch keine Chats – starte mit +": "No chats yet – start with +",
    "Noch keine Chats.": "No chats yet.",
    "Noch keine Dateien": "No files yet",
    "Noch keine Fotos oder Videos": "No photos or videos yet",
    "Noch keine Gruppenbeschreibung": "No group description yet",
    "Noch keine Links": "No links yet",
    "Noch keine Nachrichten": "No messages yet",
    "Noch nicht gelesen ({n})": "Not read yet ({n})",
    "Noch von niemandem": "Not by anyone yet",
    "Nur für Administratoren": "Administrators only",
    "Nur für dich löschen?": "Delete for you only?",
    "Online-Status ist verborgen": "Online status is hidden",
    "Online-Status wird angezeigt": "Online status is shown",
    "Online-Status zeigen": "Show online status",
    "Optional: Text dazu schreiben": "Optional: add a text",
    "Originalqualität (nicht verkleinern)": "Original quality (don't resize)",
    "Platzbedarf je Chat": "Space used per chat",
    "Privater Chat für berechtigte Benutzer (WhatsApp-ähnlich).": "Private chat for authorised users (WhatsApp-like).",
    "Profil- & Gruppenbilder": "Profile & group pictures",
    "Profilbild entfernen": "Remove profile picture",
    "Profilbild festlegen": "Set profile picture",
    "Profilbild ändern": "Change profile picture",
    "Push bereit": "push ready",
    "Push nicht eingerichtet": "push not set up",
    "Reaktion": "Reaction",
    "Reaktionen": "Reactions",
    "Reaktionen anzeigen": "Show reactions",
    "Schließen": "Close",
    "Schnell antworten an {name}": "Quick reply to {name}",
    "Seite bzw. App neu laden": "Reload the page or app",
    "Sende … (noch {n})": "Sending … ({n} left)",
    "Senden": "Send",
    "Speicher": "Storage",
    "Speicher & Geräte": "Storage & devices",
    "Speicher & Geräte (Admin)": "Storage & devices (admin)",
    "Speichern": "Save",
    "Sperre jetzt das Display oder wechsle in eine andere App – so prüfst du, ob Nachrichten auch bei geschlossener App ankommen.": "Lock the screen now or switch to another app – this checks that messages also arrive when the app is closed.",
    "Sprache": "Language",
    "Stand vor {age}": "{age} ago",
    "Standort": "Location",
    "Standort in Karten-App öffnen": "Open location in maps app",
    "Standort senden": "Send location",
    "Standort wird bei der Companion App angefragt …": "requesting location from the Companion app …",
    "Suchbegriff": "Search term",
    "Suche fehlgeschlagen": "Search failed",
    "Suche schließen": "Close search",
    "Suche …": "Searching …",
    "Text kopieren": "Copy text",
    "Tiere & Natur": "Animals & nature",
    "Tipps, falls keine Benachrichtigung ankommt": "Tips if no notification arrives",
    "Tippst du die Benachrichtigung an, öffnet sich <b>{link}</b> – dort, wo du die Chat-Karte benutzt.": "Tapping the notification opens <b>{link}</b> – where you use the chat card.",
    "Titel": "Title",
    "Trotzdem senden": "Send anyway",
    "Unbekannt": "Unknown",
    "Ungelesene Nachrichten, letzte Nachrichten und Schnellantwort.": "Unread messages, latest messages and quick reply.",
    "Upload fehlgeschlagen ({status})": "Upload failed ({status})",
    "Verlassen": "Leave",
    "Verlauf leeren": "Clear history",
    "Verlauf von „{name}“ leeren?": "Clear the history of “{name}”?",
    "Version der Chat-Karte": "Version of the chat card",
    "Version ohne Google-Dienste (F-Droid): Companion App → Server → „Dauerhafte Verbindung“ auf „Immer“.": "Version without Google services (F-Droid): Companion app → Server → set “Persistent connection” to “Always”.",
    "Verwaiste Dateien entfernen?": "Remove orphaned files?",
    "Video": "Video",
    "Weitere Optionen": "More options",
    "Weitergeleitet": "Forwarded",
    "Weiterleiten": "Forward",
    "Weiterleiten an …": "Forward to …",
    "Wichtig": "Important",
    "Wichtige Nachricht schreiben": "Write an important message",
    "Worum geht es in dieser Gruppe? (für alle Mitglieder sichtbar)": "What is this group about? (visible to all members)",
    "Wähle links einen Chat aus oder starte einen neuen.": "Choose a chat on the left or start a new one.",
    "Xiaomi, Huawei, Honor, Oppo, teils Samsung: „Autostart“ erlauben und die App von „Schlafende Apps“ ausnehmen.": "Xiaomi, Huawei, Honor, Oppo, some Samsung: allow “Autostart” and exclude the app from “Sleeping apps”.",
    "Zu den neuesten Nachrichten": "To the newest messages",
    "Zugriff verweigert": "access denied",
    "Zuhause & Alltag": "Home & everyday",
    "Zuletzt verwendet": "Recently used",
    "Zum Empfangen braucht das Handy keine Verbindung nach Hause – Home Assistant selbst muss aber Internet haben. Zum Antworten aus der Benachrichtigung unterwegs ist Fernzugriff nötig (z. B. Home Assistant Cloud).": "To receive notifications the phone needs no connection to home – but Home Assistant itself needs internet access. Replying from the notification while away needs remote access (e.g. Home Assistant Cloud).",
    "Zurück": "Back",
    "bearbeitet": "edited",
    "gehören zu keiner Nachricht mehr.": "no longer belong to any message.",
    "gelesen": "read",
    "heute": "today",
    "heute 1 Chat-Push": "1 chat push today",
    "heute {n} Chat-Pushs": "{n} chat pushes today",
    "in Karten öffnen": "open in maps",
    "kein aktueller Standort erhalten": "no current location received",
    "keine Standortdaten von der App": "no location data from the app",
    "nicht verfügbar": "not available",
    "nur über HTTPS möglich": "only possible over HTTPS",
    "online": "online",
    "seit {date}": "since {date}",
    "wird ermittelt …": "locating …",
    "z. B. /dashboard-chat/0 – leer lassen, um den Chat in einem Fenster zu öffnen": "e.g. /dashboard-chat/0 – leave empty to open the chat in a pop-up",
    "z. B. 600px oder 80vh": "e.g. 600px or 80vh",
    "zu groß (max. 100 MB)": "too large (max. 100 MB)",
    "zuletzt online am {date} um {time}": "last seen {date} at {time}",
    "zuletzt online gestern um {time}": "last seen yesterday at {time}",
    "zuletzt online heute um {time}": "last seen today at {time}",
    "{name} entfernen": "Remove {name}",
    "{name} hat die Gruppe verlassen": "{name} left the group",
    "{name} schreibt": "{name} is typing",
    "{name} schreibt …": "{name} is typing …",
    "{n} Anhänge": "{n} attachments",
    "{n} Dateien": "{n} files",
    "{n} Dateien – der Text wird mit der ersten gesendet": "{n} files – the text is sent with the first one",
    "{n} Min.": "{n} min",
    "{n} Nachrichten": "{n} messages",
    "{n} Sek.": "{n} s",
    "{n} Std.": "{n} h",
    "{n} Tage": "{n} days",
    "{n} Tagen": "{n} days",
    "{n} neu": "{n} new",
    "{n} online": "{n} online",
    "{n} ungelesen": "{n} unread",
    "{n} verwaiste Dateien": "{n} orphaned files",
    "Ältere Nachrichten in allen Chats löschen: älter als": "Delete older messages in all chats: older than",
    "Ältere Nachrichten werden geladen …": "Loading older messages …",
    "Öffnen": "Open",
    "„App-Aktivität pausieren, wenn nicht verwendet“ ausschalten.": "Turn off “Pause app activity if unused”.",
  };
  const langOf = (code) => (String(code || "").toLowerCase().startsWith("de") ? "de" : "en");
  const I18N = { lang: langOf(document.documentElement.lang || navigator.language), locale: "de-DE", forced: null };
  I18N.locale = I18N.lang === "de" ? "de-DE" : "en-GB";
  const T = (s, v) => {
    let out = I18N.lang === "de" ? s : (EN[s] ?? s);
    if (v) out = out.replace(/\{(\w+)\}/g, (m, k) => (v[k] ?? m));
    return out;
  };
  // Liefert true, wenn sich die Sprache geändert hat.
  const setLang = (hass, cfgLang) => {
    if (cfgLang === "de" || cfgLang === "en") I18N.forced = cfgLang;
    const hl = hass?.locale?.language || hass?.language || "";
    const lang = I18N.forced || (hl ? langOf(hl) : I18N.lang);
    const locale = lang === "de" ? "de-DE" : (/^en/i.test(hl) ? hl : "en-GB");
    const changed = lang !== I18N.lang || locale !== I18N.locale;
    I18N.lang = lang;
    I18N.locale = locale;
    return changed;
  };
  // Systemmeldungen des Servers (gespeichert auf Deutsch) in der Sprache des Lesers
  const sysText = (m) => {
    const s = m?.text || "";
    if (m?.sender_id !== SYSTEM || I18N.lang === "de") return s;
    const g = s.match(/^(.+) hat die Gruppe verlassen$/);
    return g ? T("{name} hat die Gruppe verlassen", { name: g[1] }) : s;
  };
  // Visueller Karten-Editor
  const LANG_OPTIONS = () => [
    { value: "auto", label: T("Automatisch (Sprache des Benutzerprofils)") },
    { value: "de", label: "Deutsch" },
    { value: "en", label: "English" },
  ];
  const FORM_LABELS = () => ({
    language: T("Sprache"), height: T("Höhe auf PC/Tablet"), fit_screen: T("Auf dem Handy bildschirmfüllend"),
    title: T("Titel"), messages: T("Anzahl angezeigter Nachrichten"), navigation_path: T("Dashboard zum Öffnen (statt Fenster)"),
  });
  const FORM_HELPERS = () => ({
    height: T("z. B. 600px oder 80vh"),
    navigation_path: T("z. B. /dashboard-chat/0 – leer lassen, um den Chat in einem Fenster zu öffnen"),
  });

  // ------------------------------------------------------------ Hilfsfunktionen
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const linkify = (s) =>
    esc(s).replace(/(https?:\/\/[^\s<]+)/g, (u) => `<a href="${u}" target="_blank" rel="noopener noreferrer">${u}</a>`);
  const pad = (n) => String(n).padStart(2, "0");
  const fmtTime = (ts) => {
    const d = new Date(ts * 1000);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  const dayKey = (ts) => new Date(ts * 1000).toDateString();
  const fmtDay = (ts) => {
    const d = new Date(ts * 1000);
    const today = new Date();
    const y = new Date(); y.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return T("Heute");
    if (d.toDateString() === y.toDateString()) return T("Gestern");
    return d.toLocaleDateString(I18N.locale, { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });
  };
  const fmtListTime = (ts) => {
    if (!ts) return "";
    const d = new Date(ts * 1000);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return fmtTime(ts);
    const diff = (now - d) / 86400000;
    if (diff < 2 && fmtDay(ts) === T("Gestern")) return T("Gestern");
    if (diff < 7) return d.toLocaleDateString(I18N.locale, { weekday: "short" });
    return d.toLocaleDateString(I18N.locale, { day: "2-digit", month: "2-digit" });
  };
  // Muss zu INLINE_TYPES in http.py passen: nur diese Typen werden direkt angezeigt.
  const INLINE = new Set(["image/jpeg", "image/png", "image/gif", "image/webp", "image/avif", "image/heic", "image/heif", "image/bmp",
    "video/mp4", "video/webm", "video/quicktime", "video/ogg", "video/3gpp"]);
  const mediaKind = (mime) => {
    const m = String(mime || "").split(";")[0].trim().toLowerCase();
    if (!INLINE.has(m)) return "file";
    return m.split("/")[0];
  };
  const fmtSize = (b) => (b > 1048576 ? (b / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(b / 1024)) + " KB");
  // Die ersten zwei Buchstaben des Vornamens: erster groß, zweiter klein (z. B. „Markus“ → „Ma“)
  const initials = (name) => {
    // erstes Wort mit Buchstaben/Ziffern (überspringt z. B. ein vorangestelltes Emoji)
    const word = String(name || "").trim().split(/\s+/).map((w) => w.replace(/^[^\p{L}\p{N}]+/u, "")).find(Boolean) || "";
    const ch = Array.from(word);
    if (!ch.length) return "?";
    const a = ch[0].toLocaleUpperCase(I18N.locale);
    const b = ch[1] && /[\p{L}\p{N}]/u.test(ch[1]) ? ch[1].toLocaleLowerCase(I18N.locale) : "";
    return (a.length > 1 ? ch[0] : a) + b;
  };
  const PALETTE = ["#00796b", "#c2185b", "#5e35b1", "#1565c0", "#2e7d32", "#6d4c41", "#ad1457", "#455a64", "#ef6c00", "#00838f"];
  const colorFor = (key) => {
    let h = 0;
    for (const c of String(key)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return PALETTE[h % PALETTE.length];
  };
  const attLabel = (mime) =>
    mime?.startsWith("image/") ? T("Foto") : mime?.startsWith("video/") ? T("Video") : mime?.startsWith("audio/") ? T("Audiodatei") : T("Datei");
  const preview = (m) => {
    if (!m) return "";
    if (m.deleted) return T("Nachricht gelöscht");
    const imp = m.important ? "❗ " : "";
    if (m.location && !m.text) return imp + "📍 " + T("Standort");
    const att = m.attachment ? attLabel(m.attachment.mime) : "";
    return imp + (att && m.text ? `${att}: ${sysText(m)}` : att || sysText(m));
  };
  // Ausschnitt um den Suchbegriff mit Hervorhebung (sicher escaped)
  const highlight = (text, q) => {
    const t = String(text || "");
    const i = t.toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return esc(t.length > 120 ? t.slice(0, 120) + " …" : t);
    const start = Math.max(0, i - 40);
    const end = Math.min(t.length, i + q.length + 70);
    return (start > 0 ? "… " : "") + esc(t.slice(start, i)) + "<mark>" + esc(t.slice(i, i + q.length)) + "</mark>" + esc(t.slice(i + q.length, end)) + (end < t.length ? " …" : "");
  };
  const reEsc = (t) => String(t).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const fmtDateTime = (ts) => {
    const d = new Date(ts * 1000);
    const today = d.toDateString() === new Date().toDateString();
    return (today ? T("heute") : d.toLocaleDateString(I18N.locale, { day: "2-digit", month: "2-digit" })) + ", " + fmtTime(ts);
  };
  const fmtLastSeen = (ts) => {
    const d = new Date(ts * 1000);
    const now = new Date();
    const yest = new Date(now);
    yest.setDate(now.getDate() - 1);
    const time = fmtTime(ts);
    if (d.toDateString() === now.toDateString()) return T("zuletzt online heute um {time}", { time });
    if (d.toDateString() === yest.toDateString()) return T("zuletzt online gestern um {time}", { time });
    const date = d.toLocaleDateString(I18N.locale, d.getFullYear() === now.getFullYear() ? { day: "2-digit", month: "2-digit" } : { day: "2-digit", month: "2-digit", year: "numeric" });
    return T("zuletzt online am {date} um {time}", { date, time });
  };
  const fmtBytes = (b) => (!b ? "0 KB" : b >= 1073741824 ? (b / 1073741824).toFixed(2) + " GB" : fmtSize(b));
  const withDot = (html, on) => (on ? `<span class="avw">${html}<span class="dot" title="online"></span></span>` : html);
  const devicePlatform = () => {
    const ua = navigator.userAgent || "";
    if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && "ontouchend" in document)) return "ios";
    if (/Android/i.test(ua)) return "android";
    return null;
  };
  const fmtAge = (sec) => {
    sec = Math.max(0, Math.round(sec));
    if (sec < 60) return T("{n} Sek.", { n: sec });
    if (sec < 3600) return T("{n} Min.", { n: Math.round(sec / 60) });
    if (sec < 86400) return T("{n} Std.", { n: Math.round(sec / 3600) });
    return T("{n} Tagen", { n: Math.round(sec / 86400) });
  };

  // Bilder vor dem Hochladen verkleinern (längste Seite max. 1920 px, JPEG). Entfernt dabei
  // auch Metadaten wie den GPS-Standort. GIFs (Animation) und SVGs bleiben unverändert.
  const shrinkImage = (file, max = 1920, quality = 0.85) =>
    new Promise((resolve) => {
      if (!/^image\/(jpeg|png|webp|heic|heif|bmp|avif)$/i.test(file.type)) return resolve(file);
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const w = img.naturalWidth, h = img.naturalHeight;
        const scale = Math.min(1, max / Math.max(w, h));
        if (scale === 1 && file.size < 600 * 1024) { URL.revokeObjectURL(url); return resolve(file); }
        const c = document.createElement("canvas");
        c.width = Math.round(w * scale);
        c.height = Math.round(h * scale);
        const ctx = c.getContext("2d");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob((blob) => {
          if (!blob || blob.size >= file.size) return resolve(file);
          const name = (file.name || "foto").replace(/\.[^.]+$/, "") + ".jpg";
          resolve(new File([blob], name, { type: "image/jpeg" }));
        }, "image/jpeg", quality);
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });

  // Kleine Kartenvorschau aus OpenStreetMap-Kacheln (wird vom anzeigenden Gerät geladen).
  const mapHtml = (l, w, h) => {
    const z = 16, n = 2 ** z;
    const latR = (l.lat * Math.PI) / 180;
    const x = ((l.lon + 180) / 360) * n;
    const y = ((1 - Math.log(Math.tan(latR) + 1 / Math.cos(latR)) / Math.PI) / 2) * n;
    const tx = Math.floor(x), ty = Math.floor(y);
    const px = (x - tx) * 256, py = (y - ty) * 256;
    let tiles = "";
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      tiles += `<img src="https://tile.openstreetmap.org/${z}/${(((tx + dx) % n) + n) % n}/${ty + dy}.png" style="left:${(dx + 1) * 256}px;top:${(dy + 1) * 256}px" alt="" loading="lazy" onerror="this.remove()">`;
    }
    const mpp = (156543.03392 * Math.cos(latR)) / n;
    const r = l.acc ? l.acc / mpp : 0;
    const circle = r > 4 && r < Math.max(w, h) ? `<span class="acc" style="width:${2 * r}px;height:${2 * r}px;left:${w / 2 - r}px;top:${h / 2 - r}px"></span>` : "";
    return `<span class="map" style="width:${w}px;height:${h}px"><span class="tiles" style="left:${w / 2 - 256 - px}px;top:${h / 2 - 256 - py}px">${tiles}</span>${circle}<span class="pin">${icon("pin", 30)}</span><span class="osm">© OpenStreetMap</span></span>`;
  };
  const mapsLink = (l) => {
    const ua = navigator.userAgent || "";
    if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return `https://maps.apple.com/?ll=${l.lat},${l.lon}&q=${encodeURIComponent(T("Standort"))}`;
    if (/Android/.test(ua)) return `https://www.google.com/maps/search/?api=1&query=${l.lat},${l.lon}`;
    return `https://www.openstreetmap.org/?mlat=${l.lat}&mlon=${l.lon}#map=17/${l.lat}/${l.lon}`;
  };

  const EMOJIS = {
    "Häufig": "😀 😂 🥰 😍 😘 😊 😉 😎 🤔 😅 😢 😭 😡 😴 🙄 😮 👍 👎 👏 🙏 💪 🤝 👋 ❤️ 🔥 🎉 ✅ ❌",
    "Gesichter": "😃 😄 😁 😆 🤣 🙂 🙃 😇 🤩 😋 😛 😜 🤪 🤗 🤭 🤫 😐 😑 😶 😏 😬 😌 😔 😪 🤤 😷 🤒 🤕 🥵 🥶 🥳 🤯 😱 😨 😰 😥 🤬 😈 🤡 💩",
    "Gesten & Menschen": "👌 ✌️ 🤞 🤟 🤙 👈 👉 👆 👇 ☝️ ✋ 🖐️ 🙌 🫶 👐 💅 🤳 🏃 🚶 🧑‍🍳 👪 👶 🧓",
    "Herzen & Symbole": "🧡 💛 💚 💙 💜 🖤 🤍 💔 💕 💯 ⭐ ✨ ⚡ 💤 ❗ ❓ ⚠️ 🔔 ⏰ 📌 📍",
    "Zuhause & Alltag": "🏠 🛋️ 🛏️ 🚿 🧺 🧹 🔑 🚪 💡 🔌 📦 🛒 🧾 💶 📅 📞 📷 🎁 🚗 🚲 🚌 ✈️ 🌧️ ☀️ ❄️",
    "Essen & Trinken": "☕ 🍵 🥛 🍺 🍷 🥂 🍕 🍔 🍟 🌭 🥪 🥗 🍝 🍜 🍣 🍰 🎂 🍪 🍫 🍦 🍎 🍌 🍓 🥕",
    "Tiere & Natur": "🐶 🐱 🐭 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐸 🐵 🐔 🐦 🐝 🦋 🐢 🐟 🌸 🌻 🌳 🍀",
  };
  const navigate = (path) => {
    history.pushState(null, "", path);
    window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
  };

  const I = {
    plus: '<path d="M12 5v14M5 12h14"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    more: '<circle cx="12" cy="5" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="19" r="1.4" fill="currentColor"/>',
    clip: '<path d="m20 11-8.5 8.5a5 5 0 0 1-7-7L13 4a3.3 3.3 0 0 1 4.7 4.7L9.2 17.2a1.7 1.7 0 0 1-2.4-2.4L14.5 7"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    send: '<path d="M4 12 20 4l-6 16-3-7z"/><path d="m11 13 9-9"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    reply: '<path d="M10 8 4 13l6 5"/><path d="M4 13h10a6 6 0 0 1 6 6"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4H4v12h4"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
    house: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/>',
    file: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/>',
    check: '<path d="m4 12 5 5 11-11"/>',
    dcheck: '<path d="m2 13 4 4 8-9"/><path d="m10 16 1 1 8-9"/>',
    people: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20a7 7 0 0 1 14 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 4 6"/>',
    leave: '<path d="M14 4h5v16h-5"/><path d="M10 8l-4 4 4 4M6 12h10"/>',
    rename: '<path d="M4 20h16"/><path d="M6 16l9-9 3 3-9 9H6z"/>',
    down: '<path d="M12 5v14"/><path d="m6 13 6 6 6-6"/>',
    smile: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5a4.5 4.5 0 0 0 7 0"/><path d="M9 9.5h.01M15 9.5h.01"/>',
    pin: '<path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
    image: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="m21 16-5-5-8 8"/>',
    forward: '<path d="M14 8l6 5-6 5"/><path d="M20 13H10a6 6 0 0 0-6 6"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    play: '<path d="M8 5v14l11-7z"/>',
    bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    db: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"/>',
    eraser: '<path d="M7 21h12"/><path d="m4.5 14.5 9-9 6 6-7.5 7.5H8z"/><path d="m9 10 6 6"/>',
    eyeoff: '<path d="m3 3 18 18"/><path d="M10.6 6.1A9.7 9.7 0 0 1 12 6c5 0 9 6 9 6a16 16 0 0 1-3.1 3.7M6.5 7.6A16 16 0 0 0 3 12s4 6 9 6a8.8 8.8 0 0 0 3.9-.9"/><path d="M9.9 10a3 3 0 0 0 4.2 4.2"/>',
    phone: '<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18h2"/>',
    alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5h.01"/>',
  };
  const icon = (name, size = 20) =>
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[name]}</svg>`;

  // Profilbilder als abgerundete Quadrate mit Pastell-Hintergrund (round = Kreis, z. B. in Chips)
  const avatar = (name, picture, key, size = 44, isHouse = false, round = false) => {
    const r = round ? "50%" : Math.round(size * 0.36) + "px";
    const st = `width:${size}px;height:${size}px;font-size:${Math.max(9, Math.round(size * 0.36))}px;letter-spacing:-.02em;border-radius:${r};`;
    if (isHouse) return `<span class="av" style="${st}--c:#1d4ed8">${icon("house", Math.round(size * 0.5))}</span>`;
    const img = picture ? `<img src="${esc(picture)}" alt="" onerror="this.remove()">` : "";
    return `<span class="av" style="${st}--c:${colorFor(key)}">${esc(initials(name))}${img}</span>`;
  };

  // ------------------------------------------------------------ Gemeinsamer Client
  class ChatClient {
    static get(hass) {
      let c = window.__haChatClient;
      if (!c || c.conn !== hass.connection) {
        c = new ChatClient(hass);
        window.__haChatClient = c;
      } else c.hass = hass;
      return c;
    }

    constructor(hass) {
      this.hass = hass;
      this.conn = hass.connection;
      this.listeners = new Set();
      this.info = null;
      this.convs = new Map();
      this.msgs = new Map(); // convId -> {list, all, loading}
      this.typing = new Map(); // convId -> {name, until}
      this.focus = null;
      this.lastActivity = Date.now();
      this._trackActivity();
      this.ready = this._init();
    }

    ws(msg) {
      return this.hass.callWS(msg);
    }

    // "Aktiv" = Fenster sichtbar UND im Vordergrund UND in der letzten Minute benutzt.
    // Ein unbeaufsichtigt offener PC markiert dadurch nichts als gelesen, und die
    // Push-Nachricht aufs Handy wird nicht unterdrückt.
    isActive() {
      return document.visibilityState === "visible" && document.hasFocus() && Date.now() - this.lastActivity < 60000;
    }

    _trackActivity() {
      const onAct = () => {
        const was = this.isActive();
        this.lastActivity = Date.now();
        if (!was && this.isActive()) {
          this._sendFocus();
          this.emit();
        }
      };
      for (const ev of ["pointerdown", "keydown", "touchstart", "wheel", "mousemove", "focus"]) {
        window.addEventListener(ev, onAct, { capture: true, passive: true });
      }
      setInterval(() => this._sendFocus(), 15000);
    }

    // Karten melden sich an/ab – "online" ist man nur, solange eine Chat-Karte angezeigt wird.
    attach(listener) {
      this.listeners.add(listener);
      this._sendFocus();
    }

    detach(listener) {
      this.listeners.delete(listener);
      this._sendFocus();
    }

    presence(uid) {
      return this.info?.presence?.[uid] || null;
    }

    // Sprung aus einer Push: ?ha_chat=<id> in der Adresse
    pendingDeepLink() {
      const v = new URLSearchParams(location.search).get("ha_chat");
      return v && /^\d+$/.test(v) ? Number(v) : null;
    }

    consumeDeepLink() {
      const id = this.pendingDeepLink();
      if (id === null) return null;
      try {
        const u = new URL(location.href);
        u.searchParams.delete("ha_chat");
        history.replaceState(history.state, "", u.pathname + u.search + u.hash);
      } catch (e) {
        /* Adresse bleibt unverändert */
      }
      return id;
    }

    // Dem Server melden, auf welchem Dashboard die Karte genutzt wird (Ziel für Pushs)
    // Sprache des Benutzers melden – der Server schreibt Push-Mitteilungen und Fehlermeldungen darin
    reportLanguage(lang) {
      if (!this._subscribed || this._reportedLang === lang) return;
      this._reportedLang = lang;
      this.ws({ type: "ha_chat/set_language", language: lang }).catch(() => { this._reportedLang = null; });
    }

    reportView(kind) {
      if (!this._subscribed) return;
      const path = location.pathname;
      this._reported = this._reported || {};
      if (this._reported[kind] === path) return;
      this._reported[kind] = path;
      this.ws({ type: "ha_chat/view_path", path, kind }).catch(() => { delete this._reported[kind]; });
    }

    async _init() {
      this.info = await this.ws({ type: "ha_chat/info" });
      if (!this.info.allowed) return;
      await this.conn.subscribeMessage((ev) => this._onEvent(ev), { type: "ha_chat/subscribe" });
      this._subscribed = true;
      this._sendFocus(true);
      await this.loadConversations();
      this.conn.addEventListener("ready", () => this._resync());
      document.addEventListener("visibilitychange", () => this._sendFocus());
      // Bild-Links sind 24 h gültig – bei dauerhaft offenen Dashboards (Wandtablet) regelmäßig erneuern
      setInterval(() => this._resync(), 6 * 3600 * 1000);
    }

    async _resync() {
      try {
        this.info = await this.ws({ type: "ha_chat/info" });
        await this.loadConversations();
        for (const id of this.msgs.keys()) await this.loadMessages(id, true);
        this._sendFocus(true);
      } catch (e) {
        /* nächster Versuch beim nächsten Reconnect */
      }
    }

    emit() {
      for (const l of this.listeners) l();
    }

    async loadConversations() {
      const list = await this.ws({ type: "ha_chat/conversations" });
      this.convs = new Map(list.map((c) => [c.id, c]));
      this.emit();
    }

    sortedConversations() {
      return [...this.convs.values()].sort((a, b) => b.updated_at - a.updated_at);
    }

    async loadMessages(convId, force = false) {
      const st = this.msgs.get(convId);
      if (st && !force) return st;
      const list = await this.ws({ type: "ha_chat/messages", conversation_id: convId, limit: 50 });
      const ns = { list, all: list.length < 50, newest: true, loading: false };
      this.msgs.set(convId, ns);
      this.emit();
      return ns;
    }

    // Lädt die Nachrichten rund um eine Fundstelle (Sprung aus der Suche).
    async loadAround(convId, msgId) {
      const list = await this.ws({ type: "ha_chat/messages", conversation_id: convId, around: msgId });
      const idx = list.findIndex((m) => m.id === msgId);
      const ns = { list, all: idx >= 0 && idx < 25, newest: idx < 0 || list.length - idx - 1 < 25, loading: false };
      this.msgs.set(convId, ns);
      this.emit();
      return ns;
    }

    async loadNewer(convId) {
      const st = this.msgs.get(convId);
      if (!st || st.newest || st.loading || !st.list.length) return false;
      st.loading = true;
      try {
        const newer = await this.ws({ type: "ha_chat/messages", conversation_id: convId, after: st.list[st.list.length - 1].id, limit: 50 });
        st.list = [...st.list, ...newer.filter((m) => !st.list.some((x) => x.id === m.id))];
        st.newest = newer.length < 50;
      } finally {
        st.loading = false;
      }
      this.emit();
      return true;
    }

    async loadOlder(convId) {
      const st = this.msgs.get(convId);
      if (!st || st.all || st.loading || !st.list.length) return false;
      st.loading = true;
      try {
        const older = await this.ws({ type: "ha_chat/messages", conversation_id: convId, before: st.list[0].id, limit: 50 });
        st.list = [...older, ...st.list];
        st.all = older.length < 50;
      } finally {
        st.loading = false;
      }
      this.emit();
      return true;
    }

    _onEvent(ev) {
      if (ev.event === "message") {
        const st = this.msgs.get(ev.message.conversation_id);
        // Nur anhängen, wenn das neueste Ende geladen ist (sonst entstünde eine Lücke)
        if (st && st.newest && !st.list.some((m) => m.id === ev.message.id)) st.list.push(ev.message);
        this.typing.delete(ev.message.conversation_id);
      } else if (ev.event === "message_updated") {
        const st = this.msgs.get(ev.message.conversation_id);
        if (st) st.list = st.list.map((m) => (m.id === ev.message.id ? ev.message : m));
      } else if (ev.event === "conversation") {
        this.convs.set(ev.conversation.id, ev.conversation);
      } else if (ev.event === "conversation_removed") {
        this.convs.delete(ev.conversation_id);
        this.msgs.delete(ev.conversation_id);
      } else if (ev.event === "read") {
        const c = this.convs.get(ev.conversation_id);
        if (c) c.members = c.members.map((m) => (m.user_id === ev.user_id ? { ...m, last_read: ev.last_read } : m));
      } else if (ev.event === "messages_hidden") {
        const st = this.msgs.get(ev.conversation_id);
        if (st) st.list = st.list.filter((m) => !ev.message_ids.includes(m.id));
      } else if (ev.event === "history_cleared") {
        const st = this.msgs.get(ev.conversation_id);
        if (st) { st.list = st.list.filter((m) => m.id > ev.upto); st.all = true; }
      } else if (ev.event === "presence") {
        if (this.info) {
          const p = { ...(this.info.presence || {}) };
          if (ev.hidden) delete p[ev.user_id];
          else p[ev.user_id] = { online: ev.online, last_seen: ev.last_seen };
          this.info.presence = p;
        }
      } else if (ev.event === "presence_snapshot") {
        if (this.info) { this.info.presence = ev.presence; this.info.show_presence = ev.show_presence; }
      } else if (ev.event === "users_changed" || ev.event === "resync") {
        clearTimeout(this._usersTimer);
        this._usersTimer = setTimeout(() => this._resync(), 300);
        return;
      } else if (ev.event === "typing") {
        this.typing.set(ev.conversation_id, { name: ev.name, until: Date.now() + 5000 });
        setTimeout(() => this.emit(), 5100);
      }
      this.emit();
    }

    setFocus(convId) {
      this.focus = convId;
      this._sendFocus();
    }

    _sendFocus(force = false) {
      if (!this._subscribed) return;
      const active = this.isActive() && this.listeners.size > 0;
      const value = active ? this.focus : null;
      const key = `${value}|${active}`;
      if (!force && key === this._sentFocus) return;
      this._sentFocus = key;
      this.ws({ type: "ha_chat/focus", conversation_id: value, active }).catch(() => {});
    }

    async markRead(convId) {
      const c = this.convs.get(convId);
      const st = this.msgs.get(convId);
      if (!c || !c.unread || !st || !st.newest || !this.isActive()) return;
      if (this._reading === convId) return;
      this._reading = convId;
      try {
        const last = st.list.length ? st.list[st.list.length - 1].id : null;
        await this.ws({ type: "ha_chat/read", conversation_id: convId, message_id: last });
      } finally {
        this._reading = null;
      }
    }

    async upload(convId, file) {
      const fd = new FormData();
      fd.append("conversation_id", String(convId));
      fd.append("file", file, file.name || "datei");
      const resp = await this.hass.fetchWithAuth("/api/ha_chat/upload", { method: "POST", body: fd });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data.message || T("Upload fehlgeschlagen ({status})", { status: resp.status }));
      return data;
    }

    me() {
      return (this.info?.users || []).find((u) => u.id === this.info?.me) || { id: this.info?.me, name: T("Ich"), picture: null };
    }

    totalUnread() {
      let n = 0;
      for (const c of this.convs.values()) n += c.unread || 0;
      return n;
    }
  }

  // ------------------------------------------------------------ Styles
  const STYLE = `
  :host{display:block}
  [hidden]{display:none!important}
  ha-card{overflow:hidden;height:100%;border-radius:max(var(--ha-card-border-radius,12px),24px)}
  *{box-sizing:border-box}
  button{font:inherit;color:inherit;cursor:pointer}
  .wrap{--hc-bg:var(--card-background-color,#fff);--hc-text:var(--primary-text-color,#212121);--hc-sub:var(--secondary-text-color,#616161);
    --hc-div:var(--divider-color,rgba(0,0,0,.12));--hc-acc:var(--primary-color,#03a9f4);--hc-on-acc:var(--text-primary-color,#fff);
    --hc-chat:color-mix(in srgb,var(--hc-text) 4%,var(--hc-bg));--hc-out:color-mix(in srgb,var(--hc-acc) 22%,var(--hc-bg));
    --hc-in:color-mix(in srgb,var(--hc-text) 2%,var(--hc-bg));--hc-hover:color-mix(in srgb,var(--hc-text) 6%,transparent);
    --hc-sel:color-mix(in srgb,var(--hc-acc) 14%,transparent);
    --hc-panel:color-mix(in srgb,var(--hc-text) 4%,var(--hc-bg));--hc-soft:color-mix(in srgb,var(--hc-acc) 13%,transparent);
    --hc-pat:#efeae2;--hc-dot:rgba(84,101,111,.11);--hc-bin:#ffffff;--hc-bout:color-mix(in srgb,var(--hc-acc) 15%,#ffffff);
    --hc-btext:#111b21;--hc-bmeta:#667781;--hc-tick:#2a9fd6;--hc-day:#ffffff;--hc-dayt:#54656f;--hc-bsh:0 1px .5px rgba(11,20,26,.13);
    position:relative;display:flex;gap:12px;padding:12px;color:var(--hc-text);font-family:var(--paper-font-body1_-_font-family,inherit);min-height:320px}
  .wrap.dark{--hc-pat:#0b141a;--hc-dot:rgba(233,237,239,.06);--hc-bin:#202c33;--hc-bout:color-mix(in srgb,var(--hc-acc) 38%,#111b21);
    --hc-btext:#e9edef;--hc-bmeta:#8696a0;--hc-tick:#53bdeb;--hc-day:#182229;--hc-dayt:#8696a0;--hc-bsh:none}
  .list{width:300px;flex-shrink:0;display:flex;flex-direction:column;gap:10px;min-height:0;background:var(--hc-panel);border-radius:24px;padding:12px}
  .chat{flex:1;display:flex;flex-direction:column;gap:10px;min-width:0;min-height:0}
  .wrap.narrow{padding:6px;gap:6px}
  .wrap.narrow .list{padding:10px;border-radius:22px}
  .wrap.narrow .chat{gap:6px}
  .wrap.narrow .msgs{border-radius:22px}
  .wrap.narrow .chead{padding:2px 2px 0 0}
  .wrap.narrow .ctitle .n{font-size:17px}
  .wrap.narrow .list{width:100%}
  .wrap.narrow.open .list{display:none}
  .wrap.narrow:not(.open) .chat{display:none}
  .wrap:not(.narrow) .backbtn{display:none}
  .head{display:flex;align-items:center;gap:10px;padding:2px 2px 0 4px;min-height:44px}
  .head h2{margin:0;font-size:22px;font-weight:700;letter-spacing:-.3px;flex:1}
  .ib{width:40px;height:40px;border:none;background:transparent;border-radius:14px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--hc-text)}
  .ib:hover{background:var(--hc-hover)}
  .ib.card{background:var(--hc-bg)}
  .ib.pri{background:var(--hc-acc);color:var(--hc-on-acc)}
  .ib.acc{background:var(--hc-acc);color:var(--hc-on-acc);width:44px;height:44px;border-radius:22px}
  .ib.acc:disabled{opacity:.4;cursor:default}
  .ib.soft{background:var(--hc-sel)}
  .infochips{display:flex;gap:6px;flex-wrap:wrap;padding:0 2px}
  .ichip{height:30px;display:inline-flex;align-items:center;gap:6px;padding:0 11px;border-radius:15px;background:var(--hc-bg);font-size:12.5px;font-weight:500}
  .ichip i{width:8px;height:8px;border-radius:50%;background:var(--hc-acc)}.ichip i.on{background:#2e9e47}
  .search{padding:0}
  .search label{display:flex;align-items:center;gap:8px;background:var(--hc-bg);border-radius:20px;padding:0 12px;height:40px;color:var(--hc-sub)}
  .search input{border:none;background:transparent;outline:none;font:inherit;font-size:14px;flex:1;color:var(--hc-text);min-width:0}
  .items{overflow-y:auto;overscroll-behavior:contain;flex:1;display:flex;flex-direction:column;gap:8px;margin:0 -4px;padding:2px 4px}
  .item{display:flex;align-items:center;gap:12px;padding:10px;border:none;background:var(--hc-bg);border-radius:20px;width:100%;text-align:left;flex-shrink:0}
  .item:hover{background:color-mix(in srgb,var(--hc-text) 3%,var(--hc-bg))}.item.sel{box-shadow:0 0 0 2px var(--hc-acc)}
  .item .txt{display:flex;flex-direction:column;gap:3px;flex:1;min-width:0}
  .row{display:flex;align-items:center;gap:6px}
  .name{font-size:15px;font-weight:600;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .time{font-size:12px;color:var(--hc-sub)}.time.new{color:var(--hc-acc);font-weight:500}
  .prev{font-size:13px;color:var(--hc-sub);flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .badge{min-width:20px;height:20px;padding:0 6px;border-radius:10px;background:var(--hc-acc);color:var(--hc-on-acc);font-size:12px;font-weight:700;display:inline-flex;align-items:center;justify-content:center}
  .av{border-radius:50%;flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;font-weight:700;overflow:hidden;
    background:color-mix(in srgb,var(--c,#455a64) 17%,var(--hc-bg));color:color-mix(in srgb,var(--c,#455a64) 66%,var(--hc-text))}
  .av{position:relative}
  .av img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
  .me{border:none;background:transparent;padding:0;border-radius:14px;cursor:pointer;display:inline-flex}
  .me:focus-visible{outline:2px solid var(--hc-acc);outline-offset:2px}
  .prof{display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center}
  .prof .hint{font-size:12px;color:var(--hc-sub)}
  .ctitle{display:flex;flex-direction:column;flex:1;min-width:0}
  .ctitle .n{font-size:18px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .ctitle .s{font-size:13px;color:var(--hc-sub);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .chead{padding:4px 4px 0 6px}.chead .ib:not(.backbtn){background:var(--hc-panel)}
  .ctitle .s.typing{color:var(--success-color,#2e7d32)}
  .msgs{flex:1;overflow-y:auto;overscroll-behavior:contain;overflow-anchor:none;-webkit-overflow-scrolling:touch;border-radius:24px;background-color:var(--hc-pat);
    background-image:radial-gradient(var(--hc-dot) 1.2px,transparent 1.3px),radial-gradient(var(--hc-dot) 1.2px,transparent 1.3px);
    background-size:22px 22px;background-position:0 0,11px 11px;padding:14px 28px;display:flex;flex-direction:column;gap:7px;color:var(--hc-btext)}
  .wrap.narrow .msgs{padding:12px 16px}
  .empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--hc-bmeta);gap:8px;text-align:center;padding:24px;background:transparent}
  .day{align-self:center;font-size:12px;font-weight:500;color:var(--hc-dayt);background:var(--hc-day);padding:5px 12px;border-radius:14px;margin:6px 0;box-shadow:var(--hc-bsh)}
  .m{max-width:min(70%,560px);display:flex;flex-direction:column;position:relative}
  .wrap.narrow .m{max-width:84%}
  .m.in{align-self:flex-start}.m.out{align-self:flex-end}
  .m.react{margin-bottom:12px}
  .b{position:relative;padding:6px 10px;border-radius:16px;box-shadow:var(--hc-bsh);color:var(--hc-btext);cursor:pointer;user-select:text;-webkit-user-select:text}
  .b::before{content:"";position:absolute;top:0;width:8px;height:13px;background:inherit}
  .in .b{background:var(--hc-bin);border-top-left-radius:0}
  .in .b::before{left:-8px;clip-path:polygon(0 0,100% 0,100% 100%)}
  .out .b{background:var(--hc-bout);border-top-right-radius:0}
  .out .b::before{right:-8px;clip-path:polygon(0 0,100% 0,0 100%)}
  .m.sys .b{background:color-mix(in srgb,#ffb300 20%,var(--hc-bin))}
  .sn{font-size:12.8px;font-weight:600;margin-bottom:1px;color:color-mix(in srgb,var(--c,#455a64) 72%,var(--hc-btext))}
  .t{font-size:14.5px;line-height:1.38;white-space:pre-wrap;word-break:break-word;display:flow-root}
  .t a{color:var(--hc-tick)}
  .del{font-style:italic;color:var(--hc-bmeta);font-size:14px}
  .meta{display:flex;justify-content:flex-end;align-items:center;gap:3px;font-size:11px;color:var(--hc-bmeta);margin-top:2px;white-space:nowrap}
  .meta.fl{float:right;display:inline-flex;margin:7px -2px -4px 12px}
  .meta .rd{color:var(--hc-tick)}
  .q{background:color-mix(in srgb,var(--hc-btext) 6%,transparent);box-shadow:inset 4px 0 0 color-mix(in srgb,var(--c,var(--hc-acc)) 80%,var(--hc-btext));border-radius:12px;padding:5px 9px 5px 13px;margin-bottom:5px;font-size:12.8px;cursor:pointer}
  .q b{display:block;font-size:12.5px;font-weight:600;color:color-mix(in srgb,var(--c,var(--hc-acc)) 72%,var(--hc-btext))}
  .q span{color:var(--hc-bmeta);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
  .media{display:block;max-width:100%;max-height:320px;border-radius:12px;margin:2px 0 4px;background:#0002}
  img.media{cursor:zoom-in}
  .fileatt{display:flex;align-items:center;gap:10px;padding:8px;border-radius:12px;background:color-mix(in srgb,var(--hc-btext) 6%,transparent);margin-bottom:4px;text-decoration:none;color:inherit}
  .fileatt small{display:block;color:var(--hc-bmeta)}
  .rx{position:absolute;bottom:-14px;display:flex;gap:2px;background:var(--hc-bin);color:var(--hc-btext);border:none;box-shadow:0 1px 2px rgba(11,20,26,.25);border-radius:12px;padding:1px 7px;font-size:13px;cursor:pointer;white-space:nowrap}
  .in .rx{left:10px}.out .rx{right:10px}
  .rx .c{font-size:11px;color:var(--hc-bmeta);margin-left:2px;align-self:center}
  .typing-dots{align-self:flex-start;background:var(--hc-bin);box-shadow:var(--hc-bsh);border-radius:16px;padding:10px 14px;display:flex;gap:4px}
  .typing-dots i{width:7px;height:7px;border-radius:50%;background:var(--hc-bmeta);animation:hcb 1.2s infinite}
  .typing-dots i:nth-child(2){animation-delay:.2s}.typing-dots i:nth-child(3){animation-delay:.4s}
  @keyframes hcb{0%,60%,100%{opacity:.3}30%{opacity:1}}
  .bar{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:20px;background:var(--hc-panel)}
  .bar .q{flex:1;margin:0;cursor:default}
  .composer{display:flex;align-items:flex-end;gap:8px;padding:0 2px 2px}
  .composer .ib:not(.acc){width:44px;height:44px;border-radius:22px;background:var(--hc-soft);color:var(--hc-acc)}
  .composer textarea{flex:1;resize:none;min-height:44px;max-height:140px;border-radius:22px;border:none;padding:11px 16px;font:inherit;font-size:15px;line-height:1.35;outline:none;background:var(--hc-panel);color:var(--hc-text)}
  .composer textarea:focus{box-shadow:0 0 0 2px color-mix(in srgb,var(--hc-acc) 45%,transparent)}
  .err{position:absolute;left:50%;transform:translateX(-50%);bottom:76px;background:#c62828;color:#fff;padding:8px 14px;border-radius:14px;font-size:13px;z-index:5;max-width:90%}
  .ov{position:absolute;inset:0;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;z-index:10;padding:16px}
  .dlg{background:var(--hc-bg);color:var(--hc-text);border-radius:26px;width:min(380px,100%);max-height:100%;overflow:auto;padding:16px;display:flex;flex-direction:column;gap:12px;box-shadow:0 8px 28px rgba(0,0,0,.3)}
  .dlg h3{margin:0;font-size:18px;font-weight:500}
  .rxrow{display:flex;justify-content:space-between;gap:4px}
  .rxrow button{font-size:24px;width:44px;height:44px;border-radius:22px;border:none;background:var(--hc-chat)}
  .rxrow button.on{background:var(--hc-sel);outline:2px solid var(--hc-acc)}
  .act{display:flex;align-items:center;gap:12px;padding:10px 8px;border:none;background:transparent;border-radius:14px;text-align:left;font-size:15px;width:100%;min-height:44px}
  .act:hover{background:var(--hc-hover)}.act.danger{color:var(--error-color,#c62828)}
  .chk{display:flex;align-items:center;gap:12px;padding:6px 4px;min-height:44px;cursor:pointer}
  .chk input{width:20px;height:20px;accent-color:var(--hc-acc)}
  .inp{height:44px;border-radius:14px;border:1px solid var(--hc-div);padding:0 12px;font:inherit;font-size:15px;background:var(--hc-bg);color:var(--hc-text);outline:none;width:100%}
  .btns{display:flex;justify-content:flex-end;gap:8px}
  .btn{height:40px;padding:0 18px;border-radius:20px;border:none;font-weight:500;background:var(--hc-panel)}
  .btn.p{background:var(--hc-acc);color:var(--hc-on-acc)}
  .sp{position:absolute;inset:0;z-index:15;background:var(--hc-bg);display:flex;flex-direction:column}
  .sp .bar2{display:flex;align-items:center;gap:6px;padding:8px 10px;border-bottom:1px solid var(--hc-div)}
  .sp .bar2 label{flex:1;display:flex;align-items:center;gap:8px;background:var(--hc-chat);border-radius:20px;padding:0 14px;height:42px;color:var(--hc-sub)}
  .sp .bar2 input{border:none;background:transparent;outline:none;font:inherit;font-size:15px;flex:1;color:var(--hc-text);min-width:0}
  .sp .scope{display:flex;gap:8px;padding:8px 14px;flex-wrap:wrap}
  .chipb{height:32px;padding:0 14px;border-radius:16px;border:1px solid var(--hc-div);background:transparent;font-size:13px}
  .chipb.on{background:var(--hc-acc);color:var(--hc-on-acc);border-color:var(--hc-acc)}
  .sp .res{flex:1;overflow-y:auto}
  .hit{display:flex;gap:12px;padding:10px 14px;border:none;background:transparent;width:100%;text-align:left;align-items:flex-start}
  .hit:hover{background:var(--hc-hover)}
  .hit .txt{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}
  .hit .snip{font-size:13.5px;color:var(--hc-sub);line-height:1.4;word-break:break-word}
  .hit mark{background:color-mix(in srgb,var(--hc-acc) 30%,transparent);color:var(--hc-text);border-radius:3px;padding:0 1px}
  .sp .note{padding:24px;text-align:center;color:var(--hc-sub);font-size:14px}
  .msearch{display:flex;align-items:center;gap:8px;padding:10px 12px;border:none;background:var(--hc-bg);border-radius:20px;width:100%;text-align:left;color:var(--hc-acc);font-size:14px;flex-shrink:0}
  .flash .b{animation:hcflash 1.8s ease}
  @keyframes hcflash{0%,40%{box-shadow:0 0 0 3px var(--hc-acc)}100%{box-shadow:0 1px 1px rgba(0,0,0,.06)}}
  .tolatest{position:absolute;right:20px;bottom:70px;z-index:4;width:44px;height:44px;border-radius:22px;border:1px solid var(--hc-div);background:var(--hc-bg);color:var(--hc-text);box-shadow:0 2px 8px rgba(0,0,0,.18);display:flex;align-items:center;justify-content:center}
  .chat{position:relative}
  .tray{border-radius:20px;background:var(--hc-panel);padding:8px 12px;display:flex;flex-direction:column;gap:6px}
  .thumbs{display:flex;gap:8px;overflow-x:auto;padding-bottom:2px}
  .th{position:relative;width:84px;flex-shrink:0;display:flex;flex-direction:column;gap:1px}
  .th .pv{width:84px;height:84px;border-radius:12px;overflow:hidden;background:var(--hc-chat);display:flex;align-items:center;justify-content:center;color:var(--hc-sub)}
  .th .pv img,.th .pv video{width:100%;height:100%;object-fit:cover}
  .th .nm{font-size:10.5px;color:var(--hc-sub);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .th .x{position:absolute;top:-6px;right:-6px;width:24px;height:24px;border-radius:12px;border:none;background:var(--hc-text);color:var(--hc-bg);display:flex;align-items:center;justify-content:center}
  .trow{display:flex;align-items:center;gap:10px;font-size:12.5px;color:var(--hc-sub)}
  .trow label{display:flex;align-items:center;gap:6px;cursor:pointer}
  .chat.dropping::after{content:attr(data-drop);position:absolute;inset:8px;border:2px dashed var(--hc-acc);border-radius:12px;background:color-mix(in srgb,var(--hc-acc) 10%,var(--hc-bg));display:flex;align-items:center;justify-content:center;font-size:16px;color:var(--hc-acc);z-index:6}
  .pop{position:absolute;left:4px;right:4px;bottom:56px;z-index:7;background:var(--hc-bg);border:1px solid var(--hc-div);border-radius:18px;box-shadow:0 6px 20px rgba(0,0,0,.18);max-height:260px;overflow-y:auto}
  .emo{padding:6px 8px}
  .emo h4{margin:8px 4px 4px;font-size:12px;font-weight:500;color:var(--hc-sub)}
  .emo .g{display:grid;grid-template-columns:repeat(auto-fill,minmax(40px,1fr))}
  .emo button{font-size:24px;height:42px;border:none;background:transparent;border-radius:8px;font-family:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif}
  .emo button:hover{background:var(--hc-hover)}
  .mlist button{display:flex;align-items:center;gap:10px;width:100%;padding:8px 12px;border:none;background:transparent;text-align:left;font-size:14px;min-height:44px}
  .mlist button:hover{background:var(--hc-hover)}
  .mention{color:var(--hc-acc);font-weight:500}
  .m.mentioned .b{outline:2px solid color-mix(in srgb,var(--hc-acc) 45%,transparent)}
  .fwd{display:flex;align-items:center;gap:4px;font-size:12px;font-style:italic;color:var(--hc-bmeta);margin-bottom:2px}
  .qbtns{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}
  .qb{min-height:36px;padding:0 14px;border-radius:18px;border:1px solid var(--hc-acc);background:transparent;color:inherit;font-size:14px;font-weight:500}
  .qb.on{background:var(--hc-acc);color:var(--hc-on-acc)}
  .qb:disabled{cursor:default}
  .qb:disabled:not(.on){opacity:.45}
  .ans{font-size:12px;color:var(--hc-bmeta);margin-top:4px}
  .loc{display:flex;flex-direction:column;gap:4px;text-decoration:none;color:inherit;margin-bottom:4px}
  .lt{display:flex;flex-direction:column}.lt small{color:var(--hc-bmeta);font-size:11.5px}
  .map{position:relative;display:block;overflow:hidden;border-radius:12px;background:color-mix(in srgb,#4caf50 12%,var(--hc-chat));max-width:100%}
  .map .tiles{position:absolute;width:768px;height:768px}
  .map .tiles img{position:absolute;width:256px;height:256px}
  .map .pin{position:absolute;left:50%;top:50%;transform:translate(-50%,-100%);color:#d32f2f;filter:drop-shadow(0 1px 1px rgba(0,0,0,.4))}
  .map .pin svg{fill:#d32f2f;stroke:#fff;stroke-width:1.5}
  .map .acc{position:absolute;border-radius:50%;background:rgba(3,169,244,.18);border:1px solid rgba(3,169,244,.6)}
  .map .osm{position:absolute;right:2px;bottom:1px;font-size:9px;background:rgba(255,255,255,.75);color:#333;padding:0 3px;border-radius:3px}
  .locbox{display:flex;flex-direction:column;gap:10px;font-size:14px}
  .locsrc{display:flex;gap:8px;align-items:flex-start;font-size:13px;color:var(--hc-sub)}
  .locsrc b{color:var(--hc-text);font-weight:500}
  .warn{background:color-mix(in srgb,#ff9800 16%,var(--hc-bg));border-radius:12px;padding:8px 10px;font-size:13px}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:4px;padding:8px}
  .grid button{aspect-ratio:1;border:none;padding:0;background:var(--hc-chat);border-radius:10px;overflow:hidden;color:var(--hc-sub);display:flex;align-items:center;justify-content:center}
  .grid img{width:100%;height:100%;object-fit:cover}
  .toast{position:absolute;left:50%;transform:translateX(-50%);bottom:76px;background:var(--hc-text);color:var(--hc-bg);padding:8px 14px;border-radius:14px;font-size:13px;z-index:30}
  .viewer{position:absolute;inset:0;background:rgba(0,0,0,.92);z-index:20;display:flex;flex-direction:column}
  .viewer .vb{display:flex;justify-content:flex-end;gap:6px;padding:8px}
  .viewer .vb a,.viewer .vb button{color:#fff}
  .viewer img{flex:1;min-height:0;object-fit:contain;width:100%}
  .info{padding:24px;color:var(--hc-sub);text-align:center}
  .m.imp .b{box-shadow:0 0 0 2px color-mix(in srgb,#d32f2f 55%,transparent)}
  .impl{display:flex;align-items:center;gap:4px;font-size:12px;font-weight:700;color:#d32f2f;margin-bottom:2px}
  .prio{color:#d32f2f;font-size:13px;gap:8px}
  .prio span{flex:1;line-height:1.35}.prio span small{display:block;color:var(--hc-sub);font-size:12px}
  .ib.acc.imp{background:#d32f2f}
  .act.on{background:color-mix(in srgb,#d32f2f 12%,transparent);color:#c62828}
  .act small{display:block;font-size:12px;color:var(--hc-sub);margin-top:1px}
  .ver{flex-shrink:0;padding:0 4px;text-align:right;font-size:10.5px;line-height:14px;color:var(--hc-sub);opacity:.7;user-select:text}
  .ver.warn{opacity:1;text-align:left}
  .ver button{border:none;background:transparent;padding:2px 0;font:inherit;font-size:11.5px;color:#e65100;text-decoration:underline;cursor:pointer;text-align:left}
  .avw{position:relative;display:inline-flex;flex-shrink:0}
  .avw .dot{position:absolute;right:-3px;bottom:-3px;width:14px;height:14px;border-radius:50%;background:#2e9e47;border:2.5px solid var(--hc-bg)}
  .ctitle .s.on{color:var(--success-color,#2e7d32)}
  .tap{display:flex;align-items:center;gap:10px;flex:1;min-width:0;border:none;background:transparent;padding:2px 4px;margin-left:-4px;text-align:left;border-radius:10px}
  .tap:hover{background:var(--hc-hover)}
  .gi .desc{white-space:pre-wrap;word-break:break-word;font-size:14px;line-height:1.45;text-align:left;width:100%;background:var(--hc-chat);border-radius:14px;padding:8px 12px}
  .gi .desc a{color:var(--hc-acc)}
  .gi .desc.none{color:var(--hc-sub);font-style:italic;text-align:center}
  .gi .st{font-size:13px;color:var(--hc-sub)}.gi .st.on{color:var(--success-color,#2e7d32)}
  textarea.inp{height:auto;min-height:110px;padding:10px 12px;resize:vertical;line-height:1.4}
  .cnt{font-size:11px;color:var(--hc-sub);text-align:right;margin-top:-6px}
  .sub2{font-size:13px;color:var(--hc-sub);line-height:1.45;margin-top:-4px}
  .tog{display:flex;align-items:flex-start;gap:12px;padding:8px;min-height:44px;cursor:pointer;border-radius:12px;font-size:15px}
  .tog:hover{background:var(--hc-hover)}
  .tog input{width:20px;height:20px;margin-top:2px;flex-shrink:0;accent-color:var(--hc-acc)}
  .tog small{display:block;color:var(--hc-sub);font-size:12px;line-height:1.4;margin-top:2px}
  .mst{font-size:12px;color:var(--hc-sub)}.mst.on{color:var(--success-color,#2e7d32)}
  .adm .res{padding-bottom:16px}
  .adm .tot{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;padding:12px 14px}
  .adm .tile{background:var(--hc-chat);border-radius:16px;padding:10px 12px;display:flex;flex-direction:column;gap:2px}
  .adm .tile b{font-size:18px;font-weight:500}.adm .tile span{font-size:12px;color:var(--hc-sub)}
  .adm .sec{padding:8px 14px;font-size:13px;color:var(--hc-sub);display:flex;align-items:center;gap:8px;flex-wrap:wrap;line-height:1.45}
  .adm h4{margin:12px 14px 4px;font-size:14px;font-weight:500}
  .adm .crow{display:flex;gap:12px;padding:10px 14px;border-top:1px solid var(--hc-div);align-items:flex-start}
  .adm .crow .txt{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}
  .adm .crow .snip{font-size:13px;color:var(--hc-sub);line-height:1.4}
  .adm .acts{display:flex;gap:6px;flex-wrap:wrap;margin-top:4px}
  .chipb.danger{color:var(--error-color,#c62828);border-color:color-mix(in srgb,var(--error-color,#c62828) 45%,transparent)}
  .adm select{height:32px;border-radius:16px;border:1px solid var(--hc-div);background:var(--hc-bg);color:var(--hc-text);padding:0 10px;font:inherit;font-size:13px}
  .dev{display:flex;align-items:center;gap:6px;font-size:13px;flex-wrap:wrap}
  .ok{color:var(--success-color,#2e7d32)}.bad{color:var(--error-color,#c62828)}
  .tips{font-size:13px;line-height:1.5;padding-left:20px;margin:4px 0 8px}
  .tips li{margin-bottom:3px}
  details.tipbox{background:var(--hc-chat);border-radius:14px;padding:8px 12px;font-size:14px}
  details.tipbox summary{cursor:pointer;font-weight:500;min-height:28px;display:flex;align-items:center}
  /* iPhone vergrößert die Seite, wenn ein Eingabefeld kleiner als 16 px ist – deshalb auf Touch-Geräten 16 px */
  @media (pointer:coarse){.composer textarea,.search input,.sp .bar2 input,.inp,.qr input,.adm select{font-size:16px}}
  `;

  // ------------------------------------------------------------ Vollständige Chat-Karte
  class HaChatCard extends HTMLElement {
    static getStubConfig() {
      return { height: "600px" };
    }

    static getConfigForm() {
      return {
        schema: [
          { name: "language", selector: { select: { mode: "dropdown", options: LANG_OPTIONS() } } },
          { name: "height", selector: { text: {} } },
          { name: "fit_screen", default: true, selector: { boolean: {} } },
        ],
        computeLabel: (s) => FORM_LABELS()[s.name],
        computeHelper: (s) => FORM_HELPERS()[s.name],
      };
    }

    setConfig(config) {
      this.config = { height: "600px", ...(config || {}) };
      this._syncLang(this._hass);
      if (this._wrap) { this._wrap.style.height = this.config.height; this._fit(); }
    }

    getCardSize() {
      return 10;
    }

    // Sprache bestimmen; hat sie sich seit dem letzten Zeichnen geändert, alles neu beschriften
    _syncLang(hass) {
      setLang(hass, this.config?.language);
      const prev = this._lang;
      this._lang = I18N.lang;
      if (prev && prev !== I18N.lang && this._wrap) this._relabel();
    }

    // Nach einem Sprachwechsel: feste Beschriftungen neu setzen und alles neu zeichnen
    _relabel() {
      const root = this.shadowRoot;
      if (!root || !this._wrap) return;
      const set = (sel, attrs) => { const el = root.querySelector(sel); if (el) for (const [k, v] of Object.entries(attrs)) k === "text" ? (el.textContent = v) : el.setAttribute(k, v); };
      set(".list .head h2", { text: T("Chat") });
      set('[data-a="search-all"]', { "aria-label": T("Nachrichten durchsuchen"), title: T("Nachrichten durchsuchen") });
      set('[data-a="new"]', { "aria-label": T("Neuer Chat"), title: T("Neuer Chat") });
      set(".search input", { placeholder: T("Chats durchsuchen"), "aria-label": T("Chats durchsuchen") });
      set('[data-a="latest"]', { "aria-label": T("Zu den neuesten Nachrichten"), title: T("Zu den neuesten Nachrichten") });
      set('[data-a="attachmenu"]', { "aria-label": T("Anhängen: Kamera, Fotos, Datei oder Standort"), title: T("Anhängen") });
      set('[data-a="emoji"]', { "aria-label": T("Emoji einfügen"), title: T("Emoji") });
      set("section.chat", { "data-drop": T("Dateien hier ablegen") });
      this._setImportant(this._important);
      for (const el of root.querySelectorAll("[data-sig]")) delete el.dataset.sig;
      if (this.$msgs && this._openId) { this.$msgs.innerHTML = ""; this._forceBottom = true; this._stick = true; }
      if (this._ready) this._client.reportLanguage(I18N.lang);
      this._schedule();
    }

    getGridOptions() {
      return { columns: 12, rows: 10, min_columns: 6, min_rows: 6 };
    }

    set hass(hass) {
      this._hass = hass;
      this._applyTheme(hass);
      this._syncLang(hass);
      if (!this._client) {
        this._client = ChatClient.get(hass);
        this._build();
        this._listener = () => this._schedule();
        this._client.attach(this._listener);
        this._client.ready
          .then(() => {
            this._ready = true;
            this._client.reportLanguage(I18N.lang);
            const want = this.config?.open_conversation;
            if (want && this._client.convs.has(Number(want))) this._open(Number(want));
            else this._checkDeepLink();
            this._reportView();
            this._schedule();
          })
          .catch((e) => {
            this._fatal = e?.code === "unknown_command"
              ? T("Die Integration „HA Chat“ ist noch nicht eingerichtet (Einstellungen → Geräte & Dienste).")
              : e?.message || String(e);
            this._schedule();
          });
      } else {
        this._client.hass = hass;
      }
    }

    connectedCallback() {
      if (this._client && this._listener) this._client.attach(this._listener);
      this._ro?.observe(this);
      if (this.$msgs) this._msgsRo?.observe(this.$msgs);
      if (this._openId) this._client?.setFocus(this._openId);
      if (!this._navHandler) {
        // Push angetippt, während die App schon offen war: Adresse ändert sich ohne Neuladen
        this._navHandler = () => setTimeout(() => this._checkDeepLink(), 60);
      }
      if (!this._fitHandler) {
        this._fitHandler = () => { this._insets = null; cancelAnimationFrame(this._fitRaf); this._fitRaf = requestAnimationFrame(() => this._wrap && this._fit()); };
      }
      window.addEventListener("resize", this._fitHandler);
      window.addEventListener("orientationchange", this._fitHandler);
      window.visualViewport?.addEventListener("resize", this._fitHandler);
      setTimeout(this._fitHandler, 300);
      window.addEventListener("location-changed", this._navHandler);
      window.addEventListener("popstate", this._navHandler);
      document.addEventListener("visibilitychange", this._navHandler);
      if (this._ready) { this._checkDeepLink(); this._reportView(); }
    }

    disconnectedCallback() {
      this._client?.detach(this._listener);
      window.removeEventListener("location-changed", this._navHandler);
      window.removeEventListener("popstate", this._navHandler);
      document.removeEventListener("visibilitychange", this._navHandler);
      window.removeEventListener("resize", this._fitHandler);
      window.removeEventListener("orientationchange", this._fitHandler);
      window.visualViewport?.removeEventListener("resize", this._fitHandler);
      this._ro?.disconnect();
      this._msgsRo?.disconnect();
      if (this._client && this._client.focus === this._openId) this._client.setFocus(null);
    }

    _build() {
      const root = this.attachShadow({ mode: "open" });
      root.innerHTML = `<style>${STYLE}</style>
      <ha-card><div class="wrap" style="height:${esc(this.config?.height || "600px")}">
        <section class="list">
          <div class="head"><span class="mebox"></span><h2>${T("Chat")}</h2>
            <button class="ib card" data-a="search-all" aria-label="${T("Nachrichten durchsuchen")}" title="${T("Nachrichten durchsuchen")}">${icon("search")}</button>
            <button class="ib pri" data-a="new" aria-label="${T("Neuer Chat")}" title="${T("Neuer Chat")}">${icon("plus")}</button></div>
          <div class="infochips" hidden></div>
          <div class="search"><label>${icon("search", 18)}<input type="search" placeholder="${T("Chats durchsuchen")}" aria-label="${T("Chats durchsuchen")}"></label></div>
          <div class="items" role="list"></div>
          <div class="ver"></div>
        </section>
        <section class="chat" data-drop="${T("Dateien hier ablegen")}">
          <div class="head chead"></div>
          <div class="msgs" aria-live="polite"></div>
          <button class="tolatest" data-a="latest" aria-label="${T("Zu den neuesten Nachrichten")}" title="${T("Zu den neuesten Nachrichten")}" hidden>${icon("down")}</button>
          <div class="bar replybar" hidden></div>
          <div class="tray" hidden></div>
          <div class="bar prio" hidden></div>
          <div class="pop emo" hidden></div>
          <div class="pop mlist" hidden></div>
          <div class="composer">
            <button class="ib" data-a="attachmenu" aria-label="${T("Anhängen: Kamera, Fotos, Datei oder Standort")}" title="${T("Anhängen")}">${icon("clip")}</button>
            <button class="ib" data-a="emoji" aria-label="${T("Emoji einfügen")}" title="${T("Emoji")}">${icon("smile")}</button>
            <textarea rows="1" placeholder="${T("Nachricht schreiben")}" aria-label="${T("Nachricht schreiben")}"></textarea>
            <button class="ib acc" data-a="primary" aria-label="${T("Senden")}" disabled>${icon("send")}</button>
          </div>
          <input type="file" class="fin" multiple hidden>
          <input type="file" class="cin" accept="image/*" capture="environment" hidden>
          <input type="file" class="gin" accept="image/*,video/*" multiple hidden>
        </section>
        <div class="layer"></div>
      </div></ha-card>`;
      const $ = (s) => root.querySelector(s);
      this._wrap = $(".wrap");
      this.$items = $(".items");
      this.$mebox = $(".mebox");
      this.$ver = $(".ver");
      this.$chips = $(".infochips");
      this.$search = $(".search input");
      this.$chead = $(".chead");
      this.$msgs = $(".msgs");
      this.$reply = $(".replybar");
      this.$latest = $(".tolatest");
      this.$composer = $(".composer");
      this.$ta = $("textarea");
      this.$primary = $('[data-a="primary"]');
      this.$fin = $(".fin");
      this.$cin = $(".cin");
      this.$gin = $(".gin");
      this.$tray = $(".tray");
      this.$prio = $(".prio");
      this.$emo = $(".emo");
      this.$mlist = $(".mlist");
      this.$chatSec = $(".chat");
      this._staged = [];
      this.$layer = $(".layer");

      root.addEventListener("click", (e) => this._onClick(e));
      root.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && this.$layer.firstElementChild) { e.stopPropagation(); this._closeLayer(); }
      });
      root.addEventListener("contextmenu", (e) => {
        const b = e.target.closest(".b");
        if (b) {
          e.preventDefault();
          this._messageMenu(Number(b.closest(".m").dataset.id));
        }
      });
      this.$search.addEventListener("input", () => this._renderList());
      this.$ta.addEventListener("input", () => this._onType());
      this.$ta.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey && !e.isComposing && !this._isTouch()) {
          e.preventDefault();
          this._send();
        }
        if (e.key === "Escape") this._clearMode();
      });
      this.$msgs.addEventListener("scroll", () => this._onMsgsScroll(), { passive: true });
      // Größe des Verlaufs ändert sich (Tastatur, Drehen, Karte wird sichtbar): unten bleiben bzw. Position halten
      this._msgsRo = new ResizeObserver(() => this._keepPosition());
      this._msgsRo.observe(this.$msgs);
      for (const inp of [this.$fin, this.$cin, this.$gin]) {
        inp.addEventListener("change", () => { const files = [...(inp.files || [])]; inp.value = ""; this._stageFiles(files); });
      }
      // Am PC: Dateien ins Chatfenster ziehen oder mit Strg+V einfügen
      this.$chatSec.addEventListener("dragover", (e) => {
        if (!this._openId || ![...(e.dataTransfer?.types || [])].includes("Files")) return;
        e.preventDefault();
        this.$chatSec.classList.add("dropping");
      });
      this.$chatSec.addEventListener("dragleave", (e) => { if (e.target === this.$chatSec || !this.$chatSec.contains(e.relatedTarget)) this.$chatSec.classList.remove("dropping"); });
      this.$chatSec.addEventListener("drop", (e) => {
        this.$chatSec.classList.remove("dropping");
        const files = [...(e.dataTransfer?.files || [])];
        if (!files.length || !this._openId) return;
        e.preventDefault();
        this._stageFiles(files);
      });
      this.$ta.addEventListener("paste", (e) => {
        const files = [...(e.clipboardData?.files || [])];
        if (files.length) { e.preventDefault(); this._stageFiles(files); }
      });
      this.$ta.addEventListener("focus", () => {
        if (!this._wrap.classList.contains("narrow")) return;
        // Bildschirmtastatur: nach dem Einblenden zu den neuesten Nachrichten
        setTimeout(() => {
          const st = this._openId && this._client.msgs.get(this._openId);
          if (st?.newest) { this.$msgs.scrollTop = this.$msgs.scrollHeight; this._stick = true; }
        }, 350);
      });
      this.$ta.addEventListener("blur", () => {
        if (!this._wrap.classList.contains("narrow") || !this._isTouch()) return;
        setTimeout(() => { if (!this.shadowRoot.activeElement) this._revealCard(); }, 400);
      });
      this.$ta.addEventListener("keyup", () => this._checkMention());
      this.$ta.addEventListener("click", () => this._checkMention());
      this.$tray.addEventListener("change", (e) => { if (e.target.matches(".origchk")) this._original = e.target.checked; });
      this._ro = new ResizeObserver(() => this._layout());
      this._ro.observe(this);
      this._layout();
    }

    _isTouch() {
      return window.matchMedia?.("(pointer: coarse)").matches;
    }

    _applyTheme(hass) {
      if (!this._wrap) return void setTimeout(() => this._wrap && this._applyTheme(hass), 0);
      this._wrap.classList.toggle("dark", !!hass?.themes?.darkMode);
    }

    _reportView() {
      if (this.isConnected) this._client?.reportView(this.config?._popup ? "compact" : "card");
    }

    async _checkDeepLink() {
      if (!this._ready || !this.isConnected || this.config?._popup || this._client.pendingDeepLink() === null) return;
      const id = this._client.consumeDeepLink();
      if (!this._client.convs.has(id)) await this._client.loadConversations().catch(() => {});
      if (!this._client.convs.has(id)) return;
      this._closeLayer();
      this._open(id);
      if (this._wrap?.classList.contains("narrow")) this._revealCard();
      else this.scrollIntoView?.({ block: "nearest" });
    }

    _layout() {
      const w = this.getBoundingClientRect().width || this.offsetWidth;
      const narrow = w > 0 && w < 640;
      this._wrap.classList.toggle("narrow", narrow);
      this._wrap.classList.toggle("open", !!this._openId);
      this._fit();
    }

    // Auf dem Handy (schmale Karte) füllt der Chat genau den sichtbaren Bildschirm – unabhängig
    // von der eingestellten Höhe. Abschaltbar mit "fit_screen: false" in der Kartenkonfiguration.
    _fit() {
      if (!this._wrap) return;
      const narrow = this._wrap.classList.contains("narrow");
      if (!narrow || this.config?.fit_screen === false || this.config?._popup) {
        const want = this.config?.height || "600px";
        if (this._wrap.style.height !== want) this._wrap.style.height = want;
        return;
      }
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const top = this.getBoundingClientRect().top + (window.scrollY || 0);
      // Unten frei lassen: beim iPhone ohne Home-Taste den Bereich der Wischleiste bzw. der
      // abgerundeten Displayecken (safe-area-inset-bottom), damit die runden Kartenecken ganz sichtbar sind
      const ins = this._safeInsets();
      const gap = Math.max(8, Math.round(ins.bottom) + 6);
      let h;
      if (top >= 0 && top < vh * 0.45) {
        // Karte steht oben (z. B. Dashboard "Chat"): bis kurz über den unteren Bildschirmrand
        h = vh - top - gap;
      } else {
        // Karte weiter unten: genau eine Bildschirmhöhe unterhalb der Kopfleiste
        const header = parseFloat(getComputedStyle(this).getPropertyValue("--header-height")) || 56;
        h = vh - header - ins.top - 8 - gap;
      }
      h = Math.max(380, Math.round(h));
      if (this._wrap.style.height !== h + "px") {
        const box = this.$msgs;
        const atBottom = box && box.scrollHeight - box.scrollTop - box.clientHeight < 80;
        this._wrap.style.height = h + "px";
        if (atBottom) box.scrollTop = box.scrollHeight;
      }
    }

    // Abstände zu Notch/Statusleiste (oben) und Wischleiste/runden Displayecken (unten) in Pixeln.
    // Wird bei Größen- oder Ausrichtungswechsel neu gemessen.
    _safeInsets() {
      if (this._insets) return this._insets;
      const probe = document.createElement("div");
      probe.style.cssText = "position:fixed;top:0;left:0;width:0;height:0;padding:env(safe-area-inset-top,0px) 0 env(safe-area-inset-bottom,0px) 0;visibility:hidden;pointer-events:none";
      document.body.appendChild(probe);
      const cs = getComputedStyle(probe);
      let top = parseFloat(cs.paddingTop) || 0;
      let bottom = parseFloat(cs.paddingBottom) || 0;
      probe.remove();
      // Manche HA-Versionen/Apps liefern die Werte zusätzlich als CSS-Variablen
      const rs = getComputedStyle(document.documentElement);
      top = Math.max(top, parseFloat(rs.getPropertyValue("--safe-area-inset-top")) || 0);
      bottom = Math.max(bottom, parseFloat(rs.getPropertyValue("--safe-area-inset-bottom")) || 0);
      return (this._insets = { top, bottom });
    }
    _schedule() {
      if (this._raf) return;
      this._raf = requestAnimationFrame(() => {
        this._raf = null;
        this._render();
      });
    }

    _render() {
      if (this._fatal || (this._client?.info && !this._client.info.allowed)) {
        const text = this._fatal || T("Du bist für den Chat nicht freigeschaltet. Ein Administrator kann dich unter Einstellungen → Geräte & Dienste → HA Chat → Konfigurieren hinzufügen.");
        this._wrap.innerHTML = `<div class="info" style="width:100%">${esc(text)}</div>`;
        return;
      }
      if (!this._ready) return;
      if (this._openId && !this._client.convs.has(this._openId)) this._open(null);
      this._renderMe();
      this._renderVersion();
      this._renderChips();
      this._renderList();
      this._renderChat();
    }

    // Versionsnummer ganz klein unter der Chatliste. Passt die geladene Karte nicht zur
    // installierten Integration (alte Karte noch im App-Speicher), Hinweis mit "neu laden".
    _renderVersion() {
      const server = this._client.info?.version;
      const mismatch = !!server && server !== VERSION;
      const sig = `${VERSION}|${server}`;
      if (this.$ver.dataset.sig === sig) return;
      this.$ver.dataset.sig = sig;
      this.$ver.classList.toggle("warn", mismatch);
      this.$ver.innerHTML = mismatch
        ? `<button data-a="reload" title="${T("Seite bzw. App neu laden")}">${esc(T("Karte {card} ≠ Integration {server} · neu laden", { card: VERSION, server }))}</button>`
        : `<span title="${T("Version der Chat-Karte")}">HA Chat ${esc(VERSION)}</span>`;
      this.$ver.insertAdjacentHTML("beforeend", `<span class="cpy"> · © U. Hartung</span>`);
    }

    _renderMe() {
      const me = this._client.me();
      const sig = JSON.stringify([me.name, me.picture]);
      if (this.$mebox.dataset.sig === sig) return;
      this.$mebox.dataset.sig = sig;
      this.$mebox.innerHTML = `<button class="me" data-a="profile" aria-label="${T("Mein Profil")}: ${esc(me.name)}" title="${T("Mein Profil")}">${avatar(me.name, me.picture, me.id, 36)}</button>`;
    }

    _renderChips() {
      const unread = this._client.totalUnread();
      const online = Object.values(this._client.info?.presence || {}).filter((p) => p?.online).length;
      const html = (unread ? `<span class="ichip"><i></i>${T("{n} ungelesen", { n: unread })}</span>` : "")
        + (online ? `<span class="ichip"><i class="on"></i>${T("{n} online", { n: online })}</span>` : "");
      if (this.$chips.dataset.sig === html) return;
      this.$chips.dataset.sig = html;
      this.$chips.innerHTML = html;
      this.$chips.hidden = !html;
    }

    // --------------------------------------------------------- Liste
    _renderList() {
      const q = this.$search.value.trim().toLowerCase();
      const items = this._client.sortedConversations().filter((c) => !q || c.name.toLowerCase().includes(q));
      const raw = this.$search.value.trim();
      const msgSearch = raw.length >= 2
        ? `<button class="msearch" data-a="search-from-list">${icon("search", 18)}<span>${T("In allen Nachrichten nach „{q}“ suchen", { q: esc(raw) })}</span></button>`
        : "";
      if (!items.length) {
        this.$items.innerHTML = `<div class="info">${q ? T("Keine Chats mit diesem Namen") : T("Noch keine Chats – starte mit +")}</div>${msgSearch}`;
        return;
      }
      this.$items.innerHTML = items
        .map((c) => {
          const lm = c.last_message;
          const typing = this._typingFor(c.id);
          let pv = typing ? T("{name} schreibt …", { name: typing }) : preview(lm);
          if (!typing && lm && c.is_group && lm.sender_id !== this._me()) pv = `${lm.sender_name}: ${pv}`;
          if (!typing && lm && lm.sender_id === this._me()) pv = `${T("Du")}: ${pv}`;
          return `<button class="item ${c.id === this._openId ? "sel" : ""}" data-a="open" data-id="${c.id}" role="listitem">
            ${withDot(avatar(c.name, c.picture, "c" + c.id, 44, c.is_system), this._isOnline(c))}
            <span class="txt"><span class="row"><span class="name">${esc(c.name)}</span>
            <span class="time ${c.unread ? "new" : ""}">${fmtListTime(lm?.created_at || c.updated_at)}</span></span>
            <span class="row"><span class="prev">${esc(pv || (c.is_group ? `${c.members.length} Mitglieder` : ""))}</span>
            ${c.unread ? `<span class="badge">${c.unread}</span>` : ""}</span></span></button>`;
        })
        .join("") + msgSearch;
    }

    _me() {
      return this._client.info?.me;
    }

    // Online-Status des Gegenübers in einem Direktchat
    _isOnline(c) {
      return !c.is_group && !!c.other_id && c.other_id !== this._me() && !!this._client.presence(c.other_id)?.online;
    }

    _statusText(uid) {
      const p = this._client.presence(uid);
      if (!p) return null;
      if (p.online) return { text: T("online"), on: true };
      if (p.last_seen) return { text: fmtLastSeen(p.last_seen), on: false };
      return null;
    }

    _typingFor(convId) {
      const t = this._client.typing.get(convId);
      return t && t.until > Date.now() ? t.name : null;
    }

    // --------------------------------------------------------- Unterhaltung
    // Angefangene Texte bleiben je Chat erhalten (und landen nicht versehentlich im nächsten Chat)
    _swapDraft(nextId) {
      this._drafts = this._drafts || {};
      if (this._openId && this._mode?.type !== "edit") this._drafts[this._openId] = this.$ta.value;
      this.$ta.value = (nextId && this._drafts[nextId]) || "";
      this._autosize();
    }

    _open(id) {
      if (this._openId !== id) {
        this._swapDraft(id);
        this._clearMode();
        this._clearStaged();
        this._setImportant(false);
        this._hidePops();
        this._forceBottom = true;
        this._stick = true;
        this._anchor = null;
        this.$msgs.innerHTML = "";
        delete this.$chead.dataset.sig;
      }
      this._openId = id;
      this._layout();
      this._client.setFocus(id);
      if (id) {
        // Wurde vorher zu einer alten Fundstelle gesprungen, beim normalen Öffnen wieder die neuesten laden
        const st = this._client.msgs.get(id);
        this._client.loadMessages(id, !!st && !st.newest).catch((e) => this._error(e));
      }
      this._schedule();
    }

    _renderChat() {
      const c = this._openId ? this._client.convs.get(this._openId) : null;
      const showComposer = !!c;
      this.$composer.hidden = !showComposer;
      this.$composer.style.display = this.$composer.hidden ? "none" : "";
      if (!c) {
        this.$chead.innerHTML = "";
        delete this.$chead.dataset.sig; // sonst bleibt der Kopf beim erneuten Öffnen desselben Chats leer
        this.$chead.style.display = "none";
        this.$msgs.innerHTML = `<div class="empty">${icon("chat", 48)}<div>${T("Wähle links einen Chat aus oder starte einen neuen.")}</div></div>`;
        this.$reply.hidden = true;
        return;
      }
      this.$chead.style.display = "";
      const typing = this._typingFor(c.id);
      const others = c.members.filter((m) => m.user_id !== this._me());
      let sub;
      if (typing) sub = `<span class="s typing">${esc(T("{name} schreibt …", { name: typing }))}</span>`;
      else if (c.is_group) sub = `<span class="s">${esc(c.members.map((m) => (m.user_id === this._me() ? T("Du") : m.name)).join(", "))}</span>`;
      else {
        const stt = c.other_id && c.other_id !== this._me() ? this._statusText(c.other_id) : null;
        sub = stt ? `<span class="s ${stt.on ? "on" : ""}">${esc(stt.text)}</span>` : `<span class="s">${T("Direktnachricht")}</span>`;
      }
      const menu = `<button class="ib" data-a="convmenu" aria-label="${T("Weitere Optionen")}">${icon("more")}</button>`;
      const online = this._isOnline(c);
      const headSig = JSON.stringify([c.name, c.picture, sub, menu, others.length, online]);
      if (this.$chead.dataset.sig !== headSig) {
        this.$chead.dataset.sig = headSig;
        this.$chead.innerHTML = `<button class="ib backbtn" data-a="back" aria-label="${T("Zurück")}">${icon("back")}</button>
          <button class="tap" data-a="convinfo" aria-label="${c.is_group && !c.is_system ? T("Gruppeninfo") : T("Info")}: ${esc(c.name)}">${withDot(avatar(c.name, c.picture, "c" + c.id, 44, c.is_system), online)}
          <span class="ctitle"><span class="n">${esc(c.name)}</span>${sub}</span></button>
          <button class="ib" data-a="search-conv" aria-label="${T("In diesem Chat suchen")}" title="${T("In diesem Chat suchen")}">${icon("search")}</button>${menu}`;
      }
      this._renderMessages(c);
      this._renderReplyBar();
      this._updatePrimary();
      this._client.markRead(c.id).catch(() => {});
    }

    _renderMessages(c) {
      const st = this._client.msgs.get(c.id);
      const box = this.$msgs;
      if (!st) {
        if (!box.querySelector(".empty")) box.innerHTML = `<div class="empty">${T("Lade Nachrichten …")}</div>`;
        return;
      }
      box.querySelector(".empty")?.remove();
      const prevH = box.scrollHeight, prevTop = box.scrollTop;
      const atBottom = box.clientHeight > 0 ? prevH - prevTop - box.clientHeight < 80 : this._stick !== false;
      if (!this._jumpTo && !((this._forceBottom || atBottom) && st.newest)) this._saveAnchor();
      const me = this._me();
      const others = c.members.filter((m) => m.user_id !== me);
      const items = [];
      if (st.all && !st.list.length) items.push({ key: "none", sig: "", html: `<div class="day">${T("Noch keine Nachrichten")}</div>` });
      if (!st.all) items.push({ key: "more", sig: "", html: `<div class="day">${T("Ältere Nachrichten werden geladen …")}</div>` });
      const tailInfo = !st.newest;
      let lastDay = null;
      for (const m of st.list) {
        const d = dayKey(m.created_at);
        if (d !== lastDay) {
          lastDay = d;
          items.push({ key: "d" + d, sig: fmtDay(m.created_at), html: `<div class="day">${esc(fmtDay(m.created_at))}</div>` });
        }
        const out = m.sender_id === me;
        const read = out && others.length > 0 && others.every((o) => o.last_read >= m.id);
        const sig = JSON.stringify([m.text, m.deleted, m.edited_at, m.reactions, m.attachment?.id, read, m.reply?.text, m.reply?.deleted, m.answer?.index, m.location?.ts, m.forwarded, m.important, c.members.length]);
        items.push({ key: "m" + m.id, sig, html: this._messageHtml(m, c, out, read) });
      }
      if (tailInfo) items.push({ key: "newer", sig: "", html: `<div class="day">${T("Neuere Nachrichten werden geladen …")}</div>` });
      const typing = this._typingFor(c.id);
      if (typing && st.newest) items.push({ key: "typing", sig: "", html: `<div class="typing-dots" role="img" aria-label="${esc(T("{name} schreibt", { name: typing }))}"><i></i><i></i><i></i></div>` });

      const existing = new Map([...box.children].map((el) => [el.dataset.key, el]));
      const keep = new Set();
      items.forEach((it, idx) => {
        let el = existing.get(it.key);
        if (!el || el.dataset.sig !== it.sig) {
          const t = document.createElement("template");
          t.innerHTML = it.html.trim();
          const n = t.content.firstElementChild;
          n.dataset.key = it.key;
          n.dataset.sig = it.sig;
          if (el) el.replaceWith(n);
          el = n;
        }
        keep.add(it.key);
        if (box.children[idx] !== el) box.insertBefore(el, box.children[idx] || null);
      });
      for (const [k, el] of existing) if (!keep.has(k)) el.remove();

      this.$latest.hidden = !!st.newest;
      if (this._jumpTo) {
        const target = box.querySelector(`.m[data-id="${this._jumpTo}"]`);
        // Nur springen, wenn der Verlauf sichtbar ist – sonst beim Sichtbarwerden (ResizeObserver)
        if (target && box.clientHeight > 0) {
          this._centerMsg(target);
          target.classList.remove("flash");
          void target.offsetWidth;
          target.classList.add("flash");
          this._jumpTo = null;
          this._forceBottom = false;
          this._stick = false;
        }
      } else if ((this._forceBottom || atBottom) && st.newest) {
        box.scrollTop = box.scrollHeight;
        this._stick = true;
        if (st.list.length && box.clientHeight > 0) this._forceBottom = false;
      } else {
        this._restoreAnchor();
      }
      box.querySelectorAll("img.media").forEach((img) => {
        if (!img._hc) {
          img._hc = true;
          // Bilder ohne feste Größe verschieben beim Laden den Inhalt: unten bleiben bzw. Leseposition halten
          img._h0 = img.offsetHeight;
          img.addEventListener("load", () => this._imgLoaded(img), { once: true });
        }
      });
      // Steht man (noch) ganz oben oder passt alles ohne Scrollen auf den Bildschirm, käme kein
      // Scroll-Ereignis mehr – dann die nächsten älteren Nachrichten von selbst holen
      if (!st.all && !st.loading && !this._jumpTo && box.clientHeight > 0 && (box.scrollTop < 300 || box.scrollHeight <= box.clientHeight + 300)) {
        this._client.loadOlder(c.id).catch(() => {});
      }
    }

    _imgLoaded(img) {
      const box = this.$msgs;
      if (!box.clientHeight || !this._openId || !img.isConnected) return;
      const st = this._client.msgs.get(this._openId);
      if ((this._forceBottom || this._stick) && st?.newest) { box.scrollTop = box.scrollHeight; return; }
      // Nur wenn das Bild oberhalb des sichtbaren Bereichs beginnt, schiebt es den gelesenen Inhalt nach unten
      const grow = img.offsetHeight - (img._h0 || 0);
      if (grow && img.getBoundingClientRect().top < box.getBoundingClientRect().top) box.scrollTop += grow;
      this._saveAnchor();
    }

    _onMsgsScroll() {
      const box = this.$msgs;
      if (!this._openId || box.clientHeight === 0) return;
      this._stick = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
      this._saveAnchor();
      const st = this._client.msgs.get(this._openId);
      if (!st || st.loading) return;
      if (!st.all && box.scrollTop < 300) this._client.loadOlder(this._openId).catch(() => {});
      else if (!st.newest && box.scrollHeight - box.scrollTop - box.clientHeight < 300) this._client.loadNewer(this._openId).catch(() => {});
    }

    // Merkt sich die oberste sichtbare Nachricht und ihren Abstand zum oberen Rand
    _saveAnchor() {
      const box = this.$msgs;
      if (!box.clientHeight) return;
      const top = box.getBoundingClientRect().top;
      const kids = box.children;
      // Binäre Suche nach dem ersten sichtbaren Eintrag (schnell auch bei vielen Nachrichten)
      let lo = 0, hi = kids.length;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (kids[mid].getBoundingClientRect().bottom > top + 1) hi = mid; else lo = mid + 1;
      }
      for (let i = lo; i < kids.length; i++) {
        const k = kids[i].dataset.key || "";
        if (!/^m\d+$/.test(k)) continue; // nur echte Nachrichten (nicht Platzhalter oder Datums-Trenner)
        this._anchor = { key: k, off: kids[i].getBoundingClientRect().top - top };
        return;
      }
      this._anchor = null;
    }

    _restoreAnchor() {
      const a = this._anchor, box = this.$msgs;
      if (!a || !box.clientHeight) return;
      const el = [...box.children].find((x) => x.dataset.key === a.key);
      if (!el) return;
      const d = el.getBoundingClientRect().top - box.getBoundingClientRect().top - a.off;
      if (Math.abs(d) >= 1) box.scrollTop += d;
    }

    _keepPosition() {
      const box = this.$msgs;
      if (!box || !box.clientHeight || !this._openId) return;
      if (this._jumpTo) return this._schedule();
      const st = this._client.msgs.get(this._openId);
      if ((this._forceBottom || this._stick) && st?.newest) {
        box.scrollTop = box.scrollHeight;
        if (st.list.length) this._forceBottom = false;
      } else this._restoreAnchor();
    }

    // Nachricht in der Mitte des Verlaufs zeigen – nur der Verlauf scrollt, nie die ganze Seite
    _centerMsg(target, smooth = false) {
      const box = this.$msgs;
      const top = box.scrollTop + (target.getBoundingClientRect().top - box.getBoundingClientRect().top) - (box.clientHeight - target.offsetHeight) / 2;
      const y = Math.max(0, Math.min(top, box.scrollHeight - box.clientHeight));
      if (smooth && box.scrollTo) box.scrollTo({ top: y, behavior: "smooth" });
      else box.scrollTop = y;
    }

    // Karte ganz zeigen (z. B. wenn iOS die Seite nach dem Schließen der Tastatur verschoben hat)
    _revealCard() {
      if (!this.isConnected) return;
      const header = parseFloat(getComputedStyle(this).getPropertyValue("--header-height")) || 56;
      const minTop = header + this._safeInsets().top;
      const r = this.getBoundingClientRect();
      if (r.top >= minTop - 2 && r.bottom <= window.innerHeight + 2) return;
      this.style.scrollMarginTop = minTop + 4 + "px";
      this.scrollIntoView?.({ block: "start" });
    }

    _messageHtml(m, c, out, read) {
      const sys = m.sender_id === SYSTEM;
      const me = this._me();
      const myName = this._client.me().name || "";
      const mentionsMe = !out && c.is_group && !m.deleted && myName && (m.text || "").toLowerCase().includes("@" + myName.toLowerCase());
      const cls = `m ${out ? "out" : "in"} ${sys ? "sys" : ""} ${m.reactions?.length ? "react" : ""} ${mentionsMe ? "mentioned" : ""} ${m.important && !m.deleted ? "imp" : ""}`;
      let inner = "";
      if (!out && (c.is_group || sys)) inner += `<div class="sn" style="--c:${sys ? "#e65100" : colorFor(m.sender_id)}">${esc(m.sender_name)}</div>`;
      if (m.deleted) {
        inner += `<div class="del">${T("Diese Nachricht wurde gelöscht")}</div>`;
      } else {
        if (m.important) inner += `<div class="impl">${icon("alert", 14)}${T("Wichtig")}</div>`;
        if (m.forwarded) inner += `<div class="fwd">${icon("forward", 14)}${T("Weitergeleitet")}</div>`;
        if (m.reply) {
          const rt = m.reply.deleted ? T("Gelöschte Nachricht") : m.reply.text || (m.reply.has_attachment ? T("Anhang") : "");
          inner += `<div class="q" data-a="jump" data-id="${m.reply.id}" style="--c:${m.reply.sender_id === SYSTEM ? "#e65100" : colorFor(m.reply.sender_id || m.reply.sender_name)}"><b>${esc(m.reply.sender_name)}</b><span>${esc(rt)}</span></div>`;
        }
        const a = m.attachment;
        if (a) {
          const kind = mediaKind(a.mime);
          if (kind === "image") inner += `<img class="media" src="${esc(a.url)}" alt="${esc(a.filename)}" loading="lazy" data-a="view" data-src="${esc(a.url)}">`;
          else if (kind === "video") inner += `<video class="media" src="${esc(a.url)}" controls preload="metadata" playsinline></video>`;
          else inner += `<a class="fileatt" href="${esc(a.url)}" target="_blank" rel="noopener" download="${esc(a.filename)}">${icon("file", 28)}<span>${esc(a.filename)}<small>${fmtSize(a.size)}</small></span></a>`;
        }
        if (m.location) {
          const l = m.location;
          inner += `<a class="loc" href="${esc(mapsLink(l))}" target="_blank" rel="noopener" aria-label="${T("Standort in Karten-App öffnen")}">${mapHtml(l, 240, 130)}<span class="lt"><b>📍 ${T("Standort")}</b><small>${l.acc ? `±${l.acc} m · ` : ""}${esc(fmtDateTime(l.ts))} · ${T("in Karten öffnen")}</small></span></a>`;
        }
        // Uhrzeit und Haken stehen wie im Messenger unten rechts im Text (wenn danach nichts mehr kommt)
        if (m.text) inner += `<div class="t">${c.is_group ? this._markMentions(linkify(sysText(m)), c) : linkify(sysText(m))}${m.buttons?.length ? "" : "\u0000META\u0000"}</div>`;
        if (m.buttons?.length) {
          const ans = m.answer;
          inner += `<div class="qbtns">${m.buttons.map((t, i) => `<button class="qb ${ans && ans.index === i ? "on" : ""}" data-a="press" data-id="${m.id}" data-i="${i}"${m.confirms?.[i] ? ` data-c="${esc(m.confirms[i])}"` : ""} ${ans ? "disabled" : ""}>${esc(t)}</button>`).join("")}</div>`;
          if (ans) inner += `<div class="ans">${T("Antwort")}: ${esc(ans.title)} · ${esc(ans.user_id === me ? T("Du") : ans.user_name)}, ${esc(fmtDateTime(ans.at))}</div>`;
        }
      }
      const tick = out && !m.deleted ? (read ? `<span class="rd" title="${T("Gelesen")}">${icon("dcheck", 16)}</span>` : `<span title="${T("Gesendet")}">${icon("check", 14)}</span>`) : "";
      const metaInner = `${m.edited_at && !m.deleted ? T("bearbeitet") + " · " : ""}${fmtTime(m.created_at)}${tick}`;
      if (inner.includes("\u0000META\u0000")) inner = inner.replace("\u0000META\u0000", `<span class="meta fl">${metaInner}</span>`);
      else inner += `<div class="meta">${metaInner}</div>`;
      let rx = "";
      if (m.reactions?.length) {
        const counts = {};
        m.reactions.forEach((r) => (counts[r.emoji] = (counts[r.emoji] || 0) + 1));
        rx = `<button class="rx" data-a="rxinfo" data-id="${m.id}" aria-label="${T("Reaktionen anzeigen")}">${Object.keys(counts).map((e) => esc(e)).join("")}${m.reactions.length > 1 ? `<span class="c">${m.reactions.length}</span>` : ""}</button>`;
      }
      return `<div class="${cls}" data-id="${m.id}"><div class="b" data-a="msg">${inner}</div>${rx}</div>`;
    }

    _markMentions(html, c) {
      const names = c.members.map((m) => m.name).filter(Boolean).sort((a, b) => b.length - a.length);
      if (!names.length) return html;
      const re = new RegExp("@(" + names.map((n) => reEsc(esc(n))).join("|") + ")", "gi");
      return html.replace(re, (t) => `<span class="mention">${t}</span>`);
    }

    _findMsg(id) {
      return this._client.msgs.get(this._openId)?.list.find((m) => m.id === id);
    }

    // --------------------------------------------------------- Klicks
    _onClick(e) {
      const el = e.target.closest("[data-a]");
      if (!el) return;
      const a = el.dataset.a;
      if (a !== "emoji" && !e.target.closest(".emo")) this.$emo.hidden = true;
      if (a !== "mention") this.$mlist.hidden = true;
      if (a === "msg") {
        if (e.target.closest("a,video,img,.q,button")) return;
        if (window.getSelection && String(window.getSelection()).length) return;
        this._messageMenu(Number(el.closest(".m").dataset.id));
        return;
      }
      const id = el.dataset.id ? Number(el.dataset.id) : null;
      switch (a) {
        case "open": return this._open(id);
        case "back": return this._open(null);
        case "new": return this._newChatDialog();
        case "profile": return this._profileDialog();
        case "search-all": return this._searchPanel(null, "");
        case "search-conv": return this._searchPanel(this._openId, "");
        case "search-from-list": return this._searchPanel(null, this.$search.value.trim());
        case "latest":
          this._forceBottom = true;
          return this._client.loadMessages(this._openId, true).catch((e) => this._error(e));
        case "attachmenu": return this._attachMenu();
        case "emoji": return this._toggleEmoji();
        case "emo": return this._insertText(el.dataset.e);
        case "mention": return this._insertMention(el.dataset.name);
        case "unstage": return this._unstage(Number(el.dataset.i));
        case "press": {
          const press = () => this._ws({ type: "ha_chat/press", message_id: id, index: Number(el.dataset.i) });
          // Knopf mit Rückfrage (Dienst: buttons: [{title: "Erledigt", confirm: "Sicher?"}])
          if (el.dataset.c) return this._confirm(el.dataset.c, el.textContent.trim() || "OK", press);
          return press().catch(() => {});
        }
        case "primary": return this._primary();
        case "convmenu": return this._convMenu();
        case "convinfo": return this._convInfo(this._openId);
        case "cancel-mode": return this._clearMode();
        case "prio-off": return this._setImportant(false);
        case "reload": return location.reload();
        case "jump": {
          const t = this.$msgs.querySelector(`.m[data-id="${id}"]`);
          if (t) { this._centerMsg(t, true); t.animate([{ opacity: 0.4 }, { opacity: 1 }], 900); }
          return;
        }
        case "view": return this._viewer(el.dataset.src);
        case "rxinfo": return this._reactionInfo(id);
        case "close": return this._closeLayer();
      }
    }

    _closeLayer() {
      this.$layer.innerHTML = "";
    }

    _dialog(html, onMount) {
      this.$layer.innerHTML = `<div class="ov" data-ov><div class="dlg" role="dialog" aria-modal="true">${html}</div></div>`;
      const ov = this.$layer.firstElementChild;
      ov.addEventListener("click", (e) => { if (e.target === ov) this._closeLayer(); });
      onMount?.(ov.querySelector(".dlg"));
      ov.querySelector("input:not([type=checkbox]),button")?.focus();
    }

    _error(e) {
      const msg = e?.message || e?.error?.message || String(e);
      const el = document.createElement("div");
      el.className = "err";
      el.textContent = msg;
      this._wrap.appendChild(el);
      setTimeout(() => el.remove(), 4000);
    }

    async _ws(msg) {
      try {
        return await this._client.ws(msg);
      } catch (e) {
        this._error(e);
        throw e;
      }
    }

    // --------------------------------------------------------- Nachrichtenmenü
    _hideMessage(id) {
      this._confirm(T("Nur für dich löschen?"), T("Löschen"), () => this._ws({ type: "ha_chat/hide", message_id: id }),
        T("Die Nachricht verschwindet nur bei dir. Alle anderen sehen sie weiterhin."));
    }

    _messageMenu(id) {
      const m = this._findMsg(id);
      if (!m) return;
      if (m.deleted) {
        this._dialog(`<h3>${T("Gelöschte Nachricht")}</h3><button class="act" data-x="hide">${icon("eyeoff")}${T("Für mich löschen")}</button><div class="btns"><button class="btn" data-a="close">${T("Schließen")}</button></div>`,
          (dlg) => dlg.querySelector('[data-x="hide"]').addEventListener("click", () => { this._closeLayer(); this._ws({ type: "ha_chat/hide", message_id: id }).catch(() => {}); }));
        return;
      }
      const me = this._me();
      const mine = m.reactions?.find((r) => r.user_id === me)?.emoji;
      const own = m.sender_id === me;
      const rx = (this._client.info.reactions || []).map((e) => `<button class="${e === mine ? "on" : ""}" data-r="${esc(e)}" aria-label="${T("Reaktion")} ${esc(e)}">${esc(e)}</button>`).join("");
      this._dialog(
        `<div class="rxrow">${rx}</div>
         <button class="act" data-x="reply">${icon("reply")}${T("Antworten")}</button>
         <button class="act" data-x="forward">${icon("forward")}${T("Weiterleiten")}</button>
         ${m.text ? `<button class="act" data-x="copy">${icon("copy")}${T("Text kopieren")}</button>` : ""}
         ${own ? `<button class="act" data-x="info">${icon("info")}${T("Info: gelesen von …")}</button>` : ""}
         ${own && m.text ? `<button class="act" data-x="edit">${icon("edit")}${T("Bearbeiten")}</button>` : ""}
         <button class="act danger" data-x="hide">${icon("eyeoff")}${T("Für mich löschen")}</button>
         ${own ? `<button class="act danger" data-x="delete">${icon("trash")}${T("Für alle löschen")}</button>` : ""}`,
        (dlg) => {
          dlg.addEventListener("click", async (e) => {
            const r = e.target.closest("[data-r]");
            const x = e.target.closest("[data-x]")?.dataset.x;
            if (r) { this._closeLayer(); this._ws({ type: "ha_chat/react", message_id: id, emoji: r.dataset.r }).catch(() => {}); return; }
            if (!x) return;
            this._closeLayer();
            if (x === "reply") { this._mode = { type: "reply", msg: m }; this._renderReplyBar(); this.$ta.focus(); }
            if (x === "edit") { this._mode = { type: "edit", msg: m }; this.$ta.value = m.text; this._autosize(); this._renderReplyBar(); this._updatePrimary(); this.$ta.focus(); }
            if (x === "copy") navigator.clipboard?.writeText(m.text).catch(() => {});
            if (x === "forward") this._forwardDialog(m);
            if (x === "info") this._readInfo(m);
            if (x === "hide") this._hideMessage(id);
            if (x === "delete") this._confirm(T("Nachricht für alle löschen?"), T("Löschen"), () => this._ws({ type: "ha_chat/delete", message_id: id }));
          });
        }
      );
    }

    _reactionInfo(id) {
      const m = this._findMsg(id);
      if (!m) return;
      const c = this._client.convs.get(this._openId);
      const name = (uid) => (uid === this._me() ? T("Du") : c.members.find((x) => x.user_id === uid)?.name || T("Unbekannt"));
      this._dialog(
        `<h3>${T("Reaktionen")}</h3>${m.reactions.map((r) => `<div class="row" style="min-height:36px"><span style="font-size:22px">${esc(r.emoji)}</span><span>${esc(name(r.user_id))}</span></div>`).join("")}
         <div class="btns"><button class="btn" data-a="close">${T("Schließen")}</button></div>`
      );
    }

    _confirm(text, okLabel, action, hint) {
      this._dialog(`<h3>${esc(text)}</h3>${hint ? `<div class="sub2">${esc(hint)}</div>` : ""}<div class="btns"><button class="btn" data-a="close">${T("Abbrechen")}</button><button class="btn p" data-ok>${esc(okLabel)}</button></div>`, (dlg) => {
        dlg.querySelector("[data-ok]").addEventListener("click", () => { this._closeLayer(); action().catch(() => {}); });
      });
    }

    _prompt(title, value, okLabel, action) {
      this._dialog(`<h3>${esc(title)}</h3><input class="inp" maxlength="60" value="${esc(value)}"><div class="btns"><button class="btn" data-a="close">${T("Abbrechen")}</button><button class="btn p" data-ok>${esc(okLabel)}</button></div>`, (dlg) => {
        const inp = dlg.querySelector("input");
        const go = () => { const v = inp.value.trim(); if (!v) return; this._closeLayer(); action(v).catch(() => {}); };
        dlg.querySelector("[data-ok]").addEventListener("click", go);
        inp.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
        setTimeout(() => inp.select(), 0);
      });
    }

    // --------------------------------------------------------- Neue Chats & Gruppen
    _userPicker(title, users, okLabel, withName, action) {
      if (!users.length) {
        this._dialog(`<h3>${esc(title)}</h3><div>${T("Keine weiteren berechtigten Personen vorhanden.")}</div><div class="btns"><button class="btn" data-a="close">OK</button></div>`);
        return;
      }
      this._dialog(
        `<h3>${esc(title)}</h3>
         <div>${users.map((u) => `<label class="chk"><input type="checkbox" value="${esc(u.id)}">${avatar(u.name, u.picture, u.id, 36)}<span>${esc(u.name)}</span></label>`).join("")}</div>
         ${withName ? `<input class="inp gname" placeholder="${T("Gruppenname (bei mehreren Personen)")}" maxlength="60" hidden>` : ""}
         <div class="btns"><button class="btn" data-a="close">${T("Abbrechen")}</button><button class="btn p" data-ok disabled>${esc(okLabel)}</button></div>`,
        (dlg) => {
          const ok = dlg.querySelector("[data-ok]");
          const gname = dlg.querySelector(".gname");
          const sel = () => [...dlg.querySelectorAll("input[type=checkbox]:checked")].map((i) => i.value);
          dlg.addEventListener("change", () => {
            const n = sel().length;
            ok.disabled = n === 0;
            if (gname) gname.hidden = n < 2;
          });
          ok.addEventListener("click", () => {
            const ids = sel();
            if (!ids.length) return;
            if (gname && ids.length > 1 && !gname.value.trim()) { gname.focus(); gname.placeholder = T("Bitte Gruppennamen eingeben"); return; }
            this._closeLayer();
            action(ids, gname?.value.trim() || null).catch(() => {});
          });
        }
      );
    }

    _newChatDialog() {
      const users = (this._client.info.users || []).filter((u) => u.id !== this._me());
      this._userPicker(T("Neuer Chat"), users, T("Chat starten"), true, async (ids, name) => {
        const r = await this._ws({ type: "ha_chat/create", members: ids, name: ids.length > 1 ? name : null });
        await this._client.loadConversations();
        this._open(r.conversation_id);
      });
    }

    _convMenu() {
      const c = this._client.convs.get(this._openId);
      if (!c) return;
      const creator = c.created_by === this._me();
      const mediaBtn = `<button class="act" data-x="media">${icon("grid")}${T("Medien, Dateien & Links")}</button>`;
      const clearBtn = `<button class="act" data-x="clear">${icon("eraser")}${T("Verlauf leeren")}</button>`;
      if (!c.is_group || c.is_system) {
        this._dialog(`<h3>${esc(c.name)}</h3>${c.is_system ? "" : `<button class="act" data-x="info">${icon("info")}${T("Kontaktinfo")}</button>`}${mediaBtn}${clearBtn}${c.is_system ? "" : `<button class="act danger" data-x="delete">${icon("trash")}${T("Chat für beide löschen")}</button>`}<div class="btns"><button class="btn" data-a="close">${T("Schließen")}</button></div>`, (dlg) => {
          dlg.addEventListener("click", (e) => {
            const x = e.target.closest("[data-x]")?.dataset.x;
            if (x === "info") this._convInfo(c.id);
            if (x === "media") this._mediaPanel(c.id);
            if (x === "clear") this._clearHistory(c);
            if (x === "delete") this._confirm(T("Chat und alle Nachrichten löschen?"), T("Löschen"), () => this._ws({ type: "ha_chat/delete_conversation", conversation_id: c.id }), T("Der Chat wird für euch beide gelöscht."));
          });
        });
        return;
      }
      this._dialog(
        `<h3>${esc(c.name)}</h3>
         <button class="act" data-x="ginfo">${icon("info")}${T("Gruppeninfo: Bild, Name & Beschreibung")}</button>
         ${mediaBtn}
         <button class="act" data-x="members">${icon("people")}${T("Mitglieder ({n})", { n: c.members.length })}</button>
         <button class="act" data-x="add">${icon("plus")}${T("Mitglieder hinzufügen")}</button>
         ${clearBtn}
         <button class="act danger" data-x="leave">${icon("leave")}${T("Gruppe verlassen")}</button>
         ${creator ? `<button class="act danger" data-x="delete">${icon("trash")}${T("Gruppe löschen")}</button>` : ""}`,
        (dlg) => dlg.addEventListener("click", (e) => {
          const x = e.target.closest("[data-x]")?.dataset.x;
          if (!x) return;
          if (x === "ginfo") this._groupInfo(c.id);
          if (x === "clear") this._clearHistory(c);
          if (x === "add") {
            const ids = c.members.map((m) => m.user_id);
            const users = (this._client.info.users || []).filter((u) => !ids.includes(u.id));
            this._userPicker(T("Mitglieder hinzufügen"), users, T("Hinzufügen"), false, (sel) => this._ws({ type: "ha_chat/update_group", conversation_id: c.id, add: sel }));
          }
          if (x === "members") this._membersDialog(c, creator);
          if (x === "media") this._mediaPanel(c.id);
          if (x === "leave") this._confirm(T("Gruppe verlassen?"), T("Verlassen"), () => this._ws({ type: "ha_chat/leave", conversation_id: c.id }));
          if (x === "delete") this._confirm(T("Gruppe für alle löschen?"), T("Löschen"), () => this._ws({ type: "ha_chat/delete_conversation", conversation_id: c.id }));
        })
      );
    }

    _membersDialog(c, creator) {
      const me = this._me();
      this._dialog(
        `<h3>${T("Mitglieder")}</h3>${c.members.map((m) => {
          const stt = m.user_id === me ? null : this._statusText(m.user_id);
          return `<div class="row" style="min-height:48px">${withDot(avatar(m.name, m.picture, m.user_id, 36), stt?.on)}<span style="flex:1;display:flex;flex-direction:column"><span>${esc(m.user_id === me ? T("Du") : m.name)}${m.user_id === c.created_by ? " · " + T("Ersteller") : ""}</span>${stt ? `<span class="mst ${stt.on ? "on" : ""}">${esc(stt.text)}</span>` : ""}</span>
          ${creator && m.user_id !== me ? `<button class="ib" data-rm="${esc(m.user_id)}" aria-label="${esc(T("{name} entfernen", { name: m.name }))}">${icon("close", 18)}</button>` : ""}</div>`;
        }).join("")}
         <div class="btns"><button class="btn" data-a="close">${T("Schließen")}</button></div>`,
        (dlg) => dlg.addEventListener("click", (e) => {
          const rm = e.target.closest("[data-rm]")?.dataset.rm;
          if (rm) { this._closeLayer(); this._ws({ type: "ha_chat/update_group", conversation_id: c.id, remove: [rm] }).catch(() => {}); }
        })
      );
    }

    _clearHistory(c) {
      this._confirm(T("Verlauf von „{name}“ leeren?", { name: c.name }), T("Leeren"),
        () => this._ws({ type: "ha_chat/clear_history", conversation_id: c.id }),
        T("Alle bisherigen Nachrichten verschwinden nur bei dir. Die anderen sehen sie weiterhin, neue Nachrichten kommen ganz normal an."));
    }

    _convInfo(convId) {
      const c = this._client.convs.get(convId);
      if (!c) return;
      if (c.is_group && !c.is_system) return this._groupInfo(c.id);
      if (c.is_system) {
        this._dialog(`<div class="prof gi">${avatar(c.name, null, "c" + c.id, 96, true)}<h3>${esc(c.name)}</h3>
            <div class="hint">${c.personal
              ? T("Dein persönlicher Kanal: Hier schickt Home Assistant Meldungen aus Automationen, die nur für dich bestimmt sind. Niemand sonst sieht diesen Chat.")
              : T("Gemeinsamer Kanal aller {n} Chat-Benutzer. Hier schreibt auch Home Assistant selbst (z. B. Meldungen aus Automationen).", { n: c.members.length })}</div></div>
          <button class="act" data-x="media">${icon("grid")}${T("Medien, Dateien & Links")}</button>
          <div class="btns"><button class="btn" data-a="close">${T("Schließen")}</button></div>`,
          (dlg) => dlg.querySelector('[data-x="media"]').addEventListener("click", () => this._mediaPanel(c.id)));
        return;
      }
      const stt = c.other_id && c.other_id !== this._me() ? this._statusText(c.other_id) : null;
      this._dialog(`<div class="prof gi">${withDot(avatar(c.name, c.picture, "c" + c.id, 112), stt?.on)}<h3>${esc(c.name)}</h3>
          <div class="st ${stt?.on ? "on" : ""}">${esc(stt ? stt.text : T("Direktnachricht"))}</div></div>
        <button class="act" data-x="media">${icon("grid")}${T("Medien, Dateien & Links")}</button>
        <button class="act" data-x="search">${icon("search")}${T("In diesem Chat suchen")}</button>
        <div class="btns"><button class="btn" data-a="close">${T("Schließen")}</button></div>`,
        (dlg) => dlg.addEventListener("click", (e) => {
          const x = e.target.closest("[data-x]")?.dataset.x;
          if (x === "media") this._mediaPanel(c.id);
          if (x === "search") this._searchPanel(c.id, "");
        }));
    }

    _groupInfo(convId) {
      const c = this._client.convs.get(convId);
      if (!c) return;
      this._dialog(
        `<div class="prof gi">
           ${avatar(c.name, c.picture, "c" + c.id, 112)}
           <h3>${esc(c.name)}</h3>
           <div class="hint">${T("Gruppe · {n} Mitglieder", { n: c.members.length })}</div>
           <div class="desc ${c.description ? "" : "none"}">${c.description ? linkify(c.description) : T("Noch keine Gruppenbeschreibung")}</div>
         </div>
         <button class="act" data-x="pic">${icon("camera")}${c.has_picture ? T("Gruppenbild ändern") : T("Gruppenbild festlegen")}</button>
         ${c.has_picture ? `<button class="act danger" data-x="rmpic">${icon("trash")}${T("Gruppenbild entfernen")}</button>` : ""}
         <button class="act" data-x="desc">${icon("edit")}${c.description ? T("Beschreibung bearbeiten") : T("Beschreibung hinzufügen")}</button>
         <button class="act" data-x="rename">${icon("rename")}${T("Gruppe umbenennen")}</button>
         <button class="act" data-x="members">${icon("people")}${T("Mitglieder ({n})", { n: c.members.length })}</button>
         <input type="file" accept="image/*" hidden>
         <div class="btns"><button class="btn" data-a="close">${T("Schließen")}</button></div>`,
        (dlg) => {
          const inp = dlg.querySelector("input[type=file]");
          dlg.addEventListener("click", (e) => {
            const x = e.target.closest("[data-x]")?.dataset.x;
            if (x === "pic") inp.click();
            if (x === "rmpic") { this._closeLayer(); this._ws({ type: "ha_chat/remove_group_avatar", conversation_id: c.id }).catch(() => {}); }
            if (x === "desc") this._descDialog(c);
            if (x === "rename") this._prompt(T("Gruppe umbenennen"), c.name, T("Speichern"), (v) => this._ws({ type: "ha_chat/update_group", conversation_id: c.id, name: v }));
            if (x === "members") this._membersDialog(c, c.created_by === this._me());
          });
          inp.addEventListener("change", async () => {
            const file = inp.files?.[0];
            if (!file) return;
            try {
              const image = await this._squareJpeg(file, 256);
              this._closeLayer();
              await this._ws({ type: "ha_chat/set_group_avatar", conversation_id: c.id, image });
              this._toast(T("Gruppenbild gespeichert"));
            } catch (err) {
              this._error(err);
            }
          });
        }
      );
    }

    _descDialog(c) {
      const max = 500;
      this._dialog(
        `<h3>${T("Gruppenbeschreibung")}</h3>
         <textarea class="inp" maxlength="${max}" placeholder="${T("Worum geht es in dieser Gruppe? (für alle Mitglieder sichtbar)")}">${esc(c.description || "")}</textarea>
         <div class="cnt"></div>
         <div class="btns"><button class="btn" data-a="close">${T("Abbrechen")}</button><button class="btn p" data-ok>${T("Speichern")}</button></div>`,
        (dlg) => {
          const ta = dlg.querySelector("textarea");
          const cnt = dlg.querySelector(".cnt");
          const upd = () => (cnt.textContent = `${ta.value.length} / ${max}`);
          ta.addEventListener("input", upd);
          upd();
          setTimeout(() => { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }, 0);
          dlg.querySelector("[data-ok]").addEventListener("click", () => {
            const v = ta.value.trim();
            this._closeLayer();
            this._ws({ type: "ha_chat/update_group", conversation_id: c.id, description: v })
              .then(() => this._toast(v ? T("Beschreibung gespeichert") : T("Beschreibung entfernt"))).catch(() => {});
          });
        }
      );
    }

    // --------------------------------------------------------- Suche
    _searchPanel(convId, initial) {
      const conv = convId ? this._client.convs.get(convId) : null;
      this.$layer.innerHTML = `<div class="sp" role="dialog" aria-modal="true" aria-label="${T("Nachrichten durchsuchen")}">
        <div class="bar2">
          <button class="ib" data-a="close" aria-label="${T("Suche schließen")}">${icon("back")}</button>
          <label>${icon("search", 18)}<input type="search" placeholder="${T("Nachrichten durchsuchen")}" aria-label="${T("Suchbegriff")}" maxlength="100"></label>
        </div>
        ${conv ? `<div class="scope"><button class="chipb on" data-scope="${conv.id}">${T("In „{name}“", { name: esc(conv.name) })}</button><button class="chipb" data-scope="">${T("In allen Chats")}</button></div>` : ""}
        <div class="res" role="list"><div class="note">${T("Mindestens 2 Zeichen eingeben. Gesucht wird in Texten und Dateinamen.")}</div></div>
      </div>`;
      const sp = this.$layer.firstElementChild;
      const inp = sp.querySelector("input");
      const res = sp.querySelector(".res");
      let scope = conv ? conv.id : null;
      let timer = null;
      let seq = 0;
      const run = async () => {
        const q = inp.value.trim();
        const my = ++seq;
        if (q.length < 2) {
          res.innerHTML = `<div class="note">${T("Mindestens 2 Zeichen eingeben. Gesucht wird in Texten und Dateinamen.")}</div>`;
          return;
        }
        res.innerHTML = `<div class="note">${T("Suche …")}</div>`;
        try {
          const hits = await this._client.ws({ type: "ha_chat/search", query: q, conversation_id: scope, limit: 80 });
          if (my !== seq) return;
          if (!hits.length) {
            res.innerHTML = `<div class="note">${T("Keine Nachrichten mit „{q}“ gefunden.", { q: esc(q) })}</div>`;
            return;
          }
          const me = this._me();
          res.innerHTML = hits.map((h) => {
            const who = h.sender_id === me ? T("Du") : h.sender_name;
            const body = h.text || (h.attachment ? `${attLabel(h.attachment.mime)}: ${h.attachment.filename}` : "");
            const d = new Date(h.created_at * 1000);
            const when = d.toDateString() === new Date().toDateString() ? fmtTime(h.created_at) : d.toLocaleDateString(I18N.locale, { day: "2-digit", month: "2-digit", year: "2-digit" });
            return `<button class="hit" data-conv="${h.conversation_id}" data-msg="${h.id}" role="listitem">
              ${avatar(h.conversation_name, h.conversation_picture, "c" + h.conversation_id, 40, h.conversation_is_system)}
              <span class="txt"><span class="row"><span class="name">${esc(h.conversation_name)}</span><span class="time">${esc(when)}</span></span>
              <span class="snip">${esc(who)}: ${highlight(body, q)}</span></span></button>`;
          }).join("") + (hits.length >= 80 ? `<div class="note">${T("Es werden die 80 neuesten Treffer angezeigt – Suchbegriff genauer fassen.")}</div>` : "");
        } catch (e) {
          if (my === seq) res.innerHTML = `<div class="note">${esc(e?.message || T("Suche fehlgeschlagen"))}</div>`;
        }
      };
      inp.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(run, 250); });
      sp.addEventListener("click", (e) => {
        const chip = e.target.closest("[data-scope]");
        if (chip) {
          scope = chip.dataset.scope ? Number(chip.dataset.scope) : null;
          sp.querySelectorAll("[data-scope]").forEach((b) => b.classList.toggle("on", b === chip));
          run();
          return;
        }
        const hit = e.target.closest(".hit");
        if (hit) {
          this._closeLayer();
          this._openAt(Number(hit.dataset.conv), Number(hit.dataset.msg));
        }
      });
      inp.value = initial || "";
      setTimeout(() => inp.focus(), 0);
      if (inp.value) run();
    }

    async _openAt(convId, msgId) {
      if (this._openId !== convId) {
        this._swapDraft(convId);
        this._clearMode();
        this._clearStaged();
        this._setImportant(false);
        this._hidePops();
        this.$msgs.innerHTML = "";
        delete this.$chead.dataset.sig;
      }
      this._openId = convId;
      this._layout();
      this._client.setFocus(convId);
      this._forceBottom = false;
      this._stick = false;
      this._anchor = null;
      this._jumpTo = msgId;
      const st = this._client.msgs.get(convId);
      if (!st || !st.list.some((m) => m.id === msgId)) {
        await this._client.loadAround(convId, msgId).catch((e) => this._error(e));
      }
      this._schedule();
    }

    _profileDialog() {
      const me = this._client.me();
      this._dialog(
        `<div class="prof">
           ${avatar(me.name, me.picture, me.id, 112)}
           <h3>${esc(me.name)}</h3>
           <div class="hint">${T("Der Name ist dein Anzeigename aus deinem Home-Assistant-Profil (unten links auf deinen Namen tippen).")}</div>
         </div>
         <button class="act" data-x="pick">${icon("camera")}${me.has_avatar ? T("Profilbild ändern") : T("Profilbild festlegen")}</button>
         ${me.has_avatar ? `<button class="act danger" data-x="remove">${icon("trash")}${T("Profilbild entfernen")}</button>` : ""}
         <label class="tog"><input type="checkbox" data-pres ${this._client.info.show_presence !== false ? "checked" : ""}><span>${T("Online-Status zeigen")}<small>${T("Andere sehen, ob du gerade online bist und wann du zuletzt online warst. Schaltest du das aus, siehst du auch den Status der anderen nicht.")}</small></span></label>
         <button class="act" data-x="test">${icon("bell")}${T("Erreichbarkeit testen")}</button>
         ${this._client.info.is_admin ? `<button class="act" data-x="admin">${icon("db")}${T("Speicher & Geräte (Admin)")}</button>` : ""}
         <input type="file" accept="image/*" hidden>
         <div class="btns"><button class="btn" data-a="close">${T("Schließen")}</button></div>`,
        (dlg) => {
          const inp = dlg.querySelector("input[type=file]");
          dlg.addEventListener("click", (e) => {
            const x = e.target.closest("[data-x]")?.dataset.x;
            if (x === "pick") inp.click();
            if (x === "remove") { this._closeLayer(); this._ws({ type: "ha_chat/remove_avatar" }).catch(() => {}); }
            if (x === "test") this._testPush();
            if (x === "admin") this._adminPanel("storage");
          });
          dlg.querySelector("[data-pres]").addEventListener("change", (e) => {
            const show = e.target.checked;
            this._ws({ type: "ha_chat/set_presence", show })
              .then(() => this._toast(show ? T("Online-Status wird angezeigt") : T("Online-Status ist verborgen")))
              .catch(() => { e.target.checked = !show; });
          });
          inp.addEventListener("change", async () => {
            const file = inp.files?.[0];
            if (!file) return;
            try {
              const image = await this._squareJpeg(file, 256);
              this._closeLayer();
              await this._ws({ type: "ha_chat/set_avatar", image });
            } catch (err) {
              this._error(err);
            }
          });
        }
      );
    }

    // --------------------------------------------------------- Erreichbarkeit
    _tipsHtml(open) {
      const li = (list) => list.map((s) => `<li>${T(s)}</li>`).join("");
      const ios = `<b>iPhone / iPad</b><ul class="tips">${li([
        "Einstellungen → Mitteilungen → Home Assistant: „Mitteilungen erlauben“, Sperrbildschirm, Banner und Töne einschalten.",
        "Dort „Zeitkritische Mitteilungen“ erlauben – nötig, damit Nachrichten mit <b>höchster Priorität</b> auch im Fokus- bzw. „Nicht stören“-Modus durchkommen.",
        "Fokus-Modi (Einstellungen → Fokus): bei Home Assistant „Zeitkritische Mitteilungen“ zulassen. Normale Chat-Nachrichten halten sich an den Fokus.",
        "Die App darf im Hintergrund bleiben; Wegwischen schadet nicht – die Push kommt von Apple.",
      ])}</ul>`;
      const android = `<b>Android</b><ul class="tips">${li([
        "Einstellungen → Apps → Home Assistant → Benachrichtigungen: erlauben; Kategorie „Chat“ auf „Ton und Pop-up“.",
        "Kategorie „Chat – Wichtig“ (erscheint nach der ersten Nachricht mit höchster Priorität): „Nicht stören ignorieren“ erlauben.",
        "Akku: „Nicht eingeschränkt“ bzw. Akku-Optimierung für Home Assistant ausschalten.",
        "„App-Aktivität pausieren, wenn nicht verwendet“ ausschalten.",
        "Die App nie mit „Beenden erzwingen“ stoppen – danach kommen keine Pushs, bis sie wieder geöffnet wurde.",
        "Xiaomi, Huawei, Honor, Oppo, teils Samsung: „Autostart“ erlauben und die App von „Schlafende Apps“ ausnehmen.",
        "Version ohne Google-Dienste (F-Droid): Companion App → Server → „Dauerhafte Verbindung“ auf „Immer“.",
      ])}</ul>`;
      const order = devicePlatform() === "android" ? android + ios : ios + android;
      return `<details class="tipbox" ${open ? "open" : ""}><summary>${T("Tipps, falls keine Benachrichtigung ankommt")}</summary>${order}
        <div class="sub2" style="margin-top:4px">${T("Zum Empfangen braucht das Handy keine Verbindung nach Hause – Home Assistant selbst muss aber Internet haben. Zum Antworten aus der Benachrichtigung unterwegs ist Fernzugriff nötig (z. B. Home Assistant Cloud).")}</div></details>`;
    }

    async _testPush() {
      let r;
      try { r = await this._ws({ type: "ha_chat/test_push" }); } catch (e) { return; }
      const ready = r.devices.filter((d) => d.service);
      const rows = r.devices.map((d) => `<div class="dev">${icon("phone", 16)}<b style="font-weight:500">${esc(d.name)}</b>${d.os ? `<span class="time">${esc(d.os)}</span>` : ""}
        ${d.service ? `<span class="ok">· ${T("Push bereit")}</span>` : `<span class="bad">· ${d.push ? T("Benachrichtigungsdienst fehlt (Home Assistant neu starten)") : T("Push nicht eingerichtet")}</span>`}</div>`).join("");
      let head;
      if (!r.devices.length) head = `<div class="warn">${T("Für deinen Benutzer ist kein Smartphone mit der <b>Home Assistant Companion App</b> angemeldet. Installiere die App und melde dich mit deinem Benutzer an – dann bekommst du Chat-Nachrichten als Push.")}</div>`;
      else if (!ready.length) head = `<div class="warn">${T("Deine Geräte können zurzeit keine Push empfangen. Öffne die Companion App einmal, erlaube Benachrichtigungen und starte Home Assistant ggf. neu.")}</div>`;
      else head = `<div class="warn" style="background:color-mix(in srgb,#43a047 14%,var(--hc-bg))">${ready.length === 1 ? T("<b>In {s} Sekunden</b> kommt eine Test-Benachrichtigung auf dein Gerät.", { s: r.delay }) : T("<b>In {s} Sekunden</b> kommt eine Test-Benachrichtigung auf {n} Geräte.", { s: r.delay, n: ready.length })} ${T("Sperre jetzt das Display oder wechsle in eine andere App – so prüfst du, ob Nachrichten auch bei geschlossener App ankommen.")}</div>`;
      const target = ready.length && r.link ? `<div class="sub2">${T("Tippst du die Benachrichtigung an, öffnet sich <b>{link}</b> – dort, wo du die Chat-Karte benutzt.", { link: esc(r.link) })}</div>` : "";
      this._dialog(`<h3>${T("Erreichbarkeit testen")}</h3>${head}${rows}${target}${this._tipsHtml(!ready.length)}
        <div class="btns"><button class="btn" data-a="close">${T("Schließen")}</button></div>`);
    }

    // Bestätigung innerhalb eines Vollbild-Panels (ohne das Panel zu schließen)
    _innerConfirm(host, text, hint, okLabel) {
      return new Promise((resolve) => {
        const ov = document.createElement("div");
        ov.className = "ov";
        ov.innerHTML = `<div class="dlg" role="alertdialog" aria-modal="true"><h3>${esc(text)}</h3>${hint ? `<div class="sub2">${esc(hint)}</div>` : ""}
          <div class="btns"><button class="btn" data-no>${T("Abbrechen")}</button><button class="btn p" data-yes>${esc(okLabel)}</button></div></div>`;
        const done = (v) => { ov.remove(); resolve(v); };
        ov.addEventListener("click", (e) => {
          if (e.target === ov || e.target.closest("[data-no]")) done(false);
          else if (e.target.closest("[data-yes]")) done(true);
        });
        ov.addEventListener("keydown", (e) => { if (e.key === "Escape") { e.stopPropagation(); done(false); } });
        host.appendChild(ov);
        ov.querySelector("[data-yes]").focus();
      });
    }

    // --------------------------------------------------------- Speicher & Geräte (Administratoren)
    _adminPanel(tab) {
      this.$layer.innerHTML = `<div class="sp adm" role="dialog" aria-modal="true" aria-label="${T("Speicher & Geräte")}">
        <div class="bar2"><button class="ib" data-a="close" aria-label="${T("Schließen")}">${icon("back")}</button>
          <span class="ctitle"><span class="n">${T("Speicher & Geräte")}</span><span class="s">${T("Nur für Administratoren")}</span></span></div>
        <div class="scope"><button class="chipb" data-tab="storage">${T("Speicher")}</button><button class="chipb" data-tab="devices">${T("Erreichbarkeit")}</button></div>
        <div class="res"><div class="note">${T("Lade …")}</div></div></div>`;
      const sp = this.$layer.firstElementChild;
      const res = sp.querySelector(".res");
      sp.querySelector('[data-a="close"]').focus();
      let data = null;
      const KIND = { home: T("Kanal"), group: T("Gruppe"), direct: T("Direktchat") };
      const drawStorage = () => {
        const t = data.totals;
        const files = Math.max(0, t.media_bytes - t.avatar_bytes);
        let html = `<div class="tot">
            <div class="tile"><b>${fmtBytes(t.total_bytes)}</b><span>${T("Gesamt")}</span></div>
            <div class="tile"><b>${fmtBytes(files)}</b><span>${T("Bilder, Videos & Dateien")}</span></div>
            <div class="tile"><b>${fmtBytes(t.db_bytes)}</b><span>${T("Nachrichten (Datenbank)")}</span></div>
            <div class="tile"><b>${fmtBytes(t.avatar_bytes)}</b><span>${T("Profil- & Gruppenbilder")}</span></div></div>
          <div class="sec">${T("Nachrichten werden automatisch nach {n} Tagen gelöscht (änderbar unter Einstellungen → Geräte & Dienste → HA Chat → Konfigurieren).", { n: data.retention_days })}</div>`;
        if (t.orphan_files) html += `<div class="sec"><span class="bad">${t.orphan_files === 1 ? T("1 verwaiste Datei") : T("{n} verwaiste Dateien", { n: t.orphan_files })} (${fmtBytes(t.orphan_bytes)})</span> – ${T("gehören zu keiner Nachricht mehr.")} <button class="chipb" data-act="orphans">${T("Entfernen")}</button></div>`;
        html += `<div class="sec">${T("Ältere Nachrichten in allen Chats löschen: älter als")}
            <select data-days aria-label="${T("Alter in Tagen")}">${[7, 14, 30, 60, 90, 180, 365].map((d) => `<option value="${d}" ${d === 30 ? "selected" : ""}>${T("{n} Tage", { n: d })}</option>`).join("")}</select>
            <button class="chipb danger" data-act="older_than">${T("Löschen")}</button></div>
          <h4>${T("Platzbedarf je Chat")}</h4>`;
        html += data.conversations.map((c) => `<div class="crow">${avatar(c.name, null, "c" + c.id, 40, c.kind === "home")}
            <span class="txt"><span class="row"><span class="name">${esc(c.name)}</span><span class="time">${esc(KIND[c.kind])}</span></span>
              <span class="snip">${c.messages === 1 ? T("1 Nachricht") : T("{n} Nachrichten", { n: c.messages })} · ${c.attachments === 1 ? T("1 Anhang") : T("{n} Anhänge", { n: c.attachments })} · <b style="font-weight:500;color:var(--hc-text)">${fmtBytes(c.attachment_bytes)}</b>${c.oldest ? ` · ${T("seit {date}", { date: esc(new Date(c.oldest * 1000).toLocaleDateString(I18N.locale)) })}` : ""}</span>
              ${c.kind !== "home" ? `<span class="snip">${esc(c.member_names.join(", "))}</span>` : ""}
              <span class="acts">
                ${c.attachments ? `<button class="chipb" data-act="purge_media" data-id="${c.id}">${T("Medien löschen")}</button>` : ""}
                ${c.messages ? `<button class="chipb danger" data-act="clear_messages" data-id="${c.id}">${T("Leeren")}</button>` : ""}
                ${c.kind !== "home" ? `<button class="chipb danger" data-act="delete_conversation" data-id="${c.id}">${T("Chat löschen")}</button>` : ""}
              </span></span></div>`).join("");
        res.innerHTML = html;
      };
      const drawDevices = (list) => {
        res.innerHTML = list.map((u) => `<div class="crow">${avatar(u.name, null, u.user_id, 40)}<span class="txt"><span class="name">${esc(u.name)}</span>
            ${u.devices.length ? u.devices.map((d) => `<span class="dev">${icon("phone", 16)}<span>${esc(d.name)}${d.os ? ` (${esc(d.os)})` : ""}</span>
              ${d.service ? `<span class="ok">· ${T("Push bereit")}</span>` : `<span class="bad">· ${d.push ? T("Dienst fehlt – Home Assistant neu starten") : T("Push nicht eingerichtet")}</span>`}
              ${d.sent_today ? `<span class="time">· ${d.sent_today === 1 ? T("heute 1 Chat-Push") : T("heute {n} Chat-Pushs", { n: d.sent_today })}</span>` : ""}</span>`).join("")
              : `<span class="dev bad">${T("Kein Smartphone mit der Companion App – bekommt keine Push-Nachrichten")}</span>`}</span></div>`).join("")
          + `<div class="sec">${T("Die kostenlose Push-Zustellung von Home Assistant erlaubt 500 Benachrichtigungen pro Gerät und Tag – für alle Automationen zusammen. Kurz hintereinander geschriebene Nachrichten fasst HA Chat zu einer Push zusammen. Ab 350 Chat-Pushs an einem Tag wird gedrosselt (höchstens eine je Chat alle 10 Minuten, Nachrichten mit höchster Priorität ausgenommen), damit z. B. Alarm-Meldungen nicht ausfallen.")}</div>
          <div class="sec">${T("Jeder kann seine Erreichbarkeit unter Profil → „Erreichbarkeit testen“ selbst prüfen.")}</div>`;
      };
      const load = async () => {
        res.innerHTML = `<div class="note">${T("Lade …")}</div>`;
        sp.querySelectorAll("[data-tab]").forEach((b) => b.classList.toggle("on", b.dataset.tab === tab));
        try {
          if (tab === "storage") { data = await this._client.ws({ type: "ha_chat/storage" }); drawStorage(); }
          else drawDevices(await this._client.ws({ type: "ha_chat/devices" }));
        } catch (e) {
          res.innerHTML = `<div class="note">${esc(e?.message || T("Laden fehlgeschlagen"))}</div>`;
        }
      };
      const QUESTIONS = {
        purge_media: (c) => [T("Alle Bilder, Videos und Dateien in „{name}“ löschen?", { name: c.name }), T("Für alle Mitglieder. Textnachrichten bleiben erhalten. Das lässt sich nicht rückgängig machen."), T("Medien löschen")],
        clear_messages: (c) => [T("Alle Nachrichten in „{name}“ löschen?", { name: c.name }), T("Für alle Mitglieder, mitsamt Anhängen. Der Chat selbst bleibt bestehen."), T("Leeren")],
        delete_conversation: (c) => [T("Chat „{name}“ komplett löschen?", { name: c.name }), T("Für alle Mitglieder, mit allen Nachrichten und Dateien."), T("Löschen")],
        older_than: (_c, days) => [T("Alle Nachrichten löschen, die älter als {n} Tage sind?", { n: days }), T("In allen Chats und für alle Benutzer, mitsamt Anhängen."), T("Löschen")],
        orphans: () => [T("Verwaiste Dateien entfernen?"), T("Diese Dateien gehören zu keiner Nachricht mehr (z. B. abgebrochene Uploads)."), T("Entfernen")],
      };
      sp.addEventListener("click", async (e) => {
        const tb = e.target.closest("[data-tab]");
        if (tb) { tab = tb.dataset.tab; load(); return; }
        const btn = e.target.closest("[data-act]");
        if (!btn || btn.disabled) return;
        const action = btn.dataset.act;
        const id = btn.dataset.id ? Number(btn.dataset.id) : null;
        const conv = id ? data?.conversations.find((c) => c.id === id) : null;
        const days = action === "older_than" ? Number(sp.querySelector("[data-days]").value) : null;
        const [q, hint, ok] = QUESTIONS[action](conv || {}, days);
        if (!(await this._innerConfirm(sp, q, hint, ok))) return;
        btn.disabled = true;
        try {
          data = await this._client.ws({ type: "ha_chat/storage_action", action, conversation_id: id, days });
          drawStorage();
          const d = data.done;
          const parts = [];
          if (d.messages) parts.push(d.messages === 1 ? T("1 Nachricht") : T("{n} Nachrichten", { n: d.messages }));
          if (d.files) parts.push(d.files === 1 ? T("1 Datei") : T("{n} Dateien", { n: d.files }));
          this._toast(parts.length ? T("Erledigt – {what} entfernt", { what: parts.join(T(" und ")) }) : T("Erledigt"));
        } catch (err) {
          btn.disabled = false;
          this._error(err);
        }
      });
      load();
    }

    // Schneidet ein Bild quadratisch zu, verkleinert es und entfernt dabei alle Metadaten (z. B. GPS).
    _squareJpeg(file, size) {
      return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
          try {
            const side = Math.min(img.naturalWidth, img.naturalHeight);
            const c = document.createElement("canvas");
            c.width = size;
            c.height = size;
            const ctx = c.getContext("2d");
            ctx.fillStyle = "#fff";
            ctx.fillRect(0, 0, size, size);
            ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, size, size);
            resolve(c.toDataURL("image/jpeg", 0.86).split(",")[1]);
          } catch (e) {
            reject(e);
          } finally {
            URL.revokeObjectURL(url);
          }
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error(T("Dieses Bildformat kann hier nicht gelesen werden. Bitte ein JPEG- oder PNG-Bild wählen.")));
        };
        img.src = url;
      });
    }

    _viewer(src) {
      this.$layer.innerHTML = `<div class="viewer" role="dialog" aria-modal="true"><div class="vb">
        <a class="ib" href="${esc(src)}" download target="_blank" rel="noopener" aria-label="${T("Herunterladen")}">${icon("file")}</a>
        <button class="ib" data-a="close" aria-label="${T("Schließen")}">${icon("close")}</button></div><img src="${esc(src)}" alt="${T("Bild")}"></div>`;
      this.$layer.querySelector('.viewer [data-a="close"]').focus();
    }

    // --------------------------------------------------------- Verfassen
    _renderReplyBar() {
      const m = this._mode?.msg;
      if (!this._mode) {
        this.$reply.hidden = true;
        this.$reply.style.display = "none";
        return;
      }
      let html = "";
      if (this._mode) {
        const label = this._mode.type === "edit" ? T("Nachricht bearbeiten") : m.sender_name;
        html = `<div class="q"><b>${esc(label)}</b><span>${esc(m.text || preview(m))}</span></div>`;
      }
      this.$reply.innerHTML = `${html}<button class="ib" data-a="cancel-mode" aria-label="${T("Abbrechen")}">${icon("close", 18)}</button>`;
      this.$reply.hidden = false;
      this.$reply.style.display = "";
    }

    _clearMode() {
      const wasEdit = this._mode?.type === "edit";
      this._mode = null;
      if (wasEdit) { this.$ta.value = ""; this._autosize(); }
      this._renderReplyBar();
      this._updatePrimary();
    }

    _autosize() {
      this.$ta.style.height = "auto";
      this.$ta.style.height = Math.min(140, this.$ta.scrollHeight + 2) + "px";
    }

    _onType() {
      this._autosize();
      this._updatePrimary();
      const now = Date.now();
      if (this._openId && this.$ta.value && now - (this._lastTyping || 0) > 3000) {
        this._lastTyping = now;
        this._client.ws({ type: "ha_chat/typing", conversation_id: this._openId }).catch(() => {});
      }
    }

    _updatePrimary() {
      const canSend = !!this.$ta.value.trim() || (this._staged?.length > 0 && !this._sending) || this._mode?.type === "edit";
      this.$primary.disabled = !canSend;
    }

    _primary() {
      if (!this.$primary.disabled) this._send();
    }

    async _send() {
      const text = this.$ta.value.trim();
      const conv = this._openId;
      if (!conv) return;
      if (this._mode?.type === "edit") {
        const id = this._mode.msg.id;
        if (!text) return;
        this.$ta.value = "";
        this._clearMode();
        this._autosize();
        await this._ws({ type: "ha_chat/edit", message_id: id, text }).catch(() => {});
        return;
      }
      if (this._sending) return;
      if (!text && !this._staged.length) return;
      if (!this._client.msgs.get(conv)?.newest) {
        await this._client.loadMessages(conv, true).catch(() => {});
      }
      this._hidePops();
      if (this._staged.length) return this._sendStaged(conv, text);
      const msg = { type: "ha_chat/send", conversation_id: conv, text };
      if (this._mode?.type === "reply") msg.reply_to = this._mode.msg.id;
      if (this._important) msg.important = true;
      this.$ta.value = "";
      this._autosize();
      this._mode = null;
      this._renderReplyBar();
      this._updatePrimary();
      this._forceBottom = true;
      try {
        await this._ws(msg);
        if (msg.important) this._setImportant(false);
      } catch (e) {
        this.$ta.value = text;
        this._updatePrimary();
      }
    }

    // "Mit höchster Priorität senden" gilt für die nächste Nachricht (bzw. die nächsten Anhänge).
    _setImportant(on) {
      this._important = !!on;
      if (!this.$prio) return;
      this.$prio.hidden = !on;
      this.$prio.innerHTML = on
        ? `${icon("alert")}<span><b>${T("Höchste Priorität")}</b><small>${T("Kommt bei den Empfängern auch durch „Nicht stören“ bzw. den Fokus-Modus (wenn erlaubt). Gilt für die nächste Nachricht.")}</small></span><button class="ib" data-a="prio-off" aria-label="${T("Höchste Priorität ausschalten")}">${icon("close", 18)}</button>`
        : "";
      this.$primary?.classList.toggle("imp", !!on);
      this.$primary?.setAttribute("aria-label", on ? T("Mit höchster Priorität senden") : T("Senden"));
      if (this.$ta) this.$ta.placeholder = on ? T("Wichtige Nachricht schreiben") : T("Nachricht schreiben");
    }

    // --------------------------------------------------------- Ablage (Fotos, Videos, Dateien)
    _stageFiles(files) {
      if (!this._openId || !files.length) return;
      for (const f of files) {
        if (this._staged.length >= 10) { this._toast(T("Höchstens 10 Dateien auf einmal")); break; }
        if (f.size > 100 * 1024 * 1024) { this._error(new Error(`${f.name}: ${T("zu groß (max. 100 MB)")}`)); continue; }
        const kind = f.type.startsWith("image/") ? "image" : f.type.startsWith("video/") ? "video" : "file";
        this._staged.push({ file: f, kind, url: kind === "file" ? null : URL.createObjectURL(f) });
      }
      this._renderTray();
      this._updatePrimary();
      this.$ta.focus();
    }

    _unstage(i) {
      const it = this._staged[i];
      if (it?.url) URL.revokeObjectURL(it.url);
      this._staged.splice(i, 1);
      this._renderTray();
      this._updatePrimary();
    }

    _clearStaged() {
      for (const it of this._staged || []) if (it.url) URL.revokeObjectURL(it.url);
      this._staged = [];
      this._sending = false;
      this._renderTray();
    }

    _renderTray(status) {
      if (!this.$tray) return;
      if (!this._staged?.length) { this.$tray.hidden = true; this.$tray.innerHTML = ""; return; }
      const hasImg = this._staged.some((s) => s.kind === "image");
      this.$tray.hidden = false;
      this.$tray.innerHTML = `<div class="thumbs">${this._staged.map((s, i) => `<div class="th">
          <span class="pv">${s.kind === "image" ? `<img src="${esc(s.url)}" alt="" onerror="this.replaceWith(document.createTextNode('${T("Bild")}'))">` : s.kind === "video" ? `<video src="${esc(s.url)}" muted playsinline preload="metadata"></video>` : icon("file", 28)}</span>
          <span class="nm" title="${esc(s.file.name || T("Datei"))}">${esc(s.file.name || T("Datei"))}</span>
          <span class="nm">${fmtSize(s.file.size)}</span>
          ${this._sending ? "" : `<button class="x" data-a="unstage" data-i="${i}" aria-label="${esc(T("{name} entfernen", { name: s.file.name }))}">${icon("close", 14)}</button>`}
        </div>`).join("")}</div>
        <div class="trow">${hasImg ? `<label><input type="checkbox" class="origchk" ${this._original ? "checked" : ""} ${this._sending ? "disabled" : ""}>${T("Originalqualität (nicht verkleinern)")}</label>` : ""}
          <span style="flex:1"></span><span>${esc(status || (this._staged.length > 1 ? T("{n} Dateien – der Text wird mit der ersten gesendet", { n: this._staged.length }) : T("Optional: Text dazu schreiben")))}</span></div>`;
    }

    async _sendStaged(conv, text) {
      this._sending = true;
      const important = this._important;
      const replyTo = this._mode?.type === "reply" ? this._mode.msg.id : null;
      this._mode = null;
      this._renderReplyBar();
      this._updatePrimary();
      this._forceBottom = true;
      let sentText = false;
      try {
        while (this._staged.length) {
          const it = this._staged[0];
          const total = this._staged.length;
          this._renderTray(T("Sende … (noch {n})", { n: total }));
          const file = it.kind === "image" && !this._original ? await shrinkImage(it.file) : it.file;
          const att = await this._client.upload(conv, file);
          const msg = { type: "ha_chat/send", conversation_id: conv, text: sentText ? "" : text, attachment_id: att.id };
          if (!sentText && replyTo) msg.reply_to = replyTo;
          if (important) msg.important = true;
          await this._ws(msg);
          if (!sentText) { sentText = true; if (this.$ta.value.trim() === text) { this.$ta.value = ""; this._autosize(); } }
          if (it.url) URL.revokeObjectURL(it.url);
          this._staged.shift();
        }
        if (important) this._setImportant(false);
      } catch (e) {
        this._error(e);
      } finally {
        this._sending = false;
        this._renderTray();
        this._updatePrimary();
      }
    }

    _attachMenu() {
      if (!this._openId) return;
      this._dialog(
        `<h3>${T("Anhängen")}</h3>
         <button class="act" data-x="cam">${icon("camera")}${T("Foto aufnehmen")}</button>
         <button class="act" data-x="gal">${icon("image")}${T("Fotos & Videos aus der Galerie")}</button>
         <button class="act" data-x="file">${icon("file")}${T("Datei")}</button>
         <button class="act" data-x="loc">${icon("pin")}${T("Standort senden")}</button>
         <button class="act ${this._important ? "on" : ""}" data-x="prio">${icon("alert")}<span>${this._important ? T("Höchste Priorität ausschalten") : T("Mit höchster Priorität senden")}<small>${T("Für Dringendes: kommt auch bei „Nicht stören“ an")}</small></span></button>
         <div class="btns"><button class="btn" data-a="close">${T("Abbrechen")}</button></div>`,
        (dlg) => dlg.addEventListener("click", (e) => {
          const x = e.target.closest("[data-x]")?.dataset.x;
          if (!x) return;
          this._closeLayer();
          if (x === "cam") this.$cin.click();
          if (x === "gal") this.$gin.click();
          if (x === "file") this.$fin.click();
          if (x === "loc") this._locationFlow();
          if (x === "prio") { this._setImportant(!this._important); if (this._important) this.$ta.focus(); }
        })
      );
    }

    // --------------------------------------------------------- Emojis & Erwähnungen
    _hidePops() {
      if (this.$emo) this.$emo.hidden = true;
      if (this.$mlist) this.$mlist.hidden = true;
    }

    _recentEmojis() {
      try { return JSON.parse(localStorage.getItem("ha_chat_recent_emojis") || "[]"); } catch (e) { return []; }
    }

    _toggleEmoji() {
      if (!this.$emo.hidden) { this.$emo.hidden = true; return; }
      const recent = this._recentEmojis();
      const groups = recent.length ? { "Zuletzt verwendet": recent.join(" "), ...EMOJIS } : EMOJIS; // Überschriften werden unten übersetzt
      this.$emo.innerHTML = Object.entries(groups).map(([t, list]) => `<h4>${esc(T(t))}</h4><div class="g">${list.split(" ").filter(Boolean).map((e) => `<button data-a="emo" data-e="${esc(e)}" aria-label="${esc(e)}">${esc(e)}</button>`).join("")}</div>`).join("");
      this.$mlist.hidden = true;
      this.$emo.hidden = false;
    }

    _insertText(t) {
      const ta = this.$ta;
      const start = ta.selectionStart ?? ta.value.length, end = ta.selectionEnd ?? ta.value.length;
      ta.setRangeText(t, start, end, "end");
      this._onType();
      if (!this._isTouch()) ta.focus();
      try {
        const r = [t, ...this._recentEmojis().filter((x) => x !== t)].slice(0, 16);
        localStorage.setItem("ha_chat_recent_emojis", JSON.stringify(r));
      } catch (e) { /* ohne Speicher keine Verlaufsliste */ }
    }

    _checkMention() {
      const c = this._openId ? this._client.convs.get(this._openId) : null;
      if (!c || !c.is_group) { this.$mlist.hidden = true; return; }
      const before = this.$ta.value.slice(0, this.$ta.selectionStart ?? 0);
      const m = before.match(/(^|\s)@([^\s@]{0,30})$/);
      if (!m) { this.$mlist.hidden = true; return; }
      const q = m[2].toLowerCase();
      const me = this._me();
      const list = c.members.filter((x) => x.user_id !== me && x.name && x.name.toLowerCase().includes(q)).slice(0, 8);
      if (!list.length) { this.$mlist.hidden = true; return; }
      this.$mlist.innerHTML = list.map((x) => `<button data-a="mention" data-name="${esc(x.name)}">${avatar(x.name, x.picture, x.user_id, 28)}<span>${esc(x.name)}</span></button>`).join("");
      this.$emo.hidden = true;
      this.$mlist.hidden = false;
    }

    _insertMention(name) {
      const ta = this.$ta;
      const pos = ta.selectionStart ?? ta.value.length;
      const before = ta.value.slice(0, pos).replace(/@([^\s@]{0,30})$/, "@" + name + " ");
      ta.value = before + ta.value.slice(pos);
      ta.selectionStart = ta.selectionEnd = before.length;
      this.$mlist.hidden = true;
      this._onType();
      ta.focus();
    }

    _toast(text) {
      const el = document.createElement("div");
      el.className = "toast";
      el.textContent = text;
      this._wrap.appendChild(el);
      setTimeout(() => el.remove(), 2500);
    }

    // --------------------------------------------------------- Weiterleiten & Info
    _forwardDialog(m) {
      const convs = this._client.sortedConversations();
      this._dialog(
        `<h3>${T("Weiterleiten an …")}</h3>
         <div>${convs.map((c) => `<label class="chk"><input type="checkbox" value="${c.id}">${avatar(c.name, c.picture, "c" + c.id, 36, c.is_system)}<span>${esc(c.name)}</span></label>`).join("")}</div>
         <div class="btns"><button class="btn" data-a="close">${T("Abbrechen")}</button><button class="btn p" data-ok disabled>${T("Weiterleiten")}</button></div>`,
        (dlg) => {
          const ok = dlg.querySelector("[data-ok]");
          const sel = () => [...dlg.querySelectorAll("input:checked")].map((i) => Number(i.value));
          dlg.addEventListener("change", () => {
            const n = sel().length;
            ok.disabled = n === 0 || n > 10;
            ok.textContent = n > 10 ? T("Höchstens 10 Chats") : T("Weiterleiten");
          });
          ok.addEventListener("click", async () => {
            const ids = sel();
            this._closeLayer();
            try {
              const r = await this._ws({ type: "ha_chat/forward", message_id: m.id, conversation_ids: ids });
              this._toast(r.count === 1 ? T("Weitergeleitet") : T("An {n} Chats weitergeleitet", { n: r.count }));
            } catch (e) { /* Fehler wird angezeigt */ }
          });
        }
      );
    }

    async _readInfo(m) {
      let list;
      try { list = await this._ws({ type: "ha_chat/read_info", message_id: m.id }); } catch (e) { return; }
      const c = this._client.convs.get(this._openId);
      const pic = (uid) => c?.members.find((x) => x.user_id === uid)?.picture;
      const read = list.filter((x) => x.read_at !== null).sort((a, b) => (a.read_at || 0) - (b.read_at || 0));
      const unread = list.filter((x) => x.read_at === null);
      const row = (x, right) => `<div class="row" style="min-height:44px">${avatar(x.name, pic(x.user_id), x.user_id, 32)}<span style="flex:1">${esc(x.name)}</span><span class="time">${esc(right)}</span></div>`;
      this._dialog(
        `<h3>${T("Nachrichteninfo")}</h3>
         <div style="font-size:13px;color:var(--hc-sub)">${T("Gesendet")} ${esc(fmtDateTime(m.created_at))}</div>
         <b style="font-weight:500">${T("Gelesen ({n})", { n: read.length })}</b>
         ${read.map((x) => row(x, x.read_at ? fmtDateTime(x.read_at) : T("gelesen"))).join("") || `<div class="time">${T("Noch von niemandem")}</div>`}
         ${unread.length ? `<b style="font-weight:500">${T("Noch nicht gelesen ({n})", { n: unread.length })}</b>${unread.map((x) => row(x, "")).join("")}` : ""}
         <div class="btns"><button class="btn" data-a="close">${T("Schließen")}</button></div>`
      );
    }

    // --------------------------------------------------------- Medien-Übersicht
    _mediaPanel(convId) {
      const c = this._client.convs.get(convId);
      if (!c) return;
      this.$layer.innerHTML = `<div class="sp" role="dialog" aria-modal="true" aria-label="${T("Medien, Dateien & Links")}">
        <div class="bar2"><button class="ib" data-a="close" aria-label="${T("Schließen")}">${icon("back")}</button>
          <span class="ctitle"><span class="n">${esc(c.name)}</span><span class="s">${T("Medien, Dateien & Links")}</span></span></div>
        <div class="scope"><button class="chipb on" data-kind="media">${T("Medien")}</button><button class="chipb" data-kind="files">${T("Dateien")}</button><button class="chipb" data-kind="links">${T("Links")}</button></div>
        <div class="res"></div></div>`;
      const sp = this.$layer.firstElementChild;
      const res = sp.querySelector(".res");
      // Fokus ins Fenster, damit Esc und Tastaturbedienung funktionieren
      sp.querySelector('[data-a="close"]').focus();
      let kind = "media", items = [], done = false, loading = false;
      const draw = () => {
        if (!items.length) {
          res.innerHTML = `<div class="note">${loading ? T("Lade …") : T({ media: "Noch keine Fotos oder Videos", files: "Noch keine Dateien", links: "Noch keine Links" }[kind])}</div>`;
          return;
        }
        let html;
        if (kind === "media") {
          html = `<div class="grid">${items.map((m) => m.attachment.mime.startsWith("image/") && mediaKind(m.attachment.mime) === "image"
            ? `<button data-src="${esc(m.attachment.url)}" aria-label="${esc(m.attachment.filename)}"><img src="${esc(m.attachment.url)}" alt="" loading="lazy"></button>`
            : `<button data-jump="${m.id}" aria-label="${T("Video")} ${esc(m.attachment.filename)}">${icon("play", 32)}</button>`).join("")}</div>`;
        } else if (kind === "files") {
          html = items.map((m) => `<button class="hit" data-jump="${m.id}">${icon("file", 28)}<span class="txt"><span class="row"><span class="name">${esc(m.attachment.filename)}</span><span class="time">${esc(fmtDateTime(m.created_at))}</span></span><span class="snip">${esc(m.sender_name)} · ${fmtSize(m.attachment.size)}</span></span></button>`).join("");
        } else {
          html = items.map((m) => {
            const url = (m.text.match(/https?:\/\/[^\s<]+/) || [""])[0];
            return `<div class="hit"><span style="color:var(--hc-acc)">${icon("link", 24)}</span><span class="txt"><a href="${esc(url)}" target="_blank" rel="noopener noreferrer" style="color:var(--hc-acc);word-break:break-all">${esc(url)}</a><span class="snip">${esc(m.sender_name)} · ${esc(fmtDateTime(m.created_at))} · <button class="chipb" data-jump="${m.id}" style="height:26px">${T("Im Chat zeigen")}</button></span></span></div>`;
          }).join("");
        }
        res.innerHTML = html + (done ? "" : `<div class="note"><button class="btn" data-more>${T("Mehr laden")}</button></div>`);
      };
      const load = async () => {
        if (loading || done) return;
        loading = true;
        draw();
        try {
          const before = items.length ? items[items.length - 1].id : null;
          const got = await this._client.ws({ type: "ha_chat/media", conversation_id: convId, kind, before, limit: 60 });
          items = items.concat(got);
          done = got.length < 60;
        } catch (e) {
          res.innerHTML = `<div class="note">${esc(e?.message || T("Laden fehlgeschlagen"))}</div>`;
          loading = false;
          return;
        }
        loading = false;
        draw();
      };
      sp.addEventListener("click", (e) => {
        const chip = e.target.closest("[data-kind]");
        if (chip) {
          kind = chip.dataset.kind; items = []; done = false;
          sp.querySelectorAll("[data-kind]").forEach((b) => b.classList.toggle("on", b === chip));
          load();
          return;
        }
        if (e.target.closest("[data-more]")) return load();
        const src = e.target.closest("[data-src]")?.dataset.src;
        if (src) return this._viewer(src);
        const jump = e.target.closest("[data-jump]")?.dataset.jump;
        if (jump) { this._closeLayer(); this._openAt(convId, Number(jump)); }
      });
      load();
    }

    // --------------------------------------------------------- Standort
    _locationFlow() {
      const conv = this._openId;
      if (!conv) return;
      const canGps = window.isSecureContext && !!navigator.geolocation;
      const st = { gps: null, gpsMsg: canGps ? T("wird ermittelt …") : T("nur über HTTPS möglich"), gpsDone: !canGps, app: null, appMsg: T("Standort wird bei der Companion App angefragt …"), appDone: false, started: Date.now() / 1000 };
      this._dialog(
        `<h3>${T("Standort senden")}</h3><div class="locbox"></div>
         <div class="btns"><button class="btn" data-a="close">${T("Abbrechen")}</button><button class="btn p" data-ok disabled>${T("Senden")}</button></div>`,
        (dlg) => {
          dlg.querySelector("[data-ok]").addEventListener("click", async () => {
            const best = pick();
            if (!best) return;
            this._closeLayer();
            this._forceBottom = true;
            try {
              if (!this._client.msgs.get(conv)?.newest) await this._client.loadMessages(conv, true);
              const important = this._important && this._openId === conv;
              await this._ws({ type: "ha_chat/send", conversation_id: conv, text: "", important, location: { lat: best.lat, lon: best.lon, acc: best.acc ?? null, ts: best.ts, source: best.source } });
              if (important) this._setImportant(false);
            } catch (e) { /* Fehler wird angezeigt */ }
          });
        }
      );
      const dlg = this.$layer.querySelector(".dlg");
      const box = dlg.querySelector(".locbox");
      const ok = dlg.querySelector("[data-ok]");
      // Reihenfolge: GPS dieses Geräts (genau) > frischer Standort der App > alter Standort (nur mit Warnung)
      const pick = () => {
        if (st.gps && (st.gps.acc ?? 9999) <= 500) return st.gps;
        if (st.app && !st.app.old) return st.app;
        if (st.gps) return st.gps;
        if (st.app && st.gpsDone && st.appDone) return st.app;
        return null;
      };
      const render = () => {
        if (!box.isConnected) return;
        const best = pick();
        const pending = !st.gpsDone || !st.appDone;
        const src = (label, msg, fix) => `<div class="locsrc">${icon("pin", 18)}<span><b>${label}:</b> ${fix ? `±${fix.acc ?? "?"} m, ${T("Stand vor {age}", { age: fmtAge(Date.now() / 1000 - fix.ts) })}` : esc(msg)}</span></div>`;
        let html = src(T("GPS dieses Geräts"), st.gpsMsg, st.gps) + src("Companion App", st.appMsg, st.app);
        if (best) {
          html += `<div>${mapHtml(best, 300, 150)}</div>`;
          if (best.old) html += `<div class="warn">${T("Achtung: Ein aktueller Standort war nicht verfügbar. Das ist der <b>letzte bekannte Standort von vor {age}</b>.", { age: fmtAge(Date.now() / 1000 - best.ts) })}</div>`;
          else if ((best.acc ?? 0) > 500) html += `<div class="warn">${T("Der Standort ist ungenau (±{acc} m).", { acc: best.acc })}</div>`;
          if (pending) html += `<div class="locsrc">${T("Ein genauerer Standort kann noch kommen …")}</div>`;
        } else if (pending) {
          html += `<div class="locsrc">${T("Bitte warten, das kann bis zu 25 Sekunden dauern …")}</div>`;
        } else {
          html += `<div class="warn">${T("<b>Kein Standort verfügbar.</b> Bitte prüfen:<br>• Ist auf dem Handy die Standortermittlung (GPS) eingeschaltet?<br>• Darf die Companion App den Standort verwenden – auch im Hintergrund? (In der App: Einstellungen → Companion App → Sensoren bzw. Standort)<br>• Ist dein Home-Assistant-Benutzer einer Person mit diesem Handy zugeordnet? (Einstellungen → Personen)")}</div>`;
        }
        box.innerHTML = html;
        ok.disabled = !best;
        ok.textContent = best?.old ? T("Trotzdem senden") : T("Senden");
      };
      if (canGps) {
        navigator.geolocation.getCurrentPosition(
          (pos) => { st.gps = { lat: pos.coords.latitude, lon: pos.coords.longitude, acc: Math.round(pos.coords.accuracy), ts: pos.timestamp / 1000, source: "gps" }; st.gpsDone = true; render(); },
          (err) => { st.gpsMsg = err.code === 1 ? T("Zugriff verweigert") : T("nicht verfügbar"); st.gpsDone = true; render(); },
          { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
        );
      }
      this._client.ws({ type: "ha_chat/locate", refresh: true }).then((r) => {
        if (r.status === "no_person") st.appMsg = T("Dein Benutzer ist keiner Person zugeordnet");
        else if (r.status === "no_tracker") st.appMsg = T("keine Standortdaten von der App");
        else {
          const f = r.fixes[0];
          const age = r.now - f.ts;
          const fresh = r.fresh && age < 180;
          st.app = { lat: f.lat, lon: f.lon, acc: f.acc != null ? Math.round(f.acc) : null, ts: Date.now() / 1000 - age, source: fresh ? "app" : "app_old", old: !fresh };
          if (!fresh) st.appMsg = r.requested ? T("kein aktueller Standort erhalten") : T("App nicht erreichbar");
        }
      }).catch((e) => { st.appMsg = e?.message || T("Abfrage fehlgeschlagen"); })
        .finally(() => { st.appDone = true; render(); });
      render();
    }
  }

  // ------------------------------------------------------------ Kompakte Kachel
  class HaChatCompactCard extends HTMLElement {
    static getStubConfig() {
      return {};
    }

    static getConfigForm() {
      return {
        schema: [
          { name: "language", selector: { select: { mode: "dropdown", options: LANG_OPTIONS() } } },
          { name: "title", selector: { text: {} } },
          { name: "messages", default: 3, selector: { number: { min: 1, max: 10, mode: "box" } } },
          { name: "navigation_path", selector: { text: {} } },
        ],
        computeLabel: (s) => FORM_LABELS()[s.name],
        computeHelper: (s) => FORM_HELPERS()[s.name],
      };
    }

    setConfig(config) {
      this.config = { messages: 3, ...(config || {}) };
      this._syncLang(this._hass);
    }

    getCardSize() {
      return 6;
    }

    _syncLang(hass) {
      setLang(hass, this.config?.language);
      const prev = this._lang;
      this._lang = I18N.lang;
      if (prev && prev !== I18N.lang && this.$w && this._client) {
        this._sig = null;
        this._render();
        if (this._ready) this._client.reportLanguage(I18N.lang);
      }
    }

    getGridOptions() {
      return { columns: 6, rows: 6, min_columns: 4, min_rows: 4 };
    }

    set hass(hass) {
      this._hass = hass;
      this._syncLang(hass);
      if (this._popupCard) this._popupCard.hass = hass;
      if (this.$w) this.$w.classList.toggle("dark", !!hass?.themes?.darkMode);
      if (!this._client) {
        this._client = ChatClient.get(hass);
        this._listener = () => this._render();
        this._client.attach(this._listener);
        this._build();
        this._client.ready.then(() => { this._render(); this._afterReady(); }).catch((e) => {
          this._fatal = e?.code === "unknown_command" ? T("HA Chat ist noch nicht eingerichtet.") : e?.message || String(e);
          this._render();
        });
      } else this._client.hass = hass;
    }

    _afterReady() {
      this._ready = true;
      if (!this.isConnected || !this._client.info?.allowed) return;
      this._client.reportLanguage(I18N.lang);
      if (!this.config.navigation_path) this._client.reportView("compact");
      this._checkDeepLink();
    }

    // Sprung aus einer Push auf ein Dashboard, auf dem nur die Kachel liegt: Chat im Fenster öffnen.
    // Kurz warten – liegt auch die große Chat-Karte auf der Seite, übernimmt die.
    _checkDeepLink() {
      if (!this._ready || !this.isConnected || this._client.pendingDeepLink() === null) return;
      clearTimeout(this._dlTimer);
      this._dlTimer = setTimeout(async () => {
        if (!this.isConnected || this._client.pendingDeepLink() === null) return;
        const id = this._client.consumeDeepLink();
        if (!this._client.convs.has(id)) await this._client.loadConversations().catch(() => {});
        if (this._client.convs.has(id)) this._openChat(id, true);
      }, 600);
    }

    connectedCallback() {
      if (this._client && this._listener) this._client.attach(this._listener);
      if (!this._navHandler) this._navHandler = () => setTimeout(() => this._checkDeepLink(), 60);
      window.addEventListener("location-changed", this._navHandler);
      window.addEventListener("popstate", this._navHandler);
      document.addEventListener("visibilitychange", this._navHandler);
      if (this._ready) this._afterReady();
    }

    disconnectedCallback() {
      this._client?.detach(this._listener);
      window.removeEventListener("location-changed", this._navHandler);
      window.removeEventListener("popstate", this._navHandler);
      document.removeEventListener("visibilitychange", this._navHandler);
      clearTimeout(this._dlTimer);
      this._closePopup();
    }

    _build() {
      const root = this.attachShadow({ mode: "open" });
      root.innerHTML = `<style>${STYLE}
        .cw{display:flex;flex-direction:column;min-height:0;gap:12px;padding:14px}
        .top{display:flex;align-items:center;gap:12px}
        .ic{position:relative;width:44px;height:44px;border-radius:22px;background:var(--hc-soft);color:var(--hc-acc);display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .ic .badge{position:absolute;top:-3px;right:-5px;background:var(--error-color,#c62828);color:#fff}
        .ttl{display:flex;flex-direction:column;flex:1;min-width:0}.ttl b{font-weight:700;font-size:15px}
        .ttl span{font-size:13px;color:var(--hc-sub);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .obtn{height:36px;padding:0 14px;border:none;border-radius:18px;background:var(--hc-panel);font-size:13px;font-weight:500;flex-shrink:0}
        .box{border-radius:24px;background-color:var(--hc-pat);background-image:radial-gradient(var(--hc-dot) 1.2px,transparent 1.3px);background-size:18px 18px;
          padding:10px 12px;display:flex;flex-direction:column;gap:7px;color:var(--hc-btext)}
        .cname{align-self:center;display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 10px 0 4px;border:none;border-radius:14px;background:var(--hc-day);color:var(--hc-dayt);box-shadow:var(--hc-bsh);font-size:12px;font-weight:600;max-width:100%}
        .cname span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cname em{font-style:normal;color:var(--hc-acc)}
        .lines{display:flex;flex-direction:column;gap:7px}
        .lines .m{max-width:88%}.lines .b{cursor:default;font-size:13px;line-height:1.38;padding:5px 9px}
        .lines .b .tx{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
        .lines .meta{display:inline;margin-left:6px}
        .lines .none{align-self:center;font-size:12.5px;color:var(--hc-bmeta)}
        .qr{display:flex;gap:8px;margin-top:2px}
        .qr input{flex:1;min-width:0;height:40px;border-radius:20px;border:none;padding:0 12px;font:inherit;font-size:14px;background:var(--hc-bin);color:var(--hc-btext);outline:none;box-shadow:var(--hc-bsh)}
        .qr .ib.acc{width:40px;height:40px;border-radius:20px}
        .chips{display:flex;gap:8px;flex-wrap:wrap}
        .chip{height:36px;display:inline-flex;align-items:center;gap:6px;padding:0 12px 0 6px;border:none;border-radius:18px;background:var(--hc-panel);font-size:13px;max-width:100%}
        .chip span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.chip b{color:var(--hc-acc)}
        .chip.all{padding:0 14px}
        @media (pointer:coarse){.qr input{font-size:16px}}
      </style><ha-card><div class="wrap cw"></div></ha-card>`;
      this.$w = root.querySelector(".cw");
      this.$w.classList.toggle("dark", !!this._hass?.themes?.darkMode);
      root.addEventListener("click", (e) => this._onClick(e));
      root.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && e.target.matches(".qr input")) { e.preventDefault(); this._quickSend(); }
      });
    }

    _focusConv() {
      const list = this._client.sortedConversations();
      return list.find((c) => c.unread) || list[0] || null;
    }

    _render() {
      if (!this.$w) return;
      if (this._fatal || (this._client.info && !this._client.info.allowed)) {
        this.$w.innerHTML = `<div class="info">${esc(this._fatal || T("Du bist für den Chat nicht freigeschaltet."))}</div>`;
        return;
      }
      if (!this._client.info) return;
      const list = this._client.sortedConversations();
      const unread = this._client.totalUnread();
      const unreadChats = list.filter((c) => c.unread).length;
      const fc = this._focusConv();
      if (fc && !this._client.msgs.has(fc.id) && this._loading !== fc.id) {
        this._loading = fc.id;
        this._client.loadMessages(fc.id).catch(() => {}).finally(() => (this._loading = null));
      }
      const fst = fc ? this._client.msgs.get(fc.id) : null;
      const msgs = !fc ? [] : fst?.newest
        ? fst.list.filter((m) => !m.deleted).slice(-this.config.messages)
        : (fc.last_message && !fc.last_message.deleted ? [fc.last_message] : []);
      const me = this._client.info.me;
      const keepVal = this.$w.querySelector(".qr input")?.value || "";
      const hadFocus = this.shadowRoot.activeElement?.matches?.(".qr input");
      const chips = list.filter((c) => c !== fc).slice(0, 2);
      const sig = JSON.stringify([unread, fc && [fc.id, fc.name, fc.unread, fc.picture], msgs.map((m) => [m.id, m.text, m.edited_at]), chips.map((c) => [c.id, c.name, c.unread, c.picture]), this.config.title, list.filter((c) => c.unread).map((c) => c.name)]);
      if (sig === this._sig) return;
      this._sig = sig;
      const unreadNames = list.filter((c) => c.unread).map((c) => c.name).slice(0, 3).join(", ");
      const line = (m) => {
        const out = m.sender_id === me;
        const who = out ? "" : `<b class="sn" style="--c:${m.sender_id === SYSTEM ? "#e65100" : colorFor(m.sender_id)};display:inline">${esc(m.sender_name)}</b> `;
        return `<div class="m ${out ? "out" : "in"}"><div class="b"><span class="tx">${who}${esc(preview(m))}<span class="meta">${fmtTime(m.created_at)}</span></span></div></div>`;
      };
      this.$w.innerHTML = `
        <div class="top"><span class="ic">${icon("chat", 22)}${unread ? `<span class="badge">${unread}</span>` : ""}</span>
          <span class="ttl"><b>${esc(this.config.title || T("Chat"))}</b><span>${unread ? `${T("{n} ungelesen", { n: unread })} · ${esc(unreadNames)}` : T("Keine neuen Nachrichten")}</span></span>
          <button class="obtn" data-a="openall">${T("Öffnen")}</button></div>
        ${fc ? `<div class="box">
          <button class="cname" data-a="openc" data-id="${fc.id}" aria-label="${esc(T("Chat {name} öffnen", { name: fc.name }))}">${avatar(fc.name, fc.picture, "c" + fc.id, 22, fc.is_system, true)}<span>${esc(fc.name)}</span>${fc.unread ? `<em>${T("{n} neu", { n: fc.unread })}</em>` : ""}</button>
          <div class="lines">${msgs.length ? msgs.map(line).join("") : `<div class="none">${T("Noch keine Nachrichten")}</div>`}</div>
          <div class="qr"><input type="text" placeholder="${esc(T("Antwort an {name} …", { name: fc.name }))}" aria-label="${esc(T("Schnell antworten an {name}", { name: fc.name }))}"><button class="ib acc" data-a="qsend" aria-label="${T("Senden")}">${icon("send", 18)}</button></div>
        </div>` : `<div class="info">${T("Noch keine Chats.")}</div>`}
        <div class="chips">${chips.map((c) => `<button class="chip" data-a="openc" data-id="${c.id}">${avatar(c.name, c.picture, "c" + c.id, 24, c.is_system, true)}<span>${esc(c.name)}</span>${c.unread ? `<b>${c.unread}</b>` : ""}</button>`).join("")}<button class="chip all" data-a="openall">${T("Alle")}</button></div>`;
      const inp = this.$w.querySelector(".qr input");
      if (inp) {
        inp.value = keepVal;
        if (hadFocus) inp.focus();
      }
      this._fcId = fc?.id;
    }

    async _quickSend() {
      const inp = this.$w.querySelector(".qr input");
      const text = inp?.value.trim();
      if (!text || !this._fcId) return;
      inp.value = "";
      try {
        await this._client.ws({ type: "ha_chat/send", conversation_id: this._fcId, text });
        await this._client.ws({ type: "ha_chat/read", conversation_id: this._fcId }).catch(() => {});
      } catch (e) {
        inp.value = text;
      }
    }

    _onClick(e) {
      const el = e.target.closest("[data-a]");
      if (!el) return;
      const a = el.dataset.a;
      if (a === "qsend") return this._quickSend();
      if (a === "openall") return this._openChat(null);
      if (a === "openc") return this._openChat(Number(el.dataset.id));
    }

    _openChat(convId, popup = false) {
      if (this.config.navigation_path && !popup) {
        const p = this.config.navigation_path;
        navigate(convId ? `${p}${p.includes("?") ? "&" : "?"}ha_chat=${convId}` : p);
        return;
      }
      this._closePopup();
      // Auf dem Handy als Vollbild (ohne Rand, Kopfzeile unter der Statusleiste), sonst als Fenster
      const phone = Math.min(window.innerWidth, screen.width || window.innerWidth) < 640;
      const pop = document.createElement("div");
      pop.style.cssText = phone
        ? "position:fixed;inset:0;z-index:9999;background:var(--card-background-color,#fff);display:flex;flex-direction:column;box-sizing:border-box;padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)"
        : "position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:12px;box-sizing:border-box";
      const pw = document.createElement("div");
      pw.style.cssText = phone
        ? "flex:1;min-height:0;width:100%;display:flex;flex-direction:column;background:var(--card-background-color,#fff);color:var(--primary-text-color,#212121)"
        : "width:min(1000px,100%);height:min(88vh,900px);display:flex;flex-direction:column;border-radius:26px;overflow:hidden;background:var(--card-background-color,#fff);color:var(--primary-text-color,#212121)";
      const bar = document.createElement("div");
      bar.style.cssText = "display:flex;align-items:center;justify-content:flex-end;padding:2px 6px;flex-shrink:0" + (phone ? "" : ";border-bottom:1px solid var(--divider-color,#e0e0e0)");
      if (phone) {
        this._bodyOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden"; // Dashboard dahinter nicht mitscrollen
      }
      const x = document.createElement("button");
      x.setAttribute("aria-label", T("Chat schließen"));
      x.innerHTML = icon("close");
      x.style.cssText = "width:44px;height:44px;border-radius:22px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;background:transparent;color:inherit";
      x.addEventListener("click", () => this._closePopup());
      bar.appendChild(x);
      const card = document.createElement("ha-chat-card");
      card.setConfig({ height: "100%", open_conversation: convId, _popup: true, ...(this.config.language ? { language: this.config.language } : {}) });
      card.style.cssText = "flex:1;min-height:0";
      card.hass = this._hass;
      pw.append(bar, card);
      pop.appendChild(pw);
      pop.addEventListener("click", (ev) => { if (ev.target === pop) this._closePopup(); });
      this._escHandler = (ev) => { if (ev.key === "Escape") this._closePopup(); };
      document.addEventListener("keydown", this._escHandler);
      document.body.appendChild(pop);
      this._popEl = pop;
      this._popupCard = card;
    }

    _closePopup() {
      if (this._popEl && this._bodyOverflow !== undefined) {
        document.body.style.overflow = this._bodyOverflow;
        this._bodyOverflow = undefined;
      }
      this._popEl?.remove();
      this._popEl = null;
      this._popupCard = null;
      if (this._escHandler) document.removeEventListener("keydown", this._escHandler);
      this._escHandler = null;
    }
  }

  customElements.define("ha-chat-card", HaChatCard);
  customElements.define("ha-chat-compact-card", HaChatCompactCard);
  window.customCards = window.customCards || [];
  window.customCards.push(
    { type: "ha-chat-card", name: "HA Chat", description: T("Privater Chat für berechtigte Benutzer (WhatsApp-ähnlich)."), preview: false },
    { type: "ha-chat-compact-card", name: "HA Chat – " + T("Kompakt"), description: T("Ungelesene Nachrichten, letzte Nachrichten und Schnellantwort."), preview: false }
  );
  console.info(`%c HA-CHAT %c ${VERSION} `, "background:#0277bd;color:#fff;padding:2px 4px;border-radius:3px 0 0 3px", "background:#e1f5fe;color:#01579b;padding:2px 4px;border-radius:0 3px 3px 0");
})();
