# NEXUS DATA — Architecture Audit V2

**Fecha:** 20 de agosto de 2026  
**Estado:** implementación integrada y validada en entorno local.

## Executive summary

La directiva se aplicó cambiando el centro del sistema desde un extractor de empleo acoplado hacia una capa de inteligencia encima de un **Acquisition Bus**. El núcleo activo usa APIs oficiales mediante `httpx`; la interfaz permite registrar proveedores alternativos sin acoplar el resto del sistema a Crawlee, Crawl4AI, Firecrawl o Playwright.

La extracción sigue una cascada de coste y riesgo: API oficial, HTTP simple, parser, browser autorizado y extracción asistida. En esta iteración están implementados e integrados `APIProvider`, `HttpxProvider` y `CustomYamlProvider`. Los proveedores externos tienen un límite explícito y seguro: devuelven `unavailable` hasta que exista una configuración legal y operativa, evitando presentar una integración ficticia o copiar código de terceros.

## Current state and problems found

El prototipo original tenía un extractor HTTP útil, rate limiting, persistencia SQLite, workers y análisis del nicho jobs, pero su modelo estaba acoplado a `JobRecord`. También carecía de lineage de primer nivel, snapshots, temporalidad, confianza por campo, señales, evidencia verificable, conflictos cross-source, score de inteligencia y un firewall de compliance centralizado. La función de limpieza tenía un camino de error silencioso que podía ocultar registros inválidos.

## Selected components

| Capa | Selección V2 | Estado | Motivo |
|---|---|---|---|
| API/HTTP | `httpx` + `APIProvider` | Implementado, integrado y testeado | Ruta más barata y compatible con APIs oficiales. |
| Adapters | `AcquisitionProvider` + `AcquisitionBus` | Implementado, integrado y testeado | Permite intercambiar motores sin tocar normalización o analítica. |
| Browser/AI externos | Crawlee/Crawl4AI/Firecrawl/Playwright como providers opt-in | Boundary implementado; no activados | Evita dependencias falsas y riesgos de licencia/ToS. |
| Compliance | `ComplianceFirewall` + `CompliancePolicy` | Implementado, integrado y testeado | Bloquea dominios no aprobados, URLs no HTTP(S), fuentes deshabilitadas y rate limit inferior a 2 s. |
| Contracts | Pydantic `RawRecord`, `NormalizedRecord`, `EnrichedRecord`, `Insight` | Implementado, integrado y testeado | Valida la forma de datos antes de persistir resultados. |
| Lineage | `Lineage` por registro | Implementado e integrado | Mantiene fuente, URL, timestamp, job, extractor, schema y snapshot. |
| Temporalidad | Snapshots SQLite y `detect_changes` | Implementado e integrado | Detecta `NEW`, `CHANGED`, `REMOVED` y duplicados entre ejecuciones. |
| Intelligence | DQ score, intelligence score, entity resolution, signals, insights | Implementado e integrado | Convierte observaciones en evidencia, interpretación, impacto y recomendación. |
| Analítica | Jobs niche pack | Implementado e integrado | Prepara salary, remote, skills, company y seniority para señales. |
| Operación | Worker pool existente + pipeline V2 | Existente e integrado parcialmente | El bus puede ser ejecutado por el runtime masivo existente. |
| Storage | SQLite transaccional | Implementado | DuckDB queda como siguiente mejora para snapshots analíticos locales. |

## Open source assessment

**Crawlee** es la mejor base técnica open source para un acquisition layer general si el producto acepta Node/TypeScript o incorpora su SDK Python. Aporta conceptos de request queue, crawlers HTTP/browser, storage y sesiones. NEXUS debe reutilizar la abstracción, no copiar el núcleo.

**Firecrawl** es un buen proveedor externo de web-to-LLM con Search, Scrape, Map, Crawl, Interact y salida Markdown/JSON. No se incorpora al core propietario por su licencia AGPL y porque sus capacidades anti-bot/hosted no resuelven la especialización vertical de NEXUS.

**Crawl4AI** es la mejor ruta Python-first para extracción asistida por LLM/local cuando una página autorizada necesita interpretación semántica. Debe activarse como proveedor independiente y con límites de recursos.

**Scrapy** sigue siendo el fallback más mantenible para spiders especializados y pipelines estructurados. **Playwright** queda limitado a JavaScript pesado autorizado. **Temporal/Prefect/Dagster** son capas de ejecución y gobierno, no sustitutos del acquisition bus.

## Intelligence pipeline implemented

```text
RAW DATA
  -> NORMALIZATION
  -> ENTITY RESOLUTION
  -> DEDUPLICATION
  -> VALIDATION / DQ_SCORE
  -> FIELD CONFIDENCE
  -> SNAPSHOT
  -> CHANGE DETECTION
  -> SIGNALS
  -> INSIGHTS WITH EVIDENCE_IDS
```

Cada insight contiene `observation`, `evidence_ids`, `interpretation`, `impact`, `recommendation`, `confidence` y referencias a señales. El LLM no es necesario para producir el resultado base y, si se incorpora después, deberá entregar JSON validado por Pydantic y nunca ser la fuente final de verdad.

