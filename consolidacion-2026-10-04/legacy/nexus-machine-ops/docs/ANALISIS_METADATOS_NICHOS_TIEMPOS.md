# Análisis de metadatos, nichos y tiempos del ecosistema Belentani

**Corte observado:** 28 de agosto de 2026, UTC.  
**Fuentes:** inventario de GitHub, inventario de Google Drive y lectura selectiva de README/artefactos.  
**Método:** análisis descriptivo de metadatos reales; las categorías temáticas son heurísticas y se solapan.

## Resumen ejecutivo

Lo más importante no es la cantidad de proyectos, sino la **velocidad de apertura de frentes**. El inventario muestra 75 repositorios de GitHub, de los cuales 74 recibieron un `push` durante los siete días anteriores al corte y 28 durante las últimas 24 horas. En Drive, los 100 elementos observados fueron modificados durante los siete días anteriores: 36 en las últimas 24 horas y 64 durante los seis días previos.

Esto indica una **fase de producción intensiva y compresión de ciclos**, no necesariamente una cartera de 75 productos maduros. La señal más probable es que se estén creando, probando, empaquetando, auditando y respaldando muchos experimentos en paralelo. Es una capacidad extraordinaria para prototipar; también es el principal riesgo operativo, porque la actividad temporal puede confundirse con tracción, mantenimiento o negocio.

Mi lectura es que el ecosistema tiene un centro latente: **herramientas de IA + creatividad digital + evidencia/auditoría + automatización de trabajo**. Música, educación, documentos, migración, ventas, diseño y simulación son verticales o casos de uso que pueden compartir ese núcleo. La prioridad no debería ser añadir más nichos, sino convertir esa combinación en un sistema de selección: qué se mantiene, qué se vende, qué se archiva, qué se protege y qué se integra.

## 1. Lo que dicen los metadatos

| Señal | Observación | Interpretación prudente |
|---|---:|---|
| Repositorios GitHub | 75 | Portafolio amplio; no equivale a 75 productos |
| Públicos / privados | 63 / 12 | Predominio de demostración pública, con un núcleo confidencial |
| Actividad GitHub 0–1 días | 28 | Pulso muy alto en el día del corte |
| Actividad GitHub 2–7 días | 46 | La casi totalidad del portafolio tuvo movimiento reciente |
| Actividad GitHub 8–30 días | 1 | No aparecen repositorios inactivos bajo el corte observado |
| Lenguaje principal | 30 TypeScript, 20 HTML, 15 Python, 3 JavaScript, 1 Shell, 1 PowerShell, 5 desconocidos | El centro técnico natural es web/servicios TypeScript, con automatización y análisis Python |
| Drive observado | 100 elementos | Es una ventana de 100 elementos, no todo el Drive |
| Carpetas Drive | 62 | Hay mucha organización, pero también riesgo de anidamiento y dispersión |
| ZIP en Drive | 19 | Hay un patrón fuerte de empaquetado, backup y entrega |
| Elementos Drive modificados 0–1 días | 36 | Actividad operacional inmediata |
| Elementos Drive modificados 2–7 días | 64 | Ciclo concentrado en una semana |

Hay un detalle técnico relevante: la primera extracción de GitHub presentó salida contaminada por formato ANSI y el primer procesamiento produjo campos nulos. Se corrigió con una extracción JSON limpia y se validó que los 75 repositorios tuvieran `updatedAt` y `pushedAt`. Esto es importante porque una propuesta basada en actividad temporal solo es válida después de validar la calidad de la extracción.

## 2. Nichos y concentración

Las señales temáticas de GitHub se distribuyen así. Como un repositorio puede aparecer en varias categorías, las cifras describen **presencia de señales**, no unidades de negocio independientes.

| Familia | Repositorios con señales | Qué parece unirlos |
|---|---:|---|
| IA, agentes y skills | 21 | Ruteo de modelos, prompts, skills, automatización y herramientas de desarrollo |
| DUCK, música y audio | 21 | Studio OS, producción, vocales, mastering, catálogo y comunidad |
| Tecnología creativa y medios | 20 | VFX, imagen, vídeo, arte, validadores y experiencias |
| Documentos, educación e inclusión | 12 | CV, plataformas educativas, migración, materiales y herramientas sociales |
| Negocio, ventas y operaciones | 11 | Revenue pipeline, CRM, operaciones y control de ecosistema |
| Evidencia, auditoría y seguridad | 9 | ProofMesh, evidence-ledger, validación, gates y protocolos |

La concentración no está en un sector final; está en una **capacidad transversal**: tomar una intención, convertirla en artefactos o workflows, verificarla y entregarla con control humano. Esa capacidad aparece tanto en Noiacore Revenue Pipeline como en OmniAgent, ProofMesh, Evidence Ledger, QBP Core, DUCK Studio y NEXUS Machine Ops.

