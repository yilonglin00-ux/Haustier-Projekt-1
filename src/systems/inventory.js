/**
 * inventory.js — Der Beutel.
 *
 * Gegenstände liegen als `{ id: Anzahl }` im Spielstand. Dieses Modul kümmert
 * sich ums Hinzufügen, Entfernen und um die Wirkung beim Benutzen.
 */

import { item, ITEM_LIST, OUTFIT_SLOTS } from '../data/items.js';
import { species } from '../data/species.js';
import { homeBonuses } from '../data/rooms.js';
import { getState, update, petById } from '../core/state.js';
import { emit, EVENTS } from '../core/events.js';
import { clamp } from '../core/util.js';
import { addCoins, addDiamonds } from './economy.js';
import { grantXp } from './pets.js';

/** Legt Gegenstände in den Beutel. */
export function addItem(itemId, count = 1) {
  if (!item(itemId) || count <= 0) return 0;
  update((s) => {
    s.inventar[itemId] = (s.inventar[itemId] || 0) + count;
  });
  emit(EVENTS.ITEM_GAINED, { itemId, count });
  return count;
}

/** Mehrere Gegenstände auf einmal: `[{id, anzahl}]`. */
export function addItems(list) {
  for (const entry of list) addItem(entry.id, entry.anzahl ?? 1);
}

/** Entfernt Gegenstände. @returns {boolean} ob genug vorhanden war */
export function removeItem(itemId, count = 1) {
  const vorhanden = getState().inventar[itemId] || 0;
  if (vorhanden < count) return false;
  update((s) => {
    s.inventar[itemId] -= count;
    if (s.inventar[itemId] <= 0) delete s.inventar[itemId];
  });
  return true;
}

export function itemCount(itemId) {
  return getState().inventar[itemId] || 0;
}

export function hasItem(itemId, count = 1) {
  return itemCount(itemId) >= count;
}

/** Alle Gegenstände im Beutel als Liste mit Definition und Anzahl. */
export function inventoryList(categoryId = null) {
  const inv = getState().inventar;
  return ITEM_LIST.filter((entry) => inv[entry.id] > 0)
    .filter((entry) => !categoryId || entry.kategorie === categoryId)
    .map((entry) => ({ ...entry, anzahl: inv[entry.id] }));
}

/** Gibt es im Beutel etwas aus dieser Kategorie? */
export function hasCategory(categoryId) {
  return inventoryList(categoryId).length > 0;
}

/**
 * Benutzt einen Gegenstand an einem Haustier.
 *
 * @param {string} itemId
 * @param {string} petId
 * @returns {{ok:boolean, text?:string, effekte?:object, grund?:string}}
 */
