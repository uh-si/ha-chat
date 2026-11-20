# Changelog / Änderungsprotokoll

## 1.9.0 – 20.11.2026

### Neu
- HA Chat ist auf GitHub: https://github.com/uh-si/ha-chat
- Bereit für den Home Assistant Marketplace (ab Home Assistant 2026.11): Installation und Updates direkt unter Einstellungen -> Marketplace bzw. Einstellungen -> Updates.
- Manifest mit Dokumentation, Fehlermeldungen (Issue-Tracker), Verantwortlichem und Kategorie „Messaging & notifications -> Chat apps“.

### Geändert
- LIESMICH und Anleitung: Installation über den Marketplace; das Windows-Setup bleibt als Alternative erhalten.

## 1.8.1 – 19.11.2026

- Der persönliche Kanal heißt jetzt „Home – Messages“ (statt „Home – privat“). Bereits angelegte Kanäle werden beim Start von HA Chat automatisch umbenannt; Nachrichten bleiben.
- LIESMICH: Die Beispiel-Automation für neue Aufgaben ordnet die Werte des Helfers fest einer Person zu. Ist für einen Wert niemand hinterlegt (oder die Person mit keinem Benutzer verknüpft), landet die Aufgabe im gemeinsamen Kanal „Home“ – es kann kein Fehler entstehen.

## 1.8.0 – 19.11.2026

### Neu
- Meldungen an einen bestimmten Benutzer: Der Dienst ha_chat.send_message hat das neue Feld "user" (Anzeigename – auch nur der Vorname –, Benutzer-ID oder Person wie person.markus). Die Nachricht landet im persönlichen Kanal „Home – privat“ dieses Benutzers, den nur er sieht. Der Kanal wird mit der ersten Meldung automatisch angelegt.
- Antwortknöpfe mit Rückfrage: buttons: [{title: "Erledigt", action: "...", confirm: "Sicher?"}]. Der Chat fragt vor dem Auslösen nach; „Abbrechen“ löst nichts aus. Solche Knöpfe werden nicht in die Push-Benachrichtigung übernommen (dort ist keine Rückfrage möglich).
- LIESMICH: Beispiel-Automation „neue Aufgabe aus einer To-do-Liste an den zuständigen Benutzer, Erledigt löscht sie“.
- Speicher-Übersicht (Admins) zeigt persönliche Kanäle als „Home – privat (Name)“; sie lassen sich dort auch löschen (werden bei der nächsten Meldung neu angelegt).

## 1.7.4 – 19.11.2026

### Aussehen
- Personen und Chats ohne Bild zeigen jetzt die ersten zwei Buchstaben des (Vor-)Namens – der erste groß, der zweite klein (z. B. „Ma“ für Markus, „Fa“ für Familie) statt nur eines Buchstabens. Steht vor dem Namen ein Emoji oder Zeichen, wird es übersprungen.

## 1.7.3 – 17.11.2026

### Fehlerbehebungen
- Kopfzeile fehlte: Wer einen Chat verlassen und denselben Chat wieder geöffnet hat, sah oben nur eine leere Fläche – ohne Zurück-Knopf, Bild und Namen. Die Kopfzeile wird jetzt immer neu aufgebaut (auch nach einem Sprung aus der Suche).
- Scrollen hakte: Beim Hochwischen konnten ältere Nachrichten mehrfach gleichzeitig angefordert werden. Danach sprang die Ansicht oder blieb ganz oben stehen und es ging nicht weiter. Ältere Nachrichten werden jetzt rechtzeitig nachgeladen, die gelesene Stelle bleibt dabei genau stehen. Steht man ganz oben, werden die nächsten automatisch geholt.
- Bilder, die erst beim Scrollen laden, verschieben die Ansicht nicht mehr.
- Neue Nachrichten reißen nicht mehr nach unten, wenn man gerade weiter oben liest; wer unten ist, bleibt unten.
- Sprünge zu einer Fundstelle oder zu einer zitierten Nachricht scrollen nur noch den Verlauf, nicht mehr die ganze Seite (die Kopfzeile konnte dabei unter der Leiste von Home Assistant verschwinden).
- Wischen im Verlauf bzw. in der Chatliste schiebt am Anfang oder Ende nicht mehr die ganze Seite mit.
- iPhone: Hat iOS die Seite beim Tippen verschoben, wird die Chat-Karte nach dem Schließen der Tastatur wieder ganz gezeigt.
- Wird ein Chat geöffnet, während die Karte nicht sichtbar ist (z. B. aus einer Push-Mitteilung), stehen beim Anzeigen trotzdem die neuesten Nachrichten unten.

