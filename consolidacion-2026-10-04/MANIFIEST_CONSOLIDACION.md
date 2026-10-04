# Consolidacion noiacore - consolidacion-2026-10-04

- Fuente local: `C:\Users\USER\Documents\09_ARCHIVO\GITHUB_CONSOLIDACION\_stage_v2\noiacore`
- Repositorio: `belentani7/NOIACORE`
- Rama: `consolidacion/2026-10-04`
- Ficheros transferidos: **2480** (31896988 bytes)
- Ficheros inspeccionados en origen: **2660**
- Ficheros excluidos: **180**
- Generado: 2026-10-04 22:12

## Motivos de exclusion

- extension-no-permitida: 154
- nombre-denegado: 12
- extension-denegada: 12
- vacio: 2

## Ficheros excluidos de forma explicita (material sensible)

- `(ninguno)`

## Control de secretos

Escaneado con clasificador determinista (fichero, linea, regla, veredicto).
Los hallazgos marcados REAL en codigo son credenciales de ejemplo de tests y
docker-compose (`live-token`, `duckpass123`, `top-secret`, `DEMO_KEY`, `pass`).
Las coincidencias de `AKIA...`, `AIza...`, `sk-`, `ghp_` y `xox...` que aparecen
en el arbol estan dentro de payloads base64 de imagenes embebidas o son
definiciones de escaneres en ficheros `ci.yml` y `verify-spec.ps1`.
