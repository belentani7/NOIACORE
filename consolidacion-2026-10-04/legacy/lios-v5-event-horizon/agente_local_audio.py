import os
# Nota: En un entorno real de Windows, el usuario debería instalar faster-whisper:
# pip install faster-whisper

class LocalAudioProcessor:
    def __init__(self, model_size="base"):
        self.model_size = model_size
        self.model = None

    def _load_model(self):
        """Carga el modelo de Whisper si no está cargado."""
        if self.model is None:
            try:
                from faster_whisper import WhisperModel
                # El modelo se descargará la primera vez que se ejecute (requiere internet una vez)
                # Para uso offline total, el usuario debe descargar los archivos del modelo previamente.
                self.model = WhisperModel(self.model_size, device="cpu", compute_type="int8")
                print(f"Modelo Whisper '{self.model_size}' cargado correctamente.")
            except ImportError:
                print("Error: 'faster-whisper' no está instalado. Instálalo con 'pip install faster-whisper'.")
            except Exception as e:
                print(f"Error al cargar el modelo Whisper: {str(e)}")

    def transcribe(self, audio_path):
        """Transcribe un archivo de audio a texto."""
        self._load_model()
        if self.model is None:
            return "Error: No se pudo cargar el modelo de transcripción."

        try:
            segments, info = self.model.transcribe(audio_path, beam_size=5)
            transcription = ""
            for segment in segments:
                transcription += segment.text + " "
            return transcription.strip()
        except Exception as e:
            return f"Error durante la transcripción: {str(e)}"

if __name__ == "__main__":
    processor = LocalAudioProcessor()
    # test_audio = "ruta/al/audio.mp3"
    # print(processor.transcribe(test_audio))
