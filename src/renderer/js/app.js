// Point d'entrée : barre du haut, aide, application des réglages, raccourcis clavier.
import { h, icon, todayISO, addDays, mondayOf } from './util.js';
import { store } from './store.js';
import { applyTheme } from './themes.js';
import { applyBackground } from './ambiance.js';
import { applyCursor, initTrail } from './cursors.js';
import { applyPets, initPets } from './pets.js';
import { renderDrawer, openEnrollDialog } from './drawer.js';
import { renderPlanning, taskDialog } from './planning.js';
import { openSettings } from './settings.js';
import { openModal } from './dialogs.js';
import { nextMessage, startBanner } from './banner.js';

function renderHeader() {
  document.getElementById('header').replaceChildren(
    h('div.header-left', null,
      h('button.icon-btn.menu-btn', { title: 'Mes cours (M)', onclick: toggleDrawer }, icon('menu')),
      h('div.logo', null,
        h('img.logo-mark', { src: 'assets/logo.svg', alt: '' }),
        h('span.logo-text', null, 'Hourra'))),
    h('div#banner', { title: 'Clique pour une autre blague', onclick: nextMessage }, h('span#banner-text')),
    h('div.header-right', null,
      h('button.icon-btn', { title: 'Nouvelle mission aujourd\'hui (N)', onclick: () => taskDialog(todayISO()) }, icon('add_task')),
      h('button.icon-btn', { title: 'Compagnons on/off', onclick: () => store.update((st) => { st.settings.pets.enabled = !st.settings.pets.enabled; }, 'settings') }, icon('pets')),
      h('button.icon-btn', { title: 'Personnaliser (Ctrl+,)', onclick: () => openSettings() }, icon('palette')),
      h('button.icon-btn', { title: 'Besoin d\'aide ?', onclick: openHelp }, icon('help')))
  );
}

function toggleDrawer() {
  store.update((st) => { st.ui.drawerOpen = !st.ui.drawerOpen; }, 'layout');
}

function applyLayout() {
  document.body.classList.toggle('drawer-closed', !store.state.ui.drawerOpen);
}

let lastPrimary, lastCursorKey;
function applySettings() {
  const s = store.state.settings;
  applyTheme(s);
  applyBackground(s.background);
  const ck = JSON.stringify(s.cursor) + s.theme.primary;
  if (ck !== lastCursorKey) { lastCursorKey = ck; applyCursor(s.cursor, s.theme.primary); }
  applyPets(s.pets);
  if (lastPrimary === undefined) startBanner();
  lastPrimary = s.theme.primary;
}

const bannerKey = () => JSON.stringify(store.state.settings.banner);
let lastBanner;

function openHelp() {
  openModal({
    title: '🎈 Comment ça marche ?',
    wide: true,
    body: h('div.help', null,
      h('div.help-steps', null,
        step('1', '🎓', 'Ajoute ta formation', 'Dans « Mes cours » (menu ☰), clique sur « Ajouter une formation ». On te propose directement les matières de ton année.'),
        step('2', '📚', 'Ajoute tes cours', 'Dans chaque matière, ajoute tes cours avec le +, puis fixe leur J0.'),
        step('3', '📅', 'Fixe le J0', 'Le J0, c\'est le jour où tu vois le cours pour la première fois. Les révisions J1, J3, J6, J9, J13… (cases violettes) se placent toutes seules dans ton planning.'),
        step('4', '✅', 'Valide tes missions', 'Clique sur le rond d\'une session et choisis ton niveau : rouge, orange, jaune, vert clair ou vert foncé. Célébration garantie 🎆 !')),
      h('h3', null, '🧠 La méthode des J'),
      h('p', null, 'On oublie très vite ce qu\'on vient d\'apprendre (la « courbe de l\'oubli »). Revoir un cours à intervalles de plus en plus espacés — J1, J3, J6, J9, J13, J16, J21, J30… jusqu\'à J120 — permet de l\'ancrer durablement en mémoire. Coche ou décoche les J de chaque cours selon tes besoins.'),
      h('h3', null, '🔁 Tours de révisions'),
      h('p', null, 'Avant un partiel, clique sur l\'icône 🔁 d\'une matière pour répartir tous ses cours sur une période.'),
      h('h3', null, '⌨️ Raccourcis'),
      h('div.shortcuts', null,
        kbd('← / →', 'Semaine précédente / suivante'),
        kbd('T', 'Revenir à aujourd\'hui'),
        kbd('N', 'Nouvelle mission aujourd\'hui'),
        kbd('M', 'Ouvrir / fermer « Mes cours »'),
        kbd('Ctrl + ,', 'Personnaliser'),
        kbd('Double-clic', 'Dans une colonne : ajouter une mission'),
        kbd('Glisser-déposer', 'Déplacer une mission vers un autre jour')),
      h('h3', null, '🐾 Les compagnons'),
      h('p', null, 'Clique dessus pour les caresser, double-clique pour les nourrir, attrape-les pour les déplacer. Ils font la fête quand tu valides une mission et s\'endorment si tu ne fais rien pendant une minute. Tu peux en adopter plein dans Personnaliser → Compagnons !'),
      h('p.muted.small', null, 'Hourra fonctionne 100 % hors-ligne : tes données restent sur ton ordinateur.'))
  });
}

