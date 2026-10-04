# NEXUS DATA

Plataforma de automatización de datos para inteligencia de empleo tecnológico remoto en Europa y Latinoamérica. El núcleo consume APIs públicas autorizadas mediante jobs persistentes, workers concurrentes, rate limiting por dominio, retries, checkpoints y dead-letter queue; después normaliza vacantes, detecta skills y seniority, calcula métricas y genera inteligencia. Streamlit es únicamente una consola operativa secundaria.

## Inicio rápido

```bash
cd /home/ubuntu/nexus_data
sudo pip3 install -r requirements.txt
pytest -q
python3 run_validation.py
streamlit run app.py
```

Para usar el runtime de automatización masiva local, crea jobs persistentes desde Python con `PersistentJobStore`, ejecútalos con `WorkerPool` y escala `workers` según el número de dominios autorizados. En producción, el mismo contrato debe migrar a PostgreSQL/Redis o Temporal; no se debe aumentar la concurrencia dentro de un dominio por encima de sus límites.

El panel queda disponible en `http://localhost:8501`. La ejecución real validada el 19 de agosto de 2026 produjo 292 registros válidos: 17 Remotive, 175 Arbeitnow y 100 Jobicy, sin duplicados descartados. Los resultados cambian con el tiempo porque las APIs son vivas.

## Núcleo de automatización

`nexus_data/automation.py` contiene el runtime operativo: `PersistentJobStore` mantiene estados queued/running/completed/dead_letter; `WorkerPool` reclama jobs con transacción, ejecuta handlers concurrentes, aplica retries exponenciales, registra fallos y usa un limitador por dominio. Es una implementación local y testeable del patrón que en producción se sustituirá por Temporal + PostgreSQL/Redis, manteniendo los mismos contratos idempotentes.

## Estructura

| Ruta | Contenido |
|---|---|
| `sources.yaml` | Fuentes, endpoints, filtros, User-Agent, límites y atribución. |
| `nexus_data/extractor.py` | Extractor asíncrono, rate limiting, retries y adaptadores de payload. |
| `nexus_data/cleaning.py` | Limpieza HTML, skills, seniority, fechas y deduplicación. |
| `nexus_data/analysis.py` | KPIs, anomalías, insights e informe LLM opcional. |
| `nexus_data/pipeline.py` | Orquestación y persistencia SQLite. |
| `app.py` | Panel Streamlit y exportaciones. |
| `tests/test_core.py` | Tests unitarios del extractor y la limpieza. |
| `fase1_investigacion.md` | Investigación competitiva y selección de nicho. |
| `fase2_arquitectura.md` | Arquitectura, esquema, cumplimiento y migración. |
| `fase4_negocio.md` | Pricing, roadmap y riesgos. |
| `pitch_deck_content.md` | Contenido del pitch deck de 10 diapositivas. |
| `arquitectura.png` | Diagrama de arquitectura renderizado. |

## Cumplimiento

El prototipo solo usa los tres endpoints documentados. Envía un User-Agent identificable, espera al menos dos segundos por dominio y aplica un límite de una hora para Jobicy. No realiza bypass de CAPTCHA, evasión de bloqueos ni descubrimiento de URLs fuera de configuración. Remotive y Jobicy requieren atribución y tienen restricciones específicas contra la redistribución como agregador; por ello el MVP se presenta como análisis interno con procedencia visible.

Antes de cualquier uso comercial, un abogado debe revisar los términos de uso, licencias, privacidad, retención y el modo de distribuir resultados. El LLM opcional se usa para resumen/clasificación asistiva, no para tomar decisiones automatizadas sobre candidatos.

## LLM opcional

Si `OPENAI_API_KEY` y `OPENAI_API_BASE` están configurados, `analysis.py` usa `gpt-5-mini` con salida JSON estructurada para generar resumen ejecutivo y acciones. Si la clave no existe, el informe determinista sigue funcionando. Los textos enviados deben minimizar datos personales y la integración debe revisarse contra los términos de cada fuente.
