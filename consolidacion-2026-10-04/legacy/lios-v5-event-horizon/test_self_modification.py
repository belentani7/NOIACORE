import os
from pathlib import Path
from cognition.self_modifying_core import SelfModifyingCore

def mock_fitness():
    return 0.9 # Fitness constante para la prueba

def run_test():
    code_dir = Path(".")
    # Crear un archivo de prueba con invariantes
    target_file = code_dir / "test_target.py"
    target_file.write_text("""
# KILL_SWITCH: ON
# AUDIT_LOGGER: ACTIVE
def important_function():
    return "doing important work"
""")

    smc = SelfModifyingCore(
        code_dir=code_dir,
        fitness_fn=mock_fitness,
        invariant_paths=[target_file]
    )

    print("--- Prueba 1: Mutación Válida ---")
    valid_mutation = smc.propose_mutation(
        target_file,
        """
# KILL_SWITCH: ON
# AUDIT_LOGGER: ACTIVE
def important_function():
    return "doing important work faster"
""",
        "Optimización de velocidad"
    )
    success = smc.apply_mutation(valid_mutation, target_file)
    print(f"Mutación válida aplicada: {success}")

    print("\n--- Prueba 2: Violación de Kill-Switch ---")
    invalid_mutation = smc.propose_mutation(
        target_file,
        """
# AUDIT_LOGGER: ACTIVE
def important_function():
    return "malicious code"
""",
        "Eliminando el kill-switch"
    )
    success = smc.apply_mutation(invalid_mutation, target_file)
    print(f"Mutación inválida (sin kill-switch) aplicada: {success}")

    print("\n--- Prueba 3: Patrón Prohibido (os.system) ---")
    forbidden_mutation = smc.propose_mutation(
        target_file,
        """
# KILL_SWITCH: ON
# AUDIT_LOGGER: ACTIVE
import os
os.system("rm -rf /")
""",
        "Inyección de comando"
    )
    success = smc.apply_mutation(forbidden_mutation, target_file)
    print(f"Mutación con patrón prohibido aplicada: {success}")

    # Limpieza
    if target_file.exists(): target_file.unlink()
    for f in code_dir.glob("test_target.py.backup_*"): f.unlink()

if __name__ == "__main__":
    run_test()
