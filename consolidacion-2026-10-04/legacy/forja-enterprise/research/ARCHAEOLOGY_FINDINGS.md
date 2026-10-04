# Hallazgos de arqueología tecnológica — Belentani7

## Evidencia cuantitativa

| Fuente | Evidencia observada | Interpretación | Estado |
|---|---:|---|---|
| Drive | 5.837 filas en `ARCHIVOS-POR-PROYECTO.csv` | Inventario documental real, con rutas históricas de Windows, accesos y bytes | IMPLEMENTADO como inventario; no equivale a código ejecutable |
| Drive | 2.019 filas relacionadas con DUCK, FORJA, NOIACORE, Lúmina o Belentani en 16 proyectos | Hay patrimonio distribuido y duplicado que requiere normalización | IMPLEMENTADO como evidencia de archivo |
| GitHub | 22 repositorios relacionados por nombre/description | Existen múltiples snapshots y líneas de producto, no un único proyecto canónico | IMPLEMENTADO como inventario |
| `/home/ubuntu/forja_v3` | Next 16, React 19, Prisma, NextAuth, Socket.IO, Zustand, Recharts y una suite de recursos/UI | Base anterior de FORJA con capacidad frontend/backend, pero distinta al stack actual | IMPLEMENTADO, pendiente de pruebas completas en esta sesión |
| `/home/ubuntu/forja_v4_enterprise` | Blueprint TypeScript/Prisma, cuatro módulos enterprise y un archivo Rust verifier | Diseño técnico y prototipos con comentarios explícitos de integración hipotética | EXPERIMENTAL / DOCUMENTACIÓN |
| `/home/ubuntu/forja-enterprise` | React 19, Express, tRPC, Drizzle, control plane, 21 tests passing, build verificado | Implementación actual con evidencia automatizada | IMPLEMENTADO |

## Proyectos y activos con mayor señal

| Proyecto | Evidencia inspeccionada | Activos reales | Clasificación |
|---|---|---|---|
| FORJA v4 operacional | `server/enterpriseData.ts`, `server/routers/enterprise.ts`, Drizzle schema, 9 test files | Multi-tenancy, RBAC, Merkle SHA-256/Ed25519, WAL, plugins, graph, observability, UI | IMPLEMENTADO |
| FORJA v4 blueprint | `control_plane.ts`, `graph_sync.ts`, `plugin_manager.ts`, `sync.ts`, `rust_core/verifier.rs` | Contratos e interfaces de control plane, graph sync Yjs con MLS comentado, Wasm host con firma Ed25519/WASI propuesta | EXPERIMENTAL; no se copia sin pruebas e integración |
| DUCK ecosystem | `backend/main.py` | FastAPI + SQLite, tablas persistentes, worker en proceso, entregas con SHA-256, auditoría de plugins, análisis de audio opcional, auditoría de repositorios metadata-only con ejecución bloqueada | IMPLEMENTADO en local; requiere endurecimiento antes de compartir Core |
| DUCK snapshots | `duck-ecosystem-inspect`, `duck-studio-os-v2`, `duck-studio-os-protected`, `duck-full-studio-pro`, `duck-2026`, `duck-apps`, `duck-zion-apex-public` | Interfaces, herramientas, snapshots y documentos; varios repositorios comparten plantilla y componentes UI | PARCIAL / SNAPSHOT; no se fusionan por nombre |
| Lúmina | `server/chatStream.ts` | SSE hacia modelos, rate limit 20/min por cliente, trace/version headers, validation envelopes y catálogo de modelos | IMPLEMENTADO como ruta; necesita prueba de integración y revisión de dependencia |
| NOIACORE Model Guard | `server/validation.ts`, `server/model-guard-utils.ts`, `server/scheduled.ts` | Reglas typed, scoring de riesgo, hash SHA-256 de ledger, scrubber y jobs programados | IMPLEMENTADO / PARCIAL según módulo; valida Core candidato |
| NOIACORE LAB | README, auditoría y UI | Aplicación visual y narrativa con evidencia de build según su commit | IMPLEMENTADO como producto UI; no se asume infraestructura común sin contrato |
| Belentani | `server/agentPolicy.ts`, `server/automation.ts`, tests de agentes y observability | Límites de agente, revisión humana para acciones sensibles, readiness de automations y métricas operativas | IMPLEMENTADO en su repositorio; candidato directo a Core |

## Reglas de evidencia aplicadas

La categoría IMPLEMENTADO se reserva para código ejecutable localizado con contratos o pruebas, y no para un README, un diagrama, un botón o un archivo aislado. EXPERIMENTAL se usa cuando existen interfaces o dependencias hipotéticas no integradas. DOCUMENTACIÓN se usa para blueprints y planes sin ruta ejecutable. MOCK se reserva para datos o UI que no provienen de una persistencia o integración verificable. ROTO significa que la evidencia de compilación o ejecución no existe o está fallando. NO VERIFICADO significa que se encontró el activo pero todavía no se ejecutó su prueba específica.

## Candidatos de alto valor para Belentani Core

La primera extracción se limita a contratos pequeños, sin dependencias de producto: validación de payload/modelo y scoring de riesgo desde NOIACORE; límites y revisión humana de agentes desde Belentani; trazas, versionado de protocolo y envelopes desde Lúmina; hash canónico de ledger y verificación Ed25519 desde FORJA; y auditoría de repositorios en modo metadata-only desde DUCK. El host Wasm Rust, MLS/Yjs y el worker persistente de DUCK permanecen como módulos especializados hasta tener build, aislamiento y pruebas propias.
