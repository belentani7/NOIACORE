# PROJECT BRIEF — FORJA v4.0 Enterprise Control Plane

## Objetivo

Consolidar FORJA v4.0 como un **control plane enterprise para agentes de IA** con aislamiento multi-tenant, gobernanza RBAC, trazabilidad criptográfica y documentación portable que permita verificar, continuar y publicar el proyecto sin depender del historial de chat.

## Alcance

| Incluido | Excluido |
|---|---|
| Dashboard React/tRPC/Drizzle para organizaciones, workspaces, RBAC, auditoría, plugins, WAL, seguridad, grafo y analítica | Convertir los blueprints Rust/Wasm o Yjs/MLS experimentales en servicios de producción sin una especificación y pruebas adicionales |
| Belentani Core: contratos reutilizables de ledger, validación, política de agentes, trace y auditoría metadata-only | Inventar un motor Search, automatizaciones externas o certificaciones SOC2/FedRAMP/ISO |
| Documentación de arquitectura, inventario de activos, seguridad, decisiones, handoff y ZIP portable | Subir clones históricos, exportaciones crudas de Drive, secretos, `node_modules` o builds al repositorio |
| Verificación con TypeScript, Vitest, build y revisión visual existente | Afirmar Lighthouse >90 o bundle comprimido <200 KB sin una medición que lo confirme |

## Entregables

| Entregable | Criterio de aceptación medible |
|---|---|
| Control plane FORJA | `pnpm check`, `pnpm test` y `pnpm build` terminan sin error |
| Belentani Core | El paquete compila y su suite aislada pasa |
| Mapa tecnológico | Documento de 14 apartados y un inventario de 21 dominios con estados explícitos |
| Paquete portable | `PROJECT-BRIEF.md`, `PLAN.md`, `DECISIONS.md`, `HANDOFF.md`, `README.md`, `docs/` y ZIP verificable |
| Publicación | Repositorios privados de FORJA y Belentani Core con rama `main` sincronizada |

## Audiencia y estilo

La audiencia primaria es el equipo técnico, CTO y CISO. La interfaz se mantiene como un dashboard operativo oscuro, denso y sobrio: prioriza legibilidad, trazabilidad y control sobre un tratamiento visual de landing page. Cualquier motion debe respetar `prefers-reduced-motion` y no interferir con flujos críticos.

## Suposiciones activas

1. El proyecto activo, `forja-enterprise`, es la fuente operativa principal; FORJA v3 y el blueprint v4 son referencias históricas o experimentales.
2. Los repositorios privados `belentani7/forja-enterprise` y `belentani7/belentani-core` son los destinos de publicación autorizados.
3. La auditoría de dependencias pendiente requiere triage controlado; no se realizan actualizaciones masivas sin validar regresiones.

## Referencias internas

La evidencia técnica se concentra en [`docs/BELENTANI7_TECHNOLOGY_MAP.md`](docs/BELENTANI7_TECHNOLOGY_MAP.md), [`docs/FUNCTIONAL_ASSET_INVENTORY.md`](docs/FUNCTIONAL_ASSET_INVENTORY.md), [`docs/SECURITY_DEPENDENCY_AUDIT.md`](docs/SECURITY_DEPENDENCY_AUDIT.md) y [`docs/BELENTANI_CORE_ARCHITECTURE.md`](docs/BELENTANI_CORE_ARCHITECTURE.md).
