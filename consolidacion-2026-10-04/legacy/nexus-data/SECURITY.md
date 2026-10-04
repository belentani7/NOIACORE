# Seguridad de NEXUS DATA

## Principios operativos

NEXUS DATA consulta únicamente datos públicos o APIs oficiales configuradas de forma explícita. Cada fuente debe respetar sus términos, `robots.txt` cuando corresponda, límites de uso y una cadencia mínima de **una petición cada dos segundos por dominio**. El producto no implementa bypass de CAPTCHA, evasión de controles de acceso ni scraping de fuentes prohibidas.

Las credenciales nunca se guardan en YAML, SQLite, exportaciones, logs o repositorio. Use variables de entorno para claves necesarias. La capa LLM está desactivada por defecto y solo se habilita con `NEXUS_ENABLE_LLM=true` y una clave configurada conscientemente.

## Reporte de vulnerabilidades

No publique secretos, datos personales o instrucciones de abuso en issues. Envíe una descripción reproducible, impacto y pasos de mitigación al canal de seguridad definido por el operador del despliegue. Si se confirma el hallazgo, se priorizará una corrección, prueba de regresión y nota de release.

## Límites del prototipo

El score de NEXUS DATA no es asesoramiento legal, no establece elegibilidad y no predice adjudicaciones. Antes de actuar sobre una oportunidad, un usuario debe revisar las condiciones oficiales, los lotes, las certificaciones, la capacidad de entrega y las restricciones aplicables.
