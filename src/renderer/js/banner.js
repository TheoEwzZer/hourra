// Bandeau incliné en haut : la p'tite blague du jour (ou des phrases qui défilent).
import { pick, todayISO } from './util.js';
import { store } from './store.js';

let timer;
let holdUntil = 0;
let current = '';
let shownDay = '';
let manual = false; // l'utilisateur a cliqué pour en voir une autre aujourd'hui

const messages = () => store.state.settings.banner.messages.filter((m) => m.trim());

function setText(text) {
  const el = document.getElementById('banner-text');
  if (!el || text === current) return;
  current = text;
  el.classList.add('swap');
  setTimeout(() => {
    el.textContent = text;
    el.title = text;
    el.classList.toggle('long', text.length > 60);
    el.classList.remove('swap');
  }, 180);
}

/** Même phrase toute la journée, une nouvelle chaque jour (dans l'ordre de la liste). */
function dailyMessage() {
  const msgs = messages();
  if (!msgs.length) return '';
  const day = Math.floor(Date.parse(todayISO() + 'T12:00:00Z') / 86400000);
  return msgs[day % msgs.length];
}

function showDaily() {
  shownDay = todayISO();
  manual = false;
  setText(dailyMessage());
}

export function nextMessage() {
  const msgs = messages();
  if (!msgs.length) return setText('');
  manual = true;
  const others = msgs.length > 1 ? msgs.filter((m) => m !== current) : msgs;
  setText(pick(others));
}

/** Message temporaire (ex : après une mission validée). */
export function showBannerMessage(text, ms = 4000) {
  holdUntil = Date.now() + ms;
  setText(text);
  document.getElementById('banner')?.classList.add('party');
  setTimeout(() => document.getElementById('banner')?.classList.remove('party'), 1200);
  // Mode « blague du jour » : on y revient après le message
  if (!store.state.settings.banner.rotate) {
    setTimeout(() => { if (Date.now() >= holdUntil && !manual) setText(dailyMessage()); }, ms + 50);
  }
}

export function startBanner() {
  clearInterval(timer);
  const b = store.state.settings.banner;
  if (!b.rotate) {
    showDaily();
    // Toutes les minutes : nouvelle blague si on a changé de jour
    timer = setInterval(() => {
      if (Date.now() > holdUntil && todayISO() !== shownDay) showDaily();
    }, 60 * 1000);
    return;
  }
  if (!current) nextMessage();
  timer = setInterval(() => {
    if (Date.now() > holdUntil) nextMessage();
  }, Math.max(5, b.interval) * 1000);
}
