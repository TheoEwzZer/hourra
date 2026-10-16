// Version de l'app et mises à jour automatiques (téléchargées en arrière-plan depuis GitHub).
import { h, icon } from './util.js';
import { store } from './store.js';
import { toast } from './dialogs.js';

let version = '';
let status = { state: 'idle' };
let box = null; // encart « À propos » ouvert dans la fenêtre d'aide
let notified = false;

export async function initUpdates() {
  let live = false;
  window.hhh.onUpdateStatus((s) => {
    live = true;
    status = s;
    refresh();
    if (s.state === 'ready' && !notified) {
      notified = true;
      toast(`La version ${s.version} est prête !`, { icon: 'system_update', ms: 15000, action: { label: 'Redémarrer', onClick: install } });
    }
  });
  const info = await window.hhh.appInfo();
  version = info.version;
  if (!live) status = info.update;
  refresh();
}

async function install() {
  await store.saveNow();
  window.hhh.installUpdate();
}

function statusLine() {
  switch (status.state) {
    case 'disabled':
      return status.reason === 'portable'
        ? ['info', 'Version portable : pas de mise à jour automatique. Télécharge la nouvelle version sur GitHub.']
        : ['info', 'Mode développement : pas de mise à jour automatique.'];
    case 'checking': return ['sync', 'Recherche de mises à jour…'];
    case 'none': return ['check_circle', 'Tu as la dernière version.'];
    case 'downloading': return ['downloading', `Téléchargement de la version ${status.version}… ${status.percent || 0} %`];
    case 'ready': return ['system_update', `La version ${status.version} est prête : elle s'installera à la fermeture de Hourra.`];
    case 'error': return ['wifi_off', 'Impossible de vérifier les mises à jour (pas de connexion ?).'];
    default: return ['schedule', 'Vérification des mises à jour au démarrage.'];
  }
}

function render() {
  const [ic, text] = statusLine();
  const canCheck = ['none', 'error', 'idle'].includes(status.state);
  return [
    h('div.about-head', null,
      h('img.about-logo', { src: 'assets/logo.svg', alt: '' }),
      h('div', null, h('b', null, 'Hourra'), h('div.muted.small', null, `Version ${version || '?'}`))),
    h('div.about-status' + (status.state === 'ready' ? '.ready' : ''), null, icon(ic), h('span', null, text)),
    h('div.about-actions', null,
      status.state === 'ready' && h('button.btn.btn-primary.small', { onclick: install }, icon('restart_alt'), 'Redémarrer et mettre à jour'),
      canCheck && h('button.btn.btn-flat.small', { onclick: () => { status = { state: 'checking' }; refresh(); window.hhh.checkUpdate(); } }, icon('refresh'), 'Vérifier maintenant'),
      h('a.btn.btn-flat.small', { href: 'https://github.com/TheoEwzZer/hourra/releases', target: '_blank' }, icon('open_in_new'), 'Nouveautés')),
  ];
}

function refresh() {
  if (box?.isConnected) box.replaceChildren(...render().filter(Boolean));
}

/** Encart « À propos » : version actuelle + état de la mise à jour (se met à jour en direct). */
export function aboutBox() {
  box = h('div.about');
  box.replaceChildren(...render().filter(Boolean));
  return box;
}
