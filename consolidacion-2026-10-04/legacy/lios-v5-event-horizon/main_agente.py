import os
import time
from agente_local_core import LocalAgentCore
from agente_local_llm import LocalLLM
from agente_local_vision import LocalVisionProcessor
from agente_local_audio import LocalAudioProcessor

class LocalAgent:
    def __init__(self):
        self.core = LocalAgentCore()
        self.llm = LocalLLM()
        self.vision = LocalVisionProcessor()
        self.audio = LocalAudioProcessor()
        self.watch_path = self.core.config.get("watch_path", os.path.expanduser("~/Documents/AgenteLocal_Input"))
        
        if not os.path.exists(self.watch_path):
            os.makedirs(self.watch_path)
            print(f"Carpeta de entrada creada: {self.watch_path}")

    def process_new_files(self):
        """Escanea la carpeta de entrada y procesa los archivos encontrados."""
        files = os.listdir(self.watch_path)
        for filename in files:
            file_path = os.path.join(self.watch_path, filename)
            if os.path.isfile(file_path):
                print(f"Procesando: {filename}")
                self._handle_file(file_path)

    def _handle_file(self, file_path):
        filename = os.path.basename(file_path)
        ext = os.path.splitext(filename)[1].lower()
        
        analysis = ""
        file_type = "otro"

        # Procesamiento según tipo
        if ext in ['.jpg', '.jpeg', '.png']:
            file_type = "imagen"
            analysis = self.vision.describe_image(file_path)
        elif ext in ['.mp3', '.wav', '.m4a']:
            file_type = "audio"
            analysis = self.audio.transcribe(file_path)
        elif ext in ['.txt', '.md']:
            file_type = "documento"
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read(1000) # Leer los primeros 1000 caracteres
            analysis = self.llm.classify_file(filename, content)

        # Organizar basándose en el análisis
        category = self.llm.generate_response(
            f"Basado en este análisis: '{analysis}', ¿en qué carpeta de proyecto debería ir el archivo '{filename}'? Responde solo con el nombre de la carpeta.",
            system_prompt="Eres un experto en organización de archivos. Tienes estos proyectos: " + str(self.core.get_projects())
        )
        
        print(f"Archivo '{filename}' clasificado en: {category}")
        
        # Registrar en la DB
        self.core.log_file(filename, file_path, file_type, metadatos={"analisis": analysis, "categoria_sugerida": category})
        
        # Aquí se podría mover el archivo físicamente
        # target_dir = os.path.join(os.path.expanduser("~/Documents/AgenteLocal_Organizado"), category)
        # if not os.path.exists(target_dir): os.makedirs(target_dir)
        # os.rename(file_path, os.path.join(target_dir, filename))

    def run_forever(self):
        print("Agente Local iniciado. Presiona Ctrl+C para detener.")
        try:
            while True:
                self.process_new_files()
                time.sleep(10) # Revisar cada 10 segundos
        except KeyboardInterrupt:
            print("Agente detenido.")

if __name__ == "__main__":
    agent = LocalAgent()
    # agent.run_forever()
