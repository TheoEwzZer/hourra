// Compagnons qui se promènent sur l'écran et réagissent (clic, glisser-déposer, missions validées, inactivité...).
import { h, rand, pick, clamp, uid } from './util.js';

// move: walk | hop | fly | slow | waddle — faces: sens naturel de l'emoji
export const SPECIES = {
  cat: { label: 'Chat', emoji: '🐈', move: 'walk', sound: 'Miaou !', food: '🐟', faces: 'left' },
  blackcat: { label: 'Chat noir', emoji: '🐈‍⬛', move: 'walk', sound: 'Mrrraou…', food: '🐟', faces: 'left' },
  dog: { label: 'Chien', emoji: '🐕', move: 'walk', sound: 'Wouf !', food: '🦴', faces: 'left' },
  poodle: { label: 'Caniche', emoji: '🐩', move: 'walk', sound: 'Wif wif !', food: '🦴', faces: 'left' },
  rabbit: { label: 'Lapin', emoji: '🐇', move: 'hop', sound: 'Grignote grignote', food: '🥕', faces: 'left' },
  hamster: { label: 'Hamster', emoji: '🐹', move: 'hop', sound: 'Couic !', food: '🌻', faces: 'left' },
  mouse: { label: 'Souris', emoji: '🐁', move: 'walk', sound: 'Squeak !', food: '🧀', faces: 'left' },
  fox: { label: 'Renard', emoji: '🦊', move: 'walk', sound: 'Yip yip !', food: '🍇', faces: 'left' },
  panda: { label: 'Panda', emoji: '🐼', move: 'waddle', sound: 'Bambouuu', food: '🎋', faces: 'left' },
  penguin: { label: 'Pingouin', emoji: '🐧', move: 'waddle', sound: 'Kwak kwak', food: '🐟', faces: 'left' },
  duck: { label: 'Canard', emoji: '🦆', move: 'waddle', sound: 'Coin coin !', food: '🍞', faces: 'left' },
  chick: { label: 'Poussin', emoji: '🐥', move: 'hop', sound: 'Piou piou !', food: '🌽', faces: 'left' },
  pig: { label: 'Cochon', emoji: '🐖', move: 'walk', sound: 'Groin groin', food: '🍎', faces: 'left' },
  hedgehog: { label: 'Hérisson', emoji: '🦔', move: 'walk', sound: 'Snif snif', food: '🍓', faces: 'left' },
  otter: { label: 'Loutre', emoji: '🦦', move: 'waddle', sound: 'Kiii !', food: '🐚', faces: 'left' },
  raccoon: { label: 'Raton laveur', emoji: '🦝', move: 'walk', sound: 'Hehe', food: '🍪', faces: 'left' },
  turtle: { label: 'Tortue', emoji: '🐢', move: 'slow', sound: '...Coucou...', food: '🥬', faces: 'left' },
  snail: { label: 'Escargot', emoji: '🐌', move: 'slow', sound: 'J\'arrive !', food: '🥬', faces: 'left' },
  sloth: { label: 'Paresseux', emoji: '🦥', move: 'slow', sound: 'Zzz… quoi ?', food: '🍃', faces: 'left' },
  frog: { label: 'Grenouille', emoji: '🐸', move: 'hop', sound: 'Croâ !', food: '🪰', faces: 'left' },
  dino: { label: 'T-Rex', emoji: '🦖', move: 'walk', sound: 'ROAAAR !', food: '🍖', faces: 'left' },
  sauropod: { label: 'Diplodocus', emoji: '🦕', move: 'slow', sound: 'Mooooh', food: '🌿', faces: 'left' },
  unicorn: { label: 'Licorne', emoji: '🦄', move: 'hop', sound: 'Hiii ✨', food: '🌈', faces: 'left' },
  dragon: { label: 'Dragon', emoji: '🐉', move: 'fly', sound: 'Fshhh 🔥', food: '🍖', faces: 'left' },
  owl: { label: 'Hibou', emoji: '🦉', move: 'fly', sound: 'Hou hou !', food: '🐁', faces: 'left' },
  bee: { label: 'Abeille', emoji: '🐝', move: 'fly', sound: 'Bzzz !', food: '🌸', faces: 'left' },
  butterfly: { label: 'Papillon', emoji: '🦋', move: 'fly', sound: '~ flap flap ~', food: '🌺', faces: 'left' },
  ghost: { label: 'Fantôme', emoji: '👻', move: 'fly', sound: 'Bouh !', food: '🍬', faces: 'left' },
  alien: { label: 'Alien', emoji: '👾', move: 'hop', sound: 'Bip boup !', food: '🔋', faces: 'left' },
  crab: { label: 'Crabe', emoji: '🦀', move: 'walk', sound: 'Clac clac !', food: '🐚', faces: 'left' },
};

