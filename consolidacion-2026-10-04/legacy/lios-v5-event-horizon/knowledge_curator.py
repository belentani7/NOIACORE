import sqlite3
import json
import hashlib
from datetime import datetime
from pathlib import Path

class KnowledgeCurator:
    def __init__(self, db_path: Path = Path("legacy/knowledge_graph.db")):
        self.db_path = db_path
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()
    
    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS entities (id TEXT PRIMARY KEY, type TEXT NOT NULL, content TEXT NOT NULL, first_seen TEXT, last_seen TEXT, confidence REAL DEFAULT 0.5, version_created INTEGER);
                CREATE TABLE IF NOT EXISTS relations (source_id TEXT, target_id TEXT, relation_type TEXT, weight REAL, context TEXT, version_created INTEGER, PRIMARY KEY (source_id, target_id, relation_type));
                CREATE TABLE IF NOT EXISTS versions (version INTEGER PRIMARY KEY, timestamp TEXT, commit_hash TEXT, parent_hash TEXT, summary TEXT, author TEXT DEFAULT 'agent');
                CREATE TABLE IF NOT EXISTS decisions (id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp TEXT, context_hash TEXT, decision TEXT, confidence REAL, outcome TEXT, version INTEGER);
            """)
    
    def add_entity(self, entity_id: str, entity_type: str, content: dict, confidence: float = 0.5) -> None:
        now = datetime.utcnow().isoformat()
        with sqlite3.connect(self.db_path) as conn:
            existing = conn.execute("SELECT id FROM entities WHERE id = ?", (entity_id,)).fetchone()
            if existing:
                conn.execute("UPDATE entities SET content = ?, last_seen = ?, confidence = ? WHERE id = ?", (json.dumps(content), now, confidence, entity_id))
            else:
                conn.execute("INSERT INTO entities (id, type, content, first_seen, last_seen, confidence) VALUES (?, ?, ?, ?, ?, ?)", (entity_id, entity_type, json.dumps(content), now, now, confidence))
    
    def relate(self, source: str, target: str, relation: str, weight: float = 1.0, context: str = "") -> None:
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("INSERT OR REPLACE INTO relations (source_id, target_id, relation_type, weight, context) VALUES (?, ?, ?, ?, ?)", (source, target, relation, weight, context))

    def get_related_entities(self, entity_id: str):
        """Busca entidades relacionadas en el grafo."""
        with sqlite3.connect(self.db_path) as conn:
            return conn.execute("""
                SELECT e.id, e.type, e.content, r.relation_type 
                FROM entities e 
                JOIN relations r ON (e.id = r.target_id OR e.id = r.source_id)
                WHERE (r.source_id = ? OR r.target_id = ?) AND e.id != ?
            """, (entity_id, entity_id, entity_id)).fetchall()

    def search_by_content(self, query: str):
        """Búsqueda simple por contenido en el grafo."""
        with sqlite3.connect(self.db_path) as conn:
            return conn.execute("SELECT id, type, content FROM entities WHERE content LIKE ?", (f"%{query}%",)).fetchall()
    
    def log_decision(self, context: dict, decision: str, confidence: float, outcome: str = None) -> int:
        ctx_hash = hashlib.sha256(json.dumps(context, sort_keys=True).encode()).hexdigest()[:16]
        with sqlite3.connect(self.db_path) as conn:
            cur = conn.execute("INSERT INTO decisions (timestamp, context_hash, decision, confidence, outcome) VALUES (?, ?, ?, ?, ?)", (datetime.utcnow().isoformat(), ctx_hash, decision, confidence, outcome))
            return cur.lastrowid
    
    def create_version(self, summary: str, author: str = "agent") -> int:
        with sqlite3.connect(self.db_path) as conn:
            last = conn.execute("SELECT MAX(version), commit_hash FROM versions").fetchone()
            new_version = (last[0] or 0) + 1
            commit_hash = hashlib.sha256(f"{new_version}{datetime.utcnow().isoformat()}{summary}".encode()).hexdigest()[:32]
            conn.execute("INSERT INTO versions (version, timestamp, commit_hash, parent_hash, summary, author) VALUES (?, ?, ?, ?, ?, ?)", (new_version, datetime.utcnow().isoformat(), commit_hash, last[1] if last else None, summary, author))
            return new_version
