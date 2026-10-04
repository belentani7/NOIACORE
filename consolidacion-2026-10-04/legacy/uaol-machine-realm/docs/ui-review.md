# Verificación visual de la consola

La revisión de escritorio confirma una consola de control con identidad **UAOL—MR / Planta sintética**, rejilla operacional, perímetro de simulación visible y separación clara entre métricas, supervisión de máquinas, telemetría, alarmas y actividad protocolaria. La jerarquía mantiene los datos críticos visibles y comunica de forma explícita que no existe acceso al equipo, navegador ni hardware real.

La zona HMI muestra máquinas seleccionables, estado, conmutación manual/autónoma dentro del simulador, controles de transición, sensores sintéticos y actuadores simulados. Se verificó que la interfaz conserva contraste suficiente sobre el fondo oscuro y que la información de seguridad se mantiene en el encabezado principal.

La próxima verificación deberá recorrer los flujos de creación de tareas, actualización de telemetría, emulación de protocolo, confirmación de acciones sensibles y timeline de evidencia, con el fin de revisar estados cargados además de la vista inicial.

## Cobertura de validación

Las pruebas automáticas cubren las reglas de permiso, las transiciones de máquina, la telemetría sintética y una integración persistente que crea una tarea, actualiza telemetría, cambia modos, emite mensajes protocolarios, activa una emergencia simulada y verifica los registros resultantes. Las pruebas de interfaz renderizan la consola en un DOM de prueba, crean una tarea, avanzan su ciclo, revisan el timeline, conmutan una máquina al modo autónomo, confirman una transición sensible, emulan protocolos y verifican los estados de error y vacío. Un contrato adicional comprueba que los controles tRPC, el detalle HMI y las fronteras de simulación se mantienen declarados en la consola.

La revisión manual cubrió las vistas de escritorio y móvil de la consola inicial. Las pruebas automáticas no utilizan un navegador real ni ejecutan acciones fuera de la aplicación, coherentemente con el perímetro de simulación.
