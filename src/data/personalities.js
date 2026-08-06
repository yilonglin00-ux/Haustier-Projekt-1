/**
 * personalities.js — Sechs Persönlichkeiten.
 *
 * Die Persönlichkeit wird beim Erhalt eines Haustiers ausgewürfelt und bleibt.
 * Sie wirkt an vier Stellen:
 *   - `wachstum`  … wie schnell Attribute beim Aufsteigen wachsen
 *   - `abbau`     … wie schnell Bedürfnisse sinken
 *   - `aktion`    … wie stark einzelne Aktionen wirken
 *   - `ruhe`      … welche Leerlauf-Animation bevorzugt wird
 * Zusätzlich schubst sie verzweigte Entwicklungen in eine Richtung.
 */

export const PERSONALITIES = {
  verspielt: {
    id: 'verspielt',
    name: 'Verspielt',
    symbol: '🎈',
    beschreibung: 'Kann keine Minute stillsitzen und liebt jedes Spielzeug.',
    wachstum: { tempo: 1.2, staerke: 1.0, intelligenz: 0.9 },
    abbau: { energie: 1.2, hunger: 1.15 },
    aktion: { spielen: 1.4, schlafen: 0.8, training: 1.0 },
    ruhe: 'huepfen',
    neigung: 'tempo',
  },
  mutig: {
    id: 'mutig',
    name: 'Mutig',
    symbol: '🛡️',
    beschreibung: 'Geht jedem Abenteuer entgegen und weicht keiner Gefahr aus.',
    wachstum: { staerke: 1.25, tempo: 1.0, intelligenz: 0.85 },
    abbau: { energie: 1.1, stimmung: 0.85 },
    aktion: { training: 1.35, abenteuer: 1.25, streicheln: 0.9 },
    ruhe: 'stolz',
    neigung: 'staerke',
  },
  neugierig: {
    id: 'neugierig',
    name: 'Neugierig',
    symbol: '🔍',
    beschreibung: 'Muss alles beschnuppern — und findet dabei erstaunlich viel.',
    wachstum: { intelligenz: 1.15, tempo: 1.1, staerke: 0.9 },
    abbau: { sauberkeit: 1.25, energie: 1.05 },
    aktion: { spazieren: 1.35, abenteuer: 1.15, spielen: 1.1 },
    ruhe: 'schnuppern',
    neigung: 'entdecken',
  },
  ruhig: {
    id: 'ruhig',
    name: 'Ruhig',
    symbol: '🍵',
    beschreibung: 'Gelassen bis in die Schwanzspitze. Nichts bringt es aus der Fassung.',
    wachstum: { intelligenz: 1.1, staerke: 1.0, tempo: 0.9 },
    abbau: { energie: 0.75, stimmung: 0.8 },
    aktion: { streicheln: 1.3, schlafen: 1.25, baden: 1.2 },
    ruhe: 'sitzen',
    neigung: 'vertrauen',
  },
  faul: {
    id: 'faul',
    name: 'Faul',
    symbol: '😴',
    beschreibung: 'Warum laufen, wenn man auch liegen kann? Schläft neun Stunden am Stück.',
    wachstum: { staerke: 0.9, tempo: 0.8, intelligenz: 1.05 },
    abbau: { energie: 0.6, hunger: 1.2 },
    aktion: { schlafen: 1.5, fuettern: 1.2, training: 0.7 },
    ruhe: 'liegen',
    neigung: 'gemuetlich',
  },
  intelligent: {
    id: 'intelligent',
    name: 'Intelligent',
    symbol: '📘',
    beschreibung: 'Löst Rätsel schneller als sein Hüter und merkt sich jedes Versteck.',
    wachstum: { intelligenz: 1.35, tempo: 0.95, staerke: 0.9 },
    abbau: { stimmung: 1.1, energie: 0.95 },
    aktion: { training: 1.2, quiz: 1.5, spielen: 1.05 },
    ruhe: 'grübeln',
    neigung: 'intelligenz',
  },
};

export const PERSONALITY_ORDER = Object.keys(PERSONALITIES);

export function personality(id) {
  return PERSONALITIES[id] || PERSONALITIES.ruhig;
}

/** Faktor einer Persönlichkeit auf eine Aktion (1 = normal). */
export function actionFactor(personalityId, action) {
  return personality(personalityId).aktion?.[action] ?? 1;
}

/** Faktor auf den Abbau eines Bedürfnisses. */
export function decayFactor(personalityId, need) {
  return personality(personalityId).abbau?.[need] ?? 1;
}

/** Faktor auf das Attributwachstum beim Aufsteigen. */
export function growthFactor(personalityId, attribute) {
  return personality(personalityId).wachstum?.[attribute] ?? 1;
}
