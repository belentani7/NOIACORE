/* BLACK WATER ENGINE
   Fragment shader authored for this experience.
   Rendering stays on-device; no external assets, shaders or instrumentation. */
(function (global) {
  'use strict';
  const NOIA = global.NOIA = global.NOIA || {};
  const canvas = document.getElementById('water-canvas');
  if (!canvas) return;
  const core = NOIA.core;
  const fallback = () => {
    canvas.style.background = [
      'radial-gradient(ellipse 48% 34% at 64% 35%, rgba(146,192,224,.09), transparent)',
      'linear-gradient(180deg,#020406 0%, #050b10 48%, #02080d 51%, #030609 100%)'
    ].join(',');
  };
  const vertex = `
    attribute vec2 aPosition;
    varying vec2 vUv;
    void main() {
      vUv = aPosition * 0.5 + 0.5;
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }
  `;
  const fragment = `
    precision mediump float;
    varying vec2 vUv;
    uniform vec2 uResolution;
    uniform vec2 uPointer;
    uniform float uTime;
    uniform float uPulse;
    uniform float uScene;
    uniform float uMotion;
    uniform float uEnergy;
    float hash21(vec2 p) {
      p = fract(p * vec2(123.34, 345.45));
      p += dot(p, p + 34.345);
      return fract(p.x * p.y);
    }
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash21(i),hash21(i+vec2(1.0,0.0)),u.x),
                 mix(hash21(i+vec2(0.0,1.0)),hash21(i+1.0),u.x),u.y);
    }
    float fbm(vec2 p) {
      float value = 0.0;
      float amp = 0.5;
      for (int i = 0; i < 5; i++) {
        value += amp * noise(p);
        p = p * 2.03 + 11.4;
        amp *= 0.51;
      }
      return value;
    }
    float wave(vec2 p, float t) {
      float a = sin(p.x*8.0 + p.y*3.0 + t*0.35);
      float b = sin(p.x*21.0 - p.y*6.0 - t*.55);
      float c = sin(p.x*42.0 + p.y*8.0 + t*.28);
      float n = fbm(p*5.0 + vec2(t*.1,t*.06));
      return a*.21 + b*.12 + c*.045 + n*.48;
    }
    float thinRing(float radius, float target, float thickness) {
      return exp(-pow((radius-target)/thickness,2.0));
    }
    void main() {
      vec2 uv = vUv;
      vec2 aspect = vec2(uResolution.x/max(uResolution.y,1.0),1.0);
      vec2 q = (uv-.5) * aspect;
      float t = uTime * uMotion;
      vec2 parallax = (uPointer-.5) * vec2(.05,.018);
      float horizon = .515 + .022*sin(q.x*.52+t*.04);
      float depth = clamp((horizon-uv.y)*2.3,0.0,1.0);
      vec3 base = vec3(.006,.011,.017);
      vec3 ink = vec3(.012,.024,.034);
      vec3 milk = vec3(.65,.77,.85);
      vec3 cold = vec3(.11,.21,.30);
      float skyNoise = fbm(q*vec2(2.3,3.0) + vec2(1.0,t*.016));
      float shroud = exp(-pow(length((q-parallax)*vec2(1.3,1.8))/.63,2.0));
      vec3 sky = mix(base, ink, .35 + .24*skyNoise);
      float beam = exp(-pow((q.x - .18 - parallax.x)/(.28+.15*(uv.y)),2.0));
      beam *= smoothstep(.15, .88, uv.y);
      sky += milk * beam * (.023 + .014*skyNoise);
      sky += vec3(.045,.085,.11) * shroud * .19;
      vec2 stars = (q+vec2(3.21,2.13))*vec2(185.0,104.0);
      vec2 sid = floor(stars);
      float scatter = hash21(sid);
      float brightness = step(.996,scatter)*pow(1.0-length(fract(stars)-.5)*1.9,3.0);
      brightness *= .24 + .12*sin(t*.15 + scatter*23.0);
      brightness *= smoothstep(horizon+.03,horizon+.25,uv.y);
      sky += milk * brightness;
      vec3 color = sky;
      if (uv.y < horizon) {
        float d = max(.004, horizon-uv.y);
        float perspective = 1.0/(d*10.0+.06);
        vec2 w = vec2(q.x*(1.0+perspective*.7), perspective*.8);
        w += parallax*.35;
        float n = fbm(w*1.7 + vec2(t*.08,t*.03));
        float ripple = wave(w, t);
        float thin = abs(sin((w.y*24.0+w.x*13.0+ripple*4.5)*1.75));
        float crest = pow(thin, 26.0)*.16;
        float reflected = exp(-pow((q.x-.14-parallax.x)/(.095+d*.8),2.0));
        reflected *= pow(1.0-smoothstep(.0,.64,d),.7);
        float current = n*.12 + ripple*.08;
        vec3 ocean = mix(base, ink, clamp(.21+n*.35,0.0,1.0));
        ocean += cold * (crest*.15 + max(.0,ripple)*.035);
        ocean += milk * reflected * (crest*.19 + n*.024 + .006);
        float edge = exp(-pow(d/.014,2.0));
        ocean += milk * edge * (.03 + .018*n);
        color = mix(ocean,sky,smoothstep(-.014,.024,uv.y-horizon));
        color += milk * max(0.0,current) * .015;
      }
      float center = length((q-vec2(.17, .075)-parallax)*vec2(1.0,1.3));
      float darkLens = 1.0-smoothstep(.04,.32,center);
      color *= 1.0 - darkLens * (.09 + .02*uScene);
      float ring = thinRing(center,.29,.0045);
      color += vec3(.14,.2,.25)*ring*.075;
      float pulseRadius = fract(uPulse)*1.3;
      float pulseStrength = exp(-pow((center-pulseRadius)/.025,2.0))*(1.0-fract(uPulse));
      color += milk*pulseStrength*.025;
      float focus = exp(-pow(length(q*vec2(.9,1.1))/.68,2.0));
      color += milk * focus * .004*uEnergy;
      float vignette = 1.0-smoothstep(.4,1.25,length(q*vec2(1.0,1.5)));
      color *= .47 + .53*vignette;
      color = pow(max(color,0.0),vec3(.88));
      gl_FragColor = vec4(color,1.0);
    }
  `;
  let gl = null;
  let program = null;
  let raf = 0;
  let start = performance.now();
  let last = 0;
  let moving = core?.motion ?? true;
  let active = true;
  let pageVisible = !document.hidden;
  let size = { x: 1, y: 1 };
  let position = { x: .5, y: .5 };
  let target = { x: .5, y: .5 };
  let pulse = 1;
  let energy = .25;
  const sceneIds = { index: 1, portal: 2, universos: 3, laboratorio: 4 };
  const scene = sceneIds[document.body.dataset.page] || 0;
  function shader(type, source) {
    const s = gl.createShader(type);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      gl.deleteShader(s);
      return null;
    }
    return s;
  }
  function setup() {
    try {
      gl = canvas.getContext('webgl', {
        alpha: false, antialias: false, depth: false,
        powerPreference: 'low-power', preserveDrawingBuffer: false
      });
      if (!gl) return false;
      const vert = shader(gl.VERTEX_SHADER, vertex);
      const frag = shader(gl.FRAGMENT_SHADER, fragment);
      if (!vert || !frag) return false;
      program = gl.createProgram();
      gl.attachShader(program, vert);
      gl.attachShader(program, frag);
      gl.linkProgram(program);
      gl.deleteShader(vert);
      gl.deleteShader(frag);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return false;
      const array = new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]);
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW);
      gl.useProgram(program);
      const pointer = gl.getAttribLocation(program, 'aPosition');
      gl.enableVertexAttribArray(pointer);
      gl.vertexAttribPointer(pointer, 2, gl.FLOAT, false, 0, 0);
      return true;
    } catch { return false; }
  }
  let uniforms = null;
  function locateUniforms() {
    uniforms = {};
    ['uResolution','uPointer','uTime','uPulse','uScene','uMotion','uEnergy'].forEach((name) => {
      uniforms[name] = gl.getUniformLocation(program, name);
    });
  }
  function resize() {
    if (!gl) return;
    const dpr = Math.min(global.devicePixelRatio || 1, global.innerWidth < 700 ? 1 : 1.45);
    const width = Math.max(1, Math.floor(global.innerWidth*dpr));
    const height = Math.max(1, Math.floor(global.innerHeight*dpr));
    if (size.x === width && size.y === height) return;
    size = { x: width, y: height };
    canvas.width = width;
    canvas.height = height;
    gl.viewport(0,0,width,height);
  }
  function uniformsUpdate(seconds) {
    gl.uniform2f(uniforms.uResolution,size.x,size.y);
    gl.uniform2f(uniforms.uPointer,position.x,position.y);
    gl.uniform1f(uniforms.uTime,seconds);
    gl.uniform1f(uniforms.uPulse,pulse);
    gl.uniform1f(uniforms.uScene,scene);
    gl.uniform1f(uniforms.uMotion,moving ? 1 : 0);
    gl.uniform1f(uniforms.uEnergy,energy);
  }
  function draw(now) {
    raf = 0;
    if (!active || !pageVisible || !gl) return;
    const minInterval = global.innerWidth < 700 ? 32 : 24;
    if (now-last < minInterval) { raf = requestAnimationFrame(draw); return; }
    last = now;
    position.x += (target.x-position.x)*.055;
    position.y += (target.y-position.y)*.055;
    pulse = Math.min(2,pulse+.007);
    energy = Math.max(.2,energy*.975);
    resize();
    uniformsUpdate((now-start)/1000);
    gl.drawArrays(gl.TRIANGLES,0,6);
    if (moving) raf = requestAnimationFrame(draw);
  }
  function schedule() {
    if (!raf && active && pageVisible && gl) raf = requestAnimationFrame(draw);
  }
  function setActive(value) {
    active = Boolean(value);
    canvas.style.visibility = active ? 'visible' : 'hidden';
    if (active) schedule();
    else if (raf) { cancelAnimationFrame(raf); raf = 0; }
  }
  function setPointer(event) {
    target.x = core.clamp(event.clientX/global.innerWidth,0,1);
    target.y = 1-core.clamp(event.clientY/global.innerHeight,0,1);
    if (!moving) schedule();
  }
  function sendPulse() {
    pulse = 0;
    energy = 1;
    schedule();
  }
  function init() {
    fallback();
    if (!setup()) return;
    locateUniforms();
    core.subscribeMotion((enabled) => {
      moving = enabled;
      start = moving ? performance.now() - Math.min(90,(performance.now()-start)/1000)*1000 : start;
      schedule();
    });
    global.addEventListener('pointermove',setPointer,{passive:true});
    global.addEventListener('pointerdown',sendPulse,{passive:true});
    global.addEventListener('resize',schedule,{passive:true});
    document.addEventListener('visibilitychange',() => {
      pageVisible = !document.hidden;
      if (!pageVisible && raf) { cancelAnimationFrame(raf); raf = 0; }
      else schedule();
    });
    canvas.addEventListener('webglcontextlost',(event) => {
      event.preventDefault();
      if (raf) cancelAnimationFrame(raf);
      raf = 0; gl = null;
      fallback();
    });
    canvas.addEventListener('webglcontextrestored',() => {
      if (setup()) { locateUniforms(); size = {x:0,y:0}; schedule(); }
    });
    schedule();
  }
  NOIA.water = { setActive, pulse: sendPulse, get active() { return active; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init);
  else init();
})(window);
