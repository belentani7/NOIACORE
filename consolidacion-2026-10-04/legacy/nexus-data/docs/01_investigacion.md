# NEXUS DATA — Investigación de mercado y decisión de nicho

**Autor:** Manus AI  
**Fecha:** 19 de agosto de 2026  
**Decisión:** iniciar con **inteligencia de contratación pública para pymes tecnológicas y de servicios profesionales**, usando exclusivamente APIs y datos publicados por organismos públicos.

## Resumen ejecutivo

El scraping horizontal está cada vez más empaquetado como API, navegador gestionado o flujo no-code. La oportunidad de NEXUS DATA no es vender más peticiones, sino convertir avisos dispersos en una lista priorizada de oportunidades: encaje por sector, tamaño, fecha límite, comprador, señales de competencia y probabilidad de que una pyme pueda presentar oferta.

La contratación pública es un mercado suficientemente grande para justificar una vertical: en 2023 representó el **12,7% del PIB en la OCDE** y el **14,8% del PIB en los países OCDE-UE** [1]. En la UE, la Comisión indica que equivale aproximadamente al **15% del PIB**, mientras que sus indicadores muestran que la participación de pymes y la división en lotes son variables relevantes para la accesibilidad del mercado [2].

## Competidores

| Competidor | Precio público observado | Fortaleza | Debilidad estructural | Qué no cubre bien para NEXUS DATA |
|---|---:|---|---|---|
| **Apify** | Gratis con 5 USD de uso; Starter 29 USD; Scale 199 USD; Business 999 USD, más uso [3] | Ecosistema de Actors, API, almacenamiento, programación y flexibilidad para desarrolladores | El coste y el resultado dependen del Actor y de recursos consumidos; el usuario debe ensamblar la solución | No entrega por defecto taxonomía de contratación, scoring de encaje, explicación de por qué una oportunidad es accionable ni benchmarking por comprador |
| **Bright Data** | La página de Web Scraper API enfatiza pago por registros entregados y escalado por volumen; incluye renderizado JS, proxies, validación y geotargeting [4] | Infraestructura de recopilación de alto volumen y cobertura de sitios difíciles | Optimiza entrega técnica y cobertura; el uso de proxies/CAPTCHA introduce superficie legal y de cumplimiento que NEXUS no necesita | No es una aplicación vertical de inteligencia para pymes ni una capa de decisión sobre licitaciones |
| **ScrapingBee** | Hobby 19,99 USD/mes por 75.000 créditos; Freelance 49,99 USD; Startup 99,99 USD; Business 249,99 USD [5] | API sencilla con créditos, concurrencia y renderizado | Modelo centrado en créditos/peticiones; requiere construir extracción, esquema y análisis aparte | No cubre normalización de avisos, deduplicación entre portales, alertas de oportunidad ni análisis competitivo |
| **Import.io** | Standard 199 USD/mes anual por 50.000 consultas; Professional 399 USD por 200.000; Advanced 699 USD por 500.000; prueba de 5.000 consultas [6] | No-code, extracción gestionada, webhooks y opción empresarial | Más caro para un prototipo; sigue siendo una plataforma de extracción y el conocimiento vertical se vende como capa adicional | Su propia oferta separa extracción de la capa de pricing intelligence; no está especializada en contratación pública para pymes |
| **Octoparse** | Plan gratuito con 10 tareas; complementos de proxies residenciales, CAPTCHA y servicio de datos desde 599 USD [7] | No-code de escritorio/nube, exportaciones a CSV/JSON/bases de datos y programación | La riqueza funcional se paga por tareas, dispositivos, ejecuciones cloud y complementos; la operación puede volverse frágil frente a cambios | No proporciona de serie un grafo de compradores, scoring de elegibilidad ni un informe de acción comercial |

La comparación muestra un patrón común: las cinco compañías compiten principalmente en **captura, ejecución y entrega de filas**. Incluso cuando ofrecen validación o parsing, la decisión de negocio permanece fuera del producto. El posicionamiento de NEXUS DATA debe ser explícitamente distinto: menos fuentes, pero una taxonomía y una señal accionable mejores.

## Tres nichos candidatos

