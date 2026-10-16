// Planning de la semaine : colonnes jour par jour, missions (sessions J, tours, tâches libres).
import { h, icon, todayISO, addDays, mondayOf, isoWeek, fromISO, DAY_NAMES, MONTH_NAMES, formatLong, uid, pick } from './util.js';
import { store, describeSlot, setSlotDone, celebrationFor, SUBJECT_COLORS } from './store.js';
import { openModal, confirmDialog, toast } from './dialogs.js';
import { celebrate, grandFinale } from './fireworks.js';
import { petsCelebrate } from './pets.js';
import { showBannerMessage } from './banner.js';

// Niveau de maîtrise choisi en validant une mission (les id reprennent les anciennes humeurs).
export const LEVELS = [
  { id: 'dissatisfied', color: '#e53935', name: 'Rouge', label: 'Pas du tout maîtrisé' },
  { id: 'worried', color: '#fb8c00', name: 'Orange', label: 'Peu maîtrisé' },
  { id: 'neutral', color: '#fdd835', name: 'Jaune', label: 'Moyennement maîtrisé' },
  { id: 'content', color: '#8bc34a', name: 'Vert clair', label: 'Bien maîtrisé' },
  { id: 'excited', color: '#1b7a34', name: 'Vert foncé', label: 'Parfaitement maîtrisé' },
];

const TASK_EMOJIS = ['', '📝', '📚', '🧠', '✏️', '🔬', '💻', '🗣️', '🏃', '🎧', '📞', '🛒', '🧹', '💤', '⭐'];

let dragId = null;

const weekStart = () => mondayOf(store.state.ui.weekOf || todayISO());