const step = (n, emoji, title, text) => h('div.help-step', null, h('div.help-emoji', null, emoji), h('b', null, n + '. ' + title), h('p', null, text));
const kbd = (k, label) => h('div.shortcut', null, h('kbd', null, k), h('span', null, label));

function onKey(e) {
  const tag = e.target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return;
  if (document.querySelector('.modal-backdrop')) return;
  const week = mondayOf(store.state.ui.weekOf || todayISO());
  if (e.ctrlKey && e.key === ',') { e.preventDefault(); openSettings(); }
  else if (e.ctrlKey || e.altKey || e.metaKey) return;
  else if (e.key === 'ArrowLeft') store.update((st) => { st.ui.weekOf = addDays(week, -7); }, 'planning');
  else if (e.key === 'ArrowRight') store.update((st) => { st.ui.weekOf = addDays(week, 7); }, 'planning');
  else if (e.key.toLowerCase() === 't') store.update((st) => { st.ui.weekOf = null; }, 'planning');
  else if (e.key.toLowerCase() === 'n') { e.preventDefault(); taskDialog(todayISO()); }
  else if (e.key.toLowerCase() === 'm') toggleDrawer();
}

async function main() {
  await store.load();
  renderHeader();
  applyLayout();
  initTrail();
  initPets();
  applySettings();
  lastBanner = bannerKey();
  renderDrawer();
  renderPlanning();

  store.on((what) => {
    if (what === 'silent') return;
    if (what === 'layout') { applyLayout(); return; }
    if (what === 'settings' || what === 'all') {
      applySettings();
      if (bannerKey() !== lastBanner) { lastBanner = bannerKey(); startBanner(); }
    }
    if (what === 'all') applyLayout();
    if (what !== 'settings') renderDrawer();
    if (what !== 'drawer') renderPlanning();
  });

  addEventListener('keydown', onKey);

  // Changement de jour pendant que l'app est ouverte : on rafraîchit le planning
  let day = todayISO();
  setInterval(() => {
    if (todayISO() !== day) { day = todayISO(); renderPlanning(); renderDrawer(); }
  }, 60000);

  if (!store.state.formations.length && !store.state.seenWelcome) {
    store.update((st) => { st.seenWelcome = true; }, 'silent');
    welcome();
  }
}

function welcome() {
  openModal({
    wide: true,
    title: 'Bienvenue sur Hourra ! 🎉',
    body: h('div.welcome', null,
      h('div.welcome-emoji', null, '🎈🐈📚'),
      h('p', null, 'Ton planning de révisions, ', h('b', null, 'sans compte et sans internet'), ', et personnalisable à fond : couleurs, fond d\'écran, curseurs, compagnons…'),
      h('p', null, 'On commence par ajouter ta formation ?')),
    actions: [
      { label: 'Plus tard', flat: true },
      { label: 'Personnaliser d\'abord', icon: 'palette', onClick: () => setTimeout(() => openSettings('theme'), 200) },
      { label: 'Ajouter ma formation', primary: true, icon: 'school', onClick: () => setTimeout(openEnrollDialog, 200) },
    ],
  });
}

main();
