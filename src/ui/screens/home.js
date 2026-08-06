/**
 * home.js — Der Zuhause-Bildschirm: das Herz des Spiels.
 *
 * Bühne mit dem aktiven Haustier, sein Befinden, die Aktionsleiste und ein
 * Streifen zum schnellen Wechseln zwischen den Team-Mitgliedern.
 */

import { h, replace, formatClock } from '../../core/util.js';
import { getState, activePet, teamPets, update } from '../../core/state.js';
import { species } from '../../data/species.js';
import { element } from '../../data/elements.js';
import { item } from '../../data/items.js';
import { playSpriteAction, spriteToCanvas } from '../../render/petSprite.js';
import { burst, floatAt, ACTION_PARTICLES } from '../../render/fx.js';
import {
  petLabel,
  petMood,
  petStatusText,
  setActivePet,
} from '../../systems/pets.js';
import {
  ACTIONS,
  ACTION_ORDER,
  canPerform,
  cooldownLeft,
  performAction,
  itemsForAction,
  needsItem,
  suggestedAction,
  SLEEP_HOURS,
} from '../../systems/actions.js';
import { addItem } from '../../systems/inventory.js';
import { advanceQuest } from '../../systems/quests.js';
import { checkEvolution } from '../../systems/evolution.js';
import { openEvolutionDialog } from '../components/evolveDialog.js';
import { registerScreen, navigate } from '../router.js';
import { toast } from '../components/toast.js';
import { openModal, closeModal } from '../components/modal.js';
import {
  needBars,
  feelingBars,
  attributeGrid,
  rarityChip,
  elementChip,
  personalityChip,
  variantChip,
  xpBar,
  stageSprite,
} from '../components/petBits.js';

/** Merkt sich das Sprite-Element, damit Animationen nicht neu gebaut werden müssen. */
let stageHost = null;

function render() {
  const state = getState();

  if (!state.flags.starterGewaehlt || !state.haustiere.length) {
    navigate('starter');
    return h('div.empty', h('div.empty__icon', '🌱'), h('p', 'Wähle zuerst dein Starter-Haustier.'));
  }

  const pet = activePet(state);
  const art = species(pet.artId);

  const sprite = stageSprite(pet);
  stageHost = sprite;

  const buehne = h(
    'div.stage',
    { dataset: { element: art.element } },
    sprite,
    pet.schlaeft
      ? h('div.chip', { style: { position: 'absolute', top: '12px', left: '12px' } }, '💤', 'Schläft')
      : null,
    h(
      'div.row',
      { style: { position: 'absolute', top: '12px', right: '12px' } },
      state.lieblingsHaustier === pet.id ? h('span.chip', '⭐', 'Liebling') : null,
      variantChip(pet.variante)
    ),
    h(
      'div',
      { style: { position: 'absolute', bottom: '12px', left: '12px', right: '12px' } },
      h('div.card.card--glass', { style: { padding: '.6rem .9rem' } }, h('p.small', `${petLabel(pet)} ${petStatusText(pet)}`))
    )
  );

  const kopf = h(
    'div.spread',
    h(
      'div.col',
      { style: { gap: '.25rem' } },
      h('h1', petLabel(pet)),
      h('div.row.row--tight', elementChip(art.element), rarityChip(art.rarity), personalityChip(pet.persoenlichkeit))
    ),
    h(
      'div.row.row--tight',
      h('button.btn.btn--sm', { onclick: () => navigate('team') }, '👥 Team'),
      h('button.btn.btn--sm', { onclick: () => navigate('buch', { artId: pet.artId }) }, '📔 Buch')
    )
  );

  const links = h(
    'div.col',
    buehne,
    h('div.card', xpBar(pet), h('div', { style: { height: '.5rem' } }), actionGrid(pet)),
    teamStrip(state, pet)
  );

  const rechts = h(
    'div.col',
    h('div.card', h('div.card__title', h('span', '🫀'), h('h3', 'Bedürfnisse')), needBars(pet)),
    h('div.card', h('div.card__title', h('span', '💭'), h('h3', 'Gefühle')), feelingBars(pet)),
    h('div.card', h('div.card__title', h('span', '📊'), h('h3', 'Attribute')), attributeGrid(pet)),
    evolutionHint(pet)
  );

  return h('div.col', kopf, h('div.home-layout', links, rechts));
}

