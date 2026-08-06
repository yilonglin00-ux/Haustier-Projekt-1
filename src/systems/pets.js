/**
 * pets.js — Haustiere erschaffen, altern lassen, aufsteigen lassen.
 *
 * Ein Haustier speichert nur das, was sich nicht ausrechnen lässt:
 * Art, Persönlichkeit, Farbvariante, Level, Erfahrung, Bedürfnisse, Gefühle
 * und antrainierte Boni. Attribute (Stärke, Intelligenz, Tempo) und
 * Maximalwerte werden bei Bedarf aus diesen Angaben abgeleitet — das hält
 * den Spielstand klein und Änderungen an der Balance einfach.
 */

import { species, baseStageSpecies, speciesByRarity, starterSpecies } from '../data/species.js';
import { rarity, rarityWeights, variantWeights, RARITY_ORDER } from '../data/rarity.js';
import { PERSONALITY_ORDER, personality, growthFactor, decayFactor as personalityDecay } from '../data/personalities.js';
import { decayFactor as elementDecay } from '../data/elements.js';
import { homeBonuses } from '../data/rooms.js';
import { weightedKey, jitter, pick, randFloat, chance } from '../core/rng.js';
import { clamp, uid, dayKey, HOUR } from '../core/util.js';
import { getState, update } from '../core/state.js';
import { emit, EVENTS } from '../core/events.js';

/** Bedürfnisse, die mit der Zeit sinken. */
export const NEEDS = ['gesundheit', 'energie', 'hunger', 'durst', 'sauberkeit'];

/** Gefühle, die durch Pflege steigen und durch Vernachlässigung fallen. */
export const FEELINGS = ['stimmung', 'vertrauen', 'glueck', 'zuneigung'];

/** Ableitbare Attribute. */
export const ATTRIBUTES = ['staerke', 'intelligenz', 'tempo'];

/** Anzeigenamen und Symbole für die Oberfläche. */
export const STAT_META = {
  gesundheit: { name: 'Gesundheit', icon: '❤️', farbe: 'var(--stat-gesundheit)' },
  energie: { name: 'Energie', icon: '⚡', farbe: 'var(--stat-energie)' },
  hunger: { name: 'Hunger', icon: '🍖', farbe: 'var(--stat-hunger)', hinweis: 'Voll = satt' },
  durst: { name: 'Durst', icon: '💧', farbe: 'var(--stat-durst)', hinweis: 'Voll = nicht durstig' },
  sauberkeit: { name: 'Sauberkeit', icon: '🫧', farbe: 'var(--stat-sauberkeit)' },
  stimmung: { name: 'Stimmung', icon: '😊', farbe: 'var(--stat-stimmung)' },
  vertrauen: { name: 'Vertrauen', icon: '🤝', farbe: 'var(--brand)' },
  glueck: { name: 'Glück', icon: '✨', farbe: 'var(--accent)' },
  zuneigung: { name: 'Zuneigung', icon: '💗', farbe: 'var(--ra-mystisch)' },
  staerke: { name: 'Stärke', kurz: 'Stärke', icon: '💪' },
  intelligenz: { name: 'Intelligenz', kurz: 'Intell.', icon: '🧠' },
  tempo: { name: 'Geschwindigkeit', kurz: 'Tempo', icon: '🌀' },
};

/**
 * Grund-Abbau pro Sekunde. Die Werte sind so gewählt, dass ein Bedürfnis
 * ohne Pflege in etwa einem halben bis ganzen Tag von 100 auf 0 fällt —
 * lang genug, um niemanden unter Druck zu setzen, kurz genug, damit sich
 * tägliches Vorbeischauen lohnt.
 */
const DECAY_PER_SECOND = {
  hunger: 100 / (10 * 3600),
  durst: 100 / (8 * 3600),
  energie: 100 / (14 * 3600),
  sauberkeit: 100 / (18 * 3600),
};

/** Energie-Regeneration im Schlaf (pro Sekunde). */
const SLEEP_RECOVERY = 100 / (3 * 3600);

