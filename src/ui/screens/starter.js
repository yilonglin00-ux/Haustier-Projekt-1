/**
 * starter.js — Die erste Entscheidung des Spiels.
 *
 * Drei Starter, jeder mit Element, Persönlichkeitsvorschau und Geschichte.
 * Die Auswahl ist bewusst ausführlich gestaltet: sie ist der erste Eindruck
 * und legt fest, mit wem man die nächsten Stunden verbringt.
 */

import { h, replace } from '../../core/util.js';
import { starterSpecies, species } from '../../data/species.js';
import { element } from '../../data/elements.js';
import { rarity } from '../../data/rarity.js';
import { createSprite } from '../../render/petSprite.js';
import { celebrate } from '../../render/fx.js';
import { createPet, adoptPet, markSeen } from '../../systems/pets.js';
import { update } from '../../core/state.js';
import { addItems } from '../../systems/inventory.js';
import { registerScreen, navigate } from '../router.js';
import { toast } from '../components/toast.js';
import { promptDialog } from '../components/modal.js';
import { rarityChip, elementChip } from '../components/petBits.js';

let gewaehlt = null;

/** Startausrüstung, damit die ersten Aktionen sofort funktionieren. */
const STARTPAKET = [
  { id: 'koernermix', anzahl: 5 },
  { id: 'beere', anzahl: 5 },
  { id: 'wasserflasche', anzahl: 5 },
  { id: 'seife', anzahl: 2 },
  { id: 'heilkraut', anzahl: 2 },
  { id: 'ball', anzahl: 1 },
];

function render() {
  const starters = starterSpecies();
  const detail = h('div.card', { id: 'starter-detail' });

  const auswahl = h(
    'div.grid.grid--wide',
    starters.map((art) => starterCard(art, detail))
  );

  renderDetail(detail, gewaehlt ? species(gewaehlt) : starters[0]);
  if (!gewaehlt) gewaehlt = starters[0].id;

  return h(
    'div.col',
    { style: { gap: '1.25rem' } },
    h(
      'div.center.col',
      { style: { gap: '.4rem', padding: '1rem 0' } },
      h('h1', 'Willkommen im Fabelgarten'),
      h(
        'p.muted',
        { style: { maxWidth: '48ch', margin: '0 auto' } },
        'Vor dir stehen drei junge Wesen. Eines davon wird dich begleiten, wachsen, sich entwickeln — und irgendwann kaum wiederzuerkennen sein. Wähle mit Bedacht. Oder mit dem Bauch.'
      )
    ),
    auswahl,
    detail
  );
}

function starterCard(art, detail) {
  const el = element(art.element);
  return h(
    'button.pet-card',
    {
      dataset: { rarity: art.rarity, element: art.element },
      class: gewaehlt === art.id ? 'pet-card--active' : '',
      onclick: () => {
        gewaehlt = art.id;
        markSeen(art.id);
        renderDetail(detail, art);
        document.querySelectorAll('.pet-card').forEach((node) => node.classList.remove('pet-card--active'));
        document.querySelectorAll(`[data-element="${art.element}"]`).forEach((node) => {
          if (node.classList.contains('pet-card')) node.classList.add('pet-card--active');
        });
      },
    },
    h(
      'div.pet-card__art',
      { style: { height: '132px' } },
      createSprite({ artId: art.id }, { animiert: true, schatten: false })
    ),
    h('div.pet-card__name', { style: { fontSize: '1.05rem', justifyContent: 'center' } }, art.name),
    h('div.row', { style: { justifyContent: 'center' } }, elementChip(art.element), rarityChip(art.rarity)),
    h('p.tiny.muted.center', el.lebensraum)
  );
}

function renderDetail(host, art) {
  const linie = art.entwicklung.map((step) => species(step.zu)).filter(Boolean);

  replace(
    host,
    h(
      'div.col',
      h(
        'div.spread',
        h('h2', art.name),
        h('div.row.row--tight', elementChip(art.element), rarityChip(art.rarity))
      ),
      h('p', art.text),
      h('p.small.muted', art.geschichte),
      h('div.section-label', 'Mögliche Entwicklung'),
      h(
        'div.row',
        h('span.chip', `Stufe 1 · ${art.name}`),
        linie.length ? h('span.faint', '→') : null,
        linie.map((next) => h('span.chip', `Stufe ${next.stufe} · ${next.name}`)),
        h('span.chip.faint', '→ …')
      ),
      h(
        'p.tiny.faint',
        'Wohin sich dein Haustier entwickelt, hängt später von Zuneigung, Glück, Tageszeit und deiner Pflege ab — nicht nur vom Level.'
      ),
      h(
        'button.btn.btn--primary.btn--block',
        { style: { marginTop: '.5rem' }, onclick: () => chooseStarter(art) },
        `${art.name} wählen`
      )
    )
  );
}

async function chooseStarter(art) {
  const pet = createPet(art.id, { level: 1 });
  const name = await promptDialog({
    title: 'Wie soll dein Begleiter heißen?',
    label: `Name (leer lassen für „${art.name}")`,
    value: art.name,
    placeholder: art.name,
  });

  if (name && name !== art.name) {
    pet.name = name.slice(0, 16);
    pet.umbenannt = true;
  }

  adoptPet(pet, 'start');
  addItems(STARTPAKET);

  update((s) => {
    s.flags.starterGewaehlt = true;
    s.aktivesHaustier = pet.id;
  });

  celebrate(1.2);
  toast(`${pet.name} schließt sich dir an!`, { icon: '🎉', type: 'rare', duration: 3600 });
  navigate('zuhause');
}

registerScreen({
  id: 'starter',
  label: 'Start',
  icon: '🌱',
  order: 1,
  hidden: true,
  live: false,
  render,
});

export { render as renderStarterScreen };
