// Menu latéral « Mes cours » : formations > matières > cours, méthode des J et tours de révision.
import { h, icon, todayISO, addDays, formatShort } from './util.js';
import {
  store, newFormation, newSubject, newCourse, newPart, syncPartSlots, removePartSlots,
  partIdsOfSubject, partIdsOfFormation, J_CHOICES, SUBJECT_COLORS, currentStreak, planReviewRound,
} from './store.js';
import { openModal, confirmDialog, promptDialog, toast } from './dialogs.js';
import { PATHWAY_GROUPS, PATHWAYS } from './catalog.js';
import { subjectCelebrationDialog } from './settings.js';
import { EFFECTS } from './fireworks.js';
import { LEVELS } from './planning.js';

const SUBJECT_EMOJIS = ['', '📐', '🧪', '🧬', '🌍', '📖', '🗣️', '💻', '⚖️', '🩺', '🧠', '🎨', '🎵', '📊', '🏛️', '⚛️', '🦴', '💊', '✍️', '🔢'];

/** Édition en ligne : on modifie l'état sans tout redessiner (garde le focus). */
const silent = (fn) => store.update(fn, 'silent');

function inlineInput(value, placeholder, onChange, cls = '') {
  return h('input.inline-input' + cls, {
    value, placeholder, spellcheck: false,
    oninput: (e) => onChange(e.target.value),
    onchange: () => store.update(() => {}, 'planning'),
    onkeydown: (e) => { if (e.key === 'Enter') e.target.blur(); },
  });
}

export function renderDrawer() {
  const s = store.state;
  const el = document.getElementById('drawer');
  const year = s.ui.schoolYear;
  const formations = s.formations.filter((f) => f.year === year);
  const streak = currentStreak(s);
  const scroll = el.querySelector('.drawer-scroll')?.scrollTop || 0;

  el.replaceChildren(
    h('button.btn.btn-flat.add-formation', { onclick: () => openEnrollDialog() }, 'Ajouter une formation'),
    h('div.drawer-scroll', null,
      formations.length === 0
        ? h('div.drawer-empty', null,
          h('div.drawer-empty-emoji', null, '📚'),
          h('p', null, 'Aucune formation pour ', h('b', null, `${year} / ${year + 1}`), '.'),
          h('p.muted', null, 'Ajoute ta formation, puis tes matières et tes cours. Fixe le J0 de chaque cours : les révisions (J1, J3, J6, J9…) apparaîtront toutes seules dans ton planning !'))
        : formations.map(renderFormation)
    ),
    h('div.drawer-stats', null,
      h('div.stat', { title: 'Jours d\'affilée avec au moins une mission validée' }, h('span.stat-big', null, '🔥 ' + streak), h('span.stat-label', null, streak > 1 ? 'jours de suite' : 'jour de suite')),
      h('div.stat', { title: 'Missions validées au total' }, h('span.stat-big', null, '✅ ' + s.stats.totalDone), h('span.stat-label', null, 'missions'))
    ),
    h('div.year-picker', null,
      h('button.icon-btn', { title: 'Voir l\'année précédente', onclick: () => store.update((st) => { st.ui.schoolYear--; }, 'drawer') }, icon('chevron_left')),
      h('span', null, `${year} / ${year + 1}`),
      h('button.icon-btn', { title: 'Voir l\'année suivante', onclick: () => store.update((st) => { st.ui.schoolYear++; }, 'drawer') }, icon('chevron_right'))
    )
  );
  el.querySelector('.drawer-scroll').scrollTop = scroll;
}

function caret(obj, what = 'drawer') {
  return h('button.icon-btn.caret' + (obj.collapsed ? '.collapsed' : ''), {
    title: obj.collapsed ? 'Développer' : 'Réduire',
    onclick: () => store.update(() => { obj.collapsed = !obj.collapsed; }, what),
  }, icon('expand_more'));
}

function renderFormation(f) {
  return h('section.formation', null,
    h('div.formation-head', null,
      caret(f),
      h('div.formation-titles', null,
        inlineInput(f.name, 'Ma formation', (v) => silent(() => { f.name = v; }), '.formation-name'),
        h('span.formation-type', null, f.typeLabel || '')),
      h('button.icon-btn', { title: 'Ajouter une matière', onclick: () => addSubject(f) }, icon('add')),
      h('button.icon-btn', { title: 'Paramétrer mon inscription', onclick: () => formationSettings(f) }, icon('settings'))
    ),
    !f.collapsed && h('div.formation-body', null,
      f.subjects.length === 0 && h('button.btn.btn-ghost.small', { onclick: () => addSubject(f) }, icon('add'), 'Ajouter une matière'),
      f.subjects.map((s) => renderSubject(f, s)))
  );
}

