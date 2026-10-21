/* LIVING ATLAS / responsive on-device star chart.
   Six grounded content regions; no invented project count or simulated servers. */
(function (global) {
  'use strict';
  const NOIA = global.NOIA = global.NOIA || {};
  const canvas = document.getElementById('atlas-canvas');
  const grid = document.getElementById('constellation-grid');
  const regions = NOIA.DATA.regions;
  if (!canvas && !grid) return;
  const core = NOIA.core;
  const ctx = canvas?.getContext('2d') || null;
  let width = 1;
  let height = 1;
  let dpr = 1;
  let frame = 0;
  let running = true;
  let motion = core.motion;
  let hover = -1;
  let active = -1;
  let lastFrame = 0;
  let start = performance.now();
  let focus = { x: 0, y: 0 };
  let camera = { x: 0, y: 0 };
  let pointerDown = null;
  let suppressClick = false;
  const stars = [];
  const tooltip = document.getElementById('atlas-tooltip');
  const palette = {
    void: '#040a0f',
    mist: '#d6e9f4',
    line: 'rgba(153,192,220,.19)',
    hair: 'rgba(217,239,253,.07)',
    soft: 'rgba(184,220,241,.38)',
    faint: 'rgba(177,216,241,.07)'
  };
  function seeded(n) {
    let x = n | 0;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return ((x >>> 0) % 100000) / 100000;
  }
  function initStars() {
    stars.length = 0;
    for (let i=0;i<240;i++) {
      stars.push({
        x: seeded(i*621+75),
        y: seeded(i*1103+3),
        r: .2 + seeded(i*71+116)*1.2,
        depth: .1 + seeded(i*147+9)*.9,
        phase: seeded(i*123+40)*6.283
      });
    }
  }
  function createCards() {
    if (!grid) return;
    regions.forEach((item) => {
      const article = core.create('a','constellation-card');
      article.href = item.href;
      article.id = 'galaxia-' + item.id;
      const number = core.create('span','constellation-number',item.number+' / '+item.signal);
      const title = core.create('h3','',item.name);
      const desc = core.create('p','',item.description);
      const signal = core.create('span','constellation-key',item.key);
      const arrow = core.create('span','constellation-arrow','↗');
      article.append(number,title,desc,signal,arrow);
      grid.append(article);
    });
  }
  function centerPosition() {
    return [width*.5, height*.53];
  }
  function at(point) {
    const [cx,cy] = centerPosition();
    const span = Math.min(width*.46,height*.45);
    return {
      x: cx + point[0]*span + camera.x,
      y: cy + point[1]*span + camera.y
    };
  }
  function radial(x,y,r,color) {
    const g = ctx.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0,color);
    g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x-r,y-r,r*2,r*2);
  }
  function line(x,y,x2,y2,opacity=.2,widthLine=1) {
    ctx.beginPath();
    ctx.moveTo(x,y);
    ctx.lineTo(x2,y2);
    ctx.strokeStyle = `rgba(177,210,230,${opacity})`;
    ctx.lineWidth = widthLine;
    ctx.stroke();
  }
  function circle(x,y,r,stroke,alpha=1) {
    ctx.beginPath();
    ctx.arc(x,y,r,0,Math.PI*2);
    ctx.strokeStyle = stroke;
    ctx.globalAlpha = alpha;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  function background(time) {
    const gradient = ctx.createRadialGradient(width*.5,height*.53,0,width*.5,height*.53,Math.max(width,height)*.75);
    gradient.addColorStop(0,'#0d1c29');
    gradient.addColorStop(.38,'#06101a');
    gradient.addColorStop(1,palette.void);
    ctx.fillStyle = gradient;
    ctx.fillRect(0,0,width,height);
    radial(width*.52,height*.46,width*.39,'rgba(107,163,200,.035)');
    ctx.lineWidth = 1;
    for (let i=0;i<10;i++) {
      const x=width*i/9;
      line(x,0,x,height,.04);
    }
    for (let i=0;i<9;i++) {
      const y=height*i/8;
      line(0,y,width,y,.04);
    }
    for (const star of stars) {
      const twinkle = motion ? .65+.35*Math.sin(time*.25+star.phase) : .75;
      const px = star.x*width + camera.x*star.depth*.12;
      const py = star.y*height + camera.y*star.depth*.12;
      ctx.beginPath();
      ctx.arc(px,py,star.r,0,Math.PI*2);
      ctx.fillStyle=`rgba(200,226,242,${(.08+.32*star.depth)*twinkle})`;
      ctx.fill();
    }
  }
  function drawPaths(time) {
    const positions = regions.map((r)=>at(r.node));
    const connections = [[0,3],[1,3],[2,3],[3,4],[3,5],[0,4],[2,5],[1,2]];
    for (const [a,b] of connections) {
      const source = positions[a];
      const target = positions[b];
      const opacity = hover===a || hover===b ? .38 : .14;
      line(source.x,source.y,target.x,target.y,opacity);
      if (motion) {
        const speed = (time*.025+(a*.13+b*.09))%1;
        const x=source.x+(target.x-source.x)*speed;
        const y=source.y+(target.y-source.y)*speed;
        radial(x,y,14,'rgba(212,236,248,.12)');
      }
    }
    return positions;
  }
  function drawNode(point,item,index,time) {
    const hovered=index===hover;
    const selected=index===active;
    const radius=hovered?35:27;
    const breathing=motion ? Math.sin(time*.85+index*2)*3 : 0;
    radial(point.x,point.y,radius*4,hovered?'rgba(156,201,232,.18)':'rgba(157,195,220,.065)');
    circle(point.x,point.y,radius+breathing,'rgba(200,228,246,.25)');
    circle(point.x,point.y,radius+17+breathing*.5,'rgba(189,221,243,.08)');
    if (hovered || selected) circle(point.x,point.y,radius+31,'rgba(212,237,252,.17)');
    ctx.beginPath();
    ctx.arc(point.x,point.y,3.7+(hovered?1.3:0),0,Math.PI*2);
    ctx.fillStyle='#d7edfa';
    ctx.shadowBlur=20;
    ctx.shadowColor='#8ec0df';
    ctx.fill();
    ctx.shadowBlur=0;
    ctx.textAlign='center';
    ctx.fillStyle=hovered?'#f1faff':'#c4dbe9';
    ctx.font='11px Consolas,monospace';
    ctx.fillText(item.name,point.x,point.y-radius-29);
    ctx.font='9px Consolas,monospace';
    ctx.fillStyle='#6e93aa';
    ctx.fillText(item.number+' / '+item.key,point.x,point.y+radius+29);
  }
  function drawCompass() {
    const x=width*.5+camera.x;
    const y=height*.53+camera.y;
    circle(x,y,Math.min(width,height)*.22,'rgba(199,224,241,.09)');
    circle(x,y,Math.min(width,height)*.33,'rgba(199,224,241,.045)');
    line(x-8,y,x+8,y,.18);
    line(x,y-8,x,y+8,.18);
  }
  function paint(time) {
    if (!ctx) return;
    background(time);
    drawCompass();
    const positions=drawPaths(time);
    positions.forEach((point,i)=>drawNode(point,regions[i],i,time));
  }
  function animate(now) {
    frame = 0;
    if (!running || document.hidden) return;
    if (now-lastFrame<32) { frame=requestAnimationFrame(animate); return; }
    lastFrame=now;
    if (motion) {
      camera.x+=(focus.x-camera.x)*.04;
      camera.y+=(focus.y-camera.y)*.04;
    } else {
      camera.x=focus.x;
      camera.y=focus.y;
    }
    paint((now-start)/1000);
    if (motion) frame=requestAnimationFrame(animate);
  }
  function schedule() {
    if (!frame && running && !document.hidden) frame=requestAnimationFrame(animate);
  }
  function resize() {
    if (!canvas || !ctx) return;
    const bounds=canvas.getBoundingClientRect();
    dpr=Math.min(global.devicePixelRatio||1,1.75);
    width=Math.max(1,bounds.width);
    height=Math.max(1,bounds.height);
    canvas.width=Math.round(width*dpr);
    canvas.height=Math.round(height*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    schedule();
  }
  function pointFromEvent(event) {
    const rect=canvas.getBoundingClientRect();
    return {x:event.clientX-rect.left,y:event.clientY-rect.top};
  }
  function hitTest(point) {
    let closest=-1, distance=Infinity;
    for (let i=0;i<regions.length;i++) {
      const location=at(regions[i].node);
      const delta=Math.hypot(location.x-point.x,location.y-point.y);
      if (delta<53 && delta<distance) { closest=i; distance=delta; }
    }
    return closest;
  }
  function onMove(event) {
    const position=pointFromEvent(event);
    hover=hitTest(position);
    canvas.style.cursor=hover>=0?'pointer':'grab';
    if (hover>=0 && tooltip) {
      tooltip.textContent=regions[hover].name+' · '+regions[hover].description;
      tooltip.hidden=false;
    } else if (tooltip) tooltip.hidden=true;
    if (pointerDown && event.buttons===1) {
      if (Math.hypot(event.clientX-pointerDown.x,event.clientY-pointerDown.y)>6) pointerDown.moved=true;
      focus.x=Math.max(-90,Math.min(90,pointerDown.panX+event.clientX-pointerDown.x));
      focus.y=Math.max(-75,Math.min(75,pointerDown.panY+event.clientY-pointerDown.y));
    }
    schedule();
  }
  function onClick(event) {
    if (suppressClick) {
      suppressClick=false;
      return;
    }
    const position=pointFromEvent(event);
    const hit=hitTest(position);
    if (hit>=0) {
      active=hit;
      core.navigate(regions[hit].href);
    }
  }
  function reset() {
    focus={x:0,y:0};
    camera={x:0,y:0};
    active=-1; hover=-1;
    schedule();
  }
  function init() {
    createCards();
    if (!ctx) return;
    initStars();
    resize();
    core.subscribeMotion((value)=>{
      motion=value;
      if (!motion && frame) { cancelAnimationFrame(frame); frame=0; }
      schedule();
    });
    canvas.addEventListener('pointermove',onMove,{passive:true});
    canvas.addEventListener('pointerleave',()=>{hover=-1;if(tooltip)tooltip.hidden=true;});
    canvas.addEventListener('pointerdown',(event)=>{
      suppressClick=false;
      pointerDown={x:event.clientX,y:event.clientY,panX:focus.x,panY:focus.y,moved:false};
      canvas.setPointerCapture?.(event.pointerId);
    });
    canvas.addEventListener('pointerup',()=>{
      if (pointerDown?.moved) suppressClick=true;
      pointerDown=null;
    });
    canvas.addEventListener('pointercancel',()=>{pointerDown=null;suppressClick=false;});
    canvas.addEventListener('click',onClick);
    document.getElementById('atlas-reset')?.addEventListener('click',reset);
    global.addEventListener('resize',resize,{passive:true});
    document.addEventListener('visibilitychange',schedule);
  }
  NOIA.atlas={reset};
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();
})(window);
