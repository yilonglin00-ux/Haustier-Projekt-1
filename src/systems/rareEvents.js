/**
 * rareEvents.js — Seltene Ereignisse und geheime Haustiere.
 *
 * Diese Dinge passieren selten und nie beliebig. Jedes hat eine klare
 * Bedingung; wer sie kennt, kann darauf hinarbeiten — wer nicht, wird
 * überrascht. Beides soll sich gut anfühlen.
 */

import { species } from '../data/species.js';
import { getState, update } from '../core/state.js';
import { on, emit, EVENTS } from '../core/events.js';
import { dayKey, timeOfDay, season } from '../core/util.js';
import { seededRandom, chance } from '../core/rng.js';
import { createPet, adoptPet } from './pets.js';
import { addEgg, freeSlots } from './eggs.js';
import { allStartersMastered } from './evolution.js';

/**
 * Die geheimen Haustiere und ihre Bedingungen.
 * Steht bewusst hier und nicht bei den Artdaten: die Artdaten beschreiben,
 * *was* ein Haustier ist — dieses Modul entscheidet, *wann* es erscheint.
 */
const SECRETS = [
  {
    id: 'aeternum',
    text: 'Aeternum erscheint — es hat auf dich gewartet. Hundert Tage lang.',
    pruef: (s) => s.statistik.tageGespielt >= 100,
  },
  {
    id: 'chronovex',
    text: 'Chronovex tritt aus der Zeit heraus. Es hat jede deiner Handlungen gezählt.',
    pruef: (s) => s.statistik.aktionenGesamt >= 1000,
  },
  {
    id: 'vitalume',
    text: 'Vitalume erblüht — dein Garten ist reich genug geworden.',
    pruef: (s) => Object.values(s.buch).filter((e) => e.gefangen).length >= 80,
  },
  {
    id: 'solmarax',
    text: 'Solmarax erwacht. Du hast alle drei Starter zur vollen Größe geführt.',
    pruef: () => allStartersMastered(),
  },
];

/** Prüft die geheimen Bedingungen und schenkt das Haustier bei Erfüllung. */
export function checkSecrets() {
  const state = getState();
  for (const geheim of SECRETS) {
    if (state.buch[geheim.id]?.gefangen) continue;
    if (!geheim.pruef(state)) continue;

    const pet = createPet(geheim.id, { level: Math.max(1, Math.floor(bestLevel(state) * 0.8)) });
    adoptPet(pet, 'geheimnis');
    emit(EVENTS.RARE_EVENT, { art: 'geheimnis', id: geheim.id, text: geheim.text, pet });
  }
}

function bestLevel(state) {
  return state.haustiere.reduce((max, pet) => Math.max(max, pet.level), 1);
}

/**
 * Das goldene Ei: höchstens einmal pro Tag, mit etwa 8 % Wahrscheinlichkeit.
 * Der Wurf ist an das Datum gesät — ob es erscheint, steht für diesen Tag fest.
 */
export function checkGoldenEgg() {
  const state = getState();
  const heute = dayKey();
  if (state.flags.goldenesEiTag === heute) return null;

  const rand = seededRandom(`golden:${heute}:${state.seed}`);
  update((s) => {
    s.flags.goldenesEiTag = heute;
  });

  if (rand() > 0.08 || freeSlots() <= 0) return null;

  const ergebnis = addEgg('golden');
  if (!ergebnis.ok) return null;

  update((s) => {
    s.flags.goldenesEiGefunden = true;
  });
  emit(EVENTS.RARE_EVENT, {
    art: 'goldenesEi',
    text: 'Ein goldenes Ei liegt im Gras. Es war gestern noch nicht da.',
  });
  return ergebnis.ei;
}

/**
 * Das Nachtwesen: erscheint nur zwischen 23 und 4 Uhr, höchstens einmal pro
 * Nacht, mit kleiner Wahrscheinlichkeit — und nur, wenn man wirklich da ist.
 */
export function checkNightVisitor() {
  const state = getState();
  const heute = dayKey();
  if (timeOfDay() !== 'nacht') return null;
  if (state.flags.nachtwesenTag === heute) return null;
  if (state.buch.nyxaria?.gefangen) return null;

  update((s) => {
    s.flags.nachtwesenTag = heute;
  });

  if (!chance(0.12)) return null;

  const pet = createPet('nyxaria', { level: Math.max(5, Math.floor(bestLevel(state) * 0.7)) });
  adoptPet(pet, 'nacht');
  emit(EVENTS.RARE_EVENT, {
    art: 'nachtwesen',
    id: 'nyxaria',
    text: 'Etwas steht im Garten und sieht dich an. Es hat keine Angst — und du auch nicht.',
    pet,
  });
  return pet;
}

/**
 * Saisonale Haustiere: einmal pro Jahreszeit gibt es ein passendes Ei
 * geschenkt, damit die Sammlung nicht vom Zufall allein abhängt.
 */
export function checkSeasonal() {
  const state = getState();
  // Nicht direkt beim allerersten Start: der Starter soll für sich stehen.
  if (!state.flags.starterGewaehlt || state.statistik.tageGespielt < 2) return null;

  const jetzt = `${new Date().getFullYear()}-${season()}`;
  if (state.flags.saisonPetJahr === jetzt) return null;

  const kandidat = SEASON_SPECIES[season()];
  if (!kandidat) return null;

  update((s) => {
    s.flags.saisonPetJahr = jetzt;
  });

  const pet = createPet(kandidat, { level: Math.max(3, Math.floor(bestLevel(state) * 0.6)) });
  adoptPet(pet, 'saison');
  emit(EVENTS.RARE_EVENT, {
    art: 'saison',
    id: kandidat,
    text: `Die Jahreszeit bringt Besuch: ${species(kandidat).name} ist eingezogen.`,
    pet,
  });
  return pet;
}

/** Welches Haustier zu welcher Jahreszeit gehört. */
const SEASON_SPECIES = {
  winter: 'frostgloeckchen',
  fruehling: 'bluetenfee',
  sommer: 'sonnenkoi',
  herbst: 'herbstgeist',
};

/** Hängt die seltenen Ereignisse an den Spielverlauf. */
export function installRareEvents() {
  // Beim Start und bei jedem Tageswechsel die Tages-Ereignisse prüfen.
  const pruefeTag = () => {
    checkGoldenEgg();
    checkNightVisitor();
    checkSeasonal();
  };

  pruefeTag();
  on(EVENTS.DAY_ROLLOVER, pruefeTag);

  // Geheimnisse hängen an Fortschritt, nicht an Zeit — nach Erfolgen prüfen.
  on(EVENTS.ACHIEVEMENT_UNLOCKED, checkSecrets);
  on(EVENTS.PET_EVOLVED, checkSecrets);
  on(EVENTS.EGG_HATCHED, checkSecrets);
  checkSecrets();
}
