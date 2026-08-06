/**
 * items.js — Alle Gegenstände.
 *
 * Ein Gegenstand beschreibt, was er kostet, wo er auftaucht und was er bewirkt.
 * `wirkung` verändert Bedürfnisse und Gefühle des Haustiers (siehe systems/actions.js);
 * `attribut` verändert dauerhaft ein Attribut; `spezial` löst Sonderlogik aus.
 *
 * Kategorien: futter | frucht | trank | spielzeug | medizin | pflege |
 *             stein | kleidung | spezial
 */

/** Kurzform für Wirkungen, damit die Tabelle lesbar bleibt. */
const W = (wirkung) => wirkung;

export const ITEMS = {
  // --- Futter --------------------------------------------------------------
  beere: {
    id: 'beere', name: 'Waldbeere', icon: '🫐', kategorie: 'futter',
    preis: 8, verkauf: 3, seltenheit: 'gewoehnlich', shop: true,
    text: 'Klein, süß, immer verfügbar.',
    wirkung: W({ hunger: 12, stimmung: 3 }),
  },
  koernermix: {
    id: 'koernermix', name: 'Körnermix', icon: '🌾', kategorie: 'futter',
    preis: 14, verkauf: 5, seltenheit: 'gewoehnlich', shop: true,
    text: 'Sättigt gut und ist für alle Elemente bekömmlich.',
    wirkung: W({ hunger: 22 }),
  },
  brot: {
    id: 'brot', name: 'Ofenbrot', icon: '🍞', kategorie: 'futter',
    preis: 20, verkauf: 7, seltenheit: 'gewoehnlich', shop: true,
    text: 'Warm aus der Küche. Macht satt und zufrieden.',
    wirkung: W({ hunger: 30, stimmung: 5 }),
  },
  fischfilet: {
    id: 'fischfilet', name: 'Fischfilet', icon: '🐟', kategorie: 'futter',
    preis: 32, verkauf: 12, seltenheit: 'ungewoehnlich', shop: true,
    text: 'Lieblingsessen aller Wasser-Haustiere.',
    wirkung: W({ hunger: 38, stimmung: 8 }), bevorzugt: 'wasser',
  },
  fleischhappen: {
    id: 'fleischhappen', name: 'Fleischhappen', icon: '🍖', kategorie: 'futter',
    preis: 34, verkauf: 13, seltenheit: 'ungewoehnlich', shop: true,
    text: 'Kräftig und deftig — Raubtiere lieben es.',
    wirkung: W({ hunger: 40, energie: 6 }),
  },
  honigwabe: {
    id: 'honigwabe', name: 'Honigwabe', icon: '🍯', kategorie: 'futter',
    preis: 48, verkauf: 18, seltenheit: 'ungewoehnlich', shop: true,
    text: 'Klebrig, golden, unwiderstehlich.',
    wirkung: W({ hunger: 34, glueck: 10, stimmung: 10 }),
  },
  kraftfutter: {
    id: 'kraftfutter', name: 'Kraftfutter', icon: '🥣', kategorie: 'futter',
    preis: 80, verkauf: 30, seltenheit: 'selten', shop: true,
    text: 'Aufbaunahrung für Haustiere im Training.',
    wirkung: W({ hunger: 45, energie: 20 }), attribut: { staerke: 1 },
  },
  festmahl: {
    id: 'festmahl', name: 'Festmahl', icon: '🍲', kategorie: 'futter',
    preis: 160, verkauf: 60, seltenheit: 'selten', shop: true,
    text: 'Ein ganzer Topf. Füllt jeden Magen und jedes Herz.',
    wirkung: W({ hunger: 100, glueck: 18, stimmung: 15, zuneigung: 5 }),
  },
  sternenkeks: {
    id: 'sternenkeks', name: 'Sternenkeks', icon: '⭐', kategorie: 'futter',
    preis: 0, diamanten: 3, verkauf: 90, seltenheit: 'episch', shop: true,
    text: 'Gebacken bei Vollmond. Schmeckt nach dem Lieblingsessen des Essers.',
    wirkung: W({ hunger: 100, glueck: 30, zuneigung: 15, stimmung: 25 }),
  },

  // --- Früchte -------------------------------------------------------------
  apfel: {
    id: 'apfel', name: 'Gartenapfel', icon: '🍎', kategorie: 'frucht',
    preis: 12, verkauf: 4, seltenheit: 'gewoehnlich', shop: true,
    text: 'Aus dem eigenen Garten — wenn man einen hat.',
    wirkung: W({ hunger: 15, durst: 10, gesundheit: 3 }),
  },
  sonnenfrucht: {
    id: 'sonnenfrucht', name: 'Sonnenfrucht', icon: '🥭', kategorie: 'frucht',
    preis: 40, verkauf: 15, seltenheit: 'ungewoehnlich', shop: true,
    text: 'Wärmt von innen. Feuer-Haustiere schnurren davon.',
    wirkung: W({ hunger: 20, durst: 18, energie: 12 }), bevorzugt: 'feuer',
  },
  mondbeere: {
    id: 'mondbeere', name: 'Mondbeere', icon: '🫐', kategorie: 'frucht',
    preis: 55, verkauf: 20, seltenheit: 'selten', shop: true,
    text: 'Wächst nur nachts. Beruhigt aufgeregte Gemüter.',
    wirkung: W({ hunger: 18, energie: 25, stimmung: 12 }),
  },
  glutpflaume: {
    id: 'glutpflaume', name: 'Glutpflaume', icon: '🍑', kategorie: 'frucht',
    preis: 60, verkauf: 22, seltenheit: 'selten', shop: false,
    text: 'Innen heiß wie ein Ofen. Fundstück aus Feuerregionen.',
    wirkung: W({ hunger: 25, energie: 30 }), attribut: { staerke: 1 },
  },
  frostkirsche: {
    id: 'frostkirsche', name: 'Frostkirsche', icon: '🍒', kategorie: 'frucht',
    preis: 60, verkauf: 22, seltenheit: 'selten', shop: false,
    text: 'Bleibt auch im Sommer eisig kalt.',
    wirkung: W({ durst: 45, gesundheit: 8 }), attribut: { tempo: 1 },
  },
  regenbogenfrucht: {
    id: 'regenbogenfrucht', name: 'Regenbogenfrucht', icon: '🌈', kategorie: 'frucht',
    preis: 0, diamanten: 5, verkauf: 150, seltenheit: 'episch', shop: true,
    text: 'Schmeckt jedes Mal anders. Erhöht alle Attribute ein wenig.',
    wirkung: W({ hunger: 40, durst: 40, glueck: 20 }),
    attribut: { staerke: 1, intelligenz: 1, tempo: 1 },
  },

  // --- Getränke ------------------------------------------------------------
  wasserflasche: {
    id: 'wasserflasche', name: 'Wasserflasche', icon: '💧', kategorie: 'trank',
    preis: 6, verkauf: 2, seltenheit: 'gewoehnlich', shop: true,
    text: 'Einfach Wasser. Wirkt Wunder.',
    wirkung: W({ durst: 30 }),
  },
  quellwasser: {
    id: 'quellwasser', name: 'Quellwasser', icon: '🫗', kategorie: 'trank',
    preis: 18, verkauf: 6, seltenheit: 'gewoehnlich', shop: true,
    text: 'Frisch aus dem Berg. Kühl und klar.',
    wirkung: W({ durst: 55, gesundheit: 4 }),
  },
  tautrunk: {
    id: 'tautrunk', name: 'Tautrunk', icon: '🥛', kategorie: 'trank',
    preis: 44, verkauf: 16, seltenheit: 'ungewoehnlich', shop: true,
    text: 'Gesammelter Morgentau. Weckt müde Haustiere sanft auf.',
    wirkung: W({ durst: 60, energie: 20, stimmung: 8 }),
  },
  kraftsaft: {
    id: 'kraftsaft', name: 'Kraftsaft', icon: '🧃', kategorie: 'trank',
    preis: 90, verkauf: 34, seltenheit: 'selten', shop: true,
    text: 'Stellt die Energie fast vollständig wieder her.',
    wirkung: W({ durst: 40, energie: 80 }),
  },

  // --- Spielzeug -----------------------------------------------------------
  ball: {
    id: 'ball', name: 'Springball', icon: '⚽', kategorie: 'spielzeug',
    preis: 30, verkauf: 11, seltenheit: 'gewoehnlich', shop: true, dauerhaft: true,
    text: 'Der Klassiker. Wirkt bei jedem Spielen mit.',
    bonus: { spielen: 1.2 },
  },
  pluesch: {
    id: 'pluesch', name: 'Plüschmaus', icon: '🧸', kategorie: 'spielzeug',
    preis: 55, verkauf: 20, seltenheit: 'ungewoehnlich', shop: true, dauerhaft: true,
    text: 'Wird geknuddelt, getragen und niemals hergegeben.',
    bonus: { spielen: 1.25, streicheln: 1.15 },
  },
  federangel: {
    id: 'federangel', name: 'Federangel', icon: '🪶', kategorie: 'spielzeug',
    preis: 70, verkauf: 26, seltenheit: 'ungewoehnlich', shop: true, dauerhaft: true,
    text: 'Unwiderstehlich für alles mit Pfoten.',
    bonus: { spielen: 1.35 },
  },
  puzzlewuerfel: {
    id: 'puzzlewuerfel', name: 'Puzzlewürfel', icon: '🧩', kategorie: 'spielzeug',
    preis: 120, verkauf: 45, seltenheit: 'selten', shop: true, dauerhaft: true,
    text: 'Fordert den Kopf. Intelligente Haustiere lieben ihn.',
    bonus: { spielen: 1.2, training: 1.2 }, attribut: { intelligenz: 2 },
  },
  kletterseil: {
    id: 'kletterseil', name: 'Kletterseil', icon: '🪢', kategorie: 'spielzeug',
    preis: 110, verkauf: 40, seltenheit: 'selten', shop: true, dauerhaft: true,
    text: 'Trainiert Kraft und Gleichgewicht zugleich.',
    bonus: { training: 1.3 }, attribut: { staerke: 2 },
  },

  // --- Medizin & Pflege ----------------------------------------------------
  heilkraut: {
    id: 'heilkraut', name: 'Heilkraut', icon: '🌱', kategorie: 'medizin',
    preis: 35, verkauf: 13, seltenheit: 'gewoehnlich', shop: true,
    text: 'Bitter, aber wirksam gegen leichte Beschwerden.',
    wirkung: W({ gesundheit: 30 }), heilt: true,
  },
  verband: {
    id: 'verband', name: 'Verband', icon: '🩹', kategorie: 'medizin',
    preis: 50, verkauf: 18, seltenheit: 'ungewoehnlich', shop: true,
    text: 'Für alles, was sich beim Toben wehgetan hat.',
    wirkung: W({ gesundheit: 55 }), heilt: true,
  },
  elixier: {
    id: 'elixier', name: 'Elixier', icon: '🧪', kategorie: 'medizin',
    preis: 130, verkauf: 48, seltenheit: 'selten', shop: true,
    text: 'Stellt die Gesundheit vollständig wieder her.',
    wirkung: W({ gesundheit: 100, energie: 20 }), heilt: true,
  },
  wundertrank: {
    id: 'wundertrank', name: 'Wundertrank', icon: '⚗️', kategorie: 'medizin',
    preis: 0, diamanten: 4, verkauf: 120, seltenheit: 'episch', shop: true,
    text: 'Bringt jedes Haustier sofort in Bestform — alle Werte voll.',
    wirkung: W({ gesundheit: 100, energie: 100, hunger: 100, durst: 100, sauberkeit: 100, stimmung: 40 }),
    heilt: true,
  },
  seife: {
    id: 'seife', name: 'Duftseife', icon: '🧼', kategorie: 'pflege',
    preis: 22, verkauf: 8, seltenheit: 'gewoehnlich', shop: true,
    text: 'Macht sauber und riecht nach Lavendel.',
    wirkung: W({ sauberkeit: 45, stimmung: 5 }),
  },
  buerste: {
    id: 'buerste', name: 'Fellbürste', icon: '🪮', kategorie: 'pflege',
    preis: 65, verkauf: 24, seltenheit: 'ungewoehnlich', shop: true, dauerhaft: true,
    text: 'Dauerhaft im Beutel: jedes Baden wirkt stärker.',
    bonus: { baden: 1.4 },
  },

  // --- Entwicklungssteine --------------------------------------------------
  feuerstein: {
    id: 'feuerstein', name: 'Feuerstein', icon: '🔥', kategorie: 'stein',
    preis: 300, verkauf: 110, seltenheit: 'selten', shop: true,
    text: 'Weckt schlummernde Glut in Feuer-Haustieren.',
    stein: 'feuer',
  },
  wasserstein: {
    id: 'wasserstein', name: 'Wasserstein', icon: '💧', kategorie: 'stein',
    preis: 300, verkauf: 110, seltenheit: 'selten', shop: true,
    text: 'Ein Tropfen, der nie verdunstet.', stein: 'wasser',
  },
  blattstein: {
    id: 'blattstein', name: 'Blattstein', icon: '🍃', kategorie: 'stein',
    preis: 300, verkauf: 110, seltenheit: 'selten', shop: true,
    text: 'Riecht nach Waldboden nach dem Regen.', stein: 'natur',
  },
  blitzstein: {
    id: 'blitzstein', name: 'Blitzstein', icon: '⚡', kategorie: 'stein',
    preis: 340, verkauf: 125, seltenheit: 'selten', shop: true,
    text: 'Knistert leise, wenn man ihn anfasst.', stein: 'blitz',
  },
  eisstein: {
    id: 'eisstein', name: 'Eisstein', icon: '❄️', kategorie: 'stein',
    preis: 340, verkauf: 125, seltenheit: 'selten', shop: true,
    text: 'Schmilzt niemals, auch nicht in der Hand.', stein: 'eis',
  },
  schattenstein: {
    id: 'schattenstein', name: 'Schattenstein', icon: '🌑', kategorie: 'stein',
    preis: 420, verkauf: 155, seltenheit: 'episch', shop: true,
    text: 'Schluckt das Licht, das auf ihn fällt.', stein: 'schatten',
  },
  lichtstein: {
    id: 'lichtstein', name: 'Lichtstein', icon: '✨', kategorie: 'stein',
    preis: 420, verkauf: 155, seltenheit: 'episch', shop: true,
    text: 'Leuchtet auch in völliger Dunkelheit weiter.', stein: 'licht',
  },
  mondstein: {
    id: 'mondstein', name: 'Mondstein', icon: '🌙', kategorie: 'stein',
    preis: 0, diamanten: 8, verkauf: 300, seltenheit: 'episch', shop: true,
    text: 'Ermöglicht nächtliche Entwicklungen — auch am helllichten Tag.',
    stein: 'mond', spezial: 'nachtentwicklung',
  },
  sonnenstein: {
    id: 'sonnenstein', name: 'Sonnenstein', icon: '☀️', kategorie: 'stein',
    preis: 0, diamanten: 8, verkauf: 300, seltenheit: 'episch', shop: true,
    text: 'Beschleunigt Entwicklungen, die sonst Tage brauchen.',
    stein: 'sonne', spezial: 'tagentwicklung',
  },
  megastein: {
    id: 'megastein', name: 'Megastein', icon: '💠', kategorie: 'stein',
    preis: 0, diamanten: 30, verkauf: 900, seltenheit: 'legendaer', shop: true,
    text: 'Der Schlüssel zur Megaform. Braucht ein Haustier auf Stufe 50 mit voller Zuneigung.',
    stein: 'mega',
  },

  // --- Kleidung (rein kosmetisch) ------------------------------------------
  strohhut: {
    id: 'strohhut', name: 'Strohhut', icon: '👒', kategorie: 'kleidung', slot: 'hut',
    preis: 90, verkauf: 34, seltenheit: 'gewoehnlich', shop: true, dauerhaft: true,
    text: 'Für sonnige Tage im Garten.',
  },
  muetze: {
    id: 'muetze', name: 'Wollmütze', icon: '🧢', kategorie: 'kleidung', slot: 'hut',
    preis: 120, verkauf: 45, seltenheit: 'gewoehnlich', shop: true, dauerhaft: true,
    text: 'Hält warm und sitzt immer ein bisschen schief.',
  },
  zylinder: {
    id: 'zylinder', name: 'Zylinder', icon: '🎩', kategorie: 'kleidung', slot: 'hut',
    preis: 260, verkauf: 95, seltenheit: 'selten', shop: true, dauerhaft: true,
    text: 'Für Haustiere mit Sinn für große Auftritte.',
  },
  krone: {
    id: 'krone', name: 'Krone', icon: '👑', kategorie: 'kleidung', slot: 'hut',
    preis: 0, diamanten: 12, verkauf: 500, seltenheit: 'legendaer', shop: true, dauerhaft: true,
    text: 'Echtes Gold. Wird ausschließlich von Lieblingen getragen.',
  },
  sonnenbrille: {
    id: 'sonnenbrille', name: 'Sonnenbrille', icon: '🕶️', kategorie: 'kleidung', slot: 'brille',
    preis: 140, verkauf: 52, seltenheit: 'ungewoehnlich', shop: true, dauerhaft: true,
    text: 'Cool. Einfach cool.',
  },
  monokel: {
    id: 'monokel', name: 'Monokel', icon: '🧐', kategorie: 'kleidung', slot: 'brille',
    preis: 220, verkauf: 80, seltenheit: 'selten', shop: true, dauerhaft: true,
    text: 'Verleiht selbst einem Blubberling Autorität.',
  },
  taucherbrille: {
    id: 'taucherbrille', name: 'Taucherbrille', icon: '🥽', kategorie: 'kleidung', slot: 'brille',
    preis: 160, verkauf: 60, seltenheit: 'ungewoehnlich', shop: true, dauerhaft: true,
    text: 'Praktisch im Aquarium, albern im Wohnzimmer.',
  },
  wollschal: {
    id: 'wollschal', name: 'Wollschal', icon: '🧣', kategorie: 'kleidung', slot: 'schal',
    preis: 110, verkauf: 40, seltenheit: 'gewoehnlich', shop: true, dauerhaft: true,
    text: 'Handgestrickt, ein bisschen zu lang.',
  },
  seidenschal: {
    id: 'seidenschal', name: 'Seidenschal', icon: '🎀', kategorie: 'kleidung', slot: 'schal',
    preis: 240, verkauf: 88, seltenheit: 'selten', shop: true, dauerhaft: true,
    text: 'Flattert auch dann, wenn kein Wind geht.',
  },
  heldenumhang: {
    id: 'heldenumhang', name: 'Heldenumhang', icon: '🦸', kategorie: 'kleidung', slot: 'umhang',
    preis: 380, verkauf: 140, seltenheit: 'episch', shop: true, dauerhaft: true,
    text: 'Macht nicht stärker. Fühlt sich aber so an.',
  },
  sternenmantel: {
    id: 'sternenmantel', name: 'Sternenmantel', icon: '🌌', kategorie: 'kleidung', slot: 'umhang',
    preis: 0, diamanten: 15, verkauf: 620, seltenheit: 'legendaer', shop: true, dauerhaft: true,
    text: 'Innenfutter aus Nachthimmel. Passt jedem.',
  },
  lederpanzer: {
    id: 'lederpanzer', name: 'Lederpanzer', icon: '🥋', kategorie: 'kleidung', slot: 'ruestung',
    preis: 300, verkauf: 110, seltenheit: 'selten', shop: true, dauerhaft: true,
    text: 'Robust, bequem, riecht nach Abenteuer.',
  },
  ritterruestung: {
    id: 'ritterruestung', name: 'Ritterrüstung', icon: '🛡️', kategorie: 'kleidung', slot: 'ruestung',
    preis: 520, verkauf: 190, seltenheit: 'episch', shop: true, dauerhaft: true,
    text: 'Klappert beim Laufen. Beeindruckt trotzdem.',
  },

  // --- Spezialgegenstände --------------------------------------------------
  glueckskleeblatt: {
    id: 'glueckskleeblatt', name: 'Glückskleeblatt', icon: '🍀', kategorie: 'spezial',
    preis: 0, diamanten: 6, verkauf: 200, seltenheit: 'selten', shop: true,
    text: 'Erhöht bei der nächsten Ei-Ziehung deutlich die Chance auf Seltenes.',
    spezial: 'glueck',
  },
  brutbeschleuniger: {
    id: 'brutbeschleuniger', name: 'Wärmestein', icon: '🔆', kategorie: 'spezial',
    preis: 180, verkauf: 65, seltenheit: 'ungewoehnlich', shop: true,
    text: 'Verkürzt die Brutzeit eines Eis um zwei Stunden.',
    spezial: 'brut', wert: 2,
  },
  expeditionskarte: {
    id: 'expeditionskarte', name: 'Expeditionskarte', icon: '🗺️', kategorie: 'spezial',
    preis: 150, verkauf: 55, seltenheit: 'ungewoehnlich', shop: true,
    text: 'Schließt für einen Ausflug eine schwierigere Zone auf.',
    spezial: 'zone',
  },
  erfahrungsbonbon: {
    id: 'erfahrungsbonbon', name: 'Erfahrungsbonbon', icon: '🍬', kategorie: 'spezial',
    preis: 200, verkauf: 74, seltenheit: 'selten', shop: true,
    text: 'Schenkt einem Haustier sofort 250 Erfahrungspunkte.',
    spezial: 'xp', wert: 250,
  },
  namensschild: {
    id: 'namensschild', name: 'Namensschild', icon: '🏷️', kategorie: 'spezial',
    preis: 60, verkauf: 20, seltenheit: 'gewoehnlich', shop: true,
    text: 'Zum Umbenennen — Haustiere merken sich neue Namen sofort.',
    spezial: 'umbenennen',
  },
  zuneigungsband: {
    id: 'zuneigungsband', name: 'Zuneigungsband', icon: '💝', kategorie: 'spezial',
    preis: 0, diamanten: 5, verkauf: 180, seltenheit: 'episch', shop: true,
    text: 'Steigert die Zuneigung eines Haustiers sofort spürbar.',
    wirkung: W({ zuneigung: 30, vertrauen: 15, glueck: 20 }),
  },
  goldbeutel: {
    id: 'goldbeutel', name: 'Goldbeutel', icon: '💰', kategorie: 'spezial',
    preis: 0, verkauf: 0, seltenheit: 'selten', shop: false,
    text: 'Enthält eine Handvoll Münzen. Nur auf Expeditionen zu finden.',
    spezial: 'muenzen', wert: 250,
  },
  diamantsplitter: {
    id: 'diamantsplitter', name: 'Diamantsplitter', icon: '💎', kategorie: 'spezial',
    preis: 0, verkauf: 0, seltenheit: 'episch', shop: false,
    text: 'Ein echter Splitter. Direkt in die Schatulle.',
    spezial: 'diamanten', wert: 3,
  },
};

