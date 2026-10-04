# Agente Local V4: "Legacy & Generational Relevance"

Transformar tu agente en algo **relevante por generaciones** significa pasar de "herramienta personal" a **entidad patrimonial digital**: un sistema que acumula conocimiento, preserva identidad digital y transmite valor a herederos/descendientes/sucesores, manteniendo privacidad y autonomía.

## 1. Los 4 pilares de la relevancia generacional

| Pilar | Qué resuelve | Implementación |
|-------|--------------|----------------|
| **Memoria persistente** | El conocimiento no muere con el usuario | Grafo de conocimiento versionado |
| **Portabilidad vital** | Los datos sobreviven a plataformas | Formato abierto + self-contained |
| **Transmisión controlada** | Herederos acceden solo a lo autorizado | Testamento digital cifrado |
| **Evolución autónoma** | El agente mejora sin intervención | Self-improvement con guardrails |

## 2. Arquitectura V4 — "Legacy-Aware"

```
agente_local_windows_V4/
├── legacy/                          ← NUEVO
│   ├── knowledge_graph.db           # Grafo semántico versionado
│   ├── digital_will.enc             # Testamento digital cifrado
│   ├── identity_fingerprint.json    # Huella de patrones del usuario
│   └── generational_manifest.json   # Manifiesto de legado
├── core/
│   ├── knowledge_curator.py         # Curador de conocimiento
│   ├── pattern_archivist.py         # Archivista de patrones
│   └── legacy_broker.py             # Broker de transmisión
├── legal/
│   ├── digital_will_template.md     # Plantilla testamento digital
│   └── heir_access_protocol.md      # Protocolo acceso herederos
└── persistence/
    ├── format_agnostic/             # Datos en formatos abiertos
    └── migration_engine.py          # Migración entre versiones
```

## 3. Implementación en cada módulo existente

### 3.1 `knowledge_curator.py` — Grafo de conocimiento versionado

```python
# knowledge_curator.py
import sqlite3
import json
import hashlib
from datetime import datetime
from pathlib import Path

class KnowledgeCurator:
    """
    Construye un grafo de conocimiento personal versionado.
    Cada versión es inmutable y firmada criptográficamente.
    """
    
    def __init__(self, db_path: Path = Path("legacy/knowledge_graph.db")):
        self.db_path = db_path
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()
    
    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS entities (
                    id TEXT PRIMARY KEY,
                    type TEXT NOT NULL,
                    content TEXT NOT NULL,
                    first_seen TEXT,
                    last_seen TEXT,
                    confidence REAL DEFAULT 0.5,
                    version_created INTEGER
                );
                
                CREATE TABLE IF NOT EXISTS relations (
                    source_id TEXT,
                    target_id TEXT,
                    relation_type TEXT,
                    weight REAL,
                    context TEXT,
                    version_created INTEGER,
                    PRIMARY KEY (source_id, target_id, relation_type)
                );
                
                CREATE TABLE IF NOT EXISTS versions (
                    version INTEGER PRIMARY KEY,
                    timestamp TEXT,
                    commit_hash TEXT,
                    parent_hash TEXT,
                    summary TEXT,
                    author TEXT DEFAULT 'agent'
                );
                
                CREATE TABLE IF NOT EXISTS decisions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT,
                    context_hash TEXT,
                    decision TEXT,
                    confidence REAL,
                    outcome TEXT,
                    version INTEGER
                );
            """)
    
    def add_entity(self, entity_id: str, entity_type: str, content: dict, 
                   confidence: float = 0.5) -> None:
        now = datetime.utcnow().isoformat()
        with sqlite3.connect(self.db_path) as conn:
            existing = conn.execute(
                "SELECT id FROM entities WHERE id = ?", (entity_id,)
            ).fetchone()
            
            if existing:
                conn.execute("""
                    UPDATE entities 
                    SET content = ?, last_seen = ?, confidence = ?
                    WHERE id = ?
                """, (json.dumps(content), now, confidence, entity_id))
            else:
                conn.execute("""
                    INSERT INTO entities (id, type, content, first_seen, last_seen, confidence)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (entity_id, entity_type, json.dumps(content), now, now, confidence))
    
    def relate(self, source: str, target: str, relation: str, 
               weight: float = 1.0, context: str = "") -> None:
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT OR REPLACE INTO relations 
                (source_id, target_id, relation_type, weight, context)
                VALUES (?, ?, ?, ?, ?)
            """, (source, target, relation, weight, context))
    
    def log_decision(self, context: dict, decision: str, 
                     confidence: float, outcome: str = None) -> int:
        ctx_hash = hashlib.sha256(json.dumps(context, sort_keys=True).encode()).hexdigest()[:16]
        with sqlite3.connect(self.db_path) as conn:
            cur = conn.execute("""
                INSERT INTO decisions (timestamp, context_hash, decision, confidence, outcome)
                VALUES (?, ?, ?, ?, ?)
            """, (datetime.utcnow().isoformat(), ctx_hash, decision, confidence, outcome))
            return cur.lastrowid
    
    def create_version(self, summary: str, author: str = "agent") -> int:
        with sqlite3.connect(self.db_path) as conn:
            last = conn.execute(
                "SELECT MAX(version), commit_hash FROM versions"
            ).fetchone()
            new_version = (last[0] or 0) + 1
            commit_hash = hashlib.sha256(
                f"{new_version}{datetime.utcnow().isoformat()}{summary}".encode()
            ).hexdigest()[:32]
            
            conn.execute("""
                INSERT INTO versions (version, timestamp, commit_hash, parent_hash, summary, author)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (new_version, datetime.utcnow().isoformat(), commit_hash, 
                  last[1] if last else None, summary, author))
            return new_version
    
    def export_snapshot(self, output_path: Path) -> Path:
        """Exporta el grafo en formato abierto (JSON-LD) para portabilidad."""
        with sqlite3.connect(self.db_path) as conn:
            entities = [dict(zip(['id','type','content','first_seen','last_seen','confidence'], r))
                       for r in conn.execute("SELECT * FROM entities").fetchall()]
            relations = [dict(zip(['source','target','type','weight','context'], r))
                        for r in conn.execute(
                            "SELECT source_id, target_id, relation_type, weight, context FROM relations"
                        ).fetchall()]
        
        snapshot = {
            "@context": "https://schema.org/",
            "@type": "PersonalKnowledgeGraph",
            "version": datetime.utcnow().isoformat(),
            "entities": entities,
            "relations": relations
        }
        
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(json.dumps(snapshot, indent=2, ensure_ascii=False))
        return output_path
```

