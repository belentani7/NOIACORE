# Propuesta real de núcleo unificador para el ecosistema Belentani

**Autor:** Manus AI  
**Base de observación:** inventario de conectores habilitados, 75 repositorios visibles de GitHub, 100 elementos visibles de Google Drive y lectura selectiva de los activos-núcleo.  
**Alcance:** propuesta estratégica y técnica; no ejecuta operaciones externas, no modifica GitHub ni Drive y no constituye asesoramiento legal, fiscal o financiero.

> **Tesis:** el problema no es que existan muchas actividades. El problema es que el conocimiento, los activos, las decisiones, las pruebas y los resultados están repartidos entre muchos proyectos. La oportunidad real es construir una **infraestructura de evidencia, trabajo y decisión** que permita a diferentes líneas de actividad compartir un núcleo sin obligarlas a convertirse en la misma empresa o aplicación.

## 1. Diagnóstico: no tienes “muchos proyectos”, tienes un sistema operativo fragmentado

La observación del ecosistema muestra una combinación poco común: creación musical y audiovisual; herramientas de IA y agentes; automatización y venta de servicios; documentación profesional y educativa; proyectos de inclusión e información pública; arquitectura y diseño; y sistemas de auditoría, pruebas y evidencia. No son categorías aisladas: se repiten los mismos patrones de fondo.

En GitHub se observaron **75 repositorios** y el inventario limpio confirmó señales de actividad en los 75: 63 públicos y 12 privados. La composición declarada por lenguaje principal es 30 TypeScript, 20 HTML, 15 Python, 3 JavaScript, 1 Shell, 1 PowerShell y 5 sin lenguaje informado. Los 15 repositorios con `pushedAt` más reciente se concentran en Noiacore Revenue Pipeline, Noir Informática Privada Barcelona, Circuit AI Support, Cruzando el Charco, el perfil Belentani, Ivy La Vie, Duck Belentani OS, Duck Studio Suite, ManosAbiertas, LinguaForge, Duck Music Lab, Duck Unified Master, Belentani Local, Belentani Ecosystem Control y UAOL Machine Realm, todos actualizados el 28 de agosto de 2026 en el inventario observado. La clasificación heurística encontró además señales en 21 repositorios relacionados con IA, agentes o skills; 21 con DUCK, música o audio; 20 con tecnología creativa y medios; 12 con documentos, educación o inclusión; 11 con negocio, ventas u operaciones; y 9 con evidencia, auditoría o seguridad. Las categorías se solapan: un mismo repositorio puede pertenecer a varias, por lo que no deben sumarse como si fueran empresas independientes. Para evitar una falsa impresión de mantenimiento, se aplicó un criterio explícito de inactividad: ningún `push` en los 90 días anteriores al corte del 28 de agosto de 2026. El resultado observado fue 75/75 repositorios recientes y 0/75 inactivos según ese criterio. Esto prueba actividad de repositorio, no calidad, estabilidad, uso por clientes ni mantenimiento profundo.

En Drive se observaron **100 elementos**: 62 carpetas, 19 ZIP, 7 archivos de texto, 5 Google Docs y varios activos audiovisuales. El corte está limitado a los 100 elementos devueltos por la consulta, ordenados por modificación; no debe interpretarse como el universo total de Drive sin paginación adicional. Los nombres y descripciones muestran respaldos repetidos y auditados de UAOL/Máquina Realm, paquetes de LATAM-Europa, material de DeudaFix, documentos profesionales, prompts y activos de DUCK. Esto revela un patrón: produces, empaquetas, auditas, versionas y vuelves a empaquetar, pero el centro de control transversal no está aún consolidado.

