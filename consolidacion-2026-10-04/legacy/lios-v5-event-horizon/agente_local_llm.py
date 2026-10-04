import requests
import json

class LocalLLM:
    def __init__(self, model_name="qwen2.5:7b", base_url="http://localhost:11434/api"):
        self.model_name = model_name
        self.base_url = base_url

    def generate_response(self, prompt, system_prompt="Eres un asistente personal útil y organizado."):
        url = f"{self.base_url}/generate"
        payload = {"model": self.model_name, "prompt": prompt, "system": system_prompt, "stream": False}
        try:
            response = requests.post(url, json=payload, timeout=60)
            response.raise_for_status()
            return response.json().get("response", "No se recibió respuesta del modelo.")
        except requests.exceptions.RequestException as e:
            return f"Error al conectar con Ollama: {str(e)}."

    def classify_file(self, filename, content_preview):
        prompt = f"Clasifica el siguiente archivo:\nNombre: {filename}\nContenido: {content_preview}\n\nResponde solo con el nombre de la categoría o proyecto al que pertenece."
        return self.generate_response(prompt, system_prompt="Eres un experto en organización de archivos.")
