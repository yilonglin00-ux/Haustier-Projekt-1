/**
 * fx.js — Kurzlebige Bildschirmeffekte.
 *
 * Alles läuft in einer eigenen Ebene über dem Spiel (`#fx-root`) und räumt
 * sich selbst auf. Die Effekte sind rein visuell — sie halten nie Zustand.
 * Bei reduzierter Bewegung fallen sie automatisch weg.
 */

import { h } from '../core/util.js';
import { randFloat, randInt } from '../core/rng.js';

function root() {
  return document.getElementById('fx-root');
}

function motionReduced() {
  return (
    document.documentElement.dataset.motion === 'reduced' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Zeigt aufsteigenden Text — z. B. „+12 XP" oder „🍖 satt".
 * @param {string} text
 * @param {{x:number,y:number}} at Bildschirmkoordinaten
 * @param {{farbe?:string}} [options]
 */
export function floatText(text, at, options = {}) {
  const host = root();
  if (!host || motionReduced()) return;

  const node = h(
    'div.fx-float',
    {
      style: {
        left: `${at.x}px`,
        top: `${at.y}px`,
        color: options.farbe || 'var(--accent)',
        transform: 'translate(-50%, -50%)',
      },
    },
    text
  );
  host.appendChild(node);
  setTimeout(() => node.remove(), 1200);
}

/** Wie `floatText`, aber bezogen auf ein Element. */
export function floatAt(element, text, options = {}) {
  if (!element) return;
  const box = element.getBoundingClientRect();
  floatText(text, { x: box.left + box.width / 2, y: box.top + box.height * 0.35 }, options);
}

/**
 * Kleiner Ausbruch aus Symbolen (Herzen beim Streicheln, Krümel beim Füttern …).
 * @param {HTMLElement} element Ursprung
 * @param {string[]} symbole
 * @param {number} anzahl
 */
export function burst(element, symbole, anzahl = 8) {
  const host = root();
  if (!host || !element || motionReduced()) return;

  const box = element.getBoundingClientRect();
  const cx = box.left + box.width / 2;
  const cy = box.top + box.height / 2;

  for (let i = 0; i < anzahl; i += 1) {
    const symbol = symbole[i % symbole.length];
    const node = h(
      'div.fx-particle',
      {
        style: {
          left: `${cx + randFloat(-box.width * 0.3, box.width * 0.3)}px`,
          top: `${cy + randFloat(-box.height * 0.2, box.height * 0.2)}px`,
          '--dx': `${randInt(-70, 70)}px`,
          '--dy': `${randInt(-110, -40)}px`,
          '--dr': `${randInt(-220, 220)}deg`,
          animationDelay: `${i * 45}ms`,
          fontSize: `${randFloat(0.9, 1.5).toFixed(2)}rem`,
        },
      },
      symbol
    );
    host.appendChild(node);
    setTimeout(() => node.remove(), 1200 + i * 45);
  }
}

/** Großer Jubel-Effekt — für Entwicklungen, Schlüpfen und seltene Funde. */
export function celebrate(intensitaet = 1) {
  const host = root();
  if (!host || motionReduced()) return;

  const symbole = ['✨', '⭐', '🎉', '💫', '🌟'];
  const anzahl = Math.round(24 * intensitaet);

  for (let i = 0; i < anzahl; i += 1) {
    const node = h(
      'div.fx-particle',
      {
        style: {
          left: `${randFloat(10, 90)}vw`,
          top: `${randFloat(20, 70)}vh`,
          '--dx': `${randInt(-120, 120)}px`,
          '--dy': `${randInt(-200, -60)}px`,
          '--dr': `${randInt(-360, 360)}deg`,
          animationDelay: `${i * 28}ms`,
          animationDuration: '1.4s',
          fontSize: `${randFloat(1, 2).toFixed(2)}rem`,
        },
      },
      symbole[i % symbole.length]
    );
    host.appendChild(node);
    setTimeout(() => node.remove(), 1600 + i * 28);
  }
}

/** Kurzes Aufblitzen des Bildschirms — Höhepunkt einer Entwicklung. */
export function flash(farbe = '#ffffff', dauer = 500) {
  const host = root();
  if (!host || motionReduced()) return;

  const node = h('div', {
    style: {
      position: 'fixed',
      inset: '0',
      background: farbe,
      opacity: '0',
      transition: `opacity ${dauer / 2}ms ease-out`,
      pointerEvents: 'none',
    },
  });
  host.appendChild(node);
  requestAnimationFrame(() => {
    node.style.opacity = '0.85';
    setTimeout(() => {
      node.style.opacity = '0';
      setTimeout(() => node.remove(), dauer / 2 + 50);
    }, dauer / 2);
  });
}

/** Symbole, die zu einer Aktion passen. */
export const ACTION_PARTICLES = {
  fuettern: ['🍖', '✨', '😋'],
  traenken: ['💧', '💦', '✨'],
  streicheln: ['💗', '💞', '✨'],
  spielen: ['🎾', '⭐', '😸'],
  training: ['💪', '🔥', '⚡'],
  schlafen: ['💤', '🌙', '✨'],
  baden: ['🫧', '🧼', '💦'],
  spazieren: ['🍃', '👣', '✨'],
  medizin: ['💊', '💚', '✨'],
  foto: ['📸', '✨', '⭐'],
};
