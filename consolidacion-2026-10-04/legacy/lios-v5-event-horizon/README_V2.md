# Agente Local V2: Autonomía, Intuición y Discreción

Esta actualización masiva transforma el Agente Local en una entidad proactiva que aprende de tus patrones de trabajo en Windows, toma decisiones inteligentes y se comunica contigo de forma discreta.

## Nuevas Capacidades Avanzadas

### 1. Motor de Intuición (Machine Learning)
El agente ahora incorpora un motor de aprendizaje de patrones basado en `scikit-learn`. 
- **Aprendizaje Continuo:** Registra cómo organizas tus archivos y qué decisiones tomas para entrenar un modelo de clasificación local.
- **Puntuación de Confianza:** Antes de actuar, el agente evalúa qué tan seguro está de su decisión.
- **Autonomía Inteligente:** Si la confianza es alta (>90%), el agente mueve y organiza archivos automáticamente sin preguntarte, ahorrándote tiempo.

### 2. Interacción de Baja Fricción
Diseñado para ser "Windows friendly" y discreto:
- **Notificaciones Toast:** Usa el sistema nativo de Windows para hacer preguntas rápidas.
- **Sugerencias Inteligentes:** El LLM (Qwen) genera botones de respuesta rápida (ej. "Sí, mover", "No, ignorar") para que solo tengas que hacer un clic.
- **Icono de Bandeja (System Tray):** Un acceso discreto para controlar el estado del agente y acceder a la configuración.

### 3. Autonomía y Discreción
- **No Persistente:** Si no respondes a una sugerencia, el agente no insiste. La notificación desaparece y el agente lo registra como una señal para mejorar su intuición.
- **Discreto y Ligero:** Optimizado para consumir los mínimos recursos posibles en segundo plano.

### 4. Preparación para Voz y Audio
Hemos sentado las bases para que el agente pueda hablar y escuchar:
- **Módulo TTS (Text-to-Speech):** Preparado para integrar `Piper`, una herramienta de síntesis de voz ultra-ligera y offline.
- **Escucha Activa:** Estructura lista para procesar comandos de voz mediante `faster-whisper`.

## Instalación de la Actualización

Además de los requisitos de la V1, necesitarás instalar las siguientes librerías para habilitar la intuición y la nueva interfaz:

```bash
pip install scikit-learn pystray desktop-notifier pandas
```

*Nota: Para las capacidades de voz futuras, se recomienda `piper-tts` y `sounddevice`.*

## Cómo usar la Nueva Versión

1.  **Inicia el Agente V2:** Ejecuta `python main_agente_v2.py`.
2.  **Entrena a tu Agente:** Al principio, el agente te preguntará a menudo mediante notificaciones discretas. A medida que respondas, su "intuición" mejorará.
3.  **Observa la Autonomía:** Verás que, con el tiempo, el agente empezará a mover archivos automáticamente cuando esté seguro de que es lo que quieres.
4.  **Control Total:** Usa el icono de la bandeja del sistema para pausar el agente o ajustar el umbral de confianza.

## Estructura de Archivos V2

- `agente_local_core_v2.py`: Núcleo avanzado con registro de actividad y motor de ML.
- `agente_local_ui.py`: Interfaz discreta (System Tray y Notificaciones Toast).
- `agente_local_voz.py`: Módulo de preparación para capacidades de voz.
- `main_agente_v2.py`: Orquestador de la autonomía e intuición.

---

**Autor:** Manus AI
**Versión:** 2.0.0 "Intuition & Autonomy"
**Fecha:** 20 de Julio de 2026