export function useItem(itemId, petId) {
  const def = item(itemId);
  const pet = petById(petId);
  if (!def) return { ok: false, grund: 'Unbekannter Gegenstand.' };
  if (!pet && !def.spezial) return { ok: false, grund: 'Kein Haustier ausgewählt.' };
  if (!hasItem(itemId)) return { ok: false, grund: 'Nicht im Beutel.' };

  // Dauerhafte Gegenstände (Spielzeug, Bürste, Kleidung) werden nicht verbraucht.
  if (def.dauerhaft) {
    if (def.kategorie === 'kleidung') return equipOutfit(itemId, petId);
    return { ok: false, grund: `${def.name} wirkt dauerhaft und muss nicht benutzt werden.` };
  }

  const boni = homeBonuses(getState().zuhause);
  const effekte = {};

  // Sonderfälle zuerst — sie verbrauchen den Gegenstand ebenfalls.
  if (def.spezial === 'muenzen') {
    removeItem(itemId);
    const menge = addCoins(def.wert || 100, 'goldbeutel');
    return { ok: true, text: `+${menge} Münzen`, effekte: { muenzen: menge } };
  }
  if (def.spezial === 'diamanten') {
    removeItem(itemId);
    const menge = addDiamonds(def.wert || 1, 'diamantsplitter');
    return { ok: true, text: `+${menge} Diamanten`, effekte: { diamanten: menge } };
  }
  if (def.spezial === 'xp') {
    removeItem(itemId);
    grantXp(petId, def.wert || 200);
    return { ok: true, text: `+${def.wert || 200} EP`, effekte: { xp: def.wert || 200 } };
  }

  if (!def.wirkung && !def.attribut) {
    return { ok: false, grund: `${def.name} wird an anderer Stelle verwendet.` };
  }

  removeItem(itemId);

  update((s) => {
    const ziel = s.haustiere.find((entry) => entry.id === petId);
    if (!ziel) return;

    const futterBonus = def.kategorie === 'futter' || def.kategorie === 'frucht' ? 1 + (boni.futterWirkung || 0) : 1;
    const heilBonus = def.heilt ? 1 + (boni.heilWirkung || 0) : 1;
    // Lieblingsessen wirkt stärker.
    const passt = def.bevorzugt === speciesElement(ziel.artId) ? 1.3 : 1;

    for (const [key, value] of Object.entries(def.wirkung || {})) {
      const menge = value * futterBonus * heilBonus * passt;
      if (key in ziel.beduerfnisse) {
        ziel.beduerfnisse[key] = clamp(ziel.beduerfnisse[key] + menge, 0, 100);
        effekte[key] = Math.round(menge);
      } else if (key in ziel.gefuehle) {
        ziel.gefuehle[key] = clamp(ziel.gefuehle[key] + menge, 0, 100);
        effekte[key] = Math.round(menge);
      }
    }

    for (const [key, value] of Object.entries(def.attribut || {})) {
      ziel.trainiert[key] = (ziel.trainiert[key] || 0) + value;
      effekte[key] = value;
    }

    if (def.heilt) ziel.krank = false;

    s.statistik.gegenstaende = (s.statistik.gegenstaende || 0) + 1;
  });

  emit(EVENTS.ITEM_USED, { itemId, petId, effekte });
  return { ok: true, text: `${def.name} benutzt`, effekte };
}

/** Element einer Art — entscheidet, ob ein Futter das Lieblingsessen ist. */
function speciesElement(artId) {
  return species(artId)?.element;
}

/**
 * Zieht einem Haustier ein Kleidungsstück an (oder aus, wenn es schon getragen wird).
 * Kleidung wird nicht verbraucht — sie bleibt im Beutel.
 */
export function equipOutfit(itemId, petId) {
  const def = item(itemId);
  if (!def || def.kategorie !== 'kleidung') return { ok: false, grund: 'Kein Kleidungsstück.' };
  if (!hasItem(itemId)) return { ok: false, grund: 'Nicht im Beutel.' };

  let getragen = false;
  update((s) => {
    const pet = s.haustiere.find((entry) => entry.id === petId);
    if (!pet) return;
    pet.outfit = pet.outfit || {};
    if (pet.outfit[def.slot] === itemId) {
      delete pet.outfit[def.slot];
    } else {
      pet.outfit[def.slot] = itemId;
      getragen = true;
    }
  });

  return { ok: true, text: getragen ? `${def.name} angezogen` : `${def.name} abgelegt`, getragen };
}

/** Nimmt einem Haustier alle Kleidung ab. */
export function clearOutfit(petId) {
  update((s) => {
    const pet = s.haustiere.find((entry) => entry.id === petId);
    if (pet) pet.outfit = {};
  });
}

/** Verkauft einen Gegenstand. */
export function sellItem(itemId, count = 1) {
  const def = item(itemId);
  if (!def || !def.verkauf) return { ok: false, grund: 'Lässt sich nicht verkaufen.' };
  if (!removeItem(itemId, count)) return { ok: false, grund: 'Nicht genug vorhanden.' };
  const erloes = addCoins(def.verkauf * count, 'verkauf');
  return { ok: true, erloes };
}

/** Gesamtzahl der Gegenstände im Beutel. */
export function inventorySize() {
  return Object.values(getState().inventar).reduce((a, b) => a + b, 0);
}

export { OUTFIT_SLOTS };
