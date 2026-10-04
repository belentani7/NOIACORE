# Auditoría ejecutada de UAOL–Máquina Realm

**Fecha de cierre:** 27 de agosto de 2026  
**Alcance auditado:** aplicación web React/Vite, API Express+tRPC, base de datos Drizzle/TiDB, gateway-local, gemelo digital, SSE, RBAC, auditoría y configuración operativa.  
**Modo confirmado:** `SIMULATION_ONLY`. Este informe **no afirma** conexión, lectura, escritura ni control de maquinaria física.

> **Conclusión ejecutiva.** La plataforma operacional simulada funciona de extremo a extremo con persistencia: se ejecutaron el gateway-local, un comando autorizado e idempotente, el simulador, telemetría, eventos, auditoría y SSE contra el backend y la base de datos reales del entorno. Dos arranques consecutivos del gateway dejaron heartbeats persistidos. Además, ULSP/1 intercambió mensajes por TCP local en `127.0.0.1`, y el circuito virtual local demostró marcha, apertura de guarda, corte de la salida virtual y bloqueo seguro de un nuevo arranque. La suite final aprobó **33/33 pruebas**, el tipado y el build finalizaron correctamente. No se implementó ni afirmó control de equipo físico.

## Método y evidencia de ejecución

La revisión no creó un producto paralelo ni sustituyó la plataforma por datos de demostración. Se examinó el repositorio, se ejecutaron procesos reales del proyecto y se conservaron artefactos de evidencia. El inventario de rutas, procedimientos, migraciones, scripts y pruebas está disponible en [el inventario de auditoría][1].

| Ejecución | Resultado verificable | Evidencia |
|---|---|---|
| Backend HTTP local | `GET /api/trpc/auth.me` respondió HTTP 200 sin sesión y devolvió el estado de autenticación esperado. | [Inventario y registro de auditoría][1] |
| Gateway-local real | Proceso ejecutable en modo one-shot; salida `0`; heartbeat autenticado persistido en la base de datos. | [Resultado de gateway-local][2] |
| Flujo operacional E2E | Comando confirmado pasó `queued → succeeded`; validación permitida; una repetición con la misma clave produjo un único comando; gateway, simulador, telemetría, eventos, ejecución y ledger persistieron. | [Evidencia E2E][3] |
| SSE autenticado | Stream HTTP 200 con `text/event-stream`; heartbeat HTTP 200 y evento `GATEWAY_HEARTBEAT` recibido. | [Resultado SSE][4] |
| Persistencia tras reinicio | Antes y después del reinicio permanecieron 3 máquinas, 1 comando exitoso, telemetría, eventos, gateway y heartbeats. Los registros de acceso aumentaron por nuevas sesiones, sin pérdida de los registros previos. | [Antes][5] y [después][6] |
| Reinicio de gateway-local | Dos procesos one-shot consecutivos terminaron con salida `0`; los heartbeats del mismo gateway aumentaron de 6 a 7 y luego a 8, permaneciendo `online`. | [Evidencia de reinicio de gateway][14] |
| Interfaz | Las rutas `/portal`, `/operations` y `/access` renderizaron datos persistentes, estado de simulación, acción de informe y trazabilidad de acceso. | Capturas verificadas y [pruebas focalizadas de portal e informes][15]. |
| Protocolo local portable | El servidor ULSP/1 se vinculó a `127.0.0.1`; un cliente CLI completó `hello`, `snapshot`, `start` y `snapshot` final, confirmando `idle → running`, telemetría y `simulationOnly: true`. | [Ejecución local][16] y [especificación ULSP/1][17] |
| Circuito virtual local | El cliente ULSP/1 activó `start`, inyectó `guard-open`, llevó `running → stopped`, desactivó `motorContactor` y rechazó un nuevo `start` por enclavamiento abierto. | [Ejecución de circuito][18] y [contrato del circuito][19] |

## Matriz de funcionalidades y estado objetivo

Los estados se limitan a la taxonomía solicitada. **“Realmente” significa ejecutado en este entorno de auditoría**, no que exista integración física.

