/**
 * rarity.js — Seltenheitsstufen.
 *
 * Die Seltenheit steuert vier Dinge:
 *   1. wie oft ein Haustier überhaupt auftaucht (`gewicht`)
 *   2. wie stark seine Basiswerte sind (`werteFaktor`)
 *   3. wie aufwendig es dargestellt wird (`kunst`)
 *   4. was es beim Freilassen einbringt (`wert`)
 */

export const RARITIES = {
  gewoehnlich: {
    id: 'gewoehnlich',
    name: 'Gewöhnlich',
    symbol: '⚪',
    farbe: '#b6bfcc',
    gewicht: 480,
    werteFaktor: 1.0,
    kunst: 'prozedural',
    wert: 25,
    beschreibung: 'Häufig anzutreffen, unkomplizierte Entwicklung, solide Werte.',
  },
  ungewoehnlich: {
    id: 'ungewoehnlich',
    name: 'Ungewöhnlich',
    symbol: '🟢',
    farbe: '#55c57a',
    gewicht: 270,
    werteFaktor: 1.15,
    kunst: 'prozedural',
    wert: 60,
    beschreibung: 'Bessere Basiswerte und ungewöhnliche Farbschläge.',
  },
  selten: {
    id: 'selten',
    name: 'Selten',
    symbol: '🔵',
    farbe: '#4aa8ff',
    gewicht: 140,
    werteFaktor: 1.35,
    kunst: 'signatur',
    wert: 160,
    beschreibung: 'Eigene Silhouetten, besondere Fähigkeiten, seltenere Entwicklungen.',
  },
  episch: {
    id: 'episch',
    name: 'Episch',
    symbol: '🟣',
    farbe: '#b072f5',
    gewicht: 68,
    werteFaktor: 1.6,
    kunst: 'illustriert',
    wert: 420,
    beschreibung: 'Handgezeichnete Designs, starke Werte, eigene Animationen.',
  },
  legendaer: {
    id: 'legendaer',
    name: 'Legendär',
    symbol: '🟡',
    farbe: '#ffc03a',
    gewicht: 18,
    werteFaktor: 1.95,
    kunst: 'illustriert',
    wert: 1200,
    beschreibung: 'Sehr selten, einzigartige Entwicklungslinie, besondere Fähigkeiten.',
  },
  mystisch: {
    id: 'mystisch',
    name: 'Mystisch',
    symbol: '🔴',
    farbe: '#ff5a7a',
    gewicht: 4,
    werteFaktor: 2.3,
    kunst: 'illustriert',
    wert: 3000,
    beschreibung: 'Extrem selten. Nur über geheime Bedingungen zu erhalten.',
  },
};

/** Reihenfolge von häufig nach selten — für Sortierungen und Anzeigen. */
export const RARITY_ORDER = [
  'gewoehnlich',
  'ungewoehnlich',
  'selten',
  'episch',
  'legendaer',
  'mystisch',
];

export function rarity(id) {
  return RARITIES[id] || RARITIES.gewoehnlich;
}

export function rarityRank(id) {
  return RARITY_ORDER.indexOf(id);
}

/**
 * Grundgewichte für eine Ziehung, angepasst an einen „Glücksbonus“.
 * `luck` > 1 verschiebt die Verteilung spürbar nach oben, ohne Häufiges
 * ganz zu verdrängen (sonst fühlt sich Sammeln beliebig an).
 */
export function rarityWeights(luck = 1) {
  const weights = {};
  for (const id of RARITY_ORDER) {
    const rank = rarityRank(id);
    weights[id] = RARITIES[id].gewicht * Math.pow(luck, rank * 0.75);
  }
  return weights;
}

/** Farbvarianten: kosmetische Farbschläge, die mit der Seltenheit häufiger werden. */
export const VARIANTS = {
  normal: { id: 'normal', name: 'Normal', gewicht: 1000, hue: 0, sat: 1, licht: 1 },
  hell: { id: 'hell', name: 'Lichtschlag', gewicht: 150, hue: 8, sat: 0.85, licht: 1.18 },
  dunkel: { id: 'dunkel', name: 'Nachtschlag', gewicht: 150, hue: -10, sat: 0.9, licht: 0.72 },
  blass: { id: 'blass', name: 'Perlschlag', gewicht: 90, hue: 0, sat: 0.45, licht: 1.12 },
  tief: { id: 'tief', name: 'Tiefschlag', gewicht: 90, hue: 26, sat: 1.35, licht: 0.86 },
  schimmernd: { id: 'schimmernd', name: 'Schimmernd', gewicht: 8, hue: 140, sat: 1.3, licht: 1.1, glanz: true },
};

export const VARIANT_ORDER = ['normal', 'hell', 'dunkel', 'blass', 'tief', 'schimmernd'];

export function variant(id) {
  return VARIANTS[id] || VARIANTS.normal;
}

/** Gewichte für Farbvarianten; Glück erhöht vor allem die Chance auf „Schimmernd“. */
export function variantWeights(luck = 1) {
  const weights = {};
  for (const id of VARIANT_ORDER) {
    const base = VARIANTS[id].gewicht;
    weights[id] = id === 'schimmernd' ? base * luck * luck : base;
  }
  return weights;
}
