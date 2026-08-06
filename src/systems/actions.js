/**
 * actions.js — Was der Spieler mit seinem Haustier tun kann.
 *
 * Jede Aktion steht in einer Tabelle: was sie kostet, was sie bewirkt, wie
 * lange sie nachwirkt und welche Animation dazugehört. Die Ausführung ist für
 * alle Aktionen dieselbe Funktion — dadurch verhalten sie sich einheitlich und
 * neue Aktionen sind ein Tabelleneintrag.
 */

import { getState, update, petById } from '../core/state.js';
import { emit, EVENTS } from '../core/events.js';
import { clamp, MINUTE } from '../core/util.js';
import { actionFactor } from '../data/personalities.js';
import { homeBonuses } from '../data/rooms.js';
import { item } from '../data/items.js';
import { grantXp, sleepPet, wakePet } from './pets.js';
import { addCoins } from './economy.js';
import { hasItem, inventoryList, useItem } from './inventory.js';

/**
 * @typedef {object} ActionDef
 * @property {string} id
 * @property {string} name
 * @property {string} icon
 * @property {string} text          Kurzbeschreibung für den Knopf
 * @property {object} [kosten]      Bedürfnisse, die die Aktion verbraucht
 * @property {object} [wirkung]     Bedürfnisse/Gefühle, die sie auffüllt
 * @property {number} [xp]          Erfahrung für das Haustier
 * @property {number} [muenzen]     Münzen für den Spieler
 * @property {number} [abklingzeit] Millisekunden bis zur Wiederholung
 * @property {string} [braucht]     Item-Kategorie, die gewählt werden muss
 * @property {string} [animation]   Klasse für die Sprite-Animation
 * @property {string} [bonusSchluessel] Schlüssel für Spielzeug-/Raumboni
 */

export const ACTIONS = {
  fuettern: {
    id: 'fuettern', name: 'Füttern', icon: '🍖', text: 'Stillt den Hunger',
    braucht: 'futter', animation: 'essen', xp: 8, abklingzeit: 0,
  },
  traenken: {
    id: 'traenken', name: 'Wasser', icon: '💧', text: 'Löscht den Durst',
    braucht: 'trank', animation: 'essen', xp: 6, abklingzeit: 0,
  },
  streicheln: {
    id: 'streicheln', name: 'Streicheln', icon: '🤲', text: 'Schenkt Zuneigung',
    wirkung: { stimmung: 8, zuneigung: 3, vertrauen: 2 },
    xp: 4, abklingzeit: 8000, animation: 'streicheln', bonusSchluessel: 'streicheln',
  },
  spielen: {
    id: 'spielen', name: 'Spielen', icon: '🎾', text: 'Macht glücklich',
    kosten: { energie: 8, hunger: 3 },
    wirkung: { stimmung: 16, glueck: 8, zuneigung: 4 },
    xp: 18, muenzen: 6, abklingzeit: 20000, animation: 'spielen', bonusSchluessel: 'spielen',
  },
  training: {
    id: 'training', name: 'Training', icon: '🏋️', text: 'Stärkt Attribute',
    kosten: { energie: 18, hunger: 6, durst: 6, sauberkeit: 5 },
    wirkung: { vertrauen: 3 },
    xp: 42, muenzen: 10, abklingzeit: 45000, animation: 'training', bonusSchluessel: 'training',
    attributChance: 0.55,
  },
  schlafen: {
    id: 'schlafen', name: 'Schlafen', icon: '😴', text: 'Stellt Energie her',
    abklingzeit: 0, animation: null, bonusSchluessel: 'schlafen',
  },
  baden: {
    id: 'baden', name: 'Baden', icon: '🛁', text: 'Macht sauber',
    kosten: { energie: 5 },
    wirkung: { sauberkeit: 55, stimmung: 6, gesundheit: 4 },
    xp: 10, abklingzeit: 30000, animation: 'baden', bonusSchluessel: 'baden',
  },
  spazieren: {
    id: 'spazieren', name: 'Spazieren', icon: '🚶', text: 'Frische Luft und Funde',
    kosten: { energie: 12, hunger: 5, durst: 5, sauberkeit: 8 },
    wirkung: { stimmung: 12, glueck: 6, vertrauen: 3 },
    xp: 26, muenzen: 18, abklingzeit: 90000, animation: 'spielen', bonusSchluessel: 'spazieren',
    fundChance: 0.45,
  },
  medizin: {
    id: 'medizin', name: 'Medizin', icon: '🧪', text: 'Heilt Krankheit',
    braucht: 'medizin', animation: null, xp: 6, abklingzeit: 0,
  },
};

