# Manifiesto del paquete portable

El ZIP portable se crea por **lista blanca** desde fuera del directorio de la aplicación. Incluye el código fuente, configuración, documentación, pruebas, migraciones, `packages/belentani-core/` y el manifiesto de dependencias. No contiene secretos, `.env`, `node_modules`, `dist`, logs, repositorios clonados, exports crudos de Drive, imágenes grandes de investigación ni credenciales.

| Incluido | Excluido deliberadamente |
|---|---|
| `client/`, `server/`, `shared/`, `drizzle/`, `packages/`, `docs/`, `patches/` | `node_modules/`, `dist/`, `.git/`, `.manus-logs/`, `.project-config.json` |
| `PROJECT-BRIEF.md`, `PLAN.md`, `DECISIONS.md`, `README.md`, `HANDOFF.md`, `CHECKPOINT.md`, `todo.md` | `research/clones/`, `research/drive_master/`, archivos de audit raw con metadatos innecesarios |
| `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, configuración de Vite/Vitest/Drizzle | `.env*`, claves PEM/KEY, bases locales y archivos de almacenamiento |

El paquete no requiere una carpeta `assets/` adicional: no se añadieron assets de producto durante esta actualización y la aplicación usa iconos de dependencias y estilos ya contenidos en la fuente. Si se agregan medios en el futuro, deben almacenarse fuera del proyecto y subirse por el flujo de storage del entorno antes de referenciarlos.

## Artefacto generado

El paquete actual se genera como `/home/ubuntu/forja-deliverables/forja-v4-portable-2026-08-22.zip` y su checksum se guarda de forma externa en `forja-v4-portable-2026-08-22.sha256`. Esta separación evita que el ZIP contenga un hash que cambiaría al incluirse a sí mismo. La inspección de contenido debe confirmar la ausencia de rutas `node_modules`, `dist`, `.git`, `.env`, `.manus-logs`, `drive_master` y `clones`.
