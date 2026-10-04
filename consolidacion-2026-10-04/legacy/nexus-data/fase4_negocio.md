# NEXUS DATA — negocio, pricing, roadmap y riesgos

**Nota legal:** soy una IA, no un abogado; este análisis de trabajo no constituye asesoría legal formal. Un abogado cualificado debe revisar los términos de uso, licencias, privacidad y comercialización antes de vender datos o activar nuevas fuentes.

## 1. Propuesta de valor

NEXUS DATA no vende scraping. Vende una lectura vertical del mercado de empleo tecnológico remoto: cobertura de fuentes autorizadas, taxonomía consistente de skills y seniority, benchmarks comparables, señales de calidad y un informe accionable. El primer comprador es un equipo pequeño que actualmente cruza bolsas de empleo en hojas de cálculo y pierde tiempo deduplicando y clasificando.

La promesa medible del MVP es ahorrar al menos dos horas de análisis por ciclo de mercado y entregar una vista reproducible de demanda por skill, geografía, modalidad y nivel. El producto debe mostrar siempre la procedencia y separar observación (“aparecen 63 anuncios con Python”) de inferencia (“Python parece una skill recurrente”).

## 2. Pricing propuesto

| Plan | Precio mensual | Volumen orientativo | Funcionalidad | Cliente objetivo |
|---|---:|---:|---|---|
| **Free** | $0 | 3 fuentes, hasta 500 registros/mes, 1 informe | KPIs básicos, CSV/JSON, atribución visible, ejecución manual | Evaluación y estudiantes |
| **Scout** | $39 | Hasta 10.000 registros/mes | Históricos de 90 días, skills/seniority, alertas diarias, informes semanales | Recruiter independiente o startup pequeña |
| **Team** | $149 | Hasta 100.000 registros/mes | 10 usuarios, dashboards comparativos, API, histórico de 12 meses, exportaciones programadas | Agencia boutique, RPO o consultora |
| **Pro** | $499 | Hasta 500.000 registros/mes | Fuentes personalizadas autorizadas, SLA, workspace, controles de retención y auditoría | Equipo de recruiting mediano |
| **Enterprise** | A medida | Más de 500.000 o licencia propia | DPA, SSO, PostgreSQL dedicado, conectores oficiales y revisión de compliance | Empresa con procurement y legal interno |

El freemium no debe regalar redistribución de anuncios ni textos completos sin condiciones. Debe regalar **inteligencia agregada** y mantener los enlaces de origen. El cobro principal se basa en volumen de registros procesados y valor de funciones, no en peticiones brutas; el margen se protege con caché, deduplicación y analítica determinista.

## 3. Roadmap de 12 meses

| Meses | Hito | Criterio de salida |
|---|---|---|
| 1–2 | MVP técnico con tres APIs, SQLite, Streamlit, tests y cumplimiento | 90% de registros válidos, ejecución reproducible y evidencia de procedencia |
| 3 | Entrevistas con recruiters y prueba de valor | 10 entrevistas, 3 usuarios recurrentes, medición de tiempo ahorrado |
| 4 | Histórico y comparación temporal | Series diarias, cambios de skills y empresas, exportación estable |
| 5 | Enriquecimiento semántico y quality gates | Taxonomía revisable, score de confianza y revisión de fallos |
| 6 | Primer piloto de pago | 3 cuentas piloto, al menos 1 conversión Scout/Team |
| 7–8 | PostgreSQL, autenticación, workspaces y API | Multiusuario, backups, índices y límites por cuenta |
| 9 | Fuentes oficiales adicionales por licencia | Dos conectores nuevos con revisión de ToS/licencia |
| 10 | Alertas y benchmarks por región | Alertas útiles con baja tasa de falsos positivos |
| 11 | Hardening de seguridad y DPA | Retención, borrado, auditoría y revisión legal externa |
| 12 | Lanzamiento comercial limitado | MRR inicial, churn observado y decisión de ampliar o cambiar vertical |

## 4. Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación | Señal de alarma |
|---|---|---|---|---|
| Cambio de ToS o retirada de una API | Media | Alto | Conectores intercambiables, revisión mensual, no depender de una sola fuente y almacenar solo lo permitido | Error de acceso, aviso del proveedor o cambio de licencia |
| Redistribución no autorizada | Media | Alto | Producto de inteligencia agregada, enlaces de atribución, bloqueo de exportaciones restringidas y revisión legal | Usuario intenta publicar listados completos |
| GDPR/privacidad y datos identificables | Baja-media | Alto | No recolectar candidatos, minimizar texto, detección de emails/teléfonos, retención limitada y DPA | Aparece PII en descripción o solicitud de eliminación |
| Riesgo regulatorio de IA en recruiting | Media | Alto | No recomendar ni descartar candidatos; usar LLM para agregación y clasificación, con revisión humana y logs | Cliente quiere usar un score para decidir contratación |
| Calidad sesgada de fuentes | Alta | Medio-alto | Mostrar cobertura por fuente, frescura, duplicados y ausencia de salarios; no presentar anuncios como contrataciones | Cambios bruscos de una sola fuente |
| Coste o latencia del LLM | Media | Medio | Analítica determinista primero, `gpt-5-mini` solo en clasificación/resumen, caché y reintentos acotados | >10% del coste por registro o informes inestables |
| Fragilidad técnica | Media | Medio | Adaptadores por fuente, esquema canónico, tests con fixtures, observabilidad y migración PostgreSQL | Validación <90% durante dos ejecuciones |
| Mercado saturado de job boards | Media | Alto | Vender benchmark, no inventario; especializarse en skills y regiones; validar willingness-to-pay antes de ampliar | Usuarios piden solo otro agregador gratuito |
| Baja disposición a pagar | Media | Alto | Medir horas ahorradas y decisiones tomadas; pricing por equipo pequeño y piloto con éxito | Uso alto del Free pero cero conversiones |

La hipótesis más delicada es comercial: las APIs permiten construir el prototipo, pero no garantizan una licencia para revender un producto de datos. Por tanto, el MVP debe probar el valor de **analizar** datos con atribución, mientras se negocian licencias comerciales antes de escalar la redistribución.

## 5. Métricas de negocio

Durante el piloto se medirán tiempo hasta primer insight, horas ahorradas por informe, frecuencia de uso, porcentaje de informes abiertos, calidad percibida, conversiones Free→Scout/Team, coste por mil registros y porcentaje de fuentes activas. El indicador de producto principal será **horas de análisis manual evitadas por cuenta y mes**, no número de peticiones.
