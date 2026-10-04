# DECISIONS — registro de decisiones

| Fecha | Decisión | Justificación | Alternativa descartada |
|---|---|---|---|
| 2026-08-22 | Mantener FORJA como fuente operativa principal | Tiene control plane tRPC/Drizzle, tests y build verificados; los activos v3 y blueprint v4 no sustituyen el runtime actual | Reconstruir desde FORJA v3 o convertir el blueprint experimental en producción |
| 2026-08-22 | Extraer Belentani Core como contratos puros | Ledger, validación, política de agentes, trace y auditoría metadata-only tienen valor transversal y pruebas acotadas | Fusionar DUCK, Lúmina, NOIACORE y FORJA en un monolito |
| 2026-08-22 | Conservar la estética de dashboard enterprise oscuro | La aplicación es un control plane, no una landing; la densidad, el foco y los estados operativos tienen prioridad | Aplicar una hero cinematográfica o scroll storytelling que reduzca la operabilidad |
| 2026-08-22 | No afirmar objetivos de Lighthouse ni bundle <200 KB | El último build reportó JavaScript gzip superior a 200 KB y no existe una medición Lighthouse reproducible en el repositorio | Declarar cumplimiento por el diseño visual sin medición |
| 2026-08-22 | No aplicar `pnpm audit --fix` masivo | Hay advisories de producción y cambios de dependencia pueden romper tRPC/Vite/Drizzle; requieren triage individual | Actualizar todas las dependencias de forma automática |
| 2026-08-22 | Crear ZIP por lista blanca | Impide publicar secretos, `node_modules`, `dist`, clones de investigación o exportaciones crudas de Drive | Comprimir todo el directorio del proyecto |
| 2026-08-22 | Excluir dependencias y builds de forma recursiva en el ZIP | El primer empaquetado detectó `packages/belentani-core/node_modules`; la reconstrucción con exclusiones recursivas produjo un ZIP de 215 entradas sin rutas prohibidas | Confiar sólo en exclusiones de primer nivel |