| Funcionalidad | Estado | Implementación observada | ¿Probada? | Evidencia | Pieza pendiente o límite |
|---|---|---|---|---|---|
| Frontend operacional | ✅ FUNCIONA REALMENTE | React con rutas de consola, centro operativo, portal y gobierno de acceso; consultas tRPC y estados cargados desde backend. | Sí | Capturas auditadas; [pruebas UI][7] y [pruebas focalizadas][15] | No se ejecutó un recorrido independiente con navegador recién autenticado por OAuth. |
| Backend y contratos tRPC | ✅ FUNCIONA REALMENTE | Express+tRPC con routers de operaciones, simulación, acceso y autenticación. | Sí | [Inventario][1], [pruebas][7] | Ninguno observado en el flujo ejercitado. |
| Base de datos persistente | ✅ FUNCIONA REALMENTE | Drizzle/TiDB para máquinas, comandos, ejecuciones, telemetría, eventos, gateways, configuración y auditoría. | Sí | [E2E][3], [persistencia antes][5], [persistencia después][6] | Los conteos corresponden al entorno auditado, no a una prueba de carga. |
| Gateway-local autenticado | ✅ FUNCIONA REALMENTE | Heartbeat, pull de comandos, simulador, devolución de resultados, outbox recuperable y reanudación de proceso. | Sí | [Gateway real][2], [reinicio comprobado][14], [pruebas][7] | Se ejecutó exclusivamente con `MACHINE_MODE=simulator`. |
| Gemelo digital determinista | ✅ FUNCIONA REALMENTE | Adaptador simulador con arranque, pausa, parada, estados, telemetría y eventos. | Sí | [E2E][3], [pruebas][7] | No representa la calibración de un activo físico concreto. |
| Telemetría, eventos y SSE | ✅ FUNCIONA REALMENTE | Snapshots persistidos, eventos operacionales y stream SSE autenticado. | Sí | [E2E][3], [SSE][4] | No se ensayó una cantidad de clientes SSE de escala productiva. |
| Comandos, cola e idempotencia | ✅ FUNCIONA REALMENTE | Validación, confirmación, idempotency key, cola, lease, resultado y ejecución persistida. | Sí | [E2E][3], [pruebas][7] | La evidencia cubre el comando auditado y los casos de integración, no todas las reglas posibles. |
| Validation Ledger y auditoría operacional | ✅ FUNCIONA REALMENTE | Se registra la decisión de permiso, estado de validación, actor, acción, origen, metadatos y marcas de tiempo. | Sí | [E2E][3], [pruebas][7] | La retención y exportación regulatoria no fueron definidas. |
| RBAC servidor (admin/operator/client/auditor) | ✅ FUNCIONA REALMENTE | Admin y operator obtienen overview protegido; client y auditor reciben `FORBIDDEN` en rutas de control ejercitadas. | Sí | [prueba RBAC final][7] | La matriz completa de permisos de todas las rutas UI no fue sometida a prueba de combinatoria exhaustiva. |
| Portal de cliente y rutas protegidas | ✅ FUNCIONA REALMENTE | Vista de solo lectura observable con estado, alertas, gateway y trazabilidad; los controles de planta permanecen en centro autorizado y client/auditor se bloquean en servidor para control. | Sí | Captura de `/portal`; [pruebas de rol][7] y [pruebas focalizadas][15] | Falta un recorrido E2E de navegador por cada identidad y flujo de OAuth desde sesión limpia. |
| Informes y configuración operativa | ✅ FUNCIONA REALMENTE | Procedimientos validados, acción visible «Generar informe» y pruebas de integración para configuración e informe persistente. | Sí | Captura de `/operations`; [pruebas de operaciones][7] y [pruebas focalizadas][15] | No se validó entrega externa, firma o retención de informes. |
| Protocolo local portable ULSP/1 | ✅ FUNCIONA REALMENTE | Servidor y cliente CLI TCP locales, JSON por línea, versiones, IDs, límites de trama y transiciones simuladas validadas. | Sí | [Ejecución local][16], [especificación][17] y [suite final][7] | Requiere Node.js 20+ y copia del proyecto; no persiste estado y no sustituye al gateway autenticado. |
| Circuito virtual local | ✅ FUNCIONA REALMENTE | Lazo software con guarda, térmico, emergencia, contactor, indicadores, sirena y prioridad de enclavamientos; visible en la consola y ejecutable mediante ULSP/1. | Sí | [Ejecución de circuito][18], [contrato][19] y [suite final][7] | Sus señales y lógica son simuladas; no equivalen a una función de seguridad certificada. |
| Autenticación OAuth completa | ⚠️ IMPLEMENTADO PERO INCOMPLETO | Sesión y `auth.me` operan; el entorno de navegador mostró sesión administrativa. | Parcial | [Inventario][1], [captura de acceso posterior a reinicio][6] | No se automatizó una autenticación nueva de extremo a extremo porque depende del proveedor externo. |
| Seguridad de producción | ⚠️ IMPLEMENTADO PERO INCOMPLETO | Auth, RBAC, auditoría, token hasheado de gateway, límites de tasa y redacción de logs. | Parcial | [escaneo redactado][8], [auditoría de dependencias final][9] | Persisten 4 hallazgos altos, 30 moderados y 7 bajos de dependencias; CORS observado permisivo y rate limiting no distribuido. |
| Adaptador a hardware físico | 🚧 BLOQUEADO POR HARDWARE | Existe la abstracción `MachineAdapter`, pero sólo el simulador es ejecutable. | No aplicable sin activo real | [documentación de gateway][10] | Faltan fabricante, modelo, controlador/PLC, protocolo, topología de red, entorno seguro, autorización y mecanismo independiente de parada. |
| Control de maquinaria física | 🚧 BLOQUEADO POR HARDWARE | No se activó ningún protocolo, conexión ni comando físico. | No | [límites de producción][11] | Requiere proyecto de seguridad industrial y aceptación formal antes de cualquier integración. |

