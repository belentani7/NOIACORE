# Mapa tecnológico Belentani7 — informe final

**Fecha de verificación:** 20 de agosto de 2026. **Alcance:** archivos locales disponibles, repositorios GitHub relacionados, inventario Drive en solo lectura y FORJA v4 operativo. Este informe distingue evidencia ejecutable de documentación, prototipos, snapshots y activos no verificados.

## 1. Mapa general del patrimonio

El patrimonio tecnológico se organiza en cuatro líneas principales. **FORJA** concentra el control plane enterprise y la gobernanza de agentes; **DUCK** concentra Studio/OS, workflows, entregas, plugins, archivos y audio local; **Lúmina** concentra chat, streaming SSE, modelos y protocolo de validación; **NOIACORE** concentra guardas de modelos, validación, ledger y experimentos de plataforma. **Belentani** aporta políticas de agente, automatización y observabilidad operativa. El inventario Drive confirma que los activos están duplicados en HTML, Markdown, ZIP, imágenes, vídeos y documentos, por lo que un nombre de proyecto no se considera por sí solo evidencia de una implementación.

## 2. Proyectos detectados

| Proyecto o familia | Evidencia | Estado real |
|---|---|---|
| FORJA v4 operacional | `/home/ubuntu/forja-enterprise`, esquema Drizzle, router enterprise, 10 archivos de test y build passing | Implementado |
| FORJA v4 blueprint | `/home/ubuntu/forja_v4_enterprise`, módulos TypeScript/Rust y comentarios de integración futura | Experimental/documentación |
| FORJA v3 | `/home/ubuntu/forja_v3`, Next/React/Prisma/Socket.IO/NextAuth/Zustand | Implementado histórico; no es el runtime actual |
| DUCK ecosystem | `duck-ecosystem/backend/main.py` con SQLite, worker, endpoints CRUD, upload, plugin audit y repository audit | Implementado local; requiere endurecimiento para producción |
| DUCK snapshots | `duck-studio-os-v2`, `duck-studio-os-protected`, `duck-full-studio-pro`, `duck-zion-apex-public`, `duck-ecosystem-inspect`, `duck-2026`, `duck-apps` | Parcial/snapshot; no se fusionan automáticamente |
| Lúmina | `lumina-ai-es/server/chatStream.ts` y módulos de políticas/protocolo | Implementado como backend de chat |
| NOIACORE | `noiacore-model-guard`, `noiacore-lab-audited`, `NOIACORE` | Implementado/parcial según subproyecto; el Java/archivo estático histórico no se asume como backend activo |
| Belentani | `Belentani/server/agentPolicy.ts`, `automation.ts` y tests | Implementado en su repositorio; candidato de Core |

## 3. Inventario de archivos y artefactos

El CSV `ARCHIVOS-POR-PROYECTO.csv` descargado desde Drive contiene **5.837 filas**. El análisis reproducible identificó **2.019 filas** relacionadas con DUCK, FORJA, NOIACORE, Lúmina o Belentani en **16 proyectos**. Los grupos con mayor volumen son `BELENTANI` —696 archivos—, `BELENTANI-JUDAS` —585—, `NOIACORE` —215—, `DUCK-ABRAZO` —153— e `HISTORICO` —140—. La mayor parte del material es archivo documental o export visual, no código compilable. El CSV crudo permanece fuera del repositorio publicado; se conserva localmente para auditoría.

La evidencia resumida se conserva en [`research/ARCHAEOLOGY_FINDINGS.md`](../research/ARCHAEOLOGY_FINDINGS.md), [`research/repo_fact_sheet.tsv`](../research/repo_fact_sheet.tsv) y [`docs/FUNCTIONAL_ASSET_INVENTORY.md`](FUNCTIONAL_ASSET_INVENTORY.md).

## 4. Implementación, documentación, experimental y mock

Se aplicó una taxonomía estricta. **Implementado** exige código ejecutable y una prueba, build, persistencia o contrato verificable. **Parcial** significa que la ruta real depende de opcionales, deployment o una integración ausente. **Experimental** identifica blueprints como el verificador Rust/Wasm y la sincronización Yjs/MLS de FORJA v4. **Documentación** identifica planes, READMEs y mapas sin ruta ejecutable. **Mock** sólo se usa para datos o UI no sustentados por persistencia; los seeds controlados de FORJA se etiquetan como preview y no como producción. **No verificado** se conserva cuando no existe evidencia suficiente, por ejemplo un motor Search común.

## 5. Fortalezas demostradas

FORJA tiene aislamiento por organización, RBAC server-side, políticas con tres efectos, Merkle audit logs, hash SHA-256, firmas Ed25519, WAL durable, estado E2EE persistido, graph scope por workspace, plugins con digest/signature metadata, seguridad y observabilidad estructurada. DUCK aporta una ruta local real para persistencia, tareas, entrega de archivos y auditoría metadata-only. Lúmina aporta una frontera de streaming con rate limit, trace ID y envelopes. NOIACORE aporta reglas tipadas, scoring de riesgo y hash de ledger. Belentani aporta límites de agente y revisión humana para acciones sensibles.

## 6. Piezas reutilizables seleccionadas

