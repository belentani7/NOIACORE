# Dirección estratégica unificadora de Belentani NEXUS

## La dirección en una frase

> **Belentani NEXUS es una infraestructura personal y profesional de producción verificable: convierte ideas, conocimiento, activos creativos y oportunidades de negocio en entregas trazables, automatizaciones gobernadas y decisiones con evidencia.**

Esta dirección no intenta convertir música, IA, documentos, migración, software, ventas, educación y simulación en un solo producto superficial. Los reúne alrededor de una capacidad compartida: **capturar una intención, organizar el contexto, producir un resultado, verificarlo, obtener aprobación humana y convertirlo en un activo reutilizable**.

## Qué es y qué no es

NEXUS debe ser una **capa operativa** por encima del portafolio, no un cajón donde todo se mezcla. Su unidad básica no es el repositorio ni el archivo: es el **trabajo verificable**. Un trabajo tiene objetivo, propietario, contexto, entradas, pasos, artefactos, decisiones, evidencias, riesgos, estado y resultado.

NEXUS no debe prometer autonomía general, inteligencia omnisciente ni una aplicación que sustituya todos los oficios. Tampoco debe mezclar automáticamente documentos personales, expedientes sensibles, creatividad, clientes y operaciones financieras. La integración correcta es por contratos, permisos y referencias; no por exposición indiscriminada de datos.

## El modelo: una columna vertebral y cinco dominios

| Capa | Función | Capacidades que reúne |
|---|---|---|
| **NEXUS Core** | Identidad, proyectos, tareas, activos, estados, decisiones, permisos, trazas y búsqueda | Registro canónico, versionado, clasificación y control de acceso |
| **Evidence & Trust** | Evidencia, auditoría, validación, hashes, aprobaciones y explicación de decisiones | ProofMesh, evidence-ledger, QBP Core, NEXUS Machine Ops |
| **Agent & Workflow Runtime** | Orquestación de agentes, herramientas, prompts, colas, límites, costes y revisiones humanas | OmniAgent, skills, ruteo de modelos, automatización y gateways |
| **Creative Production** | Producción de música, audio, imagen, vídeo, diseño y paquetes entregables | DUCK Studio, Duck Music Lab, recursos visuales, artefactos y presets |
| **Knowledge & Impact** | Documentos, educación, inclusión, migración, expedientes y comunicación | CV, materiales formativos, LATAM-Europa, Cruzando el Charco, ManosAbiertas |
| **Commercial Operations** | Propuestas, ventas, CRM, operaciones y entregas a clientes | Noiacore Revenue Pipeline, ofertas, seguimiento y métricas comerciales |

Los cinco dominios son **productos o módulos verticales**. NEXUS Core, Evidence & Trust y Agent & Workflow Runtime son la plataforma común. La creatividad, el conocimiento/impacto y lo comercial son las primeras superficies de valor.

## La capacidad transversal real

NEXUS debe desarrollar diez capacidades comunes, porque aparecen repetidamente en los repositorios y documentos observados:

| Capacidad | Entrada | Salida comprobable |
|---|---|---|
| Captura | Idea, petición, documento, audio o señal de negocio | Registro con origen, propietario y sensibilidad |
| Contextualización | Fuentes autorizadas y memoria del trabajo | Contexto versionado y acotado |
| Planificación | Objetivo y restricciones | Plan, dependencias, presupuesto y criterio de terminado |
| Producción | Código, texto, audio, imagen, vídeo o propuesta | Artefacto versionado |
| Evaluación | Reglas, tests, checklist o revisión humana | Resultado, puntuación o decisión explicada |
| Aprobación | Persona o quorum con rol válido | Autorización separada de quien produjo |
| Entrega | Artefacto aprobado y canal de destino | Paquete reproducible con manifest y hash |
| Aprendizaje | Fallo, feedback, rechazo o resultado | Mejora de política, plantilla o workflow |
| Comercialización | Problema de cliente y evidencia de capacidad | Oferta delimitada, precio por validar y caso demostrable |
| Gobierno | Permisos, retención y límites | Registro auditable y revocable |

El activo principal no es “la IA”. Es la combinación de **workflow + evidencia + activo reutilizable + resultado**. La IA es una capacidad intercambiable dentro de ese circuito.

## Arquitectura recomendada

La arquitectura debe ser modular y API-first, pero no debe comenzar como una plataforma distribuida innecesariamente compleja.

```text
Fuentes autorizadas
 GitHub · Drive · Gmail · entradas manuales · archivos creativos
          │
          ▼
NEXUS Ingest / Catalog
 origen · permisos · sensibilidad · hash · canonicalización
          │
          ▼
NEXUS Work Graph
 proyectos · trabajos · tareas · activos · decisiones · evidencias
          │
     ┌────┼─────────────┬──────────────┐
     ▼    ▼             ▼              ▼
Evidence Agent/Workflow Creative       Commercial
Trust    Runtime        Production     Operations
     └────┴─────────────┴──────────────┘
          │
          ▼
Human Review / Policy Gates / Audit Ledger
          │
          ▼
Entregas versionadas · informes · métricas · aprendizaje
```

La primera implementación puede permanecer como un **monolito modular con workers internos**, PostgreSQL, almacenamiento de objetos y una cola durable. Debe exponer contratos estables para que los módulos puedan separarse después. No conviene empezar con microservicios, blockchain, agentes autónomos o una capa de datos totalizante antes de probar tres workflows.

## Qué debe ser producto y qué debe permanecer separado

