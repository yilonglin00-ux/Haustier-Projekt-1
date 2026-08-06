/**
 * reaction.js — Reaktionsspiel.
 *
 * Fünf Runden. Nach zufälliger Wartezeit wechselt die Fläche die Farbe; wer
 * schneller klickt, bekommt mehr Punkte. Zu frühes Klicken kostet eine Runde.
 */

import { h, replace } from '../../core/util.js';
import { randInt } from '../../core/rng.js';

const RUNDEN = 5;

/**
 * @param {(ergebnis:{punkte:number, gewonnen:boolean, detail:string})=>void} onEnd
 * @returns {HTMLElement}
 */
export function createReactionGame(onEnd) {
  let runde = 0;
  let zeiten = [];
  let zustand = 'warten'; // warten | bereit | pause
  let startZeit = 0;
  let timer = null;

  const flaeche = h('button', {
    style: {
      width: '100%',
      minHeight: '260px',
      borderRadius: 'var(--r-lg)',
      background: 'var(--surface-2)',
      border: '2px solid var(--border)',
      fontSize: '1.3rem',
      fontWeight: '700',
      transition: 'background 120ms',
    },
  });

  const info = h('p.muted.center');
  const host = h('div.col', h('h2.center', '⚡ Reaktion'), info, flaeche);

  function setzeInfo() {
    replace(
      info,
      `Runde ${Math.min(runde + 1, RUNDEN)} von ${RUNDEN}` +
        (zeiten.length ? ` · Schnitt ${Math.round(zeiten.reduce((a, b) => a + b, 0) / zeiten.length)} ms` : '')
    );
  }

  function naechsteRunde() {
    if (runde >= RUNDEN) {
      beenden();
      return;
    }
    zustand = 'warten';
    flaeche.style.background = 'var(--surface-2)';
    flaeche.textContent = 'Warte auf das Signal …';
    setzeInfo();

    timer = setTimeout(() => {
      zustand = 'bereit';
      startZeit = performance.now();
      flaeche.style.background = 'var(--good)';
      flaeche.textContent = 'JETZT!';
    }, randInt(1200, 3400));
  }

  flaeche.addEventListener('click', () => {
    if (zustand === 'warten') {
      clearTimeout(timer);
      zeiten.push(900); // Fehlstart zählt als sehr langsame Runde
      runde += 1;
      flaeche.style.background = 'var(--bad)';
      flaeche.textContent = 'Zu früh!';
      setTimeout(naechsteRunde, 900);
      return;
    }
    if (zustand !== 'bereit') return;

    const zeit = Math.round(performance.now() - startZeit);
    zeiten.push(zeit);
    runde += 1;
    zustand = 'pause';
    flaeche.style.background = 'var(--surface-3)';
    flaeche.textContent = `${zeit} ms`;
    setTimeout(naechsteRunde, 700);
  });

  function beenden() {
    const schnitt = zeiten.reduce((a, b) => a + b, 0) / zeiten.length;
    // 200 ms ≈ sehr gut, 700 ms ≈ schwach.
    const punkte = Math.max(0, Math.round((800 - schnitt) / 6));
    onEnd({
      punkte,
      gewonnen: schnitt < 480,
      detail: `Durchschnitt: ${Math.round(schnitt)} ms`,
    });
  }

  naechsteRunde();
  host.abbrechen = () => clearTimeout(timer);
  return host;
}
