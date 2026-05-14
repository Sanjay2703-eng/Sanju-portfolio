/* ══════════════════════════════════════════════════════
   SANJAY SJ — 3D PORTFOLIO | script.js
   Three.js Neural Brain + Full Interactivity
══════════════════════════════════════════════════════ */

/* ──────────── LOADER ──────────── */
const statuses = [
  'Initialising neural layers...',
  'Loading model architecture...',
  'Compiling TensorFlow graph...',
  'Calibrating 3D renderer...',
  'Injecting caffeine...',
  'System ready. Welcome.',
];
const loaderBar = document.getElementById('loaderBar');
const loaderStatus = document.getElementById('loaderStatus');
let prog = 0;
const loaderTimer = setInterval(() => {
  prog = Math.min(prog + Math.random() * 18 + 8, 100);
  loaderBar.style.width = prog + '%';
  const idx = Math.min(Math.floor(prog / 18), statuses.length - 1);
  loaderStatus.textContent = statuses[idx];
  if (prog >= 100) clearInterval(loaderTimer);
}, 320);

window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('loader').classList.add('done');
    startTypewriter();
    animateCounters();
  }, 2600);
});

/* ──────────── THREE.JS NEURAL BRAIN ──────────── */
(function initBrain() {
  const canvas = document.getElementById('brainCanvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const scene = new THREE.Scene();
  let W = canvas.offsetWidth, H = canvas.offsetHeight;

  const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 200);
  camera.position.set(0, 0, 10);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);

  // ── Group that holds everything ──
  const brain = new THREE.Group();
  scene.add(brain);

  // ── Ambient light ──
  scene.add(new THREE.AmbientLight(0x7b2fff, 0.5));
  const pt = new THREE.PointLight(0x00f5d4, 1.5, 40);
  pt.position.set(5, 5, 5);
  scene.add(pt);

  // ── Core sphere ──
  const coreGeo = new THREE.SphereGeometry(1.6, 48, 48);
  const coreMat = new THREE.MeshPhongMaterial({
    color: 0x0d0520,
    emissive: 0x7b2fff,
    emissiveIntensity: 0.4,
    transparent: true,
    opacity: 0.25,
    wireframe: false,
  });
  const coreMesh = new THREE.Mesh(coreGeo, coreMat);
  brain.add(coreMesh);

  // Inner wireframe
  const wGeo = new THREE.SphereGeometry(1.62, 18, 18);
  const wMat = new THREE.MeshBasicMaterial({ color: 0x7b2fff, wireframe: true, transparent: true, opacity: 0.07 });
  brain.add(new THREE.Mesh(wGeo, wMat));

  // ── Generate nodes on sphere surface ──
  const NODE_COUNT = 160;
  const nodePositions = [];
  const goldenRatio = (1 + Math.sqrt(5)) / 2;

  for (let i = 0; i < NODE_COUNT; i++) {
    const theta = Math.acos(1 - (2 * (i + 0.5)) / NODE_COUNT);
    const phi = 2 * Math.PI * i / goldenRatio;
    const r = 2.8 + (Math.random() - 0.5) * 1.4;
    nodePositions.push(new THREE.Vector3(
      r * Math.sin(theta) * Math.cos(phi),
      r * Math.sin(theta) * Math.sin(phi),
      r * Math.cos(theta)
    ));
  }

  // ── Node meshes ──
  const nodeGeo = new THREE.SphereGeometry(0.045, 8, 8);
  const nodeMats = nodePositions.map((_, i) => new THREE.MeshBasicMaterial({
    color: i % 3 === 0 ? 0x7b2fff : i % 3 === 1 ? 0x00f5d4 : 0xff2d87,
    transparent: true,
    opacity: 0.7 + Math.random() * 0.3,
  }));
  const nodeMeshes = nodePositions.map((pos, i) => {
    const m = new THREE.Mesh(nodeGeo, nodeMats[i]);
    m.position.copy(pos);
    m.userData.baseScale = 0.8 + Math.random() * 0.4;
    m.userData.pulseOffset = Math.random() * Math.PI * 2;
    brain.add(m);
    return m;
  });

  // ── Edges (lines between nearby nodes) ──
  const edgeGeometry = new THREE.BufferGeometry();
  const edgePts = [];
  const edges = [];
  const EDGE_DIST = 2.2;

  for (let i = 0; i < NODE_COUNT; i++) {
    for (let j = i + 1; j < NODE_COUNT; j++) {
      const d = nodePositions[i].distanceTo(nodePositions[j]);
      if (d < EDGE_DIST) {
        edgePts.push(...nodePositions[i].toArray(), ...nodePositions[j].toArray());
        edges.push([nodePositions[i], nodePositions[j]]);
      }
    }
  }
  edgeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(edgePts, 3));
  const edgeMat = new THREE.LineBasicMaterial({
    color: 0x7b2fff, transparent: true, opacity: 0.12,
  });
  const edgeLines = new THREE.LineSegments(edgeGeometry, edgeMat);
  brain.add(edgeLines);

  // ── Data packets travelling along edges ──
  const PACKET_COUNT = 28;
  const packetGeo = new THREE.SphereGeometry(0.055, 6, 6);
  const packetColors = [0x00f5d4, 0x7b2fff, 0xff2d87, 0xffffff];
  const packets = [];

  for (let i = 0; i < PACKET_COUNT; i++) {
    const edgeIdx = Math.floor(Math.random() * edges.length);
    const mat = new THREE.MeshBasicMaterial({
      color: packetColors[i % packetColors.length],
      transparent: true, opacity: 0.9,
    });
    const mesh = new THREE.Mesh(packetGeo, mat);
    mesh.visible = false;
    brain.add(mesh);
    packets.push({
      mesh,
      edge: edges[edgeIdx],
      t: Math.random(),
      speed: 0.004 + Math.random() * 0.008,
      delay: Math.random() * 3,
      active: false,
    });
  }

  // ── Background particles (deep space stars) ──
  const starCount = 400;
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    starPos[i * 3]     = (Math.random() - 0.5) * 80;
    starPos[i * 3 + 1] = (Math.random() - 0.5) * 80;
    starPos[i * 3 + 2] = (Math.random() - 0.5) * 80;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.08, transparent: true, opacity: 0.5 });
  scene.add(new THREE.Points(starGeo, starMat));

  // ── Outer glow ring ──
  const ringGeo = new THREE.TorusGeometry(3.8, 0.015, 8, 100);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f5d4, transparent: true, opacity: 0.3 });
  const ring1 = new THREE.Mesh(ringGeo, ringMat);
  ring1.rotation.x = Math.PI * 0.35;
  brain.add(ring1);

  const ring2Mat = new THREE.MeshBasicMaterial({ color: 0x7b2fff, transparent: true, opacity: 0.2 });
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(4.5, 0.01, 8, 100), ring2Mat);
  ring2.rotation.x = Math.PI * 0.6;
  ring2.rotation.y = Math.PI * 0.25;
  brain.add(ring2);

  // ── Mouse tracking ──
  let mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;
  document.addEventListener('mousemove', e => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = -(e.clientY / window.innerHeight - 0.5) * 2;
  });

  // ── Click pulse effect ──
  canvas.addEventListener('click', () => {
    let p = 0;
    const pulse = setInterval(() => {
      p += 0.02;
      coreMat.emissiveIntensity = 0.4 + Math.sin(p * 8) * 0.6;
      edgeMat.opacity = 0.12 + Math.sin(p * 8) * 0.15;
      if (p > 1) {
        clearInterval(pulse);
        coreMat.emissiveIntensity = 0.4;
        edgeMat.opacity = 0.12;
      }
    }, 16);
  });

  // ── Animation loop ──
  let elapsed = 0;
  function animate() {
    requestAnimationFrame(animate);
    elapsed += 0.01;

    // Smooth camera follow mouse
    targetX += (mouseX * 0.5 - targetX) * 0.04;
    targetY += (mouseY * 0.3 - targetY) * 0.04;
    camera.position.x = targetX;
    camera.position.y = targetY;
    camera.lookAt(0, 0, 0);

    // Brain rotation
    brain.rotation.y = elapsed * 0.15;
    brain.rotation.x = Math.sin(elapsed * 0.08) * 0.06;

    // Ring rotation
    ring1.rotation.z = elapsed * 0.2;
    ring2.rotation.z = -elapsed * 0.15;

    // Pulse nodes
    nodeMeshes.forEach((m, i) => {
      const s = m.userData.baseScale + Math.sin(elapsed * 2.5 + m.userData.pulseOffset) * 0.3;
      m.scale.setScalar(s);
      nodeMats[i].opacity = 0.4 + Math.sin(elapsed * 1.5 + m.userData.pulseOffset) * 0.3;
    });

    // Animate data packets
    packets.forEach(pkt => {
      pkt.delay -= 0.01;
      if (pkt.delay > 0) return;
      if (!pkt.active) { pkt.active = true; pkt.mesh.visible = true; }
      pkt.t += pkt.speed;
      if (pkt.t > 1) {
        pkt.t = 0;
        const eIdx = Math.floor(Math.random() * edges.length);
        pkt.edge = edges[eIdx];
        pkt.speed = 0.004 + Math.random() * 0.008;
      }
      const pos = pkt.edge[0].clone().lerp(pkt.edge[1], pkt.t);
      pkt.mesh.position.copy(pos);
    });

    // Pulsing edge opacity
    edgeMat.opacity = 0.10 + Math.sin(elapsed * 0.8) * 0.04;
    pt.intensity = 1.2 + Math.sin(elapsed * 1.2) * 0.4;

    renderer.render(scene, camera);
  }
  animate();

  // ── Resize ──
  window.addEventListener('resize', () => {
    W = canvas.offsetWidth;
    H = canvas.offsetHeight;
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    renderer.setSize(W, H);
  });
})();

