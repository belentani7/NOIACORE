# Investigación open source — NEXUS DATA

## Scrapy
Fuente oficial: https://www.scrapy.org/
La documentación oficial lo presenta como un framework Python open source para extracción a escala, mantenido por Zyte y más de 500 contribuidores, con más de 15 años de desarrollo continuo. Ofrece selectores CSS/XPath, motor asíncrono, throttling, item pipelines para validar/limpiar/almacenar, exportación JSON/CSV/S3, shell interactiva y extensiones. La propia página cita scrapy-playwright para navegador, Spidermon para monitoring y otros add-ons. Es la opción más madura como núcleo Python de extracción y pipelines, pero no ofrece por sí solo un modelo vertical de inteligencia, un panel de negocio ni métricas de recruiting.

## Crawl4AI
Fuente oficial: https://docs.crawl4ai.com/
Crawl4AI es open source y orientado a crawling compatible con LLM, agentes y data pipelines. La documentación incluye crawling profundo/adaptativo, extracción estructurada, generación Markdown, interacción de páginas, estrategias LLM/LLM-free, multi-URL, dispatcher, sesiones y soporte de páginas dinámicas. Su valor diferencial es el navegador + extracción semántica orientada a IA. Riesgos para NEXUS: es más complejo y pesado que necesario para APIs oficiales; algunas capacidades de anti-bot/undetected browser aparecen en la documentación, pero NEXUS no debe activarlas ni usarlas para evadir controles.

## Crawlee
Fuente oficial: https://github.com/apify/crawlee
El repositorio oficial muestra una biblioteca open source para Node.js/TypeScript con HTTP, Cheerio, JSDOM, Playwright y Puppeteer, request queue, browser automation y modos headful/headless; la página mostraba 25.4k estrellas y 1.6k forks al momento de la consulta. Es técnicamente muy sofisticado para crawling general, pero encaja peor con el requisito Python 3.11 y la política de usar httpx para HTTP simple.

## Candidatos iniciales

1. Scrapy: mejor base estructural para NEXUS por Python, madurez, pipelines, throttling y extensibilidad.
2. Crawl4AI: mejor complemento para casos JS/semánticos autorizados, no base del MVP.
3. Crawlee: excelente alternativa si se aceptara TypeScript/Node, pero no se prioriza por desalineación con el stack solicitado.
4. Great Expectations / Soda Core: candidatos para controles de calidad declarativos, pero no sustituyen la capa de adquisición ni la analítica vertical.
5. Dagster: candidato para orquestación futura, pero asyncio + cola es más liviano para el prototipo.
