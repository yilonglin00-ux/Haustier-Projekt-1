/**
 * house.js — Das Zuhause ausbauen.
 *
 * Sechs Räume, jeder mit einem spürbaren Vorteil, dazu Möbel, die ihn
 * verstärken. Der Ausbau ist der langfristige Münzen-Sink des Spiels.
 */

import { h, formatNumber } from '../../core/util.js';
import { getState, hasRoom } from '../../core/state.js';
import { ROOMS, ROOM_ORDER, furnitureOfRoom, buyRoom, buyFurniture, bonusList } from '../../systems/home.js';
import { canAfford } from '../../systems/economy.js';
import { registerScreen, refresh } from '../router.js';
import { toast } from '../components/toast.js';
import { openModal } from '../components/modal.js';

function render() {
  const state = getState();
  const boni = bonusList();

  return h(
    'div.col',
    h(
      'div.screen__head',
      h('div.screen__title', h('h1', '🏠 Zuhause')),
      h('span.chip.chip--wallet', '🪙', formatNumber(state.spieler.muenzen))
    ),

    boni.length
      ? h(
          'div.card',
          h('div.card__title', h('span', '✨'), h('h3', 'Aktive Vorteile')),
          h('div.row', boni.map((bonus) => h('span.chip', bonus.name, ' ', h('b', bonus.text))))
        )
      : null,

    h(
      'div.grid.grid--wide',
      ROOM_ORDER.map((id) => roomCard(id, state))
    )
  );
}

function roomCard(roomId, state) {
  const def = ROOMS[roomId];
  const frei = hasRoom(roomId, state);
  const moebel = furnitureOfRoom(roomId);
  const gekauft = moebel.filter((entry) => state.zuhause.moebel[entry.id]).length;

  return h(
    'button.pet-card',
    {
      style: frei ? null : { opacity: '.7' },
      onclick: () => (frei ? openRoom(roomId) : kaufeRaum(roomId)),
    },
    h('div.pet-card__art', { style: { height: '64px', fontSize: '2.6rem', filter: frei ? '' : 'grayscale(1)' } }, def.icon),
    h('div.pet-card__name', { style: { justifyContent: 'center' } }, def.name),
    h('p.tiny.faint.center', def.bonusText),
    frei
      ? h('div.row', { style: { justifyContent: 'center' } }, h('span.chip', `${gekauft}/${moebel.length} Möbel`))
      : h(
          'div.row',
          { style: { justifyContent: 'center' } },
          h('span.chip.chip--wallet', '🪙', formatNumber(def.preis))
        )
  );
}

function kaufeRaum(roomId) {
  const def = ROOMS[roomId];
  openModal({
    title: `${def.name} freischalten?`,
    icon: def.icon,
    body: h(
      'div.col',
      h('p', def.text),
      h('p.small', { style: { color: 'var(--good)' } }, def.bonusText),
      h('p.tiny.faint', `Kosten: ${formatNumber(def.preis)} Münzen`)
    ),
    actions: [
      { label: 'Später' },
      {
        label: 'Freischalten',
        variant: 'primary',
        onClick: () => {
          const ergebnis = buyRoom(roomId);
          toast(ergebnis.ok ? `${def.name} freigeschaltet!` : ergebnis.grund, {
            icon: def.icon,
            type: ergebnis.ok ? 'good' : 'bad',
          });
          refresh();
        },
      },
    ],
  });
}

function openRoom(roomId) {
  const def = ROOMS[roomId];
  const state = getState();
  const moebel = furnitureOfRoom(roomId);

  openModal({
    title: def.name,
    icon: def.icon,
    wide: true,
    body: h(
      'div.col',
      h('p.muted', def.text),
      h('p.small', { style: { color: 'var(--good)' } }, def.bonusText),
      h('div.section-label', 'Möbel'),
      h(
        'div.grid.grid--auto',
        moebel.map((entry) => {
          const besitzt = state.zuhause.moebel[entry.id];
          return h(
            'button.tile',
            {
              disabled: besitzt || !canAfford(entry.preis),
              class: besitzt ? 'list-item--done' : '',
              onclick: () => {
                const ergebnis = buyFurniture(entry.id);
                toast(ergebnis.ok ? `${entry.name} aufgestellt!` : ergebnis.grund, {
                  icon: entry.icon,
                  type: ergebnis.ok ? 'good' : 'bad',
                });
                refresh();
              },
            },
            h('span.tile__icon', { 'aria-hidden': 'true' }, entry.icon),
            h('span.tile__label', entry.name),
            h('span.tiny.faint', besitzt ? '✓ vorhanden' : `🪙 ${formatNumber(entry.preis)}`),
            h('span.tiny.faint', entry.text)
          );
        })
      )
    ),
  });
}

registerScreen({
  id: 'zuhause-ausbau',
  label: 'Haus',
  icon: '🏠',
  order: 60,
  render,
});

export { render as renderHouseScreen };