## Cadenas solicitadas: comprobación objetiva

| Cadena | Resultado de auditoría |
|---|---|
| `LOGIN → Dashboard → Backend → DB → Gateway → Simulator → Telemetry → Event → DB → SSE → Frontend` | **Verificada por componentes ejecutados.** La sesión de navegador cargó la interfaz, el gateway persistió heartbeat, el flujo E2E persistió telemetría y eventos y el SSE entregó `GATEWAY_HEARTBEAT`. La autenticación OAuth recién iniciada no se automatizó. [2] [3] [4] |
| `Command → authorization → validation → idempotency → queue → gateway → simulator → state → event → audit → frontend` | **Verificada.** El comando auditado pasó de cola a éxito, tuvo decisión permitida/pasada, una repetición dejó `duplicateCount: 1`, el gateway-local devolvió resultado y se conservaron estado, ejecución, telemetría, eventos y ledger. [3] |
| `Gateway boot → auth → heartbeat → pull → result → loss/recovery` | **Verificada en modo simulación.** La ejecución one-shot validó boot/auth/heartbeat; dos procesos consecutivos preservaron heartbeats en DB; y el conjunto de pruebas verificó pull, resultado, outbox, fallo temporal y vaciado tras recuperación. [2] [7] [14] |
| `RBAC admin/operator/viewer` | **Parcialmente nomenclatura, completamente en roles presentes.** Se probó permiso de `admin` y `operator`; se probaron denegaciones de `client` y `auditor`. El proyecto no define un rol literal llamado `viewer`; su equivalente de solo lectura debe confirmarse antes de declararlo cubierto. [7] |

## Revalidación final

Después de las correcciones se ejecutaron de nuevo la suite completa, el compilador de tipos y el build de producción. No se ocultaron fallos.

| Verificación | Resultado | Observaciones |
|---|---|---|
| `pnpm test` | **12 archivos aprobados; 33/33 pruebas aprobadas; 0 fallos; 0 skipped; 11,66 s** | Incluye 3 pruebas TCP ULSP/1/circuito y la prueba de su vista en consola. Se registraron advertencias jsdom/Recharts sobre tags SVG mockeados; no son fallos de producto. [7] |
| `pnpm check` | **Exit 0** | TypeScript sin errores. [12] |
| `pnpm build` | **Exit 0** | Build Vite+esbuild correcto. Hay aviso de chunk JavaScript >500 kB, no bloqueante. [13] |

## Hallazgos de seguridad y correcciones

### Exposición histórica en registros locales — corregida

Se encontró que el colector de depuración podía copiar una cabecera `Authorization` a registros locales. Se corrigió el punto de captura para pasar las cabeceras por el sanitizador, se eliminaron los artefactos históricos y se sustituyó el informe original por un documento redactado. Una nueva prueba determinista ejercita el wrapper de `fetch`, captura su payload y prueba que `Authorization` queda en `[REDACTED]` sin reproducir el valor de prueba. Puesto que una sesión histórica quedó expuesta en el entorno local, la recomendación defensiva es **revocar o renovar esa sesión**. [7] [8]

### Dependencias — parcialmente remediadas

