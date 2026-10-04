import os
# Nota: En un entorno real de Windows:
# pip install piper-tts sounddevice faster-whisper

class LocalVoiceEngine:
    def __init__(self, tts_model_path=None):
        self.tts_model_path = tts_model_path
        self.is_listening = False

    def speak(self, text):
        """Convierte texto a voz de forma local y discreta."""
        print(f"HABLANDO (Simulado): {text}")
        # En Windows real con Piper TTS:
        # os.system(f'echo "{text}" | piper --model {self.tts_model_path} --output_file response.wav && play response.wav')

    def listen(self):
        """Escucha audio del micrófono para procesar comandos (preparación)."""
        print("ESCUCHANDO (Simulado)... Di algo.")
        # En Windows real con sounddevice y faster-whisper:
        # audio_data = self._record_audio()
        # text = self.whisper_model.transcribe(audio_data)
        # return text
        return "comando simulado"

    def set_wake_word(self, word="Agente"):
        """Configura la palabra de activación."""
        self.wake_word = word
        print(f"Palabra de activación configurada: {self.wake_word}")

if __name__ == "__main__":
    voice = LocalVoiceEngine()
    voice.speak("Hola, estoy listo para escucharte.")
    command = voice.listen()
    print(f"Comando recibido: {command}")
