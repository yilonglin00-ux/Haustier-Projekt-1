/**
 * team.js — Team und Gehege.
 *
 * Bis zu sechs Haustiere begleiten dich aktiv; alle weiteren leben im Gehege
 * und können jederzeit ins Team wechseln. Hier wird sortiert, umbenannt,
 * zum Liebling erklärt und — wenn es sein muss — freigelassen.
 */

import { h, formatNumber } from '../../core/util.js';
import { getState, teamPets, sanctuaryPets, petById } from '../../core/state.js';
import { species } from '../../data/species.js';
import { OUTFIT_SLOTS, item } from '../../data/items.js';
import {
  petLabel,
  sortPets,
  SORTINGS,
  setActivePet,
  toggleFavorite,
  toggleTeam,
  releasePet,
  renamePet,
  power,
} from '../../systems/pets.js';
import { inventoryList, equipOutfit } from '../../systems/inventory.js';
import { registerScreen, navigate, refresh } from '../router.js';
import { toast } from '../components/toast.js';
import { openModal, closeModal, confirmDialog, promptDialog } from '../components/modal.js';
import {
  petCard,
  needBars,
  feelingBars,
  attributeGrid,
  rarityChip,
  elementChip,
  personalityChip,
  variantChip,
  xpBar,
} from '../components/petBits.js';
import { createSprite } from '../../render/petSprite.js';

let sortierung = 'level';

function render() {
  const state = getState();
  const team = sortPets(teamPets(state), sortierung);
  const gehege = sortPets(sanctuaryPets(state), sortierung);

  return h(
    'div.col',
    h(
      'div.screen__head',
      h('div.screen__title', h('h1', '👥 Team'), h('span.chip', `${team.length}/6`)),
      h(
        'div.row.row--tight',
        h('span.tiny.faint', 'Sortierung'),
        h(
          'select.select',
          {
            style: { width: 'auto' },
            onchange: (event) => {
              sortierung = event.target.value;
              refresh();
            },
          },
          Object.entries(SORTINGS).map(([id, def]) =>
            h('option', { value: id, selected: id === sortierung }, def.name)
          )
        )
      )
    ),

    team.length
      ? h(
          'div.grid.grid--auto',
          team.map((pet) =>
            petCard(pet, {
              aktiv: pet.id === state.aktivesHaustier,
              favorit: pet.id === state.lieblingsHaustier,
              onClick: () => openPetDetail(pet.id),
            })
          )
        )
      : h('div.empty', h('div.empty__icon', '🐾'), h('p', 'Dein Team ist leer.')),

    h('h2', { style: { marginTop: '1rem' } }, `🌾 Gehege (${gehege.length})`),
    h(
      'p.small.muted',
      'Hier warten alle Haustiere, die gerade nicht im Team sind. Sie werden nicht hungrig — der Garten versorgt sie.'
    ),
    gehege.length
      ? h(
          'div.grid.grid--auto',
          gehege.map((pet) => petCard(pet, { onClick: () => openPetDetail(pet.id), klein: true }))
        )
      : h('div.empty', h('div.empty__icon', '🌱'), h('p', 'Noch keine Haustiere im Gehege.'))
  );
}

/** Ausführliche Ansicht eines Haustiers mit allen Aktionen. */
export function openPetDetail(petId) {
  const pet = petById(petId);
  if (!pet) return;
  const state = getState();
  const art = species(pet.artId);
  const imTeam = state.team.includes(petId);

  openModal({
    title: petLabel(pet),
    icon: '🐾',
    wide: true,
    body: h(
      'div.col',
      h(
        'div.row',
        { style: { alignItems: 'flex-start' } },
        h(
          'div.sprite',
          { style: { width: '150px', height: '150px', flex: 'none' } },
          createSprite({ artId: pet.artId, variante: pet.variante, outfit: pet.outfit })
        ),
        h(
          'div.col',
          { style: { flex: '1', minWidth: '200px' } },
          h('div.row.row--tight', elementChip(art.element), rarityChip(art.rarity), personalityChip(pet.persoenlichkeit), variantChip(pet.variante)),
          xpBar(pet),
          h('p.small.muted', art.text),
          h('div.row.row--tight.tiny.faint', h('span', `Kraft ${formatNumber(power(pet))}`), h('span', '·'), h('span', `${pet.pflegeTage} Pflegetage`), h('span', '·'), h('span', `${pet.gesamtAktionen} Aktionen`))
        )
      ),

      h('div.tabs', { role: 'tablist' }, tabButtons(pet)),
      h('div', { id: 'pet-detail-body' }, needBars(pet)),

      h(
        'div.row',
        h(
          'button.btn.btn--sm',
          { onclick: () => { setActivePet(petId); closeModal(); navigate('zuhause'); } },
          '🏡 Betreuen'
        ),
        h(
          'button.btn.btn--sm',
          {
            onclick: async () => {
              const name = await promptDialog({ title: 'Neuer Name', label: 'Name', value: petLabel(pet) });
              if (name) {
                renamePet(petId, name);
                toast(`Heißt jetzt ${name}.`, { icon: '✏️', type: 'good' });
              }
            },
          },
          '✏️ Umbenennen'
        ),
        h(
          'button.btn.btn--sm',
          {
            onclick: () => {
              toggleFavorite(petId);
              closeModal();
              toast('Liebling aktualisiert.', { icon: '⭐', type: 'good' });
            },
          },
          state.lieblingsHaustier === petId ? '⭐ Liebling entfernen' : '☆ Zum Liebling'
        ),
        h(
          'button.btn.btn--sm',
          {
            onclick: () => {
              const ergebnis = toggleTeam(petId);
              closeModal();
              const texte = {
                aufgenommen: 'Ins Team aufgenommen.',
                entfernt: 'Ins Gehege gebracht.',
                voll: 'Dein Team ist voll (6 Haustiere).',
                letztes: 'Mindestens ein Haustier muss im Team bleiben.',
              };
              toast(texte[ergebnis] || 'Nichts geändert.', {
                icon: '👥',
                type: ergebnis === 'voll' || ergebnis === 'letztes' ? 'bad' : 'good',
              });
            },
          },
          imTeam ? '➡️ Ins Gehege' : '⬅️ Ins Team'
        ),
        h('button.btn.btn--sm', { onclick: () => openWardrobe(petId) }, '👒 Kleidung'),
        h(
          'button.btn.btn--sm.btn--danger',
          {
            onclick: async () => {
              const sicher = await confirmDialog({
                title: `${petLabel(pet)} freilassen?`,
                message:
                  'Das Haustier verlässt dich für immer. Du bekommst Münzen dafür, und der Eintrag im Haustierbuch bleibt erhalten.',
                confirmLabel: 'Freilassen',
                danger: true,
              });
              if (!sicher) return;
              const muenzen = releasePet(petId);
              closeModal();
              toast(`Lebe wohl! (+${muenzen} Münzen)`, { icon: '🕊️', type: 'good' });
            },
          },
          '🕊️ Freilassen'
        )
      )
    ),
  });

  // Reiter erst nach dem Öffnen verdrahten, damit die Knoten existieren.
  setTimeout(() => switchTab(petId, 'beduerfnisse'), 0);
}

