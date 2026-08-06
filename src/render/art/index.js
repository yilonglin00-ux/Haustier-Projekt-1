/**
 * art/index.js — Registry der handgezeichneten Illustrationen.
 *
 * `petSprite.js` fragt hier für jede epische und seltenere Art nach einer
 * eigenen Zeichnung. Gibt es keine, greift automatisch der illustrierte
 * Bauteil-Zeichner — das Spiel bleibt also immer vollständig darstellbar.
 *
 * Eine neue Illustration hinzuzufügen heißt: Funktion schreiben, hier
 * eintragen. Sonst ändert sich nirgends etwas.
 */

import { infernopardMega, fluttitanMega, waldhueterMega } from './megas.js';
import { pyranthos, abyssaria, sylvaronn, voltarax, lumindra, goldkitz } from './legends.js';
import { aeternum, nyxaria, solmarax, prismara, obsidiel } from './mystics.js';

const REGISTRY = {
  // Megaformen der Starter
  infernopard_mega: infernopardMega,
  fluttitan_mega: fluttitanMega,
  waldhueter_mega: waldhueterMega,

  // Legendäre
  pyranthos,
  abyssaria,
  sylvaronn,
  voltarax,
  lumindra,
  goldkitz,

  // Mystische
  aeternum,
  nyxaria,
  solmarax,
  prismara,
  obsidiel,
};

/** Handgezeichnete Zeichenfunktion einer Art — oder `null`. */
export function getArt(speciesId) {
  return REGISTRY[speciesId] || null;
}

/** Gibt es für diese Art eine eigene Illustration? */
export function hasCustomArt(speciesId) {
  return Boolean(REGISTRY[speciesId]);
}

/** IDs aller handgezeichneten Arten — für Übersicht und Tests. */
export function customArtIds() {
  return Object.keys(REGISTRY);
}
