/**
 * welcomeBack.js — „Was ist passiert, während du weg warst?"
 *
 * Nach längerer Abwesenheit ist die wichtigste Frage nicht „wie lange", sondern
 * „was muss ich jetzt tun". Deshalb fasst dieser Dialog zusammen, was wartet,
 * und führt mit einem Klick genau dorthin.
 */

import { h, formatDuration } from '../../core/util.js';
import { getState } from '../../core/state.js';
import { petLabel, petMood } from '../../systems/pets.js';
import { readyEggCount } from '../../systems/eggs.js';
import { readyTripCount } from '../../systems/expeditions.js';
import { claimableCount } from '../../systems/quests.js';
import { openModal, closeModal } from './modal.js';
import { navigate } from '../router.js';

/** Ab dieser Abwesenheit lohnt sich eine Zusammenfassung statt eines Hinweises. */
const AB_DAUER = 30 * 60 * 1000;

/**
 * Zeigt die Rückkehr-Zusammenfassung, falls es etwas zu erzählen gibt.
 * @param {{elapsedMs:number, cappedMs:number}} abwesenheit aus `catchUp()`
 * @returns {boolean} ob ein Dialog geöffnet wurde
 */
export function showWelcomeBack(abwesenheit) {
  if (abwesenheit.elapsedMs < AB_DAUER) return false;

  const state = getState();
  const eier = readyEggCount(state);
  const reisen = readyTripCount(state);
  const aufgaben = claimableCount(state);
  const hungrig = state.haustiere.filter((pet) => pet.beduerfnisse.hunger < 35 || pet.beduerfnisse.durst < 35);
  const kranke = state.haustiere.filter((pet) => pet.krank);

  const punkte = [];
  if (eier) punkte.push(eintrag('🥚', `${eier} Ei${eier > 1 ? 'er' : ''} ist schlupfbereit`, 'eier'));
  if (reisen) punkte.push(eintrag('🧭', `${reisen} Expedition${reisen > 1 ? 'en' : ''} wartet auf Abholung`, 'abenteuer'));
  if (aufgaben) punkte.push(eintrag('📋', `${aufgaben} Belohnung${aufgaben > 1 ? 'en' : ''} abzuholen`, 'aufgaben'));
  if (kranke.length) punkte.push(eintrag('🤒', `${kranke.map(petLabel).join(', ')} braucht Medizin`, 'zuhause'));
  else if (hungrig.length) punkte.push(eintrag('🍖', `${hungrig.map(petLabel).join(', ')} hat Hunger oder Durst`, 'zuhause'));

  // Nichts Dringendes? Dann reicht der kurze Hinweis, den main.js sowieso zeigt.
  if (!punkte.length) return false;

  openModal({
    title: 'Willkommen zurück!',
    icon: '👋',
    body: h(
      'div.col',
      h(
        'p.muted',
        `Du warst ${formatDuration(abwesenheit.elapsedMs)} weg.` +
          (abwesenheit.cappedMs > 0
            ? ' Deine Haustiere haben nur die ersten zwölf Stunden gespürt — länger warten sie geduldig.'
            : '')
      ),
      h('div.col', punkte)
    ),
    actions: [{ label: 'Los geht’s', variant: 'primary' }],
  });

  return true;
}

/** Eine anklickbare Zeile, die direkt zum passenden Bildschirm führt. */
function eintrag(icon, text, ziel) {
  return h(
    'button.list-item',
    {
      onclick: () => {
        closeModal();
        navigate(ziel);
      },
    },
    h('span.list-item__icon', { 'aria-hidden': 'true' }, icon),
    h('div.list-item__body', h('div.list-item__title', text)),
    h('span.faint', { 'aria-hidden': 'true' }, '›')
  );
}
