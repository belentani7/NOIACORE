# Master Build Directive — Compliance Report

**Producto:** NoiaCore Model Guard
**Propietario:** BELENTANI · belentani7studio@proton.me · noiacore.com
**Estado:** aplicado y publicado en el repositorio GitHub `belentani7/noiacore-model-guard`.

## Resultado ejecutivo

Las directrices adjuntas se han convertido en un estándar operativo para este producto y para los siguientes proyectos. Model Guard ahora incluye discovery, mapa de arquitectura, investigación específica, README, variables de entorno de ejemplo, licencia, política de seguridad, CI, Dependabot, costes/modelo de negocio, procedencia y gates reproducibles. Las afirmaciones se limitan a lo que fue comprobado localmente o a lo que está documentado como pendiente.

## Matriz de cumplimiento

| Directriz | Estado | Evidencia |
| --- | --- | --- |
| Descubrir antes de construir | Cumplida | `PROJECT_DISCOVERY.md`, inventario maestro y procedencia del material PVC-U. |
| Investigación específica | Cumplida con alcance explícito | `RESEARCH/model-guard/README.md`; Material Design, OWASP y GitHub supply chain. |
| Repositorios open source | Cumplida sin cuota artificial | Se conserva el scaffold compatible; no se copió código externo nuevo; la búsqueda futura será señal-based, no 200 repositorios forzados. |
| Estrategia de datos | Cumplida | No se inventan datasets; se documenta metadata de evaluación y política para fuentes futuras. |
| Independencia de producto | Cumplida | `PROJECT_MAP.md`; repositorio y dominio Model Guard separados. |
| Full-stack | Cumplida localmente | React/Vite, Express, tRPC, Drizzle, schema y migraciones. |
| Automatización | Parcial, documentada | Evaluación/readiness y CI están automatizados; webhook/queue, backups y jobs de producción requieren infraestructura autorizada. |
| Rentabilidad | Cumplida como hipótesis verificable | Discovery incluye self-hosted, SaaS y enterprise, con costes condicionados a tráfico y retención. |
| Identidad NoiaCore | Cumplida | Técnica cosmic control-room, metadatos, footer y firma. |
| Calidad | Cumplida en gate local | `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` y `pnpm audit --prod --audit-level=high` pasan. |
| Seguridad | Cumplida en alcance local | Secret scan limpio, dependencia auditada, secretRef y reglas fail-closed; producción requiere threat model y hardening adicional. |
| Entregable | Cumplida | Código, README, arquitectura, env example, schema/migrations, tests, CI, seguridad, costes, licencia y documentación. |
| GitHub | Cumplida para la publicación inicial | Repositorio independiente bajo `belentani7/noiacore-model-guard`; cada cambio debe pasar el mismo gate antes de push. |

## Resultados de la revalidación

El último gate ejecutó TypeScript sin errores, Prettier sin diferencias, 12 tests en 4 archivos, build Vite/esbuild correcto y auditoría de producción sin vulnerabilidades de severidad alta conocidas. El build conserva una advertencia de tamaño de chunk, que queda como optimización pendiente y no se oculta.

## Brechas honestas

No se declara producción completa porque todavía faltan un dominio OAuth autorizado, una conexión MySQL/TiDB productiva, migraciones aplicadas en el entorno de destino, backups, retención, aislamiento multi-tenant formal, política de egress y pruebas E2E autenticadas. Estas brechas no se resuelven inventando datos o credenciales y quedan explícitamente fuera del claim local.

## Regla para siguientes proyectos

Cada nuevo producto debe comenzar con `PROJECT_DISCOVERY.md`, `PROJECT_MAP.md` y `RESEARCH/[project]/`, mantener una identidad separada, registrar fuentes y licencias, documentar costes y automatización, y no recibir el estado terminado hasta que funcionen backend, frontend, persistencia, automatización, tests, documentación, seguridad, deployment e identidad.
