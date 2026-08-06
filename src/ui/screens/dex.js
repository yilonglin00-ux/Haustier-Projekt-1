/**
 * dex.js — Das Haustierbuch.
 *
 * Zeigt alle Arten des Spiels. Unentdeckte bleiben Geheimnisse: Silhouette,
 * Fragezeichen, kein Name — aber sichtbar, damit man weiß, dass da noch etwas
 * ist. Genau das hält die Sammlung spannend.
 */

import { h, formatNumber } from '../../core/util.js';
import { getState } from '../../core/state.js';
import { SPECIES, species, lineSpecies, speciesCount } from '../../data/species.js';
import { RARITY_ORDER, RARITIES, rarity } from '../../data/rarity.js';
import { ELEMENT_ORDER, ELEMENTS, element } from '../../data/elements.js';
import { createSprite } from '../../render/petSprite.js';
import { hasCustomArt } from '../../render/art/index.js';
import { conditionText } from '../../systems/evolution.js';
import { registerScreen, refresh } from '../router.js';
import { openModal } from '../components/modal.js';
import { rarityChip, elementChip } from '../components/petBits.js';

let filterSeltenheit = 'alle';
let filterElement = 'alle';
let suche = '';

function render(params = {}) {
  const state = getState();
  const entdeckt = Object.values(state.buch).filter((e) => e.gefangen).length;
  const gesamt = speciesCount();

  const liste = SPECIES.filter((art) => {
    if (filterSeltenheit !== 'alle' && art.rarity !== filterSeltenheit) return false;
    if (filterElement !== 'alle' && art.element !== filterElement) return false;
    if (suche) {
      const gefunden = state.buch[art.id]?.gefangen;
      const text = gefunden ? art.name.toLowerCase() : '';
      if (!text.includes(suche.toLowerCase())) return false;
    }
    return true;
  });

  // Direkt eine Art öffnen (z. B. vom Zuhause-Bildschirm aus).
  if (params.artId) {
    setTimeout(() => openSpecies(params.artId), 0);
  }

  return h(
    'div.col',
    h(
      'div.screen__head',
      h('div.screen__title', h('h1', '📔 Haustierbuch')),
      h('span.chip', `${entdeckt} / ${gesamt} entdeckt`)
    ),

    h('div.progress', h('div.progress__fill', { style: { width: `${(entdeckt / gesamt) * 100}%` } })),

    h(
      'div.card',
      { style: { padding: '.75rem' } },
      h(
        'div.col',
        h(
          'input.input',
          {
            type: 'search',
            placeholder: 'Entdeckte Haustiere suchen …',
            value: suche,
            oninput: (event) => {
              suche = event.target.value;
              refresh();
            },
          }
        ),
        h(
          'div.tabs',
          filterButton('alle', 'Alle', 'seltenheit'),
          RARITY_ORDER.map((id) => filterButton(id, `${RARITIES[id].symbol}`, 'seltenheit', RARITIES[id].name))
        ),
        h(
          'div.tabs',
          filterButton('alle', 'Alle', 'element'),
          ELEMENT_ORDER.map((id) => filterButton(id, ELEMENTS[id].symbol, 'element', ELEMENTS[id].name))
        )
      )
    ),

    h(
      'div.grid.grid--auto',
      liste.map((art) => dexCard(art, state))
    ),
    liste.length === 0 ? h('div.empty', h('div.empty__icon', '🔍'), h('p', 'Nichts gefunden.')) : null,
    rarityStats(state)
  );
}

function filterButton(id, label, art, titel) {
  const aktiv = art === 'seltenheit' ? filterSeltenheit === id : filterElement === id;
  return h(
    'button.tab',
    {
      'aria-selected': aktiv ? 'true' : 'false',
      title: titel || label,
      onclick: () => {
        if (art === 'seltenheit') filterSeltenheit = id;
        else filterElement = id;
        refresh();
      },
    },
    label
  );
}

/** Eine Karte im Buch — entdeckt oder als Geheimnis. */
function dexCard(art, state) {
  const eintrag = state.buch[art.id];
  const entdeckt = Boolean(eintrag?.gefangen);
  const gesehen = Boolean(eintrag?.gesehen);
  const ra = rarity(art.rarity);

  if (!entdeckt) {
    return h(
      'button.pet-card',
      {
        dataset: { rarity: art.rarity },
        style: { opacity: '.65' },
        onclick: () => openSecret(art, gesehen),
        'aria-label': 'Unentdecktes Haustier',
      },
      h(
        'div.pet-card__art',
        h(
          'div.sprite',
          { style: { filter: 'brightness(0) opacity(.4)' } },
          createSprite({ artId: art.id }, { animiert: false, schatten: false, effekte: false })
        )
      ),
      h('div.pet-card__name', gesehen ? '???' : '???'),
      h('div.pet-card__meta', h('span', { style: { color: ra.farbe } }, ra.symbol), h('span.faint', 'Geheimnis'))
    );
  }

  return h(
    'button.pet-card',
    {
      dataset: { rarity: art.rarity, element: art.element },
      onclick: () => openSpecies(art.id),
    },
    h('div.pet-card__art', createSprite({ artId: art.id }, { animiert: false, schatten: false })),
    h('div.pet-card__name', art.name),
    h(
      'div.pet-card__meta',
      h('span', `Stufe ${art.stufe}`),
      h('span', { style: { color: ra.farbe } }, ra.symbol),
      h('span', `${eintrag.anzahl}×`)
    )
  );
}