/* ──────────── TYPEWRITER ──────────── */
const roles = [
  'AI/ML Engineer',
  'Deep Learning Developer',
  'Computer Vision Specialist',
  'NLP & GenAI Builder',
  'Data Scientist',
  'Research Engineer',
];
let rIdx = 0, cIdx = 0, deleting = false;
const rolEl = document.getElementById('roleText');

function startTypewriter() {
  function tick() {
    const cur = roles[rIdx];
    if (deleting) {
      cIdx--;
      rolEl.textContent = cur.slice(0, cIdx);
      if (cIdx === 0) { deleting = false; rIdx = (rIdx + 1) % roles.length; setTimeout(tick, 400); return; }
      setTimeout(tick, 40);
    } else {
      cIdx++;
      rolEl.textContent = cur.slice(0, cIdx);
      if (cIdx === cur.length) { setTimeout(() => { deleting = true; tick(); }, 2500); return; }
      setTimeout(tick, 85);
    }
  }
  tick();
}

/* ──────────── CUSTOM CURSOR ──────────── */
const dot = document.getElementById('cursorDot');
const ring = document.getElementById('cursorRing');
let dx = 0, dy = 0, rx = 0, ry = 0;

document.addEventListener('mousemove', e => { dx = e.clientX; dy = e.clientY; });
document.addEventListener('mouseleave', () => { dot.style.opacity = '0'; ring.style.opacity = '0'; });
document.addEventListener('mouseenter', () => { dot.style.opacity = '1'; ring.style.opacity = '1'; });

