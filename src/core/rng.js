/**
 * rng.js — Zufall mit Kontrolle.
 *
 * Zwei Arten von Zufall im Spiel:
 *  1. Freier Zufall (Beute, Kritische Treffer) — nutzt `Math.random`.
 *  2. Reproduzierbarer Zufall (Tagesereignisse, tägliche Shop-Angebote) —
 *     nutzt einen gesäten Generator, damit derselbe Tag denselben Inhalt zeigt,
 *     auch wenn der Spieler die Seite neu lädt.
 */

/** Schneller, guter 32-Bit-PRNG. Liefert eine Funktion, die [0,1) zurückgibt. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Wandelt eine Zeichenkette in einen Zahlen-Seed (FNV-1a). */
export function hashSeed(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Gesäter Generator aus beliebigem Text, z. B. `seededRandom('2026-08-06:shop')`. */
export function seededRandom(text) {
  return mulberry32(hashSeed(text));
}

// --- Bequeme Wrapper -------------------------------------------------------

/** Ganzzahl in [min, max] (beide inklusive). */
export function randInt(min, max, rand = Math.random) {
  return Math.floor(rand() * (max - min + 1)) + min;
}

/** Gleitkommazahl in [min, max). */
export function randFloat(min, max, rand = Math.random) {
  return rand() * (max - min) + min;
}

/** Zufälliges Element einer Liste. */
export function pick(list, rand = Math.random) {
  return list[Math.floor(rand() * list.length)];
}

/** `count` verschiedene Elemente aus einer Liste (ohne Zurücklegen). */
export function pickMany(list, count, rand = Math.random) {
  const pool = [...list];
  const result = [];
  while (result.length < count && pool.length) {
    result.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  }
  return result;
}

/** Trifft mit der Wahrscheinlichkeit `probability` (0..1) zu. */
export function chance(probability, rand = Math.random) {
  return rand() < probability;
}

/**
 * Gewichtete Auswahl.
 * @param {Array<{weight:number}>} entries Einträge mit `weight`-Feld
 * @returns {*} der gezogene Eintrag
 */
export function weightedPick(entries, rand = Math.random) {
  const total = entries.reduce((sum, entry) => sum + (entry.weight || 0), 0);
  if (total <= 0) return entries[0];
  let roll = rand() * total;
  for (const entry of entries) {
    roll -= entry.weight || 0;
    if (roll <= 0) return entry;
  }
  return entries[entries.length - 1];
}

/**
 * Gewichtete Auswahl über ein Objekt `{ schluessel: gewicht }`.
 * @returns {string} der gezogene Schlüssel
 */
export function weightedKey(weights, rand = Math.random) {
  const entries = Object.entries(weights).map(([key, weight]) => ({ key, weight }));
  return weightedPick(entries, rand).key;
}

/** Mischt eine Liste (Fisher-Yates), ohne das Original zu verändern. */
export function shuffle(list, rand = Math.random) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Streuung um einen Grundwert, z. B. für individuelle Basiswerte eines Haustiers.
 * `spread` ist ein Anteil (0.15 = ±15 %).
 */
export function jitter(base, spread = 0.15, rand = Math.random) {
  return Math.round(base * (1 + (rand() * 2 - 1) * spread));
}
