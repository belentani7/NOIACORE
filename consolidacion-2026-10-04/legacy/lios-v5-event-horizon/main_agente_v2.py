import os
import time
import asyncio
from agente_local_core_v2 import LocalAgentCoreV2, IntuitionEngine
from agente_local_llm import LocalLLM
from agente_local_ui import DiscreteUI

class AdvancedLocalAgent:
    def __init__(self):
        self.core = LocalAgentCoreV2()
        self.intuition = IntuitionEngine(self.core)
        self.llm = LocalLLM()
        self.ui = DiscreteUI()
        self.confidence_threshold = 0.9 # Umbral para actuar de forma autónoma
        
        # Cargar configuración
        self.watch_path = self.core.config.get("watch_path", os.path.expanduser("~/Documents/AgenteLocal_Input"))
        if not os.path.exists(self.watch_path):
            os.makedirs(self.watch_path)

    async def process_file_with_intuition(self, file_path):
        filename = os.path.basename(file_path)
        context = {
            "hour": time.localtime().tm_hour,
            "day_of_week": time.localtime().tm_wday,
            "extension": os.path.splitext(filename)[1].lower()
        }

        # 1. Consultar la intuición (ML)
        prediction, confidence = self.intuition.predict_action(filename, context)
        
        # 2. Si la confianza es alta, actuar autónomamente
        if confidence >= self.confidence_threshold:
            print(f"Intuición ALTA ({confidence}): Actuando de forma autónoma para '{filename}' -> {prediction}")
            self._execute_action(file_path, prediction, auto=True)
            return

        # 3. Si la confianza es baja, usar LLM para razonar y preguntar discretamente
        print(f"Intuición BAJA ({confidence}): Consultando al usuario de forma discreta.")
        
        # El LLM genera la sugerencia y posibles respuestas
        reasoning = self.llm.generate_response(
            f"El archivo '{filename}' ha aparecido. Basado en tus proyectos {self.core.get_projects()}, ¿qué debería hacer?",
            system_prompt="Eres un asistente intuitivo. Sugiere una acción y 3 opciones cortas de respuesta."
        )
        
        # Interfaz de baja fricción
        user_choice = await self.ui.ask_discreetly(
            "Sugerencia del Agente", 
            f"He visto '{filename}'. ¿Quieres que lo organice en '{prediction or 'un nuevo proyecto'}'?",
            suggestions=["Sí, adelante", "No por ahora", "Personalizar"]
        )
        
        # 4. Registrar la decisión para que la intuición aprenda
        self.core.log_user_activity(
            tipo_accion="aceptar_sugerencia" if user_choice == "Sí, adelante" else "rechazar_sugerencia",
            nombre_archivo=filename,
            sugerencia=prediction,
            final=prediction if user_choice == "Sí, adelante" else None,
            confianza=confidence,
            contexto=context
        )
        
        if user_choice == "Sí, adelante":
            self._execute_action(file_path, prediction)

    def _execute_action(self, file_path, target_category, auto=False):
        filename = os.path.basename(file_path)
        print(f"Ejecutando acción: Moviendo '{filename}' a '{target_category}' (Auto: {auto})")
        # Aquí iría la lógica física de mover el archivo
        # self.core.log_file(filename, file_path, "documento", metadatos={"auto": auto, "categoria": target_category})

    async def main_loop(self):
        print("Agente Avanzado iniciado. Monitoreando patrones y archivos...")
        # self.ui.create_system_tray() # Esto suele ser bloqueante, se lanzaría en un hilo aparte
        
        try:
            while True:
                files = os.listdir(self.watch_path)
                for f in files:
                    file_path = os.path.join(self.watch_path, f)
                    if os.path.isfile(file_path):
                        await self.process_file_with_intuition(file_path)
                
                # Reentrenar intuición cada cierto tiempo
                self.intuition.train_model()
                
                await asyncio.sleep(10)
        except KeyboardInterrupt:
            print("Agente detenido.")

if __name__ == "__main__":
    agent = AdvancedLocalAgent()
    # asyncio.run(agent.main_loop())
