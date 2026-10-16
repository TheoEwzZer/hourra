// Fenêtre « Personnaliser » : tout est modifiable et appliqué en direct.
import { h, icon, pick, rand } from './util.js';
import { store, defaultSettings, DEFAULT_MESSAGES, J_CHOICES } from './store.js';
import { THEME_PRESETS, COLOR_LABELS, FONTS } from './themes.js';
import { AMBIANCES } from './ambiance.js';
import { CURSOR_GROUPS, TRAILS } from './cursors.js';
import { SPECIES, MODES, newPetDef } from './pets.js';
import { celebrate, EFFECTS, EMOJI_PRESETS } from './fireworks.js';
import { openModal, confirmDialog, toast } from './dialogs.js';
import { LEVELS } from './planning.js';

const S = () => store.state.settings;
const set = (fn) => store.update((st) => fn(st.settings), 'settings');

// ---------- Petits composants ----------
function toggle(label, get, onChange, hint) {
  const cb = h('input', { type: 'checkbox', checked: get(), onchange: (e) => onChange(e.target.checked) });
  return h('label.toggle-row', null, h('span.toggle-texts', null, h('span', null, label), hint && h('span.muted.small', null, hint)), h('span.switch', null, cb, h('span.slider')));
}

function range(label, { min, max, step = 1, value, unit = '', onInput }) {
  const out = h('span.range-val', null, value + unit);
  return h('label.range-row', null,
    h('span.range-label', null, label),
    h('input', { type: 'range', min, max, step, value, oninput: (e) => { out.textContent = e.target.value + unit; onInput(Number(e.target.value)); } }),
    out);
}

function segmented(options, value, onChange) {
  const wrap = h('div.segmented');
  for (const [v, label] of Object.entries(options)) {
    wrap.append(h('button' + (v === value ? '.on' : ''), {
      onclick: (e) => { wrap.querySelectorAll('button').forEach((b) => b.classList.remove('on')); e.currentTarget.classList.add('on'); onChange(v); },
    }, label));
  }
  return wrap;
}

function section(title, ...children) {
  return h('div.set-section', null, h('h3.set-title', null, title), ...children);
}

// ---------- Onglets ----------
const TABS = [
  { id: 'theme', label: 'Thème & couleurs', icon: 'palette', render: tabTheme },
  { id: 'bg', label: 'Fond d\'écran', icon: 'wallpaper', render: tabBackground },
  { id: 'cursor', label: 'Curseur', icon: 'arrow_selector_tool', render: tabCursor },
  { id: 'pets', label: 'Compagnons', icon: 'pets', render: tabPets },
  { id: 'fx', label: 'Célébrations', icon: 'celebration', render: tabFireworks },
  { id: 'banner', label: 'Bandeau', icon: 'campaign', render: tabBanner },
  { id: 'planning', label: 'Planning', icon: 'calendar_month', render: tabPlanning },
  { id: 'data', label: 'Mes données', icon: 'save', render: tabData },
];

let lastTab = 'theme';

export function openSettings(tabId = lastTab) {
  const panel = h('div.set-panel');
  const nav = h('nav.set-nav');
  const show = (id) => {
    lastTab = id;
    nav.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.id === id));
    const tab = TABS.find((t) => t.id === id);
    panel.replaceChildren(tab.render(() => show(id)));
    panel.scrollTop = 0;
  };
  for (const t of TABS) nav.append(h('button', { dataset: { id: t.id }, onclick: () => show(t.id) }, icon(t.icon), h('span', null, t.label)));
  openModal({ title: '✨ Personnaliser Hourra', body: h('div.settings', null, nav, panel), className: 'settings-modal', wide: true });
  show(tabId);
}

