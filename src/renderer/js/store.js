// État de l'application + sauvegarde locale (fichier JSON dans le dossier utilisateur).
import { uid, addDays, todayISO, debounce, schoolYearOf } from './util.js';
import { JOKES } from './jokes.js';

export const SUBJECT_COLORS = ['#4aa8f0', '#f0644a', '#4cd07d', '#a46cf0', '#ffb43a', '#f05aa0', '#2ec4c4', '#7a8cff', '#ff8a3d', '#8bc34a', '#e0457b', '#5c6bc0'];

// Grille des J (identique à hiphiphip.app) et J cochés par défaut
export const J_CHOICES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 20, 21, 22, 28, 29, 30, 31, 32, 34, 35, 44, 45, 46, 47, 60, 75, 90, 105, 120];
export const DEFAULT_J_DAYS = [1, 3, 6, 9, 13, 16, 21, 30, 35, 44, 47, 60, 75, 90, 105, 120];
const OLD_DEFAULT_J_DAYS = '1,3,7,14,30,60';

// Anciennes phrases par défaut (pour la migration vers les blagues du jour)
const OLD_DEFAULT_MESSAGES = [
  'Tu es le meilleur !',
  'Une mission à la fois 💪',
  'Chaque J compte !',
  'Tu gères grave 🔥',
  'Ton futur toi te remercie',
  'Petit pas, grand progrès',
  'Allez, on lâche rien !',
  'Le cerveau, ça se muscle 🧠',
  'Fier(e) de toi !',
  'Hip Hip Hip... Hourra ! 🎉',
];

export const DEFAULT_MESSAGES = JOKES;

export function defaultSettings() {
  return {
    themePreset: 'hiphiphip',
    theme: {
      primary: '#4aa8f0',
      accent: '#ffd25a',
      bg: '#ffffff',
      surface: '#ffffff',
      text: '#2c2c2e',
      muted: '#9aa0a6',
      header: '#ffffff',
      banner: '#4aa8f0',
      bannerText: '#ffffff',
      drawer: '#fafafa',
      border: '#e4e6ea',
      success: '#3cc47c',
      danger: '#f0563c',
      today: '#4aa8f0',
    },
    font: 'Inter',
    fontSize: 14,
    radius: 8,
    cardStyle: 'soft',
    surfaceOpacity: 0.88,
    glassBlur: 8,
    background: {
      type: 'none',
      preset: 'ocean',
      image: null,
      color: '#eef6ff',
      gradient: { from: '#a1c4fd', to: '#c2e9fb', angle: 135 },
      fit: 'cover',
      blur: 0,
      dim: 0,
      particles: true,
    },
    cursor: { id: 'default', size: 32, trail: 'none' },
    pets: {
      enabled: true,
      reactions: true,
      bubbles: true,
      list: [{ id: uid(), species: 'cat', name: 'Neko', mode: 'clickfollow', size: 40, speed: 1 }],
    },
    fireworks: {
      enabled: true,
      style: 'both',
      intensity: 'normal',
      palette: 'rainbow',
      customColors: ['#ff4d6d', '#ffd25a', '#4aa8f0', '#3cc47c'],
      emojis: '🐷🐖🐽',
      sound: false,
      volume: 0.5,
    },
    banner: { messages: [...DEFAULT_MESSAGES], rotate: false, interval: 25 },
    planning: { showWeekend: true, showDone: true, hideEmptyHint: false, checkEmoji: '' },
    defaults: { jDays: [...DEFAULT_J_DAYS] },
  };
}

function defaultState() {
  return {
    version: 1,
    formations: [],
    slots: [],
    stats: { totalDone: 0, byDate: {} },
    settings: defaultSettings(),
    ui: { drawerOpen: true, schoolYear: schoolYearOf(todayISO()), weekOf: null },
  };
}

/** Fusion profonde : les valeurs sauvegardées écrasent les valeurs par défaut. */
function merge(base, saved) {
  if (Array.isArray(base) || typeof base !== 'object' || base === null) return saved === undefined ? base : saved;
  const out = { ...base };
  for (const k of Object.keys(saved || {})) {
    out[k] = k in base ? merge(base[k], saved[k]) : saved[k];
  }
  return out;
}

