/**
 * home.js — Das Zuhause: Räume kaufen, einrichten, ernten.
 */

import { ROOMS, ROOM_ORDER, FURNITURE, furnitureOfRoom, homeBonuses, room } from '../data/rooms.js';
import { getState, update, hasRoom } from '../core/state.js';
import { on, emit, EVENTS } from '../core/events.js';
import { dayKey } from '../core/util.js';
import { pick } from '../core/rng.js';
import { spendCoins } from './economy.js';
import { addItem } from './inventory.js';

/** Kauft einen Raum. */
export function buyRoom(roomId) {
  const def = room(roomId);
  if (!def) return { ok: false, grund: 'Unbekannter Raum.' };
  if (hasRoom(roomId)) return { ok: false, grund: 'Bereits freigeschaltet.' };
  if (!spendCoins(def.preis)) return { ok: false, grund: 'Nicht genug Münzen.' };

  update((s) => {
    s.zuhause.raeume[roomId] = true;
  });
  emit(EVENTS.ROOM_UNLOCKED, { roomId });
  return { ok: true, raum: def };
}

/** Kauft ein Möbelstück. */
export function buyFurniture(furnitureId) {
  const def = FURNITURE[furnitureId];
  if (!def) return { ok: false, grund: 'Unbekanntes Möbelstück.' };
  if (getState().zuhause.moebel[furnitureId]) return { ok: false, grund: 'Steht bereits im Raum.' };
  if (!hasRoom(def.raum)) return { ok: false, grund: `Dafür brauchst du zuerst: ${ROOMS[def.raum].name}.` };
  if (!spendCoins(def.preis)) return { ok: false, grund: 'Nicht genug Münzen.' };

  update((s) => {
    s.zuhause.moebel[furnitureId] = true;
  });
  return { ok: true, moebel: def };
}

/** Alle aktiven Boni des Zuhauses. */
export function currentBonuses() {
  return homeBonuses(getState().zuhause);
}

/** Lesbare Liste der aktiven Boni. */
export function bonusList() {
  const boni = currentBonuses();
  const namen = {
    schlafErholung: 'Schlaf-Erholung',
    futterWirkung: 'Futterwirkung',
    ladenRabatt: 'Laden-Rabatt',
    heilWirkung: 'Heilwirkung',
    fruchtErnte: 'Garten-Ernte',
    trainingXp: 'Trainings-Erfahrung',
    attributChance: 'Attribut-Chance',
    staerkeTraining: 'Stärke-Training',
    intelligenzTraining: 'Intelligenz-Training',
    tempoTraining: 'Tempo-Training',
    brutzeit: 'Brutzeit',
    brutplatz: 'Brutplätze',
    eiVorschau: 'Ei-Vorschau',
    stimmungRegen: 'Stimmung',
    glueckRegen: 'Glück',
    sauberkeitRegen: 'Sauberkeit',
    wasserBonus: 'Wasser-Haustiere',
  };

  return Object.entries(boni)
    .filter(([, wert]) => wert)
    .map(([key, wert]) => ({
      key,
      name: namen[key] || key,
      text:
        key === 'brutplatz' || key === 'fruchtErnte' || key === 'eiVorschau'
          ? `+${wert}`
          : `${wert > 0 ? '+' : ''}${Math.round(wert * 100)} %`,
    }));
}

/**
 * Der Garten wirft einmal pro Tag Früchte ab.
 * Kleines, verlässliches Geschenk fürs Zurückkommen.
 */
export function harvestGarden() {
  const state = getState();
  if (!hasRoom('garten', state)) return null;

  const heute = dayKey();
  if (state.zuhause.letzteErnte === heute) return null;

  const menge = currentBonuses().fruchtErnte || 0;
  if (menge <= 0) return null;

  const fruechte = ['apfel', 'beere', 'sonnenfrucht', 'mondbeere'];
  const ernte = [];
  for (let i = 0; i < menge; i += 1) {
    const id = pick(fruechte);
    addItem(id, 1);
    ernte.push(id);
  }

  update((s) => {
    s.zuhause.letzteErnte = heute;
  });

  emit(EVENTS.RARE_EVENT, { art: 'ernte', text: `Der Garten hat ${ernte.length} Früchte getragen.`, ernte });
  return ernte;
}

/** Prüft die Gartenernte beim Start und bei jedem Tageswechsel. */
export function installGardenHarvest() {
  harvestGarden();
  on(EVENTS.DAY_ROLLOVER, harvestGarden);
}

export { ROOMS, ROOM_ORDER, FURNITURE, furnitureOfRoom, room };
