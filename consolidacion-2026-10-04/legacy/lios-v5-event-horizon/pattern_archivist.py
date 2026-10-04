import json
import hashlib
from pathlib import Path
from datetime import datetime
from collections import Counter

class PatternArchivist:
    def __init__(self, storage_path: Path = Path("legacy/identity_fingerprint.json")):
        self.storage_path = storage_path
        self.storage_path.parent.mkdir(parents=True, exist_ok=True)
        self.fingerprint = self._load()
    
    def _load(self) -> dict:
        if self.storage_path.exists():
            return json.loads(self.storage_path.read_text())
        return {"created": datetime.utcnow().isoformat(), "last_updated": None, "behavioral_patterns": {}, "decision_preferences": {}, "temporal_habits": {}, "value_signals": [], "version": 1}
    
    def observe_behavior(self, action_type: str, context: dict, outcome: str, confidence: float) -> None:
        patterns = self.fingerprint["behavioral_patterns"]
        if action_type not in patterns:
            patterns[action_type] = {"count": 0, "contexts": {}, "preferred_outcomes": {}, "avg_confidence": 0.0}
        p = patterns[action_type]
        p["count"] += 1
        cat = context.get("category", "unknown")
        p["contexts"][cat] = p["contexts"].get(cat, 0) + 1
        p["preferred_outcomes"][outcome] = p["preferred_outcomes"].get(outcome, 0) + 1
        p["avg_confidence"] = 0.9 * p["avg_confidence"] + 0.1 * confidence
        self.fingerprint["last_updated"] = datetime.utcnow().isoformat()
        self._save()
    
    def _save(self) -> None:
        self.storage_path.write_text(json.dumps(self.fingerprint, indent=2, ensure_ascii=False))
