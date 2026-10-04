# NEXUS DATA — Fase 1: investigación y selección de nicho

**Autor:** Manus AI  
**Fecha:** 19 de agosto de 2026  
**Decisión ejecutiva:** iniciar con **inteligencia de empleo tecnológico remoto en Europa y Latinoamérica**, utilizando APIs públicas y feeds autorizados, no extracción evasiva.

## 1. Tesis de producto

El scraping de propósito general se ha convertido en infraestructura relativamente accesible. Las cinco plataformas analizadas compiten sobre todo en acceso, renderizado, proxies, concurrencia, plantillas y entrega. NEXUS DATA debe competir en una capa distinta: **modelo de datos vertical, normalización, enriquecimiento, métricas comparables y decisiones accionables**.

> La unidad de valor no será “páginas descargadas”, sino “señales de mercado confiables que reducen tiempo de análisis y mejoran una decisión de contratación, precio o inversión”.

## 2. Competidores

| Competidor | Precio público observado | Fortaleza principal | Qué no cubre bien para la tesis de NEXUS | Implicación competitiva |
|---|---:|---|---|---|
| **Apify** | Free $0 con $5 de uso; Starter $29/mes; Scale $199/mes; Business $999/mes. El coste por unidad de cómputo baja de $0.20 a $0.13 según plan. [1] | Plataforma flexible de Actors, marketplace, APIs y ejecución pay-as-you-go. | No entrega por defecto un modelo semántico de nicho, benchmarks operativos ni recomendaciones de negocio. El cliente mantiene extractores y análisis. | NEXUS debe vender resultados y contexto, no capacidad de ejecución. |
| **Bright Data** | Free Tier de 5.000 registros/mes; $1.50/1.000 registros pay-as-you-go; Scale $499/mes con 384.000 registros y $1.30/1.000 adicionales; Enterprise a medida. [2] | Escala, proxies, renderizado, validación, geotargeting y entrega. | Prioriza acceso y volumen. Sus capacidades de proxy/CAPTCHA no forman parte del enfoque de cumplimiento de NEXUS. | Diferenciarse por fuentes autorizadas, trazabilidad y análisis vertical. |
| **ScrapingBee** | Hobby $19.99/mes por 75.000 créditos; Freelance $49.99 por 250.000; Startup $99.99 por 1 M; Business $249.99 por 3 M. JS consume 5 créditos por petición exitosa. [3] | API simple para peticiones, JavaScript, proxies, geotargeting y reglas CSS/XPath. | Es una capa de extracción por petición; no resuelve deduplicación transversal, taxonomía de skills, scoring o inteligencia de mercado. | Ofrecer un producto terminado para un usuario de recruiting, no una API genérica. |
| **Import.io** | Trial $0/30 días con 5.000 consultas; Standard $199/mes anual ($249 mensual), Professional $399 anual ($499 mensual), Advanced $699 anual ($899 mensual), con 50.000/200.000/500.000 consultas mensuales. [4] | Extractores point-and-click, web data gestionada y servicios enterprise. | Precio y orientación enterprise; la semántica y las decisiones sectoriales siguen siendo responsabilidad del cliente. | Entrar por un producto ligero, transparente y de autoservicio para equipos pequeños. |
| **Octoparse** | Free con 10 tareas, 1 dispositivo, 1 usuario, 2 ejecuciones locales, 50.000 filas/mes y exportaciones de hasta 10.000 filas; Standard aparece desde aprox. $69/mes y Professional desde aprox. $249/mes. [5] | No-code, plantillas, extracción local/cloud y exportación multiformato. | El usuario debe mantener tareas y convertir filas en conocimiento; la dependencia de tareas puede generar fragilidad operativa. | La ventaja de NEXUS será un pipeline reproducible y un esquema de negocio estable. |

### Conclusión competitiva

Existe espacio si NEXUS evita competir en “más proxies” o “más páginas por dólar”. El hueco es una solución **vertical, auditable y orientada a decisiones**, con conectores públicos, calidad medible, enlaces a la fuente original, explicación de cada insight y una capa de analítica que ahorre horas de trabajo manual.

## 3. Tres nichos candidatos

