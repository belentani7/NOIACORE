# Stack open source seleccionado para NEXUS DATA

## Decisión

La base más adecuada no es una sola herramienta. Para una automatización masiva de nivel comercial se selecciona una **arquitectura compuesta**:

| Capa | Selección | Motivo |
|---|---|---|
| Conectores HTTP/API | `httpx` async en el MVP; Scrapy para spiders web autorizados | Mantiene el requisito de HTTP simple para APIs y añade, cuando haga falta, pipelines, throttling, selectores y extensiones maduras de Scrapy. |
| JS pesado autorizado | Playwright vía `scrapy-playwright` solo por fuente permitida | Evita cargar un navegador para APIs y mantiene el navegador como excepción controlada. |
| Orquestación durable | Temporal open source + Python SDK | Reanuda workflows tras caídas, persiste estado, aplica retries, timers, señales y ejecución durable; es más robusto que una cola casera para procesos largos. |
| Cola ligera/local | asyncio Queue o Redis Streams | Permite ejecutar el MVP sin infraestructura y migrar gradualmente a workers distribuidos. |
| Workers | Python 3.11, actividades idempotentes | Separación clara entre workflow y side effects; escala horizontalmente por tipo de fuente. |
| Contratos de calidad | Pydantic en runtime + Great Expectations/Soda Core en batch | Pydantic protege cada registro; contratos declarativos detectan deriva de esquema y calidad por lote. |
| Orquestación de datos futura | Dagster opcional | Linaje, assets, sensores y observabilidad para datasets derivados; no se introduce en el MVP si duplica Temporal. |
| Persistencia | PostgreSQL + almacenamiento S3/MinIO; SQLite para demo | PostgreSQL para estados y entidades; raw immutable en object storage; MinIO permite operar on-premise/open source. |
| Observabilidad | OpenTelemetry + Prometheus + Grafana + logs JSON | Métricas de throughput, latencia, errores, frescura, retries y coste LLM. |
| Consola | Streamlit reducido o API interna | Control y diagnóstico, no producto principal ni dependencia del worker. |

## Por qué no elegir una única herramienta

Scrapy es el núcleo más maduro para extracción Python: selectores, throttling, pipelines y extensiones. Crawl4AI es más sofisticado para crawling asistido por LLM y páginas dinámicas, pero añade complejidad y capacidades anti-bot que NEXUS no debe activar. Crawlee es potente y muy completo, pero su centro es Node.js/TypeScript, no el stack Python solicitado. Temporal resuelve un problema distinto: la durabilidad y recuperación de workflows. Por eso la combinación Scrapy/httpx + Temporal es superior a intentar convertir una sola librería de scraping en una plataforma completa.

## Perfil de ejecución masiva

Un workflow Temporal crea un `SourceRun` por fuente y fecha. Cada actividad obtiene una página o lote, persiste el raw con checksum, valida el contrato, normaliza y publica un evento de dataset listo para análisis. Las actividades son idempotentes mediante `source + source_id + content_hash`. El rate limiter se implementa como una actividad/servicio por dominio con token bucket persistente, nunca como concurrencia libre.

La escala se obtiene horizontalmente entre dominios y fuentes autorizadas. Dentro de un dominio, el límite de dos segundos o el límite más restrictivo de sus términos prevalece siempre. Temporal controla el estado; Scrapy/httpx hacen el trabajo de red; PostgreSQL/MinIO conservan el estado y los datos.

## Reglas de selección y licencias

Antes de incorporar cualquier dependencia se fijan versión, licencia y SBOM. La licencia de la dependencia no modifica los ToS de la fuente. Las funciones denominadas “anti-bot”, “undetected browser”, rotación de proxies o resolución de CAPTCHA quedan deshabilitadas y fuera del diseño de NEXUS.

## Referencias

[1]: https://www.scrapy.org/ "Scrapy official site"
[2]: https://docs.crawl4ai.com/ "Crawl4AI documentation"
[3]: https://github.com/apify/crawlee "Crawlee repository"
[4]: https://docs.temporal.io/ "Temporal documentation"
[5]: https://docs.celeryq.dev/ "Celery documentation"
[6]: https://docs.dagster.io/ "Dagster documentation"
[7]: https://github.com/fivetran/great_expectations "Great Expectations repository"
