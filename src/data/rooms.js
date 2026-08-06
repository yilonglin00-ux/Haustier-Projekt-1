/**
 * rooms.js — Das Zuhause: Räume und Möbel.
 *
 * Räume kosten einmalig Münzen und schalten einen dauerhaften Vorteil frei.
 * Möbel sind zusätzlich kaufbar und verstärken den Raum-Bonus weiter.
 *
 * Alle Boni sind **additive Zuschläge auf 1** und werden überall gleich
 * gelesen: `1 + (boni.schluessel || 0)`. `fruchtErnte` und `brutplatz` sind
 * die Ausnahme — sie zählen Stückzahlen, keine Faktoren.
 */

export const ROOMS = {
  schlafzimmer: {
    id: 'schlafzimmer',
    name: 'Schlafzimmer',
    icon: '🛏️',
    preis: 0,
    text: 'Wo alles anfängt: ein warmer Platz zum Schlafen.',
    bonus: { schlafErholung: 0.1 },
    bonusText: 'Grundlage für erholsamen Schlaf.',
  },
  kueche: {
    id: 'kueche',
    name: 'Küche',
    icon: '🍳',
    preis: 600,
    text: 'Selbst gekocht schmeckt jedem Haustier besser.',
    bonus: { futterWirkung: 0.25, ladenRabatt: 0.1 },
    bonusText: 'Futter wirkt 25 % stärker, Laden 10 % günstiger.',
  },
  garten: {
    id: 'garten',
    name: 'Garten',
    icon: '🌻',
    preis: 1200,
    text: 'Hier wächst nach, was der Beutel hergibt.',
    bonus: { fruchtErnte: 1 },
    bonusText: 'Erntet täglich Früchte für den Beutel.',
  },
  trainingsraum: {
    id: 'trainingsraum',
    name: 'Trainingsraum',
    icon: '🏋️',
    preis: 2200,
    text: 'Geräte, Matten und ein sehr geduldiger Sandsack.',
    bonus: { trainingXp: 0.35, attributChance: 0.15 },
    bonusText: 'Training gibt 35 % mehr Erfahrung.',
  },
  labor: {
    id: 'labor',
    name: 'Labor',
    icon: '🔬',
    preis: 3600,
    text: 'Brutkästen, Messgeräte und beunruhigend viele Notizen.',
    bonus: { brutzeit: -0.25, brutplatz: 1 },
    bonusText: 'Brutzeit −25 %, ein zusätzlicher Brutplatz.',
  },
  aquarium: {
    id: 'aquarium',
    name: 'Aquarium',
    icon: '🐠',
    preis: 5200,
    text: 'Ein ganzes Riff im Wohnzimmer. Beruhigt alle Bewohner.',
    bonus: { stimmungRegen: 0.4, wasserBonus: 0.2 },
    bonusText: 'Stimmung sinkt langsamer, Wasser-Haustiere blühen auf.',
  },
};

export const ROOM_ORDER = ['schlafzimmer', 'kueche', 'garten', 'trainingsraum', 'labor', 'aquarium'];

export function room(id) {
  return ROOMS[id] || null;
}

/**
 * Möbel. `raum` bestimmt, in welchem Raum das Möbelstück steht;
 * `bonus` wird zum Raumbonus addiert bzw. multipliziert (siehe systems).
 */
