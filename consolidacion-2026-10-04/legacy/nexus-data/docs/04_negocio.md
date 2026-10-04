# NEXUS DATA — Negocio, pricing, roadmap y riesgos

## Pricing propuesto

| Plan | Precio mensual | Volumen | Incluye | Cliente objetivo |
|---|---:|---:|---|---|
| Free | 0 EUR | 3 fuentes, 250 avisos/mes | Dashboard, exportación, informe básico y fixtures/demo | Descubrimiento y usuarios individuales |
| Scout | 49 EUR | 10.000 avisos/mes | 10 fuentes, scoring, alertas diarias, histórico 30 días | Consultor o pyme pequeña |
| Growth | 199 EUR | 100.000 avisos/mes | 30 fuentes, histórico 12 meses, LLM, equipos y API | Equipo comercial o licitador especializado |
| Pro | 599 EUR | 500.000 avisos/mes | Conectores premium autorizados, SLA operativo, histórico 24 meses | Empresa multisector o integrador |
| Enterprise | Desde 1.500 EUR | A medida | VPC/SSO, jurisdicciones, soporte y contrato de datos | Grandes proveedores y partners |

El modelo evita competir por el coste marginal de una petición. El límite de volumen controla infraestructura, mientras que el precio captura el valor del shortlist, la trazabilidad y el histórico. La prueba de conversión debe medir tiempo ahorrado, oportunidades revisadas y porcentaje de avisos descartados correctamente.

## Roadmap de 12 meses

| Meses | Entrega | Criterio de salida |
|---|---|---|
| 1–2 | Prototipo con SAM/TED/Contracts Finder, esquema canónico, SQLite y dashboard | Tres fuentes reproducibles; informe en una ejecución |
| 3 | Scoring configurable por perfil de pyme y feedback humano | 70% de los top-10 considerados relevantes por usuarios piloto |
| 4 | Histórico, deduplicación cross-source y alertas | Menos de 5% de duplicados no resueltos en muestra etiquetada |
| 5–6 | Migración PostgreSQL, colas persistentes y observabilidad | Recuperación ante fallos y métricas por fuente |
| 7 | Taxonomía sectorial tech/profesional y matching semántico | Explicaciones trazables para cada score |
| 8–9 | Beta pagada con 10–20 pymes | Retención mensual y uso semanal observables |
| 10 | API de cliente y exportaciones a CRM | Integración con dos sistemas de ventas |
| 11 | Expansión de jurisdicción y catálogo de compradores | Cobertura validada en dos países adicionales |
| 12 | Paquetes Enterprise, controles de acceso y auditoría | SLA, DPA, historial de incidentes y pricing probado |

## Riesgos

### Legales y de cumplimiento

Las APIs oficiales reducen el riesgo, pero no lo eliminan: cada jurisdicción puede imponer términos de reutilización, licencias, atribución, límites o restricciones sobre datos personales. La respuesta es mantener un registro de fuente y ToS, versionar conectores, almacenar solo los campos necesarios, permitir eliminación, no inferir información sensible y no presentar el score como decisión jurídica. También existe riesgo de que un usuario use el producto para colusión o manipulación; deben existir controles de uso aceptable y auditoría.

### Técnicos

Los esquemas cambian, los avisos se corrigen y algunos endpoints requieren claves. La arquitectura mitiga esto con YAML, validación, fixtures, métricas por fuente, snapshots, reintentos limitados y pruebas de contrato. El LLM puede alucinar o clasificar mal; por ello el informe muestra evidencias, usa salida estructurada y nunca sustituye validación determinista. La migración a PostgreSQL debe hacerse cuando el histórico y la concurrencia superen SQLite.

### Mercado

Los incumbentes pueden añadir capas verticales y los portales pueden mejorar sus búsquedas. El foso no será el crawler: será el histórico normalizado, el feedback de relevancia, el grafo de compradores y la taxonomía por nicho. El mayor riesgo comercial es que una pyme no tenga capacidad real de licitar; el MVP debe vender primero vigilancia y priorización, no prometer adjudicaciones.

## Métricas de negocio

El norte del producto es **horas de investigación evitadas por oportunidad válida**. Las métricas secundarias son ratio de avisos con fuente y deadline, precisión del top-10, tiempo hasta shortlist, oportunidades guardadas, tasa de exportación y retención semanal. Se debe separar el rendimiento del conector —latencia, error, cobertura— del rendimiento de inteligencia —relevancia y utilidad percibida—.