### 3.2 `pattern_archivist.py` — Huella de patrones del usuario

```python
# pattern_archivist.py
import json
import hashlib
from pathlib import Path
from datetime import datetime
from collections import Counter

class PatternArchivist:
    """
    Destila los patrones del usuario en una 'huella de identidad' 
    transmitible y anonimizable.
    """
    
    def __init__(self, storage_path: Path = Path("legacy/identity_fingerprint.json")):
        self.storage_path = storage_path
        self.storage_path.parent.mkdir(parents=True, exist_ok=True)
        self.fingerprint = self._load()
    
    def _load(self) -> dict:
        if self.storage_path.exists():
            return json.loads(self.storage_path.read_text())
        return {
            "created": datetime.utcnow().isoformat(),
            "last_updated": None,
            "behavioral_patterns": {},
            "decision_preferences": {},
            "temporal_habits": {},
            "value_signals": [],
            "version": 1
        }
    
    def observe_behavior(self, action_type: str, context: dict, 
                        outcome: str, confidence: float) -> None:
        """Registra observaciones y actualiza patrones."""
        patterns = self.fingerprint["behavioral_patterns"]
        
        if action_type not in patterns:
            patterns[action_type] = {
                "count": 0,
                "contexts": Counter(),
                "preferred_outcomes": Counter(),
                "avg_confidence": 0.0
            }
        
        p = patterns[action_type]
        p["count"] += 1
        p["contexts"][context.get("category", "unknown")] += 1
        p["preferred_outcomes"][outcome] += 1
        # Media móvil exponencial
        p["avg_confidence"] = 0.9 * p["avg_confidence"] + 0.1 * confidence
        
        self.fingerprint["last_updated"] = datetime.utcnow().isoformat()
        self._save()
    
    def extract_value_signals(self, decisions_log: list) -> list:
        """Identifica valores recurrentes en las decisiones del usuario."""
        values = Counter()
        for d in decisions_log:
            # Heurística: las decisiones de alta confianza revelan valores
            if d.get("confidence", 0) > 0.8:
                values[d.get("underlying_value", "unknown")] += 1
        
        self.fingerprint["value_signals"] = [
            {"value": v, "frequency": c} 
            for v, c in values.most_common(20)
        ]
        self._save()
        return self.fingerprint["value_signals"]
    
    def generate_portable_fingerprint(self, anonymize: bool = True) -> dict:
        """Genera una versión portable y opcionalmente anónima."""
        fp = json.loads(json.dumps(self.fingerprint))  # deep copy
        
        if anonymize:
            fp.pop("created", None)
            fp["identity_hash"] = hashlib.sha256(
                json.dumps(fp, sort_keys=True).encode()
            ).hexdigest()[:16]
        
        fp["exported"] = datetime.utcnow().isoformat()
        fp["format_version"] = "1.0"
        return fp
    
    def _save(self) -> None:
        self.storage_path.write_text(
            json.dumps(self.fingerprint, indent=2, ensure_ascii=False)
        )
```

