# Diseño de Arquitectura del Agente Local para Windows

## 1. Visión General del Agente

El agente local para Windows será una aplicación de escritorio autónoma, diseñada para operar completamente sin conexión a internet. Su propósito principal es asistir al usuario en la organización de archivos, la gestión de notas diarias y el procesamiento básico de medios (imágenes y audio) mediante el uso de modelos de lenguaje grandes (LLM) y modelos de visión/audio locales. El agente aprenderá y mejorará su capacidad de organización a partir de las interacciones y los datos del usuario.

## 2. Componentes Principales

La arquitectura del agente se dividirá en los siguientes módulos:

### 2.1. Módulo de Interfaz de Usuario (UI)
- **Interfaz de Línea de Comandos (CLI):** Para la interacción directa y la ejecución de tareas específicas.
- **Icono en Bandeja del Sistema (System Tray Icon):** Proporcionará acceso rápido a funciones comunes, estado del agente y notificaciones.
- **Interfaz Web Local (Opcional):** Una interfaz web ligera servida localmente (por ejemplo, con Flask o FastAPI) para una interacción más gráfica, accesible a través del navegador web del usuario (solo localmente).

### 2.2. Motor de Tareas y Orquestación
- **Bucle Principal del Agente:** Un proceso en Python que gestionará el estado del agente, programará tareas y orquestará la comunicación entre los módulos.
- **Programador de Tareas:** Para ejecutar tareas recurrentes (ej. escaneo de carpetas, recordatorios de notas).
- **Observador de Archivos (File Watcher):** Utilizará `watchdog` para monitorear directorios específicos en busca de nuevos archivos o modificaciones.

### 2.3. Módulo de Modelos de Lenguaje (LLM)
- **Servidor LLM Local:** Se recomienda utilizar **Ollama** para servir modelos LLM compatibles con la API de OpenAI localmente. Esto permitirá una fácil integración con el código Python del agente.
- **Modelos LLM:** Se priorizará **Qwen2-7B-Instruct-GGUF** (o una variante similar de Qwen) por su rendimiento en tareas agénticas y su capacidad para ejecutarse en hardware de consumo. Se descargará una versión cuantizada (ej. Q4_K_M) para optimizar el uso de RAM y VRAM.

### 2.4. Módulo de Procesamiento de Visión (Imágenes)
- **Modelo de Visión Local:** Se integrará **Qwen2-VL** (o un modelo similar de Visión-Lenguaje) para la comprensión de imágenes. Este modelo permitirá al agente "ver" y describir el contenido de las fotos locales.
- **Preprocesamiento de Imágenes:** Librerías como Pillow o OpenCV para redimensionar, recortar o extraer metadatos de imágenes antes de pasarlas al LLM de visión.

### 2.5. Módulo de Procesamiento de Audio
- **Modelo de Transcripción de Audio:** **Faster-Whisper** será la elección para la transcripción de voz a texto. Es una implementación optimizada de OpenAI Whisper, que ofrece mayor velocidad y eficiencia.
- **Preprocesamiento de Audio:** Librerías como `pydub` o `librosa` para manejar formatos de audio, segmentación y normalización.

### 2.6. Base de Datos de Conocimiento Local
- **Base de Datos Principal:** Se utilizará **SQLite** para almacenar metadatos de archivos, notas diarias, configuraciones del usuario y la "memoria" del agente (ej. asociaciones de proyectos, reglas de organización aprendidas).
- **Almacenamiento de Archivos:** Los archivos originales se mantendrán en el sistema de archivos de Windows, organizados según las reglas del agente.
- **Base de Datos de Vectores (Opcional/Futuro):** Para búsquedas semánticas y recuperación de información más avanzada, se podría considerar una base de datos de vectores ligera como `ChromaDB` o `FAISS` para incrustaciones generadas localmente.

## 3. Flujo de Datos y Operación

1.  **Inicio del Agente:** Al arrancar, el agente carga su configuración y la base de datos de conocimiento. Inicia el observador de archivos y el servidor LLM local (si no está ya en ejecución).
2.  **Monitoreo de Archivos:** El observador de archivos detecta nuevos archivos o modificaciones en las carpetas configuradas por el usuario.
3.  **Clasificación y Procesamiento:**
    -   Para archivos de texto: El LLM local analiza el contenido para clasificarlo, extraer entidades o generar resúmenes.
    -   Para imágenes: El módulo de visión procesa la imagen, y el LLM de visión genera una descripción o etiquetas.
    -   Para audio: El módulo Whisper transcribe el audio a texto, que luego es procesado por el LLM local.
4.  **Organización y Almacenamiento:** Basándose en el análisis del LLM y las reglas definidas (o aprendidas), el agente mueve, renombra o etiqueta los archivos. Los metadatos y las notas generadas se almacenan en la base de datos SQLite.
5.  **Gestión de Notas Diarias:** El usuario puede interactuar con el agente para crear, consultar o actualizar notas. El LLM puede ayudar a estructurar, resumir o expandir estas notas.
6.  **Bucle de Aprendizaje/Mejora:** El agente registrará las acciones del usuario (ej. correcciones de clasificación) para refinar sus reglas de organización y mejorar la precisión del LLM a lo largo del tiempo (a través de técnicas de *fine-tuning* o *prompt engineering* local).

## 4. Requisitos de Software y Hardware (Mínimos)

- **Sistema Operativo:** Windows 10/11 (64-bit).
- **Python:** Versión 3.9 o superior.
- **Hardware:**
    -   **CPU:** Procesador multinúcleo (ej. Intel Core i5/Ryzen 5 o superior).
    -   **RAM:** Mínimo 16 GB (se recomiendan 32 GB para modelos LLM más grandes y de visión).
    -   **GPU (Opcional pero muy recomendado):** NVIDIA con al menos 8 GB de VRAM (para acelerar LLM y modelos de visión/audio). Compatible con CUDA.
- **Dependencias:** FFMPEG, Git (para instalación de algunas librerías).

## 5. Consideraciones de Seguridad y Privacidad

Al operar completamente offline, el agente garantiza la máxima privacidad de los datos del usuario, ya que ninguna información abandona el sistema local. La seguridad se centrará en la robustez del código y la gestión de permisos de archivos en el sistema Windows.

## 6. Extensibilidad

La arquitectura modular permitirá añadir nuevas funcionalidades o integrar diferentes modelos LLM/visión/audio en el futuro, siempre que sean compatibles con la operación offline y los recursos del sistema.