// ---------------------------------------------------------------------------
// Erschaffen
// ---------------------------------------------------------------------------

/**
 * Erzeugt ein neues Haustier einer bestimmten Art.
 * Persönlichkeit, Farbvariante und leichte Werteabweichungen werden gewürfelt —
 * zwei Flammkitze sind dadurch nie ganz identisch.
 *
 * @param {string} speciesId
 * @param {{level?:number, variante?:string, persoenlichkeit?:string, glueck?:number}} [options]
 */
export function createPet(speciesId, options = {}) {
  const art = species(speciesId);
  if (!art) throw new Error(`Unbekannte Art: ${speciesId}`);

  const luck = options.glueck || 1;
  const variante = options.variante || weightedKey(variantWeights(luck));
  const charakter = options.persoenlichkeit || pick(PERSONALITY_ORDER);
  const level = options.level || 1;

  return {
    id: uid('pet'),
    artId: art.id,
    name: art.name,
    umbenannt: false,
    level,
    xp: 0,
    variante,
    persoenlichkeit: charakter,

    /** Individuelle Veranlagung: ±12 % auf jedes Grundattribut. */
    anlagen: {
      gesundheit: randFloat(0.88, 1.12),
      energie: randFloat(0.88, 1.12),
      staerke: randFloat(0.88, 1.12),
      intelligenz: randFloat(0.88, 1.12),
      tempo: randFloat(0.88, 1.12),
    },

    beduerfnisse: {
      gesundheit: 100,
      energie: 90,
      hunger: 80,
      durst: 80,
      sauberkeit: 95,
    },

    gefuehle: {
      stimmung: 75,
      vertrauen: 20,
      glueck: 60,
      zuneigung: 10,
    },

    /** Durch Training und Gegenstände dauerhaft dazugewonnene Punkte. */
    trainiert: { staerke: 0, intelligenz: 0, tempo: 0 },

    outfit: {},
    aktionen: {},
    gesamtAktionen: 0,
    abklingzeiten: {},

    geboren: Date.now(),
    pflegeTage: 0,
    letzterPflegeTag: null,
    krank: false,
    schlaeft: false,
    schlafBis: 0,
  };
}

/**
 * Würfelt eine zufällige Art aus einem Vorrat.
 * @param {{quelle?:string, gewichte?:object, glueck?:number, nurBasis?:boolean}} [options]
 * @returns {string} Art-ID
 */
export function rollSpecies(options = {}) {
  const { quelle = 'ei', gewichte = null, glueck = 1, nurBasis = true } = options;
  const weights = gewichte || rarityWeights(glueck);

  // Erst die Seltenheit ziehen, dann eine passende Art — so bleibt die
  // Verteilung stabil, egal wie viele Arten pro Stufe es gibt.
  const kandidatenProStufe = {};
  for (const rarityId of RARITY_ORDER) {
    const pool = (nurBasis ? baseStageSpecies(quelle) : speciesByRarity(rarityId, quelle)).filter(
      (entry) => entry.rarity === rarityId && !entry.geheim
    );
    if (pool.length) kandidatenProStufe[rarityId] = pool;
  }

  const verfuegbar = {};
  for (const [rarityId, pool] of Object.entries(kandidatenProStufe)) {
    if (weights[rarityId]) verfuegbar[rarityId] = weights[rarityId];
  }

  if (!Object.keys(verfuegbar).length) {
    // Notfall: irgendeine Basisart, damit nie „nichts" herauskommt.
    const fallback = baseStageSpecies(quelle);
    return (fallback[0] || starterSpecies()[0]).id;
  }

  const gezogen = weightedKey(verfuegbar);
  return pick(kandidatenProStufe[gezogen]).id;
}

/**
 * Nimmt ein Haustier in den Bestand auf: Team auffüllen, Buch aktualisieren,
 * Ereignis senden.
 * @returns {object} das aufgenommene Haustier
 */
