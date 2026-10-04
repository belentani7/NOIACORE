# NEXUS DATA — arquitectura de automatización masiva

## Principio

La plataforma se divide en **control plane** y **data plane**. El control plane decide qué debe ejecutarse, con qué frecuencia y bajo qué licencia. El data plane ejecuta conectores autorizados, limita el tráfico, persiste respuestas y transforma datos. La consola solo consulta estados y dispara comandos; nunca contiene la lógica crítica del sistema.

## Componentes

| Componente | Responsabilidad | Escala |
|---|---|---|
| API/control plane | Crear `Source`, `Run`, `Policy` y consultar estados | Horizontal, stateless |
| Scheduler | Crear workflows por calendario/evento y respetar frecuencia mínima por fuente | 1+ replicas con locks |
| Temporal server | Durabilidad, timers, retries, señales y recuperación | Cluster gestionado o self-hosted |
| Worker coordinator | Enrutar por tipo de conector y prioridad | Horizontal |
| HTTP workers | `httpx` async para APIs; checkpoints, paginación y raw capture | Horizontal entre dominios |
| Spider workers | Scrapy para HTML autorizado y Playwright solo JS pesado autorizado | Pool separado por consumo |
| Domain policy service | Token bucket persistente, robots/ToS policy, User-Agent y límites | Alta disponibilidad |
| Raw store | Payload inmutable, headers mínimos, checksum y retención | S3/MinIO |
| Normalized store | JobRecord, taxonomías, snapshots y relaciones | PostgreSQL |
| Quality service | Validación de esquema, freshness, completeness, uniqueness y drift | Batch/stream |
| Intelligence service | Métricas deterministas, embeddings opcionales y LLM batch con caché | Workers separados |
| Observability | OpenTelemetry, Prometheus, Grafana y logs JSON | Centralizada |
| Console | Estado de jobs, métricas, DLQ, fuentes y exportaciones permitidas | Secundaria |

## Flujo de un run

1. El control plane valida que la fuente esté autorizada y crea un `SourceRun` idempotente.
2. Temporal inicia el workflow y agenda actividades por páginas/lotes.
3. El policy service consulta el límite efectivo del dominio; el worker espera antes de cada petición.
4. La actividad HTTP obtiene la respuesta con User-Agent identificable. Un 429 o 5xx se reintenta con backoff; un 401/403/404 pasa a estado terminal sin evasión.
5. El raw payload se guarda con `content_hash`, `retrieved_at`, fuente y versión del conector.
6. El contrato de calidad valida el lote. Los fallos se registran como datos de calidad; no se silencian.
7. La normalización y deduplicación publican un snapshot versionado en PostgreSQL.
8. La analítica calcula KPIs y el LLM, si está habilitado, resume solo los datos mínimos necesarios.
9. El workflow queda `completed`, `partial` o `dead_letter`; la consola muestra la razón y permite reanudar, no ocultar el fallo.

## Modelo de estados

```text
queued -> running -> completed
                    -> partial
                    -> retry_wait -> running
                    -> dead_letter

running -> cancelled
```

Cada transición incluye `run_id`, actor/sistema, timestamp, intento, error codificado y checksum de entrada. La reanudación parte del último checkpoint confirmado.

## Particionado y escalado

La unidad de partición es `domain + source`, no una página individual sin control. Así se puede aumentar el número de workers para 100 dominios autorizados sin superar el límite de ninguno. La deduplicación se realiza mediante una clave única `(source, source_id)` y un fingerprint transversal con revisión de colisiones. Los lotes de análisis se particionan por fecha y región.

## Capacidad y límites

“Masivo” no significa concurrencia ilimitada: significa **muchas fuentes autorizadas ejecutadas de manera coordinada**. El throughput real será el mínimo entre los límites de las fuentes, la capacidad de almacenamiento y el coste de análisis. El sistema debe exponer `requests_total`, `requests_success`, `requests_retry`, `requests_blocked`, `records_raw`, `records_valid`, `records_duplicate`, `quality_score`, `run_latency` y `llm_cost_estimate`.

## Producción recomendada

Para una primera instalación persistente: PostgreSQL, Redis/Temporal, MinIO, Prometheus y Grafana. Para un entorno pequeño, el runtime local de `automation.py` funciona como modo single-node y conserva los mismos contratos. La consola no debe ser el proceso que ejecuta crawlers; debe poder reiniciarse sin interrumpir workflows.
