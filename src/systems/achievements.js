/**
 * achievements.js — Erfolge prüfen und belohnen.
 *
 * Die Prüfung läuft nach Zustandsänderungen, aber gedrosselt: Erfolge sind
 * kein Echtzeit-System, einmal pro Sekunde reicht völlig und hält die
 * Oberfläche flüssig.
 */

import { ACHIEVEMENTS, achievement } from '../data/achievements.js';
import { getState, update } from '../core/state.js';
import { on, emit, EVENTS } from '../core/events.js';
import { addCoins, addDiamonds } from './economy.js';
import { addItem } from './inventory.js';
import { addEgg } from './eggs.js';

let letzterCheck = 0;

/**
 * Prüft alle noch nicht freigeschalteten Erfolge.
 * @returns {object[]} die neu freigeschalteten Erfolge
 */
export function checkAchievements() {
  const state = getState();
  const neu = [];

  for (const eintrag of ACHIEVEMENTS) {
    if (state.erfolge[eintrag.id]) continue;
    let erfuellt = false;
    try {
      erfuellt = Boolean(eintrag.pruef(state));
    } catch (error) {
      console.error(`Erfolg "${eintrag.id}" konnte nicht geprüft werden:`, error);
    }
    if (erfuellt) neu.push(eintrag);
  }

  for (const eintrag of neu) {
    update((s) => {
      s.erfolge[eintrag.id] = Date.now();
    });
    grantReward(eintrag.belohnung);
    emit(EVENTS.ACHIEVEMENT_UNLOCKED, { erfolg: eintrag });
  }

  return neu;
}

function grantReward(belohnung) {
  if (!belohnung) return;
  if (belohnung.muenzen) addCoins(belohnung.muenzen, 'erfolg');
  if (belohnung.diamanten) addDiamonds(belohnung.diamanten, 'erfolg');
  if (belohnung.item) addItem(belohnung.item, 1);
  if (belohnung.ei) addEgg(belohnung.ei);
}

/** Fortschritt eines Erfolgs als [aktuell, ziel] oder null. */
export function achievementProgress(id) {
  const eintrag = achievement(id);
  if (!eintrag?.fortschritt) return null;
  try {
    return eintrag.fortschritt(getState());
  } catch {
    return null;
  }
}

/** Anzahl freigeschalteter Erfolge. */
export function unlockedCount(state = getState()) {
  return Object.keys(state.erfolge).length;
}

/** Hängt die Erfolgsprüfung an Zustandsänderungen. */
export function installAchievementSystem() {
  on(EVENTS.STATE_CHANGED, () => {
    const jetzt = Date.now();
    if (jetzt - letzterCheck < 1000) return;
    letzterCheck = jetzt;
    checkAchievements();
  });

  // Direkt beim Start einmal prüfen (z. B. nach einem Import).
  checkAchievements();
}
