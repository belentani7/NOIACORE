# Project TODO - FORJA v4.0 Enterprise Dashboard

- [x] 1. Diseñar arquitectura y estructura de datos enterprise
- [x] 2. Extender el esquema enterprise real de Drizzle con modelos para organizaciones, workspaces, Merkle audit logs, RBAC, plugins Wasm, trusted keys y refactorización masiva
- [x] 3. Implementar APIs backend tRPC para todos los módulos empresariales
- [x] 4. Construir interfaz frontend del dashboard con navegación lateral y diseño técnico enterprise oscuro
- [x] 5. Implementar módulo de Merkle Audit Logs con paginación, hash encadenado y verificación de firma Ed25519
- [x] 6. Implementar motor de políticas RBAC y gestión multi-tenant de organizaciones/workspaces
- [x] 7. Implementar pipeline de refactorización masiva WAL y monitoreo de seguridad en tiempo real
- [x] 8. Implementar visualizador de grafo semántico colaborativo y analíticas avanzadas
- [x] 9. Escribir tests unitarios y de integración con Vitest
- [x] 10. Crear checkpoint final y entregar la aplicación

- [x] Revisión: sustituir el snapshot preview por consultas persistentes y dejar el modo preview solo como fallback explícito
- [x] Revisión: añadir manejo de error, estados vacíos y feedback para exportación, registro de plugin, bundle Sigstore, búsqueda y ajustes
- [x] Revisión: verificar que el esquema Drizzle y la migración aplicada reflejan el stack real del proyecto, aunque el blueprint original use Prisma

- [x] Gap fix: implementar verificación real de cadena SHA-256 y firma Ed25519 en Merkle Audit Logs con tests
- [x] Gap fix: añadir evaluación/enforcement RBAC, update de políticas y asignación de roles de miembros
- [x] Gap fix: persistir y avanzar jobs/WAL de forma durable y hacer explícitos los controles autoscale-safe
- [x] Gap fix: derivar vector clock/E2EE, seguridad y analíticas completamente desde datos del workspace
- [x] Gap fix: cubrir mutaciones enterprise principales con tests de integración

- [x] Final gap: integrar enforcement RBAC real en mutaciones enterprise críticas para ALLOW / REQUIRE_HUMAN_APPROVAL / DENY
- [x] Final gap: completar controles UI visibles de batches WAL y persistir entradas por operación
- [x] Final gap: vincular el estado E2EE del workspace a campos persistidos en lugar de texto fijo
- [x] Final gap: ampliar tests de integración para mutaciones enterprise y efectos persistidos
- [x] Final verification: añadir tests de éxito para mutaciones enterprise y comprobar efectos en la capa persistente o fallback durable sin dejar datos de prueba permanentes

# 10/10 Production Hardening Scope

- [x] Phase 1: Auditoría técnica y mapeo de brechas de nivel 10/10
- [x] Phase 2: Hardening de autenticación, RBAC estricto y multi-tenancy aislado por organización
- [x] Phase 3: Eliminación de mocks restantes y sincronización en tiempo real durable (WAL, Merkle, E2EE)
- [x] Phase 4: Pulido de UX Enterprise, accesibilidad (a11y), navegación por teclado y diseño responsive impecable
- [x] Phase 5: Optimización de rendimiento, observabilidad de logs, reintentos y estados de error defensivos
- [x] Phase 6: Cobertura completa de tests unitarios y de integración (mutaciones, permisos, cadena de auditoría)
- [x] Phase 7: Verificación final de compilación, tests passing, checkpoint guardado y entrega 10/10

- [x] 10/10 role fidelity: persist enterpriseRole (junior_dev, senior_dev, ciso, admin) on users and derive RBAC actor context server-side
- [x] 10/10 verification: add migration, fixture coverage and UI display for the authenticated enterprise role

- [x] 10/10 tenant isolation: scope updatePolicy, deletePolicy and togglePlugin writes by authenticated orgId
- [x] 10/10 cross-tenant tests: prove a session cannot mutate another organization resource by known ID
- [x] 10/10 phase status: mark Phase 2 complete only after all read/write ownership checks pass