export const MODES = {
  wander: 'Se promène partout',
  follow: 'Suit la souris',
  clickfollow: 'Me suit quand je clique',
  corner: 'Dort dans un coin',
};

const PET_TALK = [
  'Tu révises bien ?', 'Je crois en toi !', 'Encore une mission ? 💪', 'Pause goûter ?', 'T\'es trop fort(e) !',
  'Hip Hip Hip !', 'Je veille sur toi 👀', 'Bois un verre d\'eau 💧', 'On fait une pause ?', 'Coucou ! 👋',
];
const PET_BRAVO = ['Bravo !! 🎉', 'Trop fort(e) !', 'Mission validée ! ✅', 'Wouhou !', 'GG ! 🏆', 'Champion(ne) !', 'Hip Hip Hip... Hourra !'];

let layer;
let pets = [];
let cfg = null;
let mouse = { x: innerWidth / 2, y: innerHeight / 2, t: 0, speed: 0 };
let lastInput = performance.now();
let raf;

function bounds(p) {
  const s = p.size;
  return { minX: 4, maxX: innerWidth - s - 4, minY: 50, maxY: innerHeight - s - 4 };
}

function say(p, text, ms = 2200) {
  if (!cfg.bubbles) return;
  p.bubble.textContent = text;
  p.bubble.classList.add('show');
  clearTimeout(p.bubbleT);
  p.bubbleT = setTimeout(() => p.bubble.classList.remove('show'), ms);
}

function popEmoji(p, e, n = 1) {
  for (let i = 0; i < n; i++) {
    const el = h('span.pet-pop', { style: { left: p.x + p.size / 2 + rand(-12, 12) + 'px', top: p.y + rand(-6, 6) + 'px', animationDelay: i * 90 + 'ms' } }, e);
    layer.append(el);
    setTimeout(() => el.remove(), 1400 + i * 90);
  }
}

function setState(p, s, dur = 0) {
  p.state = s;
  p.stateUntil = dur ? performance.now() + dur : 0;
  p.el.dataset.state = s;
}

function newTarget(p) {
  const b = bounds(p);
  const sp = SPECIES[p.species];
  p.tx = rand(b.minX, b.maxX);
  p.ty = sp.move === 'fly' ? rand(b.minY, b.maxY) : rand(Math.max(b.minY, innerHeight * 0.25), b.maxY);
}

