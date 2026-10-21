/* Content schema is authored, reviewable and safe to render with textContent.
   No customer prompt is sent to a service or persisted in its original form. */
(function (global) {
  'use strict';
  const DATA = {
    product: 'NOIACORE / BLACK WATER',
    identity: 'INTELIGÊNCIA SILENCIOSA. TECNOLOGIA ESSENCIAL.',
    claim: 'Core is invisible. Impact is inevitable.',
    release: 'local-preview-1.0',
    regions: [
      {
        id: 'sistemas',
        number: '01',
        name: 'ARQUITECTURA',
        signal: 'Structure / Integrity',
        description: 'Sistemas, diseño de decisiones, límites y seguridad.',
        longDescription: 'Arquitectura de sistemas conscientes del contexto, capas de servicio y diseño responsable de procesos.',
        href: 'sistemas.html',
        key: 'CONTEXT',
        node: [-.63, -.12],
        glow: .72,
        synonyms: ['arquitectura', 'sistema', 'sistemas', 'software', 'ingenieria', 'código', 'desarrollo', 'infraestructura', 'backend', 'frontend', 'ai', 'ia', 'inteligencia', 'arquitetura', 'architecture', 'engineering', 'system', 'systems', 'api', 'integracion', 'integración', 'automatizacion', 'automatización', 'workforce', 'seguridad', 'security', 'trust', 'safety', 'privacidad', 'privacy', 'gobernanza', 'governance']
      },
      {
        id: 'arte',
        number: '02',
        name: 'EXPERIENCIAS',
        signal: 'Art / Perception',
        description: 'Experiencias inmersivas, percepción y espacio digital.',
        longDescription: 'Dirección visual, geometría emocional, arte generativo y diseño sensorial sobrio.',
        href: 'universos.html#galaxia-arte',
        key: 'PERCEPTION',
        node: [.52, -.48],
        glow: .95,
        synonyms: ['arte', 'artistico', 'artístico', 'creatividad', 'creativo', 'creativa', 'imagen', 'video', 'vídeo', 'visual', 'immersive', 'inmersivo', 'inmersiva', 'galaxia', 'galaxias', 'escena', 'cine', 'musica', 'música', 'sound', 'audio', 'sonido', 'art', 'experience', 'film', 'music', 'design', 'diseño', 'branding', 'identidad', 'marca', 'website', 'sitio', 'web', 'landing', 'interfaz', 'interface', 'portfolio', 'portafolio']
      },
      {
        id: 'herramientas',
        number: '03',
        name: 'HERRAMIENTAS',
        signal: 'Utility / Creation',
        description: 'Transformaciones reales para texto, datos y código.',
        longDescription: 'Una mesa de trabajo autónoma para procesar información sin entregarla a terceros.',
        href: 'laboratorio.html',
        key: 'UTILITY',
        node: [.71, .28],
        glow: .7,
        synonyms: ['herramienta', 'herramientas', 'utilidad', 'utilidades', 'formatear', 'transformar', 'json', 'csv', 'texto', 'text', 'data', 'datos', 'slug', 'unicode', 'regex', 'regexp', 'html', 'url', 'base64', 'codificar', 'decodificar', 'procesar', 'tool', 'tools', 'formatter', 'format', 'convert', 'conversion', 'converter', 'limpiar', 'normalizar', 'word', 'palabra', 'contador']
      },
      {
        id: 'portal',
        number: '04',
        name: 'NAVE / PORTAL',
        signal: 'Intent / Discovery',
        description: 'La interfaz adapta el recorrido a lo que necesitas.',
        longDescription: 'Un motor local de intención recomienda caminos y explica cómo llegó a ellos.',
        href: 'portal.html',
        key: 'GUIDANCE',
        node: [-.18, .12],
        glow: 1.0,
        synonyms: ['nave', 'terminal', 'portal', 'buscar', 'búsqueda', 'encontrar', 'explorar', 'ayuda', 'ayudar', 'necesito', 'quiero', 'preguntar', 'consulta', 'consultar', 'busca', 'discovery', 'search', 'find', 'help', 'question', 'guia', 'guía', 'orientacion', 'orientación', 'asistente', 'assistant']
      },
      {
        id: 'principios',
        number: '05',
        name: 'MANIFIESTO',
        signal: 'Ethics / Silence',
        description: 'Silencio, privacidad, honestidad y forma.',
        longDescription: 'La ética de una interfaz que acompaña sin apropiarse de la atención.',
        href: 'manifiesto.html',
        key: 'PHILOSOPHY',
        node: [.13, -.81],
        glow: .53,
        synonyms: ['principio', 'principios', 'filosofia', 'filosofía', 'ética', 'etica', 'manifesto', 'manifiesto', 'values', 'valores', 'silencio', 'silenciosa', 'silent', 'quiet', 'memory', 'memoria', 'responsable', 'ethics', 'principle', 'philosophy', 'accesibilidad', 'accessibility', 'sin cookies']
      },
      {
        id: 'contacto',
        number: '06',
        name: 'COLABORACIÓN',
        signal: 'Human / Direction',
        description: 'Definir una colaboración desde un briefing claro.',
        longDescription: 'Convertir una idea o necesidad en una propuesta legible y portable.',
        href: 'contacto.html',
        key: 'COLLABORATION',
        node: [-.60, .65],
        glow: .65,
        synonyms: ['contacto', 'contactar', 'colaboracion', 'colaboración', 'cliente', 'clientes', 'proyecto', 'propuesta', 'presupuesto', 'brief', 'briefing', 'negocio', 'empresa', 'contratar', 'servicio', 'servicios', 'email', 'correo', 'contact', 'collaborate', 'collaboration', 'business', 'client', 'quote', 'proposal', 'hire', 'work', 'equipo', 'team']
      }
    ],
    commands: [
      { word: 'HELP', description: 'Muestra todos los comandos' },
      { word: 'STATUS', description: 'Estado verificable de la interfaz' },
      { word: 'EXPLORE', description: 'Enumera regiones de NOIACORE' },
      { word: 'SEARCH [texto]', description: 'Interpreta una intención' },
      { word: 'OPEN [región]', description: 'Abre una región local' },
      { word: 'WATER [ON|OFF]', description: 'Activa o pausa el agua procedural' },
      { word: 'EYE [ON|OFF]', description: 'Activa o pausa el ojo visual' },
      { word: 'MOTION [ON|OFF]', description: 'Controla el movimiento' },
      { word: 'LANG [ES|EN|PT]', description: 'Selecciona idioma de la interfaz' },
      { word: 'TIME', description: 'Hora local del navegador' },
      { word: 'HISTORY', description: 'Últimos comandos de esta sesión; no persistidos' },
      { word: 'SAVE', description: 'Descarga JSON de preferencias (sin consultas ni secretos)' },
      { word: 'LOAD', description: 'Importa un JSON local de preferencias validado' },
      { word: 'CLEAR', description: 'Limpia la consola' },
      { word: 'RESET', description: 'Restablece preferencias locales' }
    ],
    quickIntents: [
      { q: 'Quiero diseñar una web inmersiva', title: 'Experiencia visual' },
      { q: 'Necesito formatear y limpiar datos JSON', title: 'Datos y utilidades' },
      { q: 'Cómo funciona la terminal NAVE', title: 'Conocer la interfaz' },
      { q: 'Quiero hablar de una colaboración', title: 'Colaborar' },
      { q: 'Me preocupan la seguridad y privacidad', title: 'Seguridad' }
    ]
  };
  global.NOIA = global.NOIA || {};
  global.NOIA.DATA = DATA;
})(window);
