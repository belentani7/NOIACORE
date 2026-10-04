# Belentani Core

Belentani Core es un conjunto pequeño de contratos TypeScript reutilizables extraídos de activos existentes de FORJA, DUCK, Lúmina, NOIACORE Model Guard y Belentani. Vive dentro del repositorio operativo de FORJA para que su integración sea probada por el mismo `tsc`, Vitest y build; puede extraerse a un repositorio independiente cuando los consumidores adicionales estén definidos.

## Contratos implementados

| Módulo | Origen auditado | Uso | Estado |
|---|---|---|---|
| `ledger.ts` | FORJA `enterpriseData.ts` | Payload canónico, SHA-256 y Ed25519 | Implementado y usado por FORJA |
| `validation.ts` | NOIACORE Model Guard `server/validation.ts` | Reglas tipadas, riesgo, score y redacción | Implementado y probado |
| `agent-policy.ts` | Belentani `server/agentPolicy.ts` | Límites y revisión humana | Implementado y probado |
| `trace.ts` | Lúmina `server/chatStream.ts` | Trace IDs y validation envelopes | Implementado y probado |
| `repository-audit.ts` | DUCK `backend/main.py` | Auditoría metadata-only y bloqueo de ejecución | Implementado y probado |

## Decisiones de frontera

Belentani Core no contiene UI, acceso a base de datos, credenciales, SDK de Manus, workers persistentes ni integraciones específicas de producto. DUCK conserva su worker SQLite y DSP opcional; Lúmina conserva su proxy SSE; FORJA conserva RBAC, tenancy y persistencia enterprise; NOIACORE conserva sus jobs y catálogos. La extracción evita convertir el patrimonio en un monolito.

El contrato de auditoría de repositorios sólo normaliza URLs y genera un digest del origen. No descarga, ejecuta ni instala código. Toda inspección de archivos externos requiere una ruta de metadata-only y aprobación humana posterior.