| Componente | Origen | Destino Core | Prueba |
|---|---|---|---|
| Ledger canónico SHA-256/Ed25519 | FORJA `enterpriseData.ts` | `packages/belentani-core/src/ledger.ts` | FORJA crypto tests y Core test |
| Validation rules + risk score | NOIACORE Model Guard `server/validation.ts` | `validation.ts` | Core test |
| Agent limits + human review | Belentani `server/agentPolicy.ts` | `agent-policy.ts` | Core test |
| Trace IDs + envelopes | Lúmina `server/chatStream.ts` | `trace.ts` | Core test; trace integrado en logs FORJA |
| Metadata-only repository audit | DUCK `backend/main.py` | `repository-audit.ts` | Core test; ejecución explícitamente bloqueada |

No se extrajeron workers, UI, bases de datos, OAuth, WASI, MLS/Yjs ni DSP Python porque tienen límites de runtime o contratos de producto.

## 7. Arquitectura Belentani Core

Belentani Core es una capa TypeScript de contratos puros, sin UI, DB, OAuth, credenciales ni servidor HTTP. FORJA la consume directamente para su ledger y trace IDs; el paquete también puede consumirse de forma independiente. La arquitectura detallada está en [`docs/BELENTANI_CORE_ARCHITECTURE.md`](BELENTANI_CORE_ARCHITECTURE.md) y el paquete incluye README, licencia MIT, declaraciones TypeScript, Vitest y `package.json`.

## 8. AI, agentes, tools y seguridad

El límite de agente es de 4.000 caracteres por mensaje y 12 mensajes de historial; términos sensibles como legal, salud, financiero, credenciales, publicar, enviar o acciones externas fuerzan revisión humana. El logger enterprise registra servicio, evento, timestamp, trace ID, ruta, tipo, organización, rol, duración, outcome y error code, sin payload ni secretos. El control plane aplica organization ownership en lecturas y mutaciones, y las mutaciones críticas quedan sujetas a ALLOW, REQUIRE_HUMAN_APPROVAL o DENY.

## 9. Database, persistencia y sincronización

FORJA usa Drizzle/MySQL/TiDB y migraciones aditivas. Las tablas enterprise incluyen organizaciones, workspaces, miembros, políticas, auditoría, plugins, trusted keys, jobs, WAL, eventos, graph, token usage y tool metrics. La migración `0006_aberrant_killer_shrike.sql` añadió índices compuestos para rutas por organización/workspace/analytics. DUCK usa SQLite local con worker en proceso, por lo que no se presenta como persistencia durable multi-tenant. E2EE status, peers y vector clock se derivan de registros de workspace en FORJA; MLS/Yjs del blueprint permanece experimental.

## 10. Riesgos, dependencias y secretos

La búsqueda estática no encontró archivos rastreados `.env`, claves PEM/KEY ni valores que coincidieran con los patrones de credenciales inspeccionados. Esto no sustituye un escáner especializado de secretos. `pnpm audit` y `pnpm audit --prod` sí reportaron advisories del registry; el informe de producción registró 81 advisories agregados —10 low, 49 moderate, 21 high y 1 critical— en el momento de consulta. No se aplicaron actualizaciones masivas a ciegas. El triage de advisories críticos/high debe preceder a cualquier release con umbral de dependencias limpio. Evidencia: [`docs/SECURITY_DEPENDENCY_AUDIT.md`](SECURITY_DEPENDENCY_AUDIT.md).

## 11. Organización de GitHub

Se publicaron dos repositorios privados bajo `belentani7` sin destruir originales:

| Repositorio | URL | Rama | Commit verificado |
|---|---|---|---|
| FORJA operacional | [belentani7/forja-enterprise](https://github.com/belentani7/forja-enterprise) | `main` | `5714e94d1cf4d06dbb899e63c28d74e9d757ec5b` |
| Core extraído | [belentani7/belentani-core](https://github.com/belentani7/belentani-core) | `main` | `1ebc8f644cabb964b9b66b5aba4aa711d049c5b7` |

Los 14 clones históricos se preservaron fuera del proyecto en `/home/ubuntu/forja-archaeology-clones`; los CSV y metadatos crudos de Drive/GitHub no se subieron.

## 12. Tests, builds y verificación

FORJA pasó `pnpm check`, `pnpm test` y `pnpm build`: **10 archivos de test y 25 tests** pasan; el build Vite/esbuild termina correctamente con una advertencia de chunk grande, no un error. El paquete Core pasó TypeScript, build y su test aislado: **1 archivo y 2 tests**. La integración de ledger conserva los tests criptográficos de FORJA. La verificación visual desktop/mobile quedó documentada en [`docs/FINAL_VISUAL_VERIFICATION.md`](FINAL_VISUAL_VERIFICATION.md).

## 13. Pendientes reales

Los pendientes no son ficticiamente cerrados. Primero, hacer triage y actualización controlada de las vulnerabilidades de dependencias, empezando por la crítica y las high de runtime. Segundo, definir el contrato de Search —textual, semántico o de repositorios— antes de construirlo. Tercero, integrar y probar un worker durable multi-tenant si DUCK deja de ser local. Cuarto, convertir el blueprint Rust/Wasm y Yjs/MLS en rutas compilables y aisladas, sólo si existe un caso de producto y un entorno de prueba real.

## 14. Conclusión consolidada

La arquitectura resultante no es una fusión indiscriminada: conserva FORJA como control plane operativo, DUCK como línea de Studio/OS local, Lúmina como superficie de conversación y NOIACORE como familia de guardas/model governance. Belentani Core reúne únicamente contratos pequeños con evidencia y pruebas: ledger, validación, políticas de agentes, trazas y auditoría metadata-only. La publicación queda organizada en dos repositorios privados, los originales permanecen intactos y el mapa declara explícitamente qué funciona, qué es parcial, qué es experimental y qué todavía no está verificado.
