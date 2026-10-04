# Seguridad y alcance de la simulación

## Declaración de operación

La plataforma opera como un **entorno de simulación persistente**. Un clic, mensaje, lectura, protocolo, alarma, transición o evidencia visible representa un cambio almacenado en la base de datos del proyecto. No representa un comando enviado a una máquina externa ni un evento observado fuera de la aplicación.

## Controles aplicados

| Control | Aplicación |
| --- | --- |
| Perímetro de simulación | Las respuestas de simulación declaran modo exclusivo de simulación y las acciones se describen como sintéticas. |
| Políticas persistentes | Las reglas se guardan por usuario y se consultan antes de tareas, transiciones, modos y protocolos. |
| Confirmación visible | El modo autónomo, los comandos protocolarios y los cambios de riesgo alto o crítico requieren confirmación. |
| Guardas de estado | Las máquinas sintéticas solo admiten transiciones declaradas; una transición inválida queda bloqueada y auditada. |
| Ledger | Cada decisión conserva acción, riesgo, resultado de permiso, instantánea de la regla, evidencia y marca de tiempo. |
| Aislamiento de interfaz | La consola no ejecuta control de navegador, terminal, escritorio, hardware o red industrial. |

## Limitaciones conocidas

La simulación usa muestras y mensajes generados por reglas de software. No pretende modelar física de proceso, latencias reales, calidad de señal, fallos de dispositivos, requisitos de seguridad funcional ni cumplimiento normativo de una planta real. Por ello, sus tendencias y resultados solo sirven para demostrar la experiencia de supervisión, la trazabilidad y las políticas de la consola.

## Criterios de no ampliación automática

Ningún agente puede ampliar sus permisos, cambiar la frontera de simulación ni transformar un mensaje sintético en una conexión real. Una evolución futura requerirá una decisión explícita del propietario del sistema, un diseño de adaptadores segregados, una revisión de seguridad y un procedimiento de validación independiente.

## Evidencia y auditoría

La evidencia registrada adopta el origen `uaol-simulator` y el indicador `simulationOnly: true`. La presencia de estos datos permite distinguir una demostración interna de una operación real. La consola debe conservar esta distinción visual y semántica en futuras versiones.
