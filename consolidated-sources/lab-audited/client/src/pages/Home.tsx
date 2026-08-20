/**
 * NOIACORE LAB — THE INFINITE SPATIAL FACTORY
 * Dirección de esta página: editorial mineral sobre negro absoluto; las imágenes aportadas
 * funcionan como materia arquitectónica, la profundidad es lenta y ninguna interacción
 * depende de ventanas de software, emojis, escritura progresiva o sonido automático.
 */
import { useEffect, useRef, useState } from 'react';
import { MinimalSymbol } from '@/components/MinimalSymbol';
import { FACTORY_TOOLS } from '@/lib/factoryTools';
import { ARCHIVE_ASSETS, FEATURED_ASSETS } from '@/lib/mediaAssets';

type PointerFrame = { x: number; y: number; depth: number };

const chapters = [
  {
    id: 'threshold',
    index: '01',
    eyebrow: 'QWEN ARCHITECTURE / VERTICAL THRESHOLD',
    title: 'El umbral',
    emphasis: 'vertical.',
    body: 'Una entrada sin interfaz. El campo se abre como una estructura de piedra y luz: lo que importa no aparece de golpe, emerge cuando el visitante decide atravesarlo.',
    asset: FEATURED_ASSETS[0],
    depth: 'Z +100 / FRONT MATTER',
    note: 'La primera puerta no explica la fábrica. La deja presentirse.',
  },
  {
    id: 'orbit',
    index: '02',
    eyebrow: 'Z.AI / ORBITAL REASONING',
    title: 'El núcleo',
    emphasis: 'orbital.',
    body: 'La inteligencia no se representa como un panel. Se percibe como una órbita: capas de contexto, criterio y memoria que se aproximan sin invadir el silencio.',
    asset: FEATURED_ASSETS[1],
    depth: 'Z +280 / ORBITAL FIELD',
    note: 'Cada vuelta conserva una parte de la pregunta original.',
  },
  {
    id: 'atmosphere',
    index: '03',
    eyebrow: 'MANOS ABIERTAS / ATMOSPHERIC FIELD',
    title: 'Materia en',
    emphasis: 'suspensión.',
    body: 'El archivo visual se convierte en atmósfera. Ninguna captura se trata como decoración: cada una conserva una tensión, una escala o una decisión que alimenta la lectura.',
    asset: FEATURED_ASSETS[2],
    depth: 'Z +420 / DEEP ATMOSPHERE',
    note: 'La forma permanece abierta para que el criterio pueda entrar.',
  },
  {
    id: 'portal',
    index: '04',
    eyebrow: 'BELENTANI / MEMORY GATEWAY',
    title: 'El guardián',
    emphasis: 'de obsidiana.',
    body: 'Una presencia contenida custodía el límite entre observar y participar. El portal no ofrece una salida rápida; ordena el material hasta que la siguiente decisión se vuelve evidente.',
    asset: FEATURED_ASSETS[3],
    depth: 'Z +560 / MEMORY GATEWAY',
    note: 'Toda fábrica seria necesita una zona que no se pueda fingir.',
  },
];

