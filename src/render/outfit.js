/**
 * outfit.js — Kleidung als zusätzliche SVG-Ebene.
 *
 * Kleidung ist rein kosmetisch. Sie hängt an den Ankerpunkten, die jede
 * Körperform liefert (Kopf und Rumpf), und funktioniert dadurch für
 * prozedurale wie handgezeichnete Kreaturen gleichermaßen.
 */

const num = (n) => Math.round(n * 100) / 100;

/** Zeichnungen je Kleidungsstück. `g` enthält kopf und rumpf. */
const PIECES = {
  // --- Hüte ---------------------------------------------------------------
  strohhut: (g) => {
    const y = g.kopf.y - g.kopf.r * 0.86;
    return (
      `<ellipse cx="${num(g.kopf.x)}" cy="${num(y)}" rx="${num(g.kopf.r * 1.35)}" ry="9" fill="#e8c87a" stroke="#a8823a" stroke-width="2"/>` +
      `<ellipse cx="${num(g.kopf.x)}" cy="${num(y - 9)}" rx="${num(g.kopf.r * 0.62)}" ry="11" fill="#f0d78f" stroke="#a8823a" stroke-width="2"/>` +
      `<path d="M${num(g.kopf.x - g.kopf.r * 0.62)} ${num(y - 6)} q${num(g.kopf.r * 0.62)} 8 ${num(g.kopf.r * 1.24)} 0" stroke="#c05a4a" stroke-width="4" fill="none"/>`
    );
  },
  muetze: (g) => {
    const y = g.kopf.y - g.kopf.r * 0.8;
    return (
      `<path d="M${num(g.kopf.x - g.kopf.r * 0.9)} ${num(y)} q${num(g.kopf.r * 0.9)} -${num(g.kopf.r * 0.95)} ${num(g.kopf.r * 1.8)} 0 z" fill="#4f7fd8" stroke="#2d4f96" stroke-width="2"/>` +
      `<rect x="${num(g.kopf.x - g.kopf.r * 0.95)}" y="${num(y - 2)}" width="${num(g.kopf.r * 1.9)}" height="7" rx="3" fill="#3a63b4" stroke="#2d4f96" stroke-width="1.5"/>` +
      `<circle cx="${num(g.kopf.x)}" cy="${num(y - g.kopf.r * 0.95)}" r="5" fill="#ffd166"/>`
    );
  },
  zylinder: (g) => {
    const y = g.kopf.y - g.kopf.r * 0.84;
    return (
      `<ellipse cx="${num(g.kopf.x)}" cy="${num(y)}" rx="${num(g.kopf.r * 1.1)}" ry="7" fill="#22242e" stroke="#0f1016" stroke-width="2"/>` +
      `<rect x="${num(g.kopf.x - g.kopf.r * 0.58)}" y="${num(y - 28)}" width="${num(g.kopf.r * 1.16)}" height="28" fill="#2b2e3a" stroke="#0f1016" stroke-width="2"/>` +
      `<rect x="${num(g.kopf.x - g.kopf.r * 0.58)}" y="${num(y - 10)}" width="${num(g.kopf.r * 1.16)}" height="6" fill="#c0392b"/>`
    );
  },
  krone: (g) => {
    const y = g.kopf.y - g.kopf.r * 0.82;
    const w = g.kopf.r * 0.92;
    return (
      `<path d="M${num(g.kopf.x - w)} ${num(y)} l4 -22 l${num(w * 0.55)} 12 l${num(w * 0.45)} -20 l${num(w * 0.45)} 20 l${num(w * 0.55)} -12 l4 22 z" fill="#ffd451" stroke="#c9992a" stroke-width="2"/>` +
      `<circle cx="${num(g.kopf.x)}" cy="${num(y - 16)}" r="4" fill="#ff5a7a"/>` +
      `<circle cx="${num(g.kopf.x - w * 0.6)}" cy="${num(y - 6)}" r="3" fill="#4aa8ff"/>` +
      `<circle cx="${num(g.kopf.x + w * 0.6)}" cy="${num(y - 6)}" r="3" fill="#55c57a"/>`
    );
  },

  // --- Brillen ------------------------------------------------------------
  sonnenbrille: (g) => {
    const dx = g.kopf.r * 0.42;
    return (
      `<rect x="${num(g.kopf.x - dx - 11)}" y="${num(g.kopf.y - 7)}" width="22" height="14" rx="5" fill="#1b1d26" opacity="0.92"/>` +
      `<rect x="${num(g.kopf.x + dx - 11)}" y="${num(g.kopf.y - 7)}" width="22" height="14" rx="5" fill="#1b1d26" opacity="0.92"/>` +
      `<path d="M${num(g.kopf.x - dx + 11)} ${num(g.kopf.y)} h${num(dx * 2 - 22)}" stroke="#1b1d26" stroke-width="3"/>`
    );
  },
  monokel: (g) => {
    const dx = g.kopf.r * 0.42;
    return (
      `<circle cx="${num(g.kopf.x + dx)}" cy="${num(g.kopf.y)}" r="12" fill="#ffffff" opacity="0.25" stroke="#d4af37" stroke-width="2.5"/>` +
      `<path d="M${num(g.kopf.x + dx + 10)} ${num(g.kopf.y + 8)} q6 16 -2 24" stroke="#d4af37" stroke-width="1.6" fill="none"/>`
    );
  },
  taucherbrille: (g) => {
    const dx = g.kopf.r * 0.42;
    return (
      `<rect x="${num(g.kopf.x - dx - 13)}" y="${num(g.kopf.y - 10)}" width="${num(dx * 2 + 26)}" height="20" rx="9" fill="#6fd0f0" opacity="0.45" stroke="#2c6f8c" stroke-width="2.5"/>` +
      `<path d="M${num(g.kopf.x - dx - 13)} ${num(g.kopf.y)} h-8 M${num(g.kopf.x + dx + 13)} ${num(g.kopf.y)} h8" stroke="#2c6f8c" stroke-width="3"/>`
    );
  },

  // --- Schals -------------------------------------------------------------
  wollschal: (g) => {
    const y = g.kopf.y + g.kopf.r * 0.86;
    return (
      `<path d="M${num(g.kopf.x - g.kopf.r * 0.85)} ${num(y)} q${num(g.kopf.r * 0.85)} 14 ${num(g.kopf.r * 1.7)} 0 q-4 12 -${num(g.kopf.r * 1.7)} 0 z" fill="#d1543f" stroke="#96341f" stroke-width="2"/>` +
      `<path d="M${num(g.kopf.x + g.kopf.r * 0.5)} ${num(y + 6)} q10 18 4 28 l-12 -4 q6 -12 -2 -22 z" fill="#d1543f" stroke="#96341f" stroke-width="2"/>`
    );
  },
  seidenschal: (g) => {
    const y = g.kopf.y + g.kopf.r * 0.86;
    return (
      `<path d="M${num(g.kopf.x - g.kopf.r * 0.8)} ${num(y)} q${num(g.kopf.r * 0.8)} 12 ${num(g.kopf.r * 1.6)} 0 q-4 10 -${num(g.kopf.r * 1.6)} 0 z" fill="#e88fc0" stroke="#b3548a" stroke-width="2"/>` +
      `<path d="M${num(g.kopf.x - g.kopf.r * 0.4)} ${num(y + 4)} q-18 20 -30 22 q10 -18 22 -26 z" fill="#f0a9d0" stroke="#b3548a" stroke-width="1.6"/>`
    );
  },

  // --- Umhänge ------------------------------------------------------------
  heldenumhang: (g) => {
    const y = g.kopf.y + g.kopf.r * 0.7;
    return (
      `<path d="M${num(g.rumpf.x - g.rumpf.r * 0.8)} ${num(y)} q-16 46 -6 74 q${num(g.rumpf.r)} 12 ${num(g.rumpf.r * 1.6)} 0 q10 -28 -6 -74 z" fill="#c0392b" stroke="#7d2418" stroke-width="2.4" opacity="0.95"/>` +
      `<path d="M${num(g.rumpf.x - g.rumpf.r * 0.8)} ${num(y)} q${num(g.rumpf.r * 0.8)} 12 ${num(g.rumpf.r * 1.6)} 0" stroke="#ffd166" stroke-width="4" fill="none"/>`
    );
  },
  sternenmantel: (g) => {
    const y = g.kopf.y + g.kopf.r * 0.7;
    const stars = [[-22, 30], [10, 52], [-6, 70], [22, 34]]
      .map(([dx, dy]) => `<circle cx="${num(g.rumpf.x + dx)}" cy="${num(y + dy)}" r="2.4" fill="#ffffff" opacity="0.9"/>`)
      .join('');
    return (
      `<path d="M${num(g.rumpf.x - g.rumpf.r * 0.85)} ${num(y)} q-18 48 -8 78 q${num(g.rumpf.r)} 14 ${num(g.rumpf.r * 1.7)} 0 q10 -30 -8 -78 z" fill="#1f2450" stroke="#0d1030" stroke-width="2.4"/>` +
      stars +
      `<path d="M${num(g.rumpf.x - g.rumpf.r * 0.85)} ${num(y)} q${num(g.rumpf.r * 0.85)} 12 ${num(g.rumpf.r * 1.7)} 0" stroke="#8f9dff" stroke-width="3.5" fill="none"/>`
    );
  },

  // --- Rüstungen ----------------------------------------------------------
  lederpanzer: (g) => (
    `<path d="M${num(g.rumpf.x - g.rumpf.r * 0.66)} ${num(g.rumpf.y - 14)} q${num(g.rumpf.r * 0.66)} -14 ${num(g.rumpf.r * 1.32)} 0 l-4 34 q-${num(g.rumpf.r * 0.62)} 12 -${num(g.rumpf.r * 1.24)} 0 z" fill="#8a5a32" stroke="#5a3618" stroke-width="2.2" opacity="0.95"/>` +
    `<path d="M${num(g.rumpf.x - g.rumpf.r * 0.5)} ${num(g.rumpf.y + 2)} h${num(g.rumpf.r)}" stroke="#5a3618" stroke-width="3"/>` +
    `<circle cx="${num(g.rumpf.x)}" cy="${num(g.rumpf.y + 2)}" r="4" fill="#d4af37"/>`
  ),
  ritterruestung: (g) => (
    `<path d="M${num(g.rumpf.x - g.rumpf.r * 0.7)} ${num(g.rumpf.y - 18)} q${num(g.rumpf.r * 0.7)} -16 ${num(g.rumpf.r * 1.4)} 0 l-6 40 q-${num(g.rumpf.r * 0.64)} 14 -${num(g.rumpf.r * 1.28)} 0 z" fill="#b8c2d0" stroke="#697588" stroke-width="2.4"/>` +
    `<path d="M${num(g.rumpf.x)} ${num(g.rumpf.y - 20)} v46" stroke="#697588" stroke-width="2.5"/>` +
    `<path d="M${num(g.rumpf.x - g.rumpf.r * 0.66)} ${num(g.rumpf.y - 6)} q${num(g.rumpf.r * 0.66)} 10 ${num(g.rumpf.r * 1.32)} 0" stroke="#8d9aad" stroke-width="2.5" fill="none"/>` +
    `<circle cx="${num(g.rumpf.x)}" cy="${num(g.rumpf.y - 8)}" r="5" fill="#4aa8ff" stroke="#697588" stroke-width="1.5"/>`
  ),
};

/** Reihenfolge, in der Kleidung gezeichnet wird (hinten nach vorn). */
const BACK_PIECES = new Set(['heldenumhang', 'sternenmantel']);

/**
 * Zeichnet die getragene Kleidung.
 * @param {object} outfit `{ hut, brille, schal, umhang, ruestung }`
 * @param {object} geometry Ankerpunkte der Körperform
 * @returns {{hinten:string, vorne:string}}
 */
export function drawOutfit(outfit, geometry) {
  if (!outfit) return { hinten: '', vorne: '' };
  let hinten = '';
  let vorne = '';

  for (const itemId of Object.values(outfit)) {
    const draw = itemId && PIECES[itemId];
    if (!draw) continue;
    const markup = `<g class="pet-outfit pet-outfit--${itemId}">${draw(geometry)}</g>`;
    if (BACK_PIECES.has(itemId)) hinten += markup;
    else vorne += markup;
  }

  return { hinten, vorne };
}

/** Gibt es für dieses Kleidungsstück eine Zeichnung? */
export function hasOutfitArt(itemId) {
  return Boolean(PIECES[itemId]);
}
