# NEXUS DATA — Fase 2: arquitectura y cumplimiento

**Nicho:** inteligencia de empleo tecnológico remoto en Europa y Latinoamérica.  
**Objetivo del prototipo:** ingerir tres fuentes autorizadas, unificar y limpiar anuncios, calcular métricas de mercado y producir un informe reproducible desde Streamlit.

## 1. Principios de diseño

La plataforma separa claramente **adquisición**, **calidad**, **inteligencia** y **presentación**. La adquisición no intenta superar controles de acceso: usa APIs públicas o feeds autorizados, User-Agent identificable, límites por dominio y procedencia. Toda observación conserva la URL original, fuente, fecha de ingestión, licencia/nota de uso y versión del extractor.

El sistema se ejecuta localmente en Python 3.11 para el prototipo. `httpx` cubre HTTP simple; Playwright se mantiene como dependencia opcional y solo se activa para fuentes autorizadas cuyo contenido requiera JavaScript. El flujo es asíncrono mediante `asyncio`, con cola de trabajos, reintentos exponenciales acotados y un limitador por dominio de al menos dos segundos entre peticiones.

## 2. Componentes

| Capa | Implementación | Responsabilidad |
|---|---|---|
| Configuración | YAML + Pydantic | Definir fuente, endpoint, parámetros, esquema, paginación, rate limit y atribución. |
| Ingesta | `httpx.AsyncClient` + `asyncio` | Consultar endpoints; validar robots/ToS previamente documentados; registrar latencia, estado y cantidad. |
| Cola | `asyncio.Queue` | Encolar páginas o requests; limitar concurrencia; retries con backoff 2^n y jitter. |
| Almacenamiento | SQLite + SQLAlchemy | Guardar raw payload, registros normalizados, ejecuciones, métricas y errores. |
| Limpieza | Python, `pandas`, reglas deterministas | Tipos, fechas, monedas, HTML, campos obligatorios, deduplicación y esquema canónico. |
| Inteligencia | API LLM compatible con OpenAI; por defecto `gpt-5-mini` para clasificación/resumen | Extraer skills, clasificar seniority, resumir y redactar informe. El uso es opcional: el sistema funciona con analítica determinista. |
| Analítica | pandas/numpy | Distribuciones, tendencias, concentración, cobertura y anomalías. |
| Panel | Streamlit | Cargar YAML, lanzar ejecución, visualizar KPIs, tablas, informe y exportaciones CSV/JSON. |
| Observabilidad | `logging` JSON + tablas de métricas | Tasa de éxito/error por fuente, HTTP status, latencia, filas, duplicados y calidad de esquema. |

## 3. Esquema canónico

Cada anuncio se transforma a `JobRecord` con los campos `source`, `source_id`, `source_url`, `title`, `company`, `description`, `location`, `remote`, `employment_type`, `seniority`, `skills`, `salary_min`, `salary_max`, `salary_currency`, `salary_period`, `published_at`, `ingested_at`, `attribution_required` y `raw_hash`.

La clave de deduplicación prioriza `(source, source_id)` y, para duplicados entre fuentes, un fingerprint normalizado de empresa + título + ubicación + ventana temporal. No se eliminan silenciosamente los duplicados: se conserva el conteo de fuentes y se reporta la cobertura cruzada.

## 4. Controles de cumplimiento

| Control | Implementación del prototipo |
|---|---|
| Fuentes permitidas | Solo endpoints de Remotive, Arbeitnow y Jobicy documentados en `sources.yaml`. |
| User-Agent | `NexusDataPrototype/0.1 (+https://github.com/your-org/nexus-data; contact: data@example.com)` configurable por YAML. |
| Frecuencia | Espera global por dominio de 2 segundos como mínimo; Jobicy se consulta como máximo una vez por hora según su documentación. |
| Retries | Solo ante errores transitorios 429, 500–599 y fallos de red; máximo 3 intentos, backoff exponencial con jitter; no se reintenta 401/403/404. |
| CAPTCHA/bloqueos | No hay bypass, rotación de identidad ni evasión. Un bloqueo se registra y detiene la fuente. |
| Robots y ToS | Se documenta la URL de términos y la nota de uso por fuente en YAML; el extractor no descubre URLs fuera de los endpoints permitidos. |
| Atribución | Remotive y Jobicy conservan URL, nombre de fuente y aviso en panel/exportación. |
| Redistribución | El prototipo es un análisis interno; no publica una bolsa de empleo ni revende anuncios sin licencia comercial. |
| Datos personales | No se extraen perfiles de candidatos; solo metadatos de vacantes y descripción publicada. |
| LLM | Se envían únicamente textos de vacantes públicas; se excluyen emails/teléfonos detectados y se registra que el resultado es asistivo, no decisión automatizada de contratación. |

## 5. SQLite a PostgreSQL

SQLite es suficiente para una demo de un solo proceso, hasta decenas de miles de registros y una única sesión de escritura. La migración a PostgreSQL conservará el mismo esquema lógico, sustituyendo el driver por `asyncpg`, activando pool de conexiones y trasladando los trabajos a un worker persistente. Se añadirán índices en `(source, published_at)`, `raw_hash`, `company`, `seniority` y un índice GIN para skills. El almacenamiento raw deberá migrar a object storage con retención y checksum.

## 6. Métricas de calidad y éxito

La ejecución se considera válida cuando las tres fuentes devuelven respuesta o un estado explícito de no disponibilidad, al menos el 90% de los registros pasan validación de esquema, la tasa de duplicados se reporta, todos los registros tienen procedencia y el informe contiene al menos cinco insights cuantitativos. La calidad no se confunde con cobertura: se muestra por separado el número ingerido, válido, deduplicado, enriquecido y descartado.

## 7. Decisión de LLM

El análisis determinista calcula la mayoría de los KPIs. La API LLM se utiliza para clasificación semántica de seniority/skills y resumen de hallazgos, con `gpt-5-mini` como opción de coste y latencia equilibrados. Se preferirá salida estructurada JSON con `strict: true` y `additionalProperties: false`; el sistema aplicará una validación local y marcará como `needs_review` los casos que no cumplan el esquema. Si no existe `OPENAI_API_KEY`, el panel genera el informe determinista y avisa que el enriquecimiento LLM está desactivado.