function tabTheme(redraw) {
  const s = S();
  const presets = h('div.preset-grid', null, Object.entries(THEME_PRESETS).map(([id, p]) =>
    h('button.preset' + (s.themePreset === id ? '.on' : ''), {
      onclick: () => { set((st) => { st.themePreset = id; st.theme = { ...p.colors }; }); redraw(); },
    },
      h('div.preset-preview', { style: { background: p.colors.bg, borderColor: p.colors.border } },
        h('div', { style: { background: p.colors.banner, height: '8px', borderRadius: '3px' } }),
        h('div.preset-cards', null,
          h('span', { style: { background: p.colors.primary } }), h('span', { style: { background: p.colors.accent } }), h('span', { style: { background: p.colors.success } }))),
      h('span.preset-label', null, p.emoji + ' ' + p.label))));

  const colors = h('div.color-grid', null, Object.entries(COLOR_LABELS).map(([k, label]) =>
    h('label.color-row', null,
      h('input', { type: 'color', value: s.theme[k], oninput: (e) => set((st) => { st.theme[k] = e.target.value; st.themePreset = 'custom'; }) }),
      h('span', null, label))));

  const surprise = () => {
    const hue = rand(0, 360);
    const hsl = (hh, sat, l) => {
      const a = (sat / 100) * Math.min(l / 100, 1 - l / 100);
      const f = (n) => { const k = (n + hh / 30) % 12; const c = l / 100 - a * Math.max(Math.min(k - 3, 9 - k, 1), -1); return Math.round(255 * c).toString(16).padStart(2, '0'); };
      return `#${f(0)}${f(8)}${f(4)}`;
    };
    const dark = Math.random() < 0.3;
    set((st) => {
      st.themePreset = 'custom';
      Object.assign(st.theme, {
        primary: hsl(hue, 80, dark ? 65 : 55), accent: hsl((hue + 150) % 360, 90, 65), banner: hsl(hue, 75, dark ? 40 : 58), bannerText: '#ffffff',
        today: hsl(hue, 80, 55), bg: dark ? hsl(hue, 25, 9) : hsl(hue, 60, 98), surface: dark ? hsl(hue, 22, 14) : '#ffffff',
        header: dark ? hsl(hue, 22, 12) : '#ffffff', drawer: dark ? hsl(hue, 22, 11) : hsl(hue, 40, 97),
        border: dark ? hsl(hue, 20, 22) : hsl(hue, 30, 90), text: dark ? '#eceef5' : hsl(hue, 30, 15), muted: dark ? '#8d93a8' : hsl(hue, 10, 55),
      });
    });
    redraw();
  };

  return h('div', null,
    section('Thèmes prêts à l\'emploi', presets,
      h('button.btn.btn-ghost', { onclick: surprise }, '🎲 Surprends-moi !')),
    section('Toutes les couleurs', h('p.muted.small', null, 'Clique sur une pastille pour choisir n\'importe quelle couleur.'), colors),
    section('Texte',
      h('div.font-grid', null, Object.entries(FONTS).map(([name, css]) =>
        h('button.font-btn' + (s.font === name ? '.on' : ''), { style: { fontFamily: css }, onclick: () => { set((st) => { st.font = name; }); redraw(); } }, name))),
      range('Taille du texte', { min: 11, max: 20, value: s.fontSize, unit: ' px', onInput: (v) => set((st) => { st.fontSize = v; }) })),
    section('Formes',
      range('Arrondi des coins', { min: 0, max: 24, value: s.radius, unit: ' px', onInput: (v) => set((st) => { st.radius = v; }) }),
      h('span.field-label', null, 'Style des missions'),
      segmented({ soft: 'Doux', solid: 'Plein', outline: 'Contour', glass: 'Verre', gradient: 'Dégradé', sticker: 'Post-it' }, s.cardStyle, (v) => set((st) => { st.cardStyle = v; }))),
  );
}

