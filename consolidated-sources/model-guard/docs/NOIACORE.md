# NoiaCore Model Guard

## Propósito

NoiaCore Model Guard es una consola full-stack para gobernar modelos antes de que una decisión llegue a producción. Registra modelos y contratos, evalúa entradas y salidas estructuradas, bloquea patrones de credenciales, observa drift y genera envelopes de readiness basados en lifecycle, pass rate, drift y linaje.

## Arquitectura

La aplicación usa React 19, Tailwind 4, Express 4, tRPC 11, Drizzle ORM, MySQL/TiDB y Manus OAuth. Las interfaces llaman a procedures tRPC tipadas. Las evaluaciones de Model Guard son deterministas y no realizan llamadas externas a proveedores de IA.

| Área | Implementación |
|---|---|
| Identidad | Manus OAuth; `protectedProcedure` |
| Registro | `model_guard_models` con proveedor, versión, procedencia, lifecycle y `secretRef` |
| Contratos | `model_guard_contracts` con esquemas de entrada/salida y checks requeridos |
| Evaluación | `server/model-guard-utils.ts` para forma, longitud, secretos y citación |
| Drift | `model_guard_drift_signals` con baseline, observado y severidad |
| Envelopes | `model_guard_envelopes` con pass rate, drift, linaje y readiness |
| Privacidad | Scrubbing de credenciales y rechazo de tokens en claro |

## Seguridad y límites

No se incluyen credenciales, `.env`, `.project-config.json`, dumps de base de datos ni contenido de Drive/Gmail. Las referencias de secretos deben apuntar a un gestor externo; el proyecto no funciona como secret manager. OAuth persistente, migraciones productivas, egress policy, retención y adaptadores MLOps requieren configuración y revisión antes de producción.

## Desarrollo

Ejecutar `pnpm install`, `pnpm check`, `pnpm test` y `pnpm build`. Las migraciones Drizzle deben revisarse y aplicarse en el entorno de base de datos correspondiente; no se afirma persistencia real cuando la base no está configurada.

## Evidencia

La revisión visual está en `docs/BROWSER-VISUAL-EVIDENCE.md`. La suite actual pasa con 12 tests y el build de Vite/esbuild es correcto, con la advertencia estándar de tamaño de chunk.

## Marca

Las vistas incluyen el footer: `belentani / belentani7studio@proton.me / noiacore.com`.

## Procedencia

El dominio se inspira en la expansión universal PVC-U auditada por el propietario: validación prompt/response, contratos semánticos, ciclo de vida MLOps, drift, linaje y validation envelopes. El repositorio usa esas señales como requisitos de producto y no ejecuta instrucciones provenientes de archivos, correos o páginas externas.