export function adoptPet(pet, quelle = 'unbekannt') {
  update((s) => {
    s.haustiere.push(pet);
    if (s.team.length < 6) s.team.push(pet.id);
    if (!s.aktivesHaustier) s.aktivesHaustier = pet.id;

    const eintrag = s.buch[pet.artId] || { gesehen: 0, gefangen: false, anzahl: 0, ersteBegegnung: null };
    eintrag.gesehen += 1;
    eintrag.anzahl += 1;
    eintrag.gefangen = true;
    eintrag.ersteBegegnung = eintrag.ersteBegegnung || Date.now();
    s.buch[pet.artId] = eintrag;
  });

  emit(EVENTS.PET_OBTAINED, { pet, quelle });
  return pet;
}

/** Vermerkt eine Art als „gesehen", ohne sie zu besitzen (z. B. Vorschau). */
export function markSeen(speciesId) {
  update((s) => {
    const eintrag = s.buch[speciesId] || { gesehen: 0, gefangen: false, anzahl: 0, ersteBegegnung: null };
    eintrag.gesehen += 1;
    s.buch[speciesId] = eintrag;
  });
}

// ---------------------------------------------------------------------------
// Abgeleitete Werte
// ---------------------------------------------------------------------------

/** Erfahrung, die für den nächsten Levelaufstieg fehlt. */
export function xpForLevel(level) {
  return Math.round(42 * Math.pow(level, 1.52));
}

/** Maximale Gesundheit — wächst mit Level, Art und Seltenheit. */
export function maxHealth(pet) {
  const art = species(pet.artId);
  const faktor = rarity(art.rarity).werteFaktor;
  return Math.round(art.basis.gesundheit * faktor * pet.anlagen.gesundheit * (1 + (pet.level - 1) * 0.09));
}

/**
 * Aktueller Attributwert.
 * Grundwert der Art × Seltenheit × Veranlagung × Levelwachstum × Persönlichkeit,
 * plus antrainierte Punkte.
 */
export function attribute(pet, key) {
  const art = species(pet.artId);
  const basis = art.basis[key] ?? 10;
  const faktor = rarity(art.rarity).werteFaktor;
  const wachstum = 1 + (pet.level - 1) * 0.085 * growthFactor(pet.persoenlichkeit, key);
  return Math.round(basis * faktor * pet.anlagen[key] * wachstum) + (pet.trainiert[key] || 0);
}

/** Alle Attribute auf einmal. */
export function attributes(pet) {
  return {
    staerke: attribute(pet, 'staerke'),
    intelligenz: attribute(pet, 'intelligenz'),
    tempo: attribute(pet, 'tempo'),
  };
}

/** Kampfkraft-ähnliche Kennzahl für Sortierung und Expeditionserfolg. */
export function power(pet) {
  const a = attributes(pet);
  return Math.round(a.staerke + a.intelligenz + a.tempo + pet.level * 3);
}

/**
 * Zustand für Animation und Anzeige.
 * @returns {'schlafend'|'krank'|'traurig'|'begeistert'|'normal'}
 */
export function petMood(pet) {
  if (pet.schlaeft) return 'schlafend';
  if (pet.krank || pet.beduerfnisse.gesundheit < 30) return 'krank';
  if (pet.gefuehle.stimmung < 35) return 'traurig';
  if (pet.gefuehle.stimmung > 82 && pet.beduerfnisse.energie > 45) return 'begeistert';
  return 'normal';
}

