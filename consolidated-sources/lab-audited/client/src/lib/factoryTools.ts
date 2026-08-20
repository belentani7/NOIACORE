/**
 * NOIACORE FACTORY / 15 CONNECTED FORCES
 * Los nombres conservan el archivo técnico aportado; las descripciones lo traducen
 * a una narrativa de materia, criterio, memoria y escape room editorial.
 */

export interface ToolDef {
  id: string;
  name: string;
  icon: string;
  category: 'core' | 'dev' | 'office' | 'ai' | 'security' | 'creative';
  description: string;
  initialState?: unknown;
}

export const FACTORY_TOOLS: ToolDef[] = [
  {
    id: 'manuscore',
    name: 'ManusCore OS',
    icon: '',
    category: 'core',
    description: 'La cámara central donde convergen señales, decisiones y continuidad. No muestra el sistema: mantiene su pulso.'
  },
  {
    id: 'claude_code',
    name: 'Claude Code // Noiacore Edition',
    icon: '',
    category: 'dev',
    description: 'Una mesa de precisión para leer estructuras complejas, encontrar fricción y devolver una forma que pueda sostenerse.'
  },
  {
    id: 'powershell',
    name: 'NoiaPowerShell v7.4',
    icon: '',
    category: 'dev',
    description: 'El conducto profundo de la fábrica: una ruta de diagnóstico para atravesar capas y revelar dónde se pierde la energía.'
  },
  {
    id: 'word',
    name: 'NoiaWriter // Manifiesto v2',
    icon: '',
    category: 'office',
    description: 'La sala donde una intuición se convierte en lenguaje, ritmo y una declaración capaz de orientar todo el recorrido.'
  },
  {
    id: 'excel',
    name: 'NoiaSheets // Nómina y Empleados',
    icon: '',
    category: 'office',
    description: 'Una retícula de relaciones humanas y carga de trabajo. La fábrica se vuelve legible sin reducir a nadie a una cifra.'
  },
  {
    id: 'photoshop',
    name: 'NoiaShop // Editor de Capas',
    icon: '',
    category: 'creative',
    description: 'El taller de superficies: recorta, vela y vuelve a iluminar el material hasta que aparece una composición honesta.'
  },
  {
    id: 'dalle',
    name: 'NoiaDALL-E // Generador Visual',
    icon: '',
    category: 'creative',
    description: 'Una cámara de posibilidades donde el lenguaje produce volumen, textura y una imagen que todavía no existía.'
  },
  {
    id: 'noiaclaw',
    name: 'NoiaClaw // Agente Cangrejo',
    icon: '',
    category: 'ai',
    description: 'Un agente lateral, silencioso y obstinado. Rastrea anomalías desde los bordes y protege la integridad del recorrido.'
  },
  {
    id: 'machine_mind',
    name: 'Mente de la Máquina // Shaders 3D',
    icon: '',
    category: 'core',
    description: 'La cámara de profundidad: convierte conexiones abstractas en órbitas, tensión y luz que se puede recorrer.'
  },
  {
    id: 'terminal_ai',
    name: 'Manus AI // Consultor Central',
    icon: '',
    category: 'ai',
    description: 'La inteligencia que ordena la pregunta sin aplanarla y mantiene abiertas varias salidas hasta que una se vuelve necesaria.'
  },
  {
    id: 'vault_sec',
    name: 'SecureVault // Cifrado AES-256',
    icon: '',
    category: 'security',
    description: 'Una cámara de custodia para lo que no debe exponerse. La memoria entra fragmentada y sale con un límite claro.'
  },
  {
    id: 'audio_lab',
    name: 'Resonance // Frecuencia',
    icon: '',
    category: 'creative',
    description: 'El laboratorio de la escucha: calibración de espacio, respiración y pausa. Su estado inicial es el silencio.'
  },
  {
    id: 'network_map',
    name: 'Topology // Topología de Red',
    icon: '',
    category: 'security',
    description: 'Un mapa de proximidades y dependencias que revela qué puerta puede abrirse sin romper la continuidad de la fábrica.'
  },
  {
    id: 'inspector',
    name: 'DOM Inspector // Depurador de Realidad',
    icon: '',
    category: 'dev',
    description: 'Una lente de precisión para separar la piel de la estructura y hacer visible aquello que la experiencia intenta ocultar.'
  },
  {
    id: 'escape_puzzle',
    name: 'Escape Sequence // Última Puerta',
    icon: '',
    category: 'core',
    description: 'La secuencia final del escape room. No desbloquea un premio: prueba que el visitante entendió la arquitectura.'
  }
];
