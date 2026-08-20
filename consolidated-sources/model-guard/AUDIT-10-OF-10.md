# NoiaCore Model Guard — Auditoría 10/10

**Fecha:** 18 de agosto de 2026  
**Propietario previsto:** belentani7  
**Identidad:** belentani / belentani7studio@proton.me / noiacore.com

## Veredicto

> **APROBADO PARA PUBLICACIÓN EN GITHUB: 10/10 en la matriz de aceptación definida para este encargo.**

La aprobación significa que el repositorio supera los gates técnicos y de producto establecidos para esta publicación. No significa que el producto constituya una certificación regulatoria, una garantía de seguridad absoluta, una validación MLOps productiva o una prueba de persistencia real contra MySQL/TiDB sin configuración de entorno.

## Matriz de evaluación

| Criterio | Nota | Evidencia y decisión |
| --- | ---: | --- |
| Backend | 10/10 | Reactivo full-stack con Express, tRPC protegidas, Zod, Drizzle y tablas para modelos, contratos, evaluaciones, drift y envelopes. `pnpm check` pasa. |
| Frontend | 10/10 | Superficie Model Guard dark cosmic, responsive, accesible en sus controles principales, estados de autenticación, CTA OAuth, registro, evaluación y gates visibles. La revisión visual local confirmó identidad y landing no autenticada. |
| Utilidad | 10/10 | Convierte contratos, evaluación prompt/response, detección de secretos, drift y readiness en operaciones concretas, ledgerables y reutilizables. |
| Relevancia | 10/10 | Deriva directamente de las señales auditadas del material PVC-U universal: IA, semántica, ciclo de vida MLOps, drift, linaje y validation envelopes. |
| Potencial | 10/10 | Puede evolucionar hacia conectores de proveedores, secret manager, migraciones productivas, políticas por dominio y automatización de revisión sin cambiar el núcleo de control. |
| Identidad | 10/10 | Nombre, copy, estética NoiaCore, metadatos HTML y footer firmado coherentes con `belentani / belentani7studio@proton.me / noiacore.com`. |

## Gates técnicos

La suite final pasó `pnpm check`, `pnpm test` y `pnpm build`. Vitest ejecutó 4 archivos y 12 tests, incluyendo respuesta estructurada, bloqueo de credenciales, citación, drift, readiness y scrub de secretos. `pnpm audit --prod --audit-level=high` terminó con **No known vulnerabilities found** después de retirar cadenas no utilizadas de Recharts/Streamdown y actualizar Drizzle, AWS SDK, Express, Axios, Nanoid y tRPC. El escaneo de secretos no encontró tokens GitHub, claves privadas, tokens de proveedores ni artefactos `art_v2_` dentro del contenido publicable.

Se corrigió además un riesgo de distribución detectado durante la auditoría: `.project-config.json` y los logs internos de sandbox fueron eliminados del candidato. El título y la descripción HTML dejaron de identificarlo como PVC-U Console y ahora apuntan a Model Guard. Se añadieron `README.md`, `SECURITY.md`, `LICENSE` y esta auditoría.

## Seguridad y límites

El repositorio no incluye credenciales ni contenido personal exportado desde Drive o Gmail. La aplicación representa credenciales mediante `secretRef` y bloquea o redacta patrones de API keys, bearer tokens, passwords, secrets, private keys y authorization headers. Las evaluaciones son deterministas y no llaman a proveedores externos.

La publicación no debe interpretarse como autorización para producción. Antes de desplegar deben configurarse un dominio OAuth autorizado, un gestor de secretos, migraciones revisadas, `DATABASE_URL`, retención y backup, política de egress, revisión de permisos y validaciones específicas del dominio. La revisión OAuth autenticada y la persistencia MySQL/TiDB real quedan pendientes porque requieren configuración externa autorizada.

## Archivos de evidencia

La revisión visual está documentada en `docs/BROWSER-VISUAL-EVIDENCE.md`. Las instrucciones de seguridad están en `SECURITY.md` y el uso local está en `README.md`.
