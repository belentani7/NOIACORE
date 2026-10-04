# Operación de gateway-local

## Propósito y límite actual

`gateway-local` es un proceso separado del portal web. En la entrega actual utiliza `SimulatorMachineAdapter`, por lo que solo procesa comandos, telemetría y estados del **gemelo digital persistente**. El proceso se autentica mediante un identificador de gateway y un token rotatorio; el backend almacena únicamente el hash del token.

> La parada de emergencia física, los interlocks y los límites de seguridad de una máquina real deben seguir siendo independientes del portal y del gateway-local.

## Puesta en marcha de simulación

Desde el Centro operativo, emita una credencial de gateway y guarde el bloque mostrado en `gateway-local/.env`. El archivo de ejemplo contiene la forma esperada.

| Variable | Uso | Requisito |
| --- | --- | --- |
| `BACKEND_URL` | Dirección del backend UAOL–MR | Obligatoria |
| `GATEWAY_ID` | Identificador emitido por el portal | Obligatoria |
| `GATEWAY_TOKEN` | Token rotatorio de un solo vistazo | Obligatoria |
| `MACHINE_MODE` | Límite de adaptador | Debe ser `simulator` |
| `GATEWAY_HEARTBEAT_MS` | Cadencia de ciclo | Opcional, 8 s por defecto |

Ejecute `pnpm gateway:dev` durante desarrollo o `pnpm gateway:start` para un proceso local. En cada ciclo, el proceso reporta un heartbeat, reintenta resultados pendientes, toma como máximo un comando autorizado y devuelve su resultado auditado.

## Resiliencia de conexión

La implementación tiene una **garantía específica y acotada**. Si falla la devolución de un resultado de comando, el gateway lo guarda en `GATEWAY_OUTBOX_PATH` y lo reintenta antes de tomar otro comando. Las pruebas automáticas cubren el fallo, la persistencia en disco, la recuperación de conexión y el vaciado del outbox.

Los heartbeats no se almacenan en una cola durable: se reintentan en el siguiente ciclo. Los comandos se marcan como `executing` al ser arrendados y sus identificadores de idempotencia están protegidos por una restricción única en la base de datos. Para despliegues con hardware real, se deberá añadir un lease con vencimiento, reconciliación de comandos en vuelo y almacenamiento durable de heartbeats si el caso de uso lo requiere.

## Activación física: condición previa obligatoria

El modo `hardware_authorized` permanece sin adaptador implementado. Antes de sustituir el simulador por OPC UA, Modbus, MQTT u otro conector se exige inventario del controlador, aprobación del responsable operativo, pruebas aisladas, límites de comando, identidad de dispositivo, segmentación de red y un mecanismo de parada física independiente. La aplicación no activa ese modo por configuración ni por interfaz.
