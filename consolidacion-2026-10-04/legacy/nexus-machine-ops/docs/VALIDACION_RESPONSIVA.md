# Validación visual y responsiva

La interfaz del centro de operaciones fue inspeccionada en tres formatos durante el desarrollo. La revisión confirma que el flujo de información conserva su orden: estado de máquina y gateway antes de la zona de comandos; triple confirmación antes de telemetría, auditoría, cola y alarmas.

| Viewport | Resultado | Evidencia de revisión | Ajuste requerido |
|---|---|---|---|
| Escritorio — 1440×1000 | Aprobado | La composición muestra el comando, los tres nodos y la auditoría en un recorrido operativo claro. | No requerido |
| Móvil — 390×844 | Aprobado | Los módulos se apilan sin recorte; los botones, estados y nodos siguen siendo distinguibles. | No requerido |
| Tableta — 768×1024 | Aprobado | La barra lateral compacta conserva navegación y el contenido mantiene legibilidad en columna sin superposiciones ni pérdida de acciones. | No requerido |

La validación se limita al entorno de simulación. La interfaz no constituye una HMI certificada ni debe utilizarse para control físico real.