function tabButtons(pet) {
  const reiter = [
    ['beduerfnisse', 'Bedürfnisse'],
    ['gefuehle', 'Gefühle'],
    ['attribute', 'Attribute'],
    ['geschichte', 'Geschichte'],
  ];
  return reiter.map(([id, label], index) =>
    h(
      'button.tab',
      {
        role: 'tab',
        'aria-selected': index === 0 ? 'true' : 'false',
        dataset: { tab: id },
        onclick: (event) => {
          event.currentTarget.parentElement.querySelectorAll('.tab').forEach((node) =>
            node.setAttribute('aria-selected', 'false')
          );
          event.currentTarget.setAttribute('aria-selected', 'true');
          switchTab(pet.id, id);
        },
      },
      label
    )
  );
}

function switchTab(petId, tabId) {
  const host = document.getElementById('pet-detail-body');
  const pet = petById(petId);
  if (!host || !pet) return;

  const art = species(pet.artId);
  const inhalt = {
    beduerfnisse: () => needBars(pet),
    gefuehle: () => feelingBars(pet),
    attribute: () => attributeGrid(pet),
    geschichte: () =>
      h('div.col', h('p.small', art.text), h('p.small.muted', art.geschichte)),
  }[tabId];

  host.replaceChildren(inhalt ? inhalt() : h('div'));
}

/** Kleiderschrank: alle besessenen Kleidungsstücke nach Platz sortiert. */
function openWardrobe(petId) {
  const pet = petById(petId);
  const kleidung = inventoryList('kleidung');

  openModal({
    title: `Kleiderschrank — ${petLabel(pet)}`,
    icon: '👒',
    wide: true,
    body: h(
      'div.col',
      h(
        'div.row',
        { style: { justifyContent: 'center' } },
        h(
          'div.sprite',
          { style: { width: '170px', height: '170px' }, id: 'wardrobe-preview' },
          createSprite({ artId: pet.artId, variante: pet.variante, outfit: pet.outfit })
        )
      ),
      kleidung.length
        ? OUTFIT_SLOTS.map((slot) => {
            const passend = kleidung.filter((entry) => entry.slot === slot.id);
            if (!passend.length) return null;
            return h(
              'div.col',
              h('div.section-label', `${slot.icon} ${slot.name}`),
              h(
                'div.grid.grid--tiles',
                passend.map((entry) =>
                  h(
                    'button.tile',
                    {
                      class: pet.outfit?.[slot.id] === entry.id ? 'pet-card--active' : '',
                      onclick: (event) => {
                        const ergebnis = equipOutfit(entry.id, petId);
                        toast(ergebnis.text || ergebnis.grund, { icon: entry.icon, type: ergebnis.ok ? 'good' : 'bad' });
                        // Vorschau neu zeichnen
                        const aktuell = petById(petId);
                        const host = document.getElementById('wardrobe-preview');
                        if (host && aktuell) {
                          host.replaceWith(
                            createSprite(
                              { artId: aktuell.artId, variante: aktuell.variante, outfit: aktuell.outfit },
                              { klasse: '' }
                            )
                          );
                          document.querySelector('.modal .sprite').id = 'wardrobe-preview';
                        }
                        event.currentTarget.parentElement
                          .querySelectorAll('.tile')
                          .forEach((node) => node.classList.remove('pet-card--active'));
                        if (ergebnis.getragen) event.currentTarget.classList.add('pet-card--active');
                      },
                    },
                    h('span.tile__icon', { 'aria-hidden': 'true' }, entry.icon),
                    h('span.tile__label', entry.name)
                  )
                )
              )
            );
          })
        : h(
            'div.empty',
            h('div.empty__icon', '👗'),
            h('p', 'Du besitzt noch keine Kleidung. Im Laden gibt es Hüte, Brillen, Schals, Umhänge und Rüstungen.')
          )
    ),
  });
}

registerScreen({
  id: 'team',
  label: 'Team',
  icon: '👥',
  order: 20,
  primary: true,
  render,
});

export { render as renderTeamScreen };
