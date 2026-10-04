# UAOL Local Simulation Protocol, versión 1

## Propósito y frontera de seguridad

El **UAOL Local Simulation Protocol (ULSP/1)** permite que procesos locales de UAOL–Máquina Realm intercambien comandos y snapshots de un gemelo digital en un PC con Node.js. El servidor escucha sólo en `127.0.0.1` por defecto y utiliza TCP con mensajes JSON delimitados por salto de línea. No descubre dispositivos, no abre puertos de red industrial, no carga drivers, no implementa MQTT, OPC UA ni Modbus y no ejecuta instrucciones sobre maquinaria física.

> Todas las respuestas incluyen `simulationOnly: true`. Esta propiedad no es configurable mediante el protocolo.

## Compatibilidad local

El protocolo se implementa únicamente con módulos estándar de Node.js. Por tanto, se puede ejecutar en Windows, macOS y Linux siempre que estén disponibles Node.js 20 o superior y el repositorio/paquete de UAOL. No necesita privilegios de administrador, servicios externos, base de datos ni adaptadores de hardware.

## Transporte y encuadre

| Propiedad | Valor |
|---|---|
| Transporte | TCP local (`127.0.0.1`) |
| Puerto por defecto | `45123`, configurable con `LOCAL_PROTOCOL_PORT` |
| Encapsulado | Un objeto JSON UTF-8 por línea (`\n`) |
| Tamaño máximo de trama | 65.536 bytes |
| Conexión | Puede transportar varias solicitudes; cada respuesta conserva el `requestId`. |
| Descubrimiento de red | No implementado deliberadamente. |

## Solicitud

Cada solicitud debe tener la forma siguiente. Se rechazan versiones, tipos, IDs y payloads no válidos sin ejecutar ninguna transición.

```json
{
  "protocol": "ULSP/1",
  "requestId": "req-local-0001",
  "type": "hello | snapshot | command",
  "payload": {}
}
```

| Tipo | Payload válido | Resultado |
|---|---|---|
| `hello` | `{ "clientName": "nombre-local" }` | Confirma versión, identificador de sesión y frontera de simulación. |
| `snapshot` | `{}` | Devuelve el estado, contador de ciclos, telemetría determinista y los últimos eventos. |
| `command` | `{ "command": "start\|pause\|resume\|stop\|reset\|maintenance\|acknowledge\|emergency_stop" }` | Valida la transición y devuelve el snapshot resultante. |

## Respuesta

```json
{
  "protocol": "ULSP/1",
  "type": "response",
  "requestId": "req-local-0001",
  "ok": true,
  "simulationOnly": true,
  "timestamp": "2026-08-27T00:00:00.000Z",
  "payload": {}
}
```

En una respuesta con error, `ok` es `false` y `error` contiene un código estable y un mensaje. Los códigos incluyen `INVALID_FRAME`, `INVALID_REQUEST`, `UNSUPPORTED_PROTOCOL`, `UNKNOWN_MESSAGE`, `INVALID_TRANSITION` y `FRAME_TOO_LARGE`.

## Ciclo de estado simulado

| Estado actual | Comandos aceptados | Estado siguiente |
|---|---|---|
| `idle` | `start`, `maintenance`, `emergency_stop` | `running`, `maintenance`, `emergency_stop` |
| `running` | `pause`, `stop`, `emergency_stop` | `paused`, `stopped`, `emergency_stop` |
| `paused` | `resume`, `stop`, `emergency_stop` | `running`, `stopped`, `emergency_stop` |
| `stopped` | `start`, `reset`, `maintenance`, `emergency_stop` | `running`, `idle`, `maintenance`, `emergency_stop` |
| `maintenance` | `reset`, `emergency_stop` | `idle`, `emergency_stop` |
| `emergency_stop` | `acknowledge` | `stopped` |

Los valores de telemetría y el contador de ciclos se generan de forma determinista en memoria. Se pierden al detener el servidor, por diseño. La persistencia operacional existente de UAOL continúa siendo responsabilidad del backend/gateway-local autenticado; ULSP/1 no la sustituye.

## Instalación y uso local

En una copia del repositorio, instale las dependencias con `pnpm install`. Es necesario **Node.js 20 o superior**; no se requieren credenciales, base de datos, permisos de administrador ni acceso a Internet durante la ejecución del protocolo.

Abra una primera terminal y arranque el servidor local:

```bash
pnpm local-protocol:server
```

La salida confirma `host: "127.0.0.1"`, `port: 45123` y `simulationOnly: true`. Para usar otro puerto no privilegiado, defina `LOCAL_PROTOCOL_PORT`; por ejemplo, en PowerShell: `$env:LOCAL_PROTOCOL_PORT=45124`, o en bash: `LOCAL_PROTOCOL_PORT=45124 pnpm local-protocol:server`.

En una segunda terminal puede ejecutar los comandos siguientes. El separador `--` es importante para pasar los argumentos al cliente de `pnpm`.

```bash
pnpm local-protocol:client -- hello
pnpm local-protocol:client -- snapshot
pnpm local-protocol:client -- start
pnpm local-protocol:client -- snapshot
```

El cliente también admite acciones de entrada únicamente virtuales: `guard-open`, `guard-close`, `thermal-trip` y `thermal-clear`. Por ejemplo, `pnpm local-protocol:client -- guard-open` detiene el circuito simulado y no envía señal alguna fuera del propio PC.

Para detener el servidor pulse `Ctrl+C`. Su estado vive sólo en memoria y se reinicia como `idle` al iniciar de nuevo. La prueba integrada `server/localProtocol.integration.test.ts` verifica una comunicación TCP de loopback real, una transición `idle → running`, la telemetría determinista y el rechazo de tramas, versiones y transiciones inválidas.

## Garantías y exclusiones

| Garantía | Resultado |
|---|---|
| Ejecución local | El servidor se vincula de forma fija a `127.0.0.1`; ningún equipo de la red puede conectarse mediante ULSP/1. |
| Portabilidad | Sólo usa Node.js y módulos estándar, por lo que no depende de un sistema operativo concreto. |
| Seguridad de transición | Rechaza comandos incompatibles con el estado simulado. |
| Frontera física | No contiene IP, driver, socket industrial, protocolo de PLC ni instrucción a hardware. |
| Persistencia | Deliberadamente no persiste; la persistencia operacional sigue siendo la del backend/gateway autenticado existente. |