## End-to-end validation

La suite completa ejecutó **10 pruebas correctas**. La ejecución real V2 obtuvo **117 registros raw normalizados**, **9 señales** y **6 insights**: Remotive aportó 17 registros, Jobicy 100 y Arbeitnow fue bloqueado por la respuesta de la fuente. El bloqueo fue visible como `blocked` en `SourceHealth`; no se convirtió silenciosamente en cero resultados.

| Criterio | Resultado |
|---|---:|
| Unit tests originales y V2 | 10/10 |
| User-Agent identificable | Verificado en test |
| Compliance firewall | Verificado en test |
| Lineage y snapshot | Verificado en test y E2E |
| DQ/intelligence score | Verificado en test y E2E |
| Detección de cambios | Verificado en test y E2E |
| Evidencia de insights | Verificado en test y E2E |
| Fuente pública bloqueada | Reportada como `blocked`, sin fallo silencioso |

## Before / after

| Dimensión | Prototipo original | NEXUS V2 |
|---|---|---|
| Adquisición | `GenericExtractor` acoplado | Acquisition Bus con providers |
| Nicho | Jobs como modelo principal | `NicheDefinition` y normalizer registrable |
| Calidad | Validación y deduplicación básica | DQ score, field confidence, validity, uniqueness |
| Historia | Último estado SQLite | Snapshots, lineage y cambios |
| Inteligencia | Strings de informe | Signals + insights con evidencia |
| Compliance | Flags por fuente | Firewall centralizado y política bloqueante |
| Proveedores externos | No abstraídos | Boundary explícito para Crawlee/Crawl4AI/Firecrawl/Playwright |
| Fallos | Algunos caminos silenciosos | Status de fuente, error estructurado y job visible |

## What we build ourselves

El moat no será el crawler. Será el **Source Graph + Entity Graph + Historical Data + Normalization + Signals + Niche Knowledge**. Para recruiting tech, esto significa medir qué empresas publican, qué skills demandan, cómo cambia la modalidad remota, qué bandas salariales aparecen y qué señales cruzadas permiten priorizar sourcing.

## Costs, limits and risks

El diseño local mantiene el coste bajo: SQLite, `httpx`, workers y DuckDB futuro. El salto a producción requiere PostgreSQL para OLTP, almacenamiento de snapshots en S3/MinIO, Temporal/Prefect para durabilidad y Prometheus/OpenTelemetry para observabilidad. El límite técnico principal sigue siendo el acceso permitido a fuentes y la estabilidad de sus APIs/DOMs. El riesgo legal no desaparece porque un sitio sea público: hay que revisar robots.txt, ToS, licencia de API, copyright, derechos sobre bases de datos, datos personales, GDPR y reutilización comercial por fuente.

## Pending work

Quedan pendientes, y no se declaran como implementados: un adapter Crawlee real ejecutado en producción, un adapter Crawl4AI real, integración externa Firecrawl, auto-reparación de selectores con revisión humana, query engine natural-language-to-SQL, alertas Telegram/email/webhook, API REST pública, DuckDB materializado, benchmark comparativo de CPU/RAM/coste y el red-team automatizado completo. Esas piezas requieren dependencias, decisiones de despliegue y pruebas de seguridad adicionales.

## CTO verdict

1. La mejor base técnica open source para adquisición general es Crawlee; para el MVP Python-first, `httpx` + Scrapy/Crawl4AI es más eficiente.
2. Firecrawl no debe incorporarse directamente al core propietario sin revisión AGPL; debe ser un proveedor externo opcional.
3. Debemos reutilizar conceptualmente queues, retries, datasets, storage, browser abstraction y structured extraction.
4. Debemos construir nosotros adapters, compliance, contratos, lineage, temporalidad, entity resolution, signals, insights y niche packs.
5. El moat verdadero es inteligencia histórica vertical, no número de URLs.
6. El coste incremental del MVP V2 es bajo; la producción requiere PostgreSQL, object storage, durable workflows y observabilidad.
7. El límite técnico es la cobertura permitida, la estabilidad de fuentes y la calidad de sus campos.
8. El riesgo legal exige evaluación fuente por fuente y no se resuelve con proxies o anti-blocking.
9. Queda pendiente completar providers externos, API, alertas y benchmark.
10. La mejora conseguida es arquitectónica y operacional: el sistema ahora puede cambiar de proveedor y producir resultados trazables sin reescribir la inteligencia.

## References

[1]: https://github.com/apify/crawlee "Crawlee repository"
[2]: https://github.com/firecrawl/firecrawl "Firecrawl repository"
[3]: https://docs.crawl4ai.com/ "Crawl4AI documentation"
[4]: https://scrapy.org/ "Scrapy"
[5]: https://playwright.dev/ "Playwright"
[6]: https://temporal.io/ "Temporal"
[7]: https://www.prefect.io/ "Prefect"
[8]: https://dagster.io/ "Dagster"
