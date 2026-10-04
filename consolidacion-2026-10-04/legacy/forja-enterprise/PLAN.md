# PLAN — actualización portable y verificable

| Hito | Estado | Evidencia de cierre | Riesgo | Plan alternativo |
|---|---|---|---|---|
| 1. Crear brief, plan y decisiones | Hecho | `PROJECT-BRIEF.md`, `PLAN.md` y `DECISIONS.md` creados y contrastados con el estado actual | Documentación desalineada con código | Contrastar con tests, `todo.md` y docs existentes |
| 2. Auditar UI, a11y, rendimiento, tests y dependencias | Hecho | Capturas 1440/768/360, revisión estática a11y, `check`, 25 tests, build y audit prod registrados en `QUALITY_AUDIT_2026-08-22.md` | Métricas imposibles de reproducir | Declarar “no verificado” y documentar el método requerido |
| 3. Crear README, handoff y checkpoint operativo | Hecho | README, HANDOFF, CHECKPOINT y manifest de empaquetado creados con rutas y comandos reales | Dependencia de conocimiento de sesión | Referencias cruzadas a rutas y scripts reales |
| 4. Generar ZIP portable | Hecho | ZIP de 215 entradas, 370 KB y SHA-256 registrado; inspección libre de rutas prohibidas | Inclusión accidental de secretos o artefactos grandes | Lista blanca de archivos y exclusión de `node_modules`, `dist`, clones y raws |
| 5. Verificar, checkpoint y sincronizar GitHub | Hecho | Checkpoint portable guardado y `main` privada verificada con paridad local/remota antes del cierre final | Build/commit fallido | Revisar logs, corregir y repetir la prueba afectada |

## Criterio de terminación

El trabajo termina cuando cada hito esté marcado **Hecho** con output verificable, el ZIP contenga los archivos portables requeridos, el proyecto pase los comandos de validación y los límites no cumplidos estén descritos sin ambigüedad.
