/**
 * NOIACORE / EL UMBRAL OBSIDIANA
 * Diseño: brutalismo futurista contemplativo. Cada bloque se lee como un estado
 * del sistema; obsidiana, metal, agua y rojo señal sustituyen patrones SaaS.
 */
import { useState } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  ChevronRight,
  CircleDot,
  Crosshair,
  Menu,
  MoveUpRight,
  Orbit,
  Plus,
  Radio,
  X,
} from "lucide-react";

const stages = [
  ["01", "Silêncio", "O ponto antes da forma."],
  ["02", "Percepção", "O que você vê não é o que é."],
  ["03", "Curiosidade", "A pergunta abre o campo."],
  ["04", "Hipótese", "Toda arquitetura começa invisível."],
  ["05", "Adaptação", "O sistema aprende a permanecer."],
  ["06", "Sistemas", "Relações que operam sem ruído."],
  ["07", "Laboratório", "Onde o impossível encontra matéria."],
  ["08", "Criação", "Intenção transformada em linguagem."],
  ["09", "Proposta", "Uma nova condição de possibilidade."],
  ["10", "Impacto", "O inevitável encontra o mundo."],
] as const;

const artifacts = [
  {
    id: "ARTIFACT_001",
    title: "PERCEPTION FIELD",
    type: "Sistema generativo",
    description: "Estruturas que alteram a distância entre o que é observado e o que se torna possível.",
    image: "/manus-storage/contenido-gui-sheet-blue_cfe2f0e5.jpg",
  },
  {
    id: "ARTIFACT_002",
    title: "SILENT MEMORY",
    type: "Arquivo de matéria",
    description: "Memória não como registo, mas como arquitetura que continua a organizar o presente.",
    image: "/manus-storage/contenido-gui-sheet-warm_39a7799e.jpg",
  },
  {
    id: "ARTIFACT_003",
    title: "ORIGIN VECTOR",
    type: "Mapa de sistema",
    description: "Uma cartografia do humano no ponto preciso onde o campo se torna consciente de si.",
    image: "/manus-storage/contenido-gui-sheet-ink_43a619cc.jpg",
  },
] as const;

function SectionLabel({ children, index }: { children: React.ReactNode; index: string }) {
  return (
    <div className="section-label">
      <span>{index}</span>
      <i />
      <span>{children}</span>
    </div>
  );
}

