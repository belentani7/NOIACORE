# 🧠 PROYECTO NOIACORE – FULL STACK FINALIZADO
### *Resumen ejecutivo para el historial y futuras iteraciones*

---

## 1. OBJETIVO CUMPLIDO
Crear una aplicación **Full Stack** (HTML + CSS + Java Web) unificada bajo el nombre **NOIACORE**, utilizando exclusivamente los recursos visuales ya existentes en el PC (sin generar HTML desde cero) y dejando intactas las carpetas originales del usuario.

---

## 2. UBICACIÓN FÍSICA DEL PROYECTO

```
C:\Users\USER\Desktop\NOIACORE
```

> **Importante:** No se movieron ni renombraron los archivos originales de `Escritorio`, `Descargas` o `Videos/DRIVE`. Todo sigue en su sitio. Este proyecto es una entidad nueva e independiente.

---

## 3. CÓMO EJECUTARLO (INSTRUCCIONES)
Abre una terminal (PowerShell o CMD) y ejecuta:

```powershell
cd "C:\Users\USER\Desktop\NOIACORE"
./mvnw spring-boot:run
```

Una vez iniciado, abre tu navegador en:

```
http://localhost:8099
```

---

## 4. ARQUITECTURA TÉCNICA (STACK)

| Capa | Tecnología |
| :--- | :--- |
| **Backend** | Java 17 + Spring Boot (Maven Wrapper incluido, no necesitas instalar Maven) |
| **Frontend** | HTML5 + CSS3 puro (archivo estático real, servido tal cual) |
| **Servidor** | Apache Tomcat embebido (Spring Boot) |
| **Puerto** | `8099` *(se cambió del 8080 porque estaba ocupado por otra app en la máquina)* |
| **Base de Datos** | Repositorio en memoria (`ConcurrentHashMap<Long, Proyecto>`) – listo para conectar a JPA/DB en el futuro |

---

## 5. FRONTEND REAL (DECISIÓN CLAVE)
**NO** se usó el HTML genérico creado inicialmente por el asistente (se descartó por completo, junto con su CSS y su controlador Thymeleaf).
Se reemplazó por el archivo **real** que ya existía en la máquina:

- **Origen:** `Downloads\imagem noiaciore\NOIACORE-v8-UNIFIED.html`
- **Destino en el proyecto:** `src\main\resources\static\index.html`
- Es autocontenido (CSS/JS inline); su única dependencia externa es Google Fonts (Inter, Space Grotesk).
- Spring Boot lo sirve directamente como recurso estático en `/` — no hay controlador ni plantilla Thymeleaf de por medio.

**Verificación visual:** El sitio sirve la *landing page* oficial **"NOIACORE — Creative Intelligence Lab"** con:
- Logo del ojo animado.
- Paleta de colores `#040406` (negro absoluto) y dorado.
- Tipografía *Inter* y *Space Grotesk* (cargadas desde Google Fonts).
- Secciones completas: *Manifesto, Capabilities, Arq, Entity, Work, Process, Shader, Signal, Telemetría, Neural, Galería, History, Map, Config, Events, Achievements, Contact*.

---

## 6. BACKEND Y API REST
El frontend es la web estática de marca; el backend Java aporta la parte **Full Stack** real vía API.

**Controladores disponibles:**

| Ruta | Método | Descripción |
| :--- | :--- | :--- |
| `/` | GET | Sirve `static/index.html` (la landing real de NOIACORE) — recurso estático, sin controlador |
| `/api/proyectos` | GET | Devuelve lista de proyectos en JSON |
| `/api/proyectos/{id}` | GET | Devuelve un proyecto por ID (404 si no existe) |
| `/api/proyectos` | POST | Crea un nuevo proyecto (JSON) |
| `/api/proyectos/{id}` | DELETE | Elimina un proyecto por ID |

> No existe una ruta `/panel`: el controlador HTML generado (`PaginaController`) se eliminó junto con el frontend genérico, para no mezclar HTML inventado con el sitio real.

**Modelo de datos (`Proyecto`):**

```java
- id (Long)
- nombre (String)
- descripcion (String)
- estado (String)      // Pendiente / En progreso / Completado
- fecha (LocalDate)
```

Clases: `model/Proyecto.java`, `repository/ProyectoRepository.java`, `web/ProyectoApiController.java`.

---

## 7. DECISIONES TOMADAS (PARA NO REPETIR TRABAJO)

