/**
 * expeditions.js — Zonen für Expeditionen.
 *
 * Eine Expedition läuft in Echtzeit weiter, auch wenn das Spiel geschlossen ist.
 * Je höher die Zone, desto länger die Dauer, desto besser die Beute — und desto
 * höher die Anforderung an das Level des Haustiers.
 *
 * Beute-Tabellen sind gewichtete Listen; `systems/expeditions.js` zieht daraus.
 */

import { MINUTE, HOUR } from '../core/util.js';

export const ZONES = [
  {
    id: 'heimatwiese',
    name: 'Heimatwiese',
    icon: '🌼',
    minLevel: 1,
    dauer: 3 * MINUTE,
    element: 'natur',
    text: 'Gleich hinter dem Gartenzaun. Sicher, sonnig, überschaubar.',
    muenzen: [20, 60],
    xp: [25, 45],
    eiChance: 0.28,
    eiGewichte: { normal: 92, selten: 8 },
    beute: [
      { id: 'beere', gewicht: 30, anzahl: [1, 3] },
      { id: 'apfel', gewicht: 22, anzahl: [1, 2] },
      { id: 'wasserflasche', gewicht: 20, anzahl: [1, 2] },
      { id: 'koernermix', gewicht: 16, anzahl: [1, 2] },
      { id: 'heilkraut', gewicht: 8, anzahl: [1, 1] },
      { id: 'seife', gewicht: 4, anzahl: [1, 1] },
    ],
  },
  {
    id: 'fluesterwald',
    name: 'Flüsterwald',
    icon: '🌲',
    minLevel: 6,
    dauer: 8 * MINUTE,
    element: 'natur',
    text: 'Uralte Bäume, die einander Neuigkeiten zuraunen.',
    muenzen: [55, 130],
    xp: [60, 110],
    eiChance: 0.3,
    eiGewichte: { normal: 78, selten: 20, episch: 2 },
    beute: [
      { id: 'brot', gewicht: 24, anzahl: [1, 2] },
      { id: 'heilkraut', gewicht: 20, anzahl: [1, 2] },
      { id: 'quellwasser', gewicht: 18, anzahl: [1, 2] },
      { id: 'pluesch', gewicht: 8, anzahl: [1, 1] },
      { id: 'honigwabe', gewicht: 12, anzahl: [1, 1] },
      { id: 'blattstein', gewicht: 3, anzahl: [1, 1] },
      { id: 'goldbeutel', gewicht: 6, anzahl: [1, 1] },
      { id: 'brutbeschleuniger', gewicht: 9, anzahl: [1, 1] },
    ],
  },
  {
    id: 'kristallhoehle',
    name: 'Kristallhöhle',
    icon: '💠',
    minLevel: 13,
    dauer: 18 * MINUTE,
    element: 'kristall',
    text: 'Jeder Schritt hallt siebenfach zurück. Es glitzert überall.',
    muenzen: [120, 260],
    xp: [130, 220],
    eiChance: 0.32,
    eiGewichte: { normal: 55, selten: 36, episch: 9 },
    beute: [
      { id: 'quellwasser', gewicht: 18, anzahl: [1, 3] },
      { id: 'verband', gewicht: 16, anzahl: [1, 2] },
      { id: 'mondbeere', gewicht: 14, anzahl: [1, 2] },
      { id: 'goldbeutel', gewicht: 14, anzahl: [1, 2] },
      { id: 'puzzlewuerfel', gewicht: 6, anzahl: [1, 1] },
      { id: 'eisstein', gewicht: 5, anzahl: [1, 1] },
      { id: 'blitzstein', gewicht: 5, anzahl: [1, 1] },
      { id: 'diamantsplitter', gewicht: 4, anzahl: [1, 1] },
      { id: 'expeditionskarte', gewicht: 8, anzahl: [1, 1] },
      { id: 'monokel', gewicht: 3, anzahl: [1, 1] },
    ],
  },
  {
    id: 'gluttal',
    name: 'Gluttal',
    icon: '🌋',
    minLevel: 21,
    dauer: 35 * MINUTE,
    element: 'feuer',
    text: 'Der Boden ist warm, die Luft flimmert. Nichts für Zartbesaitete.',
    muenzen: [220, 430],
    xp: [240, 380],
    eiChance: 0.34,
    eiGewichte: { normal: 34, selten: 42, episch: 21, legendaer: 3 },
    beute: [
      { id: 'glutpflaume', gewicht: 20, anzahl: [1, 3] },
      { id: 'fleischhappen', gewicht: 16, anzahl: [1, 3] },
      { id: 'goldbeutel', gewicht: 16, anzahl: [1, 2] },
      { id: 'kraftfutter', gewicht: 12, anzahl: [1, 2] },
      { id: 'feuerstein', gewicht: 8, anzahl: [1, 1] },
      { id: 'elixier', gewicht: 8, anzahl: [1, 1] },
      { id: 'diamantsplitter', gewicht: 7, anzahl: [1, 2] },
      { id: 'lederpanzer', gewicht: 5, anzahl: [1, 1] },
      { id: 'erfahrungsbonbon', gewicht: 8, anzahl: [1, 1] },
    ],
  },
  {
    id: 'frostkamm',
    name: 'Frostkamm',
    icon: '🏔️',
    minLevel: 29,
    dauer: 55 * MINUTE,
    element: 'eis',
    text: 'Ein Grat über den Wolken. Der Wind schneidet, die Aussicht entschädigt.',
    muenzen: [340, 640],
    xp: [360, 560],
    eiChance: 0.35,
    eiGewichte: { selten: 44, episch: 42, legendaer: 13, mystisch: 1 },
    beute: [
      { id: 'frostkirsche', gewicht: 20, anzahl: [1, 3] },
      { id: 'kraftsaft', gewicht: 14, anzahl: [1, 2] },
      { id: 'goldbeutel', gewicht: 16, anzahl: [1, 3] },
      { id: 'eisstein', gewicht: 8, anzahl: [1, 1] },
      { id: 'elixier', gewicht: 10, anzahl: [1, 2] },
      { id: 'diamantsplitter', gewicht: 10, anzahl: [1, 2] },
      { id: 'wollschal', gewicht: 6, anzahl: [1, 1] },
      { id: 'erfahrungsbonbon', gewicht: 10, anzahl: [1, 2] },
      { id: 'glueckskleeblatt', gewicht: 6, anzahl: [1, 1] },
    ],
  },
  {
    id: 'sturmklippe',
    name: 'Sturmklippe',
    icon: '⛰️',
    minLevel: 37,
    dauer: 80 * MINUTE,
    element: 'blitz',
    text: 'Hier schlägt der Blitz nach oben. Angeblich.',
    muenzen: [480, 880],
    xp: [500, 760],
    eiChance: 0.36,
    eiGewichte: { selten: 30, episch: 46, legendaer: 22, mystisch: 2 },
    beute: [
      { id: 'kraftsaft', gewicht: 16, anzahl: [1, 3] },
      { id: 'goldbeutel', gewicht: 16, anzahl: [2, 4] },
      { id: 'blitzstein', gewicht: 9, anzahl: [1, 1] },
      { id: 'lichtstein', gewicht: 6, anzahl: [1, 1] },
      { id: 'diamantsplitter', gewicht: 13, anzahl: [1, 3] },
      { id: 'heldenumhang', gewicht: 5, anzahl: [1, 1] },
      { id: 'erfahrungsbonbon', gewicht: 12, anzahl: [1, 2] },
      { id: 'wundertrank', gewicht: 6, anzahl: [1, 1] },
      { id: 'glueckskleeblatt', gewicht: 8, anzahl: [1, 1] },
      { id: 'regenbogenfrucht', gewicht: 4, anzahl: [1, 1] },
    ],
  },
  {
    id: 'nebelmoor',
    name: 'Nebelmoor',
    icon: '🌫️',
    minLevel: 45,
    dauer: 2 * HOUR,
    element: 'geist',
    text: 'Man findet immer etwas. Ob man es behalten will, ist eine andere Frage.',
    muenzen: [700, 1250],
    xp: [700, 1050],
    eiChance: 0.38,
    eiGewichte: { episch: 48, legendaer: 44, mystisch: 8 },
    beute: [
      { id: 'goldbeutel', gewicht: 18, anzahl: [2, 5] },
      { id: 'diamantsplitter', gewicht: 16, anzahl: [2, 4] },
      { id: 'schattenstein', gewicht: 8, anzahl: [1, 1] },
      { id: 'mondstein', gewicht: 5, anzahl: [1, 1] },
      { id: 'erfahrungsbonbon', gewicht: 14, anzahl: [2, 3] },
      { id: 'wundertrank', gewicht: 9, anzahl: [1, 2] },
      { id: 'glueckskleeblatt', gewicht: 10, anzahl: [1, 2] },
      { id: 'ritterruestung', gewicht: 5, anzahl: [1, 1] },
      { id: 'regenbogenfrucht', gewicht: 8, anzahl: [1, 1] },
      { id: 'sternenkeks', gewicht: 7, anzahl: [1, 1] },
    ],
  },
  {
    id: 'sternenruine',
    name: 'Sternenruine',
    icon: '🌠',
    minLevel: 55,
    dauer: 4 * HOUR,
    element: 'licht',
    text: 'Was hier stand, ist älter als jede Karte. Es wartet immer noch.',
    muenzen: [1200, 2200],
    xp: [1200, 1900],
    eiChance: 0.42,
    eiGewichte: { episch: 32, legendaer: 52, mystisch: 16 },
    /** Sehr seltener Sonderfund dieser Zone. */
    sonderfund: { eiTyp: 'regenbogen', chance: 0.02 },
    beute: [
      { id: 'goldbeutel', gewicht: 16, anzahl: [4, 8] },
      { id: 'diamantsplitter', gewicht: 18, anzahl: [3, 6] },
      { id: 'megastein', gewicht: 2, anzahl: [1, 1] },
      { id: 'sonnenstein', gewicht: 6, anzahl: [1, 1] },
      { id: 'mondstein', gewicht: 6, anzahl: [1, 1] },
      { id: 'erfahrungsbonbon', gewicht: 14, anzahl: [2, 5] },
      { id: 'wundertrank', gewicht: 10, anzahl: [1, 2] },
      { id: 'sternenmantel', gewicht: 3, anzahl: [1, 1] },
      { id: 'krone', gewicht: 2, anzahl: [1, 1] },
      { id: 'sternenkeks', gewicht: 12, anzahl: [1, 3] },
      { id: 'zuneigungsband', gewicht: 11, anzahl: [1, 2] },
    ],
  },
];

const BY_ID = new Map(ZONES.map((zone) => [zone.id, zone]));

export function zone(id) {
  return BY_ID.get(id) || null;
}

/** Zonen, die ein Haustier dieses Levels betreten darf. */
export function availableZones(level) {
  return ZONES.filter((entry) => entry.minLevel <= level);
}

/**
 * Wie anstrengend eine Zone ist — kostet Energie und senkt Sauberkeit.
 * Skaliert mit der Dauer, damit lange Ausflüge spürbar sind.
 */
export function zoneStrain(entry) {
  const stunden = entry.dauer / HOUR;
  return {
    energie: Math.min(70, 12 + stunden * 16),
    sauberkeit: Math.min(60, 10 + stunden * 14),
    hunger: Math.min(55, 8 + stunden * 12),
    durst: Math.min(55, 8 + stunden * 12),
  };
}
