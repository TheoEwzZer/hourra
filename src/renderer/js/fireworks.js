// Feux d'artifice + confettis sur un canvas plein écran, et petits sons synthétisés (Web Audio).
import { rand, pick } from './util.js';

let cv, cx, ov, ox, running = false;
const rockets = [];
const sparks = [];
const confetti = [];
const drops = [];
const emojiCache = new Map();

function emojiImg(e, size) {
  const key = e + '|' + Math.round(size);
  let c = emojiCache.get(key);
  if (c) return c;
  c = document.createElement('canvas');
  const s = Math.ceil(size * 1.3);
  c.width = c.height = s;
  const x = c.getContext('2d');
  x.font = `${size}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillText(e, s / 2, s / 2 + size * 0.05);
  emojiCache.set(key, c);
  return c;
}
let audio;

const RAINBOW = ['#ff4d6d', '#ff9f1c', '#ffd25a', '#3cc47c', '#2ec4f0', '#7a6cff', '#f05aa0'];
const GOLD = ['#ffd700', '#ffe680', '#fff3c4', '#ffb703', '#ffffff'];

function palette(cfg, theme) {
  if (cfg.palette === 'gold') return GOLD;
  if (cfg.palette === 'theme') return [theme.primary, theme.accent, theme.success, '#ffffff'];
  if (cfg.palette === 'custom' && cfg.customColors?.length) return cfg.customColors;
  return RAINBOW;
}

function ensureCanvas() {
  if (cv) return;
  cv = document.getElementById('fx-fireworks');
  cx = cv.getContext('2d');
  ov = document.getElementById('fx-objects');
  ox = ov.getContext('2d');
  const resize = () => { cv.width = ov.width = innerWidth; cv.height = ov.height = innerHeight; };
  resize();
  addEventListener('resize', resize);
}

// ---------- Son ----------
function ac() {
  audio ||= new AudioContext();
  return audio;
}

function whoosh(vol) {
  const a = ac();
  const len = 0.5;
  const buf = a.createBuffer(1, a.sampleRate * len, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (i / d.length);
  const src = a.createBufferSource();
  src.buffer = buf;
  const f = a.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.setValueAtTime(400, a.currentTime);
  f.frequency.exponentialRampToValueAtTime(3000, a.currentTime + len);
  const g = a.createGain();
  g.gain.value = vol * 0.15;
  src.connect(f).connect(g).connect(a.destination);
  src.start();
}

function bang(vol) {
  const a = ac();
  const len = 1.2;
  const buf = a.createBuffer(1, a.sampleRate * len, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) {
    const t = i / a.sampleRate;
    d[i] = (Math.random() * 2 - 1) * Math.exp(-t * 5) * (Math.random() < 0.02 + Math.exp(-t * 3) ? 1 : 0.3);
  }
  const src = a.createBufferSource();
  src.buffer = buf;
  const f = a.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = rand(900, 1800);
  const g = a.createGain();
  g.gain.value = vol * 0.5;
  src.connect(f).connect(g).connect(a.destination);
  src.start();
}

/** Petit « ding » joyeux de validation. */
export function ding(vol = 0.5) {
  try {
    const a = ac();
    [784, 1047, 1319].forEach((freq, i) => {
      const o = a.createOscillator();
      const g = a.createGain();
      o.type = 'triangle';
      o.frequency.value = freq;
      const t = a.currentTime + i * 0.08;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol * 0.18, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      o.connect(g).connect(a.destination);
      o.start(t);
      o.stop(t + 0.4);
    });
  } catch {
    // Audio indisponible : on reste silencieux
  }
}

// ---------- Animation ----------
function explode(r, cfg) {
  const n = r.big ? 140 : 80;
  const shape = pick(['sphere', 'sphere', 'ring', 'heart', 'willow']);
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * Math.PI * 2;
    let sp = rand(1.5, r.big ? 7 : 5.5);
    let vx = Math.cos(ang) * sp, vy = Math.sin(ang) * sp;
    if (shape === 'ring') { sp = r.big ? 6 : 4.5; vx = Math.cos(ang) * sp; vy = Math.sin(ang) * sp; }
    if (shape === 'heart') {
      const t = ang;
      vx = 16 * Math.sin(t) ** 3 / 4;
      vy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 4;
      vx *= 0.9; vy *= 0.9;
    }
    sparks.push({
      x: r.x, y: r.y, vx, vy,
      color: Math.random() < 0.8 ? r.color : pick(r.colors),
      life: shape === 'willow' ? rand(90, 130) : rand(55, 85),
      max: 100, size: rand(1.4, 2.6),
      drag: shape === 'willow' ? 0.975 : 0.955,
      g: shape === 'willow' ? 0.04 : 0.06,
      flicker: Math.random() < 0.3,
    });
  }
  if (cfg.sound) bang(cfg.volume);
}

function frame() {
  cx.globalCompositeOperation = 'destination-out';
  cx.fillStyle = 'rgba(0,0,0,0.25)';
  cx.fillRect(0, 0, cv.width, cv.height);
  cx.globalCompositeOperation = 'lighter';

  for (let i = rockets.length - 1; i >= 0; i--) {
    const r = rockets[i];
    if (r.delay > 0) { r.delay--; continue; }
    if (!r.launched) { r.launched = true; if (r.cfg.sound) whoosh(r.cfg.volume); }
    r.x += r.vx; r.y += r.vy; r.vy += 0.05;
    cx.beginPath(); cx.arc(r.x, r.y, 2.2, 0, Math.PI * 2);
    cx.fillStyle = '#fff6d0'; cx.fill();
    sparks.push({ x: r.x, y: r.y, vx: rand(-0.3, 0.3), vy: rand(0.5, 1.2), color: '#ffcf70', life: 18, max: 18, size: 1.2, drag: 0.95, g: 0.02 });
    if (r.vy >= -0.5 || r.y <= r.ty) {
      explode(r, r.cfg);
      rockets.splice(i, 1);
    }
  }

  for (let i = sparks.length - 1; i >= 0; i--) {
    const p = sparks[i];
    p.vx *= p.drag; p.vy *= p.drag; p.vy += p.g;
    p.x += p.vx; p.y += p.vy;
    p.life--;
    if (p.life <= 0) { sparks.splice(i, 1); continue; }
    const a = Math.min(1, p.life / 40);
    if (p.flicker && Math.random() < 0.3) continue;
    cx.globalAlpha = a;
    cx.beginPath(); cx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    cx.fillStyle = p.color; cx.fill();
  }

  cx.globalCompositeOperation = 'source-over';
  cx.globalAlpha = 1;

  // Calque net (sans traînée) : confettis, emojis, ballons
  ox.clearRect(0, 0, ov.width, ov.height);
  for (let i = confetti.length - 1; i >= 0; i--) {
    const c = confetti[i];
    c.vx *= 0.985; c.vy = c.vy * 0.985 + 0.12;
    c.x += c.vx + Math.sin(c.wob) * 0.6; c.y += c.vy;
    c.wob += 0.1; c.rot += c.vr;
    c.life--;
    if (c.life <= 0 || c.y > ov.height + 20) { confetti.splice(i, 1); continue; }
    ox.globalAlpha = Math.min(1, c.life / 30);
    ox.save();
    ox.translate(c.x, c.y); ox.rotate(c.rot);
    ox.scale(1, Math.cos(c.wob));
    ox.fillStyle = c.color;
    if (c.round) { ox.beginPath(); ox.arc(0, 0, c.w / 2, 0, Math.PI * 2); ox.fill(); }
    else ox.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
    ox.restore();
  }

  const floor = ov.height - 4;
  for (let i = drops.length - 1; i >= 0; i--) {
    const d = drops[i];
    if (d.delay > 0) { d.delay--; continue; }
    d.vy += d.g; d.vx *= 0.995;
    d.x += d.vx + (d.sway ? Math.sin(d.wob) * d.sway : 0); d.y += d.vy;
    d.wob += 0.05; d.rot += d.vr;
    d.life--;
    if (d.walls) {
      const r = d.size / 2;
      if (d.x < r && d.vx < 0) { d.x = r; d.vx *= -0.9; d.vr *= -1; }
      if (d.x > ov.width - r && d.vx > 0) { d.x = ov.width - r; d.vx *= -0.9; d.vr *= -1; }
    }
    if (d.bounce && d.y + d.size / 2 > floor && d.vy > 0) {
      d.y = floor - d.size / 2;
      const k = d.elastic || 0.45;
      d.vy *= -k; d.vx *= d.elastic ? 0.97 : 0.8; d.vr *= 0.6;
      if (d.elastic) d.squash = 1;
      if (Math.abs(d.vy) < 1.2) { d.vy = 0; d.g = 0; d.vr = 0; d.bounce = false; }
    }
    if (d.squash) d.squash = Math.max(0, d.squash - 0.12);
    if (d.life <= 0 || d.y > ov.height + 80 || d.y < -250) { drops.splice(i, 1); continue; }
    ox.globalAlpha = Math.min(1, d.life / 40);
    ox.save();
    ox.translate(d.x, d.y);
    ox.rotate(d.rot);
    // Écrasement façon pâte à modeler au contact du sol
    if (d.squash) ox.scale(1 + d.squash * 0.35, 1 - d.squash * 0.3);
    if (d.balloon) drawBalloon(d);
    else {
      const img = emojiImg(d.emoji, d.size);
      ox.drawImage(img, -img.width / 2, -img.height / 2);
    }
    ox.restore();
  }
  ox.globalAlpha = 1;

  if (rockets.length || sparks.length || confetti.length || drops.length) requestAnimationFrame(frame);
  else { running = false; cx.clearRect(0, 0, cv.width, cv.height); ox.clearRect(0, 0, ov.width, ov.height); }
}

function drawBalloon(d) {
  const r = d.size / 2;
  ox.strokeStyle = 'rgba(80,80,80,.6)';
  ox.lineWidth = 1.2;
  ox.beginPath();
  ox.moveTo(0, r * 1.15);
  ox.bezierCurveTo(-6, r * 1.6, 6, r * 2, 0, r * 2.6);
  ox.stroke();
  ox.fillStyle = d.color;
  ox.beginPath();
  ox.ellipse(0, 0, r * 0.86, r, 0, 0, Math.PI * 2);
  ox.fill();
  ox.beginPath();
  ox.moveTo(-4, r * 1.18); ox.lineTo(4, r * 1.18); ox.lineTo(0, r * 0.95); ox.closePath();
  ox.fill();
  ox.fillStyle = 'rgba(255,255,255,.45)';
  ox.beginPath();
  ox.ellipse(-r * 0.32, -r * 0.38, r * 0.16, r * 0.28, -0.5, 0, Math.PI * 2);
  ox.fill();
}

function start() {
  if (!running) { running = true; requestAnimationFrame(frame); }
}

const COUNT = (cfg, base) => Math.round(base * ({ light: 0.45, normal: 1, insane: 2.6 }[cfg.intensity] || 1));

function launchFireworks(cfg, colors) {
  const W = cv.width, H = cv.height;
  const count = { light: 3, normal: 7, insane: 18 }[cfg.intensity] || 7;
  for (let i = 0; i < count; i++) {
    const x = rand(W * 0.12, W * 0.88);
    const ty = rand(H * 0.12, H * 0.45);
    const vy = -Math.sqrt(2 * 0.05 * (H - ty)) * rand(0.95, 1.05);
    rockets.push({ x, y: H + 5, vx: rand(-1, 1), vy, ty, color: pick(colors), colors, delay: Math.round(i * rand(10, 22)), big: Math.random() < 0.3, cfg });
  }
}

function burstConfetti(x, y, cfg, colors) {
  const n = COUNT(cfg, 130);
  for (let i = 0; i < n; i++) {
    const ang = rand(-Math.PI, 0);
    const sp = rand(4, 13);
    confetti.push({
      x, y, vx: Math.cos(ang) * sp * rand(0.5, 1.2), vy: Math.sin(ang) * sp - rand(2, 5),
      w: rand(6, 11), h: rand(3, 6), round: Math.random() < 0.2,
      color: pick(colors), rot: rand(0, 6), vr: rand(-0.3, 0.3), wob: rand(0, 6), life: rand(120, 200),
    });
  }
}

/** Découpe une chaîne d'emojis en emojis individuels (gère 🐈‍⬛, drapeaux, etc.). */
export function splitEmojis(str) {
  const seg = new Intl.Segmenter('fr', { granularity: 'grapheme' });
  return [...seg.segment(str || '')].map((s) => s.segment).filter((s) => s.trim());
}

function emojiRain(cfg) {
  const list = splitEmojis(cfg.emojis);
  if (!list.length) list.push('🐷');
  const n = COUNT(cfg, 45);
  for (let i = 0; i < n; i++) {
    const size = rand(26, 58);
    drops.push({
      emoji: pick(list), size, x: rand(0, ov.width), y: -size - rand(0, 60),
      vx: rand(-0.8, 0.8), vy: rand(1, 4), g: rand(0.12, 0.22), rot: rand(-0.4, 0.4), vr: rand(-0.05, 0.05),
      wob: rand(0, 6), sway: 0, delay: Math.round(rand(0, 70)), life: 260, bounce: true,
    });
  }
}

function emojiBurst(x, y, cfg) {
  const list = splitEmojis(cfg.emojis);
  if (!list.length) list.push('⭐');
  const n = COUNT(cfg, 34);
  for (let i = 0; i < n; i++) {
    const ang = rand(-Math.PI * 0.95, -Math.PI * 0.05);
    const sp = rand(5, 15);
    drops.push({
      emoji: pick(list), size: rand(22, 46), x, y,
      vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, g: 0.32, rot: 0, vr: rand(-0.2, 0.2),
      wob: 0, sway: 0, delay: 0, life: rand(100, 150), bounce: true,
    });
  }
}

function poopBounce(x, cfg) {
  const n = COUNT(cfg, 18);
  for (let i = 0; i < n; i++) {
    const size = rand(30, 64);
    drops.push({
      emoji: '💩', size, x: Math.random() < 0.5 ? x + rand(-80, 80) : rand(size, ov.width - size), y: -size - rand(0, 120),
      vx: rand(-7, 7), vy: rand(0, 4), g: 0.45, rot: rand(-0.3, 0.3), vr: rand(-0.12, 0.12),
      wob: 0, sway: 0, delay: Math.round(rand(0, 50)), life: 420, bounce: true, elastic: rand(0.72, 0.84), walls: true,
    });
  }
}

function balloons(cfg, colors) {
  const n = COUNT(cfg, 22);
  for (let i = 0; i < n; i++) {
    drops.push({
      balloon: true, color: pick(colors), size: rand(34, 60), x: rand(20, ov.width - 20), y: ov.height + rand(40, 160),
      vx: 0, vy: rand(-2.6, -1.4), g: -0.004, rot: rand(-0.15, 0.15), vr: 0,
      wob: rand(0, 6), sway: rand(0.4, 1.1), delay: Math.round(rand(0, 60)), life: 420, bounce: false,
    });
  }
}

export const EFFECTS = {
  fireworks: { label: 'Feux d\'artifice', emoji: '🎆' },
  confetti: { label: 'Confettis', emoji: '🎊' },
  both: { label: 'Feux + confettis', emoji: '🎉' },
  rain: { label: 'Pluie d\'emojis', emoji: '🌧️', usesEmojis: true },
  burst: { label: 'Explosion d\'emojis', emoji: '💥', usesEmojis: true },
  balloons: { label: 'Lâcher de ballons', emoji: '🎈' },
  poop: { label: 'Cacas rebondissants', emoji: '💩' },
  party: { label: 'Méga fête (tout !)', emoji: '🥳', usesEmojis: true },
  none: { label: 'Rien du tout', emoji: '🚫' },
};

export const EMOJI_PRESETS = [
  ['Cochons', '🐷🐖🐽'], ['Chats', '🐱🐈😺'], ['Chiens', '🐶🐕🦴'], ['Cœurs', '💖💕❤️'], ['Étoiles', '⭐🌟✨'],
  ['Licornes', '🦄🌈'], ['Pizzas', '🍕'], ['Gâteaux', '🍩🧁🍪'], ['Billets', '💸💰'], ['Grenouilles', '🐸'],
  ['Fleurs', '🌸🌺🌷'], ['Trophées', '🏆🥇🎖️'], ['Cerveaux', '🧠'], ['Fantômes', '👻'], ['Dinos', '🦖🦕'],
  ['Canards', '🦆🐥'], ['Fruits', '🍓🍉🍒🍌'], ['Livres', '📚📖✏️'], ['Pandas', '🐼🎋'], ['Fusées', '🚀🪐'],
];

/** Célébration d'une mission validée. (x, y) = point de départ des confettis/explosions. */
export function celebrate(cfg, theme, x = innerWidth / 2, y = innerHeight / 2) {
  if (cfg.sound) ding(cfg.volume);
  if (!cfg.enabled || cfg.style === 'none') return;
  ensureCanvas();
  const colors = palette(cfg, theme);
  const st = cfg.style;
  if (st === 'fireworks' || st === 'both' || st === 'party') launchFireworks(cfg, colors);
  if (st === 'confetti' || st === 'both' || st === 'party') burstConfetti(x, y, cfg, colors);
  if (st === 'rain' || st === 'party') emojiRain(cfg);
  if (st === 'burst' || st === 'party') emojiBurst(x, y, cfg);
  if (st === 'balloons' || st === 'party') balloons(cfg, colors);
  if (st === 'poop') poopBounce(x, cfg);
  start();
}

/** Grand final : toutes les missions du jour validées ! */
export function grandFinale(cfg, theme) {
  if (!cfg.enabled || cfg.style === 'none') return;
  celebrate({ ...cfg, sound: false, intensity: 'insane' }, theme, innerWidth / 2, innerHeight);
}
