/**
 * events.js — Winziger Ereignis-Bus.
 *
 * Die Systeme kennen die UI nicht. Wenn etwas Bemerkenswertes passiert
 * (Level-Up, neues Haustier, Erfolg freigeschaltet), melden sie es hier;
 * UI, Statistik und Erfolgs-System hören zu. Das hält die Module entkoppelt.
 */

const listeners = new Map();

/**
 * Hört auf ein Ereignis.
 * @returns {Function} Abmelde-Funktion
 */
export function on(type, handler) {
  if (!listeners.has(type)) listeners.set(type, new Set());
  listeners.get(type).add(handler);
  return () => off(type, handler);
}

/** Hört genau einmal auf ein Ereignis. */
export function once(type, handler) {
  const unsubscribe = on(type, (payload) => {
    unsubscribe();
    handler(payload);
  });
  return unsubscribe;
}

export function off(type, handler) {
  listeners.get(type)?.delete(handler);
}

/** Löst ein Ereignis aus. Fehler eines Hörers stoppen die anderen nicht. */
export function emit(type, payload) {
  const set = listeners.get(type);
  if (!set) return;
  for (const handler of [...set]) {
    try {
      handler(payload);
    } catch (error) {
      console.error(`Fehler im Ereignis-Hörer für "${type}":`, error);
    }
  }
}

/** Nur für Tests / Neustart des Spielstands. */
export function clearAll() {
  listeners.clear();
}

/**
 * Bekannte Ereignisnamen an einer Stelle — verhindert Tippfehler und dient
 * gleichzeitig als Übersicht darüber, was im Spiel überhaupt passieren kann.
 */
export const EVENTS = {
  STATE_CHANGED: 'state:changed',
  SCREEN_CHANGED: 'screen:changed',

  PET_OBTAINED: 'pet:obtained',
  PET_LEVEL_UP: 'pet:levelup',
  PET_EVOLVED: 'pet:evolved',
  PET_ACTION: 'pet:action',
  PET_MOOD_CRITICAL: 'pet:moodCritical',
  PET_RELEASED: 'pet:released',

  EGG_FOUND: 'egg:found',
  EGG_HATCHED: 'egg:hatched',

  ITEM_GAINED: 'item:gained',
  ITEM_USED: 'item:used',

  COINS_CHANGED: 'coins:changed',
  DIAMONDS_CHANGED: 'diamonds:changed',

  EXPEDITION_STARTED: 'expedition:started',
  EXPEDITION_DONE: 'expedition:done',

  MINIGAME_FINISHED: 'minigame:finished',
  QUEST_PROGRESS: 'quest:progress',
  QUEST_COMPLETED: 'quest:completed',
  ACHIEVEMENT_UNLOCKED: 'achievement:unlocked',

  ROOM_UNLOCKED: 'room:unlocked',
  RARE_EVENT: 'event:rare',
  DAY_ROLLOVER: 'day:rollover',
};
