/**
 * quests.js — Tagesaufgaben.
 *
 * Jeden Tag werden vier Aufgaben aus diesem Vorrat gezogen — gesät mit dem
 * Datum, damit ein Neuladen dieselben Aufgaben zeigt. Erledigte Aufgaben
 * müssen aktiv abgeholt werden; das fühlt sich besser an als automatisches
 * Gutschreiben.
 */

/**
 * @typedef {object} QuestTemplate
 * @property {string} id
 * @property {string} text        `{ziel}` wird ersetzt
 * @property {string} icon
 * @property {string} zaehler     Name des Fortschrittszählers (siehe systems/quests.js)
 * @property {number[]} ziele     mögliche Zielwerte
 * @property {object} belohnung   { muenzen, diamanten, xp, item, ei }
 * @property {number} [gewicht]
 */

export const QUEST_TEMPLATES = [
  {
    id: 'fuettern',
    text: 'Füttere {ziel}× ein Haustier',
    icon: '🍖',
    zaehler: 'fuettern',
    ziele: [3, 5, 8],
    belohnung: { muenzen: 120, xp: 40 },
    gewicht: 10,
  },
  {
    id: 'traenken',
    text: 'Gib {ziel}× Wasser',
    icon: '💧',
    zaehler: 'traenken',
    ziele: [3, 5, 8],
    belohnung: { muenzen: 110, xp: 40 },
    gewicht: 10,
  },
  {
    id: 'streicheln',
    text: 'Streichle deine Haustiere {ziel}×',
    icon: '🤲',
    zaehler: 'streicheln',
    ziele: [5, 10, 15],
    belohnung: { muenzen: 100, diamanten: 1 },
    gewicht: 10,
  },
  {
    id: 'spielen',
    text: 'Spiele {ziel}× mit einem Haustier',
    icon: '🎾',
    zaehler: 'spielen',
    ziele: [3, 6, 10],
    belohnung: { muenzen: 150, xp: 60 },
    gewicht: 10,
  },
  {
    id: 'training',
    text: 'Trainiere {ziel}×',
    icon: '🏋️',
    zaehler: 'training',
    ziele: [3, 5, 8],
    belohnung: { muenzen: 180, xp: 90 },
    gewicht: 9,
  },
  {
    id: 'baden',
    text: 'Bade {ziel}× ein Haustier',
    icon: '🛁',
    zaehler: 'baden',
    ziele: [2, 4, 6],
    belohnung: { muenzen: 130, item: 'seife' },
    gewicht: 8,
  },
  {
    id: 'spazieren',
    text: 'Geh {ziel}× spazieren',
    icon: '🚶',
    zaehler: 'spazieren',
    ziele: [2, 4, 6],
    belohnung: { muenzen: 160, xp: 70 },
    gewicht: 8,
  },
  {
    id: 'minispiel',
    text: 'Beende {ziel} Minispiele',
    icon: '🎮',
    zaehler: 'minispiele',
    ziele: [1, 3, 5],
    belohnung: { muenzen: 200, diamanten: 1 },
    gewicht: 10,
  },
  {
    id: 'minispielSieg',
    text: 'Gewinne {ziel} Minispiel(e)',
    icon: '🏆',
    zaehler: 'minispielSiege',
    ziele: [1, 2, 4],
    belohnung: { diamanten: 2, xp: 80 },
    gewicht: 9,
  },
  {
    id: 'muenzen',
    text: 'Sammle {ziel} Münzen',
    icon: '🪙',
    zaehler: 'muenzen',
    ziele: [300, 700, 1500],
    belohnung: { diamanten: 2 },
    gewicht: 9,
  },
  {
    id: 'expedition',
    text: 'Schließe {ziel} Expedition(en) ab',
    icon: '🧭',
    zaehler: 'expeditionen',
    ziele: [1, 2, 4],
    belohnung: { muenzen: 260, ei: 'normal' },
    gewicht: 9,
  },
  {
    id: 'ei',
    text: 'Lass {ziel} Ei(er) schlüpfen',
    icon: '🥚',
    zaehler: 'eier',
    ziele: [1, 2],
    belohnung: { diamanten: 3, xp: 120 },
    gewicht: 7,
  },
  {
    id: 'spielzeit',
    text: 'Spiele {ziel} Minuten',
    icon: '⏱️',
    zaehler: 'minuten',
    ziele: [10, 20, 30],
    belohnung: { muenzen: 200, diamanten: 1 },
    gewicht: 10,
  },
  {
    id: 'aktionen',
    text: 'Führe {ziel} Aktionen aus',
    icon: '✨',
    zaehler: 'aktionen',
    ziele: [15, 25, 40],
    belohnung: { muenzen: 220, xp: 90 },
    gewicht: 9,
  },
  {
    id: 'gegenstaende',
    text: 'Benutze {ziel} Gegenstände',
    icon: '🎒',
    zaehler: 'gegenstaende',
    ziele: [3, 6, 10],
    belohnung: { muenzen: 170, item: 'heilkraut' },
    gewicht: 8,
  },
  {
    id: 'foto',
    text: 'Mach {ziel} Foto(s)',
    icon: '📸',
    zaehler: 'fotos',
    ziele: [1, 3],
    belohnung: { muenzen: 140, diamanten: 1 },
    gewicht: 6,
  },
];

export const QUESTS_PER_DAY = 4;

/** Zusatzbelohnung, wenn alle Tagesaufgaben erledigt sind. */
export const DAILY_BONUS = { diamanten: 5, ei: 'selten', muenzen: 400 };

export function questTemplate(id) {
  return QUEST_TEMPLATES.find((entry) => entry.id === id) || null;
}

/** Aufgabentext mit eingesetztem Ziel. */
export function questText(quest) {
  const template = questTemplate(quest.vorlage);
  return (template?.text || '').replace('{ziel}', String(quest.ziel));
}