## 1.7.2 – 17.11.2026

### Aussehen
- Rundere Kanten: Karte, Chatliste, Chat-Kacheln, Nachrichtenblasen, Eingabezeile, Knöpfe und Dialoge sind stärker abgerundet.
- Neben der Versionsnummer unter der Chatliste steht jetzt "© U. Hartung".

### Handy
- iPhone ohne Home-Taste: Die Chat-Karte endet jetzt oberhalb der Wischleiste und der abgerundeten Bildschirmecken. Die runden Kartenecken sind dadurch vollständig sichtbar und werden nicht mehr vom Bildschirmrand angeschnitten. Auf Geräten ohne solchen Bereich bleibt der bisherige schmale Abstand. Beim Drehen des Handys wird der Abstand neu gemessen.
- Kompakte Kachel: Der Vollbild-Chat lässt oben (Statusleiste/Notch), unten (Wischleiste) und im Querformat seitlich den sicheren Bereich frei.

## 1.7.1 – 17.11.2026

### Handy
- Der Chat passt sich auf dem Handy automatisch der Bildschirmgröße an: Die Karte reicht genau bis zum unteren Bildschirmrand, die Eingabezeile ist immer sichtbar – egal welche Höhe in der Karte eingestellt ist. Beim Drehen des Handys und bei eingeblendeter Tastatur wird neu angepasst. Am PC und auf breiten Tablets gilt weiter die eingestellte Höhe. Abschalten (feste Höhe auch auf dem Handy): Kartenoption "fit_screen: false".
- Kein ungewolltes Hineinzoomen mehr auf dem iPhone beim Antippen von Eingabefeldern (Schriftgröße der Eingabefelder auf Touch-Geräten 16 px).
- Beim Antippen des Eingabefelds springt der Verlauf zu den neuesten Nachrichten.
- Die Eingabezeile hält Abstand zur Wischleiste am unteren Rand (iPhone ohne Home-Taste).
- Kompakte Kachel: Der Chat öffnet sich auf dem Handy als Vollbild statt als kleines Fenster; das Dashboard dahinter scrollt dabei nicht mit.
- Schmalere Ränder auf dem Handy – mehr Platz für die Nachrichten.

## 1.7.0 – 17.11.2026

Neues Aussehen (Kombination "Dashboard-Kacheln" + "Messenger")
- Chat-Karte: Chatliste und Verlauf als abgerundete Flächen, jeder Chat als eigene kleine Kachel, ausgewählter Chat farbig umrandet. Profilbilder als abgerundete Quadrate in Pastelltönen (Bilder wie bisher). Oben in der Chatliste Info-Chips "… ungelesen" und "… online".
- Verlauf im Messenger-Stil: gemusterter Hintergrund, Sprechblasen mit Spitze, Name des Absenders farbig in der Blase, Uhrzeit und blaue Lesehaken unten rechts im Text, Zitate mit Balken in der Farbe des zitierten Absenders.
- Eingabezeile mit abgerundet-eckigen Knöpfen; Antwort-, Prioritäts- und Vorschau-Leisten als abgerundete Flächen.
- Kompakte Kachel neu: rundes Chat-Symbol mit Zähler, "… ungelesen · Chatnamen", die letzten Nachrichten als Sprechblasen auf dem Muster, Schnellantwort "Antwort an …" und Schnellwahl-Knöpfe mit Bild.
- Hell/Dunkel folgt dem Home-Assistant-Design (dunkler Verlauf und dunkle Sprechblasen im dunklen Design); die Akzentfarbe kommt weiterhin aus dem Design.

