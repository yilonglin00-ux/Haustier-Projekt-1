/**
 * petSprite.js — Der Zeichner für alle Kreaturen.
 *
 * Die Darstellung ist nach Seltenheit gestaffelt:
 *
 *   ⚪🟢  prozedural  — flache Farben, klarer Umriss, Bauteile aus parts.js
 *   🔵    signatur    — zusätzlich Farbverläufe, Lichtkante, Signaturteile
 *   🟣🟡🔴 illustriert — zusätzlich Aura, Tiefenschatten, Glanzlichter,
 *                        Partikel; bei vielen Arten außerdem eine eigene,
 *                        handgezeichnete Illustration aus `art/`.
 *
 * Nach außen gibt es genau einen Vertrag: `createSprite()` liefert ein
 * Element mit einem `<svg>`, dessen Gruppen immer gleich heißen
 * (`.pet-root`, `.pet-body`, `.pet-eye`, `.pet-tail`, `.pet-ear`, …).
 * Animationen, Kleidung, Fotomodus und Buch-Ansicht funktionieren dadurch
 * für jede Kreatur gleich — egal, woher ihre Zeichnung stammt.
 */

import { species } from '../data/species.js';
import { rarity } from '../data/rarity.js';
import { paletteForSpecies, alpha } from './palette.js';
import {
  drawBody,
  drawEars,
  drawTail,
  drawEyes,
  drawMouth,
  drawPattern,
  drawExtra,
  GROUND_Y,
} from './parts.js';
import { drawOutfit } from './outfit.js';
import { getArt } from './art/index.js';

/** Kunststufe je Seltenheit. */
const DETAIL_BY_ART = { prozedural: 0, signatur: 1, illustriert: 2 };

let spriteCounter = 0;

/**
 * @typedef {object} SpriteSpec
 * @property {string} artId      ID der Art
 * @property {string} [variante] Farbvariante
 * @property {object} [outfit]   getragene Kleidung
 * @property {string} [stimmung] 'normal' | 'begeistert' | 'traurig' | 'schlafend' | 'krank'
 */

/**
 * Baut das SVG einer Kreatur als Text.
 * @param {SpriteSpec} spec
 * @param {{schatten?:boolean, effekte?:boolean}} [options]
 */
export function spriteMarkup(spec, options = {}) {
  const { schatten = true, effekte = true } = options;
  const art = species(spec.artId);
  if (!art) return '';

  spriteCounter += 1;
  const id = `sp${spriteCounter}`;
  const ra = rarity(art.rarity);
  const detail = DETAIL_BY_ART[ra.kunst] ?? 0;
  const p = paletteForSpecies(art, spec.variante || 'normal');
  const ctx = { id, d: detail, art, spec };

  // Handgezeichnete Illustration, falls vorhanden — sonst der Bauteil-Zeichner.
  const custom = detail >= 2 ? getArt(art.id) : null;
  const drawing = custom ? custom(p, ctx) : composeFromParts(art, p, ctx);

  const geometry = { kopf: drawing.kopf, rumpf: drawing.rumpf, ruecken: drawing.ruecken };
  const kleidung = drawOutfit(spec.outfit, geometry);

  return [
    `<svg viewBox="0 0 200 200" class="pet-svg" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${art.name}">`,
    defs(id, p, detail),
    schatten ? bodenSchatten(p, drawing) : '',
    `<g class="pet-root">`,
    effekte && detail >= 2 ? auraLayer(id, p, drawing) : '',
    drawing.hinten || '',
    kleidung.hinten,
    `<g class="pet-body">${drawing.koerper || ''}</g>`,
    drawing.vorne || '',
    kleidung.vorne,
    p.schimmernd ? schimmerLayer(id, drawing) : '',
    effekte && detail >= 2 ? funkenLayer(p, drawing) : '',
    `</g>`,
    `</svg>`,
  ].join('');
}