function renderSubject(f, s) {
  return h('div.subject', { style: { '--c': s.color } },
    h('div.subject-head', null,
      caret(s),
      h('button.color-dot', { title: 'Changer la couleur', style: { background: s.color }, onclick: (e) => colorPopover(e.currentTarget, s) }, s.emoji || ''),
      inlineInput(s.name, 'Nom de la matière', (v) => silent(() => { s.name = v; }), '.subject-name'),
      s.method === 'J' && h('button.icon-btn', { title: 'Planifier mes tours de révisions', onclick: () => reviewRoundDialog(s) }, icon('event_repeat')),
      h('button.icon-btn', { title: 'Ajouter un cours', onclick: () => addCourse(s) }, icon('add')),
      h('button.icon-btn', { title: 'Paramétrer la matière', onclick: () => subjectSettings(f, s) }, icon('tune'))
    ),
    !s.collapsed && h('div.subject-body', null,
      s.courses.length === 0 && h('button.btn.btn-ghost.small', { onclick: () => addCourse(s) }, icon('add'), 'Ajouter un cours'),
      s.courses.map((c) => renderCourse(s, c)))
  );
}

/**
 * Barre de progression en fond de ligne : elle ne dépend que du niveau de la dernière
 * validation (rouge 20 % → vert foncé 100 %), et prend sa couleur.
 */
function progressProps(partIds) {
  const ids = new Set(partIds);
  const last = store.state.slots
    .filter((x) => x.partId && ids.has(x.partId) && x.done && x.sentiment)
    .reduce((a, b) => ((b.doneAt || 0) >= (a?.doneAt || 0) ? b : a), null);
  const i = LEVELS.findIndex((l) => l.id === last?.sentiment);
  if (i < 0) return null;
  return {
    title: `Dernière validation : ${LEVELS[i].label.toLowerCase()}`,
    style: { '--prog': ((i + 1) / LEVELS.length) * 100 + '%', '--prog-c': LEVELS[i].color },
  };
}

/** Le calendrier des J est replié par défaut (sauf tant qu'il n'y a pas de J0). */
const calShown = (p) => p.calOpen || !p.j0;

function calCaret(p) {
  const open = calShown(p);
  return h('button.icon-btn.caret' + (open ? '' : '.collapsed'), {
    title: open ? 'Masquer le calendrier des J' : 'Afficher le calendrier des J',
    onclick: () => store.update(() => { p.calOpen = !open; }, 'drawer'),
  }, icon('expand_more'));
}

function renderCourse(s, c) {
  const p = c.parts[0]; // un cours = une série de J (les anciennes « parties » ont été séparées en cours)
  return h('div.course', null,
    h('div.course-head.progress-row', progressProps(c.parts.map((x) => x.id)),
      p ? calCaret(p) : h('span.caret-space'),
      h('span.course-icon', null, icon('menu_book')),
      inlineInput(c.name, 'Nom du cours', (v) => silent(() => {
        c.name = v;
        if (p) p.name = v;
      }), '.course-name'),
      h('button.icon-btn.danger-hover', { title: 'Supprimer le cours', onclick: () => deleteCourse(s, c) }, icon('delete'))
    ),
    p && calShown(p) && h('div.course-body', null, renderPartDetail(s, c, p))
  );
}

function renderPartDetail(s, c, p) {
  if (s.method !== 'J') {
    return h('div.part-detail.muted.small', null, 'Méthode libre : ajoute tes missions directement dans le planning.');
  }
  const doneDays = new Set(store.state.slots.filter((x) => x.kind === 'J' && x.partId === p.id && x.done).map((x) => x.jNum));
  return h('div.part-detail', null,
    h('div.j0-row', null,
      h('span.j0-label', null, 'Date du J0'),
      h('input.j0-input', {
        type: 'date', value: p.j0 || '',
        onchange: (e) => store.update((st) => { p.j0 = e.target.value || null; syncPartSlots(st, p.id); }),
      }),
      !p.j0 && h('button.btn.btn-flat.small', { title: 'J0 = aujourd\'hui', onclick: () => store.update((st) => { p.j0 = todayISO(); syncPartSlots(st, p.id); }) }, 'Aujourd\'hui'),
      h('button.icon-btn' + (p.note ? '.has-note' : ''), { title: 'Prérequis, notes préliminaires…', onclick: () => partNoteDialog(c, p) }, icon(p.note ? 'sticky_note_2' : 'note_add'))
    ),
    p.j0 && h('div.day-buttons', null,
      J_CHOICES.map((n) => {
        const on = p.days.includes(n);
        return h('button.day-btn' + (on ? '.on' : '') + (doneDays.has(n) ? '.done' : ''), {
          title: `J${n} → ${formatShort(addDays(p.j0, n))}`,
          onclick: () => store.update((st) => {
            p.days = on ? p.days.filter((d) => d !== n) : [...p.days, n].sort((a, b) => a - b);
            syncPartSlots(st, p.id);
          }),
        }, String(n));
      }))
  );
}

