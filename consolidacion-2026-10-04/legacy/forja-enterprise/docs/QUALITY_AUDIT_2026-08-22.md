# Auditoría de calidad — 2026-08-22

## Método y límites

La auditoría usa evidencia reproducible del proyecto: capturas del dashboard, comandos del repositorio, tests existentes y el output de build. Una captura visual no sustituye pruebas manuales de teclado, un escáner WCAG o una medición Lighthouse; esos elementos se marcan como **no verificados** si no existe output correspondiente.

## Revisión visual inicial

| Viewport | Resultado observado | Estado |
|---|---|---|
| 1440 × 1080 | Dashboard oscuro coherente, sidebar persistente, tarjetas y jerarquía de telemetry legibles; los paneles vacíos usan copy técnico y no placeholders genéricos | Verificado por captura |
| 360 × 800 | La sidebar se colapsa a menú, las tarjetas se apilan, los CTAs siguen visibles y no se observa overflow horizontal ni clipping en la captura completa | Verificado por captura |
| 768 × 1024 | La navegación se mantiene colapsada, las métricas forman dos columnas y los paneles conservan espaciado y texto legible sin clipping observado | Verificado por captura |

El review visual independiente recomienda reforzar una firma de marca FORJA —sello criptográfico/industrial y motivos de ledger/FSM— sin convertir el control plane en una landing o afectar la densidad operativa. Es una mejora de diseño priorizable, no una prueba de cumplimiento.

## Criterios de aceptación conocidos

| Criterio | Estado actual | Evidencia o límite |
|---|---|---|
| TypeScript estricto | Verificado | `pnpm check` terminó correctamente el 2026-08-22 |
| Tests automatizados | Verificado | `pnpm test` terminó con 10 archivos y 25 tests passing el 2026-08-22 |
| Build de producción | Verificado con warning | `pnpm build` terminó correctamente; Vite advirtió que existe un chunk JavaScript superior a 500 KB minificado |
| Navegación responsive | Parcialmente verificado | Capturas 1440 y 360; falta tablet |
| Señales de accesibilidad | Parcialmente verificado | Código con `aria-modal`, `aria-live`, `aria-current`, labels de botones, `role=alert/status`, foco visible y `prefers-reduced-motion` |
| WCAG 2.1 AA completo | No verificado | No hay auditoría automatizada WCAG nueva ni prueba de teclado end-to-end en esta actualización |
| Lighthouse >90 | No verificado | No existe salida Lighthouse reproducible en el repositorio |
| Bundle <200 KB gzip | No cumple | El último build conocido reportó aproximadamente 335 KB gzip para el JS principal; el asset presente mide 1.326.845 bytes sin comprimir |
| Dependencias de producción | No cumple un umbral “sin advisories” | `pnpm audit --prod --json` devolvió exit 1: 81 advisories agregados —10 low, 49 moderate, 21 high y 1 critical—; el resumen actual está en `research/forja_pnpm_audit_prod_2026-08-22.summary.json` |

## Decisión de calidad

No se declaran Lighthouse >90, WCAG AA completo, bundle <200 KB ni un estado de dependencias sin advisories como cumplidos. La documentación de entrega debe conservar esos límites y proponer mediciones/optimización concretas en lugar de maquillar el resultado.