/** Setzt die Kreatur aus den Bauteilen zusammen. */
function composeFromParts(art, p, ctx) {
  const form = art.form;
  const body = drawBody(form.koerper, p, ctx);
  const geo = { kopf: body.kopf, rumpf: body.rumpf, ruecken: body.ruecken };

  const extra = drawExtra(form.extra, geo, p, ctx);
  const kopfKreis = kopfMarkup(body.kopf, p, ctx);

  return {
    hinten: body.hinten + extra.hinten + drawTail(form.schweif, body.schweif, p, ctx),
    koerper: body.koerper + kopfKreis,
    vorne: [
      body.vorne,
      drawPattern(form.muster, body.rumpf, p, ctx),
      drawEars(form.ohren, body.kopf, p, ctx),
      drawEyes(form.augen, body.kopf, p, ctx),
      drawMouth(body.kopf, p, ctx.spec.stimmung),
      extra.vorne,
    ].join(''),
    kopf: body.kopf,
    rumpf: body.rumpf,
    ruecken: body.ruecken,
  };
}

/** Der Kopf sitzt bei den meisten Formen als eigener Kreis auf dem Körper. */
function kopfMarkup(kopf, p, ctx) {
  const stroke = `stroke="${p.umriss}" stroke-width="${ctx.d >= 2 ? 2 : 2.4}" stroke-linejoin="round"`;
  const fill = ctx.d >= 1 ? `url(#${ctx.id}-kopf)` : p.haupt;
  const wange =
    ctx.d >= 1
      ? `<ellipse cx="${kopf.x - kopf.r * 0.62}" cy="${kopf.y + kopf.r * 0.3}" rx="6" ry="4" fill="${p.akzent}" opacity="0.45"/>` +
        `<ellipse cx="${kopf.x + kopf.r * 0.62}" cy="${kopf.y + kopf.r * 0.3}" rx="6" ry="4" fill="${p.akzent}" opacity="0.45"/>`
      : '';
  return (
    `<g class="pet-head"><circle cx="${kopf.x}" cy="${kopf.y}" r="${kopf.r}" fill="${fill}" ${stroke}/>` +
    `<ellipse cx="${kopf.x - kopf.r * 0.3}" cy="${kopf.y - kopf.r * 0.42}" rx="${kopf.r * 0.4}" ry="${kopf.r * 0.28}" fill="${p.licht}" opacity="${ctx.d >= 1 ? 0.35 : 0.2}"/>` +
    wange +
    `</g>`
  );
}

// ---------------------------------------------------------------------------
// Ebenen und Definitionen
// ---------------------------------------------------------------------------

function defs(id, p, detail) {
  if (detail < 1) {
    return `<defs><radialGradient id="${id}-aura"><stop offset="0%" stop-color="${p.glanz}" stop-opacity="0.6"/><stop offset="100%" stop-color="${p.glanz}" stop-opacity="0"/></radialGradient></defs>`;
  }

  const tiefe = detail >= 2
    ? `<filter id="${id}-tiefe" x="-30%" y="-30%" width="160%" height="160%">
         <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="${p.umriss}" flood-opacity="0.35"/>
       </filter>
       <filter id="${id}-glow" x="-60%" y="-60%" width="220%" height="220%">
         <feGaussianBlur stdDeviation="4" result="b"/>
         <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
       </filter>`
    : '';

  return `<defs>
    <linearGradient id="${id}-koerper" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0%" stop-color="${p.licht}"/>
      <stop offset="52%" stop-color="${p.haupt}"/>
      <stop offset="100%" stop-color="${p.schatten}"/>
    </linearGradient>
    <linearGradient id="${id}-kopf" x1="0.2" y1="0" x2="0.7" y2="1">
      <stop offset="0%" stop-color="${p.licht}"/>
      <stop offset="58%" stop-color="${p.haupt}"/>
      <stop offset="100%" stop-color="${p.schatten}"/>
    </linearGradient>
    <linearGradient id="${id}-fluegel" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${p.licht}"/>
      <stop offset="100%" stop-color="${p.akzent}"/>
    </linearGradient>
    <radialGradient id="${id}-aura">
      <stop offset="0%" stop-color="${p.glanz}" stop-opacity="0.75"/>
      <stop offset="60%" stop-color="${p.glanz}" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="${p.glanz}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="${id}-schimmer" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="45%" stop-color="#ffffff" stop-opacity="0.55"/>
      <stop offset="60%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    ${tiefe}
  </defs>`;
}

function bodenSchatten(p, drawing) {
  const r = (drawing.rumpf?.r || 40) * 0.82;
  return `<ellipse class="pet-shadow" cx="${drawing.rumpf?.x || 100}" cy="${GROUND_Y}" rx="${r}" ry="${r * 0.2}" fill="${alpha(p.umriss, 0.28)}"/>`;
}