### Neu
- Versionsnummer klein unten in der Chatliste. Ist noch eine ältere Karte geladen als die installierte Integration, erscheint dort ein Hinweis mit "neu laden".
- Icon und Logo der Integration (Sprechblase mit Haus) – ab Home Assistant 2026.3 unter Geräte & Dienste sichtbar (Ordner brand/ der Integration).

### Anleitung
- Bilder mit neuem Aussehen, Ansicht im dunklen Design, Versionsnummer und Icon.

## 1.6.0 – 17.11.2026

### Entfernt
- Sprachnachrichten vollständig entfernt (Mikrofon-Knopf, Aufnahme, Abspieler). Audiodateien lassen sich weiterhin wie jede andere Datei über die Büroklammer senden.

### Neu
- Gruppenbild und Gruppenbeschreibung: Tipp auf Bild/Namen im Kopf einer Gruppe oder Menü ⋮ → "Gruppeninfo". Dort auch "Gruppe umbenennen" und die Mitglieder.
- "Für mich löschen" bei jeder Nachricht (auch bei fremden Nachrichten, Home-Meldungen und "Diese Nachricht wurde gelöscht") sowie "Verlauf leeren" im Chat-Menü. Beides wirkt nur bei einem selbst; die anderen sehen weiterhin alles, und Leeren zählt nicht als "gelesen".
- Online-Status: "online" bzw. "zuletzt online …" im Kopf eines Einzelchats, grüner Punkt in der Chatliste, Status in der Mitgliederliste. Im Profil abschaltbar – wer seinen Status verbirgt, sieht auch den der anderen nicht.
- "Speicher & Geräte" für Administratoren (Profil): Platzbedarf insgesamt und je Chat; Medien eines Chats löschen, Chat leeren oder löschen, ältere Nachrichten in allen Chats löschen, verwaiste Dateien entfernen (die Datenbank wird danach verkleinert). Reiter "Erreichbarkeit": welche Benutzer mit welchen Geräten Push-Benachrichtigungen erhalten.
- "Mit höchster Priorität senden" (Büroklammer) für Dringendes: auf dem iPhone als "zeitkritisch" (kommt durch Fokus/"Nicht stören", sofern erlaubt), auf Android über den eigenen Kanal "Chat – Wichtig"; im Chat rot als "Wichtig" markiert. Solche Pushs werden nie zusammengefasst oder gedrosselt und nicht von der nächsten Push ersetzt. Automationen: ha_chat.send_message mit "important: true"; das Ereignis "ha_chat_message" enthält das Feld "important".
- "Erreichbarkeit testen" im Profil: Test-Push nach 10 Sekunden an alle eigenen Geräte, Anzeige der Geräte und eine Checkliste für iPhone und Android.
- Kontaktinfo bei Einzelchats (Tipp auf Bild/Namen im Kopf).

### Verbessert
- Tippen auf eine Benachrichtigung öffnet direkt den richtigen Chat: Die Chat-Karte meldet je Benutzer, auf welchem Dashboard sie benutzt wird, und die Pushs verlinken dorthin. Das klappt auch, wenn die App schon offen ist (iOS). Auf Dashboards nur mit der kompakten Kachel öffnet sich der Chat im Fenster. Der Dashboard-Pfad in den Optionen der Integration ist nur noch Rückfallwert.
- Normale Chat-Nachrichten halten sich an "Nicht stören", Fokus und Stummschaltung.
- Kurz hintereinander geschriebene Nachrichten ergeben eine Push mit Anzahl ("Anna (3 neue)"). Ab 350 Chat-Pushs an einem Tag wird je Gerät gedrosselt (höchstens eine je Chat alle 10 Minuten), damit vom Tageslimit der Push-Zustellung (500 je Gerät) genug für andere Meldungen bleibt.
- Android-Pushs ohne "ttl: 0": Eine Nachricht an ein Handy ohne Empfang geht nicht verloren, sondern kommt an, sobald es wieder verbunden ist.
- Angefangene Texte bleiben je Chat erhalten und landen nicht mehr im nächsten Chat.
- Anleitung: neue Kapitel "Wichtiges mit höchster Priorität senden", "Für mich löschen und Verlauf leeren", "Online-Status", "Gruppen: Bild, Beschreibung und Mitglieder", Erreichbarkeit/Checkliste sowie "Speicher & Geräte"; das Kapitel Sprachnachrichten entfällt.

