# Investigación de Componentes para Agente Local en Windows

## Modelos LLM Recomendados (Offline)
- **Qwen 2.5 (o 3.5 si disponible):** Excelente para tareas agénticas, razonamiento y codificación. Muy eficiente en versiones cuantizadas (4-bit o 8-bit) para ejecutarse en hardware doméstico.
- **Samsung Gauss:** Aunque Samsung ha anunciado Gauss 2, su disponibilidad para descarga directa y uso offline por terceros es limitada comparada con Qwen o Llama. Se recomienda priorizar **Qwen** por su compatibilidad con herramientas como Ollama o LM Studio.
- **Vision (Fotos):** **Qwen2-VL** es el estándar actual para entender imágenes de forma local y privada.

## Procesamiento de Audio
- **Whisper (OpenAI):** Funciona 100% offline. Existen implementaciones como `faster-whisper` que son mucho más rápidas y eficientes en CPU/GPU.
- **Requisitos:** FFMPEG instalado y modelos `.pt` o `.bin` descargados previamente.

## Arquitectura del Agente
- **Motor de Tareas:** Un bucle en Python que escanea carpetas, procesa archivos nuevos y actualiza la base de datos.
- **Base de Datos:** SQLite o incluso un archivo JSON/Markdown estructurado para mantener la "memoria" de los proyectos y tareas.
- **Interfaz:** Una aplicación de bandeja de sistema (System Tray) o una terminal interactiva sencilla.

## Integración en Windows
- **Ollama:** La forma más fácil de servir modelos LLM localmente con una API compatible con OpenAI.
- **Python:** Lenguaje base para la lógica de organización y procesamiento de archivos.
- **Tareas Programadas:** Uso de `python-watchdog` para monitorear cambios en carpetas en tiempo real.
