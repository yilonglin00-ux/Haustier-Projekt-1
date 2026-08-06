/**
 * achievements.js — Erfolge.
 *
 * Jeder Erfolg prüft sich selbst am Spielstand (`pruef`). Das hält die Logik
 * bei den Daten und erlaubt beliebig ausgefallene Bedingungen, ohne dafür
 * ein eigenes Regelwerk zu bauen.
 *
 * `fortschritt` liefert optional [aktuell, ziel] für eine Balkenanzeige.
 */

import { RARITY_ORDER } from './rarity.js';
import { speciesCount, species, starterSpecies } from './species.js';

/** Zählt entdeckte Arten (im Buch als „gefangen" vermerkt). */
function caughtCount(state) {
  return Object.values(state.buch).filter((entry) => entry.gefangen).length;
}

/** Höchstes Level aller Haustiere. */
function maxLevel(state) {
  return state.haustiere.reduce((max, pet) => Math.max(max, pet.level), 0);
}

/** Anzahl gefangener Arten einer Seltenheit. */
function caughtOfRarity(state, rarityId) {
  return Object.entries(state.buch).filter(
    ([id, entry]) => entry.gefangen && species(id)?.rarity === rarityId
  ).length;
}

export const ACHIEVEMENTS = [
  // --- Einstieg ------------------------------------------------------------
  {
    id: 'erstes_haustier', name: 'Der erste Freund', icon: '🐣', kategorie: 'Einstieg',
    text: 'Nimm dein erstes Haustier auf.',
    belohnung: { muenzen: 100, diamanten: 1 },
    pruef: (s) => s.haustiere.length >= 1,
  },
  {
    id: 'erste_fuetterung', name: 'Guten Appetit', icon: '🍽️', kategorie: 'Einstieg',
    text: 'Füttere ein Haustier zum ersten Mal.',
    belohnung: { muenzen: 60 },
    pruef: (s) => (s.statistik.aktionen.fuettern || 0) >= 1,
  },
  {
    id: 'erste_entwicklung', name: 'Etwas verändert sich', icon: '✨', kategorie: 'Einstieg',
    text: 'Entwickle ein Haustier zum ersten Mal.',
    belohnung: { muenzen: 250, diamanten: 2 },
    pruef: (s) => s.statistik.entwicklungen >= 1,
  },
  {
    id: 'erstes_ei', name: 'Etwas pickt', icon: '🥚', kategorie: 'Einstieg',
    text: 'Lass dein erstes Ei schlüpfen.',
    belohnung: { muenzen: 150, diamanten: 1 },
    pruef: (s) => s.statistik.eierGeschluepft >= 1,
  },
  {
    id: 'erste_expedition', name: 'Aufbruch', icon: '🧭', kategorie: 'Einstieg',
    text: 'Schließe deine erste Expedition ab.',
    belohnung: { muenzen: 200 },
    pruef: (s) => s.statistik.expeditionen >= 1,
  },

  // --- Pflege --------------------------------------------------------------
  {
    id: 'pfleger_50', name: 'Aufmerksam', icon: '🤲', kategorie: 'Pflege',
    text: 'Führe 50 Aktionen aus.',
    belohnung: { muenzen: 300 },
    pruef: (s) => s.statistik.aktionenGesamt >= 50,
    fortschritt: (s) => [s.statistik.aktionenGesamt, 50],
  },
  {
    id: 'pfleger_500', name: 'Hingebungsvoll', icon: '💗', kategorie: 'Pflege',
    text: 'Führe 500 Aktionen aus.',
    belohnung: { muenzen: 1200, diamanten: 5 },
    pruef: (s) => s.statistik.aktionenGesamt >= 500,
    fortschritt: (s) => [s.statistik.aktionenGesamt, 500],
  },
  {
    id: 'pfleger_1000', name: 'Hüter mit Herz', icon: '❤️‍🔥', kategorie: 'Pflege',
    text: 'Führe 1000 Aktionen aus. Chronovex wird aufmerksam …',
    belohnung: { muenzen: 3000, diamanten: 15 },
    pruef: (s) => s.statistik.aktionenGesamt >= 1000,
    fortschritt: (s) => [s.statistik.aktionenGesamt, 1000],
  },
  {
    id: 'sauber', name: 'Blitzeblank', icon: '🛁', kategorie: 'Pflege',
    text: 'Bade 25× ein Haustier.',
    belohnung: { muenzen: 400, item: 'buerste' },
    pruef: (s) => (s.statistik.aktionen.baden || 0) >= 25,
    fortschritt: (s) => [s.statistik.aktionen.baden || 0, 25],
  },
  {
    id: 'kuschelmeister', name: 'Kuschelmeister', icon: '🫂', kategorie: 'Pflege',
    text: 'Streichle 100× ein Haustier.',
    belohnung: { muenzen: 500, diamanten: 3 },
    pruef: (s) => (s.statistik.aktionen.streicheln || 0) >= 100,
    fortschritt: (s) => [s.statistik.aktionen.streicheln || 0, 100],
  },
  {
    id: 'vollste_zuneigung', name: 'Unzertrennlich', icon: '💞', kategorie: 'Pflege',
    text: 'Bringe die Zuneigung eines Haustiers auf 100.',
    belohnung: { muenzen: 800, diamanten: 4 },
    pruef: (s) => s.haustiere.some((pet) => pet.gefuehle.zuneigung >= 100),
  },
  {
    id: 'perfekte_pflege', name: 'Rundum zufrieden', icon: '🌟', kategorie: 'Pflege',
    text: 'Halte ein Haustier gleichzeitig in allen Bedürfnissen über 90.',
    belohnung: { muenzen: 700, diamanten: 3 },
    pruef: (s) =>
      s.haustiere.some((pet) =>
        ['gesundheit', 'energie', 'hunger', 'durst', 'sauberkeit'].every(
          (key) => pet.beduerfnisse[key] >= 90
        )
      ),
  },

  // --- Fortschritt ---------------------------------------------------------
  {
    id: 'level_10', name: 'Aufsteiger', icon: '🔟', kategorie: 'Fortschritt',
    text: 'Bringe ein Haustier auf Level 10.',
    belohnung: { muenzen: 250 },
    pruef: (s) => maxLevel(s) >= 10,
    fortschritt: (s) => [maxLevel(s), 10],
  },
  {
    id: 'level_25', name: 'Erfahren', icon: '📈', kategorie: 'Fortschritt',
    text: 'Bringe ein Haustier auf Level 25.',
    belohnung: { muenzen: 700, diamanten: 2 },
    pruef: (s) => maxLevel(s) >= 25,
    fortschritt: (s) => [maxLevel(s), 25],
  },
  {
    id: 'level_50', name: 'Meisterhüter', icon: '🏅', kategorie: 'Fortschritt',
    text: 'Bringe ein Haustier auf Level 50.',
    belohnung: { muenzen: 2500, diamanten: 10, item: 'megastein' },
    pruef: (s) => maxLevel(s) >= 50,
    fortschritt: (s) => [maxLevel(s), 50],
  },
  {
    id: 'level_75', name: 'Legendenhüter', icon: '👑', kategorie: 'Fortschritt',
    text: 'Bringe ein Haustier auf Level 75.',
    belohnung: { muenzen: 6000, diamanten: 25 },
    pruef: (s) => maxLevel(s) >= 75,
    fortschritt: (s) => [maxLevel(s), 75],
  },
  {
    id: 'entwicklungen_10', name: 'Wandlungskünstler', icon: '🦋', kategorie: 'Fortschritt',
    text: 'Löse 10 Entwicklungen aus.',
    belohnung: { muenzen: 900, diamanten: 4 },
    pruef: (s) => s.statistik.entwicklungen >= 10,
    fortschritt: (s) => [s.statistik.entwicklungen, 10],
  },
  {
    id: 'megaform', name: 'Über sich hinaus', icon: '💠', kategorie: 'Fortschritt',
    text: 'Erreiche zum ersten Mal eine Megaform.',
    belohnung: { muenzen: 3000, diamanten: 12 },
    pruef: (s) => s.haustiere.some((pet) => species(pet.artId)?.stufe === 4),
  },
  {
    id: 'team_voll', name: 'Volles Team', icon: '👥', kategorie: 'Fortschritt',
    text: 'Führe sechs Haustiere gleichzeitig im Team.',
    belohnung: { muenzen: 600, diamanten: 3 },
    pruef: (s) => s.team.length >= 6,
    fortschritt: (s) => [s.team.length, 6],
  },

  // --- Sammlung ------------------------------------------------------------
  {
    id: 'sammler_10', name: 'Sammler', icon: '📔', kategorie: 'Sammlung',
    text: 'Entdecke 10 verschiedene Arten.',
    belohnung: { muenzen: 300 },
    pruef: (s) => caughtCount(s) >= 10,
    fortschritt: (s) => [caughtCount(s), 10],
  },
  {
    id: 'sammler_25', name: 'Kenner', icon: '📚', kategorie: 'Sammlung',
    text: 'Entdecke 25 verschiedene Arten.',
    belohnung: { muenzen: 800, diamanten: 3 },
    pruef: (s) => caughtCount(s) >= 25,
    fortschritt: (s) => [caughtCount(s), 25],
  },
  {
    id: 'sammler_50', name: 'Forscher', icon: '🔬', kategorie: 'Sammlung',
    text: 'Entdecke 50 verschiedene Arten.',
    belohnung: { muenzen: 2000, diamanten: 8, ei: 'episch' },
    pruef: (s) => caughtCount(s) >= 50,
    fortschritt: (s) => [caughtCount(s), 50],
  },
  {
    id: 'sammler_80', name: 'Chronist', icon: '🗂️', kategorie: 'Sammlung',
    text: 'Entdecke 80 verschiedene Arten. Vitalume erwacht …',
    belohnung: { muenzen: 5000, diamanten: 20 },
    pruef: (s) => caughtCount(s) >= 80,
    fortschritt: (s) => [caughtCount(s), 80],
  },
  {
    id: 'sammler_alle', name: 'Vollständig', icon: '🏆', kategorie: 'Sammlung',
    text: 'Entdecke jede einzelne Art im Fabelgarten.',
    belohnung: { muenzen: 25000, diamanten: 100 },
    pruef: (s) => caughtCount(s) >= speciesCount(),
    fortschritt: (s) => [caughtCount(s), speciesCount()],
  },
  {
    id: 'alle_starter', name: 'Alle drei', icon: '🔺', kategorie: 'Sammlung',
    text: 'Sammle alle drei Starter-Haustiere.',
    belohnung: { muenzen: 1200, diamanten: 5 },
    pruef: (s) => starterSpecies().every((entry) => s.buch[entry.id]?.gefangen),
    fortschritt: (s) => [
      starterSpecies().filter((entry) => s.buch[entry.id]?.gefangen).length,
      starterSpecies().length,
    ],
  },
  {
    id: 'erstes_legendaeres', name: 'Legende gesichtet', icon: '🟡', kategorie: 'Sammlung',
    text: 'Nimm dein erstes legendäres Haustier auf.',
    belohnung: { muenzen: 2000, diamanten: 10 },
    pruef: (s) => caughtOfRarity(s, 'legendaer') >= 1,
  },
  {
    id: 'erstes_mystisches', name: 'Jenseits der Legende', icon: '🔴', kategorie: 'Sammlung',
    text: 'Nimm dein erstes mystisches Haustier auf.',
    belohnung: { muenzen: 6000, diamanten: 30 },
    pruef: (s) => caughtOfRarity(s, 'mystisch') >= 1,
  },
  {
    id: 'schimmernd', name: 'Ein besonderer Schimmer', icon: '🌟', kategorie: 'Sammlung',
    text: 'Finde ein schimmerndes Haustier.',
    belohnung: { muenzen: 3000, diamanten: 15 },
    pruef: (s) => s.haustiere.some((pet) => pet.variante === 'schimmernd'),
  },
  {
    id: 'jedes_element', name: 'Alle Elemente', icon: '🌈', kategorie: 'Sammlung',
    text: 'Besitze mindestens ein Haustier jedes Elements.',
    belohnung: { muenzen: 3500, diamanten: 15 },
    pruef: (s) => {
      const elemente = new Set(s.haustiere.map((pet) => species(pet.artId)?.element));
      return elemente.size >= 12;
    },
    fortschritt: (s) => [new Set(s.haustiere.map((pet) => species(pet.artId)?.element)).size, 12],
  },
  {
    id: 'jede_seltenheit', name: 'Von Grau bis Rot', icon: '🎨', kategorie: 'Sammlung',
    text: 'Besitze ein Haustier jeder Seltenheitsstufe.',
    belohnung: { muenzen: 4000, diamanten: 18 },
    pruef: (s) => RARITY_ORDER.every((id) => caughtOfRarity(s, id) >= 1),
    fortschritt: (s) => [RARITY_ORDER.filter((id) => caughtOfRarity(s, id) >= 1).length, RARITY_ORDER.length],
  },

  // --- Eier & Expeditionen -------------------------------------------------
  {
    id: 'brueter_10', name: 'Brutmeister', icon: '🐣', kategorie: 'Eier',
    text: 'Lass 10 Eier schlüpfen.',
    belohnung: { muenzen: 600, diamanten: 3 },
    pruef: (s) => s.statistik.eierGeschluepft >= 10,
    fortschritt: (s) => [s.statistik.eierGeschluepft, 10],
  },
  {
    id: 'brueter_50', name: 'Eiersammlung', icon: '🪺', kategorie: 'Eier',
    text: 'Lass 50 Eier schlüpfen.',
    belohnung: { muenzen: 2500, diamanten: 12 },
    pruef: (s) => s.statistik.eierGeschluepft >= 50,
    fortschritt: (s) => [s.statistik.eierGeschluepft, 50],
  },
  {
    id: 'goldenes_ei', name: 'Goldrausch', icon: '🥇', kategorie: 'Eier',
    text: 'Finde ein goldenes Ei.',
    belohnung: { muenzen: 1500, diamanten: 8 },
    pruef: (s) => Boolean(s.flags.goldenesEiGefunden),
  },
  {
    id: 'expedition_25', name: 'Weitgereist', icon: '🗺️', kategorie: 'Expeditionen',
    text: 'Schließe 25 Expeditionen ab.',
    belohnung: { muenzen: 1200, diamanten: 5 },
    pruef: (s) => s.statistik.expeditionen >= 25,
    fortschritt: (s) => [s.statistik.expeditionen, 25],
  },
  {
    id: 'sternenruine', name: 'Bis ans Ende der Karte', icon: '🌠', kategorie: 'Expeditionen',
    text: 'Schicke ein Haustier in die Sternenruine.',
    belohnung: { muenzen: 3000, diamanten: 12 },
    pruef: (s) => Boolean(s.statistik.zonen?.sternenruine),
  },

  // --- Minispiele ----------------------------------------------------------
  {
    id: 'minispiel_erst', name: 'Spielfreude', icon: '🎮', kategorie: 'Minispiele',
    text: 'Gewinne dein erstes Minispiel.',
    belohnung: { muenzen: 150 },
    pruef: (s) => s.statistik.minispieleGewonnen >= 1,
  },
  {
    id: 'minispiel_25', name: 'Spielernatur', icon: '🕹️', kategorie: 'Minispiele',
    text: 'Gewinne 25 Minispiele.',
    belohnung: { muenzen: 1000, diamanten: 5 },
    pruef: (s) => s.statistik.minispieleGewonnen >= 25,
    fortschritt: (s) => [s.statistik.minispieleGewonnen, 25],
  },
  {
    id: 'alle_minispiele', name: 'Alleskönner', icon: '🎯', kategorie: 'Minispiele',
    text: 'Gewinne jedes der fünf Minispiele mindestens einmal.',
    belohnung: { muenzen: 1800, diamanten: 8 },
    pruef: (s) =>
      ['reaktion', 'memory', 'hindernis', 'sammeln', 'quiz'].every(
        (id) => (s.statistik.minispiele[id]?.siege || 0) >= 1
      ),
    fortschritt: (s) => [
      ['reaktion', 'memory', 'hindernis', 'sammeln', 'quiz'].filter(
        (id) => (s.statistik.minispiele[id]?.siege || 0) >= 1
      ).length,
      5,
    ],
  },

  // --- Zuhause & Wirtschaft ------------------------------------------------
  {
    id: 'erster_raum', name: 'Ausgebaut', icon: '🏠', kategorie: 'Zuhause',
    text: 'Schalte einen weiteren Raum frei.',
    belohnung: { muenzen: 300 },
    pruef: (s) => Object.values(s.zuhause.raeume).filter(Boolean).length >= 2,
  },
  {
    id: 'alle_raeume', name: 'Villa Fabelgarten', icon: '🏡', kategorie: 'Zuhause',
    text: 'Schalte alle sechs Räume frei.',
    belohnung: { muenzen: 5000, diamanten: 20 },
    pruef: (s) => Object.values(s.zuhause.raeume).filter(Boolean).length >= 6,
    fortschritt: (s) => [Object.values(s.zuhause.raeume).filter(Boolean).length, 6],
  },
  {
    id: 'einrichter', name: 'Eingerichtet', icon: '🛋️', kategorie: 'Zuhause',
    text: 'Kaufe 10 Möbelstücke.',
    belohnung: { muenzen: 1500, diamanten: 6 },
    pruef: (s) => Object.values(s.zuhause.moebel).filter(Boolean).length >= 10,
    fortschritt: (s) => [Object.values(s.zuhause.moebel).filter(Boolean).length, 10],
  },
  {
    id: 'reich', name: 'Wohlhabend', icon: '💰', kategorie: 'Wirtschaft',
    text: 'Besitze gleichzeitig 10 000 Münzen.',
    belohnung: { diamanten: 8 },
    pruef: (s) => s.spieler.muenzen >= 10000,
    fortschritt: (s) => [s.spieler.muenzen, 10000],
  },
  {
    id: 'modebewusst', name: 'Modebewusst', icon: '👒', kategorie: 'Wirtschaft',
    text: 'Ziehe einem Haustier fünf Kleidungsstücke gleichzeitig an.',
    belohnung: { muenzen: 900, diamanten: 4 },
    pruef: (s) => s.haustiere.some((pet) => Object.values(pet.outfit || {}).filter(Boolean).length >= 5),
  },

  // --- Treue ---------------------------------------------------------------
  {
    id: 'tage_7', name: 'Eine Woche', icon: '📅', kategorie: 'Treue',
    text: 'Spiele an 7 verschiedenen Tagen.',
    belohnung: { muenzen: 500, diamanten: 3 },
    pruef: (s) => s.statistik.tageGespielt >= 7,
    fortschritt: (s) => [s.statistik.tageGespielt, 7],
  },
  {
    id: 'tage_30', name: 'Ein Monat', icon: '🗓️', kategorie: 'Treue',
    text: 'Spiele an 30 verschiedenen Tagen.',
    belohnung: { muenzen: 2000, diamanten: 10 },
    pruef: (s) => s.statistik.tageGespielt >= 30,
    fortschritt: (s) => [s.statistik.tageGespielt, 30],
  },
  {
    id: 'tage_100', name: 'Hundert Tage', icon: '💯', kategorie: 'Treue',
    text: 'Spiele an 100 verschiedenen Tagen. Aeternum bemerkt dich.',
    belohnung: { muenzen: 10000, diamanten: 50 },
    pruef: (s) => s.statistik.tageGespielt >= 100,
    fortschritt: (s) => [s.statistik.tageGespielt, 100],
  },
  {
    id: 'serie_7', name: 'Am Ball geblieben', icon: '🔥', kategorie: 'Treue',
    text: 'Spiele 7 Tage in Folge.',
    belohnung: { muenzen: 900, diamanten: 5 },
    pruef: (s) => s.statistik.besteSerie >= 7,
    fortschritt: (s) => [s.statistik.besteSerie, 7],
  },
  {
    id: 'spielzeit_10h', name: 'Zehn Stunden', icon: '⏳', kategorie: 'Treue',
    text: 'Verbringe insgesamt 10 Stunden im Fabelgarten.',
    belohnung: { muenzen: 1500, diamanten: 6 },
    pruef: (s) => s.statistik.spielzeitMs >= 10 * 3600 * 1000,
    fortschritt: (s) => [Math.floor(s.statistik.spielzeitMs / 3600000), 10],
  },
  {
    id: 'fotograf', name: 'Fotoalbum', icon: '📸', kategorie: 'Treue',
    text: 'Mache 10 Fotos deiner Haustiere.',
    belohnung: { muenzen: 700, diamanten: 3 },
    pruef: (s) => s.statistik.fotos >= 10,
    fortschritt: (s) => [s.statistik.fotos, 10],
  },
];

export const ACHIEVEMENT_CATEGORIES = [
  'Einstieg',
  'Pflege',
  'Fortschritt',
  'Sammlung',
  'Eier',
  'Expeditionen',
  'Minispiele',
  'Zuhause',
  'Wirtschaft',
  'Treue',
];

export function achievement(id) {
  return ACHIEVEMENTS.find((entry) => entry.id === id) || null;
}

export function achievementCount() {
  return ACHIEVEMENTS.length;
}
