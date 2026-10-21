# NOIACORE — BLACK WATER / LIVING INTELLIGENCE

Web inmersiva **autónoma y multipágina**, construida con HTML5, CSS3, JavaScript ES2022, Canvas 2D y WebGL nativos. No utiliza WordPress, Wix, Base44, Lovable, Vercel ni ningún constructor, CDN, librería remota o infraestructura externa. No incluye rastreadores ni telemetría. Desarrollada como **versión independiente**, sin sobrescribir los repositorios originales.

## Abrir y ejecutar

**Sin instalación:** descomprime y abre `index.html` en un navegador moderno. No se necesita Internet para cargar las páginas y los efectos. La herramienta Regex necesita el servidor local para aislar su ejecución en un Web Worker.

**Con servidor local (recomendado):** instala Node.js 18 o posterior; en la carpeta del proyecto ejecuta:

```bash
npm start
```

Abre `http://127.0.0.1:8099`. La carpeta se sirve solo en loopback (`127.0.0.1`), no se publica en Internet. Para cambiar el puerto, define `PORT=xxxx`; para que sea accesible por otros dispositivos en tu red, configura `HOST` explícitamente y ajusta tu firewall con cautela.

**Tests:** `npm run check && npm test`. No hace falta ejecutar `npm install`: no hay dependencias en `package.json`.

## Páginas reales

| Archivo | Función |
|---|---|
| `index.html` | Umbral: agua negra procedural, ojo vivo, adaptación a la intención |
| `universos.html` | Mapa de seis galaxias interactivas, navegable también con teclado y tarjetas |
| `portal.html` | Terminal NAVE: interpretación local de intención, navegación y comandos |
| `laboratorio.html` | 32 herramientas de transformación y validación reales ejecutadas en el dispositivo |
| `sistemas.html` | Arquitectura conceptual, componentes y límites |
| `manifiesto.html` | Identidad, filosofía y posición de producto |
| `contacto.html` | Generador local de briefing descargable o compartible usando apps del dispositivo |

## Arquitectura

`assets/css/base.css` define diseño, navegación, controles y adaptación responsive. `assets/css/experiences.css` contiene las experiencias y componentes por página.

`assets/js/water.js` implementa agua negra con fragment shader WebGL propio y fallback sin WebGL; `eye.js` mueve el ojo en respuesta al puntero **sin cámara ni identificación**; `atlas.js` renderiza galaxias Canvas 2D de manera procedimental, suprime la navegación tras un arrastre y centra el mapa de forma inmediata al reiniciar; `nave.js` clasifica señales mediante un ranking heurístico explicable, sin enviar consultas fuera; `lab.js` ejecuta herramientas de datos y texto. La importación CSV rechaza filas con más campos que cabeceras; la exportación JSON→CSV admite valores escalares; `regex-worker.js` procesa expresiones en un Web Worker del mismo origen con un límite de 500 ms. `core.js` aporta navegación global, accesibilidad, atajos, movimiento reducido (el reinicio vuelve a respetar la preferencia del sistema) y flujos de briefing. `assets/data/content.js` es la fuente interna de universos, intenciones y rutas. `i18n.js` contiene textos fundamentales ES/EN/PT; la localización de todo el corpus editorial aún no está completa.

La terminal ofrece `SAVE` (descarga un JSON con región, idioma y preferencia de movimiento) y `LOAD` (restaura únicamente estos valores tras validar el archivo; máximo 2 KB). `HISTORY` lista los últimos diez comandos de la sesión actual. **No exporta consultas, CV, credenciales, cookies ni historial**; los archivos se procesan en el navegador, sin subirlos.

NAVE es un **enrutador de intenciones con reglas**, no un chatbot generativo: no se presenta como modelo de IA entrenado ni promete memoria, generación remota o integración inexistente. La terminal distingue las respuestas y explica qué términos han producido cada asociación. Solo puede guardar localmente el identificador de una categoría seleccionada; los prompts introducidos no se guardan como historial permanente. El formulario de contacto **no envía mensajes a ningún servidor**: exporta un briefing o delega compartirlo a la aplicación del visitante.

## Privacidad, límites y producción

- Sin cookies analíticas, Google Fonts, llamadas externas ni captura de webcam o micrófono.
- No se proporcionan cifras inventadas de uso, uptime, tokens, rendimiento o número de clientes.
- Configuración de contenido estático propio. La cabecera `Content-Security-Policy` se aplica cuando se usa el servidor local.
- Soporta preferencia de movimiento reducido y ajuste manual; la experiencia visual es progresiva y tiene fallback sin WebGL.
- Antes de **publicar como producto comercial**: conectar un sistema real de recepción de briefings, completar las traducciones, añadir política de privacidad legal definitiva, auditar navegadores y dispositivos reales, y definir el backend/LLM solo si va a existir.
- El archivo ZIP no modifica Google Drive, GitHub, Vercel ni dominio alguno y no importa código privado de otros proyectos.

## Procedencia de la visión

Se consultaron el documento de consolidación NOIACORE de Drive (13-08-2026), una implementación v7 procedente de Drive, una maqueta unificada y la estructura / README del repositorio existente `belentani7/NOIACORE`. Se conserva la dirección creativa (núcleo vivo, silencio, percepción, laboratorio, Λ, navegación adaptativa), pero el código de este paquete es una implementación propia y separada. Los respaldos, experimentos históricos y otros repositorios del ecosistema no se fusionan aquí.

**Identidad:** Inteligência Silenciosa. Tecnologia Essencial. / Core is invisible. Impact is inevitable.

## Entrega Linux autocontenida (opcional)

La experiencia BLACK WATER puede servirse como contenedor Node sin instalar dependencias ni compartir claves. Desde `black-water/` ejecuta `docker compose up -d --build`; comprobar `http://127.0.0.1:8099` en la máquina anfitriona. Docker reinicia el servicio si cae, usa usuario no privilegiado, sistema de archivos de solo lectura y healthcheck. Para exposición pública configura HTTPS, DNS y proxy inverso externos; **arrancar un contenedor no constituye una publicación web**. El sitemap y canonical se han preparado para `noiacore.com` (CNAME del repositorio) y deben verificarse al asignar esa web al dominio.
