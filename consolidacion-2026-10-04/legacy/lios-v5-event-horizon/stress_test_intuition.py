import os
import random
from pathlib import Path
from agente_local_core_v2 import LocalAgentCoreV2, IntuitionEngine

def run_stress_test():
    db_path = "legacy/test_stress.db"
    if os.path.exists(db_path): os.remove(db_path)
    
    core = LocalAgentCoreV2(db_path=db_path)
    intuition = IntuitionEngine(core, model_path="legacy/test_model.pkl")
    
    print("--- Generando datos de entrenamiento ---")
    proyectos = ["Finanzas", "Fotos_Vacaciones", "Codigo_Python", "Documentos_Legales"]
    extensiones = {
        "Finanzas": [".xlsx", ".pdf", ".csv"],
        "Fotos_Vacaciones": [".jpg", ".png", ".mov"],
        "Codigo_Python": [".py", ".ipynb", ".js"],
        "Documentos_Legales": [".docx", ".pdf"]
    }
    
    for _ in range(100):
        proyecto = random.choice(proyectos)
        ext = random.choice(extensiones[proyecto])
        filename = f"archivo_{random.randint(1000, 9999)}{ext}"
        core.log_user_activity(
            "interaccion_usuario", 
            filename, 
            "/tmp/input", 
            f"/proyectos/{proyecto}", 
            proyecto, 
            proyecto, 
            0.9, 
            {"test": True}
        )

    print("--- Entrenando Modelo ---")
    success = intuition.train_model()
    print(f"Entrenamiento exitoso: {success}")

    print("\n--- Validando Predicciones ---")
    test_cases = [
        ("factura_agosto.pdf", "Finanzas"),
        ("playa_sunset.jpg", "Fotos_Vacaciones"),
        ("script_limpieza.py", "Codigo_Python"),
        ("contrato_alquiler.docx", "Documentos_Legales")
    ]
    
    correct = 0
    for filename, expected in test_cases:
        prediction, confidence = intuition.predict_action(filename, {})
        print(f"Archivo: {filename} | Predicción: {prediction} | Confianza: {confidence:.2f} | Esperado: {expected}")
        if prediction == expected:
            correct += 1
            
    print(f"\nPrecisión de validación: {correct/len(test_cases):.2%}")

    # Limpieza
    if os.path.exists(db_path): os.remove(db_path)
    if os.path.exists("legacy/test_model.pkl"): os.remove("legacy/test_model.pkl")

if __name__ == "__main__":
    run_stress_test()