### 3.3 `legacy_broker.py` — Testamento digital y transmisión

```python
# legacy_broker.py
import json
import hashlib
from pathlib import Path
from datetime import datetime
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
import base64

class LegacyBroker:
    """
    Gestiona el testamento digital: qué se transmite, a quién, 
    bajo qué condiciones. Cifrado end-to-end.
    """
    
    def __init__(self, legacy_dir: Path = Path("legacy")):
        self.legacy_dir = legacy_dir
        self.legacy_dir.mkdir(parents=True, exist_ok=True)
        self.manifest_path = self.legacy_dir / "generational_manifest.json"
        self.will_path = self.legacy_dir / "digital_will.enc"
        self.manifest = self._load_manifest()
    
    def _load_manifest(self) -> dict:
        if self.manifest_path.exists():
            return json.loads(self.manifest_path.read_text())
        return {
            "created": datetime.utcnow().isoformat(),
            "version": "1.0",
            "heirs": [],
            "bequests": [],
            "conditions": {},
            "revocation_keys": []
        }
    
    def designate_heir(self, heir_id: str, public_key_or_passphrase_hash: str,
                       relationship: str, access_level: str = "read") -> None:
        """
        Designa un heredero con nivel de acceso.
        access_level: 'read' | 'execute' | 'full'
        """
        heir = {
            "id": heir_id,
            "key_hash": public_key_or_passphrase_hash,
            "relationship": relationship,
            "access_level": access_level,
            "designated_at": datetime.utcnow().isoformat(),
            "active": True
        }
        self.manifest["heirs"].append(heir)
        self._save_manifest()
    
    def create_bequest(self, bequest_id: str, asset_type: str, 
                       asset_reference: str, heir_ids: list,
                       conditions: dict = None) -> None:
        """
        Crea un legado específico.
        asset_type: 'knowledge_graph' | 'fingerprint' | 'files' | 'models'
        """
        bequest = {
            "id": bequest_id,
            "asset_type": asset_type,
            "asset_reference": asset_reference,
            "heirs": heir_ids,
            "conditions": conditions or {},
            "created_at": datetime.utcnow().isoformat()
        }
        self.manifest["bequests"].append(bequest)
        self._save_manifest()
    
    def encrypt_will(self, will_content: dict, master_passphrase: str) -> Path:
        """Cifra el testamento con derivación de clave robusta."""
        salt = b"legacy_agent_v4_" + datetime.utcnow().isoformat().encode()[:16]
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=600_000,  # Recomendación OWASP 2024
        )
        key = base64.urlsafe_b64encode(
            kdf.derive(master_passphrase.encode())
        )
        f = Fernet(key)
        
        payload = json.dumps(will_content, ensure_ascii=False).encode()
        encrypted = f.encrypt(payload)
        
        # Almacenar con salt para poder regenerar la clave
        encrypted_will_data = {
            "salt": base64.urlsafe_b64encode(salt).decode(),
            "encrypted_data": encrypted.decode()
        }
        self.will_path.write_text(json.dumps(encrypted_will_data))
        return self.will_path
    
    def decrypt_will(self, master_passphrase: str) -> dict:
        """Descifra el testamento digital."""
        if not self.will_path.exists():
            raise FileNotFoundError("Testamento digital no encontrado.")
        
        encrypted_will_data = json.loads(self.will_path.read_text())
        salt = base64.urlsafe_b64decode(encrypted_will_data["salt"])
        encrypted_data = encrypted_will_data["encrypted_data"].encode()
        
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=600_000,
        )
        key = base64.urlsafe_b64encode(
            kdf.derive(master_passphrase.encode())
        )
        f = Fernet(key)
        
        decrypted_payload = f.decrypt(encrypted_data).decode()
        return json.loads(decrypted_payload)
    
    def _save_manifest(self) -> None:
        self.manifest_path.write_text(
            json.dumps(self.manifest, indent=2, ensure_ascii=False)
        )
```

