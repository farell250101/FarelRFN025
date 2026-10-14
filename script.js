/* ==========================================================================
   LUXURY SKY — nature x art interactive layer
   Sunrise → Blue Sky → Golden Sunset → Pink Sunset → Twilight → Milky Way
   Langit berubah mengikuti scroll, kursor emas dengan ribbon & sparkle,
   reveal halus, tilt 3D, magnetic button, dan scroll progress.
   Cara pakai: <script src="luxury-sky.js" defer></script> sebelum </body>
   ========================================================================== */
(() => {
  'use strict';

  /* ----------------------------- CONFIG ---------------------------------- */
  const CONFIG = {
    transparentBody: true,          // body/html dibuat transparan agar langit terlihat
    headings: '.text,.text-about',                    // judul per-huruf (span)
    reveal: '.video-card,.photo,.collage-text,.footer-text',
    tilt: '.video-card,.photo',
    magnetic: '.nav-links a,.btn,[data-magnetic]',
    gold: ['#fff1c9', '#f6d98a', '#e9b95a', '#f4c1b0', '#ffd9ec'],
    stars: 240,
    mountains: true,
    clouds: true,
  };

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;

  /* ----------------------------- HELPERS --------------------------------- */
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => t * t * (3 - 2 * t);
  const rand = (a, b) => a + Math.random() * (b - a);
  const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) * 2;
  const hex = h => {
    h = h.replace('#', '');
    return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16));
  };
  const mix = (a, b, t) => a.map((v, i) => Math.round(lerp(v, b[i], t)));
  const rgb = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

  /* Fase langit: [atas, tengah, bawah(horizon)] */
  const SKY = [
    ['#2b2d6e', '#e8806b', '#ffd29a'], // sunrise
    ['#2f6fd6', '#6fb3f2', '#cfeaff'], // blue sky
    ['#3b3a8f', '#f08a4b', '#ffd36e'], // golden sunset
    ['#5b3a8c', '#e86aa6', '#ffb3c7'], // pink sunset
    ['#0f1240', '#3b2a7a', '#c0568f'], // twilight
    ['#02030a', '#070b2a', '#1a1446'], // milky way night
  ].map(p => p.map(hex));

  const skyAt = p => {
    const n = SKY.length - 1;
    const f = clamp(p) * n;
    const i = Math.min(n - 1, Math.floor(f));
    const t = ease(f - i);
    return SKY[i].map((c, k) => mix(c, SKY[i + 1][k], t));
  };

  /* ----------------------------- STYLE ----------------------------------- */
  const css = `
  ${CONFIG.transparentBody ? 'html,body{background:transparent!important}' : ''}
  .lx-sky,.lx-fx{position:fixed;inset:0;width:100%;height:100%;pointer-events:none}
  .lx-sky{z-index:-1}
  .lx-fx{z-index:9997}
  .lx-bar{position:fixed;top:0;left:0;height:2px;width:100%;z-index:9999;transform-origin:0 50%;
    transform:scaleX(0);background:linear-gradient(90deg,#fff1c9,#e9b95a,#f4c1b0,#ffd9ec);
    box-shadow:0 0 12px rgba(233,185,90,.8);pointer-events:none}
  .lx-dot,.lx-ring{position:fixed;top:0;left:0;pointer-events:none;z-index:9999;border-radius:50%;
    will-change:transform;opacity:0;transition:opacity .4s}
  .lx-dot{width:7px;height:7px;margin:-3.5px 0 0 -3.5px;
    background:radial-gradient(circle,#fff8e1,#e9b95a);box-shadow:0 0 14px 3px rgba(246,217,138,.85)}
  .lx-ring{width:42px;height:42px;margin:-21px 0 0 -21px;border:1px solid rgba(246,217,138,.75);
    transition:opacity .4s,width .35s cubic-bezier(.2,.8,.2,1),height .35s cubic-bezier(.2,.8,.2,1),
    margin .35s cubic-bezier(.2,.8,.2,1),background .35s,border-color .35s}
  .lx-ring.lx-hover{width:76px;height:76px;margin:-38px 0 0 -38px;
    background:radial-gradient(circle,rgba(255,241,201,.18),rgba(233,185,90,.06));border-color:rgba(255,217,236,.9)}
  .lx-ring.lx-down{width:28px;height:28px;margin:-14px 0 0 -14px}
  .lx-pulse{position:fixed;z-index:9998;pointer-events:none;width:12px;height:12px;margin:-6px 0 0 -6px;
    border-radius:50%;border:1px solid rgba(255,230,170,.9);animation:lxPulse 1s cubic-bezier(.1,.7,.2,1) forwards}
  @keyframes lxPulse{to{transform:scale(14);opacity:0}}
  @media (pointer:fine){html.lx-on,html.lx-on *{cursor:none!important}}
  .lx-fxe{opacity:0;transform:perspective(900px) rotateX(var(--lx-rx,0deg)) rotateY(var(--lx-ry,0deg)) translateY(var(--lx-ty,46px));
    transition:opacity 1.1s cubic-bezier(.2,.7,.2,1),transform .7s cubic-bezier(.2,.7,.2,1)}
  .lx-fxe.lx-in{opacity:1;--lx-ty:0px}
  @media (prefers-reduced-motion:reduce){.lx-fxe{opacity:1;transform:none;transition:none}}

  /* backdrop-filter di atas canvas yang terus bergerak = sangat berat -> diganti kaca solid */
  nav,.footer{-webkit-backdrop-filter:none!important;backdrop-filter:none!important;
    background:rgba(255,255,255,.16)!important}

  /* --- penyesuaian untuk style.css ---- */
  .text,.text-about,.collage-text{color:var(--lx-ink,#4a4359)}
  nav.nav-links{position:sticky;top:12px;z-index:100;box-shadow:0 10px 40px rgba(0,0,0,.12)}
  .nav-links a,.footer{text-shadow:0 1px 10px rgba(20,10,40,.28)}
  .lx-h span{opacity:0;transition:transform .4s cubic-bezier(.16,1,.3,1),color .35s ease,
    text-shadow .35s ease,translate .45s cubic-bezier(.16,1,.3,1)}
  .lx-h.lx-in span{opacity:1;animation:lxLetter 1.2s cubic-bezier(.16,1,.3,1) backwards;
    animation-delay:calc(var(--i,0) * 55ms)}
  @keyframes lxLetter{from{opacity:0;transform:translateY(60px) rotate(8deg) scale(.6)}
    to{opacity:1;transform:none}}
  .video-card,.photo{box-shadow:0 18px 50px rgba(0,0,0,.22),inset 0 0 0 1px rgba(255,255,255,.18)}
  .photo img{transition:transform 1.2s cubic-bezier(.16,1,.3,1)}
  .photo:hover img{transform:scale(1.12)}
  @media (prefers-reduced-motion:reduce){.lx-h span{opacity:1;animation:none!important}}
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  /* ----------------------------- DOM ------------------------------------- */
  const mk = (tag, cls) => {
    const e = document.createElement(tag);
    e.className = cls;
    document.body.appendChild(e);
    return e;
  };
  const skyCv = mk('canvas', 'lx-sky');
  const fxCv = mk('canvas', 'lx-fx');
  const bar = mk('div', 'lx-bar');
  const sctx = skyCv.getContext('2d');
  const fctx = fxCv.getContext('2d');
  let dot, ring;
  if (finePointer) {
    dot = mk('div', 'lx-dot');
    ring = mk('div', 'lx-ring');
    document.documentElement.classList.add('lx-on');
  }

  /* ----------------------------- STATE ----------------------------------- */
  /* Kualitas adaptif: kalau FPS turun, otomatis diturunkan */
  const QUALITY = { scale: 0.5, level: 2, mountainStep: 14, glow: true };
  let W = 0, H = 0, DPR = 1;
  let target = 0, prog = 0;
  const mouse = { x: innerWidth / 2, y: innerHeight / 2, sx: innerWidth / 2, sy: innerHeight / 2, nx: 0, ny: 0, px: 0, py: 0, moved: false };
  const ribbon = [];
  const sparks = [];
  const stars = [];
  const shooting = [];
  const clouds = [];
  let milky = null;

  /* ----------------------------- RESIZE ---------------------------------- */
  function resize() {
    /* Langit itu lembut/blur, jadi cukup dirender di resolusi rendah lalu diregangkan GPU.
       Ini memangkas beban piksel hingga ~70%. */
    DPR = 1;
    W = innerWidth; H = innerHeight;
    const S = QUALITY.scale;
    skyCv.width = Math.round(W * S); skyCv.height = Math.round(H * S);
    fxCv.width = W; fxCv.height = H;
    sctx.setTransform(S, 0, 0, S, 0, 0);
    fctx.setTransform(1, 0, 0, 1, 0, 0);
    buildStars();
    buildClouds();
    buildMilky();
    cacheHeadings();
    readScroll();
  }
  let resizeT;
  function onResize() { clearTimeout(resizeT); resizeT = setTimeout(resize, 200); }

  function buildStars() {
    stars.length = 0;
    const n = Math.round(CONFIG.stars * clamp((W * H) / (1440 * 800), 0.5, 1.6));
    for (let i = 0; i < n; i++) {
      stars.push({
        x: Math.random() * W, y: Math.random() * H * 0.85,
        r: rand(0.3, 1.5), p: rand(0, 6.28), s: rand(0.6, 2.2),
        c: Math.random() < 0.2 ? [255, 214, 170] : Math.random() < 0.4 ? [190, 210, 255] : [255, 255, 255],
      });
    }
  }

  function buildClouds() {
    clouds.length = 0;
    if (!CONFIG.clouds) return;
    for (let i = 0; i < 7; i++) {
      clouds.push({ x: rand(0, W), y: rand(H * 0.1, H * 0.55), s: rand(0.6, 1.5), v: rand(4, 12), puffs: Array.from({ length: 5 }, () => [rand(-90, 90), rand(-18, 18), rand(45, 90)]) });
    }
  }

  /* Milky Way digambar sekali ke offscreen canvas lalu di-blit tiap frame */
  function buildMilky() {
    milky = document.createElement('canvas');
    milky.width = W; milky.height = H;
    const m = milky.getContext('2d');
    const diag = Math.hypot(W, H);
    m.translate(W / 2, H * 0.42);
    m.rotate(-0.55);
    const band = Math.max(60, H * 0.1);

    const blobs = [[120, 90, 255], [70, 190, 230], [255, 120, 190], [255, 190, 110]];
    for (let i = 0; i < 18; i++) {
      const u = rand(-diag * 0.55, diag * 0.55), v = gauss() * band * 0.5;
      const r = rand(band * 0.8, band * 2);
      const c = blobs[i % blobs.length];
      const g = m.createRadialGradient(u, v, 0, u, v, r);
      g.addColorStop(0, `rgba(${c},0.13)`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      m.fillStyle = g;
      m.fillRect(u - r, v - r, r * 2, r * 2);
    }
    const count = Math.round(5200 * clamp((W * H) / (1440 * 800), 0.5, 1.5));
    for (let i = 0; i < count; i++) {
      const u = rand(-diag * 0.6, diag * 0.6);
      const w = band * (1 + 0.35 * Math.sin(u * 0.004));
      const v = gauss() * w;
      const t = Math.random();
      const c = t < 0.6 ? '255,255,255' : t < 0.8 ? '190,200,255' : t < 0.92 ? '255,200,230' : '255,225,170';
      m.fillStyle = `rgba(${c},${rand(0.08, 0.6)})`;
      const s = Math.random() < 0.04 ? 1.6 : 0.9;
      m.fillRect(u, v, s, s);
    }
    /* dust lane gelap di tengah band */
    for (let i = 0; i < 10; i++) {
      const u = rand(-diag * 0.4, diag * 0.4), r = rand(band * 0.3, band * 0.7);
      const g = m.createRadialGradient(u, 0, 0, u, 0, r);
      g.addColorStop(0, 'rgba(2,3,12,0.35)');
      g.addColorStop(1, 'rgba(2,3,12,0)');
      m.fillStyle = g;
      m.fillRect(u - r, -r, r * 2, r * 2);
    }
  }

  /* ----------------------------- INPUT ----------------------------------- */
  function readScroll() {
    const max = document.documentElement.scrollHeight - innerHeight;
    target = max > 0 ? clamp(scrollY / max) : 0;
    bar.style.transform = `scaleX(${target})`;
  }

  addEventListener('scroll', readScroll, { passive: true });
  addEventListener('resize', onResize);
  addEventListener('load', () => cacheHeadings());

  addEventListener('pointermove', e => {
    mouse.x = e.clientX; mouse.y = e.clientY;
    mouse.moved = true;
    if (dot) { dot.style.opacity = 1; ring.style.opacity = 1; }
    const sp = Math.hypot(e.clientX - mouse.px, e.clientY - mouse.py);
    mouse.px = e.clientX; mouse.py = e.clientY;
    if (reduceMotion) return;
    const n = clamp(Math.floor(sp / 9), 0, 4);
    for (let i = 0; i < n + (Math.random() < 0.3 ? 1 : 0); i++) spawnSpark(e.clientX, e.clientY, 1);
  }, { passive: true });

  addEventListener('pointerdown', e => {
    if (ring) ring.classList.add('lx-down');
    const p = document.createElement('div');
    p.className = 'lx-pulse';
    p.style.left = e.clientX + 'px'; p.style.top = e.clientY + 'px';
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 1000);
    if (!reduceMotion) for (let i = 0; i < 22; i++) spawnSpark(e.clientX, e.clientY, 3);
  });
  addEventListener('pointerup', () => ring && ring.classList.remove('lx-down'));
  document.addEventListener('mouseleave', () => { if (dot) { dot.style.opacity = 0; ring.style.opacity = 0; } });

  function spawnSpark(x, y, power) {
    const a = rand(0, 6.28), v = rand(0.3, 1.4) * power;
    sparks.push({
      x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 0.25,
      life: 1, d: rand(0.012, 0.028), r: rand(2, 6) * (power > 1 ? 1.2 : 1),
      c: hex(CONFIG.gold[(Math.random() * CONFIG.gold.length) | 0]), rot: rand(0, 3),
    });
    if (sparks.length > 260) sparks.shift();
  }

  /* ---------------------- MAGNETIC / TILT / REVEAL ----------------------- */
  const hoverSel = 'a,button,video,.photo,input,textarea,select,label,[role=button],.btn,[data-magnetic]';
  document.addEventListener('pointerover', e => {
    if (ring && e.target.closest && e.target.closest(hoverSel)) ring.classList.add('lx-hover');
  });
  document.addEventListener('pointerout', e => {
    if (ring && e.target.closest && e.target.closest(hoverSel)) ring.classList.remove('lx-hover');
  });

  const headings = [];
  /* Posisi huruf disimpan di cache (koordinat halaman) supaya tidak memaksa
     layout ulang lewat getBoundingClientRect() di setiap frame. */
  function cacheHeadings() {
    const sy = scrollY;
    for (const s of headings) {
      const r = s.getBoundingClientRect();
      s._cx = r.left + r.width / 2;
      s._cy = r.top + sy + r.height / 2;
    }
  }
  function setupElements() {
    document.querySelectorAll(CONFIG.headings).forEach(h => {
      h.classList.add('lx-h');
      h.querySelectorAll('span').forEach((s, i) => { s.style.setProperty('--i', i); headings.push(s); });
      io.observe(h);
    });

    document.querySelectorAll(CONFIG.reveal).forEach(el => {
      if (el.closest('nav') || el.classList.contains('lx-fxe')) return;
      el.classList.add('lx-fxe');
      io.observe(el);
    });

    if (!finePointer || reduceMotion) return;

    document.querySelectorAll(CONFIG.tilt).forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty('--lx-ry', (x * 9).toFixed(2) + 'deg');
        el.style.setProperty('--lx-rx', (-y * 9).toFixed(2) + 'deg');
      });
      el.addEventListener('pointerleave', () => {
        el.style.setProperty('--lx-ry', '0deg');
        el.style.setProperty('--lx-rx', '0deg');
      });
    });

    document.querySelectorAll(CONFIG.magnetic).forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        el.style.translate = `${x * 0.22}px ${y * 0.28}px`;
      });
      el.addEventListener('pointerleave', () => { el.style.translate = '0 0'; });
      el.style.transition = getComputedStyle(el).transition + ', translate .5s cubic-bezier(.2,.8,.2,1)';
    });
  }

  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        const el = en.target;
        const idx = Array.prototype.indexOf.call(el.parentNode ? el.parentNode.children : [], el);
        el.style.transitionDelay = Math.min(idx, 6) * 70 + 'ms';
        el.classList.add('lx-in');
        io.unobserve(el);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

  /* ------------------------------ DRAW SKY ------------------------------- */
  function drawSky(t) {
    const [top, midc, bot] = skyAt(prog);
    const night = ease(clamp((prog - 0.62) / 0.3));
    const day = 1 - night;

    const g = sctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, rgb(top));
    g.addColorStop(0.55, rgb(midc));
    g.addColorStop(1, rgb(bot));
    sctx.fillStyle = g;
    sctx.fillRect(0, 0, W, H);

    const px = mouse.nx, py = mouse.ny;

    /* Milky Way + bintang */
    if (night > 0.01) {
      sctx.save();
      sctx.globalAlpha = night;
      sctx.globalCompositeOperation = 'lighter';
      sctx.drawImage(milky, px * -10, py * -6, W, H);
      sctx.restore();

      sctx.save();
      sctx.globalCompositeOperation = 'lighter';
      for (const s of stars) {
        const tw = 0.55 + 0.45 * Math.sin(t * 0.001 * s.s + s.p);
        const a = night * tw;
        sctx.fillStyle = rgb(s.c, a);
        const x = s.x + px * -8 * s.r, y = s.y + py * -5 * s.r;
        sctx.beginPath();
        sctx.arc(x, y, s.r, 0, 6.283);
        sctx.fill();
        if (s.r > 1.2 && QUALITY.glow) {
          sctx.fillStyle = rgb(s.c, a * 0.18);
          sctx.beginPath();
          sctx.arc(x, y, s.r * 4, 0, 6.283);
          sctx.fill();
        }
      }
      sctx.restore();

      /* shooting star */
      if (!reduceMotion && night > 0.5 && Math.random() < 0.004) {
        shooting.push({ x: rand(W * 0.2, W), y: rand(0, H * 0.35), vx: rand(-9, -6), vy: rand(3, 5), life: 1 });
      }
      for (let i = shooting.length - 1; i >= 0; i--) {
        const s = shooting[i];
        s.x += s.vx; s.y += s.vy; s.life -= 0.015;
        if (s.life <= 0) { shooting.splice(i, 1); continue; }
        const gr = sctx.createLinearGradient(s.x, s.y, s.x - s.vx * 14, s.y - s.vy * 14);
        gr.addColorStop(0, `rgba(255,245,220,${s.life})`);
        gr.addColorStop(1, 'rgba(255,245,220,0)');
        sctx.strokeStyle = gr; sctx.lineWidth = 1.6;
        sctx.beginPath();
        sctx.moveTo(s.x, s.y);
        sctx.lineTo(s.x - s.vx * 14, s.y - s.vy * 14);
        sctx.stroke();
      }
    }

    /* Matahari: terbit → siang → terbenam */
    const horizon = H * 0.8;
    const sunT = clamp(prog / 0.52);
    const sunA = 1 - ease(clamp((prog - 0.5) / 0.12));
    if (sunA > 0.01) {
      const sx = W * (0.12 + 0.76 * sunT) + px * -14;
      const sy = horizon - Math.sin(Math.PI * sunT) * H * 0.6 + py * -8;
      const warm = 1 - Math.sin(Math.PI * sunT);           // makin oranye dekat horizon
      const col = mix([255, 250, 232], [255, 150, 70], warm);
      sctx.save();
      sctx.globalCompositeOperation = 'lighter';
      const R = H * (0.35 + 0.25 * warm);
      const gl = sctx.createRadialGradient(sx, sy, 0, sx, sy, R);
      gl.addColorStop(0, rgb(col, 0.55 * sunA));
      gl.addColorStop(0.25, rgb(col, 0.2 * sunA));
      gl.addColorStop(1, rgb(col, 0));
      sctx.fillStyle = gl;
      sctx.fillRect(0, 0, W, H);
      sctx.fillStyle = rgb(mix(col, [255, 255, 255], 0.5), sunA);
      sctx.beginPath();
      sctx.arc(sx, sy, Math.max(26, H * 0.04), 0, 6.283);
      sctx.fill();
      sctx.restore();
    }

    /* Glow horizon (pink sunset / twilight) */
    sctx.save();
    sctx.globalCompositeOperation = 'lighter';
    const hg = sctx.createRadialGradient(W / 2 + px * -30, horizon, 0, W / 2, horizon, W * 0.7);
    hg.addColorStop(0, rgb(bot, 0.35 * (0.4 + 0.6 * day)));
    hg.addColorStop(1, rgb(bot, 0));
    sctx.fillStyle = hg;
    sctx.fillRect(0, 0, W, H);   // seluruh layar: kotak yang terpotong di tengah = garis horizontal
    sctx.restore();

    /* Bulan */
    if (night > 0.02) {
      const mx = W * 0.8 + px * -12, my = H * 0.2 + py * -6;
      sctx.save();
      sctx.globalCompositeOperation = 'lighter';
      const mg = sctx.createRadialGradient(mx, my, 0, mx, my, 120);
      mg.addColorStop(0, `rgba(210,225,255,${0.35 * night})`);
      mg.addColorStop(1, 'rgba(210,225,255,0)');
      sctx.fillStyle = mg;
      sctx.fillRect(mx - 120, my - 120, 240, 240);
      sctx.restore();
      sctx.fillStyle = `rgba(240,245,255,${night})`;
      sctx.beginPath();
      sctx.arc(mx, my, 22, 0, 6.283);
      sctx.fill();
      sctx.fillStyle = `rgba(190,200,225,${0.5 * night})`;
      [[-7, -5, 5], [6, 4, 4], [-2, 9, 3]].forEach(c => {
        sctx.beginPath(); sctx.arc(mx + c[0], my + c[1], c[2], 0, 6.283); sctx.fill();
      });
    }

    /* Awan (siang & senja) */
    if (CONFIG.clouds && day > 0.02) {
      const cc = mix(bot, [255, 255, 255], 0.55);
      for (const c of clouds) {
        c.x += c.v * 0.016 * (reduceMotion ? 0 : 1);
        if (c.x > W + 220) c.x = -220;
        for (const p of c.puffs) {
          const x = c.x + p[0] * c.s + px * -18 * c.s, y = c.y + p[1] * c.s;
          const r = p[2] * c.s;
          const cg = sctx.createRadialGradient(x, y, 0, x, y, r);
          cg.addColorStop(0, rgb(cc, 0.22 * day));
          cg.addColorStop(1, rgb(cc, 0));
          sctx.fillStyle = cg;
          sctx.fillRect(x - r, y - r, r * 2, r * 2);
        }
      }
    }

    /* Siluet pegunungan berlapis (seni) */
    if (CONFIG.mountains) {
      const layers = [
        { base: 0.80, amp: 70, f: 0.0042, k: 0.52, sp: 0.00006 },
        { base: 0.88, amp: 60, f: 0.0058, k: 0.7, sp: 0.00009 },
        { base: 0.96, amp: 46, f: 0.0074, k: 0.86, sp: 0.00012 },
      ];
      layers.forEach((L, li) => {
        const dark = mix(bot, [4, 5, 14], L.k + night * 0.1);
        sctx.beginPath();
        sctx.moveTo(0, H);
        const off = px * (li + 1) * -14;
        for (let x = 0; x <= W + 10; x += QUALITY.mountainStep) {
          const xx = x - off;
          const y = H * L.base
            - (Math.sin(xx * L.f + li * 2 + t * L.sp) * L.amp
              + Math.sin(xx * L.f * 2.3 + li) * L.amp * 0.5
              + Math.sin(xx * L.f * 0.45 + 1.7) * L.amp * 1.1);
          sctx.lineTo(x, y);
        }
        sctx.lineTo(W, H);
        sctx.closePath();
        const mg = sctx.createLinearGradient(0, H * (L.base - 0.12), 0, H);
        mg.addColorStop(0, rgb(mix(dark, bot, 0.22)));
        mg.addColorStop(1, rgb(dark));
        sctx.fillStyle = mg;
        sctx.fill();
      });
    }

    /* Cahaya mengikuti kursor */
    if (finePointer && !reduceMotion) {
      sctx.save();
      sctx.globalCompositeOperation = 'lighter';
      const lg = sctx.createRadialGradient(mouse.sx, mouse.sy, 0, mouse.sx, mouse.sy, 260);
      const lc = mix(midc, [255, 235, 190], 0.5);
      lg.addColorStop(0, rgb(lc, 0.16));
      lg.addColorStop(1, rgb(lc, 0));
      sctx.fillStyle = lg;
      sctx.fillRect(mouse.sx - 260, mouse.sy - 260, 520, 520);
      sctx.restore();
    }
  }

  /* ------------------------------ DRAW FX -------------------------------- */
  function sparkle(ctx, x, y, r, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.quadraticCurveTo(0, 0, 0, r);
    ctx.quadraticCurveTo(0, 0, -r, 0);
    ctx.quadraticCurveTo(0, 0, 0, -r);
    ctx.fill();
    ctx.restore();
  }

  function drawFx() {
    fctx.clearRect(0, 0, W, H);
    if (reduceMotion) return;
    fctx.globalCompositeOperation = 'lighter';

    /* Ribbon emas yang meruncing */
    if (mouse.moved) ribbon.push({ x: mouse.sx, y: mouse.sy, a: 1 });
    while (ribbon.length > 26) ribbon.shift();
    for (let i = 1; i < ribbon.length; i++) {
      const p = ribbon[i - 1], q = ribbon[i];
      const k = i / ribbon.length;
      fctx.strokeStyle = `rgba(${Math.round(lerp(255, 233, k))},${Math.round(lerp(217, 185, k))},${Math.round(lerp(236, 90, k))},${k * 0.55})`;
      fctx.lineWidth = k * 5;
      fctx.lineCap = 'round';
      fctx.beginPath();
      fctx.moveTo(p.x, p.y);
      fctx.lineTo(q.x, q.y);
      fctx.stroke();
    }
    if (ribbon.length && !mouse.moved) ribbon.shift();

    /* Sparkle */
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.x += s.vx; s.y += s.vy; s.vy += 0.012; s.vx *= 0.985;
      s.life -= s.d; s.rot += 0.03;
      if (s.life <= 0) { sparks.splice(i, 1); continue; }
      const r = s.r * (0.4 + s.life * 0.8);
      fctx.fillStyle = rgb(s.c, s.life * 0.9);
      sparkle(fctx, s.x, s.y, r, s.rot);
      fctx.fillStyle = rgb(s.c, s.life * 0.12);
      fctx.beginPath();
      fctx.arc(s.x, s.y, r * 3, 0, 6.283);
      fctx.fill();
    }
    fctx.globalCompositeOperation = 'source-over';
  }

  /* ------------------------------- LOOP ---------------------------------- */
  let lastMove = 0;
  function frame(t) {
    prog += (target - prog) * (reduceMotion ? 1 : 0.055);
    mouse.sx += (mouse.x - mouse.sx) * 0.16;
    mouse.sy += (mouse.y - mouse.sy) * 0.16;
    mouse.nx += ((mouse.x / W - 0.5) * 2 - mouse.nx) * 0.05;
    mouse.ny += ((mouse.y / H - 0.5) * 2 - mouse.ny) * 0.05;

    if (dot) {
      dot.style.transform = `translate3d(${mouse.x}px,${mouse.y}px,0)`;
      ring.style.transform = `translate3d(${mouse.sx}px,${mouse.sy}px,0)`;
    }
    /* warna tinta judul: hanya diperbarui kalau berubah nyata (mengubah CSS variable
       di <html> memaksa browser menghitung ulang style seluruh halaman) */
    if (Math.abs(prog - inkProg) > 0.01) {
      inkProg = prog;
      const mc = skyAt(prog)[1];
      const lum = (0.2126 * mc[0] + 0.7152 * mc[1] + 0.0722 * mc[2]) / 255;
      const ink = mix([74, 67, 89], [246, 240, 255], clamp((0.5 - lum) / 0.25));
      document.documentElement.style.setProperty('--lx-ink', `rgb(${ink})`);
    }

    /* huruf judul terangkat halus saat kursor mendekat (pakai posisi cache) */
    if (finePointer && !reduceMotion && headings.length && (mouse.moved || t - lastMove < 600)) {
      const sy = scrollY;
      for (const s of headings) {
        const cy = s._cy - sy;
        if (cy < -200 || cy > H + 200) continue;
        const d = Math.hypot(mouse.sx - s._cx, mouse.sy - cy);
        const k = d < 150 ? 1 - d / 150 : 0;
        const v = k > 0.02 ? `0 ${(-k * 18).toFixed(1)}px` : '0 0';
        if (s._v !== v) { s._v = v; s.style.translate = v; }
      }
    }
    if (mouse.moved) { lastMove = t; mouse.moved = false; }

    /* langit digambar 30fps saja (kursor tetap 60fps) */
    skyTick ^= 1;
    if (skyTick || reduceMotion) drawSky(t);
    drawFx();

    /* auto-turunkan kualitas kalau perangkat kewalahan */
    if (last) {
      const dt = t - last;
      avg = avg ? avg * 0.95 + dt * 0.05 : dt;
      if (++frames > 90 && avg > 24 && QUALITY.level > 0) {
        QUALITY.level--; frames = 0; avg = 0;
        QUALITY.scale = Math.max(0.3, QUALITY.scale - 0.1);
        QUALITY.mountainStep = 24;
        if (QUALITY.level < 2) { CONFIG.clouds = false; QUALITY.glow = false; }
        if (QUALITY.level < 1) { stars.length = Math.min(stars.length, 90); }
        resize();
      }
    }
    last = t;
    requestAnimationFrame(frame);
  }
  let last = 0, avg = 0, frames = 0, skyTick = 0, inkProg = -1;

  /* ------------------------------- INIT ---------------------------------- */
  resize();
  prog = target;
  setupElements();
  cacheHeadings();
  setTimeout(cacheHeadings, 2000);   // setelah animasi huruf & font selesai
  requestAnimationFrame(frame);
})();