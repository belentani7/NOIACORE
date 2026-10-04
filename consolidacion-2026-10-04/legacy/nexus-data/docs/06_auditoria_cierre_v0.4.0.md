# Auditoría de cierre — NEXUS DATA v0.4.0

**Autor:** Manus AI  
**Alcance:** código, datos, cumplimiento, inteligencia, distribución, seguridad y operabilidad.  
**Resultado:** el prototipo ha sido reforzado como un activo demostrable de inteligencia de contratación pública. No se presenta como un SaaS multi-tenant listo para producción.

## Dictamen ejecutivo

NEXUS DATA ahora cumple su promesa central de forma más honesta y útil: convierte tres APIs públicas en un conjunto de **oportunidades abiertas** y **adjudicaciones históricas**, conservando la diferencia entre ambas. El sistema normaliza la información, separa monedas, expone procedencia y produce un shortlist con razones explícitas. La ejecución no depende de scraping HTML, evita CAPTCHA y bloquea configuraciones que bajen de dos segundos por dominio.

| Área | Hallazgo inicial | Corrección aplicada | Evidencia |
|---|---|---|---|
| Acción comercial | Adjudicaciones y oportunidades podían aparecer en el mismo shortlist. | Se añadió `record_type`; solo oportunidades abiertas, válidas y no vencidas se priorizan para bid/no-bid. | Suite de pruebas y ejecución live. |
| Comparabilidad | La mediana de importes mezclaba divisas. | Se añadió `currency`; anomalías y medianas se calculan por moneda. | Prueba `test_currency_anomalies_do_not_mix_jurisdictions`. |
| Frescura | USAspending tenía fecha de cierre fija. | Ventana dinámica: últimos 365 días hasta la fecha actual. | Configuración `{{days_ago:365}}` y `{{today}}`. |
| Navegación | Los IDs de fuente se exportaban como si fueran URLs. | Plantillas `source_url_template` para cada conector. | Exportaciones CSV/JSON. |
| Cumplimiento | El intervalo de fuente podía configurarse por debajo de la política. | El extractor rechaza configuraciones inferiores a 2 s por dominio. | Prueba de cumplimiento. |
| Observabilidad | Las métricas no distinguían latencias por fuente. | Se añadieron estado, intentos, latencia, válidos, inválidos y duplicados por fuente. | Tabla `source_metrics` de SQLite. |
| LLM | Fallback silencioso, sin caché ni límite operativo claro. | LLM opt-in, máximo configurable, schema estricto, caché por contenido y error por fila. | `intelligence.py`; LLM desactivado por defecto. |
| Operabilidad | CLI limitado a una única ejecución. | Subcomandos `run`, `health`, `metrics`, selección de fuente y salida JSON. | CLI v0.4.0. |
| QA | Dos pruebas unitarias. | Doce pruebas sobre parsing, fechas, calidad, scoring, cumplimiento, demo y healthcheck. | `pytest -q`: 12 passed. |
| Publicación | Riesgo de subir datos locales, payloads o secretos. | `.gitignore`, `.env.example`, artefactos separados y repositorio privado. | Revisión de release. |

## Ejecución de aceptación

La prueba de aceptación se realizó contra **USAspending**, **Contracts Finder V2** y **City of Chicago Open Data** mediante sus interfaces públicas. La ejecución obtuvo respuesta HTTP 200 de las tres APIs y procesó 60 filas. De ellas, 10 fueron oportunidades abiertas y accionables de Contracts Finder; las adjudicaciones de USAspending y Chicago se conservaron para inteligencia de comprador, pero no se recomiendan como oportunidades de licitación.

| Fuente | Recibidos | Válidos | Inválidos | Tipo predominante | Resultado |
|---|---:|---:|---:|---|---|
| USAspending | 25 | 24 | 1 | Adjudicación | Inteligencia de gasto/comprador. |
| Contracts Finder V2 | 10 | 10 | 0 | Oportunidad abierta | Shortlist bid/no-bid. |
| Chicago Open Data | 25 | 14 | 11 | Adjudicación | Inteligencia de contrato/comprador. |

> El score no determina elegibilidad ni probabilidad de adjudicación. Solo ordena oportunidades con señales visibles: capacidad digital, plazo, importe, publicación y calidad de dato.

## Controles ejecutados

| Control | Resultado |
|---|---|
| Tests | 12 passed |
| Lint | Ruff: sin hallazgos |
| Compilación | `compileall`: correcta |
| Seguridad estática | Bandit: sin hallazgos |
| Dependencias | `pip-audit`: sin vulnerabilidades conocidas |
| Cumplimiento de límites | Test automatizado para bloqueo de <2 s/dominio |
| E2E | Tres fuentes públicas, exportación CSV/JSON, SQLite y healthcheck |
| Windows | Instalador `.exe` probado mediante instalación y desinstalación silenciosa bajo Wine; requiere validación visual final en Windows nativo. |

## Riesgos residuales y siguiente umbral

El producto no contiene autenticación, aislamiento multi-tenant, facturación, RBAC, una cola persistente ni monitorización remota. Tampoco existe una comprobación automatizada de cambios de términos de servicio, ni un contrato de integración versionado con cada fuente. Las fuentes de adjudicación aportan inteligencia de mercado, pero no deben comercializarse como ofertas abiertas.

El siguiente umbral de inversión debe ser una beta cerrada con 10–20 pymes. La evidencia que justificaría convertirlo en SaaS sería medir: tasa de relevancia del top-10, horas de vigilancia ahorradas, tiempo hasta decisión bid/no-bid y conversaciones comerciales iniciadas. Antes de una explotación comercial, debe añadirse PostgreSQL, autenticación, una política de retención, alertas de esquema, conectores de oportunidades en más jurisdicciones y validación legal de cada fuente.