export const ITEM_LIST = Object.values(ITEMS);

/** Reihenfolge der Kategorien im Beutel und im Laden. */
export const ITEM_CATEGORIES = [
  { id: 'futter', name: 'Futter', icon: '🍖' },
  { id: 'frucht', name: 'Früchte', icon: '🍎' },
  { id: 'trank', name: 'Getränke', icon: '💧' },
  { id: 'spielzeug', name: 'Spielzeug', icon: '🧸' },
  { id: 'medizin', name: 'Medizin', icon: '🧪' },
  { id: 'pflege', name: 'Pflege', icon: '🧼' },
  { id: 'stein', name: 'Steine', icon: '💠' },
  { id: 'kleidung', name: 'Kleidung', icon: '👒' },
  { id: 'spezial', name: 'Besonderes', icon: '🎁' },
];

/** Ausrüstungsplätze für Kleidung. */
export const OUTFIT_SLOTS = [
  { id: 'hut', name: 'Hut', icon: '👒' },
  { id: 'brille', name: 'Brille', icon: '🕶️' },
  { id: 'schal', name: 'Schal', icon: '🧣' },
  { id: 'umhang', name: 'Umhang', icon: '🦸' },
  { id: 'ruestung', name: 'Rüstung', icon: '🛡️' },
];

export function item(id) {
  return ITEMS[id] || null;
}

export function itemsByCategory(categoryId) {
  return ITEM_LIST.filter((entry) => entry.kategorie === categoryId);
}

/** Alle im Laden erhältlichen Gegenstände. */
export function shopItems() {
  return ITEM_LIST.filter((entry) => entry.shop);
}

/** Gegenstände, die auf Expeditionen gefunden werden können. */
export function lootItems() {
  return ITEM_LIST.filter((entry) => entry.kategorie !== 'kleidung' || entry.seltenheit !== 'legendaer');
}

/** Kostet der Gegenstand Diamanten statt Münzen? */
export function costsDiamonds(entry) {
  return Boolean(entry.diamanten);
}