// ---------- Actions ----------

async function addSubject(f) {
  const name = await promptDialog({ title: 'Nouvelle matière', label: 'Nom de la matière (ou de l\'UE)', placeholder: 'ex : Mathématiques' });
  if (!name) return;
  store.update(() => { f.collapsed = false; f.subjects.push(newSubject(name, f.subjects.length)); });
}

async function addCourse(s) {
  const name = await promptDialog({ title: 'Nouveau cours', label: 'Nom du cours', placeholder: 'ex : Les fonctions exponentielles' });
  if (!name) return;
  store.update(() => {
    s.collapsed = false;
    const c = newCourse(name);
    c.parts.push(newPart(name, s));
    s.courses.push(c);
  });
}

async function deleteCourse(s, c) {
  const ok = await confirmDialog({ title: 'Suppression définitive', message: 'Toutes les sessions de révision de ce cours seront aussi supprimées.' });
  if (!ok) return;
  store.update((st) => {
    removePartSlots(st, c.parts.map((p) => p.id));
    s.courses = s.courses.filter((x) => x !== c);
  });
}

function partNoteDialog(c, p) {
  const ta = h('textarea.note-area', { placeholder: 'Prérequis, notes préliminaires, etc', value: p.note || '' });
  openModal({
    title: '📝 ' + (c.parts.length > 1 ? c.name + ' — ' + p.name : c.name),
    body: ta,
    wide: true,
    actions: [{ label: 'Enregistrer', primary: true, onClick: () => store.update(() => { p.note = ta.value; }, 'drawer') }],
  });
}

function colorPopover(anchor, s) {
  const r = anchor.getBoundingClientRect();
  const pop = h('div.popover', { style: { left: r.left + 'px', top: r.bottom + 6 + 'px' } },
    h('div.swatches', null, SUBJECT_COLORS.map((c) => h('button.swatch', { style: { background: c }, onclick: () => { store.update(() => { s.color = c; }); close(); } }))),
    h('label.custom-color', null, 'Autre : ', h('input', { type: 'color', value: s.color, oninput: (e) => store.update(() => { s.color = e.target.value; }, 'planning') })),
    h('div.emoji-row', null, SUBJECT_EMOJIS.map((e) => h('button.emoji-pick' + (s.emoji === e ? '.on' : ''), { onclick: () => { store.update(() => { s.emoji = e; }); close(); } }, e || '∅')))
  );
  const close = () => { pop.remove(); removeEventListener('mousedown', out, true); };
  const out = (e) => { if (!pop.contains(e.target)) close(); };
  document.body.append(pop);
  setTimeout(() => addEventListener('mousedown', out, true));
}

function celebText(s) {
  const c = s.celebration;
  const e = c && EFFECTS[c.style];
  if (!e) return '⚙️ Comme par défaut';
  return `${e.emoji} ${e.label}${e.usesEmojis ? ' ' + (c.emojis || '') : ''}`;
}

