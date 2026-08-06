/**
 * evolution.js — Wann und wozu sich ein Haustier entwickelt.
 *
 * Die Bedingungen stehen deklarativ bei der Art (siehe data/species.js).
 * Hier werden sie geprüft. Wichtig: die **erste passende** Bedingung gewinnt.
 * Deshalb stehen speziellere Zweige in den Artdaten immer zuerst — so entstehen
 * unterschiedliche Entwicklungen aus derselben Vorstufe.
 */

import { species } from '../data/species.js';
import { item } from '../data/items.js';
import { getState, update, petById } from '../core/state.js';
import { emit, EVENTS } from '../core/events.js';
import { timeOfDay } from '../core/util.js';
import { hasItem, removeItem } from './inventory.js';
import { attribute } from './pets.js';

/**
 * Prüft eine einzelne Bedingung.
 * @returns {{erfuellt:boolean, offen:string[]}}
 */
export function checkCondition(pet, step) {
  const offen = [];
  const attrs = { staerke: attribute(pet, 'staerke'), intelligenz: attribute(pet, 'intelligenz'), tempo: attribute(pet, 'tempo') };

  if (step.minLevel && pet.level < step.minLevel) offen.push(`Level ${step.minLevel}`);
  if (step.minZuneigung && pet.gefuehle.zuneigung < step.minZuneigung) offen.push(`Zuneigung ${step.minZuneigung}`);
  if (step.minGlueck && pet.gefuehle.glueck < step.minGlueck) offen.push(`Glück ${step.minGlueck}`);
  if (step.minVertrauen && pet.gefuehle.vertrauen < step.minVertrauen) offen.push(`Vertrauen ${step.minVertrauen}`);
  if (step.minStimmung && pet.gefuehle.stimmung < step.minStimmung) offen.push(`Stimmung ${step.minStimmung}`);
  if (step.minPflegeTage && pet.pflegeTage < step.minPflegeTage) offen.push(`${step.minPflegeTage} Pflegetage`);

  for (const [key, wert] of Object.entries(step.minAttribut || {})) {
    if ((attrs[key] || 0) < wert) offen.push(`${key} ${wert}`);
  }

  for (const [aktion, anzahl] of Object.entries(step.minAktion || {})) {
    if ((pet.aktionen?.[aktion] || 0) < anzahl) offen.push(`${anzahl}× ${aktion}`);
  }

  if (step.persoenlichkeit && !step.persoenlichkeit.includes(pet.persoenlichkeit)) {
    offen.push(`Persönlichkeit: ${step.persoenlichkeit.join(' oder ')}`);
  }

  // Tageszeit lässt sich mit einem Mond- bzw. Sonnenstein überbrücken.
  if (step.tageszeit && timeOfDay() !== step.tageszeit) {
    const ersatz = step.tageszeit === 'nacht' ? 'mondstein' : 'sonnenstein';
    if (!hasItem(ersatz)) offen.push(`Tageszeit: ${step.tageszeit}`);
  }

  if (step.item && !hasItem(step.item)) {
    offen.push(item(step.item)?.name || step.item);
  }

  return { erfuellt: offen.length === 0, offen };
}

/**
 * Findet die Entwicklung, die gerade möglich ist.
 * @returns {object|null} der passende Entwicklungsschritt
 */
export function checkEvolution(petId) {
  const pet = petById(petId);
  if (!pet) return null;
  const art = species(pet.artId);
  if (!art?.entwicklung?.length) return null;

  for (const step of art.entwicklung) {
    if (checkCondition(pet, step).erfuellt) return step;
  }
  return null;
}

/**
 * Alle Entwicklungswege einer Art mit ihrem aktuellen Stand — fürs Haustierbuch
 * und die Hinweiskarte auf dem Zuhause-Bildschirm.
 */
export function evolutionOptions(pet) {
  const art = species(pet.artId);
  return (art?.entwicklung || []).map((step) => ({
    step,
    ziel: species(step.zu),
    ...checkCondition(pet, step),
  }));
}

/**
 * Führt die Entwicklung durch.
 * Level, Erfahrung, Persönlichkeit, Farbvariante und Name bleiben erhalten —
 * es ist dasselbe Haustier, nur in neuer Gestalt.
 *
 * @returns {{ok:boolean, von?:object, zu?:object, grund?:string}}
 */