/** Reihenfolge in der Aktionsleiste. */
export const ACTION_ORDER = [
  'fuettern',
  'traenken',
  'streicheln',
  'spielen',
  'training',
  'baden',
  'schlafen',
  'spazieren',
  'medizin',
];

/** Aktionen, für die ein Gegenstand gewählt werden muss. */
export function needsItem(actionId) {
  return Boolean(ACTIONS[actionId]?.braucht);
}

/** Passende Gegenstände für eine Aktion. */
export function itemsForAction(actionId) {
  const def = ACTIONS[actionId];
  if (!def?.braucht) return [];
  if (def.braucht === 'futter') return [...inventoryList('futter'), ...inventoryList('frucht')];
  if (def.braucht === 'trank') return inventoryList('trank');
  if (def.braucht === 'medizin') return inventoryList('medizin');
  return inventoryList(def.braucht);
}

/** Restliche Abklingzeit einer Aktion in Millisekunden. */
export function cooldownLeft(pet, actionId) {
  const bis = pet?.abklingzeiten?.[actionId] || 0;
  return Math.max(0, bis - Date.now());
}

/**
 * Kann die Aktion gerade ausgeführt werden?
 * @returns {{ok:boolean, grund?:string}}
 */
export function canPerform(pet, actionId) {
  const def = ACTIONS[actionId];
  if (!def) return { ok: false, grund: 'Unbekannte Aktion.' };
  if (!pet) return { ok: false, grund: 'Kein Haustier ausgewählt.' };

  if (pet.schlaeft && actionId !== 'schlafen') {
    return { ok: false, grund: `${pet.name} schläft gerade.` };
  }
  if (cooldownLeft(pet, actionId) > 0) {
    return { ok: false, grund: 'Braucht noch einen Moment.' };
  }
  if (actionId === 'medizin' && !pet.krank && pet.beduerfnisse.gesundheit > 85) {
    return { ok: false, grund: `${pet.name} ist kerngesund.` };
  }
  if (def.braucht && !itemsForAction(actionId).length) {
    const was = { futter: 'Futter', trank: 'Getränke', medizin: 'Medizin' }[def.braucht] || 'Gegenstände';
    return { ok: false, grund: `Du hast kein ${was} im Beutel.` };
  }
  for (const [key, value] of Object.entries(def.kosten || {})) {
    if (pet.beduerfnisse[key] < value) {
      return { ok: false, grund: `Zu wenig ${key === 'energie' ? 'Energie' : key}.` };
    }
  }
  return { ok: true };
}

/**
 * Führt eine Aktion aus.
 *
 * @param {string} actionId
 * @param {string} petId
 * @param {{itemId?:string, stunden?:number}} [options]
 * @returns {{ok:boolean, grund?:string, text?:string, effekte?:object, xp?:number, muenzen?:number, fund?:object}}
 */