/** Aktionsleiste mit Abklingzeiten und Empfehlung. */
function actionGrid(pet) {
  const empfehlung = suggestedAction(pet);

  return h(
    'div.action-grid',
    ACTION_ORDER.map((actionId) => {
      const def = ACTIONS[actionId];
      const pruefung = canPerform(pet, actionId);
      const rest = cooldownLeft(pet, actionId);
      const schlafend = actionId === 'schlafen' && pet.schlaeft;

      return h(
        'button.action',
        {
          disabled: !pruefung.ok && !schlafend,
          title: pruefung.ok ? def.text : pruefung.grund,
          class: empfehlung === actionId ? 'shine' : '',
          onclick: () => runAction(actionId, pet),
        },
        h('span.action__icon', { 'aria-hidden': 'true' }, schlafend ? '⏰' : def.icon),
        h('span', schlafend ? 'Wecken' : def.name),
        rest > 0 ? h('span.tiny.faint.mono', formatClock(rest)) : null
      );
    }),
    h(
      'button.action',
      { onclick: () => navigate('abenteuer'), title: 'Schicke dein Haustier auf Expedition' },
      h('span.action__icon', { 'aria-hidden': 'true' }, '🧭'),
      h('span', 'Abenteuer')
    ),
    h(
      'button.action',
      { onclick: () => takePhoto(pet), title: 'Foto machen' },
      h('span.action__icon', { 'aria-hidden': 'true' }, '📸'),
      h('span', 'Foto')
    )
  );
}

/** Führt eine Aktion aus — bei Bedarf mit Auswahl des Gegenstands. */
function runAction(actionId, pet) {
  if (needsItem(actionId)) {
    const kandidaten = itemsForAction(actionId);
    if (kandidaten.length > 1) {
      openItemPicker(actionId, pet, kandidaten);
      return;
    }
  }
  finishAction(actionId, pet, {});
}

function openItemPicker(actionId, pet, kandidaten) {
  const def = ACTIONS[actionId];
  openModal({
    title: `${def.name}: Was soll es sein?`,
    icon: def.icon,
    body: h(
      'div.grid.grid--tiles',
      kandidaten.map((entry) =>
        h(
          'button.tile',
          {
            onclick: () => {
              closeModal();
              finishAction(actionId, pet, { itemId: entry.id });
            },
            title: entry.text,
          },
          h('span.tile__count', String(entry.anzahl)),
          h('span.tile__icon', { 'aria-hidden': 'true' }, entry.icon),
          h('span.tile__label', entry.name)
        )
      )
    ),
  });
}

function finishAction(actionId, pet, options) {
  const ergebnis = performAction(actionId, pet.id, options);

  if (!ergebnis.ok) {
    toast(ergebnis.grund, { icon: '🚫', type: 'bad' });
    return;
  }

  // Rückmeldung: Animation, Partikel, Zahlen.
  if (ergebnis.animation) playSpriteAction(stageHost, ergebnis.animation);
  if (stageHost && ACTION_PARTICLES[actionId]) burst(stageHost, ACTION_PARTICLES[actionId], 7);
  if (ergebnis.xp) floatAt(stageHost, `+${ergebnis.xp} EP`, { farbe: 'var(--brand-strong)' });
  if (ergebnis.muenzen) floatAt(stageHost, `+${ergebnis.muenzen} 🪙`, { farbe: 'var(--accent)' });

  if (actionId === 'schlafen') {
    toast(ergebnis.text, { icon: ergebnis.aufgewacht ? '⏰' : '😴', type: 'good' });
    if (!ergebnis.aufgewacht) toast(`Weckt in ${SLEEP_HOURS} Stunden von selbst auf.`, { icon: '💤', duration: 2000 });
  } else if (ergebnis.text) {
    toast(ergebnis.text, { icon: ACTIONS[actionId].icon, type: 'good', duration: 1800 });
  }

  if (ergebnis.fund) {
    addItem(ergebnis.fund.itemId, ergebnis.fund.anzahl);
    const gefunden = item(ergebnis.fund.itemId);
    toast(`Unterwegs gefunden: ${gefunden.name}`, { icon: gefunden.icon, type: 'rare' });
  }

  // Nach jeder Aktion prüfen, ob eine Entwicklung möglich geworden ist.
  const moeglich = checkEvolution(pet.id);
  if (moeglich) openEvolutionDialog(pet.id, moeglich);
}

