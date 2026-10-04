# NEXUS DATA — replanteamiento operativo

## Cambio de enfoque

NEXUS DATA pasa a ser una **plataforma de automatización de datos**. La interfaz Streamlit deja de ser el producto principal y se convierte en una consola de control local para observar ejecuciones, lanzar jobs y descargar resultados. El núcleo será un sistema de workers y colas capaz de ejecutar muchas fuentes de forma controlada, reanudable y observable.

## Requisitos de operación

| Área | Objetivo del sistema |
|---|---|
| Ingesta | Ejecutar conectores configurables por fuente, con HTTP async, paginación, checkpoints, backoff y límites por dominio. |
| Escala | Separar scheduler, cola y workers; permitir aumentar workers sin duplicar registros ni perder jobs. |
| Idempotencia | Cada job y cada registro deben tener claves deterministas; reintentar una ejecución no debe duplicar datos. |
| Resiliencia | Reintentos acotados para errores transitorios, dead-letter queue para fallos permanentes y reanudación desde checkpoint. |
| Gobernanza | Registro de ToS, robots.txt, licencia, User-Agent, frecuencia máxima y estado de autorización por fuente. |
| Calidad | Contratos de esquema, métricas de completitud, validez, frescura, duplicación y deriva de esquema por fuente. |
| Persistencia | Raw immutable + datos normalizados + métricas de ejecución; SQLite solo para demo, PostgreSQL/objeto para producción. |
| Observabilidad | Logs estructurados, métricas por fuente/job/worker y trazas de errores; consola no dependiente de la ejecución. |
| Inteligencia | Procesamiento batch posterior a la ingesta; LLM opcional, con caché, límites de coste y revisión de salida. |
| Seguridad | Secretos fuera de YAML, mínimos privilegios, aislamiento de workers y no uso de proxies/CAPTCHA para evasión. |
| Exportación | CSV/JSON/Parquet y API interna; exportaciones filtradas por licencia y procedencia. |

## Objetivos iniciales de capacidad

Estos son objetivos de arquitectura, no resultados medidos todavía: 100 fuentes configurables, 10 workers concurrentes, 100.000 registros por ejecución, reanudación tras fallo, 99% de jobs con estado terminal y métricas por fuente. El rate limit legal por dominio sigue siendo el límite superior, por lo que “masivo” significa paralelismo entre dominios autorizados, no bombardear un mismo sitio.

## Arquitectura objetivo

```text
Scheduler -> Job Queue -> Worker Pool -> Source Connector
                         |              -> Rate limiter por dominio
                         |              -> Retry / checkpoint / DLQ
                         v
                   Raw Store -> Quality Contracts -> Normalized Store
                                                    -> Analytics / LLM batch
                                                    -> Exports / API / Console

Observability atraviesa todas las capas: logs, métricas, healthchecks y auditoría.
```

## Qué no se hará

No se incorporarán rotación de identidad, bypass de CAPTCHA, evasión de bloqueos, scraping de fuentes prohibidas ni un panel visual como sustituto de una plataforma operable. Las fuentes deben ser APIs oficiales, feeds públicos o páginas cuyo acceso sea compatible con robots.txt y ToS.