export const FURNITURE = {
  // Schlafzimmer
  kuschelkissen: {
    id: 'kuschelkissen', name: 'Kuschelkissen', icon: '🛋️', raum: 'schlafzimmer',
    preis: 220, text: 'Weich genug, dass niemand mehr aufstehen will.',
    bonus: { schlafErholung: 0.2 },
  },
  himmelbett: {
    id: 'himmelbett', name: 'Himmelbett', icon: '🏰', raum: 'schlafzimmer',
    preis: 900, text: 'Vorhänge halten das Tageslicht draußen.',
    bonus: { schlafErholung: 0.35, stimmungRegen: 0.1 },
  },
  nachtlicht: {
    id: 'nachtlicht', name: 'Nachtlicht', icon: '🕯️', raum: 'schlafzimmer',
    preis: 380, text: 'Kleine Haustiere schlafen ruhiger.',
    bonus: { stimmungRegen: 0.15 },
  },

  // Küche
  vorratsschrank: {
    id: 'vorratsschrank', name: 'Vorratsschrank', icon: '🗄️', raum: 'kueche',
    preis: 450, text: 'Ordnung spart Geld.',
    bonus: { ladenRabatt: 0.05 },
  },
  ofen: {
    id: 'ofen', name: 'Steinofen', icon: '🔥', raum: 'kueche',
    preis: 780, text: 'Frisch gebackenes Brot für alle.',
    bonus: { futterWirkung: 0.2 },
  },
  kraeuterregal: {
    id: 'kraeuterregal', name: 'Kräuterregal', icon: '🌿', raum: 'kueche',
    preis: 640, text: 'Heilkräuter immer griffbereit.',
    bonus: { heilWirkung: 0.25 },
  },

  // Garten
  hochbeet: {
    id: 'hochbeet', name: 'Hochbeet', icon: '🪴', raum: 'garten',
    preis: 520, text: 'Mehr Ernte, weniger Bücken.',
    bonus: { fruchtErnte: 1 },
  },
  obstbaum: {
    id: 'obstbaum', name: 'Obstbaum', icon: '🌳', raum: 'garten',
    preis: 1100, text: 'Trägt zuverlässig, auch im Winter.',
    bonus: { fruchtErnte: 2 },
  },
  teich: {
    id: 'teich', name: 'Gartenteich', icon: '⛲', raum: 'garten',
    preis: 1400, text: 'Wasser-Haustiere ziehen hier nicht mehr weg.',
    bonus: { wasserBonus: 0.15, stimmungRegen: 0.1 },
  },

  // Trainingsraum
  laufrad: {
    id: 'laufrad', name: 'Großes Laufrad', icon: '🎡', raum: 'trainingsraum',
    preis: 700, text: 'Für alles, was rennen will.',
    bonus: { tempoTraining: 0.25 },
  },
  gewichte: {
    id: 'gewichte', name: 'Gewichte', icon: '🏋️', raum: 'trainingsraum',
    preis: 700, text: 'Schwer. Sehr schwer.',
    bonus: { staerkeTraining: 0.25 },
  },
  denksportecke: {
    id: 'denksportecke', name: 'Denksportecke', icon: '♟️', raum: 'trainingsraum',
    preis: 700, text: 'Rätsel, die auch Hüter überfordern.',
    bonus: { intelligenzTraining: 0.25 },
  },

  // Labor
  brutkasten: {
    id: 'brutkasten', name: 'Zweiter Brutkasten', icon: '🧫', raum: 'labor',
    preis: 1800, text: 'Ein zusätzlicher Platz für ein Ei.',
    bonus: { brutplatz: 1 },
  },
  waermelampe: {
    id: 'waermelampe', name: 'Wärmelampe', icon: '💡', raum: 'labor',
    preis: 1300, text: 'Eier schlüpfen spürbar schneller.',
    bonus: { brutzeit: -0.15 },
  },
  analysetisch: {
    id: 'analysetisch', name: 'Analysetisch', icon: '🔎', raum: 'labor',
    preis: 1600, text: 'Zeigt die Seltenheit eines Eis vor dem Schlüpfen.',
    bonus: { eiVorschau: 1 },
  },

  // Aquarium
  korallenriff: {
    id: 'korallenriff', name: 'Korallenriff', icon: '🪸', raum: 'aquarium',
    preis: 1500, text: 'Farbenpracht rund um die Uhr.',
    bonus: { wasserBonus: 0.2, stimmungRegen: 0.15 },
  },
  stroemungspumpe: {
    id: 'stroemungspumpe', name: 'Strömungspumpe', icon: '🌊', raum: 'aquarium',
    preis: 1200, text: 'Sauberes Wasser, zufriedene Bewohner.',
    bonus: { sauberkeitRegen: 0.25 },
  },
  tiefseefenster: {
    id: 'tiefseefenster', name: 'Tiefseefenster', icon: '🪟', raum: 'aquarium',
    preis: 2400, text: 'Blick in eine Dunkelheit, die zurückschaut.',
    bonus: { stimmungRegen: 0.2, glueckRegen: 0.15 },
  },
};

export const FURNITURE_LIST = Object.values(FURNITURE);

export function furniture(id) {
  return FURNITURE[id] || null;
}

export function furnitureOfRoom(roomId) {
  return FURNITURE_LIST.filter((entry) => entry.raum === roomId);
}

/**
 * Rechnet alle aktiven Boni zusammen.
 * Räume liefern Grundwerte, Möbel addieren darauf.
 * @param {object} home der `zuhause`-Teil des Spielstands
 */
export function homeBonuses(home) {
  const total = {};
  const add = (bonus) => {
    for (const [key, value] of Object.entries(bonus || {})) {
      total[key] = (total[key] || 0) + value;
    }
  };

  for (const id of ROOM_ORDER) {
    if (home.raeume?.[id]) add(ROOMS[id].bonus);
  }
  for (const [id, owned] of Object.entries(home.moebel || {})) {
    if (owned && FURNITURE[id]) add(FURNITURE[id].bonus);
  }
  return total;
}

/** Einzelner Bonuswert mit Standardwert. */
export function bonusValue(bonuses, key, fallback = 0) {
  return bonuses[key] ?? fallback;
}
