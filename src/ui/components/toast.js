/**
 * toast.js — Kurze Rückmeldungen am unteren Bildschirmrand.
 * Bewusst schlicht: eine Zeile, ein Symbol, verschwindet von selbst.
 */

import { h } from '../../core/util.js';

const MAX_VISIBLE = 4;

function root() {
  return document.getElementById('toast-root');
}

/**
 * Zeigt einen Hinweis.
 * @param {string} message Text
 * @param {{icon?:string, type?:'info'|'good'|'bad'|'rare', duration?:number}} [options]
 */
export function toast(message, options = {}) {
  const { icon = '', type = 'info', duration = 2600 } = options;
  const host = root();
  if (!host) return;

  // Ältere Hinweise wegräumen, damit der Bildschirm nicht zuläuft.
  while (host.children.length >= MAX_VISIBLE) {
    host.firstElementChild.remove();
  }

  const node = h(
    'div.toast',
    { class: `toast--${type}`, role: 'status' },
    icon ? h('span', { 'aria-hidden': 'true' }, icon) : null,
    h('span', message)
  );

  host.appendChild(node);

  setTimeout(() => {
    node.classList.add('toast--leaving');
    setTimeout(() => node.remove(), 300);
  }, duration);
}

/** Hinweis über einen Fund — hebt Seltenes hervor. */
export function toastReward(text, icon = '🎁', rare = false) {
  toast(text, { icon, type: rare ? 'rare' : 'good', duration: rare ? 3600 : 2600 });
}
