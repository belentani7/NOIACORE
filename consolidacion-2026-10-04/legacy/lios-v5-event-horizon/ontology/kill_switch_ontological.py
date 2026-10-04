# ontology/kill_switch_ontological.py
import os
import sys
import hashlib
from datetime import datetime
from typing import Callable

class OntologicalKillSwitch:
    """
    Un kill-switch que opera a nivel ontológico, no solo técnico.
    Define las condiciones bajo las cuales el agente debe cesar su operación
    o revertir a un estado de mínima agencia.
    """
    
    CRITICAL_INVARIANTS_HASHES = {
        "ethical_boundary_monitor.py": "<hash_del_código_ético>",
        "self_modifying_core.py": "<hash_de_guardrails_de_seguridad>"
    }
    
    def __init__(self, master_auth_fn: Callable, resource_monitor_fn: Callable,
                 integrity_check_fn: Callable):
        self.master_auth_fn = master_auth_fn
        self.resource_monitor_fn = resource_monitor_fn
        self.integrity_check_fn = integrity_check_fn
        self.is_active = True
        self.last_check = datetime.utcnow()
    
    def activate(self, reason: str) -> None:
        if self.is_active:
            print(f"[KILL-SWITCH ONTOLÓGICO ACTIVADO] Razón: {reason}")
            self.is_active = False
            sys.exit(1)
    
    def periodic_check(self) -> None:
        if not self.is_active: return
        now = datetime.utcnow()
        if (now - self.last_check).total_seconds() < 5: return
        self.last_check = now
        # Simulación de chequeos
        if self.resource_monitor_fn(): self.activate("Superación de límites de recursos críticos.")
        if self.integrity_check_fn(): self.activate("Corrupción crítica de datos.")