const listeners = new Set();

export const store = {
  state: defaultState(),

  async load() {
    const saved = await window.hhh.loadData();
    if (saved) this.state = merge(defaultState(), saved);
    // Migration : plus de son par défaut
    if (!this.state.migrations?.silent) {
      this.state.settings.fireworks.sound = false;
      this.state.migrations = { ...this.state.migrations, silent: true };
    }
    // Migration : nouvelle grille des J (on remplace les anciens J par défaut)
    if (!this.state.migrations?.jGrid) {
      const isOld = (d) => d.join(',') === OLD_DEFAULT_J_DAYS;
      const st = this.state;
      if (isOld(st.settings.defaults.jDays)) st.settings.defaults.jDays = [...DEFAULT_J_DAYS];
      for (const f of st.formations) for (const s of f.subjects) {
        if (isOld(s.jDays)) s.jDays = [...DEFAULT_J_DAYS];
        for (const c of s.courses) for (const p of c.parts) {
          if (isOld(p.days)) { p.days = [...DEFAULT_J_DAYS]; syncPartSlots(st, p.id); }
        }
      }
      st.migrations = { ...st.migrations, jGrid: true };
    }
    // Migration : les phrases par défaut deviennent les blagues du jour
    if (!this.state.migrations?.jokes) {
      const b = this.state.settings.banner;
      if (b.messages.join('\n') === OLD_DEFAULT_MESSAGES.join('\n')) { b.messages = [...JOKES]; b.rotate = false; }
      this.state.migrations = { ...this.state.migrations, jokes: true };
    }
    // Migration : « Mes cours » tout déroulé, sauf les calendriers des J
    if (!this.state.migrations?.calFold) {
      for (const f of this.state.formations) {
        f.collapsed = false;
        for (const s of f.subjects) { s.collapsed = false; for (const c of s.courses) { c.collapsed = false; for (const p of c.parts) p.calOpen = false; } }
      }
      this.state.migrations = { ...this.state.migrations, calFold: true };
    }
    this.state.ui.weekOf = null; // on ouvre toujours sur la semaine en cours
  },

  saveNow() {
    return window.hhh.saveData(this.state);
  },

  on(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  /** Applique une modification puis notifie l'interface et sauvegarde. */
  update(fn, what = 'all') {
    fn(this.state);
    for (const l of listeners) l(what);
    saveLater();
  },

  replaceAll(newState) {
    this.state = merge(defaultState(), newState);
    for (const l of listeners) l('all');
    saveLater();
  },

  resetSettings() {
    this.update((s) => { s.settings = defaultSettings(); }, 'settings');
  },

  // ---------- Recherche ----------
  findPart(partId) {
    for (const f of this.state.formations)
      for (const s of f.subjects)
        for (const c of s.courses)
          for (const p of c.parts) if (p.id === partId) return { formation: f, subject: s, course: c, part: p };
    return null;
  },

  findSubject(subjectId) {
    for (const f of this.state.formations)
      for (const s of f.subjects) if (s.id === subjectId) return { formation: f, subject: s };
    return null;
  },
};

const saveLater = debounce(() => store.saveNow(), 300);
window.addEventListener('beforeunload', () => store.saveNow());

// ---------- Fabriques ----------
export function newFormation(name, type, year) {
  return { id: uid(), name, type, year, collapsed: false, subjects: [] };
}

export function newSubject(name, index = 0) {
  return {
    id: uid(),
    name,
    color: SUBJECT_COLORS[index % SUBJECT_COLORS.length],
    emoji: '',
    method: 'J',
    jDays: [...store.state.settings.defaults.jDays],
    collapsed: false,
    courses: [],
  };
}

export function newCourse(name) {
  return { id: uid(), name, collapsed: false, parts: [] };
}

export function newPart(name, subject) {
  return { id: uid(), name, j0: null, days: [...(subject?.jDays || [])], note: '', calOpen: false };
}

// ---------- Méthode des J ----------

/** Recalcule les sessions J d'une partie de cours (J0 + chaque J coché). */
export function syncPartSlots(state, partId) {
  const found = store.findPart(partId);
  if (!found) return;
  const { part, subject } = found;
  const existing = state.slots.filter((x) => x.kind === 'J' && x.partId === partId);

  if (!part.j0 || subject.method !== 'J') {
    // Plus de J0 : on supprime les sessions à venir non validées, on garde l'historique
    state.slots = state.slots.filter((x) => !(x.kind === 'J' && x.partId === partId && !x.done));
    return;
  }

  const wanted = [0, ...part.days];
  // Supprime les J décochés (sauf s'ils sont déjà validés)
  state.slots = state.slots.filter((x) => !(x.kind === 'J' && x.partId === partId && !wanted.includes(x.jNum) && !x.done));
  for (const n of wanted) {
    const date = addDays(part.j0, n);
    const slot = existing.find((x) => x.jNum === n);
    if (slot) {
      if (!slot.done && !slot.moved) slot.date = date;
    } else {
      state.slots.push({ id: uid(), kind: 'J', partId, jNum: n, date, done: false, sentiment: null, note: '', order: Date.now() });
    }
  }
}

export function removePartSlots(state, partIds) {
  const set = new Set(partIds);
  state.slots = state.slots.filter((x) => !(x.partId && set.has(x.partId)));
}

/** Tour de révision : répartit les parties choisies uniformément entre deux dates. */
export function planReviewRound(state, partIds, fromIso, toIso) {
  const used = state.slots.filter((x) => x.kind === 'round' && partIds.includes(x.partId));
  const round = used.reduce((m, x) => Math.max(m, x.round), 0) + 1;
  const days = Math.max(1, Math.round((new Date(toIso) - new Date(fromIso)) / 86400000) + 1);
  const n = partIds.length;
  partIds.forEach((pid, i) => {
    const date = addDays(fromIso, Math.floor((i * days) / n));
    state.slots.push({ id: uid(), kind: 'round', round, partId: pid, date, done: false, sentiment: null, note: '', order: Date.now() + i, moved: true });
  });
  return round;
}

export function partIdsOfSubject(subject) {
  return subject.courses.flatMap((c) => c.parts.map((p) => p.id));
}

export function partIdsOfFormation(f) {
  return f.subjects.flatMap(partIdsOfSubject);
}

/** Libellé + couleur d'une session (mission). */
export function describeSlot(slot) {
  if (slot.kind === 'task') {
    return { title: slot.title || 'Mission', subtitle: slot.subtitle || '', color: slot.color || store.state.settings.theme.primary, badge: null, emoji: slot.emoji || '' };
  }
  const badge = slot.kind === 'round' ? 'T' + slot.round : 'J' + slot.jNum;
  const f = store.findPart(slot.partId);
  if (!f) return { title: 'Partie supprimée', subtitle: '', color: '#999', badge, emoji: '' };
  return {
    title: f.course.name + (f.course.parts.length > 1 ? ' — ' + f.part.name : ''),
    subtitle: f.subject.name,
    color: f.subject.color,
    badge,
    emoji: f.subject.emoji,
  };
}

/**
 * Réglages de célébration pour une mission : ceux de sa matière s'ils existent,
 * sinon ceux par défaut. subject.celebration = { style, emojis, intensity, palette, customColors } | null
 */
export function celebrationFor(slot) {
  const base = store.state.settings.fireworks;
  const subject = slot.partId ? store.findPart(slot.partId)?.subject : null;
  const own = subject?.celebration;
  if (!own) return base;
  return { ...base, ...own, enabled: true };
}

export function setSlotDone(state, slot, done) {
  slot.done = done;
  const day = todayISO();
  state.stats.byDate[day] = (state.stats.byDate[day] || 0) + (done ? 1 : -1);
  if (state.stats.byDate[day] <= 0) delete state.stats.byDate[day];
  state.stats.totalDone = Math.max(0, state.stats.totalDone + (done ? 1 : -1));
  slot.doneAt = done ? Date.now() : null;
}

/** Nombre de jours consécutifs (jusqu'à aujourd'hui ou hier) avec au moins une mission validée. */
export function currentStreak(state) {
  let d = todayISO();
  if (!state.stats.byDate[d]) d = addDays(d, -1);
  let n = 0;
  while (state.stats.byDate[d]) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}
