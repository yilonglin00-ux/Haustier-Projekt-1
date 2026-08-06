/**
 * expedition.js — Abenteuer.
 *
 * Links die laufenden Reisen mit Countdown, darunter die Zonen. Eine Zone
 * öffnet die Auswahl, welches Haustier losziehen soll — mit ehrlicher Anzeige,
 * warum ein Haustier vielleicht nicht kann.
 */

import { h, formatDuration, formatNumber } from '../../core/util.js';
import { getState, teamPets, petById, isOnExpedition } from '../../core/state.js';
import { item } from '../../data/items.js';
import { eggType } from '../../data/eggs.js';
import { onFrame } from '../../core/loop.js';
import { celebrate } from '../../render/fx.js';
import {
  ZONES,
  startExpedition,
  collectExpedition,
  cancelExpedition,
  tripProgress,
  tripReady,
  tripLeft,
  readyTripCount,
} from '../../systems/expeditions.js';
import { petLabel, power } from '../../systems/pets.js';
import { registerScreen, refresh } from '../router.js';
import { toast } from '../components/toast.js';
import { openModal, closeModal, confirmDialog } from '../components/modal.js';
import { petCard } from '../components/petBits.js';

/** Aktualisiert nur die Countdown-Texte, statt den Bildschirm neu zu bauen. */
let frameOff = null;

function render() {
  const state = getState();
  installExpeditionTicker();
  const hoechstes = state.haustiere.reduce((max, pet) => Math.max(max, pet.level), 1);

  return h(
    'div.col',
    h(
      'div.screen__head',
      h('div.screen__title', h('h1', '🧭 Abenteuer')),
      h('span.chip', `${state.expeditionen.length} unterwegs`)
    ),

    state.expeditionen.length
      ? h(
          'div.col',
          h('div.section-label', 'Unterwegs'),
          h('div.grid.grid--wide', state.expeditionen.map(tripCard))
        )
      : null,

    h('div.section-label', 'Zonen'),
    h(
      'div.grid.grid--wide',
      ZONES.map((zone) => zoneCard(zone, hoechstes))
    ),

    h(
      'p.tiny.faint',
      'Expeditionen laufen in Echtzeit weiter — auch wenn du das Spiel schließt. Dein Haustier kehrt erschöpft, aber zufrieden zurück.'
    )
  );
}

function tripCard(reise) {
  const pet = petById(reise.petId);
  const zone = ZONES.find((entry) => entry.id === reise.zoneId);
  const fertig = tripReady(reise);

  return h(
    'div.card',
    { class: fertig ? 'shine' : '' },
    h(
      'div.col',
      h(
        'div.spread',
        h('div.row.row--tight', h('span', { style: { fontSize: '1.4rem' } }, zone.icon), h('b', zone.name)),
        h('span.chip', pet ? petLabel(pet) : '—')
      ),
      h('div.progress', h('div.progress__fill', { style: { width: `${tripProgress(reise) * 100}%` } })),
      h(
        'div.spread',
        h('span.tiny.faint.mono', { dataset: { countdown: reise.id } }, fertig ? 'Zurück!' : formatDuration(tripLeft(reise))),
        h(
          'div.row.row--tight',
          h(
            'button.btn.btn--sm',
            { class: fertig ? 'btn--primary' : '', disabled: !fertig, onclick: () => abholen(reise.id) },
            fertig ? '🎁 Abholen' : '⏳ Unterwegs'
          ),
          !fertig
            ? h(
                'button.btn.btn--sm.btn--ghost',
                {
                  title: 'Abbrechen (ohne Beute)',
                  'aria-label': 'Expedition abbrechen',
                  onclick: async () => {
                    const sicher = await confirmDialog({
                      title: 'Expedition abbrechen?',
                      message: 'Dein Haustier kehrt sofort zurück — allerdings mit leeren Pfoten.',
                      confirmLabel: 'Abbrechen',
                      danger: true,
                    });
                    if (sicher) {
                      cancelExpedition(reise.id);
                      refresh();
                    }
                  },
                },
                '✕'
              )
            : null
        )
      )
    )
  );
}

function zoneCard(zone, hoechstes) {
  const offen = hoechstes >= zone.minLevel;
  return h(
    'button.pet-card',
    {
      dataset: { element: zone.element },
      style: offen ? null : { opacity: '.55' },
      onclick: () => (offen ? openZone(zone) : toast(`Erst ab Level ${zone.minLevel}.`, { icon: '🔒', type: 'bad' })),
    },
    h('div.pet-card__art', { style: { height: '58px', fontSize: '2.4rem' } }, zone.icon),
    h('div.pet-card__name', { style: { justifyContent: 'center' } }, zone.name),
    h('p.tiny.faint.center', zone.text),
    h(
      'div.row',
      { style: { justifyContent: 'center' } },
      h('span.chip', `ab Lv. ${zone.minLevel}`),
      h('span.chip', `⏱ ${formatDuration(zone.dauer)}`)
    )
  );
}

