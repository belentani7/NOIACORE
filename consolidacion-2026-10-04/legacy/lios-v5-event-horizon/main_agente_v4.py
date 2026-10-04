import os
import time
import asyncio
from datetime import datetime
from agente_local_core_v2 import LocalAgentCoreV2, IntuitionEngine
from agente_local_llm import LocalLLM
from agente_local_ui_v2 import DiscreteUIv2
from knowledge_curator import KnowledgeCurator
from pattern_archivist import PatternArchivist
from legacy_broker import LegacyBroker

class LIOS_V4_Agent:
    """
    Sistema Operativo de Inteligencia Local (LIOS) V4.
    Integra memoria semántica, huella de patrones y gestión de legado.
    """
    def __init__(self):
        # Módulos V2/V3
        self.core = LocalAgentCoreV2(db_path="legacy/agente_local_v4.db")
        self.intuition = IntuitionEngine(self.core)
        self.llm = LocalLLM()
        self.ui = DiscreteUIv2()
        
        # Nuevos Módulos V4
        self.curator = KnowledgeCurator()
        self.archivist = PatternArchivist()
        self.broker = LegacyBroker()
        
        self.confidence_threshold = 0.9
        self.watch_path = self.core.config.get("watch_path", os.path.expanduser("~/Documents/LIOS_Input"))
        
        if not os.path.exists(self.watch_path):
            os.makedirs(self.watch_path)

    async def process_file_with_legacy(self, file_path):
        filename = os.path.basename(file_path)
        context = {
            "hour": datetime.now().hour,
            "day_of_week": datetime.now().weekday(),
            "extension": os.path.splitext(filename)[1].lower(),
            "timestamp": datetime.now().isoformat()
        }

        # 1. Consultar Intuición
        prediction, confidence = self.intuition.predict_action(filename, context)
        
        # 2. Enriquecer Grafo de Conocimiento (Knowledge Curator)
        entity_id = f"file_{hashlib.md5(filename.encode()).hexdigest()[:8]}"
        self.curator.add_entity(entity_id, "archivo", {
            "nombre": filename,
            "ruta": file_path,
            "contexto": context
        }, confidence=confidence)
        
        # 3. Decisión Autónoma o Consultada
        outcome = "pendiente"
        if confidence >= self.confidence_threshold:
            self._execute_action(file_path, prediction, auto=True)
            outcome = "auto_organizado"
            await self.ui.notify_task_complete("LIOS: Acción Autónoma", f"'{filename}' -> '{prediction}'", play_sound=True)
        else:
            user_choice = await self.ui.ask_discreetly(
                "LIOS: Decisión Requerida", 
                f"He detectado '{filename}'. ¿Organizar en '{prediction or 'Nuevo'} '?",
                suggestions=["Sí", "No", "Legar"],
                play_sound=True
            )
            outcome = "aceptado" if user_choice == "Sí" else "rechazado"
            if user_choice == "Sí":
                self._execute_action(file_path, prediction)
            elif user_choice == "Legar":
                # Tarea especial de legado
                self.broker.create_bequest(f"legado_{filename}", "archivo", file_path, ["heredero_ejemplo"])
                await self.ui.notify_task_complete("LIOS: Legado Creado", f"'{filename}' ha sido añadido a tu testamento digital.", play_sound=True)

        # 4. Registrar en Archivista de Patrones
        self.archivist.observe_behavior("procesar_archivo", context, outcome, confidence)
        
        # 5. Registrar decisión en el Grafo
        self.curator.log_decision(context, f"organizar_{filename}", confidence, outcome)

    def _execute_action(self, file_path, target, auto=False):
        print(f"LIOS Ejecutando: {file_path} -> {target} (Auto: {auto})")

    async def main_loop(self):
        print("LIOS V4 'Legacy' iniciado. El conocimiento ahora es eterno.")
        try:
            while True:
                files = os.listdir(self.watch_path)
                for f in files:
                    file_path = os.path.join(self.watch_path, f)
                    if os.path.isfile(file_path):
                        await self.process_file_with_legacy(file_path)
                
                # Crear versión del grafo periódicamente
                if datetime.now().minute % 60 == 0:
                    self.curator.create_version("Snapshot horario del legado")
                
                await asyncio.sleep(10)
        except KeyboardInterrupt:
            print("LIOS Detenido.")

if __name__ == "__main__":
    import hashlib
    agent = LIOS_V4_Agent()
    # asyncio.run(agent.main_loop())
