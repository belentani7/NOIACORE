# Auditoría de seguridad, dependencias y secretos

## Alcance

La auditoría cubrió los clones de los repositorios relacionados disponibles en GitHub, el inventario Drive descargado en modo solo lectura y el proyecto operativo FORJA. Se revisaron nombres de archivos sensibles versionados, patrones de credenciales, manifests y locks, presencia de tests, esquemas, documentación de auditoría y marcadores de mock/placeholder.

## Resultados verificables

| Control | Resultado | Interpretación |
|---|---|---|
| Secretos versionados en los repositorios clonados | No se encontraron archivos rastreados `.env`, claves PEM/KEY o credenciales con el patrón inspeccionado | No prueba ausencia matemática de secretos; requiere escáner especializado antes de cada release |
| FORJA operativo | No contiene nombres de archivos sensibles rastreados | Los secretos siguen dependiendo del entorno gestionado |
| Código DUCK con configuración sensible | `scripts/test_api_config.py` fue marcado para revisión por patrón de configuración; no se imprimió ningún valor | Candidato a inspección manual, no se reutiliza automáticamente |
| `pnpm audit` del proyecto FORJA | Exit 1 con advisories reportados por el registry; el informe incluye vulnerabilidades transitorias en runtime y herramientas | Bloqueo de release si el objetivo exige un umbral de dependencias sin advisories |
| Auditoría de producción | `pnpm audit --prod` reportó 81 advisories agregados: 10 low, 49 moderate, 21 high y 1 critical según el registry consultado | No se afirma cumplimiento ni ausencia de vulnerabilidades; se requiere triage y actualización controlada |
| Build y tests de FORJA tras la extracción | TypeScript pasa; 10 archivos de test y 25 tests pasan | La extracción no rompió los contratos verificados del proyecto actual |

## Dependencias y decisión de no actualizar a ciegas

No se aplicaron actualizaciones masivas automáticas después de `pnpm audit`, porque podrían cambiar el runtime React/tRPC/Vite/Drizzle y crear una regresión no atribuible. Los advisory IDs, módulos y severidades se conservan en `research/forja_pnpm_audit.json` y `research/forja_pnpm_audit_prod.json`. El siguiente paso de seguridad debe ser un triage por paquete, empezando por advisories críticos y de alta severidad que estén en la ruta de ejecución, seguido de `pnpm check`, tests, build y revisión de lockfile.

## Límites de la evidencia

Este documento es un resultado de auditoría estática y de tests locales. No constituye certificación SOC2/FedRAMP/ISO, no prueba seguridad absoluta y no declara que los repositorios históricos sean production-ready. El mapa final debe distinguir implementaciones demostradas, prototipos, snapshots y activos no verificados.