function tabBackground(redraw) {
  const s = S();
  const bg = s.background;
  const setBg = (fn, re = false) => { set((st) => fn(st.background)); if (re) redraw(); };

  const ambiances = h('div.amb-grid', null, Object.entries(AMBIANCES).map(([id, a]) =>
    h('button.amb' + (bg.type === 'preset' && bg.preset === id ? '.on' : ''), {
      onclick: () => setBg((b) => { b.type = 'preset'; b.preset = id; }, true),
    }, h('div.amb-preview', { style: { background: a.css } }, h('span', null, a.emoji)), h('span.amb-label', null, a.label), h('span.amb-cat', null, a.cat))));

  const pickImage = async () => {
    const res = await window.hhh.pickBackground();
    if (!res) return;
    setBg((b) => { b.type = 'image'; b.image = res; }, true);
    toast('Fond d\'écran appliqué : ' + res.name, { icon: 'wallpaper' });
  };

  return h('div', null,
    section('Type de fond',
      segmented({ none: 'Aucun', preset: 'Ambiance', image: 'Mon image', color: 'Couleur', gradient: 'Dégradé' }, bg.type, (v) => setBg((b) => { b.type = v; }, true))),
    bg.type === 'image' && section('Image de mon ordinateur',
      h('div.img-pick', null,
        h('div.img-preview', { style: { backgroundImage: bg.image ? `url("${bg.image.url}")` : 'none' } }, !bg.image && h('span.muted', null, 'Aucune image')),
        h('div', null,
          h('button.btn.btn-primary', { onclick: pickImage }, icon('upload'), 'Choisir une image sur mon PC'),
          bg.image && h('p.muted.small', null, bg.image.name))),
      h('span.field-label', null, 'Ajustement'),
      segmented({ cover: 'Remplir', contain: 'Adapter', stretch: 'Étirer', center: 'Centrer', repeat: 'Mosaïque' }, bg.fit, (v) => setBg((b) => { b.fit = v; }))),
    bg.type === 'preset' && section('Ambiances', ambiances,
      toggle('Particules animées', () => bg.particles, (v) => setBg((b) => { b.particles = v; }), 'Feuilles, bulles, étoiles… qui bougent en fond')),
    bg.type === 'color' && section('Couleur unie',
      h('label.color-row', null, h('input', { type: 'color', value: bg.color, oninput: (e) => setBg((b) => { b.color = e.target.value; }) }), h('span', null, 'Couleur du fond'))),
    bg.type === 'gradient' && section('Dégradé',
      h('div.color-grid', null,
        h('label.color-row', null, h('input', { type: 'color', value: bg.gradient.from, oninput: (e) => setBg((b) => { b.gradient.from = e.target.value; }) }), h('span', null, 'Couleur 1')),
        h('label.color-row', null, h('input', { type: 'color', value: bg.gradient.to, oninput: (e) => setBg((b) => { b.gradient.to = e.target.value; }) }), h('span', null, 'Couleur 2'))),
      range('Angle', { min: 0, max: 360, value: bg.gradient.angle, unit: '°', onInput: (v) => setBg((b) => { b.gradient.angle = v; }) })),
    bg.type !== 'none' && section('Réglages',
      range('Flou du fond', { min: 0, max: 30, value: bg.blur, unit: ' px', onInput: (v) => setBg((b) => { b.blur = v; }) }),
      range('Assombrir (+) / éclaircir (−)', { min: -80, max: 80, value: bg.dim, unit: ' %', onInput: (v) => setBg((b) => { b.dim = v; }) }),
      range('Opacité des cartes et menus', { min: 0.2, max: 1, step: 0.02, value: s.surfaceOpacity, onInput: (v) => set((st) => { st.surfaceOpacity = v; }) }),
      range('Effet verre dépoli', { min: 0, max: 30, value: s.glassBlur, unit: ' px', onInput: (v) => set((st) => { st.glassBlur = v; }) })),
  );
}

function tabCursor(redraw) {
  const c = S().cursor;
  return h('div', null,
    CURSOR_GROUPS.map((g) => section(g.name,
      h('div.cursor-grid', null, g.items.map((it) =>
        h('button.cursor-tile' + (c.id === it.id ? '.on' : ''), { title: it.label, onclick: () => { set((st) => { st.cursor.id = it.id; }); redraw(); } },
          h('span.cursor-emoji', null, it.preview), h('span.cursor-label', null, it.label)))))),
    section('Taille',
      range('Taille du curseur', { min: 16, max: 96, step: 2, value: c.size, unit: ' px', onInput: (v) => set((st) => { st.cursor.size = v; }) })),
    section('Traînée derrière la souris',
      h('div.cursor-grid', null, Object.entries(TRAILS).map(([id, t]) =>
        h('button.cursor-tile' + (c.trail === id ? '.on' : ''), { onclick: () => { set((st) => { st.cursor.trail = id; }); redraw(); } },
          h('span.cursor-emoji', null, t.emoji), h('span.cursor-label', null, t.label)))))
  );
}