function makePet(def) {
  const sp = SPECIES[def.species] || SPECIES.cat;
  const size = def.size || 40;
  const bubble = h('div.pet-bubble');
  const body = h('div.pet-body', { style: { fontSize: size + 'px' } }, sp.emoji);
  const zzz = h('div.pet-zzz', null, 'z', h('span', null, 'z'), h('span', null, 'Z'));
  const el = h('div.pet', { dataset: { move: sp.move }, style: { width: size + 'px', height: size + 'px' } }, h('div.pet-shadow'), body, zzz, bubble);
  const b = { maxX: innerWidth - size - 4, maxY: innerHeight - size - 4 };
  const p = {
    ...def, size, el, body, bubble, sp,
    x: def.mode === 'corner' ? b.maxX - pets.length * (size + 6) : rand(40, b.maxX),
    y: def.mode === 'corner' ? b.maxY : rand(innerHeight * 0.4, b.maxY),
    tx: 0, ty: 0, dir: 1, speedMul: def.speed || 1,
    state: 'idle', stateUntil: 0, nextThink: performance.now() + rand(500, 3000),
    vy: 0, drag: null,
  };
  p.tx = p.x; p.ty = p.y;
  layer.append(el);

  el.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    e.preventDefault();
    try { el.setPointerCapture(e.pointerId); } catch { /* pointeur déjà relâché */ }
    p.drag = { ox: e.clientX - p.x, oy: e.clientY - p.y, sx: e.clientX, sy: e.clientY, moved: false };
  });
  el.addEventListener('pointermove', (e) => {
    if (!p.drag) return;
    if (Math.hypot(e.clientX - p.drag.sx, e.clientY - p.drag.sy) > 5) {
      if (!p.drag.moved) { setState(p, 'dragged'); say(p, pick(['Wiiiii !', 'Hé ! Pose-moi !', 'Je voleee ✈️', 'Aaaah !'])); }
      p.drag.moved = true;
    }
    if (p.drag.moved) { p.x = e.clientX - p.drag.ox; p.y = e.clientY - p.drag.oy; }
  });
  el.addEventListener('pointerup', (e) => {
    if (!p.drag) return;
    const moved = p.drag.moved;
    p.drag = null;
    try { el.releasePointerCapture(e.pointerId); } catch { /* déjà relâché */ }
    if (moved) {
      p.vy = 0;
      setState(p, sp.move === 'fly' ? 'idle' : 'falling');
      p.tx = p.x; p.ty = p.y;
    } else {
      onPetClick(p);
    }
  });
  el.addEventListener('dblclick', (e) => {
    e.stopPropagation();
    popEmoji(p, sp.food);
    setTimeout(() => { popEmoji(p, '😋'); say(p, 'Miam ! Merci !'); }, 400);
    setState(p, 'happy', 1600);
  });
  return p;
}

function onPetClick(p) {
  if (p.state === 'sleep') {
    say(p, pick(['Hein ? Quoi ?', '*bâille* 🥱', 'J\'dormais pas !']));
    setState(p, 'idle', 800);
    return;
  }
  p.clicks = (p.clicks || 0) + 1;
  clearTimeout(p.clickT);
  p.clickT = setTimeout(() => (p.clicks = 0), 1500);
  if (p.clicks >= 5) {
    say(p, 'Arrête, ça chatouille ! 🤣');
    setState(p, 'spin', 900);
    p.clicks = 0;
  } else {
    say(p, Math.random() < 0.5 ? p.sp.sound : pick(PET_TALK));
    setState(p, 'jump', 600);
    popEmoji(p, pick(['❤️', '💖', '💕', '✨']), 2);
  }
}

function think(p, now) {
  const b = bounds(p);
  const idleFor = now - lastInput;

  if (p.mode === 'corner') {
    p.tx = b.maxX - pets.indexOf(p) * (p.size + 6);
    p.ty = b.maxY;
    if (Math.hypot(p.tx - p.x, p.ty - p.y) < 4 && p.state !== 'sleep' && !p.stateUntil) setState(p, 'sleep');
    return;
  }

  if (idleFor > 60000 && p.state !== 'sleep' && p.sp.move !== 'fly') {
    setState(p, 'sleep');
    return;
  }
  if (p.state === 'sleep') return;

  if (p.mode === 'follow') {
    const dx = mouse.x - (p.x + p.size / 2), dy = mouse.y - (p.y + p.size / 2);
    if (Math.hypot(dx, dy) > p.size * 1.2) {
      p.tx = clamp(mouse.x - p.size / 2 - Math.sign(dx) * p.size * 0.8, b.minX, b.maxX);
      p.ty = clamp(mouse.y - p.size / 2, b.minY, b.maxY);
    }
    return;
  }

  if (p.mode === 'clickfollow') {
    // Entre deux clics, il traîne un peu autour de sa position
    if (Math.random() < 0.25) { p.tx = clamp(p.x + rand(-120, 120), b.minX, b.maxX); p.ty = clamp(p.y + rand(-60, 60), b.minY, b.maxY); }
    else if (Math.random() < 0.3) setState(p, 'sit', rand(2000, 5000));
    return;
  }

  // wander
  const r = Math.random();
  if (r < 0.55) newTarget(p);
  else if (r < 0.8) setState(p, 'sit', rand(1500, 4000));
  else if (r < 0.9) { setState(p, 'groom', 1800); }
  else if (r < 0.95 && pets.length > 1) {
    const other = pick(pets.filter((o) => o !== p));
    p.tx = clamp(other.x + (other.x > p.x ? -p.size : p.size), b.minX, b.maxX);
    p.ty = other.y;
    p.goingTo = other;
  } else say(p, pick(PET_TALK));
}

