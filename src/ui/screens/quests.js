/**
 * quests.js — Tagesaufgaben.
 */

import { h, formatDuration, msUntilMidnight } from '../../core/util.js';
import { getState } from '../../core/state.js';
import { questText, DAILY_BONUS, questTemplate } from '../../data/quests.js';
import {
  ensureTodaysQuests,
  isComplete,
  allComplete,
  claimQuest,
  claimDailyBonus,
  claimableCount,
  rewardText,
} from '../../systems/quests.js';
import { celebrate } from '../../render/fx.js';
import { registerScreen, refresh } from '../router.js';
import { toast } from '../components/toast.js';

function render() {
  ensureTodaysQuests();
  const state = getState();
  const liste = state.aufgaben.liste || [];
  const fertig = allComplete(state);

  return h(
    'div.col',
    h(
      'div.screen__head',
      h('div.screen__title', h('h1', '📋 Tagesaufgaben')),
      h('span.chip', `Neu in ${formatDuration(msUntilMidnight())}`)
    ),

    h(
      'div.col',
      liste.map((quest, index) => questRow(quest, index))
    ),

    h(
      'div.card',
      { class: fertig && !state.aufgaben.bonusAbgeholt ? 'shine' : '' },
      h('div.card__title', h('span', '🎁'), h('h3', 'Tagesbonus')),
      h('p.small.muted', `Alle vier Aufgaben erledigt: ${rewardText(DAILY_BONUS)}`),
      h(
        'button.btn.btn--block',
        {
          class: fertig && !state.aufgaben.bonusAbgeholt ? 'btn--primary' : '',
          disabled: !fertig || state.aufgaben.bonusAbgeholt,
          onclick: () => {
            const ergebnis = claimDailyBonus();
            if (ergebnis.ok) {
              celebrate(1.4);
              toast(`Tagesbonus abgeholt: ${rewardText(DAILY_BONUS)}`, { icon: '🎁', type: 'rare' });
            } else {
              toast(ergebnis.grund, { icon: '🚫', type: 'bad' });
            }
            refresh();
          },
        },
        state.aufgaben.bonusAbgeholt ? '✓ Bereits abgeholt' : fertig ? 'Bonus abholen' : 'Noch nicht bereit'
      )
    ),

    h(
      'p.tiny.faint',
      'Die Aufgaben wechseln jede Nacht um Mitternacht. Fortschritt zählt automatisch mit — du musst nichts eintragen.'
    )
  );
}

function questRow(quest, index) {
  const vorlage = questTemplate(quest.vorlage);
  const fertig = isComplete(quest);
  const anteil = Math.min(100, (quest.fortschritt / quest.ziel) * 100);

  return h(
    'div.list-item',
    { class: quest.abgeholt ? 'list-item--done' : '' },
    h('span.list-item__icon', { 'aria-hidden': 'true' }, vorlage?.icon || '🎯'),
    h(
      'div.list-item__body',
      h('div.list-item__title', questText(quest)),
      h('div.progress', h('div.progress__fill', { style: { width: `${anteil}%` } })),
      h('div.tiny.faint', `${Math.min(Math.floor(quest.fortschritt), quest.ziel)} / ${quest.ziel} · Belohnung: ${rewardText(vorlage.belohnung)}`)
    ),
    h(
      'button.btn.btn--sm',
      {
        class: fertig && !quest.abgeholt ? 'btn--primary' : '',
        disabled: !fertig || quest.abgeholt,
        onclick: () => {
          const ergebnis = claimQuest(index);
          if (ergebnis.ok) {
            toast(`Abgeholt: ${rewardText(ergebnis.belohnung)}`, { icon: '🎁', type: 'good' });
          } else {
            toast(ergebnis.grund, { icon: '🚫', type: 'bad' });
          }
          refresh();
        },
      },
      quest.abgeholt ? '✓' : fertig ? 'Abholen' : '…'
    )
  );
}

registerScreen({
  id: 'aufgaben',
  label: 'Aufgaben',
  icon: '📋',
  order: 80,
  render,
  badge: () => claimableCount() || null,
});

export { render as renderQuestScreen };
