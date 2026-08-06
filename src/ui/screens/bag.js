/**
 * bag.js — Der Beutel.
 *
 * Alle Gegenstände nach Kategorie, mit Wirkung, Anzahl und den beiden
 * Handlungen, die zählen: benutzen oder verkaufen.
 */

import { h, formatNumber } from '../../core/util.js';
import { getState, activePet } from '../../core/state.js';
import { ITEM_CATEGORIES, item } from '../../data/items.js';
import { inventoryList, useItem, sellItem, inventorySize, equipOutfit } from '../../systems/inventory.js';
import { speedUpEgg } from '../../systems/eggs.js';
import { STAT_META, petLabel } from '../../systems/pets.js';
import { registerScreen, refresh, navigate } from '../router.js';
import { toast } from '../components/toast.js';
import { openModal, closeModal, confirmDialog } from '../components/modal.js';

let kategorie = 'futter';

function render() {
  const state = getState();
  const pet = activePet(state);
  const eintraege = inventoryList(kategorie);

  return h(
    'div.col',
    h(
      'div.screen__head',
      h('div.screen__title', h('h1', '🎒 Beutel')),
      h('span.chip', `${formatNumber(inventorySize())} Gegenstände`)
    ),

    h(
      'div.tabs',
      ITEM_CATEGORIES.map((cat) =>
        h(
          'button.tab',
          {
            'aria-selected': cat.id === kategorie ? 'true' : 'false',
            onclick: () => {
              kategorie = cat.id;
              refresh();
            },
          },
          `${cat.icon} ${cat.name}`
        )
      )
    ),

    pet ? h('p.tiny.faint', `Gegenstände wirken auf: ${petLabel(pet)}`) : null,

    eintraege.length
      ? h(
          'div.grid.grid--auto',
          eintraege.map((entry) => itemCard(entry, pet))
        )
      : h(
          'div.empty',
          h('div.empty__icon', '📭'),
          h('p', 'Hier ist nichts. Expeditionen, Minispiele und der Laden füllen den Beutel.'),
          h('button.btn.btn--sm', { onclick: () => navigate('laden') }, 'Zum Laden')
        )
  );
}

function itemCard(entry, pet) {
  return h(
    'button.pet-card',
    {
      dataset: { rarity: entry.seltenheit },
      onclick: () => openItem(entry, pet),
    },
    h('span.tile__count', `${entry.anzahl}×`),
    h('div.pet-card__art', { style: { height: '58px', fontSize: '2.4rem' } }, entry.icon),
    h('div.pet-card__name', { style: { justifyContent: 'center', textAlign: 'center' } }, entry.name),
    h('div.tiny.faint.center', entry.text)
  );
}

function openItem(entry, pet) {
  const def = item(entry.id);
  const wirkungen = Object.entries(def.wirkung || {}).map(([key, wert]) =>
    h('span.chip', `${STAT_META[key]?.icon || '•'} ${STAT_META[key]?.name || key} +${wert}`)
  );
  const attribute = Object.entries(def.attribut || {}).map(([key, wert]) =>
    h('span.chip', `${STAT_META[key]?.icon || '•'} ${STAT_META[key]?.name || key} +${wert} dauerhaft`)
  );

  const aktionen = [];

  if (def.kategorie === 'kleidung') {
    aktionen.push({
      label: pet ? `Anziehen (${petLabel(pet)})` : 'Kein Haustier',
      variant: 'primary',
      onClick: () => {
        if (!pet) return;
        const ergebnis = equipOutfit(entry.id, pet.id);
        toast(ergebnis.text || ergebnis.grund, { icon: entry.icon, type: ergebnis.ok ? 'good' : 'bad' });
      },
    });
  } else if (def.spezial === 'brut') {
    aktionen.push({
      label: 'Bei einem Ei anwenden',
      variant: 'primary',
      onClick: () => {
        closeModal();
        navigate('eier');
        toast('Wähle im Brutkasten das Ei aus, das schneller schlüpfen soll.', { icon: '🔆' });
      },
    });
  } else if (def.stein) {
    aktionen.push({
      label: 'Wird bei Entwicklungen gebraucht',
      onClick: () => {
        closeModal();
        navigate('zuhause');
      },
    });
  } else if (def.wirkung || def.attribut || def.spezial) {
    aktionen.push({
      label: pet ? `Benutzen (${petLabel(pet)})` : 'Benutzen',
      variant: 'primary',
      onClick: () => {
        const ergebnis = useItem(entry.id, pet?.id);
        toast(ergebnis.ok ? ergebnis.text : ergebnis.grund, {
          icon: entry.icon,
          type: ergebnis.ok ? 'good' : 'bad',
        });
        refresh();
      },
    });
  }

  if (def.verkauf) {
    aktionen.push({
      label: `Verkaufen (${def.verkauf} 🪙)`,
      onClick: async () => {
        const ergebnis = sellItem(entry.id, 1);
        toast(ergebnis.ok ? `Verkauft: +${ergebnis.erloes} Münzen` : ergebnis.grund, {
          icon: '🪙',
          type: ergebnis.ok ? 'good' : 'bad',
        });
        refresh();
      },
    });
  }

  openModal({
    title: def.name,
    icon: def.icon,
    body: h(
      'div.col',
      h('p', def.text),
      h('div.row', ...(wirkungen.length ? [wirkungen] : []), ...(attribute.length ? [attribute] : [])),
      def.bonus
        ? h(
            'p.tiny',
            { style: { color: 'var(--good)' } },
            'Wirkt dauerhaft, solange der Gegenstand im Beutel liegt.'
          )
        : null,
      h('p.tiny.faint', `Im Beutel: ${entry.anzahl}×`)
    ),
    actions: aktionen,
  });
}

registerScreen({
  id: 'beutel',
  label: 'Beutel',
  icon: '🎒',
  order: 40,
  render,
});

export { render as renderBagScreen };