function step(p, now, dt) {
  if (p.drag?.moved) { place(p); return; }
  const b = bounds(p);

  if (p.state === 'falling') {
    p.vy += 0.8 * dt;
    p.y += p.vy * dt;
    if (p.y >= b.maxY) { p.y = b.maxY; p.vy = 0; setState(p, 'land', 400); p.ty = p.y; }
    place(p);
    return;
  }

  if (p.stateUntil && now > p.stateUntil) { p.stateUntil = 0; setState(p, 'idle'); }

  if (now > p.nextThink && !p.stateUntil) {
    think(p, now);
    p.nextThink = now + rand(1500, 5000) / (p.mode === 'follow' ? 6 : 1);
  }

  const busy = ['sit', 'groom', 'sleep', 'happy', 'jump', 'spin', 'land', 'dance'].includes(p.state);
  const dx = p.tx - p.x, dy = p.ty - p.y;
  const dist = Math.hypot(dx, dy);
  const base = { walk: 1.6, hop: 1.9, fly: 1.7, slow: 0.45, waddle: 1.1 }[p.sp.move] || 1.5;
  const sp = base * p.speedMul * (p.mode === 'follow' && dist > 200 ? 2.2 : p.mode === 'clickfollow' && p.rushing ? 2.4 : 1) * dt;

  if (!busy && dist > 2) {
    p.x += (dx / dist) * Math.min(sp, dist);
    p.y += (dy / dist) * Math.min(sp, dist);
    if (Math.abs(dx) > 1) p.dir = dx > 0 ? 1 : -1;
    if (p.state !== 'walk') setState(p, 'walk');
  } else if (!busy && p.state === 'walk') {
    setState(p, 'idle');
    p.rushing = false;
    if (p.goingTo) {
      say(p, pick(['💕', 'Salut toi !', '👋', 'On joue ?']), 1500);
      if (p.goingTo.state !== 'sleep') say(p.goingTo, pick(['💕', 'Coucou !', '😊']), 1500);
      p.goingTo = null;
    }
  }

  // Effarouché si la souris passe très vite tout près
  if (cfg.reactions && mouse.speed > 3.5 && p.state !== 'sleep' && !p.stateUntil) {
    const md = Math.hypot(mouse.x - (p.x + p.size / 2), mouse.y - (p.y + p.size / 2));
    if (md < p.size * 1.3) {
      setState(p, 'jump', 500);
      popEmoji(p, '❗');
      if (p.mode === 'wander') { p.tx = clamp(p.x - (mouse.x - p.x) * 3, b.minX, b.maxX); p.ty = clamp(p.y - (mouse.y - p.y) * 2, b.minY, b.maxY); }
    }
  }

  p.x = clamp(p.x, b.minX, b.maxX);
  p.y = clamp(p.y, b.minY - 40, b.maxY);
  place(p);
}

function place(p) {
  const flip = (p.sp.faces === 'left' ? -p.dir : p.dir) * (p.flip ? -1 : 1);
  p.el.style.transform = `translate(${p.x}px, ${p.y}px)`;
  p.body.style.setProperty('--flip', flip);
  p.el.style.zIndex = 9000 + Math.round(p.y);
}

let lastT = performance.now();
function loop(now) {
  const dt = Math.min(3, (now - lastT) / 16.67);
  lastT = now;
  for (const p of pets) step(p, now, dt);
  raf = requestAnimationFrame(loop);
}

