# AION Workforce

**AION Workforce** es una plataforma SaaS multi-tenant para gestionar turnos, empleados, incidencias, nóminas y suscripciones. Su característica diferencial es un ledger append-only con hashes SHA-256 encadenados, verificable desde un endpoint público sin exponer los payloads de negocio.

> **Nota de precisión:** el entorno gestionado de WebDev proporciona MySQL/TiDB, no PostgreSQL. Por ello, el proyecto usa Drizzle MySQL y aislamiento estricto en la capa de aplicación mediante membresías, filtros obligatorios y joins defensivos. No se afirma que exista RLS nativo PostgreSQL donde el motor real no lo soporta.

## Arquitectura

| Capa | Implementación | Decisión principal |
|---|---|---|
| Frontend | React 19, Vite, Tailwind 4, shadcn/ui | Dashboard responsive con estados de carga, error y vacío |
| API | Express 4, tRPC 11, SuperJSON | Contratos tipados de extremo a extremo |
| Persistencia | Drizzle ORM + MySQL/TiDB | Tablas con `tenantId`, índices y claves foráneas |
| Identidad | Manus OAuth | Usuario autenticado disponible en el contexto tRPC |
| Autorización | Membresías `owner/admin/manager/employee` | Cada procedimiento resuelve una membresía activa explícita |
| Integridad | SHA-256, canonicalización determinista, hash previo | Bloqueo de fila del tenant dentro de transacciones MySQL |
| Billing | Stripe Checkout + webhook firmado | Sólo se guardan IDs Stripe y el plan local necesario |

## Aislamiento multi-tenant

El sistema no selecciona el primer tenant disponible. `resolveTenantAccess()` exige que exista una membresía activa del usuario y, si se recibe `tenantId`, comprueba que la membresía pertenezca a ese tenant. Las escrituras de empleados, departamentos, turnos e incidencias validan además que las referencias relacionadas pertenezcan al mismo tenant. Las consultas que combinan tablas incluyen el tenant en la condición del join para evitar filtraciones ante datos inconsistentes.

El owner del proyecto recibe un onboarding limitado: al sincronizarse por OAuth, se crea o vincula una membresía `owner` únicamente para `OWNER_OPEN_ID`. Los demás usuarios deben acceder mediante un flujo explícito de creación o invitación; no se concede acceso implícito a ningún tenant.

## Auditoría SHA-256

Cada evento se canonicaliza ordenando las claves del payload, normalizando fechas ISO y enlazando `previousHash`. El hash se calcula como SHA-256 del evento completo. Antes de añadir un bloque, el servicio bloquea la fila del tenant con `SELECT ... FOR UPDATE`, lee el último hash y realiza la inserción dentro de la misma transacción.

El endpoint público es:

```text
GET /api/audit/verify?tenantId=1&limit=1000
```

Devuelve IDs, tipos de evento, hashes y fechas, pero no payloads. La verificación recomputa cada hash, compara el enlace anterior y señala el índice del primer bloque roto. La respuesta es cacheable durante 30 segundos para evitar lecturas innecesarias.

## Funcionalidades implementadas

| Área | Cobertura |
|---|---|
| Tenants | Creación, listado de membresías activas y selección por `tenantId` |
| Roles | Owner, admin, manager y employee con jerarquía de permisos |
| Empleados | CRUD lógico, departamentos, tarifa horaria, límite por plan e historial |
| Turnos | CRUD, validación temporal, filtros por empleado/departamento/estado/período |
| Nóminas | Cálculo desde turnos completados, hash de recibo, períodos y CSV para Pro/Enterprise |
| Incidencias | Creación, actualización, estado, severidad e historial por empleado |
| Dashboard | Horas, costes, empleados activos, turnos sin cubrir y resumen de auditoría |
| Planes | Free, Pro y Enterprise con límites y capacidades diferenciadas |
| Stripe | Checkout de suscripción, verificación de firma, eventos test e idempotencia por `event.id` |

## Stripe

La ruta canónica del webhook es `/api/stripe/webhook`. Se registra con `express.raw({ type: "application/json" })` antes de `express.json()` y verifica `stripe-signature` mediante `stripe.webhooks.constructEvent()`.

El checkout se crea mediante `billing.createCheckoutSession`, con `client_reference_id`, metadatos de tenant/usuario/plan, `customer_email`, URLs dinámicas y promoción opcional. El webhook procesa `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated` y `customer.subscription.deleted`. No almacena tarjetas, importes redundantes, payloads completos ni secretos.

Configura Stripe desde **Settings → Payment** y utiliza la URL `https://<dominio>/api/stripe/webhook`. El entorno de prueba requiere reclamar el sandbox de Stripe desde el panel de gestión antes de validar pagos reales del proyecto.

## Base de datos y migraciones

