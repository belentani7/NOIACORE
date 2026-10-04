# Preparación operacional para producción

## Estado de la entrega

La plataforma incluye portal, centro de control, persistencia de comandos, auditoría, gateway local de simulación, SSE protegido por sesión y pruebas de integración. La aplicación está preparada para evolucionar hacia un entorno productivo, pero el control físico sigue deliberadamente deshabilitado.

| Área | Implementado | Pendiente antes de integración física |
| --- | --- | --- |
| Identidad | Sesiones OAuth de 12 horas, roles de cliente, operador, supervisor, auditor y administrador; los inicios, cierres y procedimientos protegidos generan auditoría persistente | Revisión periódica de accesos y proceso corporativo de altas/bajas |
| Comandos | Cola, idempotencia por propietario, confirmaciones y ledger | Políticas de aprobación por planta, firma de comando y lease con vencimiento |
| Gateway | Token rotatorio, rate limit, heartbeat, outbox y simulador | Gestión de certificados, rotación programada, inventario y adaptador aprobado |
| Observabilidad | Eventos, health checks, telemetría, alertas, SSE, informes persistentes y consola administrativa de acceso | Retención formal, métricas externas, alertas de guardia y panel de SLO |
| Recuperación | Resultados pendientes del gateway se reintentan | Backups verificados, runbooks de recuperación y ejercicios de restauración |

## Procedimiento de liberación

Una liberación debe ejecutar `pnpm test`, `pnpm check` y `pnpm build`. La versión actual cuenta con pruebas de reglas, integración de persistencia, interacción de consola, gateway HTTP real y outbox recuperable. El middleware aplica un límite general por sesión a los procedimientos autenticados y las rutas de gateway conservan un límite adicional por gateway. Antes de introducir un adaptador físico, se debe abrir una fase de aceptación específica para el controlador identificado y registrar el responsable que autoriza cada comando de alto impacto.

## Modelo de alojamiento

El portal y la API funcionan en hospedaje administrado. La telemetría mantenida mediante SSE, los workers residentes y los procesos de gateway no deben depender de una instancia que pueda suspenderse. Para una operación continua se debe evaluar una instancia reservada para la API o un entorno de cómputo persistente para el gateway local, según el volumen, los protocolos y la responsabilidad de red.