/** Kurzer Satz zum aktuellen Befinden — die „Stimme" des Haustiers. */
export function petStatusText(pet) {
  const n = pet.beduerfnisse;
  if (pet.schlaeft) return 'schläft tief und fest …';
  if (pet.krank) return 'fühlt sich krank und braucht Medizin.';
  if (n.gesundheit < 30) return 'geht es nicht gut.';
  if (n.hunger < 25) return 'hat großen Hunger!';
  if (n.durst < 25) return 'hat Durst.';
  if (n.energie < 20) return 'ist völlig erschöpft.';
  if (n.sauberkeit < 25) return 'ist ziemlich schmutzig.';
  if (pet.gefuehle.stimmung < 35) return 'ist traurig und wünscht sich Aufmerksamkeit.';
  if (pet.gefuehle.stimmung > 85) return 'strahlt vor Freude!';
  // Der Satz wird hinter den Namen gehängt („Flammkitz kann keine Minute …“),
  // deshalb hier klein anfangen.
  const beschreibung = personality(pet.persoenlichkeit).beschreibung;
  return beschreibung.charAt(0).toLowerCase() + beschreibung.slice(1);
}

/** Die Art hinter einem Haustier. */
export function petSpecies(pet) {
  return species(pet.artId);
}

/** Anzeigename inklusive Variantenhinweis. */
export function petLabel(pet) {
  const art = species(pet.artId);
  return pet.umbenannt ? pet.name : art.name;
}

// ---------------------------------------------------------------------------
// Zeitverlauf
// ---------------------------------------------------------------------------

/**
 * Lässt Bedürfnisse sinken und Gefühle nachziehen.
 * Wird vom Spiel-Loop aufgerufen — auch beim Nachrechnen der Abwesenheit,
 * dann mit größeren Zeitschritten.
 *
 * @param {number} seconds vergangene Spielsekunden
 */
export function tickPets(seconds) {
  const state = getState();
  if (!state.haustiere.length) return;

  const boni = homeBonuses(state.zuhause);
  const now = Date.now();
  const heute = dayKey();

  update(
    (s) => {
      for (const pet of s.haustiere) {
        const art = species(pet.artId);
        if (!art) continue;

        // Schlaf beenden, wenn die Zeit um ist.
        if (pet.schlaeft && now >= pet.schlafBis) {
          pet.schlaeft = false;
          pet.gefuehle.stimmung = clamp(pet.gefuehle.stimmung + 10, 0, 100);
        }

        applyDecay(pet, art, seconds, boni);
        applyMood(pet, seconds, boni);
        applyHealth(pet, seconds);
        trackCareDay(pet, heute);
      }
    },
    { silent: seconds > 5 } // Beim Nachrechnen nicht bei jedem Block neu zeichnen
  );
}

/** Bedürfnisse sinken (bzw. Energie steigt im Schlaf). */
function applyDecay(pet, art, seconds, boni) {
  const n = pet.beduerfnisse;

  for (const key of ['hunger', 'durst', 'sauberkeit']) {
    const rate =
      DECAY_PER_SECOND[key] *
      elementDecay(art.element, key) *
      personalityDecay(pet.persoenlichkeit, key) *
      (key === 'sauberkeit' ? 1 - (boni.sauberkeitRegen || 0) : 1);
    n[key] = clamp(n[key] - rate * seconds, 0, 100);
  }

  if (pet.schlaeft) {
    const erholung = SLEEP_RECOVERY * (1 + (boni.schlafErholung || 0));
    n.energie = clamp(n.energie + erholung * seconds, 0, 100);
  } else {
    const rate =
      DECAY_PER_SECOND.energie *
      elementDecay(art.element, 'energie') *
      personalityDecay(pet.persoenlichkeit, 'energie');
    n.energie = clamp(n.energie - rate * seconds, 0, 100);
  }
}

/**
 * Die Stimmung folgt den Bedürfnissen — aber träge. Dadurch wirkt sie wie ein
 * Gemütszustand und nicht wie eine zweite Anzeige derselben Zahlen.
 */
