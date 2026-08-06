/**
 * economy.js — Münzen und Diamanten.
 *
 * Beide Währungen werden ausschließlich hier verändert. Dadurch landet jeder
 * Zugewinn zuverlässig in der Statistik und in den Tagesaufgaben, ohne dass
 * jede Fundstelle daran denken muss.
 */

import { update, getState } from '../core/state.js';
import { emit, EVENTS } from '../core/events.js';

/** Münzen gutschreiben. */
export function addCoins(amount, grund = '') {
  const menge = Math.max(0, Math.round(amount));
  if (!menge) return 0;
  update((s) => {
    s.spieler.muenzen += menge;
    s.statistik.muenzenGesamt += menge;
  });
  emit(EVENTS.COINS_CHANGED, { delta: menge, grund });
  return menge;
}

/**
 * Münzen abziehen.
 * @returns {boolean} ob genug vorhanden war
 */
export function spendCoins(amount) {
  const menge = Math.max(0, Math.round(amount));
  if (getState().spieler.muenzen < menge) return false;
  update((s) => {
    s.spieler.muenzen -= menge;
  });
  emit(EVENTS.COINS_CHANGED, { delta: -menge });
  return true;
}

/** Diamanten gutschreiben. */
export function addDiamonds(amount, grund = '') {
  const menge = Math.max(0, Math.round(amount));
  if (!menge) return 0;
  update((s) => {
    s.spieler.diamanten += menge;
    s.statistik.diamantenGesamt += menge;
  });
  emit(EVENTS.DIAMONDS_CHANGED, { delta: menge, grund });
  return menge;
}

/** Diamanten abziehen. */
export function spendDiamonds(amount) {
  const menge = Math.max(0, Math.round(amount));
  if (getState().spieler.diamanten < menge) return false;
  update((s) => {
    s.spieler.diamanten -= menge;
  });
  emit(EVENTS.DIAMONDS_CHANGED, { delta: -menge });
  return true;
}

export function coins() {
  return getState().spieler.muenzen;
}

export function diamonds() {
  return getState().spieler.diamanten;
}

export function canAfford(preis, diamantPreis = 0) {
  const s = getState();
  return s.spieler.muenzen >= (preis || 0) && s.spieler.diamanten >= (diamantPreis || 0);
}
