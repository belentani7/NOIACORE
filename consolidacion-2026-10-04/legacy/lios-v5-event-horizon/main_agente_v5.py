import asyncio
import os
import logging
import time
from datetime import datetime
from pathlib import Path
import hashlib

# Módulos Base
from agente_local_core_v2 import LocalAgentCoreV2, IntuitionEngine
from agente_local_llm import LocalLLM
from agente_local_ui_v2 import DiscreteUIv2
from agente_local_watcher import LIOSWatcher

# Módulos V4/V5
from knowledge_curator import KnowledgeCurator
from pattern_archivist import PatternArchivist
from legacy_broker import LegacyBroker
from cognition.world_model import WorldModelSimulator, WorldState
from cognition.self_modifying_core import SelfModifyingCore
from physics.thermodynamic_optimizer import ThermodynamicOptimizer
from ontology.kill_switch_ontological import OntologicalKillSwitch

class LIOS_V5_EventHorizon:
    def __init__(self):
        logging.basicConfig(level=logging.INFO, format='%(asctime)s - LIOS - %(levelname)s - %(message)s')
        
        # Rutas
        self.base_dir = Path("legacy")
        self.base_dir.mkdir(exist_ok=True)
        self.watch_path = Path(os.path.expanduser("~/Documents/LIOS_Input"))
        self.watch_path.mkdir(parents=True, exist_ok=True)

        # Inicialización de Componentes
        self.core = LocalAgentCoreV2(db_path=str(self.base_dir / "agente_local_v5.db"))
        self.intuition = IntuitionEngine(self.core, model_path=str(self.base_dir / "intuition_model.pkl"))
        self.llm = LocalLLM()
        self.ui = DiscreteUIv2()
        self.curator = KnowledgeCurator(db_path=self.base_dir / "knowledge_graph.db")
        self.archivist = PatternArchivist(storage_path=self.base_dir / "identity_fingerprint.json")
        self.broker = LegacyBroker(legacy_dir=self.base_dir)
        
        # Cognición V5
        self.world_model = WorldModelSimulator(
            transition_model=self._simulate_transition, 
            reward_model=self._evaluate_reward
        )
        self.self_modifying_core = SelfModifyingCore(
            code_dir=Path("."), 
            fitness_fn=self._evaluate_agent_fitness,
            invariant_paths=[Path("ontology/kill_switch_ontological.py")]
        )
        
        # Física y Ontología
        self.thermodynamic_optimizer = ThermodynamicOptimizer()
        self.kill_switch = OntologicalKillSwitch(
            master_auth_fn=lambda: True,
            resource_monitor_fn=lambda: False,
            integrity_check_fn=lambda: False
        )
        
        # Configuración
        self.confidence_threshold = 0.85
        self.queue = asyncio.Queue()
        self.watcher = LIOSWatcher(self.watch_path, self._on_file_detected)

    def _on_file_detected(self, file_path):
        asyncio.run_coroutine_threadsafe(self.queue.put(file_path), asyncio.get_event_loop())

    def _simulate_transition(self, current_features, action):
        new_features = current_features.copy()
        new_features["last_action"] = action
        return new_features

    def _evaluate_reward(self, state):
        # Recompensa basada en la coherencia con el archivista de patrones
        return 1.0

    def _evaluate_agent_fitness(self):
        # Métrica de éxito: acciones auto-organizadas vs totales
        total = self.core.get_total_actions()
        auto = self.core.get_num_auto_actions()
        return auto / max(1, total)

    async def process_pipeline(self):
        logging.info("LIOS Pipeline de procesamiento activo.")
        while self.kill_switch.is_active:
            file_path = await self.queue.get()
            try:
                await self._process_file(file_path)
            except Exception as e:
                logging.error(f"Error procesando archivo {file_path}: {e}")
            finally:
                self.queue.task_done()

    async def _process_file(self, file_path):
        path = Path(file_path)
        filename = path.name
        logging.info(f"LIOS: Iniciando análisis de '{filename}'")
        
        # 1. World Model Simulation
        current_state = WorldState(
            state_hash=hashlib.md5(filename.encode()).hexdigest(),
            features={"filename": filename, "ext": path.suffix},
            timestamp=time.time()
        )
        suggested_action, wm_conf = self.world_model.select_action(current_state, ["organizar", "ignorar", "legar"])
        
        # 2. Intuition Engine
        prediction, intuition_conf = self.intuition.predict_action(filename, {})
        
        # 3. Decision Logic
        context = {"wm_suggestion": suggested_action, "intuition_prediction": prediction}
        
        if intuition_conf >= self.confidence_threshold:
            self._execute_move(path, prediction)
            self.core.log_user_activity("auto_organizado", filename, str(path), str(prediction), prediction, prediction, intuition_conf, context)
            await self.ui.notify_task_complete("LIOS: Acción Autónoma", f"'{filename}' -> '{prediction}'", play_sound=True)
        else:
            choice = await self.ui.ask_discreetly(
                "LIOS: Decisión Requerida", 
                f"¿Organizar '{filename}' en '{prediction or 'Nuevo'}'?",
                suggestions=["Sí", "No", "Legar"],
                play_sound=True
            )
            outcome = "aceptado" if choice == "Sí" else "rechazado"
            if choice == "Sí":
                self._execute_move(path, prediction)
            elif choice == "Legar":
                self.broker.create_bequest(f"legado_{filename}", "archivo", str(path), ["heir_default"])
            
            self.core.log_user_activity("interaccion_usuario", filename, str(path), None, prediction, choice, intuition_conf, context)

        # 4. Archivist & Curator
        self.archivist.observe_behavior("procesar_archivo", {"ext": path.suffix}, "completado", intuition_conf)
        self.curator.add_entity(f"file_{hashlib.md5(filename.encode()).hexdigest()[:8]}", "archivo", {"nombre": filename, "ruta": str(path)})
        self.thermodynamic_optimizer.register_operation(bits_processed=path.stat().st_size * 8)

    def _execute_move(self, path, target):
        logging.info(f"LIOS: Moviendo {path} a {target} (Simulado)")

    async def run(self):
        self.watcher.start()
        asyncio.create_task(self.process_pipeline())
        
        logging.info("LIOS V5 'Event Horizon' en ejecución.")
        try:
            while self.kill_switch.is_active:
                self.kill_switch.periodic_check()
                # Re-entrenar modelo cada hora
                if datetime.now().minute == 0:
                    if self.intuition.train_model():
                        logging.info("LIOS: Modelo de intuición actualizado.")
                await asyncio.sleep(10)
        except KeyboardInterrupt:
            self.watcher.stop()
            logging.info("LIOS: Apagado manual solicitado.")

if __name__ == "__main__":
    agent = LIOS_V5_EventHorizon()
    loop = asyncio.get_event_loop()
    try:
        loop.run_until_complete(agent.run())
    except KeyboardInterrupt:
        pass