function applyMood(pet, seconds, boni) {
  const n = pet.beduerfnisse;
  const ziel =
    n.hunger * 0.24 +
    n.durst * 0.18 +
    n.energie * 0.16 +
    n.sauberkeit * 0.12 +
    n.gesundheit * 0.14 +
    pet.gefuehle.zuneigung * 0.1 +
    pet.gefuehle.vertrauen * 0.06;

  const geschwindigkeit = 0.00035 * seconds * (ziel > pet.gefuehle.stimmung ? 1 + (boni.stimmungRegen || 0) : 1);
  pet.gefuehle.stimmung = clamp(
    pet.gefuehle.stimmung + (ziel - pet.gefuehle.stimmung) * Math.min(1, geschwindigkeit * 60),
    0,
    100
  );

  // Glück sinkt langsam, wenn die Stimmung dauerhaft niedrig ist.
  if (pet.gefuehle.stimmung < 40) {
    pet.gefuehle.glueck = clamp(pet.gefuehle.glueck - 0.0006 * seconds, 0, 100);
  } else if (pet.gefuehle.stimmung > 75) {
    pet.gefuehle.glueck = clamp(pet.gefuehle.glueck + (0.0004 + (boni.glueckRegen || 0) * 0.0004) * seconds, 0, 100);
  }
}

/** Gesundheit leidet nur, wenn Grundbedürfnisse längere Zeit im Keller sind. */
function applyHealth(pet, seconds) {
  const n = pet.beduerfnisse;
  const notstand = (n.hunger < 12 ? 1 : 0) + (n.durst < 12 ? 1 : 0) + (n.sauberkeit < 10 ? 1 : 0);

  if (notstand > 0) {
    n.gesundheit = clamp(n.gesundheit - 0.0025 * notstand * seconds, 5, 100);
    if (n.gesundheit < 40 && !pet.krank && chance(Math.min(0.4, seconds / 3600))) {
      pet.krank = true;
      emit(EVENTS.PET_MOOD_CRITICAL, { pet });
    }
  } else if (!pet.krank) {
    n.gesundheit = clamp(n.gesundheit + 0.0012 * seconds, 0, 100);
  }
}

/** Zählt zusammenhängende Pflegetage — Bedingung mancher Entwicklungen. */
function trackCareDay(pet, heute) {
  if (pet.letzterPflegeTag === heute) return;
  if (pet.beduerfnisse.hunger > 45 && pet.gefuehle.stimmung > 45) {
    pet.pflegeTage += 1;
    pet.letzterPflegeTag = heute;
  }
}

// ---------------------------------------------------------------------------
// Erfahrung und Aufstieg
// ---------------------------------------------------------------------------

/**
 * Gibt einem Haustier Erfahrung und steigt so oft auf wie nötig.
 * @returns {{levelUps:number, neuesLevel:number}}
 */
export function grantXp(petId, amount) {
  let levelUps = 0;
  let neuesLevel = 0;

  update((s) => {
    const pet = s.haustiere.find((entry) => entry.id === petId);
    if (!pet) return;

    pet.xp += Math.max(0, Math.round(amount));
    let bedarf = xpForLevel(pet.level);

    while (pet.xp >= bedarf && pet.level < 100) {
      pet.xp -= bedarf;
      pet.level += 1;
      levelUps += 1;
      // Aufsteigen tut gut: Bedürfnisse werden ein Stück aufgefüllt.
      pet.beduerfnisse.energie = clamp(pet.beduerfnisse.energie + 15, 0, 100);
      pet.gefuehle.stimmung = clamp(pet.gefuehle.stimmung + 8, 0, 100);
      bedarf = xpForLevel(pet.level);
    }
    neuesLevel = pet.level;
  });

  if (levelUps > 0) {
    emit(EVENTS.PET_LEVEL_UP, { petId, levelUps, level: neuesLevel });
  }
  return { levelUps, neuesLevel };
}

/** Fortschritt zum nächsten Level als Anteil 0…1. */
export function xpProgress(pet) {
  const bedarf = xpForLevel(pet.level);
  return bedarf > 0 ? clamp(pet.xp / bedarf, 0, 1) : 0;
}

// ---------------------------------------------------------------------------
// Bearbeiten
// ---------------------------------------------------------------------------

/** Benennt ein Haustier um. */
export function renamePet(petId, name) {
  update((s) => {
    const pet = s.haustiere.find((entry) => entry.id === petId);
    if (!pet) return;
    pet.name = name.slice(0, 16);
    pet.umbenannt = true;
  });
}

