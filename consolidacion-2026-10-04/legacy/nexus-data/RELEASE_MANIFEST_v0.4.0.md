# NEXUS DATA — Release Manifest v0.4.0

| Elemento | Valor |
|---|---|
| Versión de aplicación | `0.4.0` |
| Fecha de release | 2026-08-22 |
| Artefacto Windows | `NexusDataSetup-0.4.0.exe` |
| Formato instalador | NSIS PE32 GUI |
| SHA-256 instalador | `176fd528c5027d81e20944abcba33e0107748a3e4afa05cd96cad77ac52a188c` |
| Fuentes live verificadas | USAspending, Contracts Finder V2, City of Chicago Open Data |
| Registros procesados | 60 |
| Oportunidades abiertas accionables | 10 |
| Tests | 12 passed |
| Ruff | All checks passed |
| Bandit | Sin hallazgos |
| pip-audit | Sin vulnerabilidades conocidas |
| Validación Windows | Instalación y desinstalación silenciosa verificadas bajo Wine |

## Contenido de la release

El paquete fuente contiene extractor configurable por YAML, rate limiting por dominio, reintentos, limpieza, deduplicación, tipos de registro, monedas, scoring explicable, LLM opcional con límites, SQLite, CSV/JSON, Streamlit, CLI, pruebas, instalador Linux, Dockerfile, especificación NSIS y documentación.

Los archivos de datos locales, entornos virtuales, secretos y payloads de compilación se excluyen del control de versiones. El instalador Windows se distribuye como artefacto binario separado y su checksum debe verificarse antes de usarlo.
