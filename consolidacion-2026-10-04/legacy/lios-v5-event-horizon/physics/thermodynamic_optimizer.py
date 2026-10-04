import time
from dataclasses import dataclass
from typing import Callable

# Constantes físicas fundamentales
K_BOLTZMANN = 1.380649e-23  # J/K
LANDAUER_LIMIT_J = 2.9e-21  # J por bit borrado a 300K
ROOM_TEMP_K = 300.0

@dataclass
class ThermalBudget:
    operations_budget: int
    bits_erased: int = 0
    joules_consumed: float = 0.0
    reversible_ops: int = 0
    irreversible_ops: int = 0
    
    @property
    def theoretical_minimum_joules(self) -> float:
        return self.bits_erased * LANDAUER_LIMIT_J
    
    @property
    def efficiency_ratio(self) -> float:
        if self.joules_consumed == 0:
            return 1.0
        return self.theoretical_minimum_joules / self.joules_consumed

class ThermodynamicOptimizer:
    """
    Monitorea y optimiza el consumo energético a nivel de bits.
    Busca acercarse al límite de Landauer mediante computación reversible.
    """
    
    def __init__(self, max_operations: int = 1_000_000):
        self.budget = ThermalBudget(operations_budget=max_operations)
        self.start_time = time.perf_counter()
        self.last_report_time = self.start_time
    
    def register_operation(self, is_reversible: bool = False, bits_processed: int = 1) -> None:
        self.budget.operations_budget -= 1
        if is_reversible:
            self.budget.reversible_ops += 1
        else:
            self.budget.irreversible_ops += 1
            self.budget.bits_erased += bits_processed
            self.budget.joules_consumed += bits_processed * LANDAUER_LIMIT_J * 10 # Factor de ineficiencia
        
        if self.budget.operations_budget <= 0:
            print("Presupuesto de operaciones agotado. Optimizador en modo de ahorro extremo.")
            # Aquí se podría activar un modo de baja potencia o pausar tareas no críticas
    
    def get_status(self) -> ThermalBudget:
        return self.budget
    
    def report_metrics(self) -> None:
        current_time = time.perf_counter()
        if current_time - self.last_report_time > 60: # Reportar cada 60 segundos
            print("--- Métrica Termodinámica ---")
            print(f"Operaciones restantes: {self.budget.operations_budget}")
            print(f"Bits borrados: {self.budget.bits_erased}")
            print(f"Julios consumidos (estimado): {self.budget.joules_consumed:.2e} J")
            print(f"Eficiencia teórica: {self.budget.efficiency_ratio:.2%}")
            self.last_report_time = current_time
