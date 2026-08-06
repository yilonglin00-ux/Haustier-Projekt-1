/**
 * petBits.js — Wiederkehrende Bausteine rund um Haustiere.
 *
 * Werteleisten, Attributkacheln, Seltenheits-Chips und Haustierkarten tauchen
 * auf fast jedem Bildschirm auf. Hier stehen sie einmal.
 */

import { h, percent, formatNumber } from '../../core/util.js';
import { species } from '../../data/species.js';
import { rarity } from '../../data/rarity.js';
import { element } from '../../data/elements.js';
import { personality } from '../../data/personalities.js';
import { variant } from '../../data/rarity.js';
import { createSprite } from '../../render/petSprite.js';
import { STAT_META, attributes, petLabel, petMood, xpProgress, xpForLevel } from '../../systems/pets.js';

/** Eine Bedürfnis- oder Gefühlsleiste. */
export function statBar(key, wert, options = {}) {
  const meta = STAT_META[key] || { name: key, icon: '•' };
  const anteil = percent(wert, options.max || 100);
  const niedrig = anteil < 25;

  return h(
    'div.stat',
    { class: niedrig ? 'stat--low' : '', title: meta.hinweis || meta.name },
    h('span.stat__icon', { 'aria-hidden': 'true' }, meta.icon),
    h(
      'div.stat__track',
      { role: 'progressbar', 'aria-valuenow': Math.round(anteil), 'aria-label': meta.name },
      h('div.stat__fill', { style: { width: `${anteil}%`, '--stat-color': meta.farbe || 'var(--brand)' } })
    ),
    h('span.stat__value', options.text ?? `${Math.round(wert)}`)
  );
}

/** Alle Bedürfnisleisten eines Haustiers. */
export function needBars(pet) {
  return h(
    'div.col',
    statBar('gesundheit', pet.beduerfnisse.gesundheit),
    statBar('energie', pet.beduerfnisse.energie),
    statBar('hunger', pet.beduerfnisse.hunger),
    statBar('durst', pet.beduerfnisse.durst),
    statBar('sauberkeit', pet.beduerfnisse.sauberkeit)
  );
}

/** Gefühlsleisten eines Haustiers. */
export function feelingBars(pet) {
  return h(
    'div.col',
    statBar('stimmung', pet.gefuehle.stimmung),
    statBar('glueck', pet.gefuehle.glueck),
    statBar('vertrauen', pet.gefuehle.vertrauen),
    statBar('zuneigung', pet.gefuehle.zuneigung)
  );
}

/** Attributkacheln (Stärke, Intelligenz, Tempo). */
export function attributeGrid(pet) {
  const werte = attributes(pet);
  return h(
    'div.attr-grid',
    Object.entries(werte).map(([key, wert]) =>
      h(
        'div.attr',
        { title: STAT_META[key].name },
        h('div.attr__value', formatNumber(wert)),
        h('div.attr__label', `${STAT_META[key].icon} ${STAT_META[key].kurz || STAT_META[key].name}`)
      )
    )
  );
}

/** Seltenheits-Chip. */
export function rarityChip(rarityId) {
  const ra = rarity(rarityId);
  return h('span.chip.chip--rarity', { dataset: { rarity: ra.id } }, ra.symbol, ra.name);
}

/** Element-Chip. */
export function elementChip(elementId) {
  const el = element(elementId);
  return h('span.chip.chip--el', { dataset: { element: el.id } }, el.symbol, el.name);
}

/** Persönlichkeits-Chip. */
export function personalityChip(personalityId) {
  const pers = personality(personalityId);
  return h('span.chip', { title: pers.beschreibung }, pers.symbol, pers.name);
}

/** Varianten-Chip — nur, wenn es keine Standardfarbe ist. */
export function variantChip(variantId) {
  if (!variantId || variantId === 'normal') return null;
  const v = variant(variantId);
  return h('span.chip', { class: v.glanz ? 'shine' : '' }, v.glanz ? '🌟' : '🎨', v.name);
}

/** Erfahrungsbalken mit Beschriftung. */
export function xpBar(pet) {
  return h(
    'div.col',
    { style: { gap: '4px' } },
    h(
      'div.spread.tiny.muted',
      h('span', `Level ${pet.level}`),
      h('span.mono', `${formatNumber(pet.xp)} / ${formatNumber(xpForLevel(pet.level))} EP`)
    ),
    h('div.progress', h('div.progress__fill', { style: { width: `${xpProgress(pet) * 100}%` } }))
  );
}

/**
 * Kompakte Haustierkarte für Listen.
 * @param {object} pet
 * @param {{aktiv?:boolean, favorit?:boolean, onClick?:Function, klein?:boolean}} [options]
 */
export function petCard(pet, options = {}) {
  const art = species(pet.artId);
  const ra = rarity(art.rarity);

  return h(
    'button.pet-card',
    {
      class: options.aktiv ? 'pet-card--active' : '',
      dataset: { rarity: ra.id, element: art.element },
      onclick: options.onClick,
      'aria-label': `${petLabel(pet)}, Level ${pet.level}, ${ra.name}`,
    },
    options.favorit ? h('span.pet-card__fav', { 'aria-label': 'Liebling' }, '⭐') : null,
    h(
      'div.pet-card__art',
      createSprite(
        { artId: pet.artId, variante: pet.variante, outfit: pet.outfit, stimmung: petMood(pet) },
        { animiert: !options.klein, schatten: false }
      )
    ),
    h('div.pet-card__name', petLabel(pet), pet.variante === 'schimmernd' ? h('span', { title: 'Schimmernd' }, '🌟') : null),
    h(
      'div.pet-card__meta',
      h('span', `Lv. ${pet.level}`),
      h('span', { style: { color: ra.farbe } }, ra.symbol),
      h('span', element(art.element).symbol)
    ),
    options.fortschritt !== false
      ? h('div.progress', h('div.progress__fill', { style: { width: `${xpProgress(pet) * 100}%` } }))
      : null
  );
}

/** Großes Sprite für die Bühne. */
export function stageSprite(pet, klasse = 'sprite--stage') {
  return createSprite(
    { artId: pet.artId, variante: pet.variante, outfit: pet.outfit, stimmung: petMood(pet) },
    { klasse, animiert: true }
  );
}
