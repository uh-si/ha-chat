"""SQLite-Speicher für HA Chat (alle Methoden sind blockierend -> im Executor aufrufen)."""
from __future__ import annotations

import json
import os
import sqlite3
import threading
import time
from typing import Any

SCHEMA = """
CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    is_group INTEGER NOT NULL DEFAULT 0,
    is_system INTEGER NOT NULL DEFAULT 0,
    created_by TEXT,
    created_at REAL NOT NULL,
    updated_at REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS members (
    conversation_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    last_read INTEGER NOT NULL DEFAULT 0,
    joined_at REAL NOT NULL,
    PRIMARY KEY (conversation_id, user_id)
);
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL,
    sender_id TEXT NOT NULL,
    text TEXT NOT NULL DEFAULT '',
    reply_to INTEGER,
    attachment_id TEXT,
    created_at REAL NOT NULL,
    edited_at REAL,
    deleted INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages (conversation_id, id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages (created_at);
CREATE TABLE IF NOT EXISTS reactions (
    message_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    emoji TEXT NOT NULL,
    PRIMARY KEY (message_id, user_id)
);
CREATE TABLE IF NOT EXISTS reads (
    conversation_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    upto INTEGER NOT NULL,
    at REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reads ON reads (conversation_id, user_id, upto);
CREATE TABLE IF NOT EXISTS hidden (
    user_id TEXT NOT NULL,
    message_id INTEGER NOT NULL,
    PRIMARY KEY (user_id, message_id)
);
CREATE TABLE IF NOT EXISTS user_settings (
    user_id TEXT PRIMARY KEY,
    show_presence INTEGER NOT NULL DEFAULT 1,
    last_seen REAL,
    card_path TEXT,
    compact_path TEXT
);
CREATE TABLE IF NOT EXISTS avatars (
    user_id TEXT PRIMARY KEY,
    path TEXT NOT NULL,
    updated_at REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS attachments (
    id TEXT PRIMARY KEY,
    conversation_id INTEGER NOT NULL,
    uploader_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    mime TEXT NOT NULL,
    size INTEGER NOT NULL,
    path TEXT NOT NULL,
    created_at REAL NOT NULL
);
"""