export function renderPlanning() {
  const s = store.state;
  const start = weekStart();
  const today = todayISO();
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i)).filter((d, i) => s.settings.planning.showWeekend || i < 5);
  const d0 = fromISO(start);
  const d6 = fromISO(addDays(start, 6));
  const monthLabel = d0.getMonth() === d6.getMonth()
    ? `${MONTH_NAMES[d0.getMonth()]} ${d0.getFullYear()}`
    : `${MONTH_NAMES[d0.getMonth()]} – ${MONTH_NAMES[d6.getMonth()]} ${d6.getFullYear()}`;

  const go = (iso) => store.update((st) => { st.ui.weekOf = iso; }, 'planning');

  const el = document.getElementById('planning');
  el.replaceChildren(
    h('div.planning-nav', null,
      h('span.month-label', null, monthLabel),
      h('div.nav-center', null,
        h('button.icon-btn', { title: 'Semaine précédente', onclick: () => go(addDays(start, -7)) }, icon('chevron_left')),
        h('button.icon-btn', { title: 'Semaine en cours', onclick: () => go(null) }, icon('today')),
        h('label.icon-btn.date-jump', { title: 'Aller à une date' }, icon('edit_calendar'),
          h('input', { type: 'date', onchange: (e) => e.target.value && go(e.target.value) })),
        h('button.icon-btn', { title: 'Semaine suivante', onclick: () => go(addDays(start, 7)) }, icon('chevron_right'))),
      h('span.week-label', null, 'Semaine ' + isoWeek(start))
    ),
    h('div.week-grid', { style: { gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` } },
      days.map((d) => renderDay(d, today)))
  );
}

function slotsOf(date) {
  return store.state.slots
    .filter((x) => x.date === date)
    .sort((a, b) => (a.done - b.done) || (a.order - b.order));
}

function renderDay(date, today) {
  const d = fromISO(date);
  const all = slotsOf(date);
  const visible = store.state.settings.planning.showDone ? all : all.filter((x) => !x.done);
  const done = all.filter((x) => x.done).length;
  const pct = all.length ? Math.round((done / all.length) * 100) : 0;
  const isToday = date === today;
  const overdue = isToday ? store.state.slots.filter((x) => !x.done && x.date < today) : [];

  const col = h('div.day-col' + (isToday ? '.today' : '') + (date < today ? '.past' : ''), {
    dataset: { date },
    ondragover: (e) => { e.preventDefault(); col.classList.add('drop'); },
    ondragleave: (e) => { if (!col.contains(e.relatedTarget)) col.classList.remove('drop'); },
    ondrop: (e) => {
      e.preventDefault();
      col.classList.remove('drop');
      const slot = store.state.slots.find((x) => x.id === dragId);
      if (slot && slot.date !== date) store.update(() => { slot.date = date; slot.moved = true; slot.order = Date.now(); }, 'planning');
    },
    ondblclick: (e) => { if (e.target === col || e.target.classList.contains('day-cards')) taskDialog(date); },
  },
    h('div.day-head', null,
      h('span.day-name', null, DAY_NAMES[(d.getDay() + 6) % 7]),
      h('span.day-num' + (isToday ? '.today-num' : ''), null, d.getDate())),
    h('div.day-progress', { title: all.length ? `${done} / ${all.length} missions validées` : 'Aucune mission' },
      h('div.day-progress-bar', { style: { width: pct + '%' } }),
      all.length ? h('span.day-progress-label', null, `${done}/${all.length}`) : null),
    overdue.length ? h('button.overdue', { onclick: () => store.update(() => { overdue.forEach((x) => { x.date = today; x.moved = true; }); }, 'planning') },
      icon('history'), `${overdue.length} mission${overdue.length > 1 ? 's' : ''} en retard → les ramener ici`) : null,
    h('div.day-cards', null, visible.map((slot) => renderCard(slot, today))),
    h('button.add-task', { title: 'Ajouter une mission (ou double-clic dans la colonne)', onclick: () => taskDialog(date) }, icon('add'), 'Mission')
  );
  return col;
}

function renderCard(slot, today) {
  const info = describeSlot(slot);
  const level = LEVELS.find((x) => x.id === slot.sentiment);
  const late = !slot.done && slot.date < today;
  const card = h('div.card' + (slot.done ? '.done' : '') + (late ? '.late' : ''), {
    draggable: true,
    style: { '--c': info.color, '--lvl': level?.color || 'var(--success)' },
    dataset: { id: slot.id },
    ondragstart: (e) => { dragId = slot.id; card.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; },
    ondragend: () => { dragId = null; card.classList.remove('dragging'); },
  },
    h('div.card-top', null,
      info.badge && h('span.badge', null, info.badge),
      info.emoji && h('span.card-emoji', null, info.emoji),
      h('span.card-sub', { title: info.subtitle }, info.subtitle),
      checkButton(slot, level)
    ),
    h('div.card-title', { title: info.title }, info.title),
    h('div.card-actions', null,
      h('button.mini-btn' + (slot.note ? '.has-note' : ''), { title: 'Prends tes notes tout au long de tes révisions !', onclick: () => noteDialog(slot) },
        icon(slot.note ? 'sticky_note_2' : 'edit_note')),
      late && h('span.late-tag', null, 'en retard'),
      h('span.spacer'),
      slot.kind === 'task'
        ? h('button.mini-btn', { title: 'Modifier', onclick: () => taskDialog(slot.date, slot) }, icon('edit'))
        : h('button.mini-btn', { title: 'Voir dans « Mes cours »', onclick: () => revealPart(slot.partId) }, icon('travel_explore')),
      h('button.mini-btn.danger-hover', { title: 'Supprimer', onclick: () => deleteSlot(slot) }, icon('delete'))
    )
  );
  return card;
}

/** Bouton de validation : coche classique ou emoji personnalisé, teinté de la couleur du niveau. */
function checkButton(slot, level) {
  const emoji = store.state.settings.planning.checkEmoji;
  return h('button.check' + (slot.done ? '.on' : '') + (emoji ? '.emoji' : ''), {
    title: slot.done ? (level ? `${level.label} (cliquer pour changer)` : 'Changer le niveau / annuler') : 'Valider la mission : choisis ton niveau !',
    onclick: (e) => levelPopup(e.currentTarget, slot),
  }, emoji ? h('span.check-emoji', null, emoji) : icon(slot.done ? 'check_circle' : 'radio_button_unchecked'));
}

/** Valide la mission avec un niveau de maîtrise (ou change le niveau si elle l'est déjà). */
function validate(slot, levelId, r) {
  const wasDone = slot.done;
  store.update((st) => {
    slot.sentiment = levelId;
    if (!wasDone) setSlotDone(st, slot, true);
  }, 'planning');
  if (wasDone) return;
  const cfg = store.state.settings;
  const x = r.left + r.width / 2, y = r.top + r.height / 2;
  const daySlots = store.state.slots.filter((s) => s.date === slot.date);
  const allDone = daySlots.length > 1 && daySlots.every((s) => s.done);
  celebrate(celebrationFor(slot), cfg.theme, x, y);
  if (allDone) setTimeout(() => grandFinale(cfg.fireworks, cfg.theme), 900);
  petsCelebrate(x, y, allDone);
  showBannerMessage(allDone ? 'Journée bouclée, t\'es une légende ! 🏆' : pick(['Bien joué ! 🎉', 'Mission validée ✅', 'Et une de plus ! 💪', 'Tu gères !! 🔥', 'Hip Hip Hip… Hourra ! 🎉']));
}

function levelPopup(anchor, slot) {
  document.querySelector('.level-pop')?.remove();
  const r = anchor.getBoundingClientRect();
  const W = 300;
  const pop = h('div.popover.level-pop', { style: { left: Math.max(8, Math.min(innerWidth - W - 8, r.right - W)) + 'px', top: r.bottom + 6 + 'px', width: W + 'px' } },
    h('div.level-title', null, slot.done ? 'Changer mon niveau' : 'Mission validée ! Ton niveau ?'),
    h('div.level-row', null, LEVELS.map((l) => h('button.level' + (slot.sentiment === l.id ? '.on' : ''), {
      title: `${l.name} — ${l.label}`,
      style: { '--lvl': l.color },
      onclick: () => { close(); validate(slot, l.id, r); },
    }))),
    h('div.level-hint', null, h('span', null, 'Pas du tout'), h('span', null, 'Parfaitement')),
    slot.done && h('button.btn.btn-flat.small.level-undo', { onclick: () => {
      close();
      store.update((st) => { setSlotDone(st, slot, false); slot.sentiment = null; }, 'planning');
    } }, icon('undo'), 'Annuler la validation'));
  const close = () => { pop.remove(); removeEventListener('mousedown', out, true); };
  const out = (e) => { if (!pop.contains(e.target)) close(); };
  document.body.append(pop);
  setTimeout(() => addEventListener('mousedown', out, true));
}

function noteDialog(slot) {
  const info = describeSlot(slot);
  const ta = h('textarea.note-area', { placeholder: 'Saisis tes notes : ce que tu as compris, ce qui coince, les questions à poser…', value: slot.note || '' });
  openModal({
    title: '📝 ' + (info.badge ? info.badge + ' · ' : '') + info.title,
    body: h('div', null, h('p.muted.small', null, formatLong(slot.date) + (info.subtitle ? ' · ' + info.subtitle : '')), ta),
    wide: true,
    actions: [{ label: 'Enregistrer', primary: true, onClick: () => store.update(() => { slot.note = ta.value; }, 'planning') }],
  });
}

async function deleteSlot(slot) {
  if (slot.kind !== 'task') {
    const ok = await confirmDialog({ title: 'Supprimer cette session ?', message: 'Elle sera retirée du planning (tu peux la recréer en recochant le J dans « Mes cours »).' });
    if (!ok) return;
    if (slot.kind === 'J') {
      const f = store.findPart(slot.partId);
      store.update((st) => {
        if (f && slot.jNum > 0) f.part.days = f.part.days.filter((d) => d !== slot.jNum);
        st.slots = st.slots.filter((x) => x !== slot);
      });
      return;
    }
  }
  const backup = { ...slot };
  store.update((st) => { st.slots = st.slots.filter((x) => x.id !== slot.id); });
  toast('Mission supprimée', { icon: 'delete', action: { label: 'Annuler', onClick: () => store.update((st) => st.slots.push(backup)) } });
}

function revealPart(partId) {
  const f = store.findPart(partId);
  if (!f) return;
  store.update((st) => {
    st.ui.drawerOpen = true;
    st.ui.schoolYear = f.formation.year;
    f.formation.collapsed = f.subject.collapsed = f.course.collapsed = false;
    f.part.calOpen = true;
  });
  requestAnimationFrame(() => {
    const inputs = [...document.querySelectorAll('#drawer .course-name')];
    const target = inputs.find((i) => i.value === f.course.name);
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    target?.closest('.course')?.classList.add('flash');
  });
}

export function taskDialog(date, slot = null) {
  const editing = !!slot;
  const title = h('input.field', { placeholder: 'ex : Faire les exercices 12 à 15', value: slot?.title || '' });
  const sub = h('input.field', { placeholder: 'Détail (facultatif)', value: slot?.subtitle || '' });
  const dateIn = h('input.field', { type: 'date', value: slot?.date || date });
  let color = slot?.color || store.state.settings.theme.primary;
  let emoji = slot?.emoji || '';
  const repeat = h('select.field', null,
    h('option', { value: '0' }, 'Une seule fois'),
    h('option', { value: '1' }, 'Tous les jours (7 jours)'),
    h('option', { value: '7' }, 'Chaque semaine (4 semaines)'));
  const colors = h('div.swatches', null, [store.state.settings.theme.primary, ...SUBJECT_COLORS].map((c) =>
    h('button.swatch' + (c === color ? '.on' : ''), { style: { background: c }, onclick: (e) => {
      color = c; colors.querySelectorAll('.swatch').forEach((b) => b.classList.remove('on')); e.currentTarget.classList.add('on');
    } })));
  const emojis = h('div.emoji-row', null, TASK_EMOJIS.map((e) => h('button.emoji-pick' + (e === emoji ? '.on' : ''), { onclick: (ev) => {
    emoji = e; emojis.querySelectorAll('.emoji-pick').forEach((b) => b.classList.remove('on')); ev.currentTarget.classList.add('on');
  } }, e || '∅')));

  const save = () => {
    const t = title.value.trim();
    if (!t) { title.focus(); return false; }
    store.update((st) => {
      if (editing) Object.assign(slot, { title: t, subtitle: sub.value.trim(), date: dateIn.value || slot.date, color, emoji });
      else {
        const step = Number(repeat.value);
        const n = step === 1 ? 7 : step === 7 ? 4 : 1;
        for (let i = 0; i < n; i++) {
          st.slots.push({ id: uid(), kind: 'task', title: t, subtitle: sub.value.trim(), color, emoji, date: addDays(dateIn.value || date, i * (step || 0)), done: false, sentiment: null, note: '', order: Date.now() + i });
        }
      }
    }, 'planning');
  };
  const m = openModal({
    title: editing ? 'Modifier la mission' : 'Nouvelle mission',
    body: h('div.form-grid', null,
      h('label.field-wrap', null, h('span.field-label', null, 'Mission'), title),
      h('label.field-wrap', null, h('span.field-label', null, 'Détail'), sub),
      h('div.row-2', null,
        h('label.field-wrap', null, h('span.field-label', null, 'Jour'), dateIn),
        !editing && h('label.field-wrap', null, h('span.field-label', null, 'Répéter'), repeat)),
      h('div.field-wrap', null, h('span.field-label', null, 'Couleur'), colors),
      h('div.field-wrap', null, h('span.field-label', null, 'Emoji'), emojis)),
    actions: [{ label: 'Annuler', flat: true }, { label: editing ? 'Enregistrer' : 'Ajouter', primary: true, onClick: save }],
  });
  title.addEventListener('keydown', (e) => { if (e.key === 'Enter' && save() !== false) m.close(); });
}
