# NEXUS DATA — Arquitectura del prototipo

## Principios

La arquitectura separa **captura**, **calidad** e **inteligencia**. La captura es intercambiable por fuente y no contiene lógica de negocio. La calidad convierte avisos heterogéneos a un esquema canónico, elimina duplicados y conserva trazabilidad. La inteligencia calcula métricas deterministas y, opcionalmente, usa un LLM para clasificación, resumen y detección de anomalías. Toda salida conserva `source_url`, `source_id`, `retrieved_at` y `raw_payload_hash`.

## Componentes

| Componente | Implementación | Decisión |
|---|---|---|
| HTTP | Python 3.11 + `httpx` | Cliente async, timeouts explícitos, User-Agent identificable |
| JavaScript pesado | Playwright opcional | Solo para fuentes autorizadas que lo requieran; no se usa en el demo |
| Orquestación | `asyncio` | Cola de trabajos, reintentos exponenciales y backoff con jitter |
| Rate limiting | Token por dominio | Valor por defecto: 2 segundos entre peticiones al mismo dominio |
| Persistencia | SQLite | Cero infraestructura para el prototipo; tablas `raw_records`, `opportunities`, `runs`, `source_metrics` |
| Migración | PostgreSQL | Sustituir `sqlite3` por SQLAlchemy/asyncpg, añadir índices y partición temporal |
| Inteligencia | API OpenAI-compatible | `gpt-5-mini` para clasificación/resumen masivo; salida estructurada y validada |
| UI | Streamlit | Ejecutar fuentes, visualizar shortlist, métricas e informe |
| Exportación | CSV/JSON | Descarga de datos canónicos y reporte |
| Observabilidad | Logging JSON + métricas | Éxitos, errores, latencia, filas recibidas, descartes y duplicados por fuente |

## Flujo

1. El usuario selecciona fuentes y una palabra clave. El orquestador carga YAML, comprueba configuración y crea un `run_id`.
2. Cada fuente se coloca en la cola por dominio. El limitador espera al menos dos segundos entre peticiones al mismo dominio.
3. El extractor consume JSON oficial o HTML permitido, normaliza la respuesta a registros crudos y registra errores sin detener las demás fuentes.
4. El limpiador convierte moneda, fechas, título, organismo, región, CPV/NAICS y plazo a un esquema común; valida campos y deduplica por `source + source_id`, URL y similitud de título.
5. El analizador calcula urgencia, ajuste a pyme, tamaño, concentración por comprador, categorías y anomalías de importe. El informe automático explica los hallazgos y sus limitaciones.
6. SQLite guarda el resultado y Streamlit expone tabla, indicadores, informe y exportación.

## Cumplimiento operativo

El cliente no visita fuentes prohibidas ni intenta superar controles. En cada petición se envía `User-Agent: NexusDataPrototype/0.1 (+contacto-configurable)`. El limitador es por dominio y por fuente. Los endpoints oficiales que requieren clave se desactivan de forma explícita si falta la variable correspondiente; el modo demo usa fixtures locales etiquetados como `demo_fixture`, no como datos vivos.

## Migración a PostgreSQL

La migración se realizará en tres pasos: sustituir el repositorio SQLite por una interfaz `Repository`, implementar la misma interfaz sobre SQLAlchemy 2 y PostgreSQL, y ejecutar una migración con `alembic`. Se añadirán índices en `(source, source_id)`, `deadline`, `country`, `category` y `retrieved_at`; para históricos, `opportunities` se particionará por mes de `retrieved_at`. El payload crudo se moverá a almacenamiento de objetos con hash inmutable y solo se conservará el URI en PostgreSQL.

## Decisiones no incluidas

No se incluyen proxies residenciales, rotación evasiva, CAPTCHA solving, scraping de redes sociales, elusión de autenticación, crawling ilimitado ni automatización de presentación de ofertas. El LLM no decide la elegibilidad jurídica: solo propone etiquetas y explica señales observables.