function subjectSettings(f, s) {
  let method = s.method;
  let jDays = [...s.jDays];
  const daysBox = h('div.day-buttons');
  const drawDays = () => daysBox.replaceChildren(...J_CHOICES.map((n) =>
    h('button.day-btn' + (jDays.includes(n) ? '.on' : ''), {
      onclick: () => { jDays = jDays.includes(n) ? jDays.filter((d) => d !== n) : [...jDays, n].sort((a, b) => a - b); drawDays(); },
    }, String(n))));
  drawDays();
  const applyAll = h('input', { type: 'checkbox', checked: true });
  const celebLabel = h('span.celeb-current', null, celebText(s));
  const methodSel = h('select.field', { onchange: (e) => { method = e.target.value; } },
    h('option', { value: 'J', selected: method === 'J' }, 'Méthode des J'),
    h('option', { value: 'free', selected: method === 'free' }, 'Libre (missions à la main)'));

  openModal({
    title: 'Paramétrer la matière',
    body: h('div.form-grid', null,
      h('label.field-wrap', null, h('span.field-label', null, 'Méthode de révision'), methodSel),
      h('div.field-wrap', null, h('span.field-label', null, 'J par défaut pour les nouveaux cours'), daysBox),
      h('label.check-row', null, applyAll, 'Appliquer aussi ces J aux cours existants de la matière'),
      h('div.field-wrap', null,
        h('span.field-label', null, 'Célébration quand je valide une mission'),
        h('div.row-actions', null,
          celebLabel,
          h('button.btn.btn-ghost.small', { onclick: () => subjectCelebrationDialog(s, () => { celebLabel.textContent = celebText(s); }) }, '🎉 Choisir'))),
      h('p.muted.small', null, 'Si tu quittes la méthode des J, les sessions de révision à venir (non validées) de cette matière disparaîtront.')
    ),
    actions: [
      { label: 'Supprimer la matière', danger: true, flat: true, icon: 'delete', onClick: async () => {
        const ok = await confirmDialog({ title: 'Suppression définitive', message: 'Tous les cours (et leurs sessions de révision) de la matière seront définitivement supprimés.' });
        if (!ok) return false;
        store.update((st) => { removePartSlots(st, partIdsOfSubject(s)); f.subjects = f.subjects.filter((x) => x !== s); });
      } },
      { label: 'Enregistrer', primary: true, onClick: () => store.update((st) => {
        s.method = method;
        s.jDays = jDays;
        for (const c of s.courses) for (const p of c.parts) {
          if (applyAll.checked) p.days = [...jDays];
          syncPartSlots(st, p.id);
        }
      }) },
    ],
  });
}

function formationSettings(f) {
  const yearInput = h('input.field', { type: 'number', value: f.year, min: 2000, max: 2100 });
  openModal({
    title: 'Paramétrer mon inscription',
    body: h('div.form-grid', null,
      h('label.field-wrap', null, h('span.field-label', null, 'Nom de la formation'), h('input.field', { value: f.name, oninput: (e) => { f.name = e.target.value; } })),
      h('label.field-wrap', null, h('span.field-label', null, 'Année scolaire (début)'), yearInput)),
    actions: [
      { label: 'Supprimer la formation', danger: true, flat: true, icon: 'delete', onClick: async () => {
        const ok = await confirmDialog({ title: 'Suppression définitive', message: `La formation « ${f.name} », toutes ses matières, ses cours et leurs sessions de révision seront supprimés.` });
        if (!ok) return false;
        store.update((st) => { removePartSlots(st, partIdsOfFormation(f)); st.formations = st.formations.filter((x) => x !== f); });
      } },
      { label: 'Enregistrer', primary: true, onClick: () => store.update(() => { f.year = Number(yearInput.value) || f.year; }) },
    ],
  });
}