| Nicho | Datos públicos/API | Decisión que habilita | ROI potencial | Riesgo de entrada |
|---|---|---|---|---|
| **Contratación pública para pymes** | TED Search API, Contracts Finder API, SAM.gov Opportunities API, portales OCDS | Qué licitaciones encajan, cuáles vencen pronto, qué compradores compran una categoría y dónde competir | Alto: una sola oportunidad ganada puede pagar meses de suscripción; reduce horas de vigilancia y prelectura | Medio: esquemas heterogéneos y reglas de elegibilidad por jurisdicción |
| **Precios y disponibilidad inmobiliaria** | Registros catastrales, estadísticas oficiales, portales con APIs autorizadas | Comparar precio/m², liquidez, alquiler y anomalías por zona | Alto para brokers, fondos y operadores; el valor depende de cobertura local | Alto: muchos portales tienen ToS restrictivos y los datos transaccionales son fragmentados |
| **Mercado de empleo tecnológico** | BLS Employment Projections, APIs oficiales de empleo y feeds autorizados | Detectar demanda de skills, salarios y concentración de contratación | Medio-alto para staffing, formación y venta B2B | Medio-alto: deduplicación de anuncios, sesgo de portales y cambios frecuentes de taxonomía |

## Recomendación

Se recomienda **contratación pública para pymes tecnológicas y de servicios profesionales**, comenzando por un corredor anglófono y europeo con tres conectores: Estados Unidos (SAM.gov), Unión Europea (TED) y Reino Unido (Contracts Finder). La elección es deliberada por cuatro razones.

Primero, el gasto es macroeconómicamente grande y recurrente: 12,7% del PIB de la OCDE y cerca de 15% del PIB de la UE [1] [2]. Segundo, el comprador ya está obligado a publicar una parte sustancial de la información, lo que permite un producto conforme sin depender de evasión técnica. SAM.gov documenta un API de oportunidades con paginación y clave pública [8]; TED permite acceso anónimo a servicios que buscan o recuperan avisos publicados [9]; Contracts Finder documenta búsqueda y JSON en su API [10]. Tercero, el dolor es operativo y medible: una pyme debe revisar avisos, interpretar códigos, comparar plazos y filtrar oportunidades inviables. Cuarto, el resultado es accionable: una alerta priorizada puede producir una reunión comercial, una decisión de bid/no-bid o la formación de un consorcio.

El primer producto no debe prometer “ganar licitaciones”. Debe prometer **reducir el tiempo de vigilancia y aumentar la precisión del shortlist**, mostrando siempre la fuente, la fecha, el criterio aplicado y una advertencia de que la elegibilidad final requiere revisión humana.

## Fuentes y cumplimiento

> “The Search API does not require a key.” — documentación del TED API [9]

El prototipo solo usa datos publicados o endpoints oficiales configurables. Cada petición incorpora un User-Agent identificable; el límite predeterminado es de una petición cada dos segundos por dominio; se respeta `robots.txt` cuando se usa HTML; no se implementa bypass de CAPTCHA, rotación evasiva, fingerprinting ni acceso a páginas que prohíban la recopilación. SAM.gov y TED tienen requisitos de API distintos, por lo que las claves se inyectan mediante variables de entorno y nunca se almacenan en el repositorio.

## Referencias

[1]: https://www.oecd.org/en/publications/2025/06/government-at-a-glance-2025_70e14c6c/full-report/size-of-public-procurement_6979cd47.html "OECD — Size of public procurement"
[2]: https://single-market-scoreboard.ec.europa.eu/business-framework-conditions/public-procurement_en "European Commission — Public procurement scoreboard"
[3]: https://apify.com/pricing "Apify pricing"
[4]: https://brightdata.com/pricing/web-scraper "Bright Data Web Scraper API pricing"
[5]: https://www.scrapingbee.com/pricing/ "ScrapingBee pricing"
[6]: https://www.import.io/pricing "Import.io pricing"
[7]: https://www.octoparse.com/pricing "Octoparse pricing"
[8]: https://open.gsa.gov/api/get-opportunities-public-api/ "SAM.gov Get Opportunities Public API"
[9]: https://docs.ted.europa.eu/api/latest/index.html "TED API developer documentation"
[10]: https://www.contractsfinder.service.gov.uk/apidocumentation/V2 "Contracts Finder API V2 documentation"
