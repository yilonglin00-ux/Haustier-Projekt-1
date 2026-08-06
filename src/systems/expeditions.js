/**
 * expeditions.js — Expeditionen laufen in Echtzeit weiter.
 *
 * Eine Expedition ist ein Versprechen: Du schickst dein Haustier los, machst
 * etwas anderes (oder schließt das Spiel) und bekommst später eine Handvoll
 * Beute. Deshalb wird nichts simuliert, sondern nur ein Endzeitpunkt gemerkt.
 */

import { ZONES, zone, availableZones, zoneStrain } from '../data/expeditions.js';
import { item } from '../data/items.js';
import { getState, update, petById, isOnExpedition } from '../core/state.js';
import { emit, EVENTS } from '../core/events.js';
import { uid, clamp } from '../core/util.js';
import { weightedPick, weightedKey, randInt, chance } from '../core/rng.js';
import { addItem } from './inventory.js';
import { addCoins } from './economy.js';
import { grantXp, power } from './pets.js';
import { addEgg, freeSlots } from './eggs.js';

/**
 * Startet eine Expedition.
 * @returns {{ok:boolean, reise?:object, grund?:string}}
 */
export function startExpedition(petId, zoneId) {
  const state = getState();
  const pet = petById(petId, state);
  const ziel = zone(zoneId);

  if (!pet) return { ok: false, grund: 'Haustier nicht gefunden.' };
  if (!ziel) return { ok: false, grund: 'Unbekannte Zone.' };
  if (isOnExpedition(petId, state)) return { ok: false, grund: `${pet.name} ist bereits unterwegs.` };
  if (pet.schlaeft) return { ok: false, grund: `${pet.name} schläft.` };
  if (pet.level < ziel.minLevel) return { ok: false, grund: `Erst ab Level ${ziel.minLevel}.` };
  if (pet.beduerfnisse.energie < 25) return { ok: false, grund: `${pet.name} ist zu erschöpft.` };
  if (pet.krank) return { ok: false, grund: `${pet.name} ist krank.` };

  // Starke Haustiere sind schneller unterwegs (bis zu 25 % Zeitersparnis).
  const tempoBonus = clamp(1 - (power(pet) / 600) * 0.25, 0.75, 1);
  const dauer = Math.round(ziel.dauer * tempoBonus);

  const reise = {
    id: uid('trip'),
    petId,
    zoneId,
    start: Date.now(),
    endet: Date.now() + dauer,
    dauer,
  };

  update((s) => {
    s.expeditionen.push(reise);
    s.statistik.zonen = s.statistik.zonen || {};
    s.statistik.zonen[zoneId] = (s.statistik.zonen[zoneId] || 0) + 1;
  });

  emit(EVENTS.EXPEDITION_STARTED, { reise });
  return { ok: true, reise };
}

/** Fortschritt einer Reise: 0 … 1. */
export function tripProgress(reise) {
  return clamp((Date.now() - reise.start) / (reise.endet - reise.start), 0, 1);
}

export function tripReady(reise) {
  return Date.now() >= reise.endet;
}

/** Verbleibende Zeit in Millisekunden. */
export function tripLeft(reise) {
  return Math.max(0, reise.endet - Date.now());
}

/**
 * Holt eine fertige Expedition ab und verteilt die Beute.
 * @returns {{ok:boolean, beute?:object, grund?:string}}
 */
export function collectExpedition(tripId) {
  const state = getState();
  const reise = state.expeditionen.find((entry) => entry.id === tripId);
  if (!reise) return { ok: false, grund: 'Diese Expedition gibt es nicht.' };
  if (!tripReady(reise)) return { ok: false, grund: 'Noch unterwegs.' };

  const ziel = zone(reise.zoneId);
  const pet = petById(reise.petId, state);
  const beute = rollLoot(ziel, pet);

  // Beute verteilen
  addCoins(beute.muenzen, 'expedition');
  if (pet) grantXp(pet.id, beute.xp);
  for (const eintrag of beute.gegenstaende) addItem(eintrag.id, eintrag.anzahl);
  if (beute.ei) {
    const ergebnis = addEgg(beute.ei);
    if (!ergebnis.ok) beute.eiAbgelehnt = true;
  }

  // Erschöpfung
  update((s) => {
    const ziehen = s.haustiere.find((entry) => entry.id === reise.petId);
    if (ziehen) {
      const strain = zoneStrain(ziel);
      for (const [key, wert] of Object.entries(strain)) {
        ziehen.beduerfnisse[key] = clamp(ziehen.beduerfnisse[key] - wert, 0, 100);
      }
      ziehen.gefuehle.glueck = clamp(ziehen.gefuehle.glueck + 6, 0, 100);
      ziehen.gefuehle.vertrauen = clamp(ziehen.gefuehle.vertrauen + 4, 0, 100);
    }
    s.expeditionen = s.expeditionen.filter((entry) => entry.id !== tripId);
    s.statistik.expeditionen += 1;
  });

  emit(EVENTS.EXPEDITION_DONE, { reise, beute });
  return { ok: true, beute, zone: ziel };
}

/** Bricht eine laufende Expedition ohne Beute ab. */
export function cancelExpedition(tripId) {
  update((s) => {
    s.expeditionen = s.expeditionen.filter((entry) => entry.id !== tripId);
  });
}

/**
 * Würfelt die Beute einer Zone aus.
 * Stärkere Haustiere finden etwas mehr — aber die Zone bleibt der Hauptfaktor,
 * damit sich Aufsteigen lohnt, ohne alles andere zu entwerten.
 */
function rollLoot(ziel, pet) {
  const staerke = pet ? clamp(1 + power(pet) / 900, 1, 1.5) : 1;

  const beute = {
    muenzen: Math.round(randInt(ziel.muenzen[0], ziel.muenzen[1]) * staerke),
    xp: Math.round(randInt(ziel.xp[0], ziel.xp[1]) * staerke),
    gegenstaende: [],
    ei: null,
  };

  // Ein bis drei Gegenstände.
  const anzahl = randInt(1, 3);
  for (let i = 0; i < anzahl; i += 1) {
    const eintrag = weightedPick(ziel.beute);
    if (!eintrag || !item(eintrag.id)) continue;
    const menge = randInt(eintrag.anzahl[0], eintrag.anzahl[1]);
    const vorhanden = beute.gegenstaende.find((entry) => entry.id === eintrag.id);
    if (vorhanden) vorhanden.anzahl += menge;
    else beute.gegenstaende.push({ id: eintrag.id, anzahl: menge });
  }

  // Ei?
  if (freeSlots() > 0 && chance(ziel.eiChance)) {
    beute.ei = weightedKey(ziel.eiGewichte);
  }

  // Sehr seltener Sonderfund der Zone.
  if (ziel.sonderfund && freeSlots() > 0 && chance(ziel.sonderfund.chance)) {
    beute.ei = ziel.sonderfund.eiTyp;
    beute.sonderfund = true;
  }

  return beute;
}

/** Anzahl abholbereiter Expeditionen — für das Abzeichen in der Navigation. */
export function readyTripCount(state = getState()) {
  return state.expeditionen.filter(tripReady).length;
}

/** Hängt die Expeditionen an den Spielverlauf (derzeit nur als Platzhalter für Ereignisse). */
export function installExpeditionSystem() {
  // Expeditionen brauchen keinen Tick: Ihr Ende steht als Zeitstempel fest und
  // wird beim Zeichnen geprüft. Die Funktion existiert, damit main.js alle
  // Systeme einheitlich anmelden kann.
}

export { ZONES, availableZones, zone, zoneStrain };
