# NOIACORE Consolidado

Esta rama toma `NOIACORE` como base porque contiene el producto Java/Spring Boot con API, modelos, repositorios, Dockerfile y páginas estáticas de arquitectura, axiomas, capacidades, casos, fábrica, galería, histórico, iteración, límites y manifiesto.

## Fuentes conservadas

| Fuente | Aporte identificado | Tratamiento |
|---|---|---|
| `NOIACORE` | Backend Java/Spring Boot, API de contactos y proyectos, páginas estáticas y Dockerfile | Base activa de la consolidación |
| `noiacore-model-guard` | Aplicación independiente de protección/model guard con cliente, servidor, pruebas y contratos | Conservado como módulo fuente separado |
| `noiacore-lab-audited` | Laboratorio visual auditado y su experiencia de interfaz | Conservado como módulo fuente separado |
| `noiacore-art-lab` | Aplicación Next/Prisma orientada al laboratorio artístico | Conservado como módulo fuente separado |
| `belentani-core` | Referencias generales de núcleo Belentani | No se incorpora: no hay evidencia suficiente de pertenencia exclusiva a NOIACORE |

## Regla de integración

No se fusionan Java/Spring, Next/Prisma y los servidores Node en una arquitectura artificial. La consolidación conserva cada implementación trazable y documenta sus límites. Cualquier futura integración deberá especificar un contrato de API explícito y pruebas de compatibilidad antes de compartir componentes.