En Drive, los nombres muestran una concentración diferente: paquetes de UAOL/Máquina Realm y evidencias asociadas, varias versiones de LATAM-Europa, material de DeudaFix, documentos profesionales y respaldos de control del ecosistema. En el corte observado hay aproximadamente 10 elementos con señales `UAOL/machine/realm`, 5 con `LATAM`, 3 con `DeudaFix`, 5 con `ecosystem/ecosistema` y 4 relacionados con documentos personales/profesionales. El número exacto depende de la convención de nombres; la señal cualitativa es robusta: se repiten familias, versiones y evidencias.

## 3. Qué dicen los tiempos

La cadencia muestra tres capas superpuestas.

### Pulso de construcción

El 98,7 % de los repositorios observados tuvo actividad durante los últimos siete días y el 37,3 % durante las últimas 24 horas. Esto sugiere una ráfaga de construcción o consolidación, no un mantenimiento rutinario distribuido a lo largo de meses.

### Pulso de empaquetado

Drive contiene 19 ZIP, checksums, snapshots y carpetas de ronda. El patrón de UAOL/Máquina Realm es especialmente claro: aparecen paquetes de fuente sanitizada, evidencias de auditoría y múltiples identificadores de ronda. Esto es bueno para reproducibilidad y control de versiones, pero puede convertirse en trabajo circular si cada nueva ronda produce otro paquete sin una decisión de destino.

### Pulso de decisión pendiente

La velocidad observada no revela por sí sola qué proyectos están validados por usuarios, cuál produce ingresos, cuál tiene mantenimiento sostenible o cuál debe archivarse. Falta una dimensión crítica en los metadatos actuales: `last_user_validation`, `revenue_signal`, `owner`, `next_decision`, `maintenance_cost` y `canonical_repository`.

Por eso, la lectura correcta es: **hay mucha energía y capacidad de ejecución; la tracción de mercado y la prioridad relativa todavía no están demostradas por estos metadatos**.

## 4. Duplicación, familias y canonicalización

Se aplicó un criterio reproducible de posible familia derivada: normalizar el nombre eliminando extensiones, hashes, etiquetas de versión, `final`, `source`, `audited`, `audit-evidence`, `sanitized-source`, `backup`, `snapshot` y rondas. El criterio identifica candidatos para revisión; no afirma que dos archivos o repositorios tengan contenido idéntico sin comparar hashes o diffs.

| Fuente | Total | Familias semánticas con más de un elemento | Elementos dentro de familias | Lectura |
|---|---:|---:|---:|---|
| GitHub | 75 | 0 por nombre normalizado | 0 | No hay duplicación nominal clara; sí puede haber derivados con nombres diferentes |
| Drive | 100 | 5 | 23 | Hay repetición material de snapshots, entregas, checksums y duplicados de documentos |

Las familias más fuertes de Drive son `uaol-machine-realm` con 9 archivos, `latam-europa` con 5, `sha256sums` con 5, `pedro-belentani-cv` con 2 y `youcut` con 2. Las familias `origin`, `remotes`, `heads`, `refs` y `logs` se excluyeron como falsos positivos estructurales de archivos exportados. Para los 19 ZIP observados se descargaron únicamente los bytes en modo lectura y se calcularon hashes SHA-256: hubo 17 hashes únicos y 4 archivos dentro de 2 grupos de duplicación exacta. Los pares exactos fueron dos copias de evidencia de `uaol-machine-realm` con hash `601889b19800…` y dos copias con hash `784f99809047…`; los restantes 15 ZIP fueron byte-distintos. Esto no prueba que las versiones distintas sean sustancialmente distintas, pero sí separa duplicación exacta de evolución de paquete. La conclusión operativa es que debe existir una `ArtifactFamily` con un `canonical_artifact_id`, relación de versiones, tipo de entrega, hash, estado y motivo de conservación. Así se preservan evidencias sin volver a tratar cada backup como un proyecto independiente.

El resultado sugiere una **capacidad de empaquetado y preservación alta**, pero también una deuda de decisión: hay que marcar una versión canónica, una versión publicada, una versión de evidencia y una versión archivada. En GitHub, la comparación conservadora por nombre y descripción no encontró pares con descripción idéntica ni pares con similitud Jaccard de tokens igual o superior a 0,5; esto evita afirmar derivación sin diff de código, pero no demuestra que no existan ramas conceptualmente relacionadas. La reducción de duplicación no significa borrar archivos automáticamente; significa mejorar el mapa de decisión y evitar rehacer el mismo trabajo.

## 5. La mayor oportunidad