### Technisch
- Die Datenbank wird beim Update automatisch erweitert, vorhandene Nachrichten bleiben erhalten.

## 1.5.1 – 17.11.2026

### Neu
- Bebilderte Bedienungsanleitung "Anleitung-HA-Chat.pdf" für alle Chat-Benutzer im ZIP-Paket (Chat öffnen, Schreiben, Fotos, Sprachnachrichten, Standort, Suche, Gruppen, Profil, Benachrichtigungen, Antwortknöpfe, häufige Fragen). Sie wird mit jeder neuen Version aktualisiert; die Bilder zeigen immer die aktuelle Chat-Karte.

### Verbessert
- Medien-Übersicht und Bildansicht lassen sich mit der Esc-Taste schließen.
- In der Vorschau vor dem Senden stehen Dateiname und Größe in getrennten Zeilen und sind damit besser lesbar.

## 1.5.0 – 17.11.2026

### Fotos & Medien
- Neu: Büroklammer öffnet "Foto aufnehmen", "Fotos & Videos aus der Galerie", "Datei" und "Standort senden".
- Mehrere Fotos/Videos/Dateien auf einmal (bis 10) mit Vorschau vor dem Senden; ein geschriebener Text wird als Bildunterschrift mit der ersten Datei gesendet.
- Fotos werden vor dem Hochladen verkleinert (längste Seite 1920 px, JPEG) – meist auf einen Bruchteil der Größe. Dabei werden auch Metadaten wie der GPS-Ort entfernt. Option "Originalqualität (nicht verkleinern)" in der Vorschau.
- Am PC: Dateien ins Chatfenster ziehen oder mit Strg+V einfügen.
- Medien-Übersicht pro Chat (Menü ⋮ → "Medien, Dateien & Links") mit den Reitern Medien, Dateien und Links; Sprung zur Nachricht im Verlauf.

### Standort
- Neu: "Standort senden" mit zwei Quellen (GPS des Geräts bei HTTPS, frisch angeforderter Standort der Companion App). Vorschau mit Karte, Genauigkeit und Alter; ein veralteter Standort wird nur nach Rückfrage gesendet. Anzeige im Chat als Kartenausschnitt, Tippen öffnet die Karten-App.

### Nachrichten
- Neu: Weiterleiten in einen oder mehrere Chats (mit Kennzeichnung "Weitergeleitet").
- Neu: @Erwähnungen in Gruppen mit Namensvorschlägen beim Tippen; Erwähnungen werden hervorgehoben, der Erwähnte erhält "… hat dich erwähnt" als Push-Titel.
- Neu: Emoji-Auswahl beim Schreiben (mit "Zuletzt verwendet").
- Neu: "Info: gelesen von …" für eigene Nachrichten – wer hat wann gelesen, wer noch nicht.

### Home Assistant
- Neu: Antwortknöpfe in Home-Meldungen: ha_chat.send_message hat das Feld "buttons". Ein Tipp (auch direkt in der Push-Benachrichtigung) löst das Ereignis "ha_chat_button" aus; die Antwort wird im Chat angezeigt. Beispiel in LIESMICH.txt.
- Neu: Ereignis "ha_chat_message" bei jeder neuen Nachricht für eigene Automationen (in den Optionen abschaltbar). Beispiel in LIESMICH.txt.

### Technik
- Die Datenbank wird beim Update automatisch erweitert; vorhandene Nachrichten bleiben erhalten.

## 1.4.0 – 17.11.2026

### Neu
- Nachrichtensuche in einem eigenen Suchfenster: * Lupe oben in der Chatliste: sucht in allen eigenen Chats. * Lupe im Kopf einer Unterhaltung: sucht nur in diesem Chat (umschaltbar auf "In allen Chats"). * Wer im Feld "Chats durchsuchen" tippt, bekommt zusätzlich "In allen Nachrichten nach … suchen" angeboten. * Gesucht wird in Texten und Dateinamen, ohne Rücksicht auf Groß-/Kleinschreibung (auch bei Umlauten). Treffer zeigen Chat, Absender, Datum und den Suchbegriff hervorgehoben. * Ein Tipp auf einen Treffer springt direkt zur Nachricht im Verlauf und markiert sie kurz. Ältere und neuere Nachrichten werden beim Scrollen nachgeladen, der Knopf "Zu den neuesten" führt zurück ans Ende. * Jeder findet nur Nachrichten aus Chats, in denen er Mitglied ist.