export function evolvePet(petId, step) {
  const pet = petById(petId);
  if (!pet) return { ok: false, grund: 'Haustier nicht gefunden.' };

  const gewaehlt = step || checkEvolution(petId);
  if (!gewaehlt) return { ok: false, grund: 'Die Bedingungen sind nicht erfüllt.' };

  const pruefung = checkCondition(pet, gewaehlt);
  if (!pruefung.erfuellt) return { ok: false, grund: `Es fehlt noch: ${pruefung.offen.join(', ')}` };

  const vonArt = species(pet.artId);
  const zuArt = species(gewaehlt.zu);
  if (!zuArt) return { ok: false, grund: 'Unbekanntes Entwicklungsziel.' };

  // Benötigte Steine werden verbraucht.
  if (gewaehlt.item) removeItem(gewaehlt.item, 1);
  if (gewaehlt.tageszeit && timeOfDay() !== gewaehlt.tageszeit) {
    removeItem(gewaehlt.tageszeit === 'nacht' ? 'mondstein' : 'sonnenstein', 1);
  }

  update((s) => {
    const ziel = s.haustiere.find((entry) => entry.id === petId);
    if (!ziel) return;

    ziel.artId = zuArt.id;
    if (!ziel.umbenannt) ziel.name = zuArt.name;

    // Die Entwicklung tut gut: Bedürfnisse und Stimmung steigen deutlich.
    ziel.beduerfnisse.gesundheit = 100;
    ziel.beduerfnisse.energie = Math.min(100, ziel.beduerfnisse.energie + 40);
    ziel.gefuehle.stimmung = Math.min(100, ziel.gefuehle.stimmung + 25);
    ziel.gefuehle.glueck = Math.min(100, ziel.gefuehle.glueck + 15);
    ziel.krank = false;

    const eintrag = s.buch[zuArt.id] || { gesehen: 0, gefangen: false, anzahl: 0, ersteBegegnung: null };
    eintrag.gesehen += 1;
    eintrag.anzahl += 1;
    eintrag.gefangen = true;
    eintrag.ersteBegegnung = eintrag.ersteBegegnung || Date.now();
    s.buch[zuArt.id] = eintrag;

    s.statistik.entwicklungen += 1;
  });

  emit(EVENTS.PET_EVOLVED, { petId, von: vonArt, zu: zuArt });
  return { ok: true, von: vonArt, zu: zuArt };
}

/** Lesbare Beschreibung der Bedingungen eines Schrittes — fürs Haustierbuch. */
export function conditionText(step) {
  const teile = [];
  if (step.minLevel) teile.push(`ab Level ${step.minLevel}`);
  if (step.minZuneigung) teile.push(`Zuneigung ≥ ${step.minZuneigung}`);
  if (step.minGlueck) teile.push(`Glück ≥ ${step.minGlueck}`);
  if (step.minVertrauen) teile.push(`Vertrauen ≥ ${step.minVertrauen}`);
  if (step.minStimmung) teile.push(`Stimmung ≥ ${step.minStimmung}`);
  if (step.minPflegeTage) teile.push(`${step.minPflegeTage} Tage gute Pflege`);
  for (const [key, wert] of Object.entries(step.minAttribut || {})) teile.push(`${key} ≥ ${wert}`);
  for (const [aktion, anzahl] of Object.entries(step.minAktion || {})) teile.push(`${anzahl}× ${aktion}`);
  if (step.persoenlichkeit) teile.push(`Persönlichkeit ${step.persoenlichkeit.join('/')}`);
  if (step.tageszeit) teile.push(`bei ${step.tageszeit}`);
  if (step.item) teile.push(`mit ${item(step.item)?.name || step.item}`);
  return teile.length ? teile.join(', ') : 'keine besonderen Bedingungen';
}

/** Sind alle drei Starter zur Stufe 3 entwickelt? (Bedingung für Solmarax) */
export function allStartersMastered() {
  const state = getState();
  return ['infernopard', 'fluttitan', 'waldhueter'].every((id) => state.buch[id]?.gefangen);
}
