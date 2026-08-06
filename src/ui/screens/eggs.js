/**
 * eggs.js — Der Brutkasten.
 *
 * Jedes Ei zeigt beide Wege zum Schlüpfen: die verbleibende Zeit und die
 * kleine Aufgabe. Was zuerst fertig ist, gewinnt.
 */

import { h, formatDuration, formatClock } from '../../core/util.js';
import { getState } from '../../core/state.js';
import { eggType } from '../../data/eggs.js';
import { species } from '../../data/species.js';
import { createSprite } from '../../render/petSprite.js';
import { celebrate } from '../../render/fx.js';
import {
  eggProgress,
  isReady,
  hatchEgg,
  incubatorSlots,
  freeSlots,
  taskText,
  readyEggCount,
  speedUpEgg,
} from '../../systems/eggs.js';
import { currentBonuses } from '../../systems/home.js';
import { hasItem, removeItem } from '../../systems/inventory.js';
import { petLabel } from '../../systems/pets.js';
import { registerScreen, navigate, refresh } from '../router.js';
import { toast } from '../components/toast.js';
import { openModal } from '../components/modal.js';
import { rarityChip, elementChip, personalityChip, variantChip } from '../components/petBits.js';

function render() {
  const state = getState();
  const plaetze = incubatorSlots(state);
  const vorschau = (currentBonuses().eiVorschau || 0) > 0;

  const slots = [];
  for (let i = 0; i < plaetze; i += 1) {
    const ei = state.eier[i];
    slots.push(ei ? eggCard(ei, vorschau) : emptySlot());
  }

  return h(
    'div.col',
    h(
      'div.screen__head',
      h('div.screen__title', h('h1', '🥚 Brutkasten')),
      h('span.chip', `${state.eier.length} / ${plaetze} belegt`)
    ),

    h(
      'p.small.muted',
      'Eier schlüpfen, sobald ihre Brutzeit abgelaufen ist — oder du erfüllst die Aufgabe des Eis und bist schneller.'
    ),

    h('div.grid.grid--wide', slots),

    h(
      'div.card',
      h('div.card__title', h('span', '💡'), h('h3', 'Wo gibt es Eier?')),
      h(
        'div.col',
        h('p.small.muted', 'Auf Expeditionen (je höher die Zone, desto besser), als Belohnung für Tagesaufgaben und Erfolge — oder im Laden.'),
        h(
          'div.row',
          h('button.btn.btn--sm', { onclick: () => navigate('abenteuer') }, '🧭 Expedition starten'),
          h('button.btn.btn--sm', { onclick: () => navigate('laden') }, '🛒 Eier kaufen')
        )
      )
    )
  );
}

function emptySlot() {
  return h(
    'div.card',
    { style: { display: 'grid', placeItems: 'center', minHeight: '190px', borderStyle: 'dashed' } },
    h('div.empty', h('div.empty__icon', '🪹'), h('p.tiny', 'Freier Brutplatz'))
  );
}

function eggCard(ei, vorschau) {
  const typ = eggType(ei.typ);
  const fertig = isReady(ei);
  const anteil = eggProgress(ei) * 100;
  const rest = Math.max(0, ei.schluepftAm - Date.now());

  return h(
    'div.card',
    { dataset: { rarity: typ.seltenheit }, class: fertig ? 'shine' : '' },
    h(
      'div.col',
      { style: { alignItems: 'center', textAlign: 'center' } },
      h(
        'div',
        { style: { fontSize: '3.4rem' }, class: fertig ? 'egg-shake' : '', 'aria-hidden': 'true' },
        typ.icon
      ),
      h('b', typ.name),
      vorschau ? h('span.chip.chip--rarity', { dataset: { rarity: typ.seltenheit } }, 'Seltenheit erkannt') : null,
      h('div.progress', { style: { width: '100%' } }, h('div.progress__fill', { style: { width: `${anteil}%` } })),
      h('span.tiny.faint.mono', fertig ? 'Bereit zum Schlüpfen!' : `Noch ${formatDuration(rest)}`),
      ei.aufgabe
        ? h(
            'div.list-item',
            { style: { width: '100%' } },
            h('span.list-item__icon', ei.aufgabe.icon || '🎯'),
            h(
              'div.list-item__body',
              h('div.tiny', taskText(ei)),
              h('div.progress', h('div.progress__fill', { style: { width: `${Math.min(100, (ei.aufgabe.fortschritt / ei.aufgabe.ziel) * 100)}%` } }))
            ),
            h('span.tiny.mono', `${Math.min(ei.aufgabe.fortschritt, ei.aufgabe.ziel)}/${ei.aufgabe.ziel}`)
          )
        : null,
      h(
        'div.row',
        { style: { justifyContent: 'center' } },
        h(
          'button.btn.btn--sm',
          {
            class: fertig ? 'btn--primary' : '',
            disabled: !fertig,
            onclick: () => schluepfen(ei.id),
          },
          fertig ? '🐣 Schlüpfen lassen' : '⏳ Wartet'
        ),
        hasItem('brutbeschleuniger') && !fertig
          ? h(
              'button.btn.btn--sm',
              {
                onclick: () => {
                  removeItem('brutbeschleuniger', 1);
                  speedUpEgg(ei.id, 2);
                  toast('Wärmestein benutzt: 2 Stunden schneller.', { icon: '🔆', type: 'good' });
                  refresh();
                },
                title: 'Wärmestein benutzen',
              },
              '🔆'
            )
          : null
      )
    )
  );
}

function schluepfen(eggId) {
  const ergebnis = hatchEgg(eggId);
  if (!ergebnis.ok) {
    toast(ergebnis.grund, { icon: '🚫', type: 'bad' });
    return;
  }

  const pet = ergebnis.pet;
  const art = species(pet.artId);
  const selten = ['episch', 'legendaer', 'mystisch'].includes(art.rarity);

  celebrate(selten ? 1.8 : 1);
  openModal({
    title: 'Es ist geschlüpft!',
    icon: '🐣',
    body: h(
      'div.col',
      { style: { alignItems: 'center', textAlign: 'center' } },
      h(
        'div.sprite',
        { style: { width: '180px', height: '180px' } },
        createSprite({ artId: pet.artId, variante: pet.variante })
      ),
      h('h2', petLabel(pet)),
      h(
        'div.row',
        { style: { justifyContent: 'center' } },
        elementChip(art.element),
        rarityChip(art.rarity),
        personalityChip(pet.persoenlichkeit),
        variantChip(pet.variante)
      ),
      h('p.small.muted', art.text),
      pet.variante === 'schimmernd'
        ? h('p', { style: { color: 'var(--ra-legendaer)' } }, '🌟 Ein schimmerndes Exemplar! Das ist außergewöhnlich selten.')
        : null
    ),
    actions: [{ label: 'Willkommen!', variant: 'primary' }],
  });

  refresh();
}

registerScreen({
  id: 'eier',
  label: 'Eier',
  icon: '🥚',
  order: 70,
  render,
  badge: () => readyEggCount() || null,
});

export { render as renderEggScreen };
