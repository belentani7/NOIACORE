/* LIVING EYE / local pointer-responsive artwork.
   Deliberately does not request camera, microphone, face tracking or identity. */
(function (global) {
  'use strict';
  const NOIA = global.NOIA = global.NOIA || {};
  let enabled = true;
  let motion = true;
  let pointer = { x: 0, y: 0 };
  let current = { x: 0, y: 0 };
  let raf = null;
  let targets = [];
  function render() {
    raf = null;
    if (!enabled || !motion || document.hidden) return;
    current.x += (pointer.x - current.x) * .055;
    current.y += (pointer.y - current.y) * .055;
    for (const item of targets) {
      const iris = item.querySelector('.eye-iris');
      if (!iris) continue;
      const x = current.x * 10;
      const y = current.y * 8;
      iris.style.transform = `translate(calc(-50% + ${x.toFixed(2)}px), calc(-50% + ${y.toFixed(2)}px)) rotate(45deg)`;
    }
    raf = requestAnimationFrame(render);
  }
  function schedule() {
    if (!raf && enabled && motion && !document.hidden) raf = requestAnimationFrame(render);
  }
  function onMove(event) {
    pointer.x = NOIA.core.clamp((event.clientX/global.innerWidth-.5)*2,-1,1);
    pointer.y = NOIA.core.clamp((event.clientY/global.innerHeight-.5)*2,-1,1);
    schedule();
  }
  function setActive(value) {
    enabled = Boolean(value);
    document.querySelectorAll('[data-eye]').forEach((eye) => {
      eye.style.visibility = enabled ? 'visible' : 'hidden';
    });
    if (!enabled && raf) { cancelAnimationFrame(raf); raf = null; }
    else schedule();
  }
  function init() {
    targets = [...document.querySelectorAll('[data-eye]')];
    if (!targets.length) return;
    NOIA.core.subscribeMotion((value) => {
      motion = value;
      if (!motion && raf) { cancelAnimationFrame(raf); raf = null; }
      else schedule();
    });
    global.addEventListener('pointermove',onMove,{passive:true});
    document.addEventListener('visibilitychange',schedule);
    schedule();
  }
  NOIA.eye = { setActive, get active() { return enabled; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init);
  else init();
})(window);