El nicho más defendible no es “IA para todo” ni “un ecosistema creativo completo”. Es:

> **Sistemas verificables para convertir trabajo complejo en entregas, decisiones y automatizaciones controladas.**

Este posicionamiento engloba la mayor parte del portafolio sin fingir que todo es el mismo producto.

| Núcleo | Verticales que puede servir | Resultado vendible |
|---|---|---|
| Evidencia y control | Auditoría de software, documentación, IA y operaciones | Informe reconstruible y matriz de riesgos |
| Workflows y agentes | Pymes, profesionales, contenido y soporte | Workflow automatizado con aprobación humana |
| Producción de activos | Música, vídeo, imagen, documentos y educación | Paquete versionado, evaluado y listo para entregar |
| Registro de negocio | Revenue pipeline, CRM, propuestas y proyectos | Oportunidades y operaciones con previsión no garantizada |
| Enclaves privados | Documentos personales, legales, fiscales y profesionales | Expediente organizado sin mezclar datos sensibles |

## 5. Qué priorizar

### Prioridad 1: convertir el núcleo en herramienta interna

Antes de vender una plataforma universal, crear un catálogo canónico de proyectos, activos, evidencias, decisiones y workflows. Debe resolver diariamente cinco preguntas: qué está activo, qué se puede vender, qué necesita revisión, qué debe archivarse y qué contiene datos sensibles.

### Prioridad 2: un único wedge comercial

El candidato más fuerte es **auditoría y automatización verificable**. ProofMesh/evidence-ledger/QBP Core aportan control; OmniAgent aporta ruteo; Noiacore aporta una salida comercial concreta; los verticales DUCK, documentos, educación y simulación aportan demostraciones.

### Prioridad 3: tres demostraciones y no quince productos

Elegir solamente tres casos: una auditoría de software/IA, un workflow comercial y un workflow creativo o documental. Cada uno debe medir tiempo ahorrado, calidad, coste, revisión humana y resultado real.

### Prioridad 4: política de cierre

Cada nuevo repositorio debe nacer con una decisión: `core`, `vertical`, `lab`, `archive` o `asset`. Si no tiene dueño, usuario objetivo, siguiente decisión y fecha de revisión, no debe abrirse como producto.

## 6. Riesgos de interpretar mal los datos

La actividad de `push` es una señal de trabajo, no una señal de adopción. La modificación de un archivo de Drive es una señal de manipulación o empaquetado, no una señal de valor. Un README que diga “production-ready” es una afirmación del repositorio, no una verificación externa. La clasificación por palabras clave es útil para orientar, pero no sustituye la lectura del código, las pruebas, los usuarios y los resultados.

También debe evitarse confundir la ausencia de repositorios inactivos en esta ventana con salud perfecta. El resultado “0 inactivos en 90 días” significa que todos tienen un `push` dentro del periodo analizado; no significa que todos estén mantenidos, sean seguros, tengan usuarios o merezcan seguir activos.

## 7. Conclusión

Lo que observo es un **constructor de sistemas y productos**, no una persona con demasiados intereses inconexos. La constante es la transformación: idea a prototipo, prototipo a activo, activo a workflow, workflow a evidencia y evidencia a entrega. El problema es que el sistema de clasificación, decisión y cierre no creció al mismo ritmo que la capacidad de creación.

La propuesta más sólida es un **NEXUS de evidencia y operaciones**, con DUCK, IA, documentos, educación, ventas, simulación y creatividad como módulos. La meta no es encapsular toda la vida en una aplicación; es crear una capa de control que haga visible el portafolio, proteja los datos, reduzca duplicación, imponga decisiones y convierta los mejores activos en ofertas reales.

### Decisión recomendada

Durante los próximos 30 días, no añadir nuevos dominios. Canonizar proyectos existentes, medir tres workflows y elegir un único resultado comercial. Si ese núcleo demuestra reducción de trabajo, mejor calidad o ingresos reales, entonces la arquitectura merece ampliarse.

## Artefactos de soporte

- `GITHUB_INVENTORY.json`: 75 repositorios normalizados.
- `GITHUB_ACTIVITY_FULL.json`: criterio explícito de actividad e inactividad.
- `DRIVE_SUMMARY.json`: 100 elementos observados por tipo y recencia.
- `ECOSYSTEM_CLASSIFICATION.json`: clasificación heurística y repositorios de alta señal.
- `DUPLICATE_ANALYSIS.json`: familias candidatas, falsos positivos excluidos y criterio de canonicalización.
- `drive_hashes.json`: hashes SHA-256 de los 19 ZIP observados y los dos grupos de duplicación exacta.
- `github_derivation_analysis.json`: comparación conservadora de nombres y descripciones, sin afirmar equivalencia de código.