### Geändert
- Push-Benachrichtigungen: Ein irgendwo geöffneter Chat (z. B. am PC) verhindert die Push-Nachricht aufs Handy nicht mehr. Die Push-Nachricht wird nach wenigen Sekunden gesendet, wenn die Nachricht bis dahin nicht gelesen wurde.
- Als "gelesen" gilt eine Nachricht nur noch, wenn wirklich jemand am Gerät ist (Fenster im Vordergrund und in der letzten Minute Maus, Tastatur oder Touch benutzt). Ein unbeaufsichtigt offener PC markiert nichts mehr als gelesen.
- Wird eine Nachricht später gelesen (egal auf welchem Gerät), verschwindet die Benachrichtigung auf dem Handy automatisch.

## 1.3.0 – 17.11.2026

### Neu
- Eigene Profilbilder: Jeder Benutzer tippt in der Chat-Karte oben links auf sein Bild und kann ein Profilbild festlegen, ändern oder entfernen. Das Bild wird auf dem Gerät quadratisch zugeschnitten, auf 256×256 Pixel verkleinert und ohne Metadaten (z. B. GPS-Standort) gespeichert. Ohne eigenes Bild wird weiterhin das Bild der Person aus Home Assistant bzw. die Initialen angezeigt.
- Profilbilder erscheinen in der Chatliste, im Kopf der Unterhaltung, in der Mitgliederliste und bei "Neuer Chat".
- Ändert jemand seinen Anzeigenamen oder sein Profilbild, aktualisieren sich alle geöffneten Chat-Karten sofort.

### Entfernt
- Kamera-Schnappschüsse sind nicht mehr verfügbar – weder in der Karte noch über die Schnittstelle der Integration noch im Dienst ha_chat.send_message (Feld "camera_entity" entfällt).

### Verbessert
- Bilder und Anhänge auf dauerhaft geöffneten Dashboards (z. B. Wandtablet) bleiben sichtbar: Die Bild-Links werden alle 6 Stunden automatisch erneuert.
- Lädt ein Profilbild nicht, werden stattdessen die Initialen angezeigt.

### Hinweis
- Im Chat werden – wie bisher – die Anzeigenamen aus dem Home-Assistant-Profil verwendet, nicht die Anmeldenamen.

## 1.2.0 – 17.11.2026

Geprüft gegen Home Assistant 2026.11.1 (Entwickler-Blog und Schnittstellen bis 2026.11).

### Setup
- Behoben: Bei der Zwei-Faktor-Anmeldung stand schon beim ersten Mal "Der Code war ungültig". Die Meldung erscheint jetzt nur noch nach einer tatsächlich falschen Eingabe.
- Neu: Sind mehrere 2FA-Verfahren eingerichtet, wird das erste automatisch gewählt.
- Klare Meldung, wenn die Anmeldung abgelaufen ist.
- Veralteten Parameter "show_advanced_options" entfernt (wird in HA 2027.6 abgeschafft).
- Texte an HA 2026.2+ angepasst: "Add-ons" heißen jetzt "Apps".

### Sicherheit (Setup)
- Das Passwort wird direkt nach der Anmeldung aus dem Speicher und dem Eingabefeld gelöscht.
- Die Setup-Sitzung in Home Assistant wird auch beim Abbrechen, Schließen oder erneuten Verbinden abgemeldet (vorher nur nach erfolgreicher Installation).
- Das temporäre Samba-Passwort steht nicht mehr in der Protokolldatei, nur noch auf der Abschlussseite.
- "Samba-Share entfernen" ist jetzt die empfohlene, vorausgewählte Antwort.
- Hinweis im Terminal bei unverschlüsselter Verbindung (http).