function auraLayer(id, p, drawing) {
  const c = drawing.rumpf || { x: 100, y: 130, r: 44 };
  return `<circle class="pet-aura" cx="${c.x}" cy="${c.y - 8}" r="${c.r + 30}" fill="url(#${id}-aura)"/>`;
}

/** Der „Schimmernd"-Farbschlag bekommt einen wandernden Glanz. */
function schimmerLayer(id, drawing) {
  const c = drawing.rumpf || { x: 100, y: 130, r: 44 };
  return (
    `<ellipse cx="${c.x}" cy="${c.y - 10}" rx="${c.r + 6}" ry="${c.r + 22}" fill="url(#${id}-schimmer)" opacity="0.5" class="pet-shimmer"/>`
  );
}

/** Kleine Funken für illustrierte Kreaturen. */
function funkenLayer(p, drawing) {
  const c = drawing.rumpf || { x: 100, y: 130, r: 44 };
  const dots = [
    [-c.r - 8, -22, 2.6, 0],
    [c.r + 6, -34, 2, 1.2],
    [-14, -c.r - 26, 1.8, 2.1],
    [26, -c.r - 14, 2.2, 0.6],
  ];
  return (
    `<g class="pet-funken">` +
    dots
      .map(
        ([dx, dy, r, delay]) =>
          `<circle cx="${c.x + dx}" cy="${c.y + dy}" r="${r}" fill="${p.licht}" opacity="0.75" style="animation:pet-float ${2.4 + delay}s ease-in-out ${delay}s infinite"/>`
      )
      .join('') +
    `</g>`
  );
}

// ---------------------------------------------------------------------------
// DOM-Anbindung
// ---------------------------------------------------------------------------

/**
 * Erzeugt ein fertiges Sprite-Element.
 * @param {SpriteSpec} spec
 * @param {{klasse?:string, animiert?:boolean, schatten?:boolean, effekte?:boolean}} [options]
 * @returns {HTMLElement}
 */
export function createSprite(spec, options = {}) {
  const { klasse = '', animiert = true } = options;
  const host = document.createElement('div');
  host.className = `sprite ${animiert ? 'sprite--animated' : ''} ${klasse}`.trim();
  host.dataset.mood = spec.stimmung || 'normal';
  host.dataset.art = spec.artId;
  host.innerHTML = spriteMarkup(spec, options);
  return host;
}

/** Aktualisiert die Stimmung eines bestehenden Sprites, ohne neu zu zeichnen. */
export function setSpriteMood(host, mood) {
  if (host) host.dataset.mood = mood || 'normal';
}

/**
 * Spielt eine einmalige Aktionsanimation ab (siehe animations.css).
 * @param {HTMLElement} host
 * @param {string} action z. B. 'essen', 'spielen', 'streicheln', 'training', 'baden'
 */
export function playSpriteAction(host, action) {
  if (!host) return;
  const klasse = `sprite--act-${action}`;
  host.classList.remove(klasse);
  // Neuzeichnen erzwingen, damit dieselbe Animation erneut startet.
  void host.offsetWidth;
  host.classList.add(klasse);
  setTimeout(() => host.classList.remove(klasse), 2200);
}

/**
 * Zeichnet ein Sprite in ein Canvas — Grundlage für den Fotomodus.
 * @returns {Promise<HTMLCanvasElement>}
 */
export function spriteToCanvas(spec, size = 512, background = null) {
  return new Promise((resolve, reject) => {
    const markup = spriteMarkup(spec, { schatten: true, effekte: true });
    const blob = new Blob([markup], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (background) {
        const gradient = ctx.createLinearGradient(0, 0, 0, size);
        gradient.addColorStop(0, background[0]);
        gradient.addColorStop(1, background[1]);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
      }
      ctx.drawImage(image, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Sprite konnte nicht gezeichnet werden.'));
    };
    image.src = url;
  });
}

/** Wird ein Haustier handgezeichnet dargestellt? (Für die Anzeige im Buch.) */
export function artTier(artId) {
  const art = species(artId);
  if (!art) return 'prozedural';
  return rarity(art.rarity).kunst;
}
