/**
 * memory.js — Memory mit Kreaturen.
 *
 * Acht Paare. Die Motive kommen aus der eigenen Sammlung, wenn sie groß genug
 * ist — dadurch fühlt sich das Spiel wie ein Teil des Fabelgartens an und
 * nicht wie ein beliebiges Beiwerk.
 */

import { h } from '../../core/util.js';
import { getState } from '../../core/state.js';
import { SPECIES, species } from '../../data/species.js';
import { shuffle, pickMany } from '../../core/rng.js';
import { spriteMarkup } from '../../render/petSprite.js';

const PAARE = 8;

export function createMemoryGame(onEnd) {
  const motive = waehleMotive();
  const karten = shuffle([...motive, ...motive]).map((artId, index) => ({
    id: index,
    artId,
    offen: false,
    gefunden: false,
  }));

  let erste = null;
  let sperre = false;
  let zuege = 0;
  let gefunden = 0;

  const info = h('p.muted.center', 'Finde alle acht Paare.');
  const brett = h('div.grid', {
    style: { gridTemplateColumns: 'repeat(4, 1fr)', maxWidth: '460px', margin: '0 auto', width: '100%' },
  });

  const host = h('div.col', h('h2.center', '🃏 Memory'), info, brett);

  function zeichne() {
    brett.replaceChildren(
      ...karten.map((karte) => {
        const sichtbar = karte.offen || karte.gefunden;
        return h(
          'button.tile',
          {
            style: {
              aspectRatio: '1',
              padding: '4px',
              opacity: karte.gefunden ? '.55' : '1',
              background: sichtbar ? 'var(--surface)' : 'var(--surface-3)',
            },
            'aria-label': sichtbar ? species(karte.artId).name : 'Verdeckte Karte',
            onclick: () => aufdecken(karte),
          },
          sichtbar
            ? h('div.sprite', { style: { width: '100%', height: '100%' }, html: spriteMarkup({ artId: karte.artId }, { schatten: false, effekte: false }) })
            : h('span', { style: { fontSize: '1.8rem' } }, '❔')
        );
      })
    );
    info.textContent = `Züge: ${zuege} · Paare: ${gefunden}/${PAARE}`;
  }

  function aufdecken(karte) {
    if (sperre || karte.offen || karte.gefunden) return;
    karte.offen = true;

    if (!erste) {
      erste = karte;
      zeichne();
      return;
    }

    zuege += 1;
    zeichne();

    if (erste.artId === karte.artId) {
      erste.gefunden = true;
      karte.gefunden = true;
      erste = null;
      gefunden += 1;
      zeichne();
      if (gefunden === PAARE) setTimeout(beenden, 500);
      return;
    }

    sperre = true;
    setTimeout(() => {
      erste.offen = false;
      karte.offen = false;
      erste = null;
      sperre = false;
      zeichne();
    }, 800);
  }

  function beenden() {
    // Perfekt wären 8 Züge; alles unter 18 gilt als Sieg.
    const punkte = Math.max(5, Math.round(120 - (zuege - PAARE) * 6));
    onEnd({ punkte, gewonnen: zuege <= 18, detail: `${zuege} Züge` });
  }

  zeichne();
  return host;
}

/** Motive: bevorzugt entdeckte Arten, sonst die Starter und Grundformen. */
function waehleMotive() {
  const state = getState();
  const entdeckt = Object.keys(state.buch).filter((id) => state.buch[id]?.gefangen);

  if (entdeckt.length >= PAARE) return pickMany(entdeckt, PAARE);

  const auffuellen = SPECIES.filter((art) => art.stufe === 1).map((art) => art.id);
  return pickMany([...new Set([...entdeckt, ...auffuellen])], PAARE);
}
