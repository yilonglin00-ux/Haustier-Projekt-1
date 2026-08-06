/**
 * quiz.js — Wissensspiel.
 *
 * Sechs Fragen, teils fest, teils aus der eigenen Sammlung erzeugt. Wer sein
 * Haustierbuch liest, ist klar im Vorteil — genau so soll es sein.
 */

import { h, replace } from '../../core/util.js';
import { getState } from '../../core/state.js';
import { buildQuizRound } from '../../data/quiz.js';

const FRAGEN = 6;

export function createQuizGame(onEnd) {
  const state = getState();
  const entdeckt = Object.keys(state.buch).filter((id) => state.buch[id]?.gefangen);
  const fragen = buildQuizRound(FRAGEN, entdeckt);

  let index = 0;
  let richtig = 0;
  let gesperrt = false;

  const fortschritt = h('div.progress', h('div.progress__fill', { style: { width: '0%' } }));
  const frageText = h('h3.center');
  const antworten = h('div.col');
  const host = h(
    'div.col',
    h('h2.center', '❓ Quiz'),
    fortschritt,
    h('div.card', frageText, h('div', { style: { height: '.75rem' } }), antworten)
  );

  function zeige() {
    if (index >= fragen.length) {
      onEnd({
        punkte: richtig * 20,
        gewonnen: richtig >= Math.ceil(FRAGEN * 0.7),
        detail: `${richtig} von ${fragen.length} richtig`,
      });
      return;
    }

    const frage = fragen[index];
    gesperrt = false;
    fortschritt.firstChild.style.width = `${(index / fragen.length) * 100}%`;
    replace(frageText, `${index + 1}. ${frage.frage}`);

    replace(
      antworten,
      ...frage.antworten.map((text, i) =>
        h(
          'button.btn.btn--block',
          {
            onclick: (event) => antworte(event.currentTarget, i, frage),
          },
          text
        )
      )
    );
  }

  function antworte(knopf, gewaehlt, frage) {
    if (gesperrt) return;
    gesperrt = true;

    const korrekt = gewaehlt === frage.richtig;
    if (korrekt) richtig += 1;

    // Richtige Antwort immer zeigen — daraus lernt man etwas.
    Array.from(antworten.children).forEach((node, i) => {
      node.disabled = true;
      if (i === frage.richtig) node.classList.add('btn--primary');
      else if (i === gewaehlt) node.classList.add('btn--danger');
    });

    setTimeout(() => {
      index += 1;
      zeige();
    }, 950);
  }

  zeige();
  return host;
}