function tabPets(redraw) {
  const p = S().pets;
  const setP = (fn, re = false) => { set((st) => fn(st.pets)); if (re) redraw(); };

  const speciesSelect = (pet) => h('select.field.species-sel', { onchange: (e) => setP((pp) => {
    const x = pp.list.find((q) => q.id === pet.id);
    if (x.name === SPECIES[x.species].label) x.name = SPECIES[e.target.value].label;
    x.species = e.target.value;
  }, true) }, Object.entries(SPECIES).map(([id, sp]) => h('option', { value: id, selected: id === pet.species }, sp.emoji + ' ' + sp.label)));

  const rows = p.list.map((pet) => {
    const upd = (fn, re) => setP((pp) => fn(pp.list.find((q) => q.id === pet.id)), re);
    return h('div.pet-row', null,
      h('div.pet-row-head', null,
        h('span.pet-row-emoji', null, SPECIES[pet.species]?.emoji),
        h('input.field.pet-name', { value: pet.name, placeholder: 'Son petit nom', oninput: (e) => upd((x) => { x.name = e.target.value; }) }),
        speciesSelect(pet),
        h('button.icon-btn.danger-hover', { title: 'Le renvoyer à la niche', onclick: () => setP((pp) => { pp.list = pp.list.filter((q) => q.id !== pet.id); }, true) }, icon('delete'))),
      h('span.field-label', null, 'Comportement'),
      segmented(MODES, pet.mode, (v) => upd((x) => { x.mode = v; })),
      range('Taille', { min: 20, max: 110, step: 2, value: pet.size, unit: ' px', onInput: (v) => upd((x) => { x.size = v; }) }),
      range('Vitesse', { min: 0.3, max: 3, step: 0.1, value: pet.speed, unit: '×', onInput: (v) => upd((x) => { x.speed = v; }) }),
      toggle('Regarder dans l\'autre sens', () => !!pet.flip, (v) => upd((x) => { x.flip = v; }), 'Si ton compagnon a l\'air de marcher à reculons 🙃'));
  });

  return h('div', null,
    section('Mes compagnons',
      toggle('Activer les compagnons', () => p.enabled, (v) => setP((pp) => { pp.enabled = v; })),
      toggle('Ils réagissent', () => p.reactions, (v) => setP((pp) => { pp.reactions = v; }), 'Font la fête quand tu valides une mission, sursautent si ta souris passe trop vite…'),
      toggle('Bulles de dialogue', () => p.bubbles, (v) => setP((pp) => { pp.bubbles = v; })),
      toggle('Laisser passer les clics', () => !!p.clickThrough, (v) => setP((pp) => { pp.clickThrough = v; }), 'Tu cliques « à travers » eux (tu ne peux plus les caresser)'),
      h('p.muted.small', null, '💡 Clique sur un compagnon pour le caresser, double-clique pour lui donner à manger, attrape-le pour le déplacer !')),
    section('Adopter un compagnon',
      h('div.cursor-grid', null, Object.entries(SPECIES).map(([id, sp]) =>
        h('button.cursor-tile', { title: 'Adopter : ' + sp.label, onclick: () => {
          if (p.list.length >= 12) { toast('Maximum 12 compagnons, ça fait déjà une belle ménagerie 😅', { icon: 'pets' }); return; }
          setP((pp) => { pp.enabled = true; pp.list.push(newPetDef(id)); }, true);
          toast(sp.emoji + ' ' + sp.label + ' a rejoint ton écran !', { icon: 'pets' });
        } }, h('span.cursor-emoji', null, sp.emoji), h('span.cursor-label', null, sp.label))))),
    p.list.length ? section('Réglages de chaque compagnon', rows) : null,
  );
}

/**
 * Éditeur de célébration réutilisable (réglage par défaut ou d'une matière).
 * get() renvoie la config actuelle (null = « comme par défaut »), commit(cfg|null) l'enregistre.
 */