export function performAction(actionId, petId, options = {}) {
  const def = ACTIONS[actionId];
  const pet = petById(petId);
  const pruefung = canPerform(pet, actionId);
  if (!pruefung.ok) return { ok: false, grund: pruefung.grund };

  // Schlafen ist ein Sonderfall: es schaltet einen Zustand um.
  if (actionId === 'schlafen') return performSleep(pet, options);

  // Aktionen mit Gegenstand reichen an das Inventar weiter.
  if (def.braucht) return performWithItem(def, pet, options);

  const boni = homeBonuses(getState().zuhause);
  const faktor = actionFactor(pet.persoenlichkeit, def.bonusSchluessel || actionId) * spielzeugBonus(def);
  const effekte = {};
  let fund = null;

  update((s) => {
    const ziel = s.haustiere.find((entry) => entry.id === petId);
    if (!ziel) return;

    for (const [key, value] of Object.entries(def.kosten || {})) {
      ziel.beduerfnisse[key] = clamp(ziel.beduerfnisse[key] - value, 0, 100);
    }

    for (const [key, value] of Object.entries(def.wirkung || {})) {
      const menge = value * faktor;
      if (key in ziel.beduerfnisse) {
        ziel.beduerfnisse[key] = clamp(ziel.beduerfnisse[key] + menge, 0, 100);
      } else if (key in ziel.gefuehle) {
        ziel.gefuehle[key] = clamp(ziel.gefuehle[key] + menge, 0, 100);
      }
      effekte[key] = Math.round(menge);
    }

    if (def.abklingzeit) {
      ziel.abklingzeiten = ziel.abklingzeiten || {};
      ziel.abklingzeiten[actionId] = Date.now() + def.abklingzeit;
    }

    ziel.aktionen[actionId] = (ziel.aktionen[actionId] || 0) + 1;
    ziel.gesamtAktionen += 1;

    s.statistik.aktionen[actionId] = (s.statistik.aktionen[actionId] || 0) + 1;
    s.statistik.aktionenGesamt += 1;
  });

  // Training verbessert manchmal dauerhaft ein Attribut.
  if (def.attributChance) {
    const chanceWert = def.attributChance + (boni.attributChance || 0);
    if (Math.random() < chanceWert) {
      const key = trainingsSchwerpunkt(pet, boni);
      update((s) => {
        const ziel = s.haustiere.find((entry) => entry.id === petId);
        if (ziel) ziel.trainiert[key] = (ziel.trainiert[key] || 0) + 1;
      });
      effekte[key] = 1;
    }
  }

  // Spaziergänge bringen gelegentlich einen Fund mit.
  if (def.fundChance && Math.random() < def.fundChance) {
    fund = spaziergangFund();
  }

  const xpFaktor = def.id === 'training' ? 1 + (boni.trainingXp || 0) : 1;
  const xp = Math.round((def.xp || 0) * xpFaktor);
  if (xp) grantXp(petId, xp);
  const muenzen = def.muenzen ? addCoins(def.muenzen, actionId) : 0;

  emit(EVENTS.PET_ACTION, { actionId, petId, effekte, xp, muenzen, fund });
  return { ok: true, effekte, xp, muenzen, fund, animation: def.animation };
}

/** Schlafen legt sich hin oder steht wieder auf. */
function performSleep(pet, options) {
  if (pet.schlaeft) {
    wakePet(pet.id);
    return { ok: true, text: `${pet.name} ist wieder wach.`, aufgewacht: true };
  }

  const stunden = options.stunden || 3;
  sleepPet(pet.id, stunden);
  update((s) => {
    s.statistik.aktionen.schlafen = (s.statistik.aktionen.schlafen || 0) + 1;
    s.statistik.aktionenGesamt += 1;
    const ziel = s.haustiere.find((entry) => entry.id === pet.id);
    if (ziel) {
      ziel.aktionen.schlafen = (ziel.aktionen.schlafen || 0) + 1;
      ziel.gesamtAktionen += 1;
    }
  });

  emit(EVENTS.PET_ACTION, { actionId: 'schlafen', petId: pet.id, effekte: {} });
  return { ok: true, text: `${pet.name} schläft jetzt.`, animation: null };
}

