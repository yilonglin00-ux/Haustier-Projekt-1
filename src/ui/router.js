/**
 * router.js — Bildschirm-Verwaltung.
 *
 * Bildschirme melden sich hier an, die Hülle (`app.js`) fragt sie ab.
 * Diese Trennung verhindert Ringabhängigkeiten: Bildschirme dürfen den Router
 * importieren, ohne die App-Hülle zu kennen.
 */

import { emit, EVENTS } from '../core/events.js';

/**
 * @typedef {object} ScreenDef
 * @property {string} id            eindeutiger Schlüssel, z. B. 'zuhause'
 * @property {string} label         Beschriftung in der Navigation
 * @property {string} icon          Emoji für die Navigation
 * @property {number} [order]       Sortierung in der Navigation
 * @property {boolean} [primary]    erscheint auf dem Smartphone in der Bodenleiste
 * @property {boolean} [hidden]     taucht gar nicht in der Navigation auf
 * @property {boolean} [live]       bei Zustandsänderungen neu zeichnen (Standard: true)
 * @property {(params:object)=>Node} render   liefert den Inhalt
 * @property {()=>string|number|null} [badge] kleine Zahl/Punkt an der Navigation
 * @property {()=>void} [onLeave]   Aufräumen beim Verlassen
 */

const screens = new Map();
let currentId = null;
let currentParams = {};

/** @param {ScreenDef} def */
export function registerScreen(def) {
  screens.set(def.id, { order: 50, live: true, primary: false, hidden: false, ...def });
}

export function getScreen(id) {
  return screens.get(id) || null;
}

/** Alle Bildschirme in Navigationsreihenfolge. */
export function allScreens() {
  return [...screens.values()].sort((a, b) => a.order - b.order);
}

/** Bildschirme, die in der Navigation auftauchen. */
export function navScreens() {
  return allScreens().filter((screen) => !screen.hidden);
}

export function currentScreenId() {
  return currentId;
}

export function currentScreenParams() {
  return currentParams;
}

/**
 * Wechselt den Bildschirm.
 * @param {string} id
 * @param {object} [params] wird an `render` weitergereicht
 */
export function navigate(id, params = {}) {
  if (!screens.has(id)) {
    console.warn(`Unbekannter Bildschirm: ${id}`);
    return;
  }
  if (currentId === id && JSON.stringify(params) === JSON.stringify(currentParams)) {
    emit(EVENTS.SCREEN_CHANGED, { id, params, same: true });
    return;
  }

  const previous = screens.get(currentId);
  previous?.onLeave?.();

  currentId = id;
  currentParams = params;
  emit(EVENTS.SCREEN_CHANGED, { id, params, same: false });
}

/** Erzwingt ein Neuzeichnen des aktuellen Bildschirms. */
export function refresh() {
  emit(EVENTS.SCREEN_CHANGED, { id: currentId, params: currentParams, same: true, refresh: true });
}