/** Ausführliche Seite einer entdeckten Art. */
export function openSpecies(artId) {
  const art = species(artId);
  if (!art) return;
  const state = getState();
  const eintrag = state.buch[artId];
  if (!eintrag?.gefangen) {
    openSecret(art, Boolean(eintrag?.gesehen));
    return;
  }

  const linie = lineSpecies(art.linie);

  openModal({
    title: art.name,
    icon: element(art.element).symbol,
    wide: true,
    body: h(
      'div.col',
      h(
        'div.row',
        { style: { alignItems: 'flex-start' } },
        h(
          'div.sprite',
          { style: { width: '160px', height: '160px', flex: 'none' } },
          createSprite({ artId: art.id }, { animiert: true })
        ),
        h(
          'div.col',
          { style: { flex: '1', minWidth: '220px' } },
          h('div.row.row--tight', elementChip(art.element), rarityChip(art.rarity), h('span.chip', `Stufe ${art.stufe}`)),
          h('p', art.text),
          h(
            'div.row.row--tight.tiny.faint',
            h('span', `${eintrag.anzahl}× gefunden`),
            h('span', '·'),
            h('span', hasCustomArt(art.id) ? 'handgezeichnet' : `${rarity(art.rarity).kunst}e Darstellung`)
          )
        )
      ),

      h('div.section-label', 'Hintergrund'),
      h('p.small.muted', art.geschichte),

      h('div.section-label', 'Lebensraum'),
      h('p.small.muted', element(art.element).lebensraum),

      h('div.section-label', 'Entwicklungslinie'),
      h(
        'div.grid.grid--tiles',
        linie.map((stufe) => {
          const bekannt = state.buch[stufe.id]?.gefangen;
          return h(
            'div.tile',
            { class: bekannt ? '' : 'tile--locked', title: bekannt ? stufe.name : 'Noch nicht entdeckt' },
            h(
              'div.sprite',
              { style: { width: '56px', height: '56px', filter: bekannt ? '' : 'brightness(0) opacity(.35)' } },
              createSprite({ artId: stufe.id }, { animiert: false, schatten: false, effekte: false })
            ),
            h('span.tile__label', bekannt ? stufe.name : '???'),
            h('span.tiny.faint', `Stufe ${stufe.stufe}`)
          );
        })
      ),

      art.entwicklung?.length
        ? h(
            'div.col',
            h('div.section-label', 'Bedingungen'),
            art.entwicklung.map((step) =>
              h(
                'div.list-item',
                h('span.list-item__icon', '✨'),
                h(
                  'div.list-item__body',
                  h('div.list-item__title', species(step.zu)?.name || step.zu),
                  h('div.tiny.faint', conditionText(step))
                )
              )
            )
          )
        : null,

      art.bedingung ? h('p.tiny', { style: { color: 'var(--ra-mystisch)' } }, `Geheimnis: ${art.bedingung}`) : null
    ),
  });
}

/** Was man über ein unentdecktes Haustier weiß: fast nichts. */
function openSecret(art, gesehen) {
  const ra = rarity(art.rarity);
  openModal({
    title: 'Unentdeckt',
    icon: '❔',
    body: h(
      'div.col',
      { style: { alignItems: 'center', textAlign: 'center' } },
      h(
        'div.sprite',
        { style: { width: '140px', height: '140px', filter: 'brightness(0) opacity(.35)' } },
        createSprite({ artId: art.id }, { animiert: false, effekte: false })
      ),
      h('p.muted', gesehen ? 'Du hast dieses Wesen schon einmal gesehen — aber noch nie besessen.' : 'Von diesem Wesen weißt du nur, dass es existiert.'),
      h('div.row', { style: { justifyContent: 'center' } }, h('span.chip.chip--rarity', { dataset: { rarity: ra.id } }, ra.symbol, ra.name)),
      art.geheim ? h('p.tiny.faint', 'Ein Geheimnis. Es erscheint nur unter besonderen Umständen.') : null
    ),
  });
}

/** Übersicht: wie viel jeder Seltenheitsstufe schon entdeckt ist. */
function rarityStats(state) {
  return h(
    'div.card',
    h('div.card__title', h('span', '📊'), h('h3', 'Sammlung nach Seltenheit')),
    h(
      'div.col',
      RARITY_ORDER.map((id) => {
        const alle = SPECIES.filter((art) => art.rarity === id);
        const gefunden = alle.filter((art) => state.buch[art.id]?.gefangen).length;
        const anteil = (gefunden / alle.length) * 100;
        return h(
          'div.stat',
          h('span.stat__icon', RARITIES[id].symbol),
          h('div.stat__track', h('div.stat__fill', { style: { width: `${anteil}%`, '--stat-color': RARITIES[id].farbe } })),
          h('span.stat__value', `${gefunden}/${alle.length}`)
        );
      })
    )
  );
}

registerScreen({
  id: 'buch',
  label: 'Buch',
  icon: '📔',
  order: 30,
  // Auf dem Smartphone über „Mehr“ und den Knopf auf dem Zuhause-Bildschirm
  // erreichbar — die Bodenleiste bleibt dadurch übersichtlich.
  primary: false,
  render,
});

export { render as renderDexScreen };
