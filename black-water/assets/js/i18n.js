/* Locale selection covers the core front-of-house experience.
   Untranslated editorial sections intentionally remain in their authored language. */
(function (global) {
  'use strict';
  const storageKey = 'noiacore.language';
  const dictionary = {
    es: {
      'home.overline': 'UNA NUEVA FORMA DE ESTAR PRESENTE',
      'home.title': 'La inteligencia<br><em>no hace ruido.</em>',
      'home.description': 'No se exhibe. Observa. Aprende del contexto y revela exactamente la puerta que necesitas abrir.',
      'nave.welcome': 'Soy NAVE, una interfaz local para orientar tu recorrido.',
      'nave.hint': 'Escribe una intención o HELP para ver los comandos.',
      'nave.unknown': 'No he encontrado una relación clara. Prueba con arquitectura, experiencias, herramientas, filosofía o colaboración.',
      'nave.detected': 'INTENCIÓN INTERPRETADA',
      'nave.reasons': 'Señales reconocidas',
      'nave.alternatives': 'Otras rutas',
      'nave.ready': 'SEÑAL DISPONIBLE',
      'nave.link': 'Abrir región',
      'nave.reset': 'Preferencias locales restablecidas.',
      'nave.cleared': 'Consola vaciada.',
      'nave.invalid': 'Comando desconocido. Prueba HELP.',
      'nave.local': 'El motor no envía mensajes ni consulta modelos externos.',
      'nave.no-model': 'No hay modelo generativo configurado; las rutas se obtienen mediante reglas locales transparentes.',
      'lab.empty': 'Introduce un valor para procesarlo.',
      'lab.processing': 'Procesando localmente…',
      'lab.ready': 'Proceso ejecutado localmente.',
      'lab.copied': 'Resultado copiado.',
      'lab.failed': 'No fue posible ejecutar la operación.',
      'copy.failed': 'El navegador no permitió copiar. Selecciona el texto manualmente.',
      'brief.ready': 'Documento generado y descargado. No se ha enviado a nadie.',
      'brief.pending': 'Completa el briefing y acepta la condición antes de continuar.'
    },
    en: {
      'home.overline': 'A NEW WAY OF BEING PRESENT',
      'home.title': 'Intelligence<br><em>does not shout.</em>',
      'home.description': 'It does not perform. It observes, interprets context and reveals the path you actually need.',
      'nave.welcome': 'I am NAVE, a local interface for navigating this ecosystem.',
      'nave.hint': 'Write an intention or HELP for available commands.',
      'nave.unknown': 'No clear match yet. Try architecture, experiences, tools, philosophy or collaboration.',
      'nave.detected': 'INTENT RECOGNIZED',
      'nave.reasons': 'Recognized signals',
      'nave.alternatives': 'Alternative paths',
      'nave.ready': 'SIGNAL READY',
      'nave.link': 'Open region',
      'nave.reset': 'Local preferences reset.',
      'nave.cleared': 'Console cleared.',
      'nave.invalid': 'Unknown command. Try HELP.',
      'nave.local': 'The engine does not send messages or use external models.',
      'nave.no-model': 'No generative model is configured; recommendations rely on transparent local rules.',
      'lab.empty': 'Enter something to process.',
      'lab.processing': 'Processing locally…',
      'lab.ready': 'Processed locally.',
      'lab.copied': 'Result copied.',
      'lab.failed': 'The operation could not be completed.',
      'copy.failed': 'Clipboard access denied; select the result manually.',
      'brief.ready': 'Briefing downloaded. Nothing has been sent.',
      'brief.pending': 'Complete the briefing and consent before proceeding.'
    },
    pt: {
      'home.overline': 'UMA NOVA FORMA DE ESTAR PRESENTE',
      'home.title': 'A inteligência<br><em>não faz ruído.</em>',
      'home.description': 'Não se exibe. Observa o contexto e revela o caminho que realmente precisas.',
      'nave.welcome': 'Sou NAVE, uma interface local para orientar o teu percurso.',
      'nave.hint': 'Escreve uma intenção ou HELP para ver os comandos.',
      'nave.unknown': 'Ainda sem correspondência clara. Experimenta arquitetura, experiências, ferramentas, filosofia ou colaboração.',
      'nave.detected': 'INTENÇÃO INTERPRETADA',
      'nave.reasons': 'Sinais reconhecidos',
      'nave.alternatives': 'Outras rotas',
      'nave.ready': 'SINAL DISPONÍVEL',
      'nave.link': 'Abrir região',
      'nave.reset': 'Preferências locais repostas.',
      'nave.cleared': 'Consola limpa.',
      'nave.invalid': 'Comando desconhecido. Experimenta HELP.',
      'nave.local': 'O motor não envia mensagens nem consulta modelos externos.',
      'nave.no-model': 'Não há modelo generativo configurado; as rotas resultam de regras locais transparentes.',
      'lab.empty': 'Introduz um valor para processar.',
      'lab.processing': 'A processar localmente…',
      'lab.ready': 'Operação executada localmente.',
      'lab.copied': 'Resultado copiado.',
      'lab.failed': 'Não foi possível executar a operação.',
      'copy.failed': 'Cópia não permitida pelo navegador. Seleciona o texto manualmente.',
      'brief.ready': 'Documento descarregado. Nada foi enviado.',
      'brief.pending': 'Preenche o briefing e aceita a condição para continuar.'
    }
  };
  function safeRead() {
    try { return localStorage.getItem(storageKey); }
    catch { return null; }
  }
  function safeWrite(value) {
    try { localStorage.setItem(storageKey, value); }
    catch { /* Private browsing may disable storage; state remains in memory. */ }
  }
  let current = ['es', 'en', 'pt'].includes(safeRead()) ? safeRead() : 'es';
  function translate(key) {
    return dictionary[current]?.[key] || dictionary.es[key] || key;
  }
  function apply() {
    document.documentElement.lang = current;
    document.querySelectorAll('[data-i18n]').forEach((node) => {
      const key = node.getAttribute('data-i18n');
      const value = translate(key);
      if (key === 'home.title') {
        const [first, second] = value.split('<br>');
        node.replaceChildren(document.createTextNode(first));
        const br = document.createElement('br');
        const em = document.createElement('em');
        em.textContent = second.replace(/<\/?em>/g, '');
        node.append(br, em);
      } else {
        node.textContent = value;
      }
    });
    const button = document.getElementById('lang-button');
    if (button) button.textContent = current.toUpperCase();
    window.dispatchEvent(new CustomEvent('noia:language', { detail: { lang: current } }));
  }
  function setLanguage(value) {
    if (!['es', 'en', 'pt'].includes(value)) return false;
    current = value;
    safeWrite(value);
    apply();
    return true;
  }
  function cycle() {
    const choices = ['es', 'en', 'pt'];
    setLanguage(choices[(choices.indexOf(current) + 1) % choices.length]);
  }
  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('lang-button')?.addEventListener('click', cycle);
    apply();
  });
  global.NOIA = global.NOIA || {};
  global.NOIA.i18n = { translate, setLanguage, get current() { return current; } };
})(window);
