import json
import hashlib
from pathlib import Path
from datetime import datetime
import base64

class LegacyBroker:
    def __init__(self, legacy_dir: Path = Path("legacy")):
        self.legacy_dir = legacy_dir
        self.legacy_dir.mkdir(parents=True, exist_ok=True)
        self.manifest_path = self.legacy_dir / "generational_manifest.json"
        self.will_path = self.legacy_dir / "digital_will.enc"
        self.manifest = self._load_manifest()
    
    def _load_manifest(self) -> dict:
        if self.manifest_path.exists():
            return json.loads(self.manifest_path.read_text())
        return {"created": datetime.utcnow().isoformat(), "version": "1.0", "heirs": [], "bequests": [], "conditions": {}, "revocation_keys": []}
    
    def designate_heir(self, heir_id: str, relationship: str, access_level: str = "read") -> None:
        heir = {"id": heir_id, "relationship": relationship, "access_level": access_level, "designated_at": datetime.utcnow().isoformat(), "active": True}
        self.manifest["heirs"].append(heir)
        self._save_manifest()
    
    def create_bequest(self, bequest_id: str, asset_type: str, asset_reference: str, heir_ids: list, conditions: dict = None) -> None:
        bequest = {"id": bequest_id, "asset_type": asset_type, "asset_reference": asset_reference, "heirs": heir_ids, "conditions": conditions or {}, "created_at": datetime.utcnow().isoformat()}
        self.manifest["bequests"].append(bequest)
        self._save_manifest()
    
    def encrypt_will(self, will_content: dict, master_passphrase: str) -> Path:
        payload = json.dumps(will_content, ensure_ascii=False)
        encrypted = base64.b64encode(payload.encode()).decode()
        encrypted_will_data = {"timestamp": datetime.utcnow().isoformat(), "encrypted_data": encrypted, "method": "simulated_base64"}
        self.will_path.write_text(json.dumps(encrypted_will_data))
        return self.will_path
    
    def _save_manifest(self) -> None:
        self.manifest_path.write_text(json.dumps(self.manifest, indent=2, ensure_ascii=False))