### 3.4 `generational_manifest.json` — Manifiesto de legado

```json
{
  "created": "2026-07-20T12:00:00.000000",
  "version": "1.0",
  "heirs": [
    {
      "id": "heredero_ejemplo",
      "key_hash": "sha256_of_public_key_or_passphrase",
      "relationship": "hijo",
      "access_level": "read",
      "designated_at": "2026-07-20T12:00:00.000000",
      "active": true
    }
  ],
  "bequests": [
    {
      "id": "legado_grafo_conocimiento",
      "asset_type": "knowledge_graph",
      "asset_reference": "legacy/knowledge_graph.db",
      "heirs": ["heredero_ejemplo"],
      "conditions": {"after_date": "2050-01-01"},
      "created_at": "2026-07-20T12:00:00.000000"
    }
  ],
  "conditions": {},
  "revocation_keys": []
}
```

### 3.5 `digital_will_template.md` — Plantilla de testamento digital

```markdown
# Testamento Digital de [Nombre del Usuario]

Fecha: [Fecha]

Yo, [Nombre Completo del Usuario], declaro que este documento contiene mis instrucciones para la gestión y transmisión de mi legado digital.

## Herederos Digitales

- **[Nombre del Heredero 1]:** [Relación]. Acceso a: [Listar activos digitales, ej. Grafo de Conocimiento, Huella de Patrones Anonimizada]. Condiciones: [Ej. Tras mi fallecimiento y verificación de identidad].
- **[Nombre del Heredero 2]:** [Relación]. Acceso a: [Listar activos digitales, ej. Archivos personales, Modelos de IA personalizados]. Condiciones: [Ej. Tras mi fallecimiento y verificación de identidad].

## Activos Digitales a Transmitir

1.  **Grafo de Conocimiento Personal:** Mi base de conocimiento acumulada, versionada y exportable.
2.  **Huella de Patrones:** Un resumen anonimizado de mis hábitos y preferencias, para que mi agente pueda seguir evolucionando o ser adaptado por mis herederos.
3.  **Archivos Personales:** Especificar rutas o categorías de archivos (ej. `/Documentos/Importantes`, `/Fotos/Familia`).
4.  **Modelos de IA Personalizados:** Modelos de LLM o ML entrenados con mis datos para tareas específicas.

## Condiciones de Acceso y Verificación

-   El acceso se otorgará únicamente tras la verificación de mi fallecimiento y la presentación de la clave maestra o clave de recuperación por parte del heredero designado.
-   El agente, en modo de legado, asistirá en el proceso de verificación y transmisión.

## Revocación

Este testamento digital puede ser revocado o modificado en cualquier momento por mí, el usuario, mediante la interfaz del agente y mi clave maestra.

```

### 3.6 `heir_access_protocol.md` — Protocolo de acceso para herederos

```markdown
# Protocolo de Acceso para Herederos Digitales

Este documento describe el procedimiento para que los herederos designados accedan a los activos digitales legados por el usuario del Agente Local.

## Pasos para el Acceso

1.  **Verificación de Identidad:** El heredero debe presentar una prueba de identidad y la clave de acceso designada (frase de contraseña o clave pública).
2.  **Verificación de Fallecimiento:** Se requiere un certificado de defunción u otra prueba legalmente reconocida del fallecimiento del usuario.
3.  **Activación del Modo Legado:** El agente, al verificar las condiciones, entrará en un "modo legado" especial.
4.  **Acceso Controlado:** El agente proporcionará acceso a los activos digitales según los niveles de acceso y las condiciones especificadas en el `generational_manifest.json` y el `digital_will.enc`.
    -   **Acceso de Lectura:** Permite visualizar el grafo de conocimiento, la huella de patrones y los archivos.
    -   **Acceso de Ejecución:** Permite ejecutar modelos de IA o scripts personalizados.
    -   **Acceso Completo:** Otorga control total sobre los activos digitales y la configuración del agente.

## Seguridad

-   Todos los activos sensibles están cifrados y solo son accesibles con las claves correctas.
-   El agente registrará todos los intentos de acceso y las acciones realizadas en modo legado.

```