function openZone(zone) {
  const state = getState();
  const kandidaten = teamPets(state);

  openModal({
    title: zone.name,
    icon: zone.icon,
    wide: true,
    body: h(
      'div.col',
      h('p.muted', zone.text),
      h(
        'div.row',
        h('span.chip', `⏱ ${formatDuration(zone.dauer)}`),
        h('span.chip', `🪙 ${zone.muenzen[0]}–${zone.muenzen[1]}`),
        h('span.chip', `✨ ${zone.xp[0]}–${zone.xp[1]} EP`),
        h('span.chip', `🥚 ${Math.round(zone.eiChance * 100)} % Ei-Chance`)
      ),
      h('div.section-label', 'Wer soll gehen?'),
      h(
        'div.grid.grid--auto',
        kandidaten.map((pet) => {
          const unterwegs = isOnExpedition(pet.id, state);
          const zuSchwach = pet.level < zone.minLevel;
          const grund = unterwegs
            ? 'bereits unterwegs'
            : zuSchwach
              ? `braucht Level ${zone.minLevel}`
              : pet.schlaeft
                ? 'schläft'
                : pet.krank
                  ? 'ist krank'
                  : pet.beduerfnisse.energie < 25
                    ? 'zu erschöpft'
                    : null;

          return h(
            'div.col',
            { style: { gap: '.25rem' } },
            petCard(pet, {
              klein: true,
              fortschritt: false,
              onClick: () => {
                if (grund) {
                  toast(`${petLabel(pet)} ${grund}.`, { icon: '🚫', type: 'bad' });
                  return;
                }
                const ergebnis = startExpedition(pet.id, zone.id);
                if (!ergebnis.ok) {
                  toast(ergebnis.grund, { icon: '🚫', type: 'bad' });
                  return;
                }
                closeModal();
                toast(`${petLabel(pet)} bricht auf!`, { icon: zone.icon, type: 'good' });
                refresh();
              },
            }),
            h('span.tiny.faint.center', grund ? `⛔ ${grund}` : `Kraft ${formatNumber(power(pet))}`)
          );
        })
      ),
      h(
        'p.tiny.faint',
        `Die Reise kostet Energie, Sauberkeit, Hunger und Durst — plane also einen Ruhetag ein.`
      )
    ),
  });
}

function abholen(tripId) {
  const ergebnis = collectExpedition(tripId);
  if (!ergebnis.ok) {
    toast(ergebnis.grund, { icon: '🚫', type: 'bad' });
    return;
  }

  const { beute, zone } = ergebnis;
  if (beute.sonderfund) celebrate(2);

  openModal({
    title: `Zurück aus ${zone.name}`,
    icon: '🎁',
    body: h(
      'div.col',
      h(
        'div.row',
        h('span.chip.chip--wallet', '🪙', `+${formatNumber(beute.muenzen)}`),
        h('span.chip.chip--wallet', '✨', `+${formatNumber(beute.xp)} EP`)
      ),
      beute.gegenstaende.length
        ? h(
            'div.col',
            h('div.section-label', 'Fundstücke'),
            h(
              'div.grid.grid--tiles',
              beute.gegenstaende.map((eintrag) => {
                const def = item(eintrag.id);
                return h(
                  'div.tile',
                  h('span.tile__count', `${eintrag.anzahl}×`),
                  h('span.tile__icon', { 'aria-hidden': 'true' }, def.icon),
                  h('span.tile__label', def.name)
                );
              })
            )
          )
        : h('p.muted', 'Diesmal war nichts Besonderes dabei.'),
      beute.ei
        ? h(
            'p',
            { style: { color: beute.sonderfund ? 'var(--ra-mystisch)' : 'var(--good)' } },
            beute.eiAbgelehnt
              ? `Ein ${eggType(beute.ei).name} lag da — aber dein Brutkasten war voll.`
              : `Ein ${eggType(beute.ei).name} ${eggType(beute.ei).icon} liegt jetzt im Brutkasten!`
          )
        : null
    ),
    actions: [{ label: 'Schön!', variant: 'primary' }],
  });

  refresh();
}

registerScreen({
  id: 'abenteuer',
  label: 'Abenteuer',
  icon: '🧭',
  order: 25,
  primary: true,
  render,
  badge: () => readyTripCount() || null,
  onLeave: () => {
    frameOff?.();
    frameOff = null;
  },
});

/** Countdowns laufen ohne vollständiges Neuzeichnen. */
export function installExpeditionTicker() {
  frameOff?.();
  frameOff = onFrame(() => {
    for (const reise of getState().expeditionen) {
      const node = document.querySelector(`[data-countdown="${reise.id}"]`);
      if (node) node.textContent = tripReady(reise) ? 'Zurück!' : formatDuration(tripLeft(reise));
    }
  });
}

export { render as renderExpeditionScreen };