(function moveCursor() {
  rx += (dx - rx) * 0.15;
  ry += (dy - ry) * 0.15;
  dot.style.left  = dx + 'px';
  dot.style.top   = dy + 'px';
  ring.style.left = rx + 'px';
  ring.style.top  = ry + 'px';
  requestAnimationFrame(moveCursor);
})();

document.querySelectorAll('a, button, .flip-wrap, .ach-card, .tool-chip, .f-btn, .tag-cloud span').forEach(el => {
  el.addEventListener('mouseenter', () => ring.classList.add('big'));
  el.addEventListener('mouseleave', () => ring.classList.remove('big'));
});

/* ──────────── SCROLL PROGRESS ──────────── */
const progressEl = document.getElementById('scrollProgress');
window.addEventListener('scroll', () => {
  const p = window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100;
  progressEl.style.width = p + '%';
});

/* ──────────── NAV SCROLL + ACTIVE ──────────── */
const nav = document.getElementById('nav');
const navLinks = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 80);
  const sections = document.querySelectorAll('section[id]');
  let cur = '';
  sections.forEach(s => { if (window.scrollY >= s.offsetTop - 250) cur = s.id; });
  navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + cur));
});

/* ──────────── HAMBURGER ──────────── */
const burger = document.getElementById('burger');
const mob = document.getElementById('mobOverlay');
burger.addEventListener('click', () => mob.classList.toggle('open'));
mob.querySelectorAll('a').forEach(a => a.addEventListener('click', () => mob.classList.remove('open')));