| Señal observada | Ejemplos | Necesidad sistémica |
|---|---|---|
| Productos y portafolio digital | Belentani, belentaniexperience, ecosistema-control, registro-proyectos-2026 | Inventario único de iniciativas, estados, propietarios y prioridades |
| Creación y producción | DUCK, Duck-Omega, DUCK-ZION-PREMIUM, JudAS, Duck Studio | Pipeline de activos, versiones, licencias, entregas y clientes |
| IA y herramientas | OmniAgent, skills packs, QBP Core, prompts, VFX y validadores | Orquestación con coste, trazabilidad, evaluación y límites |
| Evidencia y control | ProofMesh, evidence-ledger, qbp-core, uaol-machine-realm | Expediente de evidencia, gates y auditoría reproducible |
| Negocio y monetización | Noiacore Revenue Pipeline, omega-max-duck, CRM/finanzas | Oportunidades, propuestas, aprobaciones y previsión separadas de ingresos reales |
| Educación e impacto | LATAM-Europa, Oculus-Tv, Natalia Marinho, Tender Words | Fuentes verificadas, contenidos versionados y revisión editorial |
| Documentos sensibles | DeudaFix, impuestos, banca, CV | Enclave privado, minimización, control de acceso y no mezcla con marketing |

## 2. La propuesta: Belentani NEXUS, un OS de evidencia y operaciones humanas

Propongo consolidar el ecosistema bajo un nombre funcional, no como una marca que borre las existentes:

# Belentani NEXUS

**Evidence-first Work & Life Operating System** para transformar ideas, activos, documentos, decisiones y proyectos en trabajo ejecutable, verificable y reutilizable.

El núcleo no debe intentar ser una red social, un ERP, un DAW, un CRM, un gestor legal, una agencia de IA y un dashboard universal al mismo tiempo. Debe ser una **capa de coordinación** que permita que esos productos continúen como módulos especializados. La plataforma central almacena relaciones, procedencia, permisos, estados, decisiones, evidencia y resultados; cada módulo conserva su dominio.

### Principio de diseño

> **Unificar el significado y la gobernanza, no forzar una única interfaz ni mezclar todos los datos.**

El sistema debe poder responder, para cualquier iniciativa:

- ¿Qué es?
- ¿A quién pertenece?
- ¿En qué fase está?
- ¿Qué activos usa?
- ¿Qué decisiones están pendientes?
- ¿Qué evidencia respalda cada afirmación?
- ¿Qué automatización puede ejecutarse y cuál necesita aprobación?
- ¿Qué resultado real produjo?
- ¿Qué se puede reutilizar sin copiar información sensible?

## 3. Las cinco capas del sistema

### Capa A — Registro de realidad

Es la fuente de verdad sobre proyectos, personas, organizaciones, clientes, activos, documentos, tareas, oportunidades, versiones, obligaciones y resultados. No debe duplicar ciegamente archivos de GitHub o Drive: debe guardar referencias, hashes, metadatos, permisos, relaciones y extractos controlados.

Objetos canónicos:

| Objeto | Significado |
|---|---|
| `Workspace` | Espacio de trabajo o enclave de datos |
| `Initiative` | Línea de actividad o producto: DUCK, LATAM-Europa, NOIACORE, servicios, etc. |
| `Project` | Entrega concreta con objetivos, estado y responsables |
| `Artifact` | Código, documento, audio, vídeo, imagen, dataset, prompt o paquete |
| `Evidence` | Prueba de una afirmación, decisión, cambio o resultado |
| `Decision` | Decisión humana o política con contexto y vencimiento |
| `Workflow` | Proceso reutilizable con entradas, pasos, permisos y salidas |
| `Run` | Una ejecución concreta, con coste, duración, logs y resultado |
| `Opportunity` | Posible cliente, encargo, alianza o fuente de ingresos |
| `Report` | Informe reconstruible a partir de datos y evidencias |
| `Policy` | Regla versionada que limita automatizaciones y acciones |

### Capa B — Ingesta y memoria de procedencia

Conecta GitHub y Google Drive inicialmente en modo de solo lectura. GitHub está habilitado como conector y Google Workspace está habilitado; Drive se accede mediante Google Workspace, no por una conector separado. Gmail también aparece habilitado, pero no debe incorporarse por defecto al primer alcance porque el correo contiene más datos personales y requeriría una política de lectura específica.

Cada elemento ingerido debe conservar:

