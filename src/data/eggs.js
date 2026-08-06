/**
 * eggs.js — Eier und ihre Seltenheiten.
 *
 * Ein Ei schlüpft auf zwei Wegen: nach Ablauf der Brutzeit **oder** durch
 * Erfüllen einer kleinen Aufgabe. Wer aktiv spielt, kommt also schneller an
 * sein Haustier — wer weglegt, verliert nichts.
 */

import { MINUTE, HOUR } from '../core/util.js';

export const EGG_TYPES = {
  normal: {
    id: 'normal',
    name: 'Normales Ei',
    icon: '🥚',
    farbe: '#dfe6f2',
    seltenheit: 'gewoehnlich',
    brutzeit: 12 * MINUTE,
    /** Verteilung der Seltenheit des schlüpfenden Haustiers. */
    gewichte: { gewoehnlich: 72, ungewoehnlich: 24, selten: 4 },
    text: 'Ein ganz gewöhnliches Ei. Meistens.',
  },
  selten: {
    id: 'selten',
    name: 'Seltenes Ei',
    icon: '🔵',
    farbe: '#4aa8ff',
    seltenheit: 'selten',
    brutzeit: 45 * MINUTE,
    gewichte: { gewoehnlich: 28, ungewoehnlich: 42, selten: 27, episch: 3 },
    text: 'Blau geädert und angenehm warm.',
  },
  episch: {
    id: 'episch',
    name: 'Episches Ei',
    icon: '🟣',
    farbe: '#b072f5',
    seltenheit: 'episch',
    brutzeit: 2 * HOUR,
    gewichte: { ungewoehnlich: 20, selten: 46, episch: 30, legendaer: 4 },
    text: 'Es pulsiert. Man spürt es durch die Schale.',
  },
  legendaer: {
    id: 'legendaer',
    name: 'Legendäres Ei',
    icon: '🟡',
    farbe: '#ffc03a',
    seltenheit: 'legendaer',
    brutzeit: 5 * HOUR,
    gewichte: { selten: 24, episch: 46, legendaer: 29, mystisch: 1 },
    text: 'Wärmt die Hände und summt bei Sonnenuntergang.',
  },
  mystisch: {
    id: 'mystisch',
    name: 'Mystisches Ei',
    icon: '🔴',
    farbe: '#ff5a7a',
    seltenheit: 'mystisch',
    brutzeit: 8 * HOUR,
    gewichte: { episch: 30, legendaer: 50, mystisch: 20 },
    garantie: ['obsidiel'],
    text: 'Niemand weiß, wo diese Eier herkommen. Sie sind einfach da.',
  },
  golden: {
    id: 'golden',
    name: 'Goldenes Ei',
    icon: '🥇',
    farbe: '#ffd451',
    seltenheit: 'legendaer',
    brutzeit: 3 * HOUR,
    gewichte: { episch: 40, legendaer: 60 },
    garantie: ['goldkitz'],
    text: 'Taucht nur an besonderen Tagen auf. Schlüpft golden.',
  },
  regenbogen: {
    id: 'regenbogen',
    name: 'Regenbogenei',
    icon: '🌈',
    farbe: '#7effe0',
    seltenheit: 'mystisch',
    brutzeit: 6 * HOUR,
    gewichte: { legendaer: 40, mystisch: 60 },
    garantie: ['prismara'],
    text: 'Schillert in Farben, für die es keine Namen gibt.',
  },
};

export const EGG_ORDER = ['normal', 'selten', 'episch', 'legendaer', 'mystisch', 'golden', 'regenbogen'];

export function eggType(id) {
  return EGG_TYPES[id] || EGG_TYPES.normal;
}

/**
 * Aufgaben, die ein Ei alternativ zum Warten zum Schlüpfen bringen.
 * `zaehler` verweist auf einen Fortschrittszähler, den systems/eggs.js pflegt.
 */
export const HATCH_TASKS = [
  { id: 'aktionen', text: 'Kümmere dich {ziel}× um deine Haustiere', zaehler: 'aktionen', ziel: 12, icon: '🤲' },
  { id: 'spielen', text: 'Spiele {ziel}× mit einem Haustier', zaehler: 'spielen', ziel: 5, icon: '🎾' },
  { id: 'minispiele', text: 'Beende {ziel} Minispiele', zaehler: 'minispiele', ziel: 2, icon: '🎮' },
  { id: 'fuettern', text: 'Füttere {ziel}× ein Haustier', zaehler: 'fuettern', ziel: 6, icon: '🍖' },
  { id: 'expedition', text: 'Schließe {ziel} Expedition ab', zaehler: 'expeditionen', ziel: 1, icon: '🧭' },
  { id: 'training', text: 'Trainiere {ziel}×', zaehler: 'training', ziel: 4, icon: '🏋️' },
];

/** Aufgabe mit eingesetztem Zielwert. */
export function hatchTaskText(task) {
  return task.text.replace('{ziel}', String(task.ziel));
}