/* ──────────── REVEAL ON SCROLL ──────────── */
const revealEls = document.querySelectorAll('.reveal');
const revObs = new IntersectionObserver((entries) => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      setTimeout(() => e.target.classList.add('vis'), i * 70);
      revObs.unobserve(e.target);
    }
  });
}, { threshold: 0.08 });
revealEls.forEach(el => revObs.observe(el));

/* ──────────── HERO STAT COUNTERS ──────────── */
function animateCounters() {
  document.querySelectorAll('.h-val[data-target]').forEach(el => {
    const target = +el.dataset.target;
    const dur = 1600;
    const start = performance.now();
    function step(now) {
      const p = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.floor(ease * target);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target;
    }
    requestAnimationFrame(step);
  });
}

/* ──────────── SKILL BARS ──────────── */
const fills = document.querySelectorAll('.s-fill');
const fillObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      setTimeout(() => { e.target.style.width = e.target.dataset.w + '%'; }, 250);
      fillObs.unobserve(e.target);
    }
  });
}, { threshold: 0.2 });
fills.forEach(el => fillObs.observe(el));

/* ──────────── 3D FLIP CARDS ──────────── */
document.querySelectorAll('.flip-wrap').forEach(wrap => {
  const card = wrap.querySelector('.flip-card');

  // Tilt on hover (only when NOT flipped)
  wrap.addEventListener('mousemove', e => {
    if (card.classList.contains('flipped')) return;
    const rect = wrap.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width  - 0.5;
    const y = (e.clientY - rect.top)  / rect.height - 0.5;
    card.style.transform = `rotateY(${x * 22}deg) rotateX(${-y * 14}deg) scale(1.03)`;
  });

  wrap.addEventListener('mouseleave', () => {
    if (card.classList.contains('flipped')) return;
    card.style.transition = 'transform .6s cubic-bezier(0.4,0,0.2,1)';
    card.style.transform = '';
    setTimeout(() => card.style.transition = '', 600);
  });

  // Click to flip
  wrap.addEventListener('click', () => {
    card.style.transition = 'transform .85s cubic-bezier(0.4,0,0.2,1)';
    card.classList.toggle('flipped');
    if (card.classList.contains('flipped')) {
      card.style.transform = 'rotateY(180deg)';
    } else {
      card.style.transform = '';
    }
  });
});

/* ──────────── PROJECT FILTER ──────────── */
document.querySelectorAll('.f-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.f-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const f = btn.dataset.f;
    document.querySelectorAll('.flip-wrap').forEach(card => {
      // Reset flip state when filtering
      const fc = card.querySelector('.flip-card');
      fc.classList.remove('flipped');
      fc.style.transform = '';
      const cats = card.dataset.cat || '';
      const show = f === 'all' || cats.includes(f);
      card.classList.toggle('hidden', !show);
    });
  });
});