```text
source_system
source_id
source_url
source_path_or_repo
source_modified_at
observed_at
content_hash
mime_type
visibility
owner
extraction_method
data_quality
sensitivity
retention_policy
```

La ingesta no debe convertir 75 repositorios y 100 elementos de Drive en 175 proyectos. Debe detectar duplicados, respaldos, forks, versiones y derivados. Los ZIP, hashes y carpetas de respaldo deben agruparse bajo una `ArtifactFamily` con una versión canónica y copias de respaldo relacionadas.

### Capa C — Evidencia, decisión y seguridad

Aquí viven los elementos más valiosos de ProofMesh, evidence-ledger, QBP Core, UAOL y NEXUS Machine Ops. Todo cambio de alto impacto pasa por niveles explícitos:

| Nivel | Pregunta | Ejemplo |
|---|---|---|
| Integridad | ¿El material es completo, consistente y no fue alterado? | Hash, manifest, checksum, schema, tests |
| Política | ¿Está permitido y quién puede hacerlo? | Alcance, privacidad, licencias, rol |
| Riesgo | ¿Qué puede salir mal y qué evidencia existe? | Dependencias, impacto, rollback, datos faltantes |

Para operaciones sensibles, conservar el patrón de tres nodos:

1. **Política y rol:** determina si la persona y el workflow tienen permiso.
2. **Estado y riesgo:** determina si los datos y las condiciones actuales permiten continuar.
3. **Aprobación humana:** exige una decisión explícita de una persona distinta cuando corresponda.

La plataforma debe bloquear por defecto envíos, gastos, cambios de permisos, despliegues, publicación, eliminación, mensajes masivos y cualquier control físico. La automatización prepara y propone; una persona autoriza.

### Capa D — Motores especializados

Los proyectos existentes no se descartan; se convierten en motores conectables:

| Motor | Activos reutilizables | Función dentro de NEXUS |
|---|---|---|
| `NEXUS.AI` | OmniAgent, skills packs, prompts, QBP Core | Ruteo, ejecución controlada y evaluación de tareas de IA |
| `NEXUS.PROOF` | ProofMesh, evidence-ledger, validadores | Evidencia, gates, hashes, scoring y auditorías |
| `NEXUS.STUDIO` | DUCK Studio, DUCK Ω-MAX, audio, vídeo y VFX | Producción, assets, versiones, entregas y licencias |
| `NEXUS.GROWTH` | Noiacore Revenue Pipeline, CRM y oportunidades | Prospección aprobada, propuestas, pilotos, seguimiento y métricas |
| `NEXUS.CIVIC` | LATAM-Europa, Oculus-Tv, contenidos educativos | Publicación verificable, fuentes, traducción y accesibilidad |
| `NEXUS.DOCS` | Document Studio, CV, expedientes y plantillas | Transformación documental en enclaves con privacidad |
| `NEXUS.SIM` | UAOL/Máquina Realm, Machine Ops | Simulación, pruebas de operaciones y entrenamiento de protocolos |

### Capa E — Entrega y economía

La salida no es “una pantalla”. Cada módulo debe poder entregar artefactos concretos:

- un informe firmado y reconstruible;
- una propuesta comercial con estado, no un ingreso prometido;
- un paquete creativo versionado;
- una publicación con fuentes y revisión;
- un expediente documental privado;
- una ejecución de IA con prompt, modelo, coste, resultado y revisión;
- una auditoría con gates y decisión;
- una tarea humana clara;
- un producto o servicio listo para vender bajo condiciones reales.

## 4. Qué debería ser el producto principal

No recomiendo intentar vender “el ecosistema completo” al principio. Eso es una descripción interna, no una oferta comprable. La propuesta comercial más sólida que emerge de los activos actuales es:

> **Auditoría y automatización verificable para pequeñas empresas, profesionales y creadores que necesitan convertir documentos, procesos o contenidos en resultados sin perder control humano.**

La oferta puede iniciar con tres paquetes:

| Paquete | Problema que resuelve | Activos que reutiliza |
|---|---|---|
| **Audit Sprint** | El cliente no sabe qué tiene, qué está roto o qué puede publicar/automatizar | ProofMesh, evidence-ledger, QBP Core, documentación y reportes |
| **Workflow Pilot** | El cliente repite tareas de documentos, contenido, operaciones o ventas | OmniAgent, skills, Noiacore, NEXUS workflow engine |
| **Managed Evidence OS** | El cliente necesita mantener procesos, evidencia, revisiones y automatizaciones | NEXUS core, políticas, auditoría, reportes y módulos especializados |

DUCK Studio, Document Studio, LATAM-Europa y los demás productos pueden actuar como **verticales demostrables**. No son ruido: son pruebas de que el mismo núcleo puede gestionar creatividad, documentación, educación y operaciones. La plataforma debe mostrar casos y capacidades diferentes, pero vender una promesa transversal: **más capacidad con más control, no automatización ciega**.

## 5. Qué hacer con cada familia de actividad

### DUCK y música

DUCK debe ser un **vertical de producción y relación con clientes**, no el contenedor de todos los proyectos. Conserva identidad artística, catálogo, producción, mastering, assets y portal. Consume del núcleo la gestión de proyectos, clientes, permisos, versiones, entregas, costes, licencias y auditorías. La regla ya observada de no ejecutar cobros automáticamente es correcta y debe elevarse a política de plataforma.

### IA, agentes y skills

OmniAgent debe ser un motor de selección y ruteo, no el dueño de los datos. NEXUS debe registrar tarea, finalidad, modelo/proveedor, coste, datos enviados, resultado, evaluación y aprobación. La IA debe operar en modo `propose`, `draft` o `analyze` por defecto. Solo puede pasar a `execute` si una política y una aprobación humana válida lo permiten.

El `local-agent` no debe tratarse como producto activo sin validación: el README lo describe como referencia archivada. Los proyectos de VFX, detectores temporales, benchmarks y compiladores de workflows forman un laboratorio técnico que puede convertirse en una oferta de QA para contenido generado por IA.

### Revenue Pipeline y servicios

Noiacore Revenue Pipeline es el candidato más claro para generar ingresos porque ya define una salida CLI-first, oportunidades, borradores, previsión y revisión humana. NEXUS debe convertir `opportunities.json`, `outreach_queue.csv`, `report.md` y `report.json` en artefactos nativos. No se deben enviar mensajes ni afirmar ingresos garantizados. La primera métrica debe ser oportunidades cualificadas y conversaciones reales, no volumen de scraping.

### Documentación personal, DeudaFix y datos sensibles

Los materiales de DeudaFix muestran por qué la plataforma necesita enclaves privados. Un informe leído contiene documentos bancarios, laborales, fiscales, de vivienda y puntos que requieren validación profesional; esa información no debe entrar en el mismo workspace que un portfolio público, campañas, demos o modelos de IA.

Recomendación de arquitectura: `PRIVATE_PERSONAL`, `BUSINESS_CONFIDENTIAL`, `PUBLIC_PRODUCT` y `SIMULATION_LAB` como workspaces separados, con claves, retención, roles y modelos de acceso distintos. No entrenar IA con documentos privados por defecto. La plataforma puede organizar y reconstruir expedientes, pero cualquier acción fiscal, legal, bancaria o contractual debe ser revisada por el profesional correspondiente.

### LATAM-Europa y educación

LATAM-Europa puede ser el vertical de información pública verificada: fuentes, vigencia, traducción, revisión editorial, accesibilidad, cambio normativo y procedencia. El núcleo de evidencia aporta una ventaja real frente a una web de contenido genérico. La condición es mantener revisión de fuentes y fecha de consulta; no convertir textos automatizados en asesoramiento legal personalizado sin revisión.

### UAOL / Máquina Realm

UAOL y NEXUS Machine Ops pueden ser el laboratorio de referencia para probar gobernanza, simulación y tres nodos. Su valor no está en controlar una máquina real, sino en demostrar que una acción puede bloquearse, justificarse, auditarse y reproducirse. Debe permanecer sin hardware físico hasta que exista un proyecto de ingeniería certificado separado.