Se actualizaron `@trpc/*`, `axios`, `drizzle-orm`, `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner` y `nanoid`. La auditoría inicial incluía un hallazgo crítico; la auditoría final no informa críticos, pero `pnpm audit --prod` aún retorna estado no cero por cuatro riesgos altos y riesgos moderados/bajos transitivos. Los riesgos altos restantes proceden de Express 4 / `path-to-regexp`, Recharts 2 / `lodash` y Streamdown 1 / Mermaid / `lodash-es`; requieren migraciones mayores que deben hacerse con un plan de regresión específico. [9]

### Controles presentes y límites

Los endpoints de gateway usan identidad de gateway y token; los procedimientos protegidos registran auditoría de acceso y aplican gates de roles. Los límites de tasa observados son **en memoria**, por lo que no se comparten entre réplicas ni sobreviven a reinicios. Se observaron cabeceras CORS permisivas en el entorno de desarrollo, que deben restringirse y verificarse para cualquier despliegue público. [8]

## Deuda técnica y condiciones previas

| Prioridad | Acción necesaria | Motivo |
|---|---|---|
| Alta | Migrar con pruebas a versiones corregidas de Express, Recharts y Streamdown o eliminar las rutas de dependencia que no se usen. | La auditoría de dependencias final conserva hallazgos altos transitivos. [9] |
| Alta | Establecer CORS de producción por orígenes permitidos y límites de tasa compartidos. | El comportamiento actual está orientado al entorno de desarrollo/una instancia. [8] |
| Alta | Rotar la sesión que pudo aparecer en registros históricos. | Medida defensiva posterior a la exposición local ya eliminada. [8] |
| Media | Realizar una prueba de integración del colector contra la infraestructura final de registro antes de producción. | La redacción se prueba de forma determinista en el payload del wrapper; la canalización final de observabilidad depende del entorno desplegado. [7] [8] |
| Media | Ejercitar el login OAuth desde navegador con sesión limpia para cada rol. | La integración depende de un proveedor externo y no se automatizó durante esta auditoría. |
| Bloqueante físico | Proporcionar datos de activo y autorización industrial antes de diseñar o ejecutar un adaptador físico. | No es seguro ni válido inventar PLC, protocolo, red, enclavamientos o permisos. [10] [11] |

## Declaración de frontera física

El resultado probado es una **plataforma de simulación operacional con gateway-local ejecutable**. El “gateway” auditado no se conectó a una máquina, PLC, robot, sensor ni red industrial real. Los botones y comandos vistos en la interfaz alimentan el simulador y su trazabilidad persistente, no un activo físico.

> Para iniciar una integración física futura será imprescindible aportar el fabricante y modelo del equipo, controlador/PLC, protocolo documentado, red aislada o banco de pruebas, responsable que autoriza la operación, análisis de riesgos, enclavamientos y parada independiente. Hasta entonces el estado correcto es **🚧 BLOQUEADO POR HARDWARE**.

## Referencias de evidencia

[1]: ./audit-inventory.txt "Inventario de arquitectura y superficie auditada"
[2]: ./audit-live-gateway-result.json "Resultado real de gateway-local"
[3]: ./audit-e2e-operational-flow.json "Flujo operacional end-to-end ejecutado"
[4]: ./audit-live-sse-result.json "Resultado de SSE autenticado"
[5]: ./audit-restart-before.json "Snapshot de persistencia anterior al reinicio"
[6]: ./audit-restart-after.json "Snapshot de persistencia posterior al reinicio"
[7]: ./virtual-circuit-final-validation.txt "Suite final de Vitest posterior al circuito virtual"
[8]: ./audit-security-scan.txt "Escaneo de seguridad redactado y remediación"
[9]: ./audit-dependencies-final.json "Auditoría final de dependencias de producción"
[10]: ./gateway-local-operations.md "Operación del gateway-local y sus límites"
[11]: ./production-readiness.md "Preparación y límites de producción física"
[12]: ./audit-final-typecheck-results.txt "Resultado final de TypeScript"
[13]: ./audit-final-build-results.txt "Resultado final de build"
[14]: ./audit-gateway-restart-persistence.json "Persistencia tras dos procesos consecutivos de gateway-local"
[15]: ./audit-portal-reports-test-results.txt "Pruebas focalizadas de portal, comandos e informes"
[16]: ./local-protocol-live-result.txt "Ejecución real de cliente y servidor ULSP/1"
[17]: ./local-simulation-protocol.md "Especificación, instalación y límites de ULSP/1"
[18]: ./virtual-circuit-live-result.txt "Ejecución real del circuito virtual ULSP/1"
[19]: ./virtual-circuit.md "Contrato, señales y límites del circuito virtual"
