/**
 * quiz.js — Fragen für das Quiz-Minispiel.
 *
 * Zwei Quellen:
 *  1. Feste Fragen zur Spielwelt und zu den Spielregeln.
 *  2. Fragen, die aus den Artdaten erzeugt werden — dadurch wächst das Quiz
 *     mit der Sammlung mit und belohnt aufmerksames Lesen im Haustierbuch.
 */

import { SPECIES, species } from './species.js';
import { RARITIES } from './rarity.js';
import { ELEMENTS } from './elements.js';
import { PERSONALITIES } from './personalities.js';
import { pick, pickMany, shuffle } from '../core/rng.js';

/** Feste Fragen — gut zum Einstieg, wenn das Buch noch leer ist. */
export const STATIC_QUESTIONS = [
  {
    frage: 'Wie viele Haustiere passen höchstens in dein Team?',
    antworten: ['4', '6', '8', 'Unbegrenzt'],
    richtig: 1,
  },
  {
    frage: 'Welche Seltenheitsstufe ist die höchste?',
    antworten: ['Legendär', 'Episch', 'Mystisch', 'Selten'],
    richtig: 2,
  },
  {
    frage: 'Womit erreicht ein Haustier seine Megaform?',
    antworten: ['Mit einem Megastein', 'Mit viel Futter', 'Durch Baden', 'Gar nicht'],
    richtig: 0,
  },
  {
    frage: 'Was passiert mit deinem Fortschritt, wenn du den Tab schließt?',
    antworten: [
      'Er geht verloren',
      'Er wird automatisch gespeichert',
      'Er muss exportiert werden',
      'Er wird an einen Server gesendet',
    ],
    richtig: 1,
  },
  {
    frage: 'Welches Element mag Fischfilet besonders?',
    antworten: ['Feuer', 'Wasser', 'Gestein', 'Metall'],
    richtig: 1,
  },
  {
    frage: 'Was bringt der Raum „Labor" hauptsächlich?',
    antworten: [
      'Kürzere Brutzeit',
      'Mehr Münzen im Laden',
      'Bessere Stimmung',
      'Stärkeres Training',
    ],
    richtig: 0,
  },
  {
    frage: 'Wann werden die Tagesaufgaben erneuert?',
    antworten: ['Alle 6 Stunden', 'Um Mitternacht', 'Nach jedem Minispiel', 'Nie'],
    richtig: 1,
  },
  {
    frage: 'Wovon hängt eine Entwicklung außer vom Level noch ab?',
    antworten: [
      'Nur vom Zufall',
      'Von Zuneigung, Glück, Tageszeit und mehr',
      'Von der Anzahl deiner Münzen',
      'Vom Namen des Haustiers',
    ],
    richtig: 1,
  },
  {
    frage: 'Was bewirkt die Persönlichkeit „Faul"?',
    antworten: [
      'Energie sinkt langsamer',
      'Doppelte Erfahrung',
      'Bessere Beute',
      'Schnelleres Training',
    ],
    richtig: 0,
  },
  {
    frage: 'Wie lange wird deine Abwesenheit höchstens nachsimuliert?',
    antworten: ['1 Stunde', '12 Stunden', '3 Tage', 'Unbegrenzt'],
    richtig: 1,
  },
  {
    frage: 'Wo findest du alle bisher entdeckten Arten?',
    antworten: ['Im Beutel', 'Im Haustierbuch', 'Im Laden', 'Im Labor'],
    richtig: 1,
  },
  {
    frage: 'Was ist an der Farbvariante „Schimmernd" besonders?',
    antworten: [
      'Sie ist extrem selten',
      'Sie macht stärker',
      'Sie verhindert Entwicklungen',
      'Sie kostet Diamanten',
    ],
    richtig: 0,
  },
];

// ---------------------------------------------------------------------------
// Erzeugte Fragen
// ---------------------------------------------------------------------------

/** Baut eine Frage nach dem Element einer bekannten Art. */
function elementQuestion(pool, rand) {
  const target = pick(pool, rand);
  const correct = ELEMENTS[target.element].name;
  const others = pickMany(
    Object.values(ELEMENTS).filter((entry) => entry.id !== target.element),
    3,
    rand
  ).map((entry) => entry.name);
  return buildChoice(`Welches Element hat ${target.name}?`, correct, others, rand);
}

/** Baut eine Frage nach der Seltenheit einer bekannten Art. */
function rarityQuestion(pool, rand) {
  const target = pick(pool, rand);
  const correct = RARITIES[target.rarity].name;
  const others = pickMany(
    Object.values(RARITIES).filter((entry) => entry.id !== target.rarity),
    3,
    rand
  ).map((entry) => entry.name);
  return buildChoice(`Welche Seltenheit hat ${target.name}?`, correct, others, rand);
}

/** Baut eine Frage nach der nächsten Entwicklungsstufe. */
function evolutionQuestion(pool, rand) {
  const candidates = pool.filter((entry) => entry.entwicklung?.length);
  if (!candidates.length) return null;
  const target = pick(candidates, rand);
  const correctId = pick(target.entwicklung, rand).zu;
  const correct = species(correctId)?.name;
  if (!correct) return null;

  const others = pickMany(
    SPECIES.filter((entry) => entry.id !== correctId && entry.id !== target.id),
    3,
    rand
  ).map((entry) => entry.name);
  return buildChoice(`Wozu kann sich ${target.name} entwickeln?`, correct, others, rand);
}

/** Baut eine Frage zu einer Persönlichkeit. */
function personalityQuestion(_pool, rand) {
  const target = pick(Object.values(PERSONALITIES), rand);
  const others = pickMany(
    Object.values(PERSONALITIES).filter((entry) => entry.id !== target.id),
    3,
    rand
  ).map((entry) => entry.name);
  return buildChoice(
    `Welche Persönlichkeit passt zu: „${target.beschreibung}"`,
    target.name,
    others,
    rand
  );
}

function buildChoice(frage, correct, others, rand) {
  const antworten = shuffle([correct, ...others], rand);
  return { frage, antworten, richtig: antworten.indexOf(correct) };
}

const GENERATORS = [elementQuestion, rarityQuestion, evolutionQuestion, personalityQuestion];

/**
 * Liefert eine Fragenrunde.
 * @param {number} count Anzahl Fragen
 * @param {string[]} discovered IDs bereits entdeckter Arten
 * @param {Function} rand Zufallsquelle
 */
export function buildQuizRound(count, discovered = [], rand = Math.random) {
  const pool = discovered.map(species).filter(Boolean);
  const questions = [];
  const used = new Set();

  // Erst ein paar feste Fragen, damit auch Neulinge etwas beantworten können.
  const statics = shuffle(STATIC_QUESTIONS, rand);
  const staticShare = pool.length >= 6 ? Math.ceil(count / 3) : count;

  for (const question of statics) {
    if (questions.length >= Math.min(staticShare, count)) break;
    questions.push(question);
    used.add(question.frage);
  }

  let guard = 0;
  while (questions.length < count && guard < 60) {
    guard += 1;
    const generator = pick(GENERATORS, rand);
    const question = generator(pool.length ? pool : SPECIES, rand);
    if (question && !used.has(question.frage)) {
      used.add(question.frage);
      questions.push(question);
    }
  }

  return shuffle(questions, rand).slice(0, count);
}
