/**
 * shop.js — Der Laden.
 *
 * Feste Auswahl plus ein täglich wechselndes Sonderangebot. Der Rabatt aus der
 * Küche wird direkt eingerechnet, damit sich der Raumausbau sichtbar lohnt.
 */

import { h, formatNumber, dayKey } from '../../core/util.js';
import { getState } from '../../core/state.js';
import { ITEM_CATEGORIES, shopItems, item, costsDiamonds } from '../../data/items.js';
import { EGG_TYPES, EGG_ORDER } from '../../data/eggs.js';
import { seededRandom, pickMany } from '../../core/rng.js';
import { currentBonuses } from '../../systems/home.js';
import { addItem } from '../../systems/inventory.js';
import { addEgg, freeSlots } from '../../systems/eggs.js';
import { spendCoins, spendDiamonds, canAfford } from '../../systems/economy.js';
import { registerScreen, refresh } from '../router.js';
import { toast } from '../components/toast.js';
import { openModal } from '../components/modal.js';

let kategorie = 'futter';

/** Preis nach Rabatt. */
export function preisMit(def) {
  const rabatt = currentBonuses().ladenRabatt || 0;
  return Math.max(1, Math.round((def.preis || 0) * (1 - rabatt)));
}

/** Das tägliche Sonderangebot — gesät mit dem Datum. */
function tagesangebote() {
  const rand = seededRandom(`shop:${dayKey()}`);
  const auswahl = pickMany(shopItems().filter((entry) => entry.preis > 0), 3, rand);
  return auswahl.map((entry) => ({ ...entry, rabatt: 0.35 }));
}

function render() {
  const state = getState();
  const rabatt = currentBonuses().ladenRabatt || 0;
  const angebote = tagesangebote();
  const waren = shopItems().filter((entry) => entry.kategorie === kategorie);

  return h(
    'div.col',
    h(
      'div.screen__head',
      h('div.screen__title', h('h1', '🛒 Laden')),
      h(
        'div.row.row--tight',
        h('span.chip.chip--wallet', '🪙', formatNumber(state.spieler.muenzen)),
        h('span.chip.chip--wallet', '💎', formatNumber(state.spieler.diamanten))
      )
    ),

    rabatt > 0
      ? h('p.small', { style: { color: 'var(--good)' } }, `Deine Küche senkt alle Preise um ${Math.round(rabatt * 100)} %.`)
      : null,

    h(
      'div.card',
      h('div.card__title', h('span', '⭐'), h('h3', 'Angebot des Tages')),
      h(
        'div.grid.grid--auto',
        angebote.map((entry) => wareCard(entry, entry.rabatt))
      )
    ),

    h('h2', '🥚 Eier'),
    h(
      'div.grid.grid--auto',
      ['normal', 'selten', 'episch', 'legendaer'].map((typId) => eggCard(typId))
    ),

    h('h2', 'Waren'),
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
    waren.length
      ? h('div.grid.grid--auto', waren.map((entry) => wareCard(entry)))
      : h('div.empty', h('div.empty__icon', '🛍️'), h('p', 'In dieser Kategorie gibt es nichts zu kaufen.'))
  );
}

function wareCard(def, extraRabatt = 0) {
  const diamanten = costsDiamonds(def);
  const preis = diamanten ? def.diamanten : Math.max(1, Math.round(preisMit(def) * (1 - extraRabatt)));
  const bezahlbar = diamanten ? canAfford(0, preis) : canAfford(preis);

  return h(
    'button.pet-card',
    {
      dataset: { rarity: def.seltenheit },
      disabled: !bezahlbar,
      style: bezahlbar ? null : { opacity: '.55' },
      onclick: () => kaufen(def, preis, diamanten),
    },
    extraRabatt ? h('span.tile__count', { style: { color: 'var(--good)' } }, `−${Math.round(extraRabatt * 100)} %`) : null,
    h('div.pet-card__art', { style: { height: '56px', fontSize: '2.3rem' } }, def.icon),
    h('div.pet-card__name', { style: { justifyContent: 'center' } }, def.name),
    h('div.tiny.faint.center', def.text),
    h(
      'div.row',
      { style: { justifyContent: 'center', marginTop: '.25rem' } },
      h('span.chip.chip--wallet', diamanten ? '💎' : '🪙', formatNumber(preis))
    )
  );
}

function kaufen(def, preis, diamanten) {
  const bezahlt = diamanten ? spendDiamonds(preis) : spendCoins(preis);
  if (!bezahlt) {
    toast('Nicht genug Geld.', { icon: '🚫', type: 'bad' });
    return;
  }
  addItem(def.id, 1);
  toast(`${def.name} gekauft.`, { icon: def.icon, type: 'good' });
  refresh();
}

function eggCard(typId) {
  const typ = EGG_TYPES[typId];
  const preise = { normal: 200, selten: 800, episch: 2400, legendaer: 6000 };
  const preis = Math.max(1, Math.round(preise[typId] * (1 - (currentBonuses().ladenRabatt || 0))));
  const platz = freeSlots() > 0;

  return h(
    'button.pet-card',
    {
      dataset: { rarity: typ.seltenheit },
      disabled: !platz || !canAfford(preis),
      style: platz && canAfford(preis) ? null : { opacity: '.55' },
      onclick: () => {
        if (!spendCoins(preis)) {
          toast('Nicht genug Münzen.', { icon: '🚫', type: 'bad' });
          return;
        }
        const ergebnis = addEgg(typId);
        if (!ergebnis.ok) {
          toast(ergebnis.grund, { icon: '🚫', type: 'bad' });
          return;
        }
        toast(`${typ.name} in den Brutkasten gelegt.`, { icon: typ.icon, type: 'good' });
        refresh();
      },
    },
    h('div.pet-card__art', { style: { height: '56px', fontSize: '2.3rem' } }, typ.icon),
    h('div.pet-card__name', { style: { justifyContent: 'center' } }, typ.name),
    h('div.tiny.faint.center', platz ? typ.text : 'Brutkasten voll'),
    h('div.row', { style: { justifyContent: 'center', marginTop: '.25rem' } }, h('span.chip.chip--wallet', '🪙', formatNumber(preis)))
  );
}

registerScreen({
  id: 'laden',
  label: 'Laden',
  icon: '🛒',
  order: 50,
  render,
});

export { render as renderShopScreen };