export default function Home() {
  const [activeStage, setActiveStage] = useState(0);
  const [activeArtifact, setActiveArtifact] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMenuOpen(false);
  };

  return (
    <main className="noia-shell">
      <div className="noise" aria-hidden="true" />
      <div className="atmosphere atmosphere-a" aria-hidden="true" />
      <div className="atmosphere atmosphere-b" aria-hidden="true" />

      <header className="topbar" aria-label="Navegação principal">
        <button className="brand" aria-label="Ir ao início" onClick={() => scrollTo("core")}> 
          <span className="brand-mark"><img src="/manus-storage/contenido-gui-mark_6ddbfe6f.png" alt="Símbolo NOIACORE" /><i /><i /><b /></span>
          <span>NOIACORE</span>
        </button>
        <nav className={menuOpen ? "nav-links nav-open" : "nav-links"}>
          <button onClick={() => scrollTo("system")}>TRACE SYSTEM</button>
          <button onClick={() => scrollTo("lab")}>ACCESS LAB</button>
          <button onClick={() => scrollTo("archive")}>OPEN ARCHIVE</button>
          <button onClick={() => scrollTo("contact")}>ACTIVATE CONTACT <ArrowUpRight size={13} /></button>
        </nav>
        <button className="menu-button" onClick={() => setMenuOpen((open) => !open)} aria-label="Abrir menu" aria-expanded={menuOpen}>
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </header>

      <section id="core" className="hero" aria-labelledby="hero-title">
        <div className="hero-media" aria-hidden="true" />
        <div className="hero-veil" aria-hidden="true" />
        <div className="hero-grid" aria-hidden="true" />
        <div className="vertical-axis" aria-hidden="true" />
        <div className="core-orbit" aria-hidden="true">
          <span className="orbit orbit-1" />
          <span className="orbit orbit-2" />
          <span className="orbit orbit-3" />
          <span className="orbit orbit-4" />
          <b />
        </div>
        <div className="human-trace" aria-hidden="true"><span /><i /><i /><b /></div>

        <div className="hero-copy">
          <div className="system-pill"><Radio size={12} /> CORE_001 <em>SIGNAL ACTIVE</em></div>
          <h1 id="hero-title">NOIA<br /><span>CORE</span></h1>
          <p className="hero-statement">INTELIGÊNCIA SILENCIOSA.<br />TECNOLOGIA ESSENCIAL.</p>
          <div className="hero-actions">
            <button className="signal-button" onClick={() => scrollTo("system")}>
              <span>ENTER THE CORE</span><ArrowDown size={16} />
            </button>
            <button className="text-button" onClick={() => scrollTo("journey")}>TRACE THE FIELD <MoveUpRight size={14} /></button>
          </div>
        </div>

        <div className="hero-bottom">
          <span>O QUE VOCÊ VÊ NÃO É O QUE É.</span>
          <div className="scroll-cue"><span>SCROLL TO DESCEND</span><i /></div>
          <span>LATENCY&nbsp;&nbsp;00.071ms</span>
        </div>
      </section>

      <section id="system" className="manifesto section-pad" aria-labelledby="manifesto-title">
        <div className="manifesto-rail" aria-hidden="true"><span>THE INVISIBLE FIELD</span></div>
        <div className="manifesto-layout">
          <SectionLabel index="01">INTELLIGENCE / MATTER</SectionLabel>
          <div className="manifesto-copy">
            <p className="eyebrow">A SYSTEM THAT PREFERS NOT TO ANNOUNCE ITSELF.</p>
            <h2 id="manifesto-title">O core não é<br /><em>o que se vê.</em></h2>
            <p className="body-copy">NOIACORE projeta sistemas invisíveis que expandem o que é possível. A inteligência não compete por atenção; ela organiza a estrutura antes que a decisão precise ser tomada.</p>
          </div>
          <aside className="protocol-card">
            <div className="protocol-top"><Crosshair size={17} /><span>PROTOCOL_0</span></div>
            <p>O sistema não constrói produtos. Constrói as condições sob as quais algo novo se torna inevitável.</p>
            <div className="protocol-meta"><span>STATE</span><b>OBSERVING</b></div>
          </aside>
        </div>
      </section>

      <section id="journey" className="journey section-pad" aria-labelledby="journey-title">
        <div className="journey-top">
          <SectionLabel index="02">THE TEN STATES</SectionLabel>
          <div><p className="eyebrow">THE JOURNEY</p><h2 id="journey-title">Não se faz scroll.<br /><em>Atravessam-se estados.</em></h2></div>
        </div>
        <div className="stage-frame">
          <div className="stage-count">{stages[activeStage][0]} <span>/ 10</span></div>
          <div className="stage-display">
            <div className="stage-core" aria-hidden="true"><i /><i /><i /><b /></div>
            <p>{stages[activeStage][2]}</p>
            <h3>{stages[activeStage][1]}</h3>
          </div>
          <div className="stage-list" role="tablist" aria-label="Estados de NOIACORE">
            {stages.map(([number, name], index) => (
              <button key={number} onClick={() => setActiveStage(index)} role="tab" aria-selected={activeStage === index} className={activeStage === index ? "active" : ""}>
                <span>{number}</span>{name}<ChevronRight size={14} />
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="architecture section-pad" aria-labelledby="architecture-title">
        <div className="architecture-header">
          <SectionLabel index="03">INVISIBLE ARCHITECTURE</SectionLabel>
          <p>UMA TECNOLOGIA QUE SE TORNA TÃO ESTRUTURAL QUE DEIXA DE PARECER TECNOLOGIA.</p>
        </div>
        <h2 id="architecture-title">Três camadas.<br />Um <em>campo.</em></h2>
        <div className="layer-grid">
          {[
            ["01", "PERCEPÇÃO", "Modifica os limiares do que se considera real, possível ou relevante."],
            ["02", "ESTRUTURA", "Organiza relações, fluxos e dependências sem precisar se anunciar."],
            ["03", "IMPACTO", "O novo estado que permanece quando as camadas anteriores já operaram."],
          ].map(([number, title, description]) => (
            <article className="layer-card" key={number}>
              <div><span>{number}</span><Orbit size={18} /></div>
              <h3>{title}</h3>
              <p>{description}</p>
              <b>FIELD_{number}</b>
            </article>
          ))}
        </div>
      </section>

      <section id="lab" className="lab section-pad" aria-labelledby="lab-title">
        <div className="lab-heading">
          <SectionLabel index="04">LABORATORY</SectionLabel>
          <div><p className="eyebrow">WHERE IMPOSSIBLE IDEAS BECOME SYSTEMS.</p><h2 id="lab-title">Artefatos em<br /><em>estado ativo.</em></h2></div>
          <p className="lab-intro">O laboratório reúne matéria, imagem, linguagem e sistema. Cada peça é uma hipótese a ser atravessada, não uma resposta pronta.</p>
        </div>
        <div className="artifact-grid">
          {artifacts.map((artifact, index) => (
            <button className="artifact-card" key={artifact.id} onClick={() => setActiveArtifact(index)}>
              <div className="artifact-image" style={{ backgroundImage: `url(${artifact.image})` }}><span>{artifact.id}</span><i /></div>
              <div className="artifact-info"><div><p>{artifact.type}</p><h3>{artifact.title}</h3></div><Plus size={19} /></div>
            </button>
          ))}
        </div>
      </section>

      <section id="archive" className="archive section-pad" aria-labelledby="archive-title">
        <div className="archive-intro">
          <SectionLabel index="05">ARCHIVE / 2026</SectionLabel>
          <h2 id="archive-title">Toda memória<br />é uma <em>arquitetura.</em></h2>
        </div>
        <div className="archive-list">
          {["ORIGIN", "MEMORY", "SIGNAL", "BODY", "MACHINE", "DREAM", "NOIA", "CORE"].map((item, index) => (
            <button key={item} onClick={() => setActiveStage(Math.min(index + 1, stages.length - 1))}>
              <span>00{index + 1}</span><strong>{item}</strong><i /><ArrowUpRight size={18} />
            </button>
          ))}
        </div>
      </section>

      <section className="human section-pad" aria-labelledby="human-title">
        <div className="human-visual"><span className="human-ring ring-one" /><span className="human-ring ring-two" /><div className="human-axis" /><CircleDot size={58} /></div>
        <div className="human-copy"><SectionLabel index="06">THE HUMAN INTERFACE</SectionLabel><p className="eyebrow">CONCEPT CREATION MATTER</p><h2 id="human-title">O humano não é<br />o fim. É o <em>umbral.</em></h2><p className="body-copy">No centro do campo, o corpo não observa um sistema exterior. Ele ocupa o ponto em que o invisível se manifesta. Tecnologia sem humanidade é apenas infraestrutura.</p><p className="signature">BELENTANI — CONCEPT CREATION MATTER</p></div>
      </section>

      <section id="contact" className="contact section-pad" aria-labelledby="contact-title">
        <div className="contact-core" aria-hidden="true"><span /><span /><span /><b /></div>
        <div className="contact-copy"><SectionLabel index="07">COLLABORATION</SectionLabel><p className="eyebrow">THE SYSTEM IS AWAKE.</p><h2 id="contact-title">Entre<br />no <em>campo.</em></h2><p>Uma colaboração começa com uma pergunta que ainda não tem forma.</p><a className="signal-button" href="mailto:hello@noiacore.lab?subject=ENTER%20THE%20CORE"><span>ACTIVATE CONTACT</span><ArrowUpRight size={16} /></a></div>
        <footer><span>NOIACORE LAB © 2026</span><span>CORE IS INVISIBLE. IMPACT IS INEVITABLE.</span><span>BR / ES / WORLD</span></footer>
      </section>

      {activeArtifact !== null && (
        <div className="artifact-modal" role="dialog" aria-modal="true" aria-labelledby="artifact-modal-title" onClick={() => setActiveArtifact(null)}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setActiveArtifact(null)} aria-label="Fechar artefato"><X size={18} /></button>
            <div className="modal-image" style={{ backgroundImage: `url(${artifacts[activeArtifact].image})` }} />
            <div className="modal-copy"><span>{artifacts[activeArtifact].id} / ACTIVE</span><h2 id="artifact-modal-title">{artifacts[activeArtifact].title}</h2><p>{artifacts[activeArtifact].description}</p><button className="text-button" onClick={() => setActiveArtifact(null)}>RETURN TO FIELD <ArrowUpRight size={14} /></button></div>
          </div>
        </div>
      )}
    </main>
  );
}