La base gestionada ya contenía la tabla `users` con las columnas camelCase del template. La migración ejecutable y revisada se encuentra en `drizzle/mysql-migrations/0001_aion_workforce_mysql.sql`; crea de forma idempotente `tenants`, `tenant_members`, `departments`, `employees`, `shifts`, `payroll_entries`, `incidents`, `audit_events` y `webhook_events`.

Para generar snapshots desde el schema actual:

```bash
pnpm drizzle-kit generate
```

Para aplicar la migración gestionada, utiliza el flujo de migración del panel del proyecto. El SQL manual está documentado únicamente como evidencia y se aplicó con consultas no destructivas `CREATE TABLE IF NOT EXISTS`.

### Ruta de migración a PostgreSQL con RLS

MySQL/TiDB no ofrece Row Level Security nativo. El runtime actual sigue siendo MySQL/TiDB; los siguientes artefactos describen la ruta deliberada a un PostgreSQL gestionado para obtener aislamiento en la base de datos:

- `drizzle/migrations-postgres/0000_aion_workforce_postgres.sql`: esquema completo en `snake_case` con columna `tenant_id` en cada tabla de tenant.
- `scripts/enable_rls.sql`: recorre `information_schema.columns` y, para cada tabla con `tenant_id`, ejecuta `ENABLE ROW LEVEL SECURITY`, `FORCE ROW LEVEL SECURITY` y crea la política `tenant_isolation`.

Pasos para aplicar la ruta:

1. Provisionar PostgreSQL 14+ y fijar `DATABASE_URL=postgres://...` (el driver `pg` ya está en dependencias).
2. Aplicar el esquema con una configuración Drizzle de dialecto `postgresql` y `out: ./drizzle/migrations-postgres`, o directamente con `psql "$DATABASE_URL" -f drizzle/migrations-postgres/0000_aion_workforce_postgres.sql`.
3. Activar las políticas: `psql "$DATABASE_URL" -f scripts/enable_rls.sql`.
4. En la aplicación, fijar el tenant en cada transacción antes de consultar: `SET LOCAL app.current_tenant_id = '<tenant_id>';`.

La política es *fail-closed*: si `app.current_tenant_id` no está definido, `current_setting('app.current_tenant_id', true)` devuelve `NULL` y ninguna fila coincide. No se debe mezclar MySQL y PostgreSQL en la misma ejecución; la ruta RLS sólo aplica cuando el driver y las migraciones se conmutan de forma completa.

## Desarrollo local

```bash
pnpm install
pnpm dev
```

El seed es explícito y no se ejecuta al arrancar el servidor:

```bash
pnpm tsx server/seed.ts
```

El seed evita modificar una base que ya contiene un tenant y genera datos sólo cuando la base está vacía. Para una instancia local completa:

```bash
docker compose up -d
```

El `docker-compose.yml` usa MySQL 8.4, no PostgreSQL, y el servicio Node ejecuta la instalación, el build y el servidor con `DATABASE_URL` apuntando al contenedor MySQL.

## Calidad y evidencia

Los checks actuales son:

```bash
pnpm check
pnpm test
pnpm build
```

La suite Vitest cubre logout, canonicalización determinista SHA-256, dependencia del hash anterior, jerarquía de roles y respuesta de verificación de eventos test Stripe. La evidencia se guarda bajo `audit-evidence/`, incluyendo logs de typecheck/build/tests, migraciones PostgreSQL heredadas archivadas y el corpus GitHub.

La auditoría externa registró **200 repositorios públicos de GitHub visitados** y 260 candidatos únicos consultados mediante búsquedas sobre multi-tenancy, SaaS, scheduling, payroll, Drizzle, Stripe, RBAC, audit trails y hash chains. El resultado reproducible está en:

- `audit-evidence/github-repositories.csv`
- `audit-evidence/github-repositories.json`
- `audit-evidence/github-corpus.md`
- `scripts/github-corpus.mjs`

Los repositorios fueron tratados como datos de referencia: no se ejecutó código descargado de terceros.

## Riesgos y límites residuales

El aislamiento es robusto en la aplicación, pero no es RLS nativo porque la infraestructura gestionada es MySQL/TiDB. Si se requiere RLS como requisito regulatorio, la siguiente evolución debe migrar deliberadamente a un PostgreSQL gestionado y adaptar el driver, las migraciones y las pruebas de políticas; no se debe activar una mezcla de dialectos.

La creación de precios Stripe usa `price_data` con importes mensuales definidos en código para el MVP. Antes de producción comercial conviene reemplazarlo por Price IDs configurados en Stripe, revisar impuestos, moneda, cancelación, facturación prorrateada y términos legales. El endpoint público permite comprobar integridad, pero no sustituye una política de conservación, exportación probatoria ni un control de acceso para datos que puedan identificar a empleados.

## Estado de auditoría

El estado actual se registra en `todo.md`. No se marca como completada ninguna tarea que dependa de una capacidad inexistente de la infraestructura. El proyecto debe pasar nuevamente por pruebas de integración contra una base de datos de staging y una revisión legal/laboral antes de procesar nóminas reales.
