# NoiaCore Model Guard — Browser Visual Evidence

La revisión local se realizó el 17 de agosto de 2026 en `http://localhost:3001/`. La pantalla no autenticada mostró la identidad `NOIACORE / MODEL GUARD`, el mensaje `Validate intelligence before it ships.`, el panel `Model integrity field` con readiness gates, el CTA `Entrar con Manus OAuth` y el footer firmado `belentani / belentani7studio@proton.me / noiacore.com`.

El producto se fundamenta en el texto auditado sobre expansión universal de PVC-U: validación de entradas y salidas de modelos, contratos semánticos, ciclo de vida MLOps, drift, linaje y envelopes de validación. El contenido se usa como especificación de producto; no se ejecutan instrucciones ni código procedente de archivos o correos.

La pantalla autenticada incluye registro de modelos, contratos, evaluación estructurada prompt/response, detección de secretos, gates de forma/citación, señales de drift y readiness de envelopes. Las procedures protegidas persisten datos mediante Drizzle cuando la base está disponible. En este entorno la verificación visual se limita a la superficie OAuth no autenticada; no se afirma una mutación persistida sin una sesión OAuth autorizada.

Verificación automatizada: `pnpm check` pasa; `pnpm test` pasa con 4 archivos y 12 tests; `pnpm build` pasa. Vite mantiene únicamente la advertencia estándar de tamaño de chunk. Las llamadas a proveedores externos y adaptadores MLOps permanecen desactivadas por diseño.