### Sicherheit (Integration & Karte)
- Hochgeladene Dateien werden nur noch für sichere Bild-, Video- und Audioformate direkt angezeigt. Alles andere (z. B. SVG, HTML) wird als Download ausgeliefert – zusätzlich mit Schutz-Headern (nosniff, Content-Security-Policy "sandbox"). Damit kann über einen Dateianhang kein Schadcode im Home-Assistant-Browserfenster ausgeführt werden.
- Dienst ha_chat.send_message: Dateien über 100 MB werden abgelehnt.

### Integration
- Dateisystemzugriffe laufen nicht mehr im Haupt-Thread von Home Assistant.
- Das Aufräumen alter Nachrichten beim Start läuft im Hintergrund und verzögert den Start von Home Assistant nicht.

## 1.1.3 – 17.11.2026

### Setup
- Behoben: Abbruch mit "Die Netzwerkverbindung konnte nicht gefunden werden." beim Verbinden der Samba-Freigabe. Hinweise von "net use" führen unter Windows PowerShell 5.1 nicht mehr zum Abbruch.
- Ist \\<Server>\config in Windows bereits verbunden (z. B. als Netzlaufwerk), wird diese Verbindung mitbenutzt und nicht mehr getrennt.
- Bei Fehlern zeigt das Terminal zusätzlich die genaue Stelle im Setup an.

## 1.1.2 – 17.11.2026

### Setup
- Terminal-Ausgabe ist jetzt als Bereich unten im Setup-Fenster integriert (ein-/ausblendbar, Knopf "Kopieren"). Kein separates Konsolenfenster mehr.
- Setup-Fenster etwas höher und in der Größe veränderbar.
- Versionsnummer und dieses Änderungsprotokoll werden mit jeder Version gepflegt.

## 1.1.1 – 17.11.2026

### Setup
- Behoben: Abbruch direkt nach der Anmeldung mit der Meldung "[System.Threading.Tasks.VoidTaskResult] keine Methode mit dem Namen GetAwaiter". Die WebSocket-Verbindung ist jetzt mit Windows PowerShell 5.1 kompatibel.
- Behoben: fehlerhafte Textausgabe bei WebSocket-Protokollzeilen.
- Ausführliche Protokollierung jedes Schritts (HTTP-/WebSocket-Anfragen, Samba, Netzlaufwerk) – Passwörter und Zugangsschlüssel werden nicht angezeigt.
- Fehlermeldungen im Fenster sind scrollbar und werden nicht mehr abgeschnitten.
- Umbenannt: "Installieren.cmd" heißt jetzt "setup.cmd", Fenstertitel "HA Chat – Setup", Protokolldatei %TEMP%\HA-Chat-Setup.log.

## 1.1.0 – 17.11.2026

### Setup
- Neu: vollständige Deinstallation ("Vollständig deinstallieren" auf der ersten Seite). Entfernt Integration und Programmdateien, optional auch alle Nachrichten/Dateien und das Dashboard "Chat"; danach Neustart von Home Assistant. Samba wird wie bei der Installation behandelt (vorhandenes bleibt unverändert, nur dafür installiertes kann am Ende entfernt werden).

### Integration
- Der gemeinsame Kanal und der Absender von Automations-Meldungen heißen jetzt "Home" statt "Haus". Ein bestehender Kanal wird beim Update automatisch umbenannt.

## 1.0.0 – 17.11.2026

- Erste Version: Integration "HA Chat" (Einzel- und Gruppenchats, Kanal für alle, Bilder/Videos/Dateien, Kamera-Schnappschüsse, Sprachnachrichten, Antworten, Reaktionen, Bearbeiten, Löschen, Lesebestätigung, Tipp-Anzeige, Push über die Companion App mit Antworten aus der Benachrichtigung, automatische Löschung nach Aufbewahrungsdauer, Dienst ha_chat.send_message).
- Karten: custom:ha-chat-card (responsiv, folgt dem HA-Theme) und custom:ha-chat-compact-card (kompakte Kachel mit Schnellantwort).
- Setup mit grafischer Oberfläche im Windows-11-Stil inkl. automatischer Samba-Installation, Benutzerauswahl und Dashboard "Chat".
