# Catálogo de herramientas empresariales comparables

## Apify — https://apify.com/
Página oficial consultada el 19/08/2026. El portfolio incluye Apify Store/Marketplace (la página mostraba 61.154 Actors), Actors serverless, integraciones, MCP server, Crawlee open source, proxies, anti-blocking, cloud deployment, monitoring, data processing, SDK, CLI, API reference y templates Python/JavaScript/TypeScript. Casos visibles: TikTok Scraper, Google Maps Scraper, Instagram Scraper, Website Content Crawler, E-commerce Scraping Tool y Facebook Posts Scraper. También ofrece servicios profesionales y construcción/mantenimiento de Actors.

## Bright Data — https://brightdata.com/
Página oficial consultada el 19/08/2026. Portfolio: Unlocker API, SERP API, Browser API, Crawl API, Web Scraper APIs, AI Scraper Studio, Datasets Marketplace, Web Archive, Data Firehose, Bright Insights, Managed Data Acquisition, Deep Lookup, Scrapers de LinkedIn/e-commerce/social media, proxies residenciales, ISP, datacenter, rotativos, proxy servers y ubicaciones. La página agrupa además Data for AI y productos para agentes. Es una suite muy completa de acceso/extracción/datasets, aunque incluye capacidades anti-blocking y stealth que NEXUS debe excluir.

## Zyte — https://www.zyte.com/
Página oficial consultada el 19/08/2026. Portfolio: Zyte API, Ban Handling, AI Extraction, SERP, Enterprise, Scrapy Cloud, Agentic Web Data, Scrapy open source, servicios de datos y datasets por tipo (Product & E-commerce, Data for AI, Job Posting, Real Estate, News & Articles, Search, Social Media). La documentación también muestra extracción automática para e-commerce, artículos y anuncios de empleo. Zyte es especialmente relevante por combinar el ecosistema Scrapy con API, extracción estructurada y entrega gestionada.
## Firecrawl — https://www.firecrawl.dev/
Página oficial consultada el 19/08/2026. Firecrawl se presenta como una API de contexto para agentes: Search, Scrape, Map, Crawl e Interact. Devuelve Markdown, JSON, screenshots y contenido preparado para LLM; ofrece SDK Python/Node, CLI, Skills y MCP. La página enlaza su repositorio open source y afirma que también es open source; el repositorio oficial usa AGPL-3.0 según la búsqueda previa. Es una opción muy relevante para web-to-LLM, pero no reemplaza por sí sola el data plane, la calidad vertical ni el almacenamiento de NEXUS.

## Browserbase — https://www.browserbase.com/
Página oficial consultada el 19/08/2026. Portfolio: Search API, Fetch API, Browser-as-a-Service, sesiones persistentes, APIs/SDKs, Runtime, Identity, Model Gateway, Observability, Stagehand, MCP y plantillas. Está orientado a agentes que navegan e interactúan con sitios, con browser cloud y sesiones paralelas. Las funciones de login/CAPTCHA/“unblock” no son compatibles con las reglas de NEXUS para fuentes públicas; solo sería utilizable para páginas autorizadas y JS pesado sin evasión.
## dbt Labs — https://www.getdbt.com/
La página oficial fue consultada; la extracción textual fue limitada, pero la documentación oficial referenciada en la búsqueda confirma dbt Semantic Layer para definir métricas y resolver joins de forma gobernada. El portfolio relevante incluye dbt Core open source, dbt Cloud, Semantic Layer, Insights/AI, jobs, CI/CD, documentación y adapters para warehouses. dbt no es un extractor web: complementa NEXUS en transformación, métricas y contratos downstream.

## Dagster — https://dagster.io/
Página oficial consultada el 19/08/2026. Portfolio: Data Orchestration, Data Catalog, Data Quality, Cost Insights, Components, Integrations, Enterprise, schedules/sensors/assets y Dagster+. La propuesta central es orquestar, observar y activar pipelines basados en assets, con lineage, dependencias, health signals y checks. Dagster es complementario a Temporal: Dagster gobierna assets/data products; Temporal resuelve workflows durables de actividades externas.
## Airbyte — https://airbyte.com/
Página oficial consultada el 19/08/2026. Portfolio: Data Replication, Connectors, Connector Builder, Low-Code CDK, PyAirbyte, API/CLI/SDK/MCP, Context Store y Agentic Data. La página muestra 20K+ estrellas en GitHub y posiciona Airbyte como plataforma open source de movimiento de datos y capa de contexto para agentes. Es excelente para conectar APIs/bases/destinos, pero no sustituye el extractor web vertical ni la inteligencia de NEXUS.

## Fivetran — https://www.fivetran.com/
Página oficial consultada el 19/08/2026. Portfolio: data movement, 900+ sources/destinations, connectors, activations, managed data lake service, transformations, security, governance, extensibility y hybrid deployment. La web comunicaba una fusión con dbt Labs para infraestructura de agentes. Es una alternativa comercial gestionada a Airbyte y una referencia de fiabilidad/operación, no una base open source para NEXUS.

## Prefect — https://www.prefect.io/
Página oficial consultada el 19/08/2026. Portfolio: Prefect Open Source, Prefect Cloud, flows Python, deployments, work pools, automations, events, schedules, observability, concurrency limits, retries y hybrid execution; también enlaza FastMCP y Prefect Horizon. La página afirma Apache 2.0 para el framework open source. Prefect es una alternativa práctica a Temporal/Dagster para workflows Python y merece evaluarse para el control plane de NEXUS.
