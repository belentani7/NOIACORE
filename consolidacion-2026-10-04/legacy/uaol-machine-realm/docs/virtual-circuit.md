# Circuito virtual local UAOL

## Alcance

El circuito virtual es un activo software **dentro del proyecto**. Reproduce un lazo de mando de motor con entradas digitales, salidas digitales, enclavamientos, alarma y telemetría. Se ejecuta únicamente en memoria del motor ULSP/1 y no contiene interfaces para PLC, USB, serie, red industrial, drivers ni direcciones de un equipo físico.

> Cada snapshot mantiene `simulationOnly: true`. El circuito no representa un certificado de seguridad funcional ni una máquina física.

## Señales del circuito

| Grupo | Señal | Tipo | Valor inicial | Función simulada |
|---|---|---:|---:|---|
| Entrada | `guardClosed` | Booleano | `true` | Guarda de seguridad virtual; debe estar cerrada para arrancar o rearmar. |
| Entrada | `thermalTrip` | Booleano | `false` | Disparo térmico virtual; inhibe el contactor y requiere rearme seguro. |
| Entrada | `emergencyLatched` | Booleano | `false` | Memoria de parada de emergencia; sólo cambia por los comandos simulados. |
| Salida | `motorContactor` | Booleano | `false` | Salida virtual de marcha del motor. |
| Salida | `runLamp` | Booleano | `false` | Indicador virtual de marcha. |
| Salida | `faultLamp` | Booleano | `false` | Indicador virtual de fallo o enclavamiento abierto. |
| Salida | `alarmSiren` | Booleano | `false` | Alarma virtual ante parada de emergencia o disparo térmico. |
| Derivada | `interlockHealthy` | Booleano | `true` | `guardClosed && !thermalTrip && !emergencyLatched`. |

## Comportamiento y enclavamientos

| Evento | Precondición | Resultado de circuito |
|---|---|---|
| `start` | `interlockHealthy` y estado `idle` o `stopped` | Pasa a `running`; activa contactor y lámpara de marcha. |
| Apertura virtual de guarda | Cualquier estado | Detiene el motor; pasa a `stopped`; enciende `faultLamp`. |
| `thermalTrip=true` | Cualquier estado | Detiene el motor; pasa a `stopped`; enciende `faultLamp` y `alarmSiren`. |
| `emergency_stop` | Cualquier estado | Pasa a `emergency_stop`; enclava la emergencia y apaga el contactor. |
| `acknowledge` | Estado `emergency_stop`, guarda cerrada y sin térmico | Pasa a `stopped`; borra la emergencia, pero no arranca el motor. |
| `reset` | Estado `stopped` o `maintenance`, guarda cerrada y sin térmico | Pasa a `idle`; apaga indicadores de fallo. |

El estado del circuito se evalúa cada vez que se procesa una entrada o comando. Por lo tanto, una señal de fallo tiene prioridad sobre una orden de marcha. Un comando `start` contra un enclavamiento abierto responde con `INVALID_TRANSITION` sin energizar ninguna salida virtual.

## Extensión ULSP/1

Se añade el tipo de mensaje local `input` para inyectar sólo señales virtuales controladas. No puede crear señales nuevas, cambiar salidas directamente, abrir una conexión externa ni desactivar `simulationOnly`.

```json
{
  "protocol": "ULSP/1",
  "requestId": "input-guard-open",
  "type": "input",
  "payload": { "signal": "guardClosed", "value": false }
}
```

Los snapshots incorporan un objeto `circuit` con `inputs`, `outputs` e `interlockHealthy`, además de los estados y telemetría del gemelo local. La consola presenta esos mismos datos como diagrama de software.

Para la demostración local se dispone de acciones CLI limitadas a esas dos entradas: `guard-open`, `guard-close`, `thermal-trip` y `thermal-clear`. No existe un comando que escriba directamente `motorContactor`, `runLamp`, `faultLamp` o `alarmSiren`: son salidas derivadas por la lógica del circuito.

## Límites explícitos

La topología, los enclavamientos y las señales son una **lógica pedagógica y operativa de simulación**. Para una instalación física se requerirían análisis de riesgo, diseño certificado, enclavamientos independientes, parada de emergencia cableada, pruebas de aceptación y responsable autorizado. Este proyecto no implementa ni afirma ninguno de esos elementos físicos.