function scrollToChapter(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function Home() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const pointerRef = useRef<PointerFrame>({ x: 0, y: 0, depth: 1 });
  const [depth, setDepth] = useState(1);
  const [activeToolId, setActiveToolId] = useState(FACTORY_TOOLS[0]?.id ?? 'manuscore');
  const activeTool = FACTORY_TOOLS.find((tool) => tool.id === activeToolId) ?? FACTORY_TOOLS[0];

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const applyFrame = () => {
      frameRef.current = null;
      const point = pointerRef.current;
      root.style.setProperty('--cursor-x', `${point.x}px`);
      root.style.setProperty('--cursor-y', `${point.y}px`);
      root.style.setProperty('--depth-scale', `${point.depth}`);
    };

    const scheduleFrame = () => {
      if (frameRef.current === null) frameRef.current = window.requestAnimationFrame(applyFrame);
    };

    const handlePointer = (event: PointerEvent) => {
      pointerRef.current.x = (event.clientX / window.innerWidth - 0.5) * 26;
      pointerRef.current.y = (event.clientY / window.innerHeight - 0.5) * 20;
      scheduleFrame();
    };

    const handleScroll = () => {
      const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const progress = Math.min(window.scrollY / maxScroll, 1);
      pointerRef.current.depth = 1 + progress * 0.035;
      setDepth(1 + progress * 2.5);
      scheduleFrame();
    };

    window.addEventListener('pointermove', handlePointer, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('pointermove', handlePointer);
      window.removeEventListener('scroll', handleScroll);
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <div ref={rootRef} className="noia-spatial-root">
      <div className="spatial-atmosphere" aria-hidden="true" />
      <div className="spatial-grain" aria-hidden="true" />
      <div className="spatial-horizon" aria-hidden="true" />

      <header className="spatial-nav">
        <a className="spatial-brand" href="#origin" aria-label="NOIACORE LAB, volver al origen">
          <MinimalSymbol size={22} glow={false} />
          <span>NOIACORE // INFINITE SPATIAL FACTORY</span>
        </a>
        <div className="spatial-nav-info" aria-label="Estado de la experiencia">
          <span>Z-DEPTH: {depth.toFixed(2)}X</span>
          <span>15 STATIONS</span>
          <span>GESTALT FIELD</span>
        </div>
      </header>

      <main className="spatial-stages">
        <section id="origin" className="spatial-hero spatial-stage" aria-labelledby="hero-title">
          <div className="hero-material" aria-hidden="true">
            <img src={FEATURED_ASSETS[0].src} alt="" />
          </div>
          <div className="hero-architecture hero-architecture-left" aria-hidden="true" />
          <div className="hero-architecture hero-architecture-right" aria-hidden="true" />
          <div className="hero-beam" aria-hidden="true" />
          <div className="hero-core" aria-hidden="true"><MinimalSymbol size={168} glow={false} /></div>
          <div className="hero-content">
            <span className="stage-eyebrow">NOIACORE LAB / ORIGIN FIELD</span>
            <h1 id="hero-title">
              Una fábrica<br />
              <i>para lo inevitable.</i>
            </h1>
            <p>Una performance lenta de materia, criterio y profundidad. El sistema no te recibe: espera a que su escala encuentre la tuya.</p>
            <button className="text-gesture" type="button" onClick={() => scrollToChapter('threshold')}>
              <span>Entrar en el umbral</span>
              <i aria-hidden="true" />
            </button>
          </div>
          <div className="hero-footer" aria-hidden="true">
            <span>BLACK FIELD / 00</span>
            <span>MOVE THROUGH THE MATERIAL</span>
            <span>08.2026</span>
          </div>
        </section>

        {chapters.map((chapter, chapterIndex) => (
          <section id={chapter.id} className="spatial-stage chapter-stage" key={chapter.id} aria-labelledby={`${chapter.id}-title`}>
            <div className="chapter-index" aria-hidden="true">{chapter.index}</div>
            <div className="chapter-copy">
              <span className="stage-eyebrow">{chapter.eyebrow}</span>
              <div className="chapter-telemetry" aria-label={`Lectura material ${chapter.index}`}>
                <span>FIELD / {chapter.index}</span>
                <span>AXIS / {chapter.depth.split(' / ')[0]}</span>
                <span>STATE / OPEN</span>
              </div>
              <h2 id={`${chapter.id}-title`}>
                {chapter.title}<br />
                <i>{chapter.emphasis}</i>
              </h2>
              <p>{chapter.body}</p>
              <div className="chapter-note">
                <span />
                <em>{chapter.note}</em>
              </div>
              <button className="text-gesture" type="button" onClick={() => scrollToChapter(chapterIndex === chapters.length - 1 ? 'stations' : chapters[chapterIndex + 1].id)}>
                <span>{chapterIndex === chapters.length - 1 ? 'Descender a la fábrica' : 'Seguir descendiendo'}</span>
                <i aria-hidden="true" />
              </button>
            </div>
            <figure className="chapter-material" style={{ '--chapter-depth': `${chapterIndex * 28}px` } as React.CSSProperties}>
              <div className="material-frame material-frame-back" aria-hidden="true" />
              <img src={chapter.asset.src} alt={chapter.asset.caption} />
              <figcaption>
                <span>{chapter.asset.label}</span>
                <small>{chapter.depth}</small>
              </figcaption>
            </figure>
          </section>
        ))}

        <section id="stations" className="spatial-stage stations-stage" aria-labelledby="stations-title">
          <div className="station-intro">
            <span className="stage-eyebrow">GESTALT ENGINE / 15 FACTORY STATIONS</span>
            <h2 id="stations-title">Quince fuerzas<br /><i>operativas.</i></h2>
            <p>La fábrica no se organiza como una colección de aplicaciones. Cada estación modifica la siguiente, y cada recorrido deja una huella distinta en el resultado.</p>
            <span className="station-count">{String(FACTORY_TOOLS.length).padStart(2, '0')} / CONNECTED THROUGH PROXIMITY</span>
          </div>
          <div className="station-field">
            <div className="station-list" role="list" aria-label="Estaciones interactivas">
              {FACTORY_TOOLS.map((tool, index) => (
                <button
                  key={tool.id}
                  type="button"
                  className={`station-row ${activeToolId === tool.id ? 'is-active' : ''}`}
                  onClick={() => setActiveToolId(tool.id)}
                  aria-pressed={activeToolId === tool.id}
                >
                  <span className="station-number">{String(index + 1).padStart(2, '0')}</span>
                  <span className="station-name">{tool.name}</span>
                  <span className="station-category">{tool.category}</span>
                </button>
              ))}
            </div>
            {activeTool && (
              <aside className="station-reading" aria-live="polite">
                <span className="stage-eyebrow">SELECTED FORCE / {activeTool.category.toUpperCase()}</span>
                <h3>{activeTool.name}</h3>
                <p>{activeTool.description}</p>
                <div className="reading-rule" aria-hidden="true" />
                <span>{activeTool.id.replaceAll('_', ' ')} / READY FOR CONTEXT</span>
              </aside>
            )}
          </div>
        </section>

        <section id="archive" className="spatial-stage archive-stage" aria-labelledby="archive-title">
          <div className="archive-heading">
            <span className="stage-eyebrow">ARCHIVE MATRIX / USER MATERIALS</span>
            <h2 id="archive-title">La materia<br /><i>original.</i></h2>
            <p>Fragmentos reales del archivo aportado, tratados como superficie, escala y memoria. La fábrica conserva su procedencia y cambia su distancia.</p>
          </div>
          <div className="archive-grid">
            {ARCHIVE_ASSETS.slice(0, 8).map((asset, index) => (
              <figure className={`archive-piece archive-piece-${(index % 7) + 1}`} key={asset.id}>
                <img src={asset.src} alt={asset.caption} loading={index > 2 ? 'lazy' : 'eager'} />
                <figcaption>
                  <span>{asset.label}</span>
                  <small>{asset.caption}</small>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section id="machine" className="spatial-stage machine-stage" aria-labelledby="machine-title">
          <div className="machine-field" aria-hidden="true">
            <div className="machine-core"><MinimalSymbol size={74} glow={false} /></div>
            <div className="machine-orbit machine-orbit-one" />
            <div className="machine-orbit machine-orbit-two" />
            <span className="machine-node node-one" />
            <span className="machine-node node-two" />
            <span className="machine-node node-three" />
            <span className="machine-axis" />
          </div>
          <div className="machine-copy">
            <span className="stage-eyebrow">MIND OF THE MACHINE / CONTEXT ENGINE</span>
            <h2 id="machine-title">El razonamiento<br /><i>no hace ruido.</i></h2>
            <p>Entre una estación y la siguiente, la máquina hace algo más importante que responder: conserva la tensión de la pregunta hasta encontrar una forma precisa de devolverla.</p>
            <div className="machine-caption">
              <span>CONTEXT PRESERVED</span>
              <span>LATENCY / HUMAN SCALE</span>
            </div>
          </div>
        </section>

        <section id="final" className="spatial-stage final-stage" aria-labelledby="final-title">
          <div className="final-symbol"><MinimalSymbol size={72} glow={false} /></div>
          <div className="final-copy">
            <span className="stage-eyebrow">NOIACORE LAB / EXIT CONDITION</span>
            <h2 id="final-title">Sal de la fábrica<br /><i>con otra escala.</i></h2>
            <p>No hay un final cerrado. Solo una distancia nueva entre lo que trajiste y lo que ahora puede existir.</p>
            <button className="text-gesture" type="button" onClick={() => scrollToChapter('origin')}>
              <span>Volver al origen</span>
              <i aria-hidden="true" />
            </button>
          </div>
          <span className="final-depth" aria-hidden="true">Z +∞ / EXIT CONDITION</span>
        </section>
      </main>

      <footer className="spatial-footer">
        <span className="footer-mark"><MinimalSymbol size={18} glow={false} /> NOIACORE LAB / 2026</span>
        <span>THE MATERIAL REMAINS</span>
        <a href="#origin">RETURN TO ORIGIN</a>
      </footer>
    </div>
  );
}
