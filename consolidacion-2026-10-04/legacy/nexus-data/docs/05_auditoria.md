# NEXUS DATA — Auditoría técnica y comercial profunda

**Fecha:** 19 de agosto de 2026  
**Versión auditada:** 0.2.0 endurecida  
**Resultado global:** prototipo ejecutable y saludable para demo controlada; todavía no es un SaaS multi-tenant listo para producción.

## Dictamen

El prototipo pasó la compuerta funcional: **2 tests**, compilación Python, Ruff, Bandit, `pip-audit`, arranque de Streamlit y healthcheck. Se añadió un instalador Linux que crea un entorno virtual, instala dependencias y genera comandos de ejecución y healthcheck.

La auditoría detectó una diferencia crítica entre “funciona” y “está listo para vender”: el primer prototipo mezclaba fixtures sintéticos con apariencia de datos reales, ocultaba errores de credenciales usando demo silencioso, no activaba realmente la capa LLM descrita, no registraba métricas completas por fuente y no migraba el esquema SQLite existente. Todo eso se corrigió o quedó explicitado como riesgo residual.

## Hallazgos y correcciones

| ID | Severidad | Hallazgo | Estado |
|---|---|---|---|
| A-01 | Crítica | El modo demo podía parecer dato vivo y usar países incorrectos derivados del nombre de la fuente | Corregido: títulos `[DEMO]`, `data_origin=synthetic_demo`, jurisdicción explícita y aviso en UI |
| A-02 | Crítica | Si faltaba una clave requerida, el extractor caía silenciosamente a fixtures | Corregido: en modo live falla de forma explícita y no inventa datos |
| A-03 | Alta | Rate limiter con bloqueo global durante `sleep`, retries sin rate limit y sin `Retry-After` | Corregido: lock por dominio, rate limit por fuente, espera tras 429 y backoff acotado |
| A-04 | Alta | SQLite existente no podía evolucionar al nuevo esquema | Corregido: migración automática de columnas `data_origin` y `run_id`, WAL habilitado |
| A-05 | Alta | No había control de coste para el LLM; las llamadas podían ocurrir fila por fila | Corregido: LLM desactivado por defecto, activación explícita y máximo configurable de filas |
| A-06 | Alta | La salida CLI volcaba el dataset completo | Corregido: CLI imprime informe y rutas, no filas completas |
| A-07 | Media | No había instalador ni healthcheck | Corregido: `install.sh`, `run_nexus.sh`, `healthcheck.sh`, Dockerfile y lock de dependencias |
| A-08 | Media | Panel dependía del directorio de trabajo y no gestionaba fallos | Corregido: rutas absolutas derivadas del proyecto, captura segura de errores y filtro por fuente |
| A-09 | Media | Lint y seguridad estática tenían deuda | Corregido: Ruff sin errores, Bandit sin hallazgos, `pip-audit` sin vulnerabilidades conocidas |
| A-10 | Media | Faltaba capa de inteligencia en el código | Corregido: módulo determinista + LLM opcional con JSON Schema estricto |

## Evidencia ejecutada

| Comprobación | Resultado |
|---|---:|
| Tests unitarios | 2 passed |
| Compilación | OK |
| Ruff | All checks passed |
| Bandit | Sin hallazgos |
| pip-audit | No known vulnerabilities found |
| Streamlit health endpoint | `ok` |
| Instalador | OK |
| Healthcheck instalado | `NEXUS DATA OK` |
| Demo | 9 registros, 3 fuentes configuradas, CSV/JSON/SQLite |

## Riesgos residuales que impiden llamarlo producción

**Conectores vivos:** los tres conectores están configurados, pero el demo reproducible usa fixtures sintéticos. Para producción se deben validar los endpoints, esquemas, claves, términos y límites de cada fuente en un entorno de integración. La API pública de SAM.gov requiere clave; TED documenta acceso anónimo a búsqueda de avisos publicados; Contracts Finder documenta JSON y métodos V2 [1] [2] [3].

**Cumplimiento:** el extractor API no consulta todavía `robots.txt` porque no hace crawling HTML en el demo. Si se añade una fuente HTML, debe existir un adaptador separado que compruebe `robots.txt`, registre versión de ToS, aplique allowlist de dominio y rechace fuentes prohibidas. No se deben añadir proxies residenciales, CAPTCHA solving ni evasión de bloqueos.

**Producto:** todavía falta autenticación, autorización por organización, aislamiento multi-tenant, cuotas, facturación, alertas, gestión de fuentes desde UI, auditoría de cambios y observabilidad externa. El prototipo es una aplicación local, no un servicio comercial desplegado.

**Datos:** la deduplicación actual es conservadora y no resuelve entidades cross-source. Antes de vender históricos se necesita identidad de comprador, normalización monetaria por jurisdicción, versiones de avisos, anexos y un sistema de calidad etiquetado.

**Inteligencia:** el fallback determinista es seguro pero limitado. El LLM solo se activa con `NEXUS_ENABLE_LLM=true`; debe añadirse caché por hash, presupuesto mensual, redacción de PII y evaluación de precisión con una muestra etiquetada por humanos.

## Prioridad de la siguiente iteración

La mejor siguiente inversión no es más scraping. Es un **vertical slice de producción**: una sola jurisdicción, un conector vivo validado, 20–50 usuarios piloto, feedback de relevancia, autenticación y alertas. Si el top-10 no ahorra horas y no genera acciones comerciales, ampliar fuentes solo aumentará coste y ruido.

## Referencias

[1]: https://open.gsa.gov/api/get-opportunities-public-api/ "SAM.gov Get Opportunities Public API"
[2]: https://docs.ted.europa.eu/api/latest/index.html "TED API developer documentation"
[3]: https://www.contractsfinder.service.gov.uk/apidocumentation/V2 "Contracts Finder API V2 documentation"
