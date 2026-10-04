# Investigación de Herramientas para Agente Avanzado y Discreto

## 1. Interfaz de Usuario Discreta y Notificaciones de Baja Fricción
- **desktop-notifier:** Librería recomendada para notificaciones en Windows vía WinRT. Permite botones de acción rápida (ej. "Aceptar", "Omitir", "Editar"), lo que reduce la fricción en la toma de decisiones.
- **pystray:** Ideal para crear un icono en la bandeja del sistema (System Tray) que permita al agente estar presente de forma discreta, con un menú para configuraciones rápidas y estado de actividad.
- **Interacción de Baja Fricción:** Uso de diálogos rápidos o notificaciones tipo "toast" que desaparecen solas si no se interactúa, manteniendo la autonomía sin ser persistente.

## 2. Aprendizaje de Patrones e Intuición
- **Scikit-learn:** Librería ligera para implementar algoritmos de clasificación (ej. Random Forest o SVM) que aprendan de las decisiones pasadas del usuario (ej. dónde mueve ciertos archivos).
- **Seguimiento de Actividad (Discreto):** Monitoreo de eventos de archivos y acciones del usuario para crear un dataset local de entrenamiento.
- **DuckDB / Polars:** Para manejar datos de actividad de forma extremadamente rápida y ligera, ideal para un agente que debe ser "Windows friendly".

## 3. Autonomía y Toma de Decisiones
- **Lógica de Confianza (Confidence Score):** El agente solo actuará automáticamente si su modelo de predicción tiene una confianza alta (>90%). Si es baja, preguntará discretamente con opciones predefinidas.
- **Intuición de Decisiones:** Uso de LLMs locales (Qwen) para razonar sobre casos ambiguos antes de preguntar al usuario.

## 4. Preparación para Voz y Audio
- **PyAudio / SoundDevice:** Para captura de audio local.
- **Piper / Coqui TTS:** Para síntesis de voz (Text-to-Speech) local y ligera.
- **Whisper (faster-whisper):** Ya integrado en la fase anterior, servirá como el motor de escucha.

## 5. Seguridad y Discreción
- **Operación Local:** Garantizada por el uso de modelos GGUF y procesamiento en el dispositivo.
- **Ejecución como Servicio/Proceso de Fondo:** Configuración para que el agente arranque con Windows de forma silenciosa.