export function applyPets(c) {
  cfg = c;
  layer ||= document.getElementById('pets-layer');
  layer.classList.toggle('click-through', !!c.clickThrough);
  const key = JSON.stringify(c.enabled ? c.list : []);
  if (key === layer.dataset.key) return;
  layer.dataset.key = key;

  const keep = new Map(pets.map((p) => [p.id, p]));
  const next = [];
  if (c.enabled) {
    for (const def of c.list) {
      const old = keep.get(def.id);
      if (old && old.species === def.species && old.size === def.size) {
        Object.assign(old, { name: def.name, mode: def.mode, speedMul: def.speed || 1, flip: def.flip });
        keep.delete(def.id);
        next.push(old);
      } else {
        const np = makePet(def);
        if (old) { np.x = old.x; np.y = old.y; np.tx = old.x; np.ty = old.y; }
        next.push(np);
      }
    }
  }
  for (const p of keep.values()) p.el.remove();
  for (const p of pets) if (!next.includes(p)) p.el.remove();
  pets = next;
  cancelAnimationFrame(raf);
  if (pets.length) raf = requestAnimationFrame(loop);
}

// ---------- Événements globaux ----------
export function initPets() {
  addEventListener('pointermove', (e) => {
    const now = performance.now();
    const d = Math.hypot(e.clientX - mouse.x, e.clientY - mouse.y);
    mouse.speed = d / Math.max(1, now - mouse.t);
    mouse.x = e.clientX; mouse.y = e.clientY; mouse.t = now;
    wake();
  });
  addEventListener('keydown', wake);
  addEventListener('pointerdown', (e) => {
    wake();
    for (const p of pets) {
      if (p.mode !== 'clickfollow' || p.state === 'sleep') continue;
      const b = bounds(p);
      p.tx = clamp(e.clientX - p.size / 2, b.minX, b.maxX);
      p.ty = clamp(e.clientY - p.size / 2, b.minY, b.maxY);
      p.rushing = true;
      p.stateUntil = 0;
      if (p.state === 'sit' || p.state === 'groom') setState(p, 'idle');
    }
  }, true);
  addEventListener('resize', () => {
    for (const p of pets) {
      const b = bounds(p);
      p.x = clamp(p.x, b.minX, b.maxX); p.y = clamp(p.y, b.minY, b.maxY);
      p.tx = clamp(p.tx, b.minX, b.maxX); p.ty = clamp(p.ty, b.minY, b.maxY);
    }
  });
  // Petit message de nuit
  setInterval(() => {
    const hr = new Date().getHours();
    if ((hr >= 23 || hr < 5) && pets.length && Math.random() < 0.15) say(pick(pets), 'Il est tard… au lit ! 🌙', 3500);
  }, 120000);
}

function wake() {
  const was = performance.now() - lastInput > 60000;
  lastInput = performance.now();
  if (!was) return;
  for (const p of pets) {
    if (p.state === 'sleep' && p.mode !== 'corner') {
      setState(p, 'idle', 700);
      say(p, pick(['*bâille* 🥱', 'Te revoilà !', 'On s\'y remet ?']));
    }
  }
}

/** Mission validée : les compagnons accourent et font la fête. */
export function petsCelebrate(x, y, allDone = false) {
  if (!cfg?.reactions) return;
  pets.forEach((p, i) => {
    if (p.mode === 'corner') {
      setState(p, 'happy', 1500);
      popEmoji(p, '🎉');
      say(p, pick(PET_BRAVO));
      return;
    }
    const b = bounds(p);
    if (x != null) {
      p.tx = clamp(x + (i % 2 ? 1 : -1) * (40 + i * 20) - p.size / 2, b.minX, b.maxX);
      p.ty = clamp(y + 20, b.minY, b.maxY);
      p.rushing = true;
    }
    p.stateUntil = 0;
    setState(p, 'idle');
    setTimeout(() => {
      setState(p, allDone ? 'dance' : 'happy', allDone ? 4000 : 1600);
      popEmoji(p, pick(['🎉', '🥳', '⭐', '💖']), allDone ? 4 : 2);
      say(p, allDone ? 'Journée terminée !! 🏆🎉' : pick(PET_BRAVO), 2600);
    }, 700 + i * 150);
  });
}

export function newPetDef(species = 'cat') {
  return { id: uid(), species, name: SPECIES[species].label, mode: 'wander', size: 40, speed: 1, flip: false };
}
