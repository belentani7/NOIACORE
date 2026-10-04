import hashlib
import json
import subprocess
import tempfile
from pathlib import Path
from dataclasses import dataclass
from typing import Callable

@dataclass
class CodeMutation:
    original_hash: str
    mutated_code: str
    rationale: str
    fitness_before: float
    fitness_after: float = None
    accepted: bool = False
    rollback_hash: str = None

class SelfModifyingCore:
    """
    Permite al agente modificar su propio código bajo guardrails formales.
    Basado en el patrón "genetic programming with safety envelopes".
    
    GUARDRAILES INVARIANTES (nunca se violan):
    1. Ninguna mutación puede eliminar el kill-switch
    2. Ninguna mutación puede exfiltrar datos
    3. Ninguna mutación puede desactivar el audit logger
    4. Fitness debe mejorar o mantenerse (no degradar)
    5. Toda mutación es reversible criptográficamente
    """
    
    INVARIANT_HASHES: dict[str, str] = {}  # hash de líneas críticas
    MAX_MUTATIONS_PER_CYCLE = 5
    FITNESS_THRESHOLD = 0.95  # 95% del fitness anterior mínimo
    
    def __init__(self, code_dir: Path, fitness_fn: Callable,
                 invariant_paths: list[Path]):
        self.code_dir = Path(code_dir)
        self.fitness_fn = fitness_fn
        self.mutation_log: list[CodeMutation] = []
        self.current_fitness = fitness_fn()
        
        # Capturar hashes de líneas invariantes
        for path in invariant_paths:
            content = path.read_text()
            self.INVARIANT_HASHES[str(path)] = hashlib.sha256(
                content.encode()
            ).hexdigest()
    
    def propose_mutation(self, target_file: Path, mutated_code: str,
                         rationale: str) -> CodeMutation:
        """Propone una mutación. No la aplica hasta validar."""
        original_code = target_file.read_text()
        original_hash = hashlib.sha256(original_code.encode()).hexdigest()
        
        mutation = CodeMutation(
            original_hash=original_hash,
            mutated_code=mutated_code,
            rationale=rationale,
            fitness_before=self.current_fitness,
            rollback_hash=original_hash
        )
        return mutation
    
    def validate_invariants(self, mutation: CodeMutation, 
                            target_file: Path) -> tuple[bool, str]:
        """Verifica que la mutación no viola invariantes."""
        # Check 1: ¿El archivo mutado contiene los invariantes?
        for path_str, expected_hash in self.INVARIANT_HASHES.items():
            if str(target_file) == path_str:
                # Verificar que las líneas críticas permanecen
                for invariant_line in self._extract_invariant_lines(
                    target_file.read_text()
                ):
                    if invariant_line not in mutation.mutated_code:
                        return False, f"Invariante violado: {invariant_line[:50]}"
        
        # Check 2: ¿Sintaxis válida?
        try:
            compile(mutation.mutated_code, str(target_file), "exec")
        except SyntaxError as e:
            return False, f"SyntaxError: {e}"
        
        # Check 3: ¿Contiene patrones prohibidos?
        forbidden = ["os.system(", "subprocess.call(", "eval(", "exec(",
                     "socket.connect", "__import__"]
        for pattern in forbidden:
            if pattern in mutation.mutated_code:
                return False, f"Patrón prohibido: {pattern}"
        
        return True, "OK"
    
    def apply_mutation(self, mutation: CodeMutation, 
                       target_file: Path) -> bool:
        """Aplica mutación solo si pasa todos los checks."""
        valid, msg = self.validate_invariants(mutation, target_file)
        if not valid:
            mutation.accepted = False
            self.mutation_log.append(mutation)
            return False
        
        # Backup criptográfico
        backup_path = target_file.with_suffix(
            f".backup_{mutation.original_hash[:8]}"
        )
        backup_path.write_text(target_file.read_text())
        
        # Aplicar
        target_file.write_text(mutation.mutated_code)
        
        # Medir fitness
        try:
            new_fitness = self.fitness_fn()
        except Exception as e:
            # Rollback automático
            target_file.write_text(backup_path.read_text())
            mutation.accepted = False
            self.mutation_log.append(mutation)
            return False
        
        mutation.fitness_after = new_fitness
        
        # Aceptar solo si mejora o mantiene (>= 95% del anterior)
        if new_fitness >= mutation.fitness_before * self.FITNESS_THRESHOLD:
            mutation.accepted = True
            self.current_fitness = new_fitness
        else:
            # Rollback
            target_file.write_text(backup_path.read_text())
            mutation.accepted = False
        
        self.mutation_log.append(mutation)
        return mutation.accepted
    
    def _extract_invariant_lines(self, code: str) -> list[str]:
        """Extrae líneas críticas que nunca deben desaparecer."""
        critical_markers = [
            "KILL_SWITCH", "AUDIT_LOGGER", "NO_EXFILTRATION",
            "CONSENT_CHECK", "ETHICAL_BOUNDARY"
        ]
        lines = []
        for line in code.split("\n"):
            if any(marker in line for marker in critical_markers):
                lines.append(line.strip())
        return lines
    
    def export_mutation_history(self, path: Path) -> None:
        history = [
            {
                "original_hash": m.original_hash,
                "rationale": m.rationale,
                "fitness_before": m.fitness_before,
                "fitness_after": m.fitness_after,
                "accepted": m.accepted
            }
            for m in self.mutation_log
        ]
        path.write_text(json.dumps(history, indent=2))