export function celebrationEditor({ get, commit, allowDefault = false }) {
  const root = h('div.celeb-editor');
  const draw = () => {
    const own = get();
    const cfg = own || S().fireworks;
    const update = (patch) => { commit({ ...pickCeleb(cfg), ...patch }); draw(); };
    const fx = EFFECTS[cfg.style] || EFFECTS.fireworks;
    const showColors = ['fireworks', 'confetti', 'both', 'balloons', 'party'].includes(cfg.style);

    const tiles = h('div.cursor-grid', null,
      allowDefault && h('button.cursor-tile' + (!own ? '.on' : ''), { onclick: () => { commit(null); draw(); } },
        h('span.cursor-emoji', null, '⚙️'), h('span.cursor-label', null, 'Comme par défaut')),
      Object.entries(EFFECTS).map(([id, e]) => h('button.cursor-tile' + ((own || !allowDefault) && cfg.style === id ? '.on' : ''), {
        onclick: () => update({ style: id }),
      }, h('span.cursor-emoji', null, e.emoji), h('span.cursor-label', null, e.label))));

    const emojiInput = h('input.field.emoji-input', {
      value: cfg.emojis || '', placeholder: 'Tape ou colle tes emojis : 🐷🐖',
      onchange: (e) => update({ emojis: e.target.value }),
    });

    root.replaceChildren(...[
      tiles,
      allowDefault && !own && h('p.muted.small', null, `Par défaut : ${EFFECTS[S().fireworks.style]?.emoji || ''} ${EFFECTS[S().fireworks.style]?.label || ''}${EFFECTS[S().fireworks.style]?.usesEmojis ? ' ' + (S().fireworks.emojis || '') : ''}`),
      (own || !allowDefault) && cfg.style !== 'none' && h('div.celeb-options', null,
        fx.usesEmojis && h('div.field-wrap', null,
          h('span.field-label', null, 'Ce qui tombe / explose'),
          h('div.chips', null, EMOJI_PRESETS.map(([label, em]) =>
            h('button.chip' + (cfg.emojis === em ? '.on' : ''), { onclick: () => update({ emojis: em }) }, em + ' ' + label))),
          h('div.emoji-custom', null, h('span.muted.small', null, 'Ou tes propres emojis (Win + . pour ouvrir le clavier emoji) :'), emojiInput)),
        h('span.field-label', null, 'Intensité'),
        segmented({ light: 'Discret', normal: 'Normal', insane: 'DÉLIRE 🤯' }, cfg.intensity, (v) => update({ intensity: v })),
        showColors && h('span.field-label', null, 'Couleurs'),
        showColors && segmented({ rainbow: '🌈 Arc-en-ciel', theme: '🎨 Mon thème', gold: '✨ Or', custom: '🖌️ Perso' }, cfg.palette, (v) => update({ palette: v })),
        showColors && cfg.palette === 'custom' && h('div.color-grid', null, cfg.customColors.map((c, i) =>
          h('label.color-row', null, h('input', { type: 'color', value: c, onchange: (e) => { const cc = [...cfg.customColors]; cc[i] = e.target.value; update({ customColors: cc }); } }), h('span', null, 'Couleur ' + (i + 1)))))),
      h('button.btn.btn-primary.celeb-test', { onclick: (e) => {
        const r = e.currentTarget.getBoundingClientRect();
        celebrate({ ...S().fireworks, ...(get() || {}), enabled: true }, S().theme, r.left + r.width / 2, r.top);
      } }, '▶ Tester'),
    ].filter(Boolean));
  };
  draw();
  return root;
}

function pickCeleb(c) {
  return { style: c.style, emojis: c.emojis, intensity: c.intensity, palette: c.palette, customColors: [...(c.customColors || [])] };
}

function tabFireworks(redraw) {
  const f = S().fireworks;
  const subjects = store.state.formations.flatMap((fo) => fo.subjects.map((s) => ({ fo, s })));
  return h('div', null,
    section('Célébration par défaut',
      h('p.muted.small', null, 'Ce qui se passe quand tu valides une mission (sauf pour les matières qui ont leur propre célébration).'),
      toggle('Activer les célébrations', () => f.enabled, (v) => set((st) => { st.fireworks.enabled = v; })),
      celebrationEditor({
        get: () => S().fireworks,
        commit: (cfg) => set((st) => { Object.assign(st.fireworks, cfg); }),
      })),
    section('Une célébration différente pour chaque matière',
      subjects.length
        ? h('div.celeb-subjects', null, subjects.map(({ fo, s }) => {
          const c = s.celebration;
          const eff = c ? EFFECTS[c.style] : null;
          return h('div.celeb-subject', { style: { '--c': s.color } },
            h('span.color-dot', { style: { background: s.color } }, s.emoji || ''),
            h('div.celeb-subject-name', null, h('b', null, s.name), h('span.muted.small', null, fo.name)),
            h('span.celeb-subject-fx', null, eff ? `${eff.emoji} ${eff.label}${eff.usesEmojis ? ' ' + (c.emojis || '') : ''}` : '⚙️ Par défaut'),
            h('button.btn.btn-flat.small', { onclick: () => subjectCelebrationDialog(s, redraw) }, icon('tune'), 'Choisir'));
        }))
        : h('p.muted.small', null, 'Ajoute d\'abord des matières dans « Mes cours » : tu pourras ensuite leur donner chacune leur propre célébration (feux d\'artifice pour les maths, pluie de cochons pour la philo…).')),
    section('Son',
      toggle('Petit son quand je valide', () => f.sound, (v) => set((st) => { st.fireworks.sound = v; }), 'Désactivé par défaut'),
      f.sound && range('Volume', { min: 0, max: 1, step: 0.05, value: f.volume, onInput: (v) => set((st) => { st.fireworks.volume = v; }) }))
  );
}

