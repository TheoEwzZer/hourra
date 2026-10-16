// Curseurs personnalisés (dessinés à la volée en PNG) + effets de traînée derrière la souris.
import { rand, pick } from './util.js';

export const CURSOR_GROUPS = [
  {
    name: 'Classiques',
    items: [
      { id: 'default', label: 'Windows', preview: '🖱️' },
      { id: 'arrow-theme', label: 'Flèche couleur', preview: '➤' },
      { id: 'arrow-big', label: 'Grande flèche', preview: '⬉' },
      { id: 'dot', label: 'Point', preview: '●' },
      { id: 'ring', label: 'Anneau', preview: '◯' },
      { id: 'crosshair', label: 'Viseur', preview: '✛' },
    ],
  },
  {
    name: 'Animaux',
    items: [
      ['🐱', 'Chat'], ['🐶', 'Chien'], ['🐼', 'Panda'], ['🦊', 'Renard'], ['🐰', 'Lapin'], ['🐻', 'Ours'], ['🐨', 'Koala'],
      ['🐯', 'Tigre'], ['🦁', 'Lion'], ['🐸', 'Grenouille'], ['🐵', 'Singe'], ['🐧', 'Pingouin'], ['🐤', 'Poussin'], ['🦉', 'Hibou'],
      ['🐢', 'Tortue'], ['🐙', 'Poulpe'], ['🦄', 'Licorne'], ['🐲', 'Dragon'], ['🦖', 'T-Rex'], ['🦕', 'Diplodocus'], ['🐳', 'Baleine'],
      ['🐬', 'Dauphin'], ['🦈', 'Requin'], ['🐝', 'Abeille'], ['🦋', 'Papillon'], ['🐞', 'Coccinelle'], ['🐌', 'Escargot'], ['🦀', 'Crabe'],
      ['🐹', 'Hamster'], ['🐭', 'Souris'], ['🐷', 'Cochon'], ['🐮', 'Vache'], ['🦔', 'Hérisson'], ['🦦', 'Loutre'], ['🦥', 'Paresseux'],
      ['🐿️', 'Écureuil'], ['🦩', 'Flamant'], ['🦜', 'Perroquet'], ['🐺', 'Loup'], ['🐴', 'Cheval'], ['🦒', 'Girafe'], ['🐘', 'Éléphant'],
      ['🦘', 'Kangourou'], ['🦭', 'Phoque'], ['🐡', 'Poisson-lune'], ['🦎', 'Lézard'], ['🐍', 'Serpent'], ['🦇', 'Chauve-souris'], ['🐈‍⬛', 'Chat noir'],
    ].map(([e, l]) => ({ id: 'emoji:' + e, label: l, preview: e })),
  },
  {
    name: 'Fun',
    items: [
      ['⭐', 'Étoile'], ['🌈', 'Arc-en-ciel'], ['🍕', 'Pizza'], ['🍩', 'Donut'], ['🍓', 'Fraise'], ['🍉', 'Pastèque'], ['🚀', 'Fusée'],
      ['👻', 'Fantôme'], ['👾', 'Alien'], ['💎', 'Diamant'], ['🔥', 'Feu'], ['❤️', 'Cœur'], ['✏️', 'Crayon'], ['🪄', 'Baguette magique'],
      ['⚡', 'Éclair'], ['🌸', 'Fleur'], ['🍀', 'Trèfle'], ['🎈', 'Ballon'], ['🧠', 'Cerveau'], ['📚', 'Livres'], ['☕', 'Café'],
      ['🎮', 'Manette'], ['🪐', 'Planète'], ['🌙', 'Lune'], ['🍄', 'Champignon'], ['🧁', 'Cupcake'], ['🎯', 'Cible'], ['🦴', 'Os'],
    ].map(([e, l]) => ({ id: 'emoji:' + e, label: l, preview: e })),
  },
];

export const TRAILS = {
  none: { label: 'Aucune', emoji: '🚫' },
  sparkles: { label: 'Paillettes', emoji: '✨' },
  stars: { label: 'Étoiles', emoji: '⭐' },
  hearts: { label: 'Cœurs', emoji: '💖' },
  paws: { label: 'Pattes', emoji: '🐾' },
  bubbles: { label: 'Bulles', emoji: '🫧' },
  rainbow: { label: 'Arc-en-ciel', emoji: '🌈' },
  same: { label: 'Mini-curseur', emoji: '🪞' },
};