| Nicho | Fuentes públicas y vía de acceso | Usuario pagador | ROI accionable | Riesgos y dificultad |
|---|---|---|---|---|
| **Inteligencia de empleo tech remoto** | Remotive ofrece API/RSS público, con retraso de 24 horas y obligación de atribución/enlace; Arbeitnow ofrece API gratuita sin clave con empleos de ATS; Jobicy ofrece REST API, RSS y filtros por región/industria, con límites de uso y restricciones contra agregadores competidores. [6] [7] [8] | Agencias boutique, recruiters, RPOs, startups en expansión y consultoras de talento. | Benchmark de demanda por skill, seniority y geografía; detección de salario y modalidad; alertas de nuevos roles; comparación de competencia por empresa. Un recruiter puede sustituir horas de clasificación y benchmarking manual. | Hay que cumplir atribución y restricciones de redistribución; salarios incompletos; posible sesgo de cobertura; los anuncios no son equivalentes a contrataciones. Dificultad técnica baja-media. |
| **Inteligencia de precios y catálogo e-commerce** | APIs oficiales de marketplaces cuando estén disponibles; feeds de merchant; páginas públicas solo donde robots.txt y ToS lo permitan. | Marcas D2C, distribuidores y category managers. | Detección de cambios de precio, stock, promociones, surtido y gaps de catálogo; soporte a repricing y planificación de inventario. | Alta heterogeneidad, protección anti-bot, ToS variables y mayor riesgo de propiedad intelectual. Dificultad media-alta y más coste operativo. |
| **Inteligencia de vivienda y alquiler** | Portales o datasets gubernamentales abiertos, APIs municipales y registros públicos donde el acceso y la licencia lo permitan. | Agencias, property managers, fondos pequeños y analistas locales. | Comparables, evolución de alquiler, días en mercado, anomalías y oportunidades por zona. | Cobertura fragmentada, licencias territoriales, datos sensibles y cambios de HTML; mayor riesgo legal y de calidad. Dificultad media-alta. |

## 4. Recomendación

El primer nicho debe ser **empleo tecnológico remoto en Europa y Latinoamérica**, con un alcance inicial deliberadamente estrecho: cargos de ingeniería, datos, producto y ciberseguridad; regiones Europe/EMEA y LATAM; y análisis de seniority, skills, modalidad, geografía, salario y fecha.

La elección no se basa en afirmar que el mercado sea ilimitado, sino en maximizar la relación entre **valor demostrable, acceso lícito y velocidad de validación**. Las tres fuentes candidatas ya exponen campos compatibles y permiten un prototipo sin proxies ni navegador. Remotive exige enlazar la URL original, mencionar Remotive y no usar sus anuncios para captar registros; además retrasa las publicaciones 24 horas. Jobicy desalienta sondeos de más de una vez por hora y prohíbe la redistribución a agregadores competidores. Estas condiciones son incorporables al producto mediante atribución obligatoria, almacenamiento de procedencia y un modo de “inteligencia para uso interno”, no como bolsa de empleo redistribuida. [6] [8]

El mercado adyacente es suficientemente grande para justificar una prueba comercial: Mordor Intelligence estima el mercado global de software de recruiting en **USD 3.61 mil millones en 2025**, con crecimiento proyectado a USD 5.5 mil millones en 2031; también atribuye al segmento IT y Telecom un 30.62% del ingreso de 2025 y al talent analytics un crecimiento superior al promedio. Debe tratarse como una estimación de un proveedor de investigación, no como un dato auditado. [9] El valor inicial de NEXUS no requiere capturar una fracción material de ese mercado: basta con demostrar ahorro de tiempo, mejor cobertura de skills y un benchmark que un equipo pequeño no puede mantener manualmente.

## 5. Alcance funcional de la demo

El prototipo importará los datos de las tres APIs, respetará un User-Agent identificable, usará una espera mínima de dos segundos por dominio, limitará la frecuencia de Jobicy a no más de una vez por hora y conservará el enlace de origen y la atribución exigida. La salida será un dataset unificado y un informe con distribución de cargos, skills, seniority, geografía, modalidad, salarios disponibles, duplicados entre fuentes, concentración por empresa y anomalías de publicación.

No se implementará bypass de CAPTCHA, rotación de identidad, scraping de fuentes que lo prohíban ni redistribución pública de anuncios restringidos. El panel mostrará resultados para análisis interno y exportará CSV/JSON con procedencia; cualquier producto comercial posterior deberá revisar las licencias y términos de cada fuente.

## Referencias

[1]: https://apify.com/pricing "Apify pricing"
[2]: https://brightdata.com/pricing/web-scraper "Bright Data Web Scraper API Pricing"
[3]: https://www.scrapingbee.com/pricing/ "ScrapingBee pricing"
[4]: https://www.import.io/pricing "Import.io pricing"
[5]: https://www.octoparse.com/pricing "Octoparse pricing"
[6]: https://remotive.com/remote-jobs/api "Remotive Remote Jobs API"
[7]: https://www.arbeitnow.com/blog/job-board-api "Arbeitnow Job Board API"
[8]: https://github.com/Jobicy/remote-jobs-api "Jobicy Remote Jobs API"
[9]: https://www.mordorintelligence.com/industry-reports/recruitment-software-market "Mordor Intelligence Recruitment Software Market"
