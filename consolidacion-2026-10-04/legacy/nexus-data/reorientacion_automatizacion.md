# NEXUS DATA — reorientación a automatización masiva

## Decisión

El panel visual deja de ser el centro del producto. NEXUS DATA se redefine como una plataforma de automatización de datos con **control plane, data plane, workers, políticas por dominio, persistencia, calidad, observabilidad e inteligencia batch**. La consola Streamlit solo sirve para operar y diagnosticar.

## Base open source seleccionada

La base principal recomendada es una combinación, no una herramienta aislada:

| Capa | Base |
|---|---|
| Extracción Python | Scrapy para spiders/pipelines autorizados y `httpx` async para APIs oficiales. |
| JS pesado autorizado | Playwright mediante integración controlada; nunca para evadir bloqueos. |
| Ejecución durable | Temporal open source + Python SDK para workflows, retries, timers, checkpoints y recuperación. |
| Modo local | `asyncio.Queue`/runtime propio con SQLite, útil para desarrollo y pruebas. |
| Calidad | Pydantic por registro y Great Expectations/Soda Core como contratos de batch. |
| Estado/datos | PostgreSQL + S3/MinIO en producción; SQLite para prototipo. |
| Observabilidad | OpenTelemetry, Prometheus, Grafana y logs JSON. |

Scrapy es la mejor base Python madura para extracción y pipelines. Crawl4AI es un complemento potente para crawling semántico/JS autorizado, pero no se introduce como núcleo porque añade complejidad y ofrece funciones que NEXUS debe mantener desactivadas. Crawlee es técnicamente sólido, pero está centrado en Node.js/TypeScript y contradice el stack Python solicitado. Temporal complementa la extracción al resolver durabilidad, no extracción.

## Adaptaciones implementadas

Se añadió `nexus_data/automation.py`, que implementa un runtime local operable con `PersistentJobStore`, estados `queued/running/completed/dead_letter`, reclamación transaccional, worker pool, retries exponenciales, rate limiting por dominio, checkpoints de estado y captura de errores. Se añadió `nexus_data/metrics.py`, compatible con exposición Prometheus, para medir completados, fallos, retries y latencias. Se añadió `nexus_data/temporal_workflow.py` como adaptador opcional para migrar el mismo contrato a workflows durables de Temporal sin contaminar el modo local.

También se añadió `run_mass_automation.py`, que convierte la configuración YAML en jobs persistentes y ejecuta los tres conectores autorizados con User-Agent identificable. La ejecución real produjo tres jobs completados y expuso métricas de latencia. Las pruebas aumentaron a siete y cubren una carga controlada de 100 jobs distribuidos entre dominios, con 10 workers y 100 estados completados.

## Resultado de validación

| Validación | Resultado |
|---|---:|
| Pruebas unitarias y de integración | 7 correctas |
| Fuentes públicas reales | 3 conectores completados |
| Jobs en runner masivo | 3 completados |
| Carga local controlada | 100 jobs, 10 workers, 100 completados |
| Rate limiting | Por dominio, mínimo 2 segundos; Jobicy configurado a 1 hora |
| Evasión de bloqueos/CAPTCHA | No implementada |
| User-Agent | Obligatorio y configurable |

## Próximo salto de producción

El modo local es una base ejecutable, no debe confundirse con un cluster productivo. El siguiente paso es desplegar Temporal, PostgreSQL, MinIO, Prometheus y Grafana; separar workers HTTP de workers Playwright; poner la política de dominios en un servicio persistente y usar contratos de idempotencia por `source_id + content_hash`. La concurrencia debe aumentar entre dominios autorizados, no dentro de un dominio por encima de sus términos.

## Fuentes open source consultadas

[1]: https://www.scrapy.org/ "Scrapy official site"
[2]: https://docs.crawl4ai.com/ "Crawl4AI documentation"
[3]: https://github.com/apify/crawlee "Crawlee repository"
[4]: https://docs.temporal.io/ "Temporal documentation"
[5]: https://docs.dagster.io/ "Dagster documentation"
[6]: https://github.com/fivetran/great_expectations "Great Expectations repository"
[7]: https://docs.celeryq.dev/ "Celery documentation"
