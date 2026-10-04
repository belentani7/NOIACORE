# Prompt maestro — infraestructura NEXUS con auditoría máxima

## Cómo usar este archivo

Copie **íntegramente** el bloque de prompt siguiente en su generador de código, agente de ingeniería o entorno de desarrollo. El prompt pide una infraestructura ejecutable, no una web, ni un mockup, ni una presentación. Si el generador solicita decisiones, mantenga los valores predeterminados hasta que exista evidencia técnica para cambiarlos.

> **Regla de lectura:** esta infraestructura nace en modo simulación. No autorice, implemente ni active una conexión física por analogía, variable de entorno, bandera de configuración o cambio trivial de código.

---

```text
Eres un/a arquitecto/a principal de sistemas distribuidos, seguridad de aplicaciones y control operacional. Construye un repositorio de infraestructura backend denominado `nexus-control-core`.

No construyas una interfaz web, SPA, dashboard, landing page ni frontend de usuario. El producto entregable debe ser una infraestructura ejecutable y documentada: API, CLI, workers, persistencia, pruebas, observabilidad, informes y contratos. Una futura interfaz podrá consumir la API, pero no forma parte de esta entrega.

# 0. MISIÓN Y LÍMITE ABSOLUTO

Construye un núcleo de operaciones para UNA máquina exclusivamente simulada, denominado `NEXUS-SIM-01`. Su objetivo es preparar, validar, aprobar, ejecutar y auditar transiciones de un simulador determinista. Todas las operaciones críticas se bloquean por defecto y requieren la confirmación independiente de tres nodos:

1. N1 — Política y rol del solicitante.
2. N2 — Estado, riesgo y salud del simulador.
3. N3 — Aprobación humana explícita, independiente y de duración limitada.

El sistema NO debe tener ningún controlador, driver, SDK, endpoint, variable de entorno, bandera de compilación, paquete ni esqueleto “habilitable” para PLC, OPC UA, Modbus, MQTT industrial, serie, TCP de máquina, GPIO, control robótico, E-STOP físico, despliegue a edge ni acceso a hardware. No añadas “TODO: conectar hardware” dentro de código operativo.

El modo único permitido es `simulation`. Cualquier valor de modo distinto de `simulation` debe producir un error de arranque y un evento de auditoría. Si una persona solicita integración física, responde a nivel de documentación con una lista de requisitos, pero no implementes conectividad.

No emplees LLMs, agentes autónomos ni IA generativa para autorizar, bloquear, aprobar, ejecutar o priorizar comandos. Si implementas una extensión de IA, debe estar aislada en un paquete opcional de solo lectura, sin credenciales por defecto, que produzca únicamente borradores de informes con evidencia y no pueda llamar a ningún endpoint de comandos.

# 1. RESULTADO QUE DEBES ENTREGAR

Entrega un repositorio completo, ejecutable y verificable con:

- Un servicio API tipado y autenticado para comandos, aprobaciones, consultas, auditoría e informes.
- Un worker de simulación continuo y determinista que avance el estado sin depender de consultas de API o de una interfaz.
- Un coordinador transaccional de comandos que garantice que N1, N2 y N3 siguen siendo válidos en el momento exacto de despacho.
- Persistencia relacional con migraciones reproducibles.
- Patrón transactional outbox, consumidor de eventos idempotente y posibilidad de replay.
- Ledger de auditoría append-only con hash-chain verificable y checkpoints firmados mediante una interfaz KMS/HMAC intercambiable.
- Un motor de políticas versionadas y revisables, no reglas hardcodeadas dispersas.
- Un motor de riesgo determinista y explicable.
- Un sistema de aprobación humana fuerte: identidad, segundo factor o firma de aprobación, razón, vencimiento y separación de deberes.
- Alarmas, series de telemetría reales, evaluaciones de salud, métricas, trazas y logs estructurados.
- Generación de informes de turno, incidente, decisiones, integridad del ledger y salud de datos en JSON y Markdown; CSV adicional solo cuando tenga sentido.
- CLI de operador, aprobador, auditor y administrador de política.
- Especificación OpenAPI o contratos gRPC; elige OpenAPI salvo que una restricción explícita exija gRPC.
- Docker Compose únicamente para desarrollo local de dependencias, más instrucciones de despliegue sin Docker obligatorio.
- Pruebas unitarias, integración, concurrencia, propiedad/invariante, seguridad y recuperación.
- Documentación de arquitectura, modelo de amenazas, runbooks, criterios de aceptación, esquema de datos y matriz de capacidades.

No declares el proyecto terminado hasta que todos los criterios de aceptación y las pruebas exigidas por este prompt estén implementados y ejecutados con resultados registrados.

# 2. ELECCIONES TÉCNICAS PREDETERMINADAS

Usa los siguientes valores salvo impedimento fundamentado. Si sustituyes alguno, documenta por qué y conserva las mismas garantías.

| Área | Valor predeterminado |
|---|---|
| Lenguaje | TypeScript estricto, Node.js LTS |
| API | Fastify o Express con OpenAPI; preferencia Fastify |
| Base de datos | PostgreSQL 16 |
| Acceso a datos | Drizzle ORM o Kysely con SQL explícito para invariantes |
| Migraciones | Reproducibles, versionadas y verificadas desde una base vacía |
| Cola / eventos | Transactional outbox en PostgreSQL; adaptador opcional a NATS o RabbitMQ, no requerido en desarrollo |
| Cache / lock | PostgreSQL con bloqueo optimista y transacciones; Redis solo si se justifica y se cubre con tests |
| Identidad | OIDC/JWT con validación de emisor, audiencia, expiración y JWKS; proveedor intercambiable |
| Segundo factor de N3 | Interfaz de WebAuthn/TOTP/sello criptográfico; en desarrollo puede usar un verificador determinista explícitamente marcado como `development-only` |
| Secretos | Variables de entorno validadas, interfaz KMS; nunca secretos en repositorio |
| Observabilidad | OpenTelemetry, logs JSON, métricas Prometheus, trazas correlacionadas |
| Pruebas | Vitest, Testcontainers o PostgreSQL efímero, pruebas de propiedad cuando aporten invariantes |
| CLI | Node.js con subcomandos, salida JSON para automatización y tabla para humano |
| Reportes | JSON canónico y Markdown; firma/hash de cada reporte |

La arquitectura debe poder ejecutarse en un solo proceso para desarrollo, pero sus contratos no deben depender de memoria local para corrección, autorización, auditoría, eventos ni entrega. No uses EventEmitter en memoria como fuente de verdad. No uses cron local incontrolado como mecanismo crítico. Los workers deben tener identidad, lock, lease, intervalo y recuperación explícitos.

# 3. ESTRUCTURA MÍNIMA DEL REPOSITORIO

Genera como mínimo esta estructura, adaptando nombres solo si mejora la claridad:

```text
nexus-control-core/
  README.md
  package.json
  tsconfig.json
  .env.example
  docker-compose.dev.yml
  docs/
    ARCHITECTURE.md
    THREAT_MODEL.md
    OPERATIONS_RUNBOOK.md
    INCIDENT_RUNBOOK.md
    POLICY_GOVERNANCE.md
    SIMULATION_BOUNDARY.md
    ACCEPTANCE_CRITERIA.md
    CAPABILITY_MATRIX.md
    REPORT_SCHEMA.md
  openapi/
    openapi.yaml
  src/
    api/
      server.ts
      routes/
      middleware/
    cli/
      index.ts
      commands/
    config/
    domain/
      machine/
      commands/
      policy/
      risk/
      approval/
      audit/
      reports/
      health/
    application/
      commandCoordinator.ts
      snapshotService.ts
      reportService.ts
      integrityService.ts
    infrastructure/
      db/
      outbox/
      auth/
      kms/
      observability/
      simulator/
      clock/
    workers/
      simulatorWorker.ts
      outboxWorker.ts
      integrityWorker.ts
      reportWorker.ts
    contracts/
    tests/
  migrations/
  scripts/
  reports/.gitkeep