/** Aktion, die einen Gegenstand verbraucht (Füttern, Tränken, Medizin). */
function performWithItem(def, pet, options) {
  const kandidaten = itemsForAction(def.id);
  const gewaehlt = options.itemId && hasItem(options.itemId) ? options.itemId : kandidaten[0]?.id;
  if (!gewaehlt) return { ok: false, grund: 'Kein passender Gegenstand im Beutel.' };

  const ergebnis = useItem(gewaehlt, pet.id);
  if (!ergebnis.ok) return ergebnis;

  update((s) => {
    const ziel = s.haustiere.find((entry) => entry.id === pet.id);
    if (ziel) {
      ziel.aktionen[def.id] = (ziel.aktionen[def.id] || 0) + 1;
      ziel.gesamtAktionen += 1;
      ziel.gefuehle.zuneigung = clamp(ziel.gefuehle.zuneigung + 1.5, 0, 100);
    }
    s.statistik.aktionen[def.id] = (s.statistik.aktionen[def.id] || 0) + 1;
    s.statistik.aktionenGesamt += 1;
  });

  const xp = def.xp || 0;
  if (xp) grantXp(pet.id, xp);

  emit(EVENTS.PET_ACTION, { actionId: def.id, petId: pet.id, effekte: ergebnis.effekte, xp, itemId: gewaehlt });
  return {
    ok: true,
    text: `${item(gewaehlt).name} — ${item(gewaehlt).icon}`,
    effekte: ergebnis.effekte,
    xp,
    animation: def.animation,
  };
}

/** Welches Attribut ein Training verbessert — Raumausstattung gibt den Ausschlag. */
function trainingsSchwerpunkt(pet, boni) {
  const gewichte = {
    staerke: 1 + (boni.staerkeTraining || 0),
    intelligenz: 1 + (boni.intelligenzTraining || 0),
    tempo: 1 + (boni.tempoTraining || 0),
  };
  // Die Persönlichkeit schiebt zusätzlich in ihre Richtung.
  const neigung = { mutig: 'staerke', intelligent: 'intelligenz', verspielt: 'tempo' }[pet.persoenlichkeit];
  if (neigung) gewichte[neigung] += 0.5;

  const gesamt = Object.values(gewichte).reduce((a, b) => a + b, 0);
  let wurf = Math.random() * gesamt;
  for (const [key, wert] of Object.entries(gewichte)) {
    wurf -= wert;
    if (wurf <= 0) return key;
  }
  return 'staerke';
}

/** Kleiner Zufallsfund beim Spaziergang. */
function spaziergangFund() {
  const moeglich = ['beere', 'apfel', 'wasserflasche', 'heilkraut', 'koernermix', 'seife'];
  const id = moeglich[Math.floor(Math.random() * moeglich.length)];
  return { itemId: id, anzahl: 1 };
}

/** Spielzeug im Beutel verstärkt bestimmte Aktionen dauerhaft. */
function spielzeugBonus(def) {
  if (!def.bonusSchluessel) return 1;
  const inv = getState().inventar;
  let faktor = 1;
  for (const itemId of Object.keys(inv)) {
    const eintrag = item(itemId);
    const bonus = eintrag?.bonus?.[def.bonusSchluessel];
    if (bonus) faktor = Math.max(faktor, bonus);
  }
  return faktor;
}

/** Vorschlag, was dem Haustier gerade am meisten helfen würde. */
export function suggestedAction(pet) {
  if (!pet) return null;
  if (pet.krank) return 'medizin';
  if (pet.schlaeft) return null;
  const n = pet.beduerfnisse;
  if (n.hunger < 35) return 'fuettern';
  if (n.durst < 35) return 'traenken';
  if (n.energie < 25) return 'schlafen';
  if (n.sauberkeit < 35) return 'baden';
  if (pet.gefuehle.stimmung < 50) return 'spielen';
  return 'streicheln';
}

/** Wie lange die Standard-Schlafdauer ist (für die Anzeige). */
export const SLEEP_HOURS = 3;
export const SLEEP_MS = SLEEP_HOURS * 60 * MINUTE;