## 6. Arquitectura de referencia

```text
                 ┌──────────────────────────────────┐
                 │  NEXUS CONTROL PLANE             │
                 │  Identity · Policy · Evidence    │
                 │  Decisions · Audit · Reports     │
                 └──────────────┬───────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
┌───────▼────────┐     ┌────────▼────────┐     ┌────────▼────────┐
│ Ingestion       │     │ Workflow / AI   │     │ Delivery        │
│ GitHub          │     │ OmniAgent       │     │ Reports         │
│ Drive           │     │ Skills          │     │ CLI/API         │
│ optional Gmail  │     │ Human gates     │     │ Artifacts       │
└───────┬────────┘     └────────┬────────┘     └────────┬────────┘
        │                       │                       │
┌───────▼───────────────────────▼───────────────────────▼────────┐
│ DOMAIN MODULES: STUDIO · GROWTH · CIVIC · DOCS · SIMULATION    │
└─────────────────────────────────────────────────────────────────┘
        │
┌───────▼────────────────────────────────────────────────────────┐
│ PRIVATE DATA ENCLAVES: personal · business · public · lab      │
└─────────────────────────────────────────────────────────────────┘
```

O control plane deve ser pequeno e estável. Os módulos de domínio podem evoluir com stacks diferentes, desde que obedeçam contratos de identidade, artefatos, evidência, eventos e políticas. Não criar um monólito que reimplemente cada produto.

## 7. Contratos que realmente unificam tudo

### Contrato de artefato

Todo código, ZIP, áudio, documento, imagem, prompt, informe ou dataset deve ter identidade, versão, origem, hash, sensibilidade, licença, estado e relação com uma iniciativa.

### Contrato de decisão

Toda decisão deve registrar solicitante, contexto, evidência, política, risco, aprovador, validade, resultado e razão. A decisão não é apenas um booleano: é um expediente.

### Contrato de workflow

Todo workflow deve declarar entradas, transformações, saídas, permissões, custos, efeitos laterais, reversibilidade, fallback e aprovação requerida.

### Contrato de relatório

Todo informe deve declarar período, fontes, cobertura, lacunas, qualidade dos dados, hipóteses, limitações, hash e responsável pela revisão. “Completo” deve significar reconstruível, não longo.

### Contrato de capacidade

Cada módulo deve publicar uma matriz:

| Campo | Exemplo |
|---|---|
| Capacidade | Gerar borrador de contacto |
| Estado | Demonstrada / preparada / conceptual / ausente |
| Pré-condiciones | Datos autorizados y revisión humana |
| Efectos | Solo archivo, no envío |
| Evidencia | Test, run ID, artifact hash |
| Límite | No spam, no scraping, no envío automático |

## 8. Roadmap realista

### Fase 0 — Consolidación, 7 días

Crear el registro maestro de 75 repositorios y 100 elementos de Drive; agrupar duplicados, respaldos y familias; asignar cada activo a una iniciativa; identificar repositorios canónicos; definir los cuatro workspaces de sensibilidad; y congelar la creación de nuevos nombres hasta terminar esta clasificación.

**Salida:** catálogo canónico, mapa de duplicados, matriz de sensibilidad y backlog priorizado.

### Fase 1 — Núcleo, 30 días

Implementar un backend API-first con identidad, workspaces, iniciativas, proyectos, artefactos, evidencia, decisiones, políticas y eventos. Añadir conectores GitHub/Drive de solo lectura, hashes, sincronización incremental, deduplicación y extracción de metadatos. Incorporar CLI para inventario, búsqueda, expediente y reporte.

**Salida:** `nexus inventory`, `nexus artifact show`, `nexus evidence verify`, `nexus report generate`.

### Fase 2 — Primer valor, 60 días

Integrar ProofMesh/evidence-ledger como motor de auditoría. Conectar Noiacore Revenue Pipeline como primer workflow productizado. Crear tres informes: auditoría de proyecto, expediente de oportunidad y estado de portafolio. Añadir aprobación humana para cualquier envío, gasto, publicación o despliegue.