let styleEl;
let currentPrimary = '#4aa8f0';

function drawArrow(x, s, fill, stroke) {
  x.beginPath();
  x.moveTo(2, 2);
  x.lineTo(2, s * 0.82);
  x.lineTo(s * 0.26, s * 0.62);
  x.lineTo(s * 0.42, s * 0.95);
  x.lineTo(s * 0.55, s * 0.89);
  x.lineTo(s * 0.4, s * 0.57);
  x.lineTo(s * 0.68, s * 0.57);
  x.closePath();
  x.fillStyle = fill;
  x.fill();
  x.lineWidth = Math.max(1.5, s / 20);
  x.strokeStyle = stroke;
  x.lineJoin = 'round';
  x.stroke();
}

/** Construit l'image du curseur. Renvoie { url, hx, hy } ou null pour le curseur système. */
export function buildCursor(id, size, primary) {
  if (id === 'default') return null;
  const s = Math.min(128, Math.max(16, size));
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const x = c.getContext('2d');
  let hx = 1, hy = 1;

  if (id === 'arrow-theme') drawArrow(x, s, primary, '#ffffff');
  else if (id === 'arrow-big') drawArrow(x, s, '#ffffff', '#111111');
  else if (id === 'dot') {
    x.beginPath(); x.arc(s / 2, s / 2, s * 0.22, 0, Math.PI * 2);
    x.fillStyle = primary; x.fill(); x.lineWidth = 2; x.strokeStyle = '#fff'; x.stroke();
    hx = hy = s / 2;
  } else if (id === 'ring') {
    x.beginPath(); x.arc(s / 2, s / 2, s * 0.36, 0, Math.PI * 2);
    x.lineWidth = Math.max(2, s / 12); x.strokeStyle = primary; x.stroke();
    x.beginPath(); x.arc(s / 2, s / 2, s * 0.06, 0, Math.PI * 2); x.fillStyle = primary; x.fill();
    hx = hy = s / 2;
  } else if (id === 'crosshair') {
    x.strokeStyle = '#fff'; x.lineWidth = 4;
    const line = (a, b, cc, d) => { x.beginPath(); x.moveTo(a, b); x.lineTo(cc, d); x.stroke(); };
    for (const [w, col] of [[4, '#fff'], [2, primary]]) {
      x.lineWidth = w; x.strokeStyle = col;
      line(s / 2, 2, s / 2, s * 0.38); line(s / 2, s * 0.62, s / 2, s - 2);
      line(2, s / 2, s * 0.38, s / 2); line(s * 0.62, s / 2, s - 2, s / 2);
    }
    hx = hy = s / 2;
  } else if (id.startsWith('emoji:')) {
    const e = id.slice(6);
    const fs = s * 0.78;
    x.font = `${fs}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText(e, s * 0.56, s * 0.58);
    // petite pointe pour savoir où on clique
    x.beginPath();
    x.moveTo(1, 1); x.lineTo(s * 0.3, s * 0.1); x.lineTo(s * 0.1, s * 0.3); x.closePath();
    x.fillStyle = primary; x.fill();
    x.lineWidth = 1.2; x.strokeStyle = '#fff'; x.stroke();
  }
  return { url: c.toDataURL('image/png'), hx: Math.round(hx), hy: Math.round(hy) };
}

export function applyCursor(cfg, primary) {
  currentPrimary = primary;
  styleEl ||= document.head.appendChild(document.createElement('style'));
  const cur = buildCursor(cfg.id, cfg.size, primary);
  styleEl.textContent = cur
    ? `html, body, *, *::before, *::after { cursor: url("${cur.url}") ${cur.hx} ${cur.hy}, auto !important; }
       input[type=text], textarea, [contenteditable=true] { cursor: url("${cur.url}") ${cur.hx} ${cur.hy}, text !important; }`
    : '';
  trail.kind = cfg.trail;
  trail.cursorImg = null;
  if (cfg.trail === 'same' && cur) {
    const img = new Image();
    img.src = cur.url;
    trail.cursorImg = img;
  }
}

// ---------- Traînée ----------
const trail = { kind: 'none', cursorImg: null, parts: [], last: 0, hue: 0 };
let tc, tx, running = false;

function tick() {
  tx.clearRect(0, 0, tc.width, tc.height);
  const ps = trail.parts;
  for (let i = ps.length - 1; i >= 0; i--) {
    const p = ps[i];
    p.life -= 1;
    if (p.life <= 0) { ps.splice(i, 1); continue; }
    p.x += p.vx; p.y += p.vy; p.vy += p.g;
    const a = p.life / p.max;
    tx.globalAlpha = a;
    if (p.text) {
      tx.save();
      tx.translate(p.x, p.y); tx.rotate(p.rot);
      tx.font = `${p.size}px "Segoe UI Emoji", sans-serif`;
      tx.textAlign = 'center'; tx.textBaseline = 'middle';
      tx.fillText(p.text, 0, 0);
      tx.restore();
    } else if (p.img) {
      const s = p.size * (0.5 + a * 0.5);
      tx.drawImage(p.img, p.x - s / 2, p.y - s / 2, s, s);
    } else if (p.ring) {
      tx.beginPath(); tx.arc(p.x, p.y, p.size * (1.4 - a * 0.4), 0, Math.PI * 2);
      tx.strokeStyle = p.color; tx.lineWidth = 1.5; tx.stroke();
    } else {
      tx.beginPath(); tx.arc(p.x, p.y, p.size * a, 0, Math.PI * 2);
      tx.fillStyle = p.color; tx.fill();
    }
  }
  tx.globalAlpha = 1;
  if (ps.length) requestAnimationFrame(tick);
  else running = false;
}

function emit(x, y) {
  const k = trail.kind;
  const base = { x, y, vx: rand(-0.6, 0.6), vy: rand(-0.6, 0.6), g: 0, rot: rand(-0.5, 0.5), life: 40, max: 40, size: 14 };
  if (k === 'sparkles') {
    base.text = pick(['✨', '✦', '·']); base.size = rand(8, 16); base.g = 0.04;
    if (base.text !== '✨') { delete base.text; base.color = pick(['#fff6a5', '#ffd25a', '#ffffff', currentPrimary]); base.size = rand(1.5, 3.5); }
  } else if (k === 'stars') { base.text = pick(['⭐', '🌟', '✦']); base.size = rand(10, 16); base.g = 0.05; }
  else if (k === 'hearts') { base.text = pick(['💖', '💗', '💕', '❤️']); base.size = rand(10, 16); base.vy = rand(-1.2, -0.4); }
  else if (k === 'paws') { base.text = '🐾'; base.size = 14; base.vx = base.vy = 0; base.life = base.max = 60; }
  else if (k === 'bubbles') { base.ring = true; base.color = 'rgba(120,190,255,0.9)'; base.size = rand(3, 8); base.vy = rand(-1.2, -0.5); }
  else if (k === 'rainbow') { trail.hue = (trail.hue + 8) % 360; base.color = `hsl(${trail.hue} 95% 60%)`; base.size = 6; base.vx = base.vy = 0; base.life = base.max = 30; }
  else if (k === 'same' && trail.cursorImg) { base.img = trail.cursorImg; base.size = 22; base.vx = base.vy = 0; base.life = base.max = 25; }
  else return;
  trail.parts.push(base);
  if (!running) { running = true; requestAnimationFrame(tick); }
}

export function initTrail() {
  tc = document.getElementById('fx-trail');
  tx = tc.getContext('2d');
  const resize = () => { tc.width = innerWidth; tc.height = innerHeight; };
  resize();
  addEventListener('resize', resize);
  addEventListener('mousemove', (e) => {
    if (trail.kind === 'none') return;
    const now = performance.now();
    const gap = trail.kind === 'paws' ? 110 : trail.kind === 'rainbow' ? 8 : 30;
    if (now - trail.last < gap) return;
    trail.last = now;
    emit(e.clientX + (trail.kind === 'paws' ? rand(-6, 6) : 0), e.clientY);
  });
}
