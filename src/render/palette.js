/**
 * palette.js — Farbarbeit für die Kreaturen.
 *
 * Eine Art bringt drei Grundfarben mit (Haupt, Akzent, Schatten). Daraus
 * leiten wir alles Weitere ab: Lichtkante, Tiefenschatten, Umriss, Glühen.
 * Farbvarianten (Nachtschlag, Schimmernd …) verschieben Farbton, Sättigung
 * und Helligkeit — dadurch sieht dieselbe Art in jeder Variante anders aus,
 * ohne dass wir Farben doppelt pflegen müssen.
 */

import { variant } from '../data/rarity.js';
import { clamp } from '../core/util.js';

// --- Umrechnungen ----------------------------------------------------------

export function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

export function rgbToHex({ r, g, b }) {
  const to = (v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

export function hexToHsl(hex) {
  const { r, g, b } = hexToRgb(hex);
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;
  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === rr) h = ((gg - bb) / delta) % 6;
    else if (max === gg) h = (bb - rr) / delta + 2;
    else h = (rr - gg) / delta + 4;
  }
  h = (h * 60 + 360) % 360;

  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  return { h, s, l };
}

export function hslToHex({ h, s, l }) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let rgb;
  if (h < 60) rgb = [c, x, 0];
  else if (h < 120) rgb = [x, c, 0];
  else if (h < 180) rgb = [0, c, x];
  else if (h < 240) rgb = [0, x, c];
  else if (h < 300) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  return rgbToHex({ r: (rgb[0] + m) * 255, g: (rgb[1] + m) * 255, b: (rgb[2] + m) * 255 });
}

// --- Anpassungen -----------------------------------------------------------

/** Verschiebt eine Farbe in Farbton, Sättigung und Helligkeit. */
export function adjust(hex, { hue = 0, sat = 1, light = 1 } = {}) {
  const hsl = hexToHsl(hex);
  return hslToHex({
    h: (hsl.h + hue + 360) % 360,
    s: clamp(hsl.s * sat, 0, 1),
    l: clamp(hsl.l * light, 0.03, 0.97),
  });
}

/** Dunkelt eine Farbe ab (0 … 1). */
export function darken(hex, amount = 0.2) {
  return adjust(hex, { light: 1 - amount });
}

/** Hellt eine Farbe auf (0 … 1). */
export function lighten(hex, amount = 0.2) {
  return adjust(hex, { light: 1 + amount });
}

/** Mischt zwei Farben. */
export function mix(a, b, t = 0.5) {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return rgbToHex({
    r: ca.r + (cb.r - ca.r) * t,
    g: ca.g + (cb.g - ca.g) * t,
    b: ca.b + (cb.b - ca.b) * t,
  });
}

/** Farbe mit Deckkraft als `rgba()`-Zeichenkette. */
export function alpha(hex, a) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

// --- Ableitung einer vollständigen Palette ---------------------------------

/**
 * Baut die Arbeitspalette eines Sprites.
 * @param {string[]} base [Haupt, Akzent, Schatten] aus den Artdaten
 * @param {string} variantId Farbvariante
 * @returns {object} benannte Farben für den Zeichner
 */
export function buildPalette(base, variantId = 'normal') {
  const v = variant(variantId);
  const shift = { hue: v.hue, sat: v.sat, light: v.licht };

  const haupt = adjust(base[0], shift);
  const akzent = adjust(base[1], shift);
  const tief = adjust(base[2], shift);

  return {
    haupt,
    akzent,
    tief,
    /** Lichtkante oben */
    licht: lighten(haupt, 0.28),
    /** Bauch/Unterseite */
    bauch: mix(haupt, akzent, 0.62),
    /** Schattenseite */
    schatten: mix(haupt, tief, 0.55),
    /** Umriss */
    umriss: darken(tief, 0.25),
    /** Augenweiß-Ersatz für leuchtende Augen */
    auge: lighten(akzent, 0.35),
    /**
     * Iris — bewusst kräftig gehalten. Würden wir hier `akzent` nehmen, gingen
     * die Augen bei hellen Kreaturen (Gelb, Weiß) im Kopf unter.
     */
    iris: mix(darken(akzent, 0.35), tief, 0.35),
    /** Pupille */
    pupille: darken(tief, 0.35),
    /** Glühen / Aura */
    glanz: lighten(akzent, 0.15),
    /** Musterfarbe */
    muster: mix(tief, akzent, 0.35),
    schimmernd: Boolean(v.glanz),
    variante: v.id,
  };
}

/** Palette einer Art direkt aus den Artdaten. */
export function paletteForSpecies(speciesEntry, variantId = 'normal') {
  return buildPalette(speciesEntry.palette, variantId);
}