/** Streifen zum Wechseln zwischen Team-Haustieren. */
function teamStrip(state, aktiv) {
  const team = teamPets(state);
  if (team.length <= 1) return null;

  return h(
    'div.card',
    { style: { padding: '.6rem' } },
    h(
      'div.row.scroll-x',
      team.map((pet) => {
        const art = species(pet.artId);
        return h(
          'button.btn.btn--sm',
          {
            class: pet.id === aktiv.id ? 'btn--primary' : '',
            onclick: () => setActivePet(pet.id),
            title: `${petLabel(pet)} — Level ${pet.level}`,
          },
          element(art.element).symbol,
          petLabel(pet).slice(0, 12),
          pet.krank ? ' 🤒' : pet.schlaeft ? ' 💤' : ''
        );
      })
    )
  );
}

/** Hinweiskarte, wenn eine Entwicklung greifbar nahe ist. */
function evolutionHint(pet) {
  const art = species(pet.artId);
  if (!art.entwicklung?.length) return null;

  const naechste = art.entwicklung[art.entwicklung.length - 1];
  const fehlt = [];
  if (naechste.minLevel && pet.level < naechste.minLevel) fehlt.push(`Level ${naechste.minLevel}`);
  if (naechste.minZuneigung && pet.gefuehle.zuneigung < naechste.minZuneigung) fehlt.push(`Zuneigung ${naechste.minZuneigung}`);
  if (naechste.minGlueck && pet.gefuehle.glueck < naechste.minGlueck) fehlt.push(`Glück ${naechste.minGlueck}`);
  if (naechste.item) fehlt.push(item(naechste.item)?.name || naechste.item);

  return h(
    'div.card',
    h('div.card__title', h('span', '✨'), h('h3', 'Entwicklung')),
    fehlt.length
      ? h('p.small.muted', `Noch offen: ${fehlt.join(', ')}. Es gibt möglicherweise auch andere Wege.`)
      : h('p.small', { style: { color: 'var(--good)' } }, 'Dein Haustier ist bereit! Führe eine Aktion aus.')
  );
}

/** Fotomodus: rendert das Sprite in ein Canvas und lädt es herunter. */
async function takePhoto(pet) {
  try {
    const art = species(pet.artId);
    const canvas = await spriteToCanvas(
      { artId: pet.artId, variante: pet.variante, outfit: pet.outfit, stimmung: petMood(pet) },
      640,
      [element(art.element).farbe, '#101426']
    );

    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${petLabel(pet)}.png`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, 'image/png');

    update((s) => {
      s.statistik.fotos += 1;
      s.galerie.unshift({ artId: pet.artId, name: petLabel(pet), at: Date.now() });
      s.galerie = s.galerie.slice(0, 24);
    });

    advanceQuest('fotos');
    if (stageHost) burst(stageHost, ACTION_PARTICLES.foto, 6);
    toast('Foto gespeichert!', { icon: '📸', type: 'good' });
  } catch (error) {
    console.error(error);
    toast('Das Foto konnte nicht erstellt werden.', { icon: '⚠️', type: 'bad' });
  }
}

registerScreen({
  id: 'zuhause',
  label: 'Zuhause',
  icon: '🏡',
  order: 10,
  primary: true,
  render,
});

export { render as renderHomeScreen };