/** Fenêtre de choix de la célébration d'une matière (aussi utilisée depuis « Mes cours »). */
export function subjectCelebrationDialog(subject, onDone) {
  openModal({
    title: '🎉 Célébration — ' + subject.name,
    wide: true,
    body: h('div', null,
      h('p.muted.small', null, 'Ce qui se passe quand tu valides une mission de cette matière.'),
      celebrationEditor({
        allowDefault: true,
        get: () => subject.celebration || null,
        commit: (cfg) => store.update(() => { subject.celebration = cfg; }, 'silent'),
      })),
    actions: [{ label: 'Terminé', primary: true, onClick: () => { store.update(() => {}, 'drawer'); onDone?.(); } }],
  });
}

function tabBanner(redraw) {
  const b = S().banner;
  const ta = h('textarea.note-area.small-area', { value: b.messages.join('\n'), oninput: (e) => set((st) => { st.banner.messages = e.target.value.split('\n'); }) });
  return h('div', null,
    section('Mode',
      segmented({ daily: '😂 Blague du jour', rotate: '🔁 Défilement' }, b.rotate ? 'rotate' : 'daily',
        (v) => { set((st) => { st.banner.rotate = v === 'rotate'; }); redraw(); }),
      h('p.muted.small', null, b.rotate
        ? 'Les phrases changent toutes seules, au hasard.'
        : 'Une nouvelle blague chaque jour. Clique sur le bandeau si tu en veux une autre tout de suite !'),
      b.rotate && range('Toutes les', { min: 5, max: 300, step: 5, value: b.interval, unit: ' s', onInput: (v) => set((st) => { st.banner.interval = v; }) })),
    section(`Blagues et phrases (${b.messages.filter((m) => m.trim()).length})`,
      h('p.muted.small', null, 'Une par ligne : ajoute les tiennes, supprime celles qui ne te font pas rire.'),
      ta,
      h('button.btn.btn-flat', { onclick: () => { ta.value = DEFAULT_MESSAGES.join('\n'); set((st) => { st.banner.messages = [...DEFAULT_MESSAGES]; }); redraw(); } }, 'Remettre les 250 blagues'))
  );
}

const CHECK_EMOJIS = ['', '💩', '⭐', '❤️', '🔥', '🐷', '🧠', '👍', '🎉', '🐱', '🦄', '🍀', '💎', '🚀'];