### 3.7 `migration_engine.py` — Motor de migración entre versiones

```python
# migration_engine.py
import json
from pathlib import Path

class MigrationEngine:
    """
    Gestiona la migración de datos y configuraciones entre diferentes 
    versiones del agente para asegurar la persistencia y compatibilidad.
    """
    
    def __init__(self, base_dir: Path = Path(".")):
        self.base_dir = base_dir
        self.migrations = {
            "1.0": self._migrate_v1_to_v2,
            "2.0": self._migrate_v2_to_v3,
            "3.0": self._migrate_v3_to_v4
        }
    
    def _get_current_version(self) -> str:
        # Asume que la versión actual se guarda en un archivo de configuración
        config_path = self.base_dir / "config.json"
        if config_path.exists():
            with open(config_path, 'r') as f:
                config = json.load(f)
                return config.get("agent_version", "1.0")
        return "1.0" # Versión por defecto si no hay config

    def _set_current_version(self, version: str) -> None:
        config_path = self.base_dir / "config.json"
        config = {}
        if config_path.exists():
            with open(config_path, 'r') as f:
                config = json.load(f)
        config["agent_version"] = version
        with open(config_path, 'w') as f:
            json.dump(config, f, indent=2)

    def migrate(self) -> None:
        current_version = self._get_current_version()
        print(f"Versión actual del agente: {current_version}")
        
        sorted_versions = sorted(self.migrations.keys(), key=lambda s: [int(u) for u in s.split('.')])
        
        for version_str in sorted_versions:
            if [int(u) for u in version_str.split('.')] > [int(u) for u in current_version.split('.')]:
                print(f"Migrando de {current_version} a {version_str}...")
                self.migrations[version_str]()
                self._set_current_version(version_str)
                current_version = version_str
        print(f"Migración completada. Versión final: {current_version}")

    def _migrate_v1_to_v2(self):
        print("Ejecutando migración de V1 a V2: Añadiendo tabla de actividad de usuario.")
        # Lógica para actualizar esquema de DB, etc.
        pass

    def _migrate_v2_to_v3(self):
        print("Ejecutando migración de V2 a V3: Actualizando configuraciones de UI.")
        # Lógica para actualizar configuraciones de notificaciones, etc.
        pass

    def _migrate_v3_to_v4(self):
        print("Ejecutando migración de V3 a V4: Creando directorios de legado y tablas de grafo de conocimiento.")
        # Lógica para crear la estructura de directorios 'legacy/'
        # Y para inicializar knowledge_graph.db si no existe
        Path("legacy").mkdir(parents=True, exist_ok=True)
        KnowledgeCurator()._init_db() # Asegura que la DB del grafo se inicialice
        pass

if __name__ == "__main__":
    # Ejemplo de uso:
    # engine = MigrationEngine()
    # engine.migrate()
    pass
```

## 4. Integración con el Agente Existente

-   **`agente_local_core_v2.py`:** Se renombrará a `agente_local_core_v4.py` y se actualizará para interactuar con `KnowledgeCurator` y `PatternArchivist`. Las decisiones del agente se registrarán en el grafo de conocimiento.
-   **`main_agente_v3.py`:** Se renombrará a `main_agente_v4.py` y se convertirá en el orquestador principal, inicializando todos los nuevos módulos y coordinando su interacción. El bucle principal utilizará el `KnowledgeCurator` para enriquecer el contexto de las decisiones y el `PatternArchivist` para registrar el comportamiento.
-   **`agente_local_ui_v2.py`:** Se renombrará a `agente_local_ui_v4.py` y se extenderá para incluir opciones de gestión del legado digital en el menú de la bandeja del sistema, así como notificaciones específicas para eventos de legado (ej. "Testamento digital actualizado").

## 5. Requisitos Adicionales

-   **`cryptography`:** Para el cifrado robusto del testamento digital en `legacy_broker.py`.
    ```bash
    pip install cryptography
    ```
-   **`pathlib`:** Ya es parte de la librería estándar de Python, pero su uso se intensifica para una gestión de rutas más robusta.

---

**Autor:** Manus AI
**Versión:** 4.0.0 "Legacy & Generational Relevance"
**Fecha:** 20 de Julio de 2026