- [x] 10/10 ownership audit: inventory every enterprise read/write procedure and document its organization boundary
- [x] 10/10 exhaustive tenant suite: test every enterprise procedure against cross-tenant IDs and organization contexts
- [x] 10/10 phase status: keep Phase 2 pending until the route matrix and exhaustive suite are verified

- [x] 10/10 preview boundary: rename and document memory seed data as an explicit controlled preview adapter, never as production persistence
- [x] 10/10 test matrix: document coverage for every enterprise procedure, module and critical edge case
- [x] 10/10 missing cases: add contract tests for invalid input, auth gate, empty database, E2EE graph scope and WAL terminal states
- [x] 10/10 phase status: mark Phase 3 and Phase 6 complete only after the preview boundary and test matrix are explicit and verified

- [x] 10/10 observability: add structured control-plane logs with request, organization, procedure, duration and outcome fields
- [x] 10/10 performance evidence: document bounded polling, scoped parallel reads, retry policy and database index usage
- [x] 10/10 E2EE graph contract: explicitly assert workspace scope and persisted e2eeStatus in an integration test
- [x] 10/10 gate revalidation: only mark Phase 5 and the Phase 3/6 gate complete after those checks pass
- [x] 10/10 index evidence: add and apply non-destructive tenant/workspace/analytics indexes in migration 0006
- [x] 10/10 visual verification: confirm desktop and mobile dashboard layouts render without visible clipping
- [x] Publicación GitHub: crear o seleccionar repositorio privado y subir el checkpoint verificado de FORJA v4.0

# Patrimonio Tecnológico Belentani7 (Arqueología y Núcleo Común)

- [x] Fase 1: Arqueología en repositorios locales, GitHub y archivos disponibles (DUCK, FORJA, Lúmina, NOIACORE)
- [x] Gap evidence: crear inventario funcional explícito por dominio con activos, repositorios, evidencia y estado
- [x] Fase 2: Inventario de activos por dominio funcional (Frontend, Backend, Database, Auth, AI, Agents, Tools, Plugins, Automations, Audio, Files, Search, Graph, Security, Audit, Sync, UI, UX, API, Deployment)
- [x] Fase 3: Clasificación estricta de implementación (Implementado, Parcial, Experimental, Documentación, Mock, Roto, No verificado)
- [x] Fase 4: Descubrimiento y validación de piezas de mayor valor para infraestructura común
- [x] Fase 5: Diseño y estructuración de Belentani Core como infraestructura común desacoplada
- [x] Fase 6: Construcción, refactorización y reutilización de código real (sin fusionar por fusionar)
- [x] Fase 7: Pruebas automatizadas, builds y auditoría de seguridad, dependencias y secretos
- [x] Fase 8: Publicación organizada en GitHub bajo belentani7 sin destruir originales
- [x] Fase 9: Generación del informe final con los 14 apartados solicitados y evidencia empírica

# Paquete Portable y Verificación Autónoma

- [x] Crear PROJECT-BRIEF.md, PLAN.md y DECISIONS.md como fuente única de verdad de la actualización
- [x] Auditar criterios actuales de UI, accesibilidad, rendimiento, tests y dependencias sin sobreafirmar resultados
- [x] Re-ejecutar check, tests y build en la actualización portable; registrar los resultados y enlazar el estado vigente de dependencias
- [x] Crear HANDOFF.md, CHECKPOINT.md y README operativo con instrucciones de continuación desde cero
- [x] Generar un ZIP portable excluyendo secretos, node_modules, builds y datos de investigación crudos
- [x] Verificar archivos, ZIP, TypeScript, tests y build; guardar checkpoint y sincronizar GitHub
- [x] Guardar checkpoint posterior a la actualización portable y confirmar que el ZIP/documentación forman parte del estado recuperable
- [x] Sincronizar `main` de GitHub y verificar paridad exacta del commit final
