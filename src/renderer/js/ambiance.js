// Fonds d'écran : ambiances prédéfinies (dégradés + particules animées), image du PC, couleur, dégradé.
import { rand, pick } from './util.js';

export const AMBIANCES = {
  breathe: {
    label: 'Just Breathe', cat: 'Sérénité', emoji: '🍃',
    css: 'radial-gradient(circle at 20% 20%, #e8f9e9 0%, transparent 50%), radial-gradient(circle at 80% 70%, #d3f2dc 0%, transparent 55%), linear-gradient(160deg, #f3fbf1 0%, #cfeedd 100%)',
    particles: { kind: 'emoji', items: ['🍃', '🌿', '🍀'], count: 18, speed: 0.4, dir: 'fall', size: [14, 26] },
  },
  rando: {
    label: 'Marche paisible', cat: 'Sérénité', emoji: '🥾',
    css: 'linear-gradient(180deg, #ffe7c2 0%, #ffd6a5 30%, #b5d99c 62%, #7fb77e 100%)',
    particles: { kind: 'emoji', items: ['🦋', '🐝'], count: 8, speed: 0.6, dir: 'wander', size: [16, 24] },
  },
  ocean: {
    label: 'Océan mood', cat: 'Sérénité', emoji: '🌊',
    css: 'linear-gradient(180deg, #caf0f8 0%, #90e0ef 35%, #00b4d8 70%, #0077b6 100%)',
    particles: { kind: 'bubble', count: 40, speed: 0.6, dir: 'rise', size: [4, 16], color: 'rgba(255,255,255,0.55)' },
  },
  wave: {
    label: 'Vague de chill', cat: 'Sérénité', emoji: '🏄',
    css: 'radial-gradient(ellipse at 50% 120%, #4facfe 0%, transparent 60%), linear-gradient(135deg, #e0f7fa 0%, #a1c4fd 50%, #c2e9fb 100%)',
    particles: { kind: 'emoji', items: ['🐠', '🐟', '🐡', '🐚'], count: 10, speed: 0.5, dir: 'swim', size: [18, 28] },
  },
  fuji: {
    label: 'Fuji vibes', cat: 'Sérénité', emoji: '🗻',
    css: 'linear-gradient(180deg, #ffdde1 0%, #ffc3a0 45%, #ee9ca7 100%)',
    particles: { kind: 'emoji', items: ['🌸', '🌸', '💮'], count: 26, speed: 0.5, dir: 'fall', size: [12, 22] },
  },
  silicon: {
    label: 'Silicon Vibes', cat: 'Tech', emoji: '🔌',
    css: 'linear-gradient(rgba(0,255,200,0.07) 1px, transparent 1px) 0 0/32px 32px, linear-gradient(90deg, rgba(0,255,200,0.07) 1px, transparent 1px) 0 0/32px 32px, linear-gradient(160deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
    particles: { kind: 'dot', count: 40, speed: 0.8, dir: 'wander', size: [2, 4], color: '#4ff5d2', glow: true },
  },
  neon: {
    label: 'Néon vibes', cat: 'Tech', emoji: '💜',
    css: 'radial-gradient(circle at 15% 85%, rgba(241,91,181,0.55) 0%, transparent 40%), radial-gradient(circle at 85% 15%, rgba(0,245,212,0.45) 0%, transparent 40%), linear-gradient(135deg, #10002b 0%, #240046 50%, #3c096c 100%)',
    particles: { kind: 'dot', count: 50, speed: 0.5, dir: 'rise', size: [1.5, 3.5], colors: ['#f15bb5', '#00f5d4', '#fee440', '#9b5de5'], glow: true },
  },
  tetris: {
    label: 'Pixels mania', cat: 'Tech', emoji: '👾',
    css: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    particles: { kind: 'square', count: 30, speed: 0.7, dir: 'fall', size: [8, 18], colors: ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93'] },
  },
  space: {
    label: 'Voyage spatial', cat: 'Tech', emoji: '🚀',
    css: 'radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%)',
    particles: { kind: 'star', count: 120, speed: 0.15, dir: 'twinkle', size: [0.5, 2.2], color: '#ffffff' },
  },
  unicorn: {
    label: 'Licorne ché-per', cat: 'WTF', emoji: '🦄',
    css: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 35%, #fdcbf1 65%, #e6dee9 100%)',
    particles: { kind: 'emoji', items: ['🦄', '🌈', '✨', '💖', '⭐'], count: 22, speed: 0.6, dir: 'rise', size: [14, 28] },
  },
  cat: {
    label: 'Félindomptable', cat: 'Warrior', emoji: '😼',
    css: 'radial-gradient(circle at 70% 30%, #ffe0b2 0%, transparent 50%), linear-gradient(160deg, #ffcc80 0%, #ff8a65 60%, #e64a19 100%)',
    particles: { kind: 'emoji', items: ['🐾', '🐱', '😼', '🐟'], count: 18, speed: 0.4, dir: 'fall', size: [14, 26] },
  },
  candy: {
    label: 'Pays des bonbons', cat: 'WTF', emoji: '🍭',
    css: 'repeating-linear-gradient(45deg, #ffe5f1 0 24px, #fff6fb 24px 48px)',
    particles: { kind: 'emoji', items: ['🍭', '🍬', '🧁', '🍩', '🍪'], count: 18, speed: 0.5, dir: 'fall', size: [16, 26] },
  },
  snow: {
    label: 'Chalet sous la neige', cat: 'Sérénité', emoji: '❄️',
    css: 'linear-gradient(180deg, #4b6cb7 0%, #9bb5e8 60%, #e8f0ff 100%)',
    particles: { kind: 'dot', count: 90, speed: 0.6, dir: 'fall', size: [1.5, 4], color: '#ffffff' },
  },
  autumn: {
    label: 'Automne doré', cat: 'Sérénité', emoji: '🍂',
    css: 'linear-gradient(160deg, #fceabb 0%, #f8b500 55%, #d35400 100%)',
    particles: { kind: 'emoji', items: ['🍂', '🍁', '🍄'], count: 20, speed: 0.6, dir: 'fall', size: [14, 26] },
  },
  fireflies: {
    label: 'Lucioles', cat: 'Sérénité', emoji: '✨',
    css: 'radial-gradient(ellipse at bottom, #0f3d2e 0%, #061a14 100%)',
    particles: { kind: 'dot', count: 45, speed: 0.4, dir: 'wander', size: [1.5, 3.5], color: '#e9ff70', glow: true, twinkle: true },
  },
};

let canvas, ctx, raf, parts = [], cfg = null;
const emojiCache = new Map();

function emojiImg(e, size) {
  const key = e + '|' + Math.round(size);
  if (emojiCache.has(key)) return emojiCache.get(key);
  const c = document.createElement('canvas');
  const s = Math.ceil(size * 1.4);
  c.width = c.height = s;
  const x = c.getContext('2d');
  x.font = `${size}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillText(e, s / 2, s / 2 + size * 0.05);
  emojiCache.set(key, c);
  return c;
}

function spawn(p, W, H, initial) {
  const size = rand(...p.size);
  const o = {
    x: rand(0, W),
    y: initial ? rand(0, H) : (p.dir === 'rise' ? H + 30 : p.dir === 'fall' ? -30 : rand(0, H)),
    size,
    vx: 0, vy: 0,
    rot: rand(0, Math.PI * 2), vr: rand(-0.01, 0.01),
    phase: rand(0, Math.PI * 2),
    item: p.items ? pick(p.items) : null,
    color: p.colors ? pick(p.colors) : p.color,
  };
  const sp = p.speed * rand(0.6, 1.4);
  if (p.dir === 'fall') { o.vy = sp; o.vx = rand(-0.3, 0.3); }
  else if (p.dir === 'rise') { o.vy = -sp; o.vx = rand(-0.2, 0.2); }
  else if (p.dir === 'swim') { o.vx = (Math.random() < 0.5 ? -1 : 1) * sp; o.x = initial ? o.x : (o.vx > 0 ? -30 : W + 30); }
  else if (p.dir === 'wander') { o.vx = rand(-sp, sp); o.vy = rand(-sp, sp); }
  return o;
}

function loop() {
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  const p = cfg;
  const t = performance.now() / 1000;
  for (let i = 0; i < parts.length; i++) {
    const o = parts[i];
    o.phase += 0.02;
    o.x += o.vx + (p.dir === 'fall' || p.dir === 'rise' ? Math.sin(o.phase) * 0.3 : 0);
    o.y += o.vy + (p.dir === 'swim' ? Math.sin(o.phase) * 0.3 : 0);
    o.rot += o.vr;
    if (p.dir === 'wander') {
      o.vx += rand(-0.03, 0.03); o.vy += rand(-0.03, 0.03);
      const m = p.speed * 1.4;
      o.vx = Math.max(-m, Math.min(m, o.vx)); o.vy = Math.max(-m, Math.min(m, o.vy));
      if (o.x < -20) o.x = W + 20; if (o.x > W + 20) o.x = -20;
      if (o.y < -20) o.y = H + 20; if (o.y > H + 20) o.y = -20;
    }
    if ((p.dir === 'fall' && o.y > H + 40) || (p.dir === 'rise' && o.y < -40) || (p.dir === 'swim' && (o.x < -60 || o.x > W + 60))) {
      parts[i] = spawn(p, W, H, false);
      continue;
    }
    let alpha = 1;
    if (p.dir === 'twinkle' || p.twinkle) alpha = 0.35 + 0.65 * Math.abs(Math.sin(t * (0.6 + (i % 7) * 0.2) + o.phase));
    ctx.globalAlpha = alpha;
    if (p.kind === 'emoji') {
      const img = emojiImg(o.item, o.size);
      ctx.save();
      ctx.translate(o.x, o.y);
      ctx.rotate(p.dir === 'swim' ? 0 : Math.sin(o.rot) * 0.6);
      if (p.dir === 'swim' && o.vx > 0) ctx.scale(-1, 1);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();
    } else if (p.kind === 'bubble') {
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.size, 0, Math.PI * 2);
      ctx.strokeStyle = o.color; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.beginPath();
      ctx.arc(o.x - o.size * 0.35, o.y - o.size * 0.35, o.size * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fill();
    } else if (p.kind === 'square') {
      ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(Math.round(o.rot / (Math.PI / 2)) * (Math.PI / 2));
      ctx.fillStyle = o.color; ctx.globalAlpha = alpha * 0.75;
      ctx.fillRect(-o.size / 2, -o.size / 2, o.size, o.size);
      ctx.restore();
    } else {
      if (p.glow) { ctx.shadowBlur = 12; ctx.shadowColor = o.color; }
      ctx.beginPath(); ctx.arc(o.x, o.y, o.size, 0, Math.PI * 2);
      ctx.fillStyle = o.color; ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
  ctx.globalAlpha = 1;
  raf = requestAnimationFrame(loop);
}

function resize() {
  if (!canvas) return;
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}

function startParticles(p) {
  cancelAnimationFrame(raf);
  cfg = p;
  if (!p) { parts = []; ctx?.clearRect(0, 0, canvas.width, canvas.height); return; }
  resize();
  parts = Array.from({ length: p.count }, () => spawn(p, canvas.width, canvas.height, true));
  loop();
}

let lastKey = '';

export function applyBackground(bg) {
  const layer = document.getElementById('bg-layer');
  const dim = document.getElementById('bg-dim');
  canvas ||= document.getElementById('bg-particles');
  ctx ||= canvas.getContext('2d');

  let css = 'none', particles = null, size = 'cover', repeat = 'no-repeat', pos = 'center';
  if (bg.type === 'preset' && AMBIANCES[bg.preset]) {
    const a = AMBIANCES[bg.preset];
    css = a.css; size = ''; repeat = ''; pos = '';
    particles = bg.particles ? a.particles : null;
  } else if (bg.type === 'image' && bg.image?.url) {
    css = `url("${bg.image.url.replace(/"/g, '%22')}")`;
    if (bg.fit === 'contain') size = 'contain';
    else if (bg.fit === 'repeat') { size = 'auto'; repeat = 'repeat'; }
    else if (bg.fit === 'center') size = 'auto';
    else if (bg.fit === 'stretch') size = '100% 100%';
  } else if (bg.type === 'color') {
    css = `linear-gradient(${bg.color}, ${bg.color})`;
  } else if (bg.type === 'gradient') {
    css = `linear-gradient(${bg.gradient.angle}deg, ${bg.gradient.from}, ${bg.gradient.to})`;
  }

  layer.style.background = css;
  if (size) layer.style.backgroundSize = size;
  if (repeat) layer.style.backgroundRepeat = repeat;
  if (pos) layer.style.backgroundPosition = pos;
  layer.style.filter = bg.blur ? `blur(${bg.blur}px)` : '';
  layer.style.inset = bg.blur ? `-${bg.blur * 2}px` : '0';
  dim.style.background = bg.dim > 0 ? `rgba(0,0,0,${bg.dim / 100})` : bg.dim < 0 ? `rgba(255,255,255,${-bg.dim / 100})` : 'transparent';
  document.body.classList.toggle('has-bg', bg.type !== 'none');

  const key = bg.type + '|' + bg.preset + '|' + bg.particles;
  if (key !== lastKey) {
    lastKey = key;
    startParticles(particles);
  }
}

addEventListener('resize', resize);