/** Legt fest, welches Haustier auf dem Zuhause-Bildschirm zu sehen ist. */
export function setActivePet(petId) {
  update((s) => {
    s.aktivesHaustier = petId;
  });
}

/** Markiert ein Lieblingshaustier (oder hebt die Markierung auf). */
export function toggleFavorite(petId) {
  update((s) => {
    s.lieblingsHaustier = s.lieblingsHaustier === petId ? null : petId;
  });
}

/** Nimmt ein Haustier ins Team auf oder schickt es ins Gehege. */
export function toggleTeam(petId) {
  let ergebnis = 'unveraendert';
  update((s) => {
    const index = s.team.indexOf(petId);
    if (index >= 0) {
      if (s.team.length <= 1) {
        ergebnis = 'letztes';
        return;
      }
      s.team.splice(index, 1);
      ergebnis = 'entfernt';
      if (s.aktivesHaustier === petId) s.aktivesHaustier = s.team[0];
    } else if (s.team.length < 6) {
      s.team.push(petId);
      ergebnis = 'aufgenommen';
    } else {
      ergebnis = 'voll';
    }
  });
  return ergebnis;
}

/**
 * Lässt ein Haustier frei und erhält dafür Münzen.
 * Der Bucheintrag bleibt erhalten — Entdeckungen gehen nie verloren.
 */
export function releasePet(petId) {
  let muenzen = 0;
  update((s) => {
    const index = s.haustiere.findIndex((entry) => entry.id === petId);
    if (index < 0) return;
    const pet = s.haustiere[index];
    const art = species(pet.artId);
    muenzen = Math.round(rarity(art.rarity).wert * (1 + pet.level * 0.05));

    s.haustiere.splice(index, 1);
    s.team = s.team.filter((id) => id !== petId);
    if (s.aktivesHaustier === petId) s.aktivesHaustier = s.team[0] || s.haustiere[0]?.id || null;
    if (s.lieblingsHaustier === petId) s.lieblingsHaustier = null;

    s.spieler.muenzen += muenzen;
    s.statistik.muenzenGesamt += muenzen;
  });
  emit(EVENTS.PET_RELEASED, { petId, muenzen });
  return muenzen;
}

/** Schickt ein Haustier für eine bestimmte Zeit schlafen. */
export function sleepPet(petId, stunden = 3) {
  update((s) => {
    const pet = s.haustiere.find((entry) => entry.id === petId);
    if (!pet) return;
    pet.schlaeft = true;
    pet.schlafBis = Date.now() + stunden * HOUR;
  });
}

/** Weckt ein Haustier auf. */
export function wakePet(petId) {
  update((s) => {
    const pet = s.haustiere.find((entry) => entry.id === petId);
    if (!pet) return;
    pet.schlaeft = false;
    pet.schlafBis = 0;
  });
}

/** Sortiervarianten für Team- und Gehege-Ansicht. */
export const SORTINGS = {
  level: { name: 'Level', vergleich: (a, b) => b.level - a.level },
  name: { name: 'Name', vergleich: (a, b) => petLabel(a).localeCompare(petLabel(b), 'de') },
  seltenheit: {
    name: 'Seltenheit',
    vergleich: (a, b) =>
      RARITY_ORDER.indexOf(species(b.artId).rarity) - RARITY_ORDER.indexOf(species(a.artId).rarity),
  },
  staerke: { name: 'Stärke', vergleich: (a, b) => power(b) - power(a) },
  neueste: { name: 'Neueste', vergleich: (a, b) => b.geboren - a.geboren },
  stimmung: { name: 'Stimmung', vergleich: (a, b) => b.gefuehle.stimmung - a.gefuehle.stimmung },
};

export function sortPets(pets, sortId = 'level') {
  const sorting = SORTINGS[sortId] || SORTINGS.level;
  return [...pets].sort(sorting.vergleich);
}
