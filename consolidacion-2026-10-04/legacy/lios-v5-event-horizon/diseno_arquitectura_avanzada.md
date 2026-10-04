# Diseño de Arquitectura Avanzada del Agente Local para Windows

## 1. Visión General de la Expansión

Esta fase de expansión busca transformar el agente local en una entidad más proactiva, intuitiva y adaptativa. El objetivo es que el agente no solo ejecute tareas, sino que aprenda de los patrones del usuario, anticipe necesidades y ofrezca asistencia de manera discreta y eficiente, minimizando la fricción en la interacción. Se mantendrá la premisa de operación 100% offline, ligereza y seguridad.

## 2. Componentes de Aprendizaje de Patrones y Autonomía

### 2.1. Módulo de Seguimiento de Actividad y Recopilación de Datos
- **Monitoreo de Eventos:** Extensión del `agente_local_watcher.py` para no solo detectar la creación de archivos, sino también movimientos, renombres, eliminaciones y aperturas de archivos en directorios clave. Se utilizarán las APIs de Windows a través de `pywin32` o `watchdog` para una monitorización más granular.
- **Registro de Interacciones:** Cada vez que el usuario interactúe con una notificación del agente (aceptar sugerencia, rechazar, editar), esta acción se registrará. También se registrarán las acciones manuales del usuario sobre archivos que el agente haya monitoreado previamente.
- **Base de Datos de Actividad (SQLite):** Se añadirá una tabla `actividad_usuario` en `agente_local.db` para almacenar:
    - `timestamp`: Momento de la acción.
    - `tipo_accion`: (ej. 'crear', 'mover', 'renombrar', 'abrir', 'aceptar_sugerencia', 'rechazar_sugerencia').
    - `ruta_archivo_origen`.
    - `ruta_archivo_destino` (si aplica).
    - `nombre_archivo`.
    - `categoria_sugerida_agente` (si aplica).
    - `categoria_final_usuario` (si aplica).
    - `confianza_agente` (puntuación de confianza de la decisión del agente).

### 2.2. Motor de Aprendizaje de Patrones (ML)
- **Extracción de Características:** A partir de los datos de `actividad_usuario`, se extraerán características relevantes como:
    - Tipo de archivo, extensión.
    - Palabras clave en el nombre del archivo o contenido (usando el LLM).
    - Hora del día, día de la semana.
    - Aplicación que creó/modificó el archivo.
    - Proyecto asociado (si ya existe).
- **Modelo de Clasificación:** Se utilizará un modelo de Machine Learning ligero (ej. `scikit-learn` con un `RandomForestClassifier` o `SVC`) entrenado con las interacciones pasadas del usuario. Este modelo predecirá la acción más probable o la categoría de organización para un nuevo archivo.
- **Reentrenamiento Incremental:** El modelo se reentrenará periódicamente o después de un número significativo de interacciones del usuario, utilizando los nuevos datos de `actividad_usuario` para adaptarse a los cambios en los patrones del usuario.

### 2.3. Lógica de Decisión Autónoma e Intuición
- **Umbral de Confianza:** El modelo de ML generará una puntuación de confianza para cada predicción. Si la confianza supera un umbral alto (ej. 90%), el agente actuará de forma autónoma (ej. mover el archivo).
- **Intervención del LLM para Baja Confianza:** Si la confianza está por debajo del umbral, el agente utilizará el LLM local (Qwen) para razonar sobre la situación. El LLM recibirá el contexto del archivo y las predicciones de baja confianza del modelo de ML, y generará una pregunta al usuario con sugerencias de respuesta.
- **Generación de Sugerencias:** El LLM también generará posibles respuestas para las notificaciones, basándose en las categorías de proyectos existentes o acciones comunes del usuario.

## 3. Interfaz de Usuario (UI/UX) Discreta y de Baja Fricción

### 3.1. Icono en Bandeja del Sistema (System Tray)
- **Librería:** `pystray` para crear un icono persistente en la bandeja del sistema de Windows.
- **Menú Contextual:** Permitirá al usuario:
    - Ver el estado del agente (activo/pausado).
    - Acceder a la configuración (rutas monitoreadas, umbrales de confianza).
    - Ver un historial de acciones y decisiones del agente.
    - Forzar un escaneo manual.
    - Salir del agente.

### 3.2. Notificaciones Interactivas (Toast Notifications)
- **Librería:** `desktop-notifier` (que usa WinRT en Windows) para enviar notificaciones nativas.
- **Preguntas Discretas:** Cuando el agente necesite una decisión del usuario (baja confianza o acción crítica), enviará una notificación "toast" con:
    - Un mensaje claro y conciso (ej. "¿Mover 'informe.pdf' a 'Proyectos/Cliente A'?").
    - Botones de acción rápida (ej. "Sí, mover", "No, ignorar", "Editar ruta").
    - Posibles respuestas pre-generadas por el LLM para reducir la escritura del usuario.
- **No Persistente:** Las notificaciones desaparecerán después de un tiempo si no hay interacción, evitando ser molestas.

### 3.3. Interfaz de Configuración (Opcional)
- Una pequeña ventana GUI (ej. con `tkinter` o `PyQt` si se busca algo más robusto) accesible desde el icono de la bandeja, para gestionar configuraciones avanzadas, proyectos y reglas.

## 4. Preparación para Capacidades de Voz

### 4.1. Módulo de Captura de Audio
- **Librería:** `PyAudio` o `SoundDevice` para capturar audio del micrófono del usuario.
- **Activación:** Se definirá una palabra clave de activación ("wake word") o un atajo de teclado para iniciar la escucha, manteniendo la discreción.

### 4.2. Módulo de Síntesis de Voz (TTS)
- **Librería:** `Piper` o `Coqui TTS` para generar respuestas de voz a partir del texto del agente. Estas librerías son ligeras y pueden ejecutarse offline.
- **Integración:** Las respuestas del LLM o las notificaciones importantes podrían ser vocalizadas por el agente.

## 5. Integración y Flujo de Trabajo Avanzado

1.  **Inicio:** El agente se inicia con Windows, carga su configuración y el modelo de ML, y activa el observador de archivos y el icono de la bandeja.
2.  **Monitoreo:** Detecta un nuevo archivo o una acción del usuario.
3.  **Análisis:** El LLM (Qwen) y/o el módulo de visión/audio procesan el archivo para extraer contexto.
4.  **Predicción:** El modelo de ML predice la acción/categoría más probable y su confianza.
5.  **Decisión:**
    - **Alta Confianza:** El agente ejecuta la acción autónomamente (ej. mueve el archivo) y registra la acción.
    - **Baja Confianza:** El LLM genera una pregunta y sugerencias. `desktop-notifier` muestra una notificación "toast" con botones.
6.  **Interacción del Usuario:** Si el usuario interactúa, la acción se registra y el agente procede. Si no, la notificación desaparece y el agente puede reintentar más tarde o dejar el archivo en su lugar.
7.  **Aprendizaje:** Las interacciones del usuario (especialmente las correcciones) se usan para reentrenar el modelo de ML, mejorando la "intuición" del agente con el tiempo.

## 6. Consideraciones de Rendimiento y Recursos

- **Modelos Cuantizados:** Se seguirá utilizando versiones GGUF de los LLMs para minimizar el uso de RAM y VRAM.
- **Procesamiento Asíncrono:** Uso de `asyncio` para manejar las operaciones de monitoreo, LLM y notificaciones sin bloquear el hilo principal del agente.
- **Optimización de ML:** Modelos de `scikit-learn` con baja complejidad para predicciones rápidas.

---

**Autor:** Manus AI
**Fecha:** 20 de Julio de 2026
