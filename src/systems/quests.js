/**
 * quests.js — Tagesaufgaben.
 *
 * Die Aufgaben des Tages werden aus dem Datum gesät: Ein Neuladen ändert sie
 * nicht, ein neuer Tag schon. Fortschritt kommt über Ereignisse herein, die
 * Belohnung holt der Spieler bewusst ab.
 */

import { QUEST_TEMPLATES, QUESTS_PER_DAY, DAILY_BONUS, questTemplate } from '../data/quests.js';
import { getState, update } from '../core/state.js';
import { on, emit, EVENTS } from '../core/events.js';
import { dayKey, clamp } from '../core/util.js';
import { seededRandom, weightedPick, pick } from '../core/rng.js';
import { addCoins, addDiamonds } from './economy.js';
import { addItem } from './inventory.js';
import { addEgg } from './eggs.js';
import { activePet } from '../core/state.js';
import { grantXp } from './pets.js';

/** Stellt sicher, dass für heute Aufgaben existieren. */
export function ensureTodaysQuests() {
  const heute = dayKey();
  const state = getState();
  if (state.aufgaben.tag === heute && state.aufgaben.liste?.length) return;

  const rand = seededRandom(`quests:${heute}`);
  const vorrat = [...QUEST_TEMPLATES];
  const gewaehlt = [];

  while (gewaehlt.length < QUESTS_PER_DAY && vorrat.length) {
    const eintrag = weightedPick(vorrat, rand);
    vorrat.splice(vorrat.indexOf(eintrag), 1);
    gewaehlt.push({
      vorlage: eintrag.id,
      ziel: pick(eintrag.ziele, rand),
      fortschritt: 0,
      abgeholt: false,
    });
  }

  update((s) => {
    s.aufgaben.tag = heute;
    s.aufgaben.liste = gewaehlt;
    s.aufgaben.minutenHeute = 0;
    s.aufgaben.bonusAbgeholt = false;
  });
}

/** Ist eine Aufgabe erfüllt? */
export function isComplete(quest) {
  return quest.fortschritt >= quest.ziel;
}

/** Sind alle Aufgaben des Tages erledigt? */
export function allComplete(state = getState()) {
  return state.aufgaben.liste?.length > 0 && state.aufgaben.liste.every(isComplete);
}

/** Anzahl abholbarer Belohnungen — für das Abzeichen in der Navigation. */
export function claimableCount(state = getState()) {
  const offen = (state.aufgaben.liste || []).filter((q) => isComplete(q) && !q.abgeholt).length;
  const bonus = allComplete(state) && !state.aufgaben.bonusAbgeholt ? 1 : 0;
  return offen + bonus;
}

/**
 * Erhöht den Fortschritt eines Zählers.
 * Alle Aufgaben, die auf diesen Zähler hören, rücken vor.
 */
export function advanceQuest(zaehler, menge = 1) {
  const state = getState();
  if (!state.aufgaben.liste?.length) return;

  let veraendert = false;
  update((s) => {
    for (const quest of s.aufgaben.liste) {
      const vorlage = questTemplate(quest.vorlage);
      if (vorlage?.zaehler !== zaehler || isComplete(quest)) continue;
      quest.fortschritt = clamp(quest.fortschritt + menge, 0, quest.ziel);
      veraendert = true;
      if (isComplete(quest)) emit(EVENTS.QUEST_COMPLETED, { quest });
    }
  });

  if (veraendert) emit(EVENTS.QUEST_PROGRESS, { zaehler, menge });
}

/**
 * Holt die Belohnung einer erledigten Aufgabe ab.
 * @returns {{ok:boolean, belohnung?:object, grund?:string}}
 */
export function claimQuest(index) {
  const state = getState();
  const quest = state.aufgaben.liste?.[index];
  if (!quest) return { ok: false, grund: 'Aufgabe nicht gefunden.' };
  if (!isComplete(quest)) return { ok: false, grund: 'Noch nicht erledigt.' };
  if (quest.abgeholt) return { ok: false, grund: 'Bereits abgeholt.' };

  const vorlage = questTemplate(quest.vorlage);
  update((s) => {
    s.aufgaben.liste[index].abgeholt = true;
  });

  grantReward(vorlage.belohnung);
  return { ok: true, belohnung: vorlage.belohnung };
}

/** Holt den Tagesbonus ab, wenn alle Aufgaben erledigt sind. */
export function claimDailyBonus() {
  const state = getState();
  if (!allComplete(state)) return { ok: false, grund: 'Erst alle Aufgaben erledigen.' };
  if (state.aufgaben.bonusAbgeholt) return { ok: false, grund: 'Bereits abgeholt.' };

  update((s) => {
    s.aufgaben.bonusAbgeholt = true;
  });
  grantReward(DAILY_BONUS);
  return { ok: true, belohnung: DAILY_BONUS };
}

/** Verteilt eine Belohnung. */
function grantReward(belohnung) {
  if (!belohnung) return;
  if (belohnung.muenzen) addCoins(belohnung.muenzen, 'aufgabe');
  if (belohnung.diamanten) addDiamonds(belohnung.diamanten, 'aufgabe');
  if (belohnung.item) addItem(belohnung.item, 1);
  if (belohnung.ei) addEgg(belohnung.ei);
  if (belohnung.xp) {
    const pet = activePet();
    if (pet) grantXp(pet.id, belohnung.xp);
  }
}

/** Lesbare Belohnung für die Anzeige. */
export function rewardText(belohnung) {
  const teile = [];
  if (belohnung.muenzen) teile.push(`${belohnung.muenzen} 🪙`);
  if (belohnung.diamanten) teile.push(`${belohnung.diamanten} 💎`);
  if (belohnung.xp) teile.push(`${belohnung.xp} EP`);
  if (belohnung.item) teile.push('1 Gegenstand');
  if (belohnung.ei) teile.push('1 Ei');
  return teile.join(' · ');
}

/** Verbindet die Aufgaben mit dem Spielgeschehen. */
export function installQuestSystem() {
  ensureTodaysQuests();

  on(EVENTS.DAY_ROLLOVER, ensureTodaysQuests);

  on(EVENTS.PET_ACTION, ({ actionId }) => {
    advanceQuest('aktionen');
    advanceQuest(actionId);
  });

  on(EVENTS.ITEM_USED, () => advanceQuest('gegenstaende'));
  on(EVENTS.EGG_HATCHED, () => advanceQuest('eier'));
  on(EVENTS.EXPEDITION_DONE, () => advanceQuest('expeditionen'));

  on(EVENTS.MINIGAME_FINISHED, ({ gewonnen }) => {
    advanceQuest('minispiele');
    if (gewonnen) advanceQuest('minispielSiege');
  });

  on(EVENTS.COINS_CHANGED, ({ delta }) => {
    if (delta > 0) advanceQuest('muenzen', delta);
  });

  // Spielzeit: einmal pro Minute nachziehen.
  let letzteMinute = 0;
  on(EVENTS.STATE_CHANGED, (s) => {
    const minuten = Math.floor(s.aufgaben.minutenHeute || 0);
    if (minuten > letzteMinute) {
      advanceQuest('minuten', minuten - letzteMinute);
      letzteMinute = minuten;
    }
  });
}