export function openEnrollDialog() {
  let year = store.state.ui.schoolYear;
  let group = null;
  let pathway = '';
  const yearLabel = h('span.year-label', null, `${year} / ${year + 1}`);
  const groupSel = h('div.choice-list');
  const pathwayWrap = h('div');
  const subjectsWrap = h('div');
  const chosen = new Set();

  const drawSubjects = () => {
    const list = (PATHWAYS[group?.id] || {})[pathway] || [];
    chosen.clear();
    list.forEach((x) => chosen.add(x));
    subjectsWrap.replaceChildren(list.length ? h('div.field-wrap', null,
      h('span.field-label', null, 'Matières proposées (décoche celles que tu ne suis pas)'),
      h('div.chips', null, list.map((name) => {
        const chip = h('button.chip.on', { onclick: () => { chosen.has(name) ? chosen.delete(name) : chosen.add(name); chip.classList.toggle('on'); } }, name);
        return chip;
      }))) : '');
  };

  const drawPathway = () => {
    if (!group) { pathwayWrap.replaceChildren(); return; }
    const opts = Object.keys(PATHWAYS[group.id] || {});
    const input = h('input.field', { placeholder: 'Je suis le parcours ou le diplôme', value: pathway, list: 'pathway-list',
      oninput: (e) => { pathway = e.target.value; drawSubjects(); } });
    pathwayWrap.replaceChildren(
      h('label.field-wrap', null, h('span.field-label', null, 'Je suis le parcours ou le diplôme'), input,
        h('datalist#pathway-list', null, opts.map((o) => h('option', { value: o })))),
      opts.length ? h('div.chips', null, opts.map((o) => h('button.chip' + (o === pathway ? '.on' : ''), { onclick: () => { pathway = o; drawPathway(); drawSubjects(); } }, o))) : ''
    );
  };

  groupSel.replaceChildren(...PATHWAY_GROUPS.map((g) => h('button.choice', {
    onclick: (e) => {
      group = g; pathway = '';
      groupSel.querySelectorAll('.choice').forEach((b) => b.classList.remove('on'));
      e.currentTarget.classList.add('on');
      drawPathway(); drawSubjects();
    },
  }, h('span.choice-emoji', null, g.emoji), g.label)));

  openModal({
    title: 'Nouvelle formation pour l\'année',
    headExtra: h('div.year-switch', null,
      h('button.icon-btn', { onclick: () => { year--; yearLabel.textContent = `${year} / ${year + 1}`; } }, icon('chevron_left')),
      yearLabel,
      h('button.icon-btn', { onclick: () => { year++; yearLabel.textContent = `${year} / ${year + 1}`; } }, icon('chevron_right'))),
    body: h('div.form-grid', null, h('span.field-label', null, 'Je m\'inscris…'), groupSel, pathwayWrap, subjectsWrap),
    wide: true,
    actions: [
      { label: 'Annuler', flat: true },
      { label: 'Ajouter', primary: true, onClick: () => {
        if (!group) { toast('Choisis d\'abord où tu étudies 😉', { icon: 'info' }); return false; }
        const name = pathway.trim() || group.label.replace(/^(au|en|à l'|pour) /, '');
        const f = newFormation(name, group.id, year);
        f.typeLabel = group.emoji + ' ' + group.label;
        [...chosen].forEach((sname, i) => f.subjects.push(newSubject(sname, i)));
        store.update((st) => { st.formations.push(f); st.ui.schoolYear = year; st.ui.drawerOpen = true; });
        toast(`Formation « ${name} » ajoutée${chosen.size ? ` avec ${chosen.size} matière(s)` : ''} !`, { icon: 'school' });
      } },
    ],
  });
}

function reviewRoundDialog(s) {
  const parts = s.courses.flatMap((c) => c.parts.map((p) => ({ c, p })));
  if (!parts.length) { toast('Ajoute d\'abord des cours à cette matière', { icon: 'info' }); return; }
  const selected = new Set(parts.map((x) => x.p.id));
  const from = h('input.field', { type: 'date', value: todayISO() });
  const to = h('input.field', { type: 'date', value: addDays(todayISO(), 13) });
  const list = h('div.round-list', null, parts.map(({ c, p }) => {
    const cb = h('input', { type: 'checkbox', checked: true, onchange: () => { cb.checked ? selected.add(p.id) : selected.delete(p.id); } });
    return h('label.check-row', null, cb, c.name);
  }));
  const setAll = (v) => list.querySelectorAll('input').forEach((cb, i) => { cb.checked = v; v ? selected.add(parts[i].p.id) : selected.delete(parts[i].p.id); });

  openModal({
    title: 'Tours de révisions — ' + s.name,
    body: h('div.form-grid', null,
      h('p.muted.small', null, 'Un tour de révision répartit tous les cours choisis sur une période (idéal avant un partiel ou un concours blanc).'),
      h('div.row-2', null,
        h('label.field-wrap', null, h('span.field-label', null, 'Du'), from),
        h('label.field-wrap', null, h('span.field-label', null, 'Au'), to)),
      h('div.row-actions', null,
        h('button.btn.btn-flat.small', { onclick: () => setAll(true) }, 'Tout sélectionner'),
        h('button.btn.btn-flat.small', { onclick: () => setAll(false) }, 'Tout desélectionner')),
      list),
    actions: [
      { label: 'Annuler', flat: true },
      { label: 'Planifier', primary: true, icon: 'event_available', onClick: () => {
        if (!selected.size) return false;
        if (to.value < from.value) { toast('La date de fin est avant la date de début 🙃', { icon: 'error' }); return false; }
        let round;
        store.update((st) => { round = planReviewRound(st, [...selected], from.value, to.value); });
        toast(`Tour de révision n°${round} planifié (${selected.size} cours) !`, { icon: 'event_available' });
      } },
    ],
  });
}
