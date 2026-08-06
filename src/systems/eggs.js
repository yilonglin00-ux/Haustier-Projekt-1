/**
 * eggs.js — Brutkasten.
 *
 * Ein Ei schlüpft, sobald **entweder** seine Brutzeit abgelaufen ist **oder**
 * seine kleine Aufgabe erfüllt wurde. Wer aktiv spielt, kommt schneller ans
 * Haustier; wer das Spiel weglegt, verliert trotzdem nichts.
 */

import { EGG_TYPES, eggType, HATCH_TASKS } from '../data/eggs.js';
import { homeBonuses } from '../data/rooms.js';
import { getState, update } from '../core/state.js';
import { emit, EVENTS, on } from '../core/events.js';
import { uid, clamp } from '../core/util.js';
import { pick, weightedKey } from '../core/rng.js';
import { createPet, adoptPet, rollSpecies } from './pets.js';
import { speciesByRarity } from '../data/species.js';

/** Wie viele Brutplätze insgesamt zur Verfügung stehen. */
export function incubatorSlots(state = getState()) {
  const boni = homeBonuses(state.zuhause);
  return state.brutplaetze + (boni.brutplatz || 0);
}

/** Freie Plätze im Brutkasten. */
export function freeSlots(state = getState()) {
  return Math.max(0, incubatorSlots(state) - state.eier.length);
}

/**
 * Legt ein Ei in den Brutkasten.
 * @param {string} typeId siehe data/eggs.js
 * @returns {{ok:boolean, ei?:object, grund?:string}}
 */
export function addEgg(typeId = 'normal') {
  const state = getState();
  if (freeSlots(state) <= 0) return { ok: false, grund: 'Der Brutkasten ist voll.' };

  const typ = eggType(typeId);
  const boni = homeBonuses(state.zuhause);
  const dauer = typ.brutzeit * (1 + (boni.brutzeit || 0));
  const aufgabe = pick(HATCH_TASKS);

  const ei = {
    id: uid('egg'),
    typ: typ.id,
    gefunden: Date.now(),
    schluepftAm: Date.now() + dauer,
    aufgabe: { id: aufgabe.id, zaehler: aufgabe.zaehler, ziel: aufgabe.ziel, fortschritt: 0, icon: aufgabe.icon },
  };

  update((s) => {
    s.eier.push(ei);
  });

  emit(EVENTS.EGG_FOUND, { ei });
  return { ok: true, ei };
}

/** Fortschritt eines Eis: 0 … 1 (der weiter fortgeschrittene Weg zählt). */
export function eggProgress(ei) {
  const typ = eggType(ei.typ);
  const gesamt = ei.schluepftAm - ei.gefunden || typ.brutzeit;
  const zeit = clamp((Date.now() - ei.gefunden) / gesamt, 0, 1);
  const aufgabe = ei.aufgabe ? clamp(ei.aufgabe.fortschritt / ei.aufgabe.ziel, 0, 1) : 0;
  return Math.max(zeit, aufgabe);
}

/** Ist das Ei schlupfbereit? */
export function isReady(ei) {
  return Date.now() >= ei.schluepftAm || (ei.aufgabe && ei.aufgabe.fortschritt >= ei.aufgabe.ziel);
}

/** Verkürzt die Brutzeit (Wärmestein). */
export function speedUpEgg(eggId, stunden = 2) {
  update((s) => {
    const ei = s.eier.find((entry) => entry.id === eggId);
    if (ei) ei.schluepftAm -= stunden * 3600 * 1000;
  });
}

/**
 * Lässt ein Ei schlüpfen.
 * @returns {{ok:boolean, pet?:object, grund?:string}}
 */
export function hatchEgg(eggId) {
  const state = getState();
  const ei = state.eier.find((entry) => entry.id === eggId);
  if (!ei) return { ok: false, grund: 'Dieses Ei gibt es nicht mehr.' };
  if (!isReady(ei)) return { ok: false, grund: 'Das Ei braucht noch etwas Zeit.' };

  const typ = eggType(ei.typ);
  const artId = pickSpeciesForEgg(typ);
  const pet = createPet(artId, { glueck: typ.id === 'regenbogen' || typ.id === 'golden' ? 3 : 1 });

  update((s) => {
    s.eier = s.eier.filter((entry) => entry.id !== eggId);
    s.statistik.eierGeschluepft += 1;
  });

  adoptPet(pet, `ei:${typ.id}`);
  emit(EVENTS.EGG_HATCHED, { pet, eiTyp: typ.id });
  return { ok: true, pet, eiTyp: typ.id };
}

/**
 * Welche Art schlüpft?
 * Garantien (goldenes Ei, mystisches Ei) gehen vor; sonst entscheidet die
 * Seltenheitsverteilung des Eityps.
 */
function pickSpeciesForEgg(typ) {
  if (typ.garantie?.length && Math.random() < 0.6) {
    return pick(typ.garantie);
  }

  const rarityId = weightedKey(typ.gewichte);
  // Aus Eiern schlüpfen bevorzugt Basisstufen; gibt es keine, nimm irgendeine
  // Art dieser Seltenheit, die überhaupt aus Eiern kommen kann.
  const basis = speciesByRarity(rarityId, 'ei').filter((entry) => !entry.geheim && entry.stufe === 1);
  if (basis.length) return pick(basis).id;

  const beliebig = speciesByRarity(rarityId, 'ei').filter((entry) => !entry.geheim);
  if (beliebig.length) return pick(beliebig).id;

  return rollSpecies({ quelle: 'ei' });
}

/** Beschreibungstext der Schlupfaufgabe. */
export function taskText(ei) {
  const vorlage = HATCH_TASKS.find((entry) => entry.id === ei.aufgabe?.id);
  if (!vorlage) return '';
  return vorlage.text.replace('{ziel}', String(ei.aufgabe.ziel));
}

// ---------------------------------------------------------------------------
// Anbindung an den Spielverlauf
// ---------------------------------------------------------------------------

/** Erhöht den Aufgabenfortschritt aller Eier, deren Aufgabe auf diesen Zähler hört. */
function advance(zaehler, menge = 1) {
  if (!getState().eier.length) return;
  update((s) => {
    for (const ei of s.eier) {
      if (ei.aufgabe?.zaehler === zaehler) ei.aufgabe.fortschritt += menge;
    }
  });
}

/**
 * Hängt den Brutkasten an den Spielverlauf.
 * Geschlüpft wird ausschließlich auf Knopfdruck — das Ereignis gehört dem
 * Spieler, nicht einem Timer im Hintergrund.
 */
export function installEggSystem() {
  on(EVENTS.PET_ACTION, ({ actionId }) => {
    advance('aktionen');
    advance(actionId);
  });
  on(EVENTS.MINIGAME_FINISHED, () => advance('minispiele'));
  on(EVENTS.EXPEDITION_DONE, () => advance('expeditionen'));
}

/** Anzahl schlupfbereiter Eier — für das Abzeichen in der Navigation. */
export function readyEggCount(state = getState()) {
  return state.eier.filter(isReady).length;
}

export { EGG_TYPES };
