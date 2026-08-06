/**
 * evolveDialog.js — Die Entwicklungs-Zeremonie.
 *
 * Bewusst ein eigener, kurzer Moment: Vorher-Bild, Aufblitzen, Nachher-Bild.
 * Er ist das emotionale Ziel des Pflegens und darf sich besonders anfühlen.
 */

import { h, replace } from '../../core/util.js';
import { petById } from '../../core/state.js';
import { species } from '../../data/species.js';
import { createSprite } from '../../render/petSprite.js';
import { celebrate, flash } from '../../render/fx.js';
import { evolvePet, conditionText } from '../../systems/evolution.js';
import { petLabel } from '../../systems/pets.js';
import { openModal, closeModal } from './modal.js';
import { toast } from './toast.js';
import { rarityChip, elementChip } from './petBits.js';

/**
 * Fragt, ob entwickelt werden soll, und spielt danach die Zeremonie ab.
 * @param {string} petId
 * @param {object} step der mögliche Entwicklungsschritt
 */
export function openEvolutionDialog(petId, step) {
  const pet = petById(petId);
  if (!pet) return;
  const vonArt = species(pet.artId);
  const zuArt = species(step.zu);
  if (!zuArt) return;

  openModal({
    title: 'Etwas verändert sich …',
    icon: '✨',
    dismissable: true,
    body: h(
      'div.col',
      { style: { alignItems: 'center', textAlign: 'center' } },
      h(
        'div.row',
        { style: { justifyContent: 'center', gap: '1.5rem' } },
        h('div.sprite', { style: { width: '110px', height: '110px' } }, createSprite({ artId: vonArt.id, variante: pet.variante })),
        h('div', { style: { fontSize: '2rem', alignSelf: 'center' } }, '→'),
        h(
          'div.sprite',
          { style: { width: '110px', height: '110px', filter: 'brightness(0) opacity(.35)' } },
          createSprite({ artId: zuArt.id, variante: pet.variante })
        )
      ),
      h('p', `${petLabel(pet)} ist bereit, sich zu ${zuArt.name} zu entwickeln.`),
      h('p.tiny.faint', `Bedingung erfüllt: ${conditionText(step)}`)
    ),
    actions: [
      { label: 'Später', variant: 'ghost' },
      {
        label: 'Entwickeln!',
        variant: 'primary',
        onClick: () => {
          playCeremony(petId, step);
          return false; // Dialog wird von der Zeremonie ersetzt
        },
      },
    ],
  });
}

/** Zeigt die Verwandlung. */
function playCeremony(petId, step) {
  const pet = petById(petId);
  const vonArt = species(pet.artId);
  const buehne = h(
    'div.evolve-stage.evolve-stage--flash',
    h('div.evolve-rays'),
    createSprite({ artId: vonArt.id, variante: pet.variante }, { klasse: 'sprite--stage' })
  );

  closeModal();
  openModal({
    title: '',
    dismissable: false,
    body: h('div.col', { style: { alignItems: 'center' } }, buehne, h('p.muted', 'Halte durch …')),
  });

  setTimeout(() => flash('#ffffff', 420), 1400);

  setTimeout(() => {
    const ergebnis = evolvePet(petId, step);
    if (!ergebnis.ok) {
      closeModal();
      toast(ergebnis.grund, { icon: '🚫', type: 'bad' });
      return;
    }

    celebrate(1.6);
    const neu = petById(petId);
    closeModal();
    openModal({
      title: 'Entwicklung geglückt!',
      icon: '🎉',
      body: h(
        'div.col',
        { style: { alignItems: 'center', textAlign: 'center' } },
        h(
          'div.sprite',
          { style: { width: '180px', height: '180px' } },
          createSprite({ artId: ergebnis.zu.id, variante: neu.variante, outfit: neu.outfit })
        ),
        h('h2', ergebnis.zu.name),
        h('div.row', { style: { justifyContent: 'center' } }, elementChip(ergebnis.zu.element), rarityChip(ergebnis.zu.rarity)),
        h('p.small.muted', ergebnis.zu.text),
        h('p.tiny.faint', ergebnis.zu.geschichte)
      ),
      actions: [{ label: 'Wunderbar!', variant: 'primary' }],
    });
  }, 2600);
}
