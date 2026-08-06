/**
 * minigames.js — Belohnungen und Statistik der Minispiele.
 *
 * Die Spiele selbst stehen in `ui/minigames/`. Hier steht nur, was ein
 * Ergebnis wert ist — an einer Stelle, damit die fünf Spiele fair zueinander
 * bleiben.
 */

import { getState, update, activePet } from '../core/state.js';
import { emit, EVENTS } from '../core/events.js';
import { chance, pick } from '../core/rng.js';
import { addCoins, addDiamonds } from './economy.js';
import { addItem } from './inventory.js';
import { addEgg, freeSlots } from './eggs.js';
import { grantXp } from './pets.js';

/** Die fünf Minispiele. */
export const MINIGAMES = {
  reaktion: {
    id: 'reaktion', name: 'Reaktion', icon: '⚡',
    text: 'Klicke, sobald das Signal erscheint. Fünf Runden, je schneller desto besser.',
    muenzenProPunkt: 1.6, xpProPunkt: 1.1,
  },
  memory: {
    id: 'memory', name: 'Memory', icon: '🃏',
    text: 'Finde alle Paare. Je weniger Züge du brauchst, desto größer die Belohnung.',
    muenzenProPunkt: 1.4, xpProPunkt: 1.2,
  },
  hindernis: {
    id: 'hindernis', name: 'Hindernislauf', icon: '🏃',
    text: 'Ein Knopf, ein Sprung. Weiche aus, solange du kannst.',
    muenzenProPunkt: 1.8, xpProPunkt: 1.4,
  },
  sammeln: {
    id: 'sammeln', name: 'Sammelspiel', icon: '🧺',
    text: 'Fange, was vom Himmel fällt — aber nicht alles ist gut für dich.',
    muenzenProPunkt: 1.5, xpProPunkt: 1.2,
  },
  quiz: {
    id: 'quiz', name: 'Quiz', icon: '❓',
    text: 'Fragen über deine Sammlung und den Fabelgarten. Wissen zahlt sich aus.',
    muenzenProPunkt: 2.2, xpProPunkt: 1.6,
  },
};

export const MINIGAME_ORDER = ['reaktion', 'memory', 'hindernis', 'sammeln', 'quiz'];

/**
 * Wertet ein Spielergebnis aus und verteilt die Belohnung.
 *
 * @param {string} gameId
 * @param {{punkte:number, gewonnen:boolean, detail?:string}} ergebnis
 * @returns {{muenzen:number, xp:number, diamanten:number, item:?string, ei:?string, bestwert:boolean}}
 */
export function finishMinigame(gameId, ergebnis) {
  const def = MINIGAMES[gameId];
  const punkte = Math.max(0, Math.round(ergebnis.punkte || 0));
  const gewonnen = Boolean(ergebnis.gewonnen);

  const muenzen = Math.round(punkte * def.muenzenProPunkt * (gewonnen ? 1.5 : 0.6));
  const xp = Math.round(punkte * def.xpProPunkt * (gewonnen ? 1.5 : 0.6));

  const belohnung = { muenzen: 0, xp: 0, diamanten: 0, item: null, ei: null, bestwert: false };

  // Statistik und Bestwert
  update((s) => {
    const eintrag = s.statistik.minispiele[gameId] || { spiele: 0, siege: 0, bestwert: 0 };
    eintrag.spiele += 1;
    if (gewonnen) eintrag.siege += 1;
    if (punkte > eintrag.bestwert) {
      eintrag.bestwert = punkte;
      belohnung.bestwert = true;
    }
    s.statistik.minispiele[gameId] = eintrag;
    if (gewonnen) s.statistik.minispieleGewonnen += 1;
  });

  belohnung.muenzen = addCoins(muenzen, `minispiel:${gameId}`);

  const pet = activePet();
  if (pet && xp > 0) {
    grantXp(pet.id, xp);
    belohnung.xp = xp;
  }

  // Seltene Zusatzbelohnungen — nur beim Sieg.
  if (gewonnen) {
    if (chance(0.18)) {
      belohnung.diamanten = addDiamonds(1, 'minispiel');
    }
    if (chance(0.35)) {
      belohnung.item = pick(['beere', 'apfel', 'wasserflasche', 'heilkraut', 'honigwabe', 'mondbeere', 'erfahrungsbonbon']);
      addItem(belohnung.item, 1);
    }
    if (chance(0.12) && freeSlots() > 0) {
      belohnung.ei = punkte > 60 ? 'selten' : 'normal';
      addEgg(belohnung.ei);
    }
  }

  emit(EVENTS.MINIGAME_FINISHED, { gameId, punkte, gewonnen, belohnung });
  return belohnung;
}

/** Bestwert eines Spiels. */
export function bestScore(gameId, state = getState()) {
  return state.statistik.minispiele[gameId]?.bestwert || 0;
}

/** Wie oft ein Spiel gespielt und gewonnen wurde. */
export function gameStats(gameId, state = getState()) {
  return state.statistik.minispiele[gameId] || { spiele: 0, siege: 0, bestwert: 0 };
}
