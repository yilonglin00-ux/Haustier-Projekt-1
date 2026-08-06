/**
 * minigames.js — Die Spielhalle.
 *
 * Übersicht mit Bestwerten; ein Klick startet das Spiel an derselben Stelle.
 * Während ein Spiel läuft, zeichnet der Bildschirm sich nicht neu — sonst
 * würde jede Zustandsänderung die laufende Partie zerstören.
 */

import { h, formatNumber } from '../../core/util.js';
import { getState, activePet } from '../../core/state.js';
import { item } from '../../data/items.js';
import { eggType } from '../../data/eggs.js';
import { MINIGAMES, MINIGAME_ORDER, finishMinigame, gameStats } from '../../systems/minigames.js';
import { celebrate } from '../../render/fx.js';
import { createReactionGame } from '../minigames/reaction.js';
import { createMemoryGame } from '../minigames/memory.js';
import { createObstacleGame } from '../minigames/obstacle.js';
import { createCollectGame } from '../minigames/collect.js';
import { createQuizGame } from '../minigames/quiz.js';
import { registerScreen, refresh } from '../router.js';
import { openModal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { petLabel } from '../../systems/pets.js';

const FABRIKEN = {
  reaktion: createReactionGame,
  memory: createMemoryGame,
  hindernis: createObstacleGame,
  sammeln: createCollectGame,
  quiz: createQuizGame,
};

let aktiv = null;
let laufendesSpiel = null;

function render() {
  if (aktiv) return renderSpiel(aktiv);
  return renderUebersicht();
}

function renderUebersicht() {
  const state = getState();
  const pet = activePet(state);

  return h(
    'div.col',
    h('div.screen__head', h('div.screen__title', h('h1', '🎮 Spielhalle'))),
    h(
      'p.small.muted',
      pet
        ? `Erfahrung geht an ${petLabel(pet)}. Münzen, Gegenstände und manchmal ein Ei gibt es obendrauf.`
        : 'Spiele bringen Münzen, Erfahrung und gelegentlich seltene Funde.'
    ),
    h(
      'div.grid.grid--wide',
      MINIGAME_ORDER.map((id) => {
        const def = MINIGAMES[id];
        const stats = gameStats(id, state);
        return h(
          'button.pet-card',
          {
            onclick: () => {
              aktiv = id;
              refresh();
            },
          },
          h('div.pet-card__art', { style: { height: '58px', fontSize: '2.4rem' } }, def.icon),
          h('div.pet-card__name', { style: { justifyContent: 'center' } }, def.name),
          h('p.tiny.faint.center', def.text),
          h(
            'div.row',
            { style: { justifyContent: 'center' } },
            h('span.chip', `🏆 ${formatNumber(stats.bestwert)}`),
            h('span.chip', `${stats.siege}/${stats.spiele} Siege`)
          )
        );
      })
    )
  );
}

function renderSpiel(gameId) {
  const def = MINIGAMES[gameId];
  const spiel = FABRIKEN[gameId]((ergebnis) => beenden(gameId, ergebnis));
  laufendesSpiel = spiel;

  return h(
    'div.col',
    h(
      'div.screen__head',
      h('div.screen__title', h('h1', `${def.icon} ${def.name}`)),
      h('button.btn.btn--sm', { onclick: abbrechen }, '✕ Beenden')
    ),
    spiel
  );
}

function abbrechen() {
  laufendesSpiel?.abbrechen?.();
  laufendesSpiel = null;
  aktiv = null;
  refresh();
}

function beenden(gameId, ergebnis) {
  const belohnung = finishMinigame(gameId, ergebnis);
  laufendesSpiel = null;
  aktiv = null;

  if (ergebnis.gewonnen) celebrate(belohnung.ei ? 1.6 : 1);

  openModal({
    title: ergebnis.gewonnen ? 'Gewonnen!' : 'Vorbei',
    icon: ergebnis.gewonnen ? '🏆' : '🎮',
    body: h(
      'div.col',
      { style: { alignItems: 'center', textAlign: 'center' } },
      h('h2', `${formatNumber(ergebnis.punkte)} Punkte`),
      ergebnis.detail ? h('p.muted', ergebnis.detail) : null,
      belohnung.bestwert ? h('p', { style: { color: 'var(--accent)' } }, '🌟 Neuer Bestwert!') : null,
      h(
        'div.row',
        { style: { justifyContent: 'center' } },
        belohnung.muenzen ? h('span.chip.chip--wallet', '🪙', `+${formatNumber(belohnung.muenzen)}`) : null,
        belohnung.xp ? h('span.chip.chip--wallet', '✨', `+${formatNumber(belohnung.xp)} EP`) : null,
        belohnung.diamanten ? h('span.chip.chip--wallet', '💎', `+${belohnung.diamanten}`) : null
      ),
      belohnung.item ? h('p', `Fundstück: ${item(belohnung.item).icon} ${item(belohnung.item).name}`) : null,
      belohnung.ei ? h('p', { style: { color: 'var(--good)' } }, `Ein ${eggType(belohnung.ei).name} liegt im Brutkasten!`) : null
    ),
    actions: [
      {
        label: 'Nochmal',
        onClick: () => {
          aktiv = gameId;
          refresh();
        },
      },
      { label: 'Zur Übersicht', variant: 'primary', onClick: () => refresh() },
    ],
  });

  refresh();
}

registerScreen({
  id: 'spiele',
  label: 'Spiele',
  icon: '🎮',
  order: 35,
  primary: true,
  // Während einer Partie darf der Bildschirm nicht automatisch neu zeichnen.
  live: false,
  render,
  onLeave: () => {
    laufendesSpiel?.abbrechen?.();
    laufendesSpiel = null;
    aktiv = null;
  },
});

export { render as renderMinigameScreen };