class ChatStore:
    """Kapselt die SQLite-Datenbank."""

    def __init__(self, base_dir: str) -> None:
        self.base_dir = base_dir
        self.media_dir = os.path.join(base_dir, "media")
        self._lock = threading.RLock()
        self._db: sqlite3.Connection | None = None
        self._db_file = "chat.db"

    # ------------------------------------------------------------ Grundlagen
    def open(self, db_file: str) -> None:
        os.makedirs(self.media_dir, exist_ok=True)
        self._db_file = db_file
        self._db = sqlite3.connect(
            os.path.join(self.base_dir, db_file), check_same_thread=False
        )
        self._db.row_factory = sqlite3.Row
        # SQLite kann Groß-/Kleinschreibung nur für ASCII ignorieren – für Umlaute eigene Funktion
        self._db.create_function(
            "hc_lower", 1, lambda v: v.lower() if isinstance(v, str) else v, deterministic=True
        )
        with self._lock:
            self._db.executescript(SCHEMA)
            self._db.execute("PRAGMA journal_mode=WAL")
            self._migrate()
            self._db.commit()

    def _migrate(self) -> None:
        """Neue Spalten in bestehenden Datenbanken ergänzen (Updates ohne Datenverlust)."""
        cols = {r[1] for r in self._db.execute("PRAGMA table_info(messages)").fetchall()}
        for name, ddl in (
            ("forwarded", "INTEGER NOT NULL DEFAULT 0"),
            ("buttons", "TEXT"),
            ("answer", "TEXT"),
            ("location", "TEXT"),
            ("important", "INTEGER NOT NULL DEFAULT 0"),
        ):
            if name not in cols:
                self._db.execute(f"ALTER TABLE messages ADD COLUMN {name} {ddl}")
        cols = {r[1] for r in self._db.execute("PRAGMA table_info(conversations)").fetchall()}
        for name, ddl in (
            ("description", "TEXT"),
            ("avatar_path", "TEXT"),
            ("avatar_updated", "REAL"),
            ("owner_id", "TEXT"),  # gesetzt = persönlicher Home-Kanal dieses Benutzers
        ):
            if name not in cols:
                self._db.execute(f"ALTER TABLE conversations ADD COLUMN {name} {ddl}")
        cols = {r[1] for r in self._db.execute("PRAGMA table_info(user_settings)").fetchall()}
        for name in ("card_path", "compact_path"):
            if name not in cols:
                self._db.execute(f"ALTER TABLE user_settings ADD COLUMN {name} TEXT")
        cols = {r[1] for r in self._db.execute("PRAGMA table_info(members)").fetchall()}
        if "cleared_upto" not in cols:
            self._db.execute("ALTER TABLE members ADD COLUMN cleared_upto INTEGER NOT NULL DEFAULT 0")

    def close(self) -> None:
        with self._lock:
            if self._db is not None:
                self._db.close()
                self._db = None

    def _q(self, sql: str, args: tuple = ()) -> list[sqlite3.Row]:
        with self._lock:
            return self._db.execute(sql, args).fetchall()

    def _x(self, sql: str, args: tuple = ()) -> int:
        with self._lock:
            cur = self._db.execute(sql, args)
            self._db.commit()
            return cur.lastrowid

    # Bedingung für Nachrichten (Alias m), die ein Benutzer sehen darf:
    # nicht vor seinem "Verlauf leeren" und nicht einzeln "für mich gelöscht".
    VISIBLE = (
        " AND m.id > COALESCE((SELECT cu.cleared_upto FROM members cu"
        " WHERE cu.conversation_id=m.conversation_id AND cu.user_id=?), 0)"
        " AND NOT EXISTS (SELECT 1 FROM hidden h WHERE h.message_id=m.id AND h.user_id=?)"
    )

    def _vis(self, user_id: str | None) -> tuple[str, tuple]:
        if not user_id:
            return "", ()
        return self.VISIBLE, (user_id, user_id)

    # ------------------------------------------------------- Unterhaltungen
    def create_conversation(
        self, name: str | None, is_group: bool, is_system: bool,
        created_by: str, members: list[str],
    ) -> int:
        now = time.time()
        with self._lock:
            cur = self._db.execute(
                "INSERT INTO conversations (name, is_group, is_system, created_by, created_at, updated_at)"
                " VALUES (?,?,?,?,?,?)",
                (name, int(is_group), int(is_system), created_by, now, now),
            )
            conv_id = cur.lastrowid
            # Neue Mitglieder sehen alte Nachrichten nicht als ungelesen
            for uid in set(members):
                self._db.execute(
                    "INSERT OR IGNORE INTO members (conversation_id, user_id, last_read, joined_at)"
                    " VALUES (?,?,0,?)",
                    (conv_id, uid, now),
                )
            self._db.commit()
        return conv_id

    def find_direct(self, user_a: str, user_b: str) -> int | None:
        rows = self._q(
            "SELECT c.id FROM conversations c"
            " JOIN members m1 ON m1.conversation_id=c.id AND m1.user_id=?"
            " JOIN members m2 ON m2.conversation_id=c.id AND m2.user_id=?"
            " WHERE c.is_group=0 AND c.is_system=0"
            " AND (SELECT COUNT(*) FROM members m WHERE m.conversation_id=c.id)=2",
            (user_a, user_b),
        )
        return rows[0]["id"] if rows else None

    def find_system(self) -> int | None:
        rows = self._q("SELECT id FROM conversations WHERE is_system=1 AND owner_id IS NULL ORDER BY id LIMIT 1")
        return rows[0]["id"] if rows else None

    def find_personal(self, user_id: str) -> int | None:
        rows = self._q(
            "SELECT id FROM conversations WHERE is_system=1 AND owner_id=? ORDER BY id LIMIT 1", (user_id,)
        )
        return rows[0]["id"] if rows else None

    def rename_personal(self, name: str) -> int:
        """Alle persönlichen Home-Kanäle auf den aktuellen Namen bringen (z. B. nach einer Umbenennung)."""
        with self._lock:
            cur = self._db.execute(
                "UPDATE conversations SET name=? WHERE is_system=1 AND owner_id IS NOT NULL AND name IS NOT ?",
                (name, name),
            )
            self._db.commit()
            return cur.rowcount

    def create_personal(self, user_id: str, name: str, created_by: str) -> int:
        conv_id = self.create_conversation(name, True, True, created_by, [user_id])
        self._x("UPDATE conversations SET owner_id=? WHERE id=?", (user_id, conv_id))
        return conv_id

    def find_by_name(self, name: str) -> int | None:
        rows = self._q(
            "SELECT id FROM conversations WHERE lower(name)=lower(?) ORDER BY id LIMIT 1", (name,)
        )
        return rows[0]["id"] if rows else None

    def get_conversation(self, conv_id: int) -> dict[str, Any] | None:
        rows = self._q("SELECT * FROM conversations WHERE id=?", (conv_id,))
        if not rows:
            return None
        conv = dict(rows[0])
        conv["members"] = [
            dict(r) for r in self._q(
                "SELECT user_id, last_read, cleared_upto FROM members WHERE conversation_id=?", (conv_id,)
            )
        ]
        return conv

    def conversations_for(self, user_id: str) -> list[int]:
        return [
            r["conversation_id"]
            for r in self._q("SELECT conversation_id FROM members WHERE user_id=?", (user_id,))
        ]

    def is_member(self, conv_id: int, user_id: str) -> bool:
        return bool(self._q(
            "SELECT 1 FROM members WHERE conversation_id=? AND user_id=?", (conv_id, user_id)
        ))

    def set_members(self, conv_id: int, add: list[str], remove: list[str]) -> None:
        now = time.time()
        last = self.last_message_id(conv_id)
        with self._lock:
            for uid in add:
                self._db.execute(
                    "INSERT OR IGNORE INTO members (conversation_id, user_id, last_read, joined_at)"
                    " VALUES (?,?,?,?)",
                    (conv_id, uid, last, now),
                )
            for uid in remove:
                self._db.execute(
                    "DELETE FROM members WHERE conversation_id=? AND user_id=?", (conv_id, uid)
                )
            self._db.commit()

    def rename(self, conv_id: int, name: str) -> None:
        self._x("UPDATE conversations SET name=?, updated_at=? WHERE id=?", (name, time.time(), conv_id))

    def delete_conversation(self, conv_id: int) -> list[str]:
        paths = [r["path"] for r in self._q(
            "SELECT path FROM attachments WHERE conversation_id=?", (conv_id,)
        )]
        group = self._q("SELECT avatar_path FROM conversations WHERE id=?", (conv_id,))
        if group and group[0]["avatar_path"]:
            paths.append(group[0]["avatar_path"])
        with self._lock:
            self._db.execute(
                "DELETE FROM reactions WHERE message_id IN (SELECT id FROM messages WHERE conversation_id=?)",
                (conv_id,),
            )
            self._db.execute(
                "DELETE FROM hidden WHERE message_id IN (SELECT id FROM messages WHERE conversation_id=?)",
                (conv_id,),
            )
            self._db.execute("DELETE FROM reads WHERE conversation_id=?", (conv_id,))
            self._db.execute("DELETE FROM messages WHERE conversation_id=?", (conv_id,))
            self._db.execute("DELETE FROM attachments WHERE conversation_id=?", (conv_id,))
            self._db.execute("DELETE FROM members WHERE conversation_id=?", (conv_id,))
            self._db.execute("DELETE FROM conversations WHERE id=?", (conv_id,))
            self._db.commit()
        return paths

    def last_message_id(self, conv_id: int) -> int:
        rows = self._q("SELECT MAX(id) AS m FROM messages WHERE conversation_id=?", (conv_id,))
        return rows[0]["m"] or 0

    def unread_count(self, conv_id: int, user_id: str) -> int:
        rows = self._q(
            "SELECT COUNT(*) AS n FROM messages m JOIN members mb"
            " ON mb.conversation_id=m.conversation_id AND mb.user_id=?"
            " WHERE m.conversation_id=? AND m.id>mb.last_read AND m.sender_id<>? AND m.deleted=0"
            + self.VISIBLE,
            (user_id, conv_id, user_id, user_id, user_id),
        )
        return rows[0]["n"]

    def hide_message(self, user_id: str, msg_id: int) -> None:
        self._x("INSERT OR IGNORE INTO hidden (user_id, message_id) VALUES (?,?)", (user_id, msg_id))

    def clear_history(self, conv_id: int, user_id: str) -> int:
        """Blendet alle bisherigen Nachrichten eines Chats für einen Benutzer aus."""
        upto = self.last_message_id(conv_id)
        with self._lock:
            self._db.execute(
                "UPDATE members SET cleared_upto=? WHERE conversation_id=? AND user_id=?",
                (upto, conv_id, user_id),
            )
            self._db.commit()
        return upto

    def mark_read(self, conv_id: int, user_id: str, message_id: int) -> bool:
        with self._lock:
            cur = self._db.execute(
                "UPDATE members SET last_read=? WHERE conversation_id=? AND user_id=? AND last_read<?",
                (message_id, conv_id, user_id, message_id),
            )
            changed = cur.rowcount > 0
            if changed:
                # Zeitpunkt merken – für "Gelesen von … um …"
                self._db.execute(
                    "INSERT INTO reads (conversation_id, user_id, upto, at) VALUES (?,?,?,?)",
                    (conv_id, user_id, message_id, time.time()),
                )
            self._db.commit()
            return changed

    def read_times(self, conv_id: int, msg_id: int) -> dict[str, float | None]:
        """Für jedes Mitglied: wann wurde die Nachricht (frühestens) gelesen?"""
        out: dict[str, float | None] = {}
        for m in self._q("SELECT user_id, last_read FROM members WHERE conversation_id=?", (conv_id,)):
            if m["last_read"] < msg_id:
                out[m["user_id"]] = None
                continue
            row = self._q(
                "SELECT MIN(at) AS at FROM reads WHERE conversation_id=? AND user_id=? AND upto>=?",
                (conv_id, m["user_id"], msg_id),
            )
            out[m["user_id"]] = row[0]["at"] if row and row[0]["at"] else 0.0
        return out

    # ------------------------------------------------------------ Nachrichten
    def add_message(
        self, conv_id: int, sender_id: str, text: str,
        reply_to: int | None, attachment_id: str | None,
        forwarded: bool = False, buttons: list[dict[str, str]] | None = None,
        location: dict[str, Any] | None = None, important: bool = False,
    ) -> int:
        now = time.time()
        with self._lock:
            cur = self._db.execute(
                "INSERT INTO messages (conversation_id, sender_id, text, reply_to, attachment_id, created_at,"
                " forwarded, buttons, location, important) VALUES (?,?,?,?,?,?,?,?,?,?)",
                (conv_id, sender_id, text, reply_to, attachment_id, now, int(forwarded),
                 json.dumps(buttons, ensure_ascii=False) if buttons else None,
                 json.dumps(location) if location else None, int(bool(important))),
            )
            msg_id = cur.lastrowid
            self._db.execute("UPDATE conversations SET updated_at=? WHERE id=?", (now, conv_id))
            if sender_id:
                self._db.execute(
                    "UPDATE members SET last_read=? WHERE conversation_id=? AND user_id=?",
                    (msg_id, conv_id, sender_id),
                )
            self._db.commit()
        return msg_id

    def get_message(self, msg_id: int) -> dict[str, Any] | None:
        rows = self._q("SELECT * FROM messages WHERE id=?", (msg_id,))
        if not rows:
            return None
        return self._enrich([dict(rows[0])])[0]

    def get_messages(
        self, conv_id: int, before: int | None, limit: int, user_id: str | None = None
    ) -> list[dict[str, Any]]:
        vis, vargs = self._vis(user_id)
        if before:
            rows = self._q(
                f"SELECT * FROM messages m WHERE m.conversation_id=? AND m.id<?{vis} ORDER BY m.id DESC LIMIT ?",
                (conv_id, before, *vargs, limit),
            )
        else:
            rows = self._q(
                f"SELECT * FROM messages m WHERE m.conversation_id=?{vis} ORDER BY m.id DESC LIMIT ?",
                (conv_id, *vargs, limit),
            )
        return self._enrich([dict(r) for r in reversed(rows)])

    def get_messages_after(
        self, conv_id: int, after: int, limit: int, user_id: str | None = None
    ) -> list[dict[str, Any]]:
        vis, vargs = self._vis(user_id)
        rows = self._q(
            f"SELECT * FROM messages m WHERE m.conversation_id=? AND m.id>?{vis} ORDER BY m.id ASC LIMIT ?",
            (conv_id, after, *vargs, limit),
        )
        return self._enrich([dict(r) for r in rows])

    def get_messages_around(
        self, conv_id: int, msg_id: int, each: int, user_id: str | None = None
    ) -> list[dict[str, Any]]:
        vis, vargs = self._vis(user_id)
        older = self._q(
            f"SELECT * FROM messages m WHERE m.conversation_id=? AND m.id<?{vis} ORDER BY m.id DESC LIMIT ?",
            (conv_id, msg_id, *vargs, each),
        )
        rest = self._q(
            f"SELECT * FROM messages m WHERE m.conversation_id=? AND m.id>=?{vis} ORDER BY m.id ASC LIMIT ?",
            (conv_id, msg_id, *vargs, each + 1),
        )
        return self._enrich([dict(r) for r in reversed(older)] + [dict(r) for r in rest])

    def search(self, user_id: str, query: str, conv_id: int | None, limit: int) -> list[dict[str, Any]]:
        """Volltextsuche (Teilwort, ohne Groß-/Kleinschreibung) in den Chats eines Benutzers."""
        esc = query.lower().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        pattern = f"%{esc}%"
        sql = (
            "SELECT m.* FROM messages m"
            " JOIN members mb ON mb.conversation_id=m.conversation_id AND mb.user_id=?"
            " LEFT JOIN attachments a ON a.id=m.attachment_id"
            " WHERE m.deleted=0 AND (hc_lower(m.text) LIKE ? ESCAPE '\\'"
            " OR hc_lower(a.filename) LIKE ? ESCAPE '\\')" + self.VISIBLE
        )
        args: list[Any] = [user_id, pattern, pattern, user_id, user_id]
        if conv_id:
            sql += " AND m.conversation_id=?"
            args.append(conv_id)
        sql += " ORDER BY m.id DESC LIMIT ?"
        args.append(limit)
        return self._enrich([dict(r) for r in self._q(sql, tuple(args))])

    def last_message(self, conv_id: int, user_id: str | None = None) -> dict[str, Any] | None:
        vis, vargs = self._vis(user_id)
        rows = self._q(
            f"SELECT * FROM messages m WHERE m.conversation_id=?{vis} ORDER BY m.id DESC LIMIT 1",
            (conv_id, *vargs),
        )
        return self._enrich([dict(rows[0])])[0] if rows else None

    def _enrich(self, msgs: list[dict[str, Any]]) -> list[dict[str, Any]]:
        for m in msgs:
            m["reactions"] = [
                dict(r) for r in self._q(
                    "SELECT user_id, emoji FROM reactions WHERE message_id=?", (m["id"],)
                )
            ]
            m["attachment"] = None
            if m["attachment_id"] and not m["deleted"]:
                rows = self._q("SELECT * FROM attachments WHERE id=?", (m["attachment_id"],))
                if rows:
                    a = dict(rows[0])
                    a.pop("path", None)
                    m["attachment"] = a
            m["reply"] = None
            if m["reply_to"]:
                rows = self._q(
                    "SELECT id, sender_id, text, deleted, attachment_id FROM messages WHERE id=?",
                    (m["reply_to"],),
                )
                if rows:
                    r = dict(rows[0])
                    if r["deleted"]:
                        r["text"] = ""
                    m["reply"] = r
            m["forwarded"] = bool(m.get("forwarded"))
            m["buttons"] = _json(m.get("buttons")) or []
            m["answer"] = _json(m.get("answer"))
            m["location"] = _json(m.get("location"))
            if m["deleted"]:
                m["text"] = ""
                m["buttons"] = []
                m["location"] = None
        return msgs

    def set_answer(self, msg_id: int, answer: dict[str, Any]) -> bool:
        """Speichert die erste Antwort auf eine Knopf-Nachricht (spätere werden ignoriert)."""
        with self._lock:
            cur = self._db.execute(
                "UPDATE messages SET answer=? WHERE id=? AND answer IS NULL AND deleted=0",
                (json.dumps(answer, ensure_ascii=False), msg_id),
            )
            self._db.commit()
            return cur.rowcount > 0

    def media_list(
        self, conv_id: int, kind: str, before: int | None, limit: int, user_id: str | None = None
    ) -> list[dict[str, Any]]:
        """Medien (Bilder/Videos), Dateien oder Links eines Chats, neueste zuerst."""
        if kind == "links":
            where = "(m.text LIKE '%http://%' OR m.text LIKE '%https://%')"
            join = ""
        else:
            join = " JOIN attachments a ON a.id=m.attachment_id"
            if kind == "media":
                where = "(a.mime LIKE 'image/%' OR a.mime LIKE 'video/%')"
            else:
                where = "NOT (a.mime LIKE 'image/%' OR a.mime LIKE 'video/%')"
        vis, vargs = self._vis(user_id)
        sql = f"SELECT m.* FROM messages m{join} WHERE m.conversation_id=? AND m.deleted=0 AND {where}{vis}"
        args: list[Any] = [conv_id, *vargs]
        if before:
            sql += " AND m.id<?"
            args.append(before)
        sql += " ORDER BY m.id DESC LIMIT ?"
        args.append(limit)
        return self._enrich([dict(r) for r in self._q(sql, tuple(args))])

    def edit_message(self, msg_id: int, text: str) -> None:
        self._x("UPDATE messages SET text=?, edited_at=? WHERE id=?", (text, time.time(), msg_id))

    def delete_message(self, msg_id: int) -> str | None:
        rows = self._q("SELECT attachment_id FROM messages WHERE id=?", (msg_id,))
        path = None
        if rows and rows[0]["attachment_id"]:
            att = self._q("SELECT path FROM attachments WHERE id=?", (rows[0]["attachment_id"],))
            if att:
                path = att[0]["path"]
            self._x("DELETE FROM attachments WHERE id=?", (rows[0]["attachment_id"],))
        self._x("UPDATE messages SET deleted=1, text='', attachment_id=NULL WHERE id=?", (msg_id,))
        self._x("DELETE FROM reactions WHERE message_id=?", (msg_id,))
        return path

    def set_reaction(self, msg_id: int, user_id: str, emoji: str | None) -> None:
        if emoji:
            self._x(
                "INSERT INTO reactions (message_id, user_id, emoji) VALUES (?,?,?)"
                " ON CONFLICT(message_id, user_id) DO UPDATE SET emoji=excluded.emoji",
                (msg_id, user_id, emoji),
            )
        else:
            self._x("DELETE FROM reactions WHERE message_id=? AND user_id=?", (msg_id, user_id))

    def get_reaction(self, msg_id: int, user_id: str) -> str | None:
        rows = self._q("SELECT emoji FROM reactions WHERE message_id=? AND user_id=?", (msg_id, user_id))
        return rows[0]["emoji"] if rows else None

    # ------------------------------------------------------------ Anhänge
    def add_attachment(
        self, att_id: str, conv_id: int, uploader: str, filename: str,
        mime: str, size: int, path: str,
    ) -> None:
        self._x(
            "INSERT INTO attachments (id, conversation_id, uploader_id, filename, mime, size, path, created_at)"
            " VALUES (?,?,?,?,?,?,?,?)",
            (att_id, conv_id, uploader, filename, mime, size, path, time.time()),
        )

    def get_attachment(self, att_id: str) -> dict[str, Any] | None:
        rows = self._q("SELECT * FROM attachments WHERE id=?", (att_id,))
        return dict(rows[0]) if rows else None

    def attachment_used(self, att_id: str) -> bool:
        return bool(self._q("SELECT 1 FROM messages WHERE attachment_id=?", (att_id,)))

    # ------------------------------------------------------------ Profilbilder
    def get_avatars(self) -> dict[str, dict[str, Any]]:
        return {r["user_id"]: dict(r) for r in self._q("SELECT * FROM avatars")}

    def set_avatar(self, user_id: str, path: str) -> str | None:
        """Speichert ein Profilbild und gibt den Pfad des alten Bildes zurück."""
        old = self._q("SELECT path FROM avatars WHERE user_id=?", (user_id,))
        self._x(
            "INSERT INTO avatars (user_id, path, updated_at) VALUES (?,?,?)"
            " ON CONFLICT(user_id) DO UPDATE SET path=excluded.path, updated_at=excluded.updated_at",
            (user_id, path, time.time()),
        )
        return old[0]["path"] if old else None

    def delete_avatar(self, user_id: str) -> str | None:
        old = self._q("SELECT path FROM avatars WHERE user_id=?", (user_id,))
        self._x("DELETE FROM avatars WHERE user_id=?", (user_id,))
        return old[0]["path"] if old else None

    # ------------------------------------------------------------ Gruppen
    def set_description(self, conv_id: int, text: str) -> None:
        self._x("UPDATE conversations SET description=? WHERE id=?", (text or None, conv_id))

    def set_group_avatar(self, conv_id: int, path: str | None) -> str | None:
        """Setzt (oder entfernt mit None) das Gruppenbild; gibt den alten Pfad zurück."""
        old = self._q("SELECT avatar_path FROM conversations WHERE id=?", (conv_id,))
        self._x(
            "UPDATE conversations SET avatar_path=?, avatar_updated=? WHERE id=?",
            (path, time.time() if path else None, conv_id),
        )
        return old[0]["avatar_path"] if old else None

    # ------------------------------------------------------------ Benutzer-Einstellungen
    def get_user_settings(self) -> dict[str, dict[str, Any]]:
        return {
            r["user_id"]: {
                "show_presence": bool(r["show_presence"]), "last_seen": r["last_seen"],
                "card_path": r["card_path"], "compact_path": r["compact_path"],
            }
            for r in self._q("SELECT * FROM user_settings")
        }

    def set_view_path(self, user_id: str, kind: str, path: str) -> None:
        """Merkt sich, auf welchem Dashboard ein Benutzer die Chat-Karte (bzw. Kachel) nutzt."""
        col = "card_path" if kind == "card" else "compact_path"
        self._x(
            f"INSERT INTO user_settings (user_id, {col}) VALUES (?,?)"
            f" ON CONFLICT(user_id) DO UPDATE SET {col}=excluded.{col}",
            (user_id, path),
        )

    def set_show_presence(self, user_id: str, show: bool) -> None:
        self._x(
            "INSERT INTO user_settings (user_id, show_presence) VALUES (?,?)"
            " ON CONFLICT(user_id) DO UPDATE SET show_presence=excluded.show_presence",
            (user_id, int(show)),
        )

    def set_last_seen(self, user_id: str, ts: float) -> None:
        self._x(
            "INSERT INTO user_settings (user_id, last_seen) VALUES (?,?)"
            " ON CONFLICT(user_id) DO UPDATE SET last_seen=excluded.last_seen",
            (user_id, ts),
        )

    # ------------------------------------------------------------ Speicher (Administratoren)
    def storage_stats(self) -> list[dict[str, Any]]:
        """Nachrichten, Anhänge und Platzbedarf je Unterhaltung."""
        out = []
        for c in self._q("SELECT id, name, is_group, is_system, avatar_path, owner_id FROM conversations"):
            msgs = self._q(
                "SELECT COUNT(*) AS n, MIN(created_at) AS oldest FROM messages WHERE conversation_id=? AND deleted=0",
                (c["id"],),
            )[0]
            att = self._q(
                "SELECT COUNT(*) AS n, COALESCE(SUM(size),0) AS bytes FROM attachments WHERE conversation_id=?",
                (c["id"],),
            )[0]
            members = [r["user_id"] for r in self._q(
                "SELECT user_id FROM members WHERE conversation_id=?", (c["id"],)
            )]
            out.append({
                "id": c["id"], "name": c["name"], "is_group": bool(c["is_group"]),
                "is_system": bool(c["is_system"]), "owner_id": c["owner_id"], "members": members,
                "messages": msgs["n"], "oldest": msgs["oldest"],
                "attachments": att["n"], "attachment_bytes": att["bytes"],
            })
        return out

    def purge_attachments(self, conv_id: int) -> list[str]:
        """Löscht alle Anhänge eines Chats. Nachrichten mit Text bleiben (ohne Anhang) erhalten,
        reine Anhang-Nachrichten werden zu "gelöscht"."""
        with self._lock:
            rows = self._db.execute(
                "SELECT id, path FROM attachments WHERE conversation_id=?", (conv_id,)
            ).fetchall()
            ids = [r["id"] for r in rows]
            for att_id in ids:
                self._db.execute(
                    "UPDATE messages SET deleted=1, text='', attachment_id=NULL"
                    " WHERE attachment_id=? AND text='' AND location IS NULL",
                    (att_id,),
                )
                self._db.execute("UPDATE messages SET attachment_id=NULL WHERE attachment_id=?", (att_id,))
            self._db.execute(
                "DELETE FROM reactions WHERE message_id IN"
                " (SELECT id FROM messages WHERE conversation_id=? AND deleted=1)",
                (conv_id,),
            )
            self._db.execute("DELETE FROM attachments WHERE conversation_id=?", (conv_id,))
            self._db.commit()
        return [r["path"] for r in rows]

    def delete_all_messages(self, conv_id: int) -> list[str]:
        """Leert eine Unterhaltung komplett (Nachrichten und Anhänge), der Chat selbst bleibt."""
        with self._lock:
            paths = [r["path"] for r in self._db.execute(
                "SELECT path FROM attachments WHERE conversation_id=?", (conv_id,)
            ).fetchall()]
            sub = "(SELECT id FROM messages WHERE conversation_id=?)"
            self._db.execute(f"DELETE FROM reactions WHERE message_id IN {sub}", (conv_id,))
            self._db.execute(f"DELETE FROM hidden WHERE message_id IN {sub}", (conv_id,))
            self._db.execute("DELETE FROM reads WHERE conversation_id=?", (conv_id,))
            self._db.execute("DELETE FROM messages WHERE conversation_id=?", (conv_id,))
            self._db.execute("DELETE FROM attachments WHERE conversation_id=?", (conv_id,))
            self._db.commit()
        return paths

    def referenced_paths(self) -> set[str]:
        """Alle Dateien, die noch von der Datenbank verwendet werden."""
        refs = {r["path"] for r in self._q("SELECT path FROM attachments")}
        refs |= {r["path"] for r in self._q("SELECT path FROM avatars")}
        refs |= {r["avatar_path"] for r in self._q(
            "SELECT avatar_path FROM conversations WHERE avatar_path IS NOT NULL"
        )}
        return {os.path.abspath(p) for p in refs}

    def hidden_for(self, msg_id: int) -> set[str]:
        """Benutzer, die diese Nachricht nicht (mehr) sehen."""
        rows = self._q("SELECT user_id FROM hidden WHERE message_id=?", (msg_id,))
        out = {r["user_id"] for r in rows}
        rows = self._q(
            "SELECT mb.user_id FROM members mb JOIN messages m ON m.conversation_id=mb.conversation_id"
            " WHERE m.id=? AND mb.cleared_upto>=m.id",
            (msg_id,),
        )
        return out | {r["user_id"] for r in rows}

    def avatar_paths(self) -> list[str]:
        """Profilbilder und Gruppenbilder."""
        paths = [r["path"] for r in self._q("SELECT path FROM avatars")]
        paths += [r["avatar_path"] for r in self._q(
            "SELECT avatar_path FROM conversations WHERE avatar_path IS NOT NULL"
        )]
        return paths

    def newer_senders(self, conv_id: int, msg_id: int) -> set[str]:
        """Absender neuerer (nicht gelöschter) Nachrichten im selben Chat."""
        return {r["sender_id"] for r in self._q(
            "SELECT DISTINCT sender_id FROM messages WHERE conversation_id=? AND id>? AND deleted=0",
            (conv_id, msg_id),
        )}

    def db_files(self) -> list[str]:
        base = os.path.join(self.base_dir, self._db_file)
        return [base, base + "-wal", base + "-shm"]

    def vacuum(self) -> None:
        """Gibt freigewordenen Platz in der Datenbankdatei frei."""
        with self._lock:
            self._db.commit()
            self._db.execute("VACUUM")
            self._db.execute("PRAGMA wal_checkpoint(TRUNCATE)")

    # ------------------------------------------------------------ Bereinigung
    def cleanup(self, max_age_seconds: float) -> list[str]:
        """Löscht alte Nachrichten und verwaiste Anhänge, gibt Dateipfade zurück."""
        return self.cleanup_counted(max_age_seconds)[0]

    def cleanup_counted(self, max_age_seconds: float) -> tuple[list[str], int]:
        """Wie cleanup(), liefert zusätzlich die Anzahl gelöschter Nachrichten."""
        cutoff = time.time() - max_age_seconds
        orphan_cutoff = time.time() - 86400
        paths: list[str] = []
        with self._lock:
            old = self._db.execute(
                "SELECT id, attachment_id FROM messages WHERE created_at<?", (cutoff,)
            ).fetchall()
            for row in old:
                if row["attachment_id"]:
                    att = self._db.execute(
                        "SELECT path FROM attachments WHERE id=?", (row["attachment_id"],)
                    ).fetchone()
                    if att:
                        paths.append(att["path"])
                    self._db.execute("DELETE FROM attachments WHERE id=?", (row["attachment_id"],))
                self._db.execute("DELETE FROM reactions WHERE message_id=?", (row["id"],))
            deleted = self._db.execute("DELETE FROM messages WHERE created_at<?", (cutoff,)).rowcount
            self._db.execute("DELETE FROM reads WHERE at<?", (cutoff,))
            self._db.execute("DELETE FROM hidden WHERE message_id NOT IN (SELECT id FROM messages)")
            orphans = self._db.execute(
                "SELECT id, path FROM attachments a WHERE created_at<? AND NOT EXISTS"
                " (SELECT 1 FROM messages m WHERE m.attachment_id=a.id)",
                (orphan_cutoff,),
            ).fetchall()
            for o in orphans:
                paths.append(o["path"])
                self._db.execute("DELETE FROM attachments WHERE id=?", (o["id"],))
            self._db.commit()
        return paths, deleted


def _json(value: Any) -> Any:
    if not value:
        return None
    try:
        return json.loads(value)
    except (TypeError, ValueError):
        return None