function tabPlanning(redraw) {
  const s = S();
  const box = h('div.day-buttons', null, J_CHOICES.map((n) =>
    h('button.day-btn' + (s.defaults.jDays.includes(n) ? '.on' : ''), { onclick: () => {
      set((st) => { const d = st.defaults.jDays; st.defaults.jDays = d.includes(n) ? d.filter((x) => x !== n) : [...d, n].sort((a, b) => a - b); });
      redraw();
    } }, String(n))));
  return h('div', null,
    section('Affichage',
      toggle('Afficher le week-end', () => s.planning.showWeekend, (v) => set((st) => { st.planning.showWeekend = v; })),
      toggle('Afficher les missions validées', () => s.planning.showDone, (v) => set((st) => { st.planning.showDone = v; }))),
    section('Bouton de validation',
      h('p.muted.small', null, 'Choisis l\'icône en haut à droite des missions. Une fois validée, elle prend la couleur de ton niveau (rouge → vert foncé).'),
      h('div.emoji-row.check-choices', null, CHECK_EMOJIS.map((e) => h('button.emoji-pick' + (s.planning.checkEmoji === e ? '.on' : ''), {
        title: e ? e : 'Coche classique',
        onclick: () => { set((st) => { st.planning.checkEmoji = e; }); redraw(); },
      }, e || icon('check_circle')))),
      h('label.check-custom-row', null, h('span', null, 'Ou ton propre emoji :'),
        h('input.field.check-custom', { maxLength: 8, placeholder: 'ex : 🦄', value: CHECK_EMOJIS.includes(s.planning.checkEmoji) ? '' : s.planning.checkEmoji,
          onchange: (e) => { const v = [...new Intl.Segmenter().segment(e.target.value.trim())][0]?.segment || ''; set((st) => { st.planning.checkEmoji = v; }); redraw(); } })),
      h('div.check-preview', null, LEVELS.map((l) => h('span.check.on' + (s.planning.checkEmoji ? '.emoji' : ''), { title: l.label, style: { '--lvl': l.color } },
        s.planning.checkEmoji ? h('span.check-emoji', null, s.planning.checkEmoji) : icon('check_circle'))))),
    section('Méthode des J',
      h('p.muted.small', null, 'Le J0, c\'est le jour où tu découvres le cours. Ensuite tu le revois à J1, J3, J6, J9, J13… pour l\'ancrer dans ta mémoire à long terme. Les cases violettes sont cochées par défaut pour toute nouvelle matière.'),
      box)
  );
}

function tabData() {
  const s = store.state;
  return h('div', null,
    section('Sauvegarde',
      h('p.muted.small', null, 'Tout est enregistré automatiquement sur ton PC, sans compte et sans internet. Tu peux exporter une sauvegarde pour la garder au chaud ou la transférer sur un autre ordi.'),
      h('div.row-actions', null,
        h('button.btn.btn-primary', { onclick: async () => { if (await window.hhh.exportBackup(s)) toast('Sauvegarde exportée !', { icon: 'save' }); } }, icon('download'), 'Exporter'),
        h('button.btn.btn-ghost', { onclick: async () => {
          let data;
          try { data = await window.hhh.importBackup(); } catch { toast('Ce fichier n\'est pas une sauvegarde valide 😬', { icon: 'error' }); return; }
          if (!data) return;
          if (!Array.isArray(data.formations) || !Array.isArray(data.slots)) { toast('Ce fichier n\'est pas une sauvegarde Hourra 😬', { icon: 'error' }); return; }
          const ok = await confirmDialog({ title: 'Importer cette sauvegarde ?', message: 'Tes données actuelles seront remplacées par celles de la sauvegarde.', okLabel: 'Importer', danger: false });
          if (ok) { store.replaceAll(data); toast('Sauvegarde importée !', { icon: 'restore' }); }
        } }, icon('upload'), 'Importer'),
        h('button.btn.btn-flat', { onclick: () => window.hhh.openDataFolder() }, icon('folder_open'), 'Ouvrir le dossier'))),
    section('Remise à zéro',
      h('div.row-actions', null,
        h('button.btn.btn-ghost', { onclick: async () => {
          if (await confirmDialog({ title: 'Réinitialiser l\'apparence ?', message: 'Thème, fond, curseur, compagnons et effets reviennent aux réglages d\'origine. Tes cours ne bougent pas.', okLabel: 'Réinitialiser' })) {
            store.update((st) => { st.settings = defaultSettings(); }, 'settings');
            toast('Apparence réinitialisée', { icon: 'restart_alt' });
          }
        } }, icon('restart_alt'), 'Réinitialiser l\'apparence'),
        h('button.btn.btn-danger', { onclick: async () => {
          if (await confirmDialog({ title: 'Tout effacer ?', message: 'Formations, cours, missions et statistiques seront définitivement supprimés. Pense à exporter une sauvegarde avant !', okLabel: 'Tout effacer' })) {
            store.update((st) => { st.formations = []; st.slots = []; st.stats = { totalDone: 0, byDate: {} }; });
            toast('Tout a été effacé', { icon: 'delete_forever' });
          }
        } }, icon('delete_forever'), 'Tout effacer'))),
    section('À propos',
      h('p.muted.small', null, `Hourra · ${s.formations.length} formation(s) · ${s.slots.length} mission(s) · ${pick(['Fait avec 💙', 'Fait avec 🧠', 'Fait avec ☕'])}`))
  );
}
