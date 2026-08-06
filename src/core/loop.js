/**
 * loop.js — Der Herzschlag des Spiels.
 *
 * Ein einziger `requestAnimationFrame`-Loop treibt alles an. Die Simulation
 * läuft in festen Sekundenschritten, damit Bedürfnisse unabhängig von der
 * Bildrate gleich schnell sinken. Ist der Tab im Hintergrund, pausiert der
 * Browser den Loop — die verlorene Zeit wird beim Zurückkommen nachgerechnet
 * (siehe `catchUp`).
 */

import { getState, update } from './state.js';
import { emit, EVENTS } from './events.js';
import { dayKey, HOUR } from './util.js';

/** Länge eines Simulationsschritts. */
const TICK_MS = 1000;

/**
 * Höchstens so viel Abwesenheit wird nachsimuliert. Wer eine Woche weg war,
 * findet seine Haustiere hungrig vor — aber nicht am Boden zerstört. Das
 * Spiel soll zum Zurückkommen einladen, nicht bestrafen.
 */
export const OFFLINE_CAP_MS = 12 * HOUR;

const tickHandlers = new Set();
const frameHandlers = new Set();

let running = false;
let rafId = null;
let accumulator = 0;
let lastFrame = 0;

/**
 * Meldet eine Funktion an, die jede Spielsekunde läuft.
 * @param {(seconds:number, state:object)=>void} handler
 * @returns {Function} Abmelde-Funktion
 */
export function onTick(handler) {
  tickHandlers.add(handler);
  return () => tickHandlers.delete(handler);
}

/**
 * Meldet eine Funktion an, die jedes Bild läuft (für weiche Anzeigen wie Timer).
 * @param {(dtMs:number)=>void} handler
 */
export function onFrame(handler) {
  frameHandlers.add(handler);
  return () => frameHandlers.delete(handler);
}

export function startLoop() {
  if (running) return;
  running = true;
  lastFrame = performance.now();
  rafId = requestAnimationFrame(frame);
}

export function stopLoop() {
  running = false;
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
}

function frame(now) {
  if (!running) return;
  const dt = Math.min(now - lastFrame, 1000); // Ausreißer nach Tab-Wechsel kappen
  lastFrame = now;

  for (const handler of frameHandlers) {
    try {
      handler(dt);
    } catch (error) {
      console.error('Fehler im Bild-Handler:', error);
    }
  }

  accumulator += dt;
  let steps = 0;
  while (accumulator >= TICK_MS && steps < 10) {
    accumulator -= TICK_MS;
    steps += 1;
    runTick(1);
  }

  rafId = requestAnimationFrame(frame);
}

/** Führt einen Simulationsschritt aus. `seconds` kann beim Nachrechnen größer als 1 sein. */
function runTick(seconds) {
  const state = getState();
  for (const handler of tickHandlers) {
    try {
      handler(seconds, state);
    } catch (error) {
      console.error('Fehler im Tick-Handler:', error);
    }
  }
}

/**
 * Rechnet die Abwesenheit seit dem letzten Besuch nach.
 * Wird einmal beim Start aufgerufen, bevor der Loop läuft.
 *
 * @returns {{elapsedMs:number, simulatedMs:number, cappedMs:number}}
 */
export function catchUp() {
  const state = getState();
  const now = Date.now();
  const elapsed = Math.max(0, now - (state.lastSeen || now));
  const simulated = Math.min(elapsed, OFFLINE_CAP_MS);

  if (simulated > 5000) {
    // In groben Blöcken nachrechnen: genau genug und in Sekundenbruchteilen erledigt.
    const blockSeconds = 60;
    let remaining = Math.floor(simulated / 1000);
    while (remaining > 0) {
      const step = Math.min(blockSeconds, remaining);
      runTick(step);
      remaining -= step;
    }
  }

  update((s) => {
    s.lastSeen = now;
  }, { silent: true });

  return { elapsedMs: elapsed, simulatedMs: simulated, cappedMs: Math.max(0, elapsed - simulated) };
}

/**
 * Prüft den Tageswechsel. Läuft im Tick mit, weil das Spiel über Mitternacht
 * hinaus offen bleiben kann.
 */
export function installDayWatcher() {
  return onTick(() => {
    const state = getState();
    const today = dayKey();
    if (state.statistik.letzterTag === today) return;

    const previous = state.statistik.letzterTag;
    update((s) => {
      const gestern = new Date();
      gestern.setDate(gestern.getDate() - 1);
      const warGestern = previous === dayKey(gestern);

      s.statistik.serie = warGestern ? s.statistik.serie + 1 : 1;
      s.statistik.besteSerie = Math.max(s.statistik.besteSerie, s.statistik.serie);
      s.statistik.tageGespielt += 1;
      s.statistik.letzterTag = today;
    });

    emit(EVENTS.DAY_ROLLOVER, { tag: today, vorher: previous });
  });
}

/** Zählt die Spielzeit mit — nur solange der Tab sichtbar ist. */
export function installPlaytimeTracker() {
  return onTick((seconds) => {
    if (document.visibilityState !== 'visible') return;
    update(
      (s) => {
        s.statistik.spielzeitMs += seconds * 1000;
        s.aufgaben.minutenHeute += seconds / 60;
      },
      { silent: true }
    );
  });
}
