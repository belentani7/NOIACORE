# UAOL–Máquina Realm

UAOL–Máquina Realm es una plataforma operacional persistente para **crear, supervisar y auditar** tareas de agentes y operaciones industriales. La versión actual ofrece un frontend React, backend tipado, base de datos, cola de comandos, gateway local ejecutable, gemelo digital, SSE autenticado, auditoría y portal de cliente.

> **Límite esencial:** el producto entregado opera exclusivamente sobre el gemelo digital. No controla el equipo del usuario, su navegador, sus herramientas personales, redes industriales, PLCs, sensores, actuadores ni hardware real. El modo físico permanece sin adaptador y bloqueado hasta contar con un entorno autorizado.

## Capacidades implementadas

| Área | Implementación |
| --- | --- |
| Centro operativo | Centro de mando glassomórfico con máquinas, telemetría, comandos, salud, diagnósticos y eventos persistentes. |
| Portal de cliente | Ruta separada y de solo lectura para consultar activos, disponibilidad, alertas y actividad verificada. |
| Cola de comandos | Solicitud, validación, confirmación, idempotencia por propietario, arrendamiento, ejecución, resultado y auditoría. |
| Gateway local | Proceso `gateway-local` autenticado con token rotatorio, heartbeat, pull de comandos, outbox de resultados y reintentos. |
| Gemelo digital | Estados ampliados, ciclos, carga, velocidad, latencia, desconexión, reconexión, fallo, recuperación, alarmas y emergencia sintética. |
| Protocolos | Emulación trazable de MQTT, OPC UA y Modbus; no se abren sockets industriales. |
| Seguridad | OAuth con sesiones de 12 horas, roles administrables, auditoría persistente de acceso, restricción de controles, confirmaciones, rate limits, token hasheado y Validation Ledger. |
| Tiempo real | SSE protegido por sesión, invalidación de datos y persistencia de telemetría/eventos. |

## Arquitectura operacional

```text
Cliente / Operador autenticado
            │
            ├──────────► Portal de cliente (solo lectura)
            │
            ▼
Centro operativo ──► API tipada / roles ──► Base de datos y Validation Ledger
            │                                      │
            │                                      ├── cola idempotente de comandos
            │                                      ├── telemetría, alertas y health checks
            │                                      └── eventos operacionales y SSE
            ▼
Gateway local autenticado ◄── pull / resultado ──► SimulatorMachineAdapter
                                                     │
                                                     ▼
                                           Gemelo digital determinista
```

El gateway local está separado del servidor web. En modo simulación consulta un comando autorizado, lo ejecuta contra `SimulatorMachineAdapter` y devuelve un resultado auditado. Si la devolución falla, conserva el resultado en un outbox local y lo reintenta antes de tomar trabajo adicional.

## Roles y límites de acceso

| Rol | Lectura de portal | Centro operativo | Comandos y diagnóstico | Credenciales de gateway |
| --- | --- | --- | --- | --- |
| `client`, `user`, `auditor` | Sí | Consulta limitada | No | No |
| `operator`, `supervisor` | Sí | Sí | Sí, con confirmaciones | No |
| `admin` | Sí | Sí | Sí | Sí |

Los roles se almacenan en la base de datos. La administración de altas, cambios y revisiones periódicas de acceso debe formar parte del proceso operativo del cliente antes de una operación física.

## Desarrollo y pruebas

```bash
pnpm install
pnpm dev
pnpm gateway:dev
pnpm test
pnpm check
pnpm build
```

Para el gateway local, emita una credencial desde el Centro operativo y guárdela en `gateway-local/.env`. Consulte [`gateway-local/README.md`](gateway-local/README.md) y [`docs/gateway-local-operations.md`](docs/gateway-local-operations.md) para la configuración completa.

La suite actual cubre reglas, integración de persistencia, roles, interfaz de consola, gateway HTTP ejecutable y recuperación de outbox. Las migraciones se encuentran en `drizzle/` y deben generarse, revisarse y aplicarse antes de publicar una modificación de esquema.

## Frontera de seguridad e integración física

El modo `hardware_authorized` no contiene adaptador real. Para pasar del gemelo digital a un activo físico se requiere, como mínimo, un controlador identificado, propiedad y autoridad operativa verificadas, adaptador específico, red segmentada, credenciales de dispositivo, banco de pruebas, límites de comando, registros de aceptación y mecanismos de parada independientes.

> Un portal web, un agente o un gateway no sustituyen un sistema de seguridad funcional ni una parada de emergencia física.

La hoja de ruta y el estado de preparación están documentados en [`docs/production-readiness.md`](docs/production-readiness.md). La versión anterior de las fronteras de simulación continúa disponible en [`docs/simulation-safety.md`](docs/simulation-safety.md).
