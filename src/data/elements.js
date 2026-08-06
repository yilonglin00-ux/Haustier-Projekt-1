/**
 * elements.js — Die zwölf Elemente.
 *
 * Elemente sind vor allem Identität: Farbe, Symbol, Lebensraum und ein
 * kleiner Einfluss darauf, welche Bedürfnisse schneller sinken. Es gibt
 * bewusst kein Kampfsystem mit Typenvorteilen — das Spiel dreht sich ums
 * Pflegen und Sammeln.
 */

export const ELEMENTS = {
  feuer: {
    id: 'feuer',
    name: 'Feuer',
    symbol: '🔥',
    farbe: '#ff7a45',
    lebensraum: 'Vulkanhänge und warme Aschefelder',
    /** Faktoren auf den Bedürfnis-Abbau (1 = normal). */
    abbau: { durst: 1.35, energie: 1.1, sauberkeit: 0.9 },
  },
  wasser: {
    id: 'wasser',
    name: 'Wasser',
    symbol: '💧',
    farbe: '#38b6ff',
    lebensraum: 'Küsten, Flussläufe und tiefe Seen',
    abbau: { sauberkeit: 0.6, durst: 0.7, hunger: 1.1 },
  },
  natur: {
    id: 'natur',
    name: 'Natur',
    symbol: '🌿',
    farbe: '#4cc38a',
    lebensraum: 'Alte Wälder und Blütenlichtungen',
    abbau: { hunger: 0.85, energie: 0.9 },
  },
  blitz: {
    id: 'blitz',
    name: 'Blitz',
    symbol: '⚡',
    farbe: '#ffc93c',
    lebensraum: 'Gewitterebenen und Sturmhügel',
    abbau: { energie: 1.4, hunger: 1.2 },
  },
  eis: {
    id: 'eis',
    name: 'Eis',
    symbol: '❄️',
    farbe: '#7fd8e8',
    lebensraum: 'Gletscherzungen und Frostwälder',
    abbau: { energie: 0.8, sauberkeit: 0.75 },
  },
  schatten: {
    id: 'schatten',
    name: 'Schatten',
    symbol: '🌑',
    farbe: '#8b6bd9',
    lebensraum: 'Höhlenlabyrinthe und Nachtschluchten',
    abbau: { stimmung: 1.2, energie: 0.85 },
  },
  licht: {
    id: 'licht',
    name: 'Licht',
    symbol: '✨',
    farbe: '#ffd98e',
    lebensraum: 'Sonnenterrassen und Spiegelseen',
    abbau: { stimmung: 0.75, energie: 1.05 },
  },
  gestein: {
    id: 'gestein',
    name: 'Gestein',
    symbol: '🪨',
    farbe: '#b08968',
    lebensraum: 'Geröllhalden und Steinbrüche',
    abbau: { hunger: 0.7, sauberkeit: 1.3, energie: 0.7 },
  },
  wind: {
    id: 'wind',
    name: 'Wind',
    symbol: '🍃',
    farbe: '#9ad9c8',
    lebensraum: 'Hochplateaus und Wolkenkanten',
    abbau: { energie: 1.15, sauberkeit: 0.85 },
  },
  metall: {
    id: 'metall',
    name: 'Metall',
    symbol: '⚙️',
    farbe: '#a9b4c2',
    lebensraum: 'Alte Schmieden und Erzadern',
    abbau: { hunger: 0.75, sauberkeit: 1.25, gesundheit: 0.85 },
  },
  geist: {
    id: 'geist',
    name: 'Geist',
    symbol: '👻',
    farbe: '#d67ab1',
    lebensraum: 'Vergessene Ruinen und Nebelfriedhöfe',
    abbau: { hunger: 0.5, durst: 0.5, stimmung: 1.15 },
  },
  kristall: {
    id: 'kristall',
    name: 'Kristall',
    symbol: '💠',
    farbe: '#7ae5d0',
    lebensraum: 'Geoden-Grotten und Prismenhöhlen',
    abbau: { sauberkeit: 0.7, energie: 0.9, hunger: 0.8 },
  },
};

export const ELEMENT_ORDER = Object.keys(ELEMENTS);

export function element(id) {
  return ELEMENTS[id] || ELEMENTS.natur;
}

/** Abbau-Faktor eines Elements für ein bestimmtes Bedürfnis. */
export function decayFactor(elementId, need) {
  return element(elementId).abbau?.[need] ?? 1;
}
