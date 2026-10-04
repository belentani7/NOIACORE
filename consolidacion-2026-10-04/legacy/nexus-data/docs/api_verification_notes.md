# Notas de verificación de APIs — NEXUS DATA

- **USAspending API:** la documentación oficial identifica `POST /api/v2/search/spending_by_award/` como endpoint de búsqueda avanzada. Se verificó una llamada HTTP 200 con User-Agent identificable y datos públicos sin clave.
- **Contracts Finder API V2:** la documentación oficial define `POST /api/rest/2/search_notices/json` con `searchCriteria` y `size`; la respuesta usa `noticeList[].item`. Se verificó una llamada HTTP 200 con tres avisos reales y campos de título, descripción, organización, deadline y valor.
- **TED Search API:** la documentación oficial confirma que la búsqueda de avisos publicados es anónima; su Swagger está disponible en `https://api.ted.europa.eu/swagger-ui/index.html#/Search/search`. El endpoint exacto debe tomarse del contrato OpenAPI antes de habilitarlo en producción; una suposición previa sobre `/v3.0/notices/search` devolvió 404 y se considera invalidada.

Todos los conectores deben mantener el User-Agent identificable y un intervalo mínimo de dos segundos por dominio.