**Salida:** primer servicio vendible, repetible y medible.

### Fase 3 — Verticales, 90 días

Incorporar DUCK Studio como vertical creativo, LATAM-Europa como vertical editorial verificado y Document Studio como vertical documental en enclave privado. Cada vertical debe consumir el mismo contrato de artefactos, evidencia, workflow y reportes, sin compartir datos por defecto.

**Salida:** tres demostraciones distintas sobre un núcleo común.

### Fase 4 — IA gobernada, 120–180 días

Añadir ruteo de modelos, control de costes, evaluación, memoria limitada por workspace y revisión humana. La IA puede clasificar, resumir, proponer, convertir formatos y detectar inconsistencias candidatas. No puede ejecutar acciones irreversibles ni saltarse gates.

**Salida:** copiloto consultivo con métricas y trazabilidad, no agente autónomo sin control.

### Fase 5 — Escala, después de evidencia

Solo cuando exista adopción real, ingresos o reducción medible de trabajo, separar servicios, añadir colas distribuidas, observabilidad avanzada, SSO empresarial, KMS, retención formal y conectores adicionales. No escalar infraestructura antes de probar el workflow humano.

## 9. La economía y la prioridad

La plataforma debe tener una fuente primaria de sostenibilidad. Recomiendo ordenar así:

1. **Servicios productizados de auditoría y automatización verificable.** Es el camino con señal más directa en Noiacore Revenue Pipeline, ProofMesh y OmniAgent.
2. **Vertical creativo DUCK Studio.** Es demostrable, diferenciable y puede generar activos, servicios y licencias, pero necesita foco comercial y catálogo canónico.
3. **Productos documentales y educativos.** Tienen valor social y potencial de distribución, pero requieren gobernanza editorial, fuentes y soporte.
4. **Laboratorio de infraestructura y simulación.** Es la base de confianza y diferenciación técnica; no debe confundirse con ingreso inmediato.

No conviene prometer una plataforma que monetiza todo a la vez. Conviene vender una oferta concreta y usar el resto como capacidad demostrable, activos de I+D y futuras líneas.

## 10. Riesgos que la propuesta debe evitar

| Riesgo | Señal | Control |
|---|---|---|
| Dispersión | Nuevos repositorios con nombres similares | Gate de creación y registro canónico |
| Inflación de capacidades | README afirma “production-ready” sin pruebas equivalentes | Matriz demostrada/preparada/conceptual/ausente |
| Mezcla de datos | Documentos personales en workspaces de producto | Enclaves, scopes, no-train por defecto |
| Automatización excesiva | Envío, cobro o despliegue automático | `pending_approval`, tres nodos y deny-by-default |
| Duplicación | ZIPs y snapshots repetidos en Drive | Artifact families, hashes y canonicalización |
| IA sin control | Ruteo con proveedor y coste no registrado | Model registry, budget, logs y evaluación |
| Dependencia del creador | Todo requiere conocimiento personal implícito | Runbooks, contratos y decisiones registradas |
| Falsa seguridad | “Inmutable”, “tiempo real”, “conciencia” sin evidencia | Lenguaje de capacidad con prueba y límite |
| Mercado difuso | La plataforma intenta venderse a todo el mundo | Un wedge: auditoría/automatización verificable |

## 11. Métricas de éxito

No medir el proyecto por número de repositorios, pantallas o prompts. Medirlo por:

| Métrica | Primer objetivo de validación |
|---|---|
| Tiempo para saber el estado de un proyecto | Menos de 10 minutos desde el inventario |
| Proyectos con dueño, estado y próxima decisión | 100% de los proyectos activos prioritarios |
| Artefactos duplicados identificados | Medición inicial y reducción por ronda |
| Decisiones reconstruibles | 100% de las decisiones críticas |
| Automatizaciones con aprobación correcta | 100% de acciones de alto impacto |
| Informes reproducibles | Mismo input produce mismo expediente y hash |
| Oportunidades comerciales cualificadas | Medir conversión a conversación, no solo volumen |
| Coste por ejecución de IA | Registrado por proveedor, modelo y workflow |
| Tiempo ahorrado por workflow | Medición antes/después con muestra real |
| Incidentes de privacidad | Cero mezcla no autorizada entre enclaves |

