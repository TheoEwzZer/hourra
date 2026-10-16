// Fenêtres modales, confirmations et notifications « toast ».
import { h, icon } from './util.js';

const root = () => document.getElementById('modal-root');

/**
 * Ouvre une modale. Renvoie { close, el }.
 * opts: { title, body (Node), actions: [{label, primary, danger, onClick -> false pour garder ouvert}], wide, onClose, className }
 */
export function openModal(opts) {
  const close = () => {
    backdrop.classList.add('closing');
    setTimeout(() => backdrop.remove(), 160);
    removeEventListener('keydown', onKey);
    opts.onClose?.();
  };
  const onKey = (e) => {
    if (e.key === 'Escape' && root().lastElementChild === backdrop) close();
  };
  const actions = (opts.actions || []).map((a) =>
    h('button.btn' + (a.primary ? '.btn-primary' : '') + (a.danger ? '.btn-danger' : '') + (a.flat ? '.btn-flat' : ''), {
      onclick: async () => {
        const r = await a.onClick?.();
        if (r !== false) close();
      },
    }, a.icon ? icon(a.icon) : null, a.label)
  );
  const card = h('div.modal' + (opts.wide ? '.modal-wide' : '') + (opts.className ? '.' + opts.className : ''),
    null,
    opts.title != null && h('div.modal-head', null,
      h('div.modal-title', null, opts.title),
      opts.headExtra || null,
      h('button.icon-btn', { title: 'Fermer', onclick: close }, icon('close'))),
    h('div.modal-body', null, opts.body),
    actions.length ? h('div.modal-actions', null, actions) : null
  );
  const backdrop = h('div.modal-backdrop', { onmousedown: (e) => { if (e.target === backdrop) close(); } }, card);
  root().append(backdrop);
  addEventListener('keydown', onKey);
  requestAnimationFrame(() => card.querySelector('input:not([type=color]):not([type=checkbox]):not([type=range]), textarea')?.focus());
  return { close, el: card };
}

export function confirmDialog({ title, message, okLabel = 'Supprimer', danger = true }) {
  return new Promise((resolve) => {
    let done = false;
    openModal({
      title,
      body: h('p.confirm-msg', null, message),
      onClose: () => { if (!done) resolve(false); },
      actions: [
        { label: 'Annuler', flat: true, onClick: () => { done = true; resolve(false); } },
        { label: okLabel, primary: !danger, danger, onClick: () => { done = true; resolve(true); } },
      ],
    });
  });
}

export function promptDialog({ title, label, value = '', placeholder = '', okLabel = 'Valider' }) {
  return new Promise((resolve) => {
    let done = false;
    const input = h('input.field', { type: 'text', value, placeholder });
    const submit = () => {
      const v = input.value.trim();
      if (!v) return false;
      done = true;
      resolve(v);
    };
    const m = openModal({
      title,
      body: h('label.field-wrap', null, h('span.field-label', null, label), input),
      onClose: () => { if (!done) resolve(null); },
      actions: [
        { label: 'Annuler', flat: true },
        { label: okLabel, primary: true, onClick: submit },
      ],
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && submit() !== false) m.close();
    });
  });
}

export function toast(message, { icon: ic = 'check_circle', ms = 2600, action } = {}) {
  const el = h('div.toast', null, icon(ic), h('span', null, message),
    action ? h('button.btn.btn-flat.toast-action', { onclick: () => { action.onClick(); el.remove(); } }, action.label) : null);
  document.getElementById('toast-root').append(el);
  setTimeout(() => el.classList.add('out'), ms);
  setTimeout(() => el.remove(), ms + 400);
}