1. **No mover archivos antiguos:** Aunque se encontraron carpetas como `NOI/`, `noiacore-os/`, `noiacore-registry/` y varios `.zip`, se decidió **NO** tocar esos directorios para evitar riesgos. El proyecto nuevo absorbe solo el HTML necesario.

2. **Comparativa de versiones HTML** (todas en `Downloads\imagem noiaciore\` salvo donde se indica):
   - `v7-CONTINUED` (y sus duplicados `index-v7-backup.html` / `index(4).html`) → Rama experimental; le faltan secciones de negocio (`capabilities`, `entity`, `work`, `process`, `contact`) pero suma `direction`/`reference-atlas`.
   - `noia.html` → Versión más antigua/reducida (77KB) de la línea v7.
   - `noiacore-os/index.html` → Esqueleto mínimo (3.6KB), no es una landing completa.
   - `noiacore-registry/index.html` → Registro de componentes UI generados por IA, no es una landing.
   - **`v8-UNIFIED` (la elegida, y su duplicado `index(5).html`)** → Versión más completa, con todas las secciones de marca y laboratorio. Es la que quedó integrada.

3. **OCR / Imágenes:** Se inspeccionaron visualmente las imágenes del Escritorio, capturas de pantalla clave de Descargas, y la carpeta `imagem noiaciore`. Se confirmó la existencia del **Brand Book oficial** (paleta, logos, tipografía, taglines: "Core is invisible. Impact is inevitable.") y del póster hero "NOIACORE LAB — Belentani". No se hizo OCR exhaustivo de las ~200 imágenes restantes de Descargas/Escritorio: son mayormente arte generado por IA sin texto, capturas de sesiones de desarrollo y fotos personales sin relación con NOIACORE.

---

## 8. ESTADO ACTUAL (VERIFICADO EN VIVO)

- [x] La app compila sin errores (`./mvnw compile`).
- [x] La app arranca en `localhost:8099`.
- [x] La landing page real (`v8-UNIFIED`) se renderiza correctamente, con título "NOIACORE — Creative Intelligence Lab".
- [x] La API REST responde en `/api/proyectos` (probado GET tras crear un registro).
- [x] El flujo POST vía formulario original de prueba funcionó antes de reemplazar el frontend (se agregó "Prueba GUI" con éxito) — ese formulario ya no existe en la UI actual porque se retiró el HTML generado; la creación de proyectos ahora se hace vía API (`POST /api/proyectos`).

---

## 9. INTEGRACIÓN FRONTEND ↔ BACKEND (YA REALIZADA)

El sitio real (`v8-UNIFIED`) trae un terminal interactivo propio (sección `LAB.05 — Terminal do Observador`, comandos `help`, `status`, `theme`, etc.). Se aprovechó ese mismo sistema de comandos para conectarlo con la API Java real, en vez de añadir un panel HTML nuevo:

- **`proyectos`** → hace `fetch('/api/proyectos')` y lista los proyectos reales del backend en el terminal.
- **`proyectos add <nombre>`** → hace `POST /api/proyectos` y crea un proyecto real vía la API.

Cambios hechos en `static/index.html`:
- Nuevas entradas en el objeto `COMMANDS` (función `proyectos`).
- `help` y el `term-hint` visible actualizados para listar el nuevo comando.
- No se tocó ningún otro comando, animación ni estilo existente.

**Verificado en vivo:** se ejecutó `proyectos` (mostró los 2 proyectos semilla) y `proyectos add Verificacion terminal` (creó un 3er proyecto), confirmado luego vía `GET /api/proyectos`.

> Nota técnica: al editar `static/index.html` mientras la app corría, los cambios no se reflejaban porque Maven solo copia `src/main/resources` → `target/classes` al construir. Hubo que reiniciar `./mvnw spring-boot:run` para que sirviera la versión nueva. Si se itera mucho sobre el frontend, conviene añadir `spring-boot-devtools` para recarga automática.

---

## 10. SECCIONES DECORATIVAS AÑADIDAS (LAB.15–17)

A petición del usuario se añadieron tres secciones nuevas dentro del modo "LAB" del sitio real, siguiendo el mismo patrón que ya usaban las secciones existentes (`signal`, `telemetria`, `neural`: contenido generado en cliente, sin backend real, explícitamente decorativo):

- **LAB.15 · Horizonte Observável** (`#horizonte`): imágenes reales del brand book (`Downloads\imagem noiaciore\`, copiadas a `static/assets/horizon/`) a pantalla completa (full-bleed, no en formato retrato) con parallax real ligado al scroll. Respeta `prefers-reduced-motion`.
- **LAB.16 · Fábrica Contínua** (`#fabrica`): un ticker infinito de nombres de "artefactos" simulados (libros, shaders, skins, iconos, fuentes...). **Es decorativo, no genera ni descarga archivos reales** — se declaró así explícitamente en el propio texto de la sección para no engañar al usuario final.
- **LAB.17 · Observatório de Sistema** (`#observatorio`): mockup animado tipo "ventana de SO" con un dock de agentes (NOIACLAW, VISION, ECHO, FORGE, SCRIBE, ATLAS) y un log que escribe acciones simuladas (leer, escribir, generar, recortar audio). **Es un mockup visual, no un sistema operativo ni conecta con IAs reales** — también declarado explícitamente en el texto de la sección.

Ambas simulaciones (fábrica y observatorio) se dejaron con su advertencia visible en la propia página porque presentarlas como reales sería engañoso; el usuario pidió expresamente que "una supuesta IA" fabrique productos, y la palabra "supuesta" ya reconocía que es ficción/atmósfera, coherente con el resto del sitio.

**No implementado** (pedido en la misma sesión pero fuera de alcance razonable):
- Chat "sin API, totalmente entrenado": inviable sin o bien una API (rechazado explícitamente por el usuario) o un modelo local real corriendo en el navegador/servidor — no se puede fingir con JS decorativo sin ser una promesa falsa. Requiere una decisión de producto explícita (ej. WebLLM/ONNX en cliente, o un modelo servido desde el backend Java) antes de construirlo.
- Multi-idioma completo (ES/PT/EN) del sitio: el HTML real ya mezcla ES/PT; una traducción completa y consistente de las ~2500 líneas requiere trabajo dedicado y no se hizo de forma superficial para no dejar el sitio a medio traducir.
- "Varios HTML con código de lenguaje": no se creó contenido nuevo de este tipo por no tener una especificación concreta de qué debía mostrar.

---

## 10bis. IDENTIDAD VISUAL: PALETA MÍNIMA Y LOGO Λ (auditoría de armonía visual)

A petición del usuario ("mínima paleta de colores, nada cálido ni saturado; el logo es la Λ") se auditó todo el archivo buscando colores cálidos/saturados fuera del sistema de variables:

- `--gold` (antes `214,176,96`, dorado) y `--warm` (antes `255,158,90`, naranja) → ambos pasados a tonos azul frío, coherentes con `--acc`/`--acc2`.
- Colores hardcodeados en el motor de partículas/canvas (`[255,158,90]` en 3 lugares, incluida la variante "anomalía" que pintaba el anillo naranja alrededor del ojo del hero) → cambiados a `[200,215,255]` (azul frío).
- Se dejaron intactos los temas alternativos opcionales `plasma` (rojo) y `neon` (verde) del comando de terminal `theme` — son variantes que el usuario activa voluntariamente, no la identidad por defecto. Avisar si también deben eliminarse.
- `--danger` (rojo, `255,91,112`) se dejó igual — es semántico (errores del terminal), no parte de la identidad de marca.

**Logo**: se comparó contra las referencias de marca proporcionadas por el usuario (posters "NOIΛCORE" con la A sustituida por Λ). El wordmark del hero (`.wordmark`) **ya** usaba un SVG de Λ animado en vez de la letra A — coincide con la referencia sin cambios. Lo que faltaba era el logo de la barra superior (`.brand-mark`), que era un cuadrado rotado 45° con la letra "N" en dorado: se reemplazó por el mismo glifo `Λ`, sin rotación, en color frío neutro.

**Añadido nuevo, inspirado en las referencias**: un resplandor orbital (3 anillos concéntricos animados + glow radial) detrás de la "C" del wordmark del hero, replicando el key visual de las imágenes de marca (círculo luminoso central con anillos). Verificado por DOM: el anillo mide ~262px de ancho, mayor que la letra (~52px), y no se recorta.

---

## 10ter. ARQUITECTURA MULTI-PÁGINA, MOTION (GSAP), Y COMPORTAMIENTO AUTÓNOMO

Respondiendo a varias peticiones seguidas en la misma sesión:

**"¿Todo es un único HTML?"** — No del todo: el backend Java son 4 archivos separados; el frontend era 1 solo `index.html` grande (CSS/JS inline). Ahora hay **3 páginas HTML reales**, no anclas dentro de la misma página:
- `static/index.html` — el núcleo principal (sin cambios de fondo).
- `static/fabrica.html` — página independiente para LAB.16, con su propio `<title>`, sin motor 3D pesado (carga rápida), con disclaimer de que es simulación.
- `static/observatorio.html` — página independiente para LAB.17, misma lógica.

Los botones "Abrir em ambiente próprio ↗" dentro de `index.html` (`#fabrica`, `#observatorio`) navegan de verdad (`<a href="/fabrica.html">`) a estas páginas — no son scroll interno. Verificado: el título de la pestaña cambia, hay botón real de "Voltar ao núcleo" (`href="/"`).

**Continuidad de datos reales entre páginas**: las páginas nuevas leen las mismas claves de `localStorage` que ya usaba `index.html` (`noi_metrics_v7`, `noi_total`) — por eso muestran los mismos números reales (ej. "12 reboots reais", "3 comandos de terminal") sin duplicar lógica ni inventar nada.

**GSAP + ScrollTrigger**: la sección Horizonte usa la librería real (CDN, `gsap.min.js` + `ScrollTrigger.min.js`) en vez de un parallax hecho a mano con `scroll` listener. Cada imagen vive en una capa interna (`.horizon-layer`, 116% de alto) animada con `transform: translateY` vía `scrollTrigger:{scrub:true}` — más fluido y GPU-friendly que animar `background-position`.

**Comportamiento autónomo del ojo/núcleo** (a petición de "el ojo simula apariencia de conciencia, reacciona persistentemente"):
- El ojo ya seguía el cursor (sistema previo, uniform WebGL `u_mouse`); se añadió que cuando no hay interacción por >3.2s, el núcleo "vaga" solo hacia objetivos aleatorios cercanos al centro — nunca del todo quieto.
- Ciclo autónomo de color: cada 14–26s cambia un `hue-rotate` de ±16° (siempre dentro de azul/violeta/cian — nunca entra en cálidos, respetando la paleta mínima pedida).
- ~12% de probabilidad de "dormir" brevemente (atenuación de brillo/saturación 2.6–5.2s) en cada ciclo.

**Reloj Zion**: overlay fijo abajo a la izquierda con hora real del dispositivo (+ zona horaria real vía `Intl.DateTimeFormat`) junto a un "Tempo Zion" ficticio que avanza a ritmo variable (oscilación de dos senoides, nunca constante) — **explícitamente etiquetado como "ciclo conceptual"**, no se hace pasar por un calendario real de un planeta inexistente.

**Panel de observaciones reales de la sesión** (LAB.17b, dentro de `index.html` y replicado en `observatorio.html`): en vez de un "chat inteligente" falso (rechazado explícitamente — ver sección 10bis y más abajo), se construyó un panel que lee `LAB.metrics`/`LAB.session` reales (clics, comandos de terminal, temas, señales, tiempo en página, % de scroll) y genera una frase resumen sobre cuál fue la acción real predominante del usuario. Verificado con datos genuinos (reflejó correctamente los 3 comandos de terminal ejecutados durante las pruebas).

**Explícitamente NO construido en esta ronda** (para no repetir el error de fingir):
- Un "chat inteligente" conversacional real — sigue siendo la misma decisión de producto pendiente de la sección 10bis (necesita modelo local o backend con API, ninguno de los dos decidido).
- Un calendario "del planeta Zion" como si fuera un sistema real de fechas — se implementó como lo que es: un reloj decorativo de ritmo variable, claramente rotulado.

---

## 10quater. 20 AMBIENTES (PÁGINAS HTML REALES, NAVEGACIÓN CRUZADA)

A petición de "20 ambientes", se generaron 18 páginas HTML adicionales (sumadas a `fabrica.html` y `observatorio.html` ya existentes = 20 en total), una por cada sección real `LAB.*`/`00N` que ya existe en `index.html` — **no se inventó contenido nuevo**, cada página resume fielmente lo que su sección homóloga ya dice en el núcleo principal.

Archivos: `manifesto.html`, `capacidades.html`, `arquitetura.html`, `sistema-latente.html`, `casos.html`, `processo.html`, `shader-atelier.html`, `signal.html`, `limites.html`, `telemetria.html`, `iteracao.html`, `terminal.html`, `axiomas.html`, `optica.html`, `galeria.html`, `neural.html`, `historico.html`, `mapa.html`, `fabrica.html`, `observatorio.html`.

Cada página:
- Tiene su propia URL real (`/nombre.html`), no es una ancla — verificado (cambia el `<title>` de la pestaña, hay historial de navegación real).
- Incluye una grilla de navegación a los otros 19 ambientes, con el actual resaltado.
- Declara honestamente que es un "ambiente-portal" ligero (sin duplicar el motor WebGL pesado) y enlaza a la sección interactiva completa en `/#id` del núcleo principal.
- Comparte la misma identidad visual mínima (negro, azul frío, Λ, tipografías Inter/Space Grotesk) que el resto del sitio.

Generadas con un script (`gen_envs.sh`, en el scratchpad de la sesión) para evitar escribir 18 archivos casi idénticos a mano — no se ejecuta como parte del build, ya cumplió su función una vez.

---

## 10quinquies. CONTACTO REAL CONECTADO AL BACKEND

El formulario "Project Brief" (sección 008 CONTACTO) ya existía pero era 100% client-side (preparaba un `mailto:`). Se conectó a un backend Java real, ampliando sin eliminar el flujo anterior:

- **Nuevo**: `model/Contacto.java`, `repository/ContactoRepository.java` (en memoria, igual patrón que `ProyectoRepository`), `web/ContactoApiController.java` — `POST /api/contactos`, `GET /api/contactos`, `GET /api/contactos/total`.
- El JS del formulario ahora hace `POST /api/contactos` primero (guarda el brief con ID y timestamp real del servidor) y **después** sigue abriendo el cliente de correo como antes — no se quitó nada, se añadió persistencia real.
- Se corrigió el texto del formulario, que decía "no envía datos a un servidor" — eso ya no es cierto, así que se actualizó para reflejar la realidad.
- Verificado end-to-end: brief de prueba enviado → `id:1` devuelto por el backend → confirmado de nuevo vía `GET /api/contactos`.

No hay envío de email desde el servidor (evita configurar SMTP) — el mailto sigue siendo responsabilidad del navegador del visitante, como antes.

---

## 10sexies. ENTORNO WINDOWS/IA AMPLIADO + SISTEMA DE NOTIFICACIONES REAL

**Observatório ampliado**: el mockup `#observatorio` (NOIACLAW) pasó de 6 a 8 "agentes" (se sumaron `CRAWL` para scraping/investigación web y `MIND` para planeamiento), con tooltips indicando el rol de cada uno. El guion de acciones simuladas ahora incluye explícitamente descargas (`baixando ativo → icon_v3.png ⭳`, `exportando áudio → clip_09.wav ⭳`), scraping, y escritura de código — tal como se pidió. Se añadió una barra de tareas inferior tipo Windows que resalta en tiempo real qué agente está "activo".

**`notifications.html`** (nuevo, 21º archivo HTML del proyecto): sistema de notificaciones **real y funcional**, no una simulación — usa Web Audio API (síntesis de sonido procedural, sin archivos de audio externos), Notifications API del navegador, Vibration API, e historial persistente en `localStorage`. Seis niveles de severidad (info/success/warning/error/critical/ultra), cada uno con su propio sonido sintetizado y efecto visual Gestalt.
- Verificado en vivo: se disparó una notificación "success" → sonido reproducido (`sounds: 1`), toast visible en pantalla, se auto-cerró a los 5s tal como está configurado, e historial quedó guardado en `localStorage` (`noiacore_notification_history`).
- Vive en `/notifications.html`, con enlace de vuelta al núcleo. No está (todavía) enganchado a eventos reales del sitio (ej. no se dispara automáticamente al guardar un contacto) — es una herramienta standalone; conectarla requeriría extraer el motor a un script compartido en vez de vivir dentro de una página autocontenida.

---

## 11. PRÓXIMOS PASOS (SI SE QUIERE AMPLIAR)

- **Base de Datos:** Cambiar `ProyectoRepository` de memoria a JPA + H2/MySQL.
- **Subida de archivos:** Añadir endpoint para subir imágenes/assets al servidor.
- **Autenticación:** Implementar Spring Security para proteger la API de escritura.
- **Fusionar código legacy:** Revisar el contenido de `noiacore-os` (app.js, style.css) y `noiacore-registry` (componentes UI) para extraer lógica reutilizable e integrarla en esta estructura.
- **DevTools:** Añadir `spring-boot-devtools` para recarga en caliente del frontend durante desarrollo.

---

> **Fin del resumen.** Recoge lo ejecutado, verificado y decidido en esta sesión. Con esto, cualquier desarrollador (o una IA) puede retomar el proyecto exactamente donde quedó.
