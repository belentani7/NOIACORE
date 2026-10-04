import requests
import base64
import os

class LocalVisionProcessor:
    def __init__(self, model_name="qwen2-vl", base_url="http://localhost:11434/api"):
        self.model_name = model_name
        self.base_url = base_url

    def _encode_image(self, image_path):
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')

    def describe_image(self, image_path, prompt="Describe esta imagen en detalle para fines de organización de archivos."):
        url = f"{self.base_url}/generate"
        image_base64 = self._encode_image(image_path)
        payload = {"model": self.model_name, "prompt": prompt, "images": [image_base64], "stream": False}
        try:
            response = requests.post(url, json=payload, timeout=120)
            response.raise_for_status()
            return response.json().get("response", "No se recibió descripción del modelo.")
        except requests.exceptions.RequestException as e:
            return f"Error al conectar con el servidor de visión (Ollama): {str(e)}."
