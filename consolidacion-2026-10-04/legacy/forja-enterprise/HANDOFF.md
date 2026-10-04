# HANDOFF — FORJA v4.0

## Estado entregado

FORJA v4.0 está operativo como control plane enterprise con persistencia multi-tenant, RBAC, Merkle audit logs, firma Ed25519, WAL, plugins, graph y observabilidad. El paquete Belentani Core fue extraído y publicado de manera privada. La documentación y el ZIP portable se preparan para que la siguiente sesión pueda comenzar leyendo `PROJECT-BRIEF.md`, `PLAN.md` y este documento. [1]

## Cómo continuar desde cero

1. Abrir el repositorio y leer `PROJECT-BRIEF.md`, `DECISIONS.md`, `PLAN.md` y `docs/QUALITY_AUDIT_2026-08-22.md`.
2. Ejecutar `pnpm install`, `pnpm check`, `pnpm test` y `pnpm build` antes de cualquier modificación.
3. Registrar cada cambio funcional como un nuevo `[ ]` en `todo.md` antes de editar código.
4. Si se modifica el esquema, generar migración Drizzle, revisar SQL y aplicarla únicamente por el flujo de base de datos gestionado.
5. Crear un checkpoint tras cambios verificables y sincronizar GitHub sólo después de comprobar `git status` y excluir raws/clones/secretos.

## Prioridades pendientes

| Prioridad | Estado | Siguiente acción verificable |
|---|---|---|
| Triage de dependencias | Pendiente | Clasificar el advisory crítico y los 21 high de `pnpm audit --prod`; actualizar cada familia de forma controlada y revalidar |
| Rendimiento | Pendiente | Medir Lighthouse de forma reproducible y dividir el chunk JS principal, actualmente ~335 KB gzip |
| Accesibilidad | Pendiente | Ejecutar auditoría WCAG automatizada y una prueba manual de teclado/modal/foco |
| Search | No implementado | Definir contrato, permisos, índice y criterios de precision/recall antes de crear la función |
| Blueprint Rust/Yjs/MLS | Experimental | Definir entorno de build, aislamiento y pruebas antes de declararlo parte de producción |

## Reglas operativas

No use el preview memory adapter como persistencia de producción. No suba `node_modules`, `dist`, clones históricos, CSV/Drive raw ni secretos. Los 14 clones históricos fueron preservados fuera del directorio gestionado, en `/home/ubuntu/forja-archaeology-clones`; son material de referencia y no dependencias de runtime.

## Referencias

[1]: docs/BELENTANI7_TECHNOLOGY_MAP.md "Mapa tecnológico y publicación"