| Tratamiento | Activos o líneas | Razón |
|---|---|---|
| Plataforma común | NEXUS Core, Evidence & Trust, Agent/Workflow Runtime | Son capacidades reutilizables y diferencian el sistema |
| Primer producto vendible | Auditoría y automatización verificable para equipos pequeños | Combina evidencia, IA, documentación y operación con un problema claro |
| Segundo producto | Sistema de producción de entregables creativos versionados | Usa DUCK, audio, visuales y revisión sin obligar a compartir toda la plataforma |
| Tercer producto | Expedientes y workflows documentales protegidos | Aprovecha CV, educación, migración y documentos con aislamiento fuerte |
| Laboratorio | UAOL/Máquina Realm, experimentos de agentes, nuevos modelos | Permite investigación sin contaminar compromisos comerciales |
| Activos independientes | Obras, portafolios, proyectos sociales y documentos personales | Tienen identidad, riesgos y audiencias que no deben homogeneizarse |

## Dirección comercial

La oferta inicial debe decir algo específico: **“Convertimos procesos complejos y dispersos en entregas verificables, con automatización asistida por IA y aprobación humana.”** El cliente no compra “el ecosistema Belentani”; compra reducción de trabajo, menor riesgo documental, mejor trazabilidad o una entrega de mayor calidad.

El primer paquete comercial debe tener alcance cerrado: diagnóstico de un workflow, inventario de entradas, automatización limitada, controles de aprobación, informe final y medición antes/después. No debe incluir promesas de autonomía ni un precio definitivo hasta medir tres pilotos reales.

| Paquete | Cliente inicial | Entrega | Evidencia de éxito |
|---|---|---|---|
| **NEXUS Audit** | Equipo pequeño con IA, software o documentación dispersa | Mapa, riesgos, controles, informe y backlog | Menos tiempo de revisión y mayor reconstruibilidad |
| **NEXUS Flow** | Profesional o pyme con repetición administrativa/comercial | Workflow con asistentes, plantillas y gates | Tiempo por caso, errores y tareas manuales reducidos |
| **NEXUS Studio** | Creador, marca o equipo de contenido | Paquete creativo versionado, evaluado y entregable | Ciclo de producción, reutilización y calidad acordada |

## La regla de priorización

Cada proyecto debe obtener una clasificación antes de recibir más trabajo:

| Clase | Pregunta | Regla |
|---|---|---|
| **Core** | ¿Aporta una capacidad reutilizable a NEXUS? | Se mantiene, documenta y prueba |
| **Vertical** | ¿Resuelve un problema concreto para una audiencia? | Se mide con un caso y una oferta |
| **Lab** | ¿Explora una hipótesis técnica o creativa? | Tiene fecha y criterio de promoción o cierre |
| **Asset** | ¿Es una obra, documento o activo final? | Se versiona, protege y cataloga |
| **Archive** | ¿No tiene siguiente decisión ni uso actual? | Se conserva, pero no consume foco |

Un repositorio nuevo necesita propietario, usuario objetivo, categoría, siguiente decisión, criterio de terminado y fecha de revisión. Sin esos campos, no es expansión estratégica: es acumulación.

## Roadmap de 90 días

### Días 1–15: canonización

Registrar todos los repositorios y familias de Drive en un catálogo único. Elegir un repositorio canónico por línea, identificar duplicados exactos, vincular evidencias y separar espacios personales, sociales, creativos y comerciales. No crear nuevos dominios.

### Días 16–35: núcleo operativo

Completar NEXUS Core con proyectos, trabajos, activos, estados, propietarios, sensibilidad, permisos, decisiones y auditoría. Añadir conectores de solo lectura para GitHub, Drive y Gmail, con sincronización explícita y logs. Ninguna acción externa debe publicarse sin aprobación.

### Días 36–60: tres workflows

Implementar NEXUS Audit, NEXUS Flow y NEXUS Studio como demostraciones delimitadas. Cada workflow debe tener entradas, pasos, modelo de coste, intervención humana, criterios de calidad, fallos conocidos y una entrega reproducible.

### Días 61–90: validación de valor

Probar los tres workflows con usuarios o casos reales autorizados. Medir tiempo, errores, retrabajo, satisfacción, calidad, coste de inferencia y conversión comercial. Promover solamente el workflow que muestre valor; archivar o congelar los demás sin borrar sus activos.

## Qué significa “englobar la mayor parte”

Englobar no significa conectar todo con todo. Significa que la mayoría de tus actividades comparte un mismo ciclo operativo: **capturar → contextualizar → producir → verificar → aprobar → entregar → aprender**. La música puede producir un paquete creativo; una auditoría puede producir un informe; una oportunidad comercial puede producir una propuesta; un proyecto social puede producir un expediente. El tipo de salida cambia, pero el sistema de control permanece.

La frontera está en los datos sensibles, las obras con identidad propia, los compromisos con terceros y cualquier acción irreversible. Esos espacios deben integrarse por referencias, permisos y gates, no por fusión automática.

## Decisión final

La dirección recomendada es **NEXUS: infraestructura verificable de trabajo humano aumentado**. No es una web de proyectos ni un chatbot universal. Es una columna vertebral para que tu capacidad de crear, investigar, automatizar, documentar, producir y vender deje de depender de memoria, nombres de carpetas y ráfagas de actividad.

La prueba de realidad es sencilla: si en 90 días NEXUS no consigue que tres workflows produzcan entregas más rápidas, más confiables o más vendibles, la tesis debe reducirse. Si lo consigue, los dominios verticales pueden crecer sin perder coherencia.
