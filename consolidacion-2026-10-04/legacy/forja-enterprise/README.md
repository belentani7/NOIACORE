# FORJA v4.0 Enterprise Control Plane

FORJA es un control plane para la gobernanza de ingeniería asistida por IA. El runtime actual combina React 19, Express, tRPC 11, Drizzle y MySQL/TiDB para aislar organizaciones, imponer RBAC, registrar auditoría criptográfica y gestionar plugins, WAL, seguridad, graph y analítica. La implementación operativa no debe confundirse con los blueprints históricos de FORJA v3/v4. [1] [2]

## Arranque local

| Acción | Comando | Resultado esperado |
|---|---|---|
| Instalar dependencias | `pnpm install` | Dependencias resueltas sin secretos en el repositorio |
| Desarrollo | `pnpm dev` | Servidor Express/Vite disponible en el puerto asignado por el runtime |
| Tipado | `pnpm check` | TypeScript finaliza sin errores |
| Tests | `pnpm test` | Suite Vitest completa |
| Build | `pnpm build` | Artefacto Vite + bundle del servidor en `dist/` |

El proyecto usa OAuth gestionado y variables inyectadas por el entorno. No cree ni cometa archivos `.env`; consulte `server/_core/env.ts` y el panel de secretos del proyecto si una integración requiere configuración.

## Arquitectura

La aplicación se organiza en `client/` para React, `server/` para tRPC/servicios, `drizzle/` para esquema y migraciones, `shared/` para contratos y `packages/belentani-core/` para contratos reutilizables. La capa Core contiene ledger SHA-256/Ed25519, validación, límites de agentes, trace IDs y auditoría metadata-only; FORJA consume su ledger y trace directamente. [3]

## Estado de calidad

La actualización portable verificó `pnpm check`, `pnpm test` —10 archivos y 25 tests— y `pnpm build`. El dashboard fue revisado visualmente en 1440, 768 y 360 px. No se declara como cumplido Lighthouse >90, WCAG AA completo, bundle JS <200 KB gzip ni ausencia de advisories: esas limitaciones están registradas explícitamente para no sobreafirmar el estado actual. [4]

## Documentación clave

| Documento | Propósito |
|---|---|
| [`PROJECT-BRIEF.md`](PROJECT-BRIEF.md) | Objetivo, alcance, supuestos y criterios de aceptación |
| [`PLAN.md`](PLAN.md) | Hitos verificables, riesgos y planes alternativos |
| [`DECISIONS.md`](DECISIONS.md) | Decisiones de arquitectura y alternativas descartadas |
| [`HANDOFF.md`](HANDOFF.md) | Estado actual y procedimiento de continuación |
| [`CHECKPOINT.md`](CHECKPOINT.md) | Registro de comandos y resultados de la actualización portable |
| [`docs/BELENTANI7_TECHNOLOGY_MAP.md`](docs/BELENTANI7_TECHNOLOGY_MAP.md) | Mapa tecnológico de 14 apartados |
| [`docs/QUALITY_AUDIT_2026-08-22.md`](docs/QUALITY_AUDIT_2026-08-22.md) | Auditoría de UI, accesibilidad, rendimiento y dependencias |

## Repositorios

El código se mantiene en [FORJA Enterprise](https://github.com/belentani7/forja-enterprise) y el paquete extraído en [Belentani Core](https://github.com/belentani7/belentani-core). Ambos repositorios son privados y usan la rama `main`.

## Referencias

[1]: docs/BELENTANI7_TECHNOLOGY_MAP.md "Mapa tecnológico Belentani7"
[2]: docs/FUNCTIONAL_ASSET_INVENTORY.md "Inventario funcional de patrimonio tecnológico"
[3]: docs/BELENTANI_CORE_ARCHITECTURE.md "Arquitectura Belentani Core"
[4]: docs/QUALITY_AUDIT_2026-08-22.md "Auditoría de calidad"