/* ──────────── CONTACT FORM ──────────── */
const submitBtn = document.getElementById('submitBtn');

if (submitBtn) {
  submitBtn.addEventListener('click', async () => {
    const inputs  = document.querySelectorAll('.form-inp');
    const label   = submitBtn.querySelector('span:last-child');
    const nameVal = document.querySelector('.form-inp[placeholder="Your Name"]');
    const mailVal = document.querySelector('.form-inp[placeholder="Your Email"]');
    const msgVal  = document.querySelector('.form-inp[placeholder="Your Message"]');

    // Highlight empty fields
    let ok = true;
    inputs.forEach(inp => {
      if (!inp.value.trim()) {
        ok = false;
        inp.style.borderColor = '#ff2d87';
        inp.style.boxShadow   = '0 0 10px #ff2d8755';
        setTimeout(() => { inp.style.borderColor = ''; inp.style.boxShadow = ''; }, 1800);
      }
    });
    if (!ok) return;

    // Loading state
    label.textContent      = 'Sending...';
    submitBtn.disabled     = true;
    submitBtn.style.opacity = '0.7';

    try {
      const res = await fetch('https://sanjay-portfolio-7cpq.onrender.com/api/contact', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:    nameVal.value.trim(),
          email:   mailVal.value.trim(),
          message: msgVal.value.trim(),
        }),
      });

      const data = await res.json();

      if (data.success) {
        label.textContent          = '✓ Message Sent!';
        submitBtn.style.background = 'linear-gradient(135deg, #00cc66, #00f5d4)';
        inputs.forEach(i => i.value = '');
        showToast('🚀 Got your message! I\'ll reply soon.', 'success');
      } else {
        label.textContent          = '✗ Failed';
        submitBtn.style.background = 'linear-gradient(135deg, #ff2d87, #7b2fff)';
        showToast('❌ ' + (data.message || 'Something went wrong.'), 'error');
      }

    } catch (err) {
      label.textContent          = '✗ Error';
      submitBtn.style.background = 'linear-gradient(135deg, #ff2d87, #7b2fff)';
      showToast('❌ Cannot reach server. Email me directly!', 'error');
    }

    // Reset button after 3s
    setTimeout(() => {
      label.textContent          = 'Send Message →';
      submitBtn.style.background = '';
      submitBtn.style.opacity    = '1';
      submitBtn.disabled         = false;
    }, 3000);
  });
}

/* ──────────── TOAST NOTIFICATION ──────────── */
function showToast(msg, type) {
  const old = document.getElementById('sj-toast');
  if (old) old.remove();

  const t = document.createElement('div');
  t.id = 'sj-toast';
  t.textContent = msg;
  t.style.cssText = `
    position:fixed; bottom:32px; right:32px;
    padding:14px 22px; border-radius:12px;
    font-family:'Rajdhani',sans-serif; font-size:15px; font-weight:600;
    color:#fff; z-index:9999; max-width:320px;
    opacity:0; transform:translateY(16px);
    transition:all .4s cubic-bezier(.4,0,.2,1);
    box-shadow:0 8px 32px rgba(0,0,0,.5);
    background:${type === 'success'
      ? 'linear-gradient(135deg,#00cc66,#00f5d4)'
      : 'linear-gradient(135deg,#ff2d87,#7b2fff)'};
  `;
  document.body.appendChild(t);
  requestAnimationFrame(() => { t.style.opacity = '1'; t.style.transform = 'translateY(0)'; });
  setTimeout(() => {
    t.style.opacity = '0'; t.style.transform = 'translateY(16px)';
    setTimeout(() => t.remove(), 400);
  }, 4000);
}

/* ──────────── HERO TITLE STAGGER ──────────── */
document.querySelectorAll('.title-line').forEach((el, i) => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(40px)';
  setTimeout(() => {
    el.style.transition = 'opacity .9s ease, transform .9s ease';
    el.style.opacity = '1';
    el.style.transform = 'none';
  }, 2700 + i * 180);
});