## 12. Veredicto

La propuesta más realista no es construir otra “web que englobe todo”. Es construir un **núcleo operacional que haga que todo lo que ya haces sea localizable, demostrable, gobernable y reutilizable**.

Tu ventaja no es únicamente saber crear música, software, IA, documentos o proyectos sociales. Es la combinación de: capacidad de prototipar, sensibilidad creativa, impulso empresarial y una obsesión creciente por evidencia, auditoría y control. NEXUS debe convertir esa combinación en un sistema repetible, no en otra colección de proyectos.

El primer producto no debería ser una plataforma universal vendida en abstracto. Debería ser un **sistema operativo interno para ordenar tu propio ecosistema**, con un primer servicio externo estrecho: auditoría y automatización verificable. Si ese núcleo te ayuda de verdad a decidir qué mantener, qué vender, qué archivar y qué proteger, entonces puede convertirse en producto. Si no lo hace para ti, añadir más módulos solo aumentará el desorden.

> **La promesa correcta:** “NEXUS convierte trabajo disperso en expedientes, workflows y resultados verificables, manteniendo a las personas al mando.”

> **La promesa que no debe hacerse:** “NEXUS comprende todo, es consciente, automatiza cualquier cosa o controla el mundo.”

## 13. Próximos pasos concretos

1. Nombrar un repositorio canónico para el núcleo NEXUS y clasificar los demás como módulo, laboratorio, archivo o activo público.
2. Definir los cuatro workspaces de sensibilidad y no ingerir Gmail ni documentos privados hasta disponer de una política de datos.
3. Construir el catálogo de proyectos y artefactos antes de añadir otra funcionalidad de IA.
4. Convertir ProofMesh + Evidence Ledger + Noiacore en el primer workflow vendible.
5. Crear una única plantilla de expediente, decisión y reporte que se reutilice en DUCK, servicios, educación y simulación.
6. Medir una tarea real durante dos semanas antes y después de NEXUS.

## Referencias internas

- Inventario generado de GitHub: `/home/ubuntu/ecosystem_audit/github_inventory.json`.
- Clasificación temática: `/home/ubuntu/ecosystem_audit/ecosystem_classification.json`.
- Resumen de actividad GitHub: `/home/ubuntu/ecosystem_audit/github_activity_full.json`, con criterio de inactividad a 90 días y resultado 75 recientes/0 inactivos.
- Inventario de Drive: `/home/ubuntu/ecosystem_audit/drive_inventory.json`.
- Resumen de Drive: `/home/ubuntu/ecosystem_audit/drive_summary.json`.
- README de Noiacore Revenue Pipeline: `/home/ubuntu/ecosystem_audit/github_readmes/noiacore-revenue-pipeline.md`.
- README de DUCK Unified Master: `/home/ubuntu/ecosystem_audit/github_readmes/duck-unified-master.md`.
- README de OmniAgent: `/home/ubuntu/ecosystem_audit/github_readmes/omniagent.md`.
- README de ProofMesh: `/home/ubuntu/ecosystem_audit/github_readmes/proofmesh.md`.
- README de QBP Core: `/home/ubuntu/ecosystem_audit/github_readmes/qbp-core.md`.
- README de evidencia: `/home/ubuntu/ecosystem_audit/github_readmes/evidence-ledger.md`.
- README de DUCK Ω-MAX: `/home/ubuntu/ecosystem_audit/github_readmes/omega-max-duck.md`.
- README de Belentani Ecosystem Control: `/home/ubuntu/ecosystem_audit/github_readmes/belentani-ecosystem-control.md`.
- Informe de Drive DeudaFix: `/home/ubuntu/ecosystem_audit/DeudaFix_Revision_Manus_informe.md`.