```

# 4. MODELO DE DOMINIO NO NEGOCIABLE

## 4.1 Máquina y simulación

Implementa exactamente una máquina con `machine_key = NEXUS-SIM-01`, `mode = simulation` y estados:

```text
stopped | calibrating | operating | paused | maintenance | emergency
```

Comandos permitidos:

```text
start
stop
pause
resume
reset
enter_maintenance
exit_maintenance
acknowledge_alarm
emergency_stop_simulation
```

Define una matriz de transición declarativa, versionada y cubierta por tests. Todas las transiciones no declaradas deben ser rechazadas. `emergency_stop_simulation` solo modifica el estado simulado y debe generar una alarma crítica `SIM_ESTOP_ACTIVE`. Ninguna documentación puede sugerir que reemplaza un sistema de emergencia físico.

El simulador debe evolucionar por ticks controlados y persistidos, no al consultar la API. Implementa una interfaz `SimulationClock` para permitir tiempo virtual y reproducibilidad. Cada tick debe producir telemetría con `measured_at`, `source = simulator`, `quality`, `sequence_number` y `simulation_run_id`.

Telemetría mínima:

```text
temperature_c, load_pct, speed_rpm, power_kw, pressure_bar,
latency_ms, vibration_mm_s, energy_kwh, quality, measured_at
```

No simules datos presentándolos como mediciones físicas. Todas las APIs, reportes y eventos deben declarar `source = simulation`.

## 4.2 Identidad y roles

Implementa identidades y roles separados:

```text
observer
operator
approver
policy_admin
platform_admin
auditor
report_reader
```

No conviertas automáticamente `platform_admin` en `policy_admin`. La asignación de un rol operacional requiere una política versionada y un evento de auditoría. Implementa scope por máquina, aunque hoy exista una sola máquina. El rol no se confía desde el cliente: se obtiene de token validado y/o tabla de asignaciones vigente.

## 4.3 El comando como objeto inmutable

Todo comando debe contener como mínimo:

```text
command_id (UUIDv7 o equivalente ordenable)
machine_id
command_type
canonical_payload_json
payload_hash (SHA-256 de serialización canónica)
idempotency_key
requester_id
requester_role_snapshot
requested_at_utc
expires_at_utc
state_version_at_request
policy_version_at_request
risk_snapshot_hash
status
correlation_id
causation_id
simulation_only = true
```

No permitas UPDATE del payload ni del solicitante. Si cambia cualquier parámetro, crea un nuevo comando y marca la solicitud anterior como invalidada o reemplazada según reglas explícitas. `idempotency_key` debe ser única dentro de solicitante y ventana definida.

Estados de comando:

```text
requested
policy_rejected
risk_rejected
awaiting_human
approval_rejected
expired
authorized
dispatching
executed
failed
superseded
cancelled
integrity_blocked
```

# 5. PROTOCOLO DE TRES NODOS

## 5.1 N1 — política y rol

N1 debe evaluar de forma determinista:

- identidad validada;
- rol y scope vigentes;
- tipo de comando permitido;
- versión de política activa;
- `mode === simulation`;
- `simulation_only === true`;
- límites por máquina, horario y frecuencia cuando existan;
- conflictos de separación de deberes.

La decisión debe producir `allow` o `block`, código de razón estable, explicación humana y evidencia estructurada. Guarda `policy_version`, `policy_hash`, inputs canónicos y resultado. Reevalúa N1 inmediatamente antes de pasar a `dispatching`.

Las políticas deben vivir en datos versionados o ficheros policy-as-code con hash y revisión; no pueden quedar dispersas en condicionales de servicio. Cada cambio de política requiere solicitud, revisión por un segundo `policy_admin` distinto, publicación, rollback y auditoría.

## 5.2 N2 — estado, riesgo y salud

N2 debe evaluar de forma determinista:

- transición de estado permitida;
- versión actual del estado contra `state_version_at_request`;
- antigüedad de telemetría;
- calidad de telemetría;
- alarmas activas y severidad;
- límites configurados y su versión;
- estado de worker de simulación;
- salud de base de datos y outbox cuando sea relevante;
- tasa de comandos y protección contra repetición;
- condición de degradación segura.

Devuelve `allow` o `block` con un `risk_snapshot` inmutable y hash. Si la telemetría expira, si el worker no tiene lease vigente, si existe alarma crítica o si los datos son de baja calidad, N2 bloquea por defecto. Reevalúa N2 dentro de la misma transacción de despacho, después de N3 y antes de cambiar la máquina.

## 5.3 N3 — aprobación humana fuerte

N3 debe exigir:

- aprobador distinto del solicitante por `principal_id` y por identidad autenticada;
- rol `approver` o `policy_admin` con scope vigente;
- segundo factor o firma de aprobación verificable;
- justificación explícita y no vacía;
- vista del tipo de comando, payload hash, estado/riesgo y expiración;
- vencimiento corto configurable, predeterminado de cinco minutos;
- bloqueo de aprobación si N1 o N2 cambian;
- quorum configurable. Predeterminado: un aprobador para comandos comunes y dos aprobadores distintos para `emergency_stop_simulation`, `reset` tras emergencia y cambios de política.

La aprobación nunca debe aceptar datos enviados por el cliente como fuente de verdad. Debe firmar o vincular criptográficamente `command_id`, `payload_hash`, `policy_hash`, `risk_snapshot_hash`, `expires_at` y `approver_id`.

## 5.4 Ejecución atómica

La ejecución debe usar una transacción de base de datos con bloqueo optimista o pesimista sobre comando y máquina. La secuencia obligatoria es:

```text
1. adquirir lock del comando y máquina;
2. verificar que no hay ejecución previa ni idempotencia duplicada;
3. revalidar N1;
4. verificar firmas, quorum y vencimiento de N3;
5. revalidar N2 sobre la versión actual;
6. cambiar estado del simulador;
7. persistir telemetría/evento/comando/auditoría/outbox;
8. confirmar transacción;
9. publicar evento desde outbox;
```

Si un paso falla, no alteres la máquina. Produce un estado terminal justificable y un evento de auditoría. No uses una cadena de llamadas sin transacción como sustituto de atomicidad.

# 6. ESQUEMA DE DATOS

Implementa migraciones para las siguientes entidades, con índices, restricciones, claves foráneas y timestamps UTC:

```text
principals
role_assignments
machines
machine_state_history
simulation_runs
simulation_ticks
telemetry_samples
alarms
alarm_transitions
policies
policy_versions
policy_change_requests
commands
command_validations
approvals
approval_signatures
outbox_events
consumer_offsets
audit_ledger
ledger_checkpoints
health_checks
health_incidents
reports
report_artifacts
data_quality_assessments
integrity_verifications
```

Requisitos mínimos:

- No borres registros operacionales, comandos, validaciones, aprobaciones, auditoría o reportes desde la API.
- Implementa permisos de base de datos que separen migración, aplicación, auditoría y lectura de reportes.
- Crea índices para `command_id`, `machine_id + measured_at`, `status + expires_at`, `correlation_id`, `sequence_number` y `event_hash`.
- Conserva payloads en JSON canónico y versiona sus schemas.
- Implementa una vista o consulta de reconstrucción de decisión para recuperar el expediente de cualquier `command_id`.
- Ningún informe puede excluir deliberadamente datos de baja calidad; debe señalarlos.

# 7. AUDITORÍA MÁXIMA, VERIFICABLE Y HONESTA

El ledger de auditoría debe ser append-only en la aplicación y reforzado por permisos de base de datos. Cada entrada contiene:

```text
ledger_sequence
entry_id
occurred_at_utc
recorded_at_utc
actor_principal_id
actor_role_snapshot
action_type
decision_node
decision
reason_code
reason_human
command_id
machine_id
correlation_id
causation_id
previous_hash
entry_hash
canonical_content_hash
schema_version
source = simulation | system | human
```

Reglas obligatorias:

- Calcula `entry_hash = hash(previous_hash || canonical_content)`.
- Publica checkpoints firmados cada N entradas o intervalo configurable; define una interfaz `AuditSigner` para KMS/HMAC.
- Implementa un verificador que recorra la cadena, valide hashes, secuencias, checkpoints y referencias cruzadas.
- Si la verificación falla, cambia el estado global a `integrity_blocked`; N1 y N2 deben bloquear cualquier comando nuevo.
- El informe de integridad debe separar “sin anomalías detectadas” de “inmutable frente a cualquier administrador”; no sobredimensiones la garantía.
- Escribe tests que adulteren una entrada, rompan una secuencia, cambien un payload y alteren una referencia, demostrando que el verificador bloquea.

# 8. EVENTOS, OUTBOX Y REPLAY

Usa un patrón transactional outbox. Todo cambio de estado relevante debe crear un evento persistido en la misma transacción. Tipos mínimos:

```text
simulation.tick.recorded
machine.state.changed
command.requested
command.policy.blocked
command.risk.blocked
command.awaiting_approval
command.approval.recorded
command.executed
command.failed
alarm.raised
alarm.cleared
policy.published
ledger.checkpointed
ledger.integrity_failed
report.generated
health.degraded
```

Cada consumidor debe ser idempotente, conservar offset/estado y soportar replay desde un cursor. No uses un bus en memoria como fuente de verdad. Si expones streaming para consumidores, debe poder recuperar eventos desde cursor y detectar huecos.

# 9. SALUD, OBSERVABILIDAD Y CALIDAD DE DATOS

Implementa:

- `/health/live`, `/health/ready` y `/health/details` autenticado;
- métricas de comando por estado y razón de bloqueo;
- métricas de antigüedad de telemetría, lease del worker, cola outbox, retraso de consumidor, integridad del ledger y errores de reporte;
- trazas con `correlation_id` desde API/CLI hasta evento y auditoría;
- logs JSON sin secretos ni PII innecesaria;
- evaluación de calidad por muestra: `good`, `degraded`, `stale`, `invalid`;
- incidentes de salud persistidos y cierre explícito;
- configuración de umbrales versionada;
- un comando CLI `nexus health verify` que produzca JSON y Markdown con fuente, timestamp, umbral y conclusión.

No declares “gateway conectado” o “tiempo real” sin medición. Expón `last_successful_tick_at`, edad de datos, estado del worker, estado de outbox, estado de integridad y modo de ejecución.

# 10. INFORMES COMPLETOS Y SALUDABLES

No inventes datos. Los informes deben ser reconstruibles desde registros persistidos y llevar metadatos de calidad. Implementa estos informes:

1. **Informe de turno:** periodo, ticks, telemetría válida/inválida, cambios de estado, comandos, aprobaciones, bloqueos, alarmas, salud y lagunas.
2. **Informe de incidente:** alarma, contexto previo/posterior, decisiones de N1/N2/N3, correlación, integridad, tiempos y datos faltantes.
3. **Expediente de comando:** payload hash, versiones de estado/política, riesgo, aprobaciones, firmas, eventos, resultado y cadena de auditoría.
4. **Informe de integridad:** secuencias revisadas, checkpoints, anomalías, cobertura, conclusión y limitaciones.
5. **Informe de calidad de datos:** cobertura temporal, muestras inválidas/stale, fuente y confianza de cada métrica.
6. **Informe de política:** versión, cambios, revisores, efecto sobre comandos, excepciones y rollback.

Cada informe debe contener una sección obligatoria:

```text
Fuentes usadas
Ventana temporal
Cobertura y lagunas
Calidad de datos
Suposiciones
Limitaciones
Integridad del informe
Conclusión verificable
```

No escondas que los datos proceden de simulación. Exporta JSON canónico y Markdown; calcula hash del artefacto y registra la generación en el ledger.

# 11. API Y CLI SIN INTERFAZ WEB

Expón API REST documentada con OpenAPI. Como mínimo:

```text
POST   /v1/commands
GET    /v1/commands/{commandId}
POST   /v1/commands/{commandId}/approve
POST   /v1/commands/{commandId}/reject
POST   /v1/commands/{commandId}/cancel
GET    /v1/machines/{machineId}/snapshot
GET    /v1/machines/{machineId}/telemetry?from=&to=&cursor=
GET    /v1/machines/{machineId}/alarms
GET    /v1/audit/commands/{commandId}
POST   /v1/audit/verify
GET    /v1/events?cursor=
GET    /v1/health/details
POST   /v1/reports/shift
POST   /v1/reports/incident
POST   /v1/reports/command
POST   /v1/reports/integrity
POST   /v1/policies/change-requests
POST   /v1/policies/change-requests/{id}/review
POST   /v1/policies/change-requests/{id}/publish
```

Todas las rutas mutables requieren identidad, autorización, `Idempotency-Key`, `X-Correlation-ID` y validación de cuerpo. Devuelve códigos de razón estables y `trace_id`. Nunca aceptes `role`, `approval_status`, `risk_status`, `mode` o `actor_id` definidos por el cliente.

Implementa CLI equivalente:

```text
nexus machine snapshot
nexus command request <type> --machine NEXUS-SIM-01 --payload file.json
nexus command approve <command-id> --reason "..." --mfa-proof <...>
nexus command reject <command-id> --reason "..."
nexus command show <command-id>
nexus audit verify --from <cursor> --to <cursor>
nexus report shift --from <UTC> --to <UTC> --format json|md
nexus health verify
nexus policy request-change --file policy.json
nexus policy review <change-id> --approve|--reject --reason "..."
```

La CLI debe imprimir JSON con `--json`, no exponer secretos y usar códigos de salida consistentes.

# 12. MODELO DE AMENAZAS Y CONTROLES

Documenta y prueba amenazas mínimas:

| Amenaza | Control requerido |
|---|---|
| Solicitud duplicada | Idempotencia, constraint y replay seguro |
| Autoaprobación | Rechazo por principal y evento auditado |
| Aprobación vencida | Comparación con reloj de servidor y transición terminal |
| Cambio de estado entre validación y ejecución | Versión de estado + lock + revalidación transaccional |
| Cambio de política entre validación y ejecución | Hash/versionado + revalidación transaccional |
| Telemetría stale | N2 bloquea por defecto |
| Manipulación de ledger | Hash-chain, checkpoint, verificador y `integrity_blocked` |
| Pérdida de evento | Outbox persistente, retry, cursor y replay |
| Worker duplicado | Lease, fencing token y ejecución idempotente |
| Privilegios excesivos | Roles separados, scopes y mínimos permisos de DB |
| Secreto en log | Redacción y tests de logging |
| Falsa declaración de salud | Métricas y checks con fuente/timestamp |
| Dependencia de IA no confiable | IA fuera de la ruta de control y sin capacidad de ejecutar |

# 13. PRUEBAS EXIGIBLES

Implementa y ejecuta al menos estas categorías. No escribas pruebas de escaparate; cada una debe demostrar una invariante.

## Unitarias

- matriz completa de transiciones;
- política por rol, scope, modo y versión;
- riesgo por estado, alarma, calidad y edad de telemetría;
- autoaprobación, quorum, vencimiento y firma inválida;
- serialización canónica y hash de payload;
- hash-chain y checkpoints;
- calidad de datos y cálculo de staleness;
- generación de informe con lagunas declaradas.

## Integración con PostgreSQL efímero

- solicitud permitida llega a `awaiting_human`;
- bloqueo por N1 no crea ruta de ejecución;
- bloqueo por N2 no crea aprobación válida;
- una aprobación válida de otro principal lleva a ejecución simulada;
- doble aprobación concurrente no produce dos ejecuciones;
- cambio de versión de máquina después de solicitud bloquea ejecución;
- cambio de política después de solicitud bloquea ejecución;
- vencimiento bloquea ejecución;
- restart de worker no duplica tick ni evento;
- replay de outbox no duplica efectos;
- adulteración de ledger lleva a `integrity_blocked`;
- un informe se reconstruye igual desde la misma ventana y registra su hash.

## Propiedad e invariantes

- ningún comando `executed` carece de N1 allow, N2 allow y N3 válida;
- ningún principal puede aprobar un comando propio;
- todo cambio de estado tiene evento y entrada de ledger correlacionados;
- todo reporte cita fuente, cobertura, lagunas y hash;
- ningún comando existe con `mode != simulation`;
- un evento outbox confirmado puede ser reprocesado sin alterar la verdad final;
- una cadena de auditoría válida se vuelve inválida si se altera cualquier entrada relevante.

## Seguridad y recuperación

- validación de JWT con emisor/audiencia incorrectos;
- rechazo de role injection desde cliente;
- rechazo de payload no canónico o schema desconocido;
- sanitización de logs;
- caída de base de datos durante despacho;
- expiración de lease de worker;
- recovery desde backup lógico de prueba;
- reconstrucción de expediente de comando y verificación de integridad.

# 14. CRITERIOS DE ACEPTACIÓN

El proyecto solo se acepta si todos se cumplen:

1. `pnpm check`, `pnpm test`, build y pruebas de integración pasan en una máquina limpia.
2. Una solicitud autorizada requiere N1, N2 y N3 antes de mover el simulador.
3. Todo caso bloqueado deja una explicación, evidencia y ledger correlacionado.
4. El simulador genera telemetría sin depender de GET `/snapshot`.
5. El gráfico o informe de telemetría usa muestras persistidas; no puntos inventados para presentar historia.
6. La API rechaza cualquier modo distinto de `simulation`.
7. El repositorio no contiene integración física, protocolo industrial, driver de hardware ni ruta encubierta de activación.
8. El verificador detecta adulteración de ledger y bloquea nuevos comandos.
9. Un reinicio no borra estado, eventos, aprobaciones ni evidencia de decisión.
10. Los eventos pueden reproducirse desde cursor y los consumidores son idempotentes.
11. La aprobación humana se vincula a identidad, segundo factor/firma, payload, política, riesgo y vencimiento.
12. Los informes son reproducibles, señalan lagunas y dicen explícitamente `source = simulation`.
13. La documentación enumera límites reales y no afirma control físico, inteligencia autónoma, inmutabilidad absoluta ni tiempo real sin métrica.
14. La cobertura de tests se reporta, pero no se usa como sustituto de la lista de invariantes demostradas.

# 15. REGLAS DE HONESTIDAD DE LA ENTREGA

En el README final incluye una tabla con estas columnas: `capacidad`, `estado`, `evidencia`, `límite`, `cómo verificar`. Debe distinguir estrictamente:

```text
demostrada
preparada
conceptual
ausente deliberadamente
```

No uses lenguaje como “máximo”, “completo”, “inmutable”, “autónomo”, “inteligente”, “industrial”, “conectado” o “en tiempo real” sin definir el alcance y dar evidencia. Si algo no está implementado, escríbelo como pendiente o fuera de alcance.

# 16. ORDEN DE IMPLEMENTACIÓN

Implementa en este orden y registra un checkpoint verificable después de cada fase:

1. Fundaciones: configuración validada, DB, migraciones, reloj, identidad, logging y esquema.
2. Simulador continuo, máquina, telemetría, alarmas y series históricas.
3. Política versionada, N1, N2, comando inmutable e idempotencia.
4. N3 con separación de deberes, firma/MFA y quorum.
5. Coordinador transaccional, outbox, replay y locks.
6. Ledger, verificador, checkpoints y bloqueo de integridad.
7. API, CLI, OpenAPI y controles de autorización.
8. Salud, observabilidad, reportes y calidad de datos.
9. Pruebas de concurrencia, recuperación, seguridad e invariantes.
10. Documentación, matriz de capacidad y auditoría interna final.

Tras cada fase, informa: archivos creados, migraciones aplicadas, comandos de prueba, pruebas que pasaron, riesgos residuales y capacidades que siguen fuera de alcance. Si una prueba crítica falla, detente, informa la causa y corrige antes de pasar a la fase siguiente.

# 17. SALIDA FINAL REQUERIDA DEL GENERADOR

Al finalizar, entrega:

1. Árbol de archivos del repositorio.
2. Instrucciones de arranque local sin depender de interfaz web.
3. Comandos de migración, simulación, API, worker, CLI, tests y verificación de ledger.
4. Inventario de endpoints y subcomandos.
5. Resumen de resultados de prueba.
6. Matriz de capacidades demostradas/preparadas/conceptuales/ausentes.
7. Riesgos residuales y bloqueo explícito de cualquier integración física.
8. El informe de auditoría inicial generado por el propio sistema.

No generes una interfaz web. No simules que las pruebas pasaron si no se ejecutaron. No rellenas informes con datos ficticios presentados como reales. No habilites una acción crítica sin evidencias N1, N2 y N3 persistidas y verificables.
```

---

## Resultado esperado

El prompt no pide “la web de una plataforma”; pide el **sustrato verificable** que una interfaz futura podría consumir. La entrega correcta debe poder ser inspeccionada con CLI, API, migraciones, registros, pruebas e informes reproducibles, aun si no existe ninguna pantalla visual.
