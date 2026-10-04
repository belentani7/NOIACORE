# Gateway local UAOL–Máquina Realm

Este proceso es la única capa prevista para una futura comunicación con un equipo físico. La versión distribuida utiliza exclusivamente el adaptador determinista del simulador y se niega a arrancar si se le solicita un modo de hardware.

## Ejecución en simulación

Copie `.env.gateway.example` a un archivo de entorno local, complete el identificador y el token emitidos por el backend, y ejecute `pnpm gateway:dev` desde la raíz. El proceso reporta heartbeats firmados al backend y conserva el límite de simulación.

> Un adaptador físico deberá implementarse y aprobarse de manera independiente. La parada de emergencia física no pertenece a este proceso ni puede depender de una aplicación web.
