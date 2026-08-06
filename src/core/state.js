/**
 * state.js — Der eine Spielstand und der Zugriff darauf.
 *
 * Alles, was das Spiel weiß, steckt in einem einzigen serialisierbaren Objekt.
 * Änderungen laufen immer über `update()`; danach wird einmal pro Bild ein
 * Änderungs-Ereignis gesendet, damit die UI nicht bei jeder Kleinigkeit
 * neu zeichnet.
 */

import { emit, EVENTS } from './events.js';
import { dayKey, uid } from './util.js';

/** Wird bei jeder inkompatiblen Änderung am Spielstand erhöht (siehe storage.js). */
export const SAVE_VERSION = 1;

/** Maximale Teamgröße. Weitere Haustiere leben im Gehege. */
export const TEAM_SIZE = 6;

/** Erzeugt einen frischen Spielstand. */
export function createNewSave() {
  const now = Date.now();
  return {
    version: SAVE_VERSION,
    createdAt: now,
    lastSeen: now,
    seed: Math.floor(Math.random() * 0xffffffff),

    /** Fortschritt des Spielers selbst. */
    spieler: {
      name: 'Hüter',
      muenzen: 250,
      diamanten: 5,
      rang: 1,
      rangXp: 0,
    },

    /** Alle Haustiere im Besitz — `team` verweist per ID auf höchstens sechs davon. */
    haustiere: [],
    team: [],
    aktivesHaustier: null,
    lieblingsHaustier: null,

    /** Gegenstände als `{ itemId: Anzahl }`. */
    inventar: {},

    /** Eier im Brutkasten. */
    eier: [],
    brutplaetze: 2,

    /** Laufende Expeditionen. */
    expeditionen: [],

    /** Haustierbuch: `{ speciesId: { gesehen, gefangen, anzahl, ersteBegegnung } }` */
    buch: {},

    /** Zuhause: freigeschaltete Räume und gekaufte Möbel. */
    zuhause: {
      raeume: { schlafzimmer: true },
      moebel: {},
    },

    /** Tagesaufgaben. */
    aufgaben: {
      tag: dayKey(),
      liste: [],
      minutenHeute: 0,
    },

    /** Freigeschaltete Erfolge: `{ id: Zeitstempel }`. */
    erfolge: {},

    /** Zähler für Erfolge, Statistik und Aufgaben. */
    statistik: {
      spielzeitMs: 0,
      sitzungen: 0,
      tageGespielt: 1,
      letzterTag: dayKey(),
      serie: 1,
      besteSerie: 1,
      aktionen: {},
      aktionenGesamt: 0,
      minispiele: {},
      minispieleGewonnen: 0,
      eierGeschluepft: 0,
      entwicklungen: 0,
      expeditionen: 0,
      muenzenGesamt: 0,
      diamantenGesamt: 0,
      fotos: 0,
    },

    /** Fotogalerie (kleine, komprimierte Bilder). */
    galerie: [],

    /** Einstellungen. */
    einstellungen: {
      theme: 'dark',
      sound: true,
      musik: false,
      lautstaerke: 0.6,
      bewegung: 'voll',
      autosave: true,
    },

    /** Merker für einmalige oder tagesbezogene Ereignisse. */
    flags: {
      starterGewaehlt: false,
      einfuehrungGesehen: false,
      goldenesEiTag: null,
      nachtwesenTag: null,
      saisonPetJahr: null,
    },
  };
}

// ---------------------------------------------------------------------------
// Zugriff
// ---------------------------------------------------------------------------

let state = createNewSave();
let notifyScheduled = false;
const subscribers = new Set();

/** Der aktuelle Spielstand (nicht direkt verändern — `update()` benutzen). */
export function getState() {
  return state;
}

/** Ersetzt den kompletten Spielstand (Laden, Import, Zurücksetzen). */
export function setState(next) {
  state = next;
  notify(true);
}

/**
 * Ändert den Spielstand.
 * @param {(state:object)=>void} mutator verändert das Objekt direkt
 * @param {{silent?:boolean}} [options] `silent` unterdrückt die Benachrichtigung
 */
export function update(mutator, options = {}) {
  const result = mutator(state);
  if (!options.silent) notify();
  return result;
}

/**
 * Abonniert Änderungen. Der Rückgabewert meldet wieder ab.
 * Die UI nutzt das, um den aktiven Bildschirm neu zu zeichnen.
 */
export function subscribe(handler) {
  subscribers.add(handler);
  return () => subscribers.delete(handler);
}

/** Sammelt Änderungen und meldet sie höchstens einmal pro Bild. */
function notify(immediate = false) {
  if (immediate) {
    flush();
    return;
  }
  if (notifyScheduled) return;
  notifyScheduled = true;
  requestAnimationFrame(flush);
}

function flush() {
  notifyScheduled = false;
  for (const handler of [...subscribers]) {
    try {
      handler(state);
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Oberfläche:', error);
    }
  }
  emit(EVENTS.STATE_CHANGED, state);
}

// ---------------------------------------------------------------------------
// Selektoren — bequemer Lesezugriff für UI und Systeme
// ---------------------------------------------------------------------------

/** Das gerade betreute Haustier (oder `null`, solange keins gewählt ist). */
export function activePet(s = state) {
  return s.haustiere.find((pet) => pet.id === s.aktivesHaustier) || s.haustiere[0] || null;
}

/** Haustier per ID. */
export function petById(id, s = state) {
  return s.haustiere.find((pet) => pet.id === id) || null;
}

/** Die Haustiere im Team, in gespeicherter Reihenfolge. */
export function teamPets(s = state) {
  return s.team.map((id) => petById(id, s)).filter(Boolean);
}

/** Haustiere außerhalb des Teams — das Gehege. */
export function sanctuaryPets(s = state) {
  return s.haustiere.filter((pet) => !s.team.includes(pet.id));
}

/** Anzahl eines Gegenstands im Beutel. */
export function itemCount(itemId, s = state) {
  return s.inventar[itemId] || 0;
}

/** Ist ein Raum freigeschaltet? */
export function hasRoom(roomId, s = state) {
  return Boolean(s.zuhause.raeume[roomId]);
}

/** Freie Brutplätze. */
export function freeIncubatorSlots(s = state) {
  return Math.max(0, s.brutplaetze - s.eier.length);
}

/** Läuft dieses Haustier gerade auf Expedition? */
export function isOnExpedition(petId, s = state) {
  return s.expeditionen.some((trip) => trip.petId === petId);
}

/** Erzeugt eine neue ID mit Präfix — hier gebündelt, damit IDs einheitlich aussehen. */
export function newId(prefix) {
  return uid(prefix);
}
