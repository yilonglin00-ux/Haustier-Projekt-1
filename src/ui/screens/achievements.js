/**
 * achievements.js — Erfolge.
 *
 * Nach Kategorien sortiert, mit Fortschrittsbalken für alles Zählbare.
 * Freigeschaltete Erfolge zeigen ihr Datum — eine kleine Chronik des Spiels.
 */

import { h, formatNumber } from '../../core/util.js';
import { getState } from '../../core/state.js';
import { ACHIEVEMENTS, ACHIEVEMENT_CATEGORIES, achievementCount } from '../../data/achievements.js';
import { achievementProgress, unlockedCount } from '../../systems/achievements.js';
import { registerScreen, refresh } from '../router.js';

let kategorie = 'alle';

function render() {
  const state = getState();
  const frei = unlockedCount(state);
  const gesamt = achievementCount();

  const liste = ACHIEVEMENTS.filter((entry) => kategorie === 'alle' || entry.kategorie === kategorie);

  return h(
    'div.col',
    h(
      'div.screen__head',
      h('div.screen__title', h('h1', '🏅 Erfolge')),
      h('span.chip', `${frei} / ${gesamt}`)
    ),
    h('div.progress', h('div.progress__fill', { style: { width: `${(frei / gesamt) * 100}%` } })),

    h(
      'div.tabs',
      ['alle', ...ACHIEVEMENT_CATEGORIES].map((id) =>
        h(
          'button.tab',
          {
            'aria-selected': id === kategorie ? 'true' : 'false',
            onclick: () => {
              kategorie = id;
              refresh();
            },
          },
          id === 'alle' ? 'Alle' : id
        )
      )
    ),

    h(
      'div.col',
      liste.map((entry) => achievementRow(entry, state))
    )
  );
}

function achievementRow(entry, state) {
  const zeitpunkt = state.erfolge[entry.id];
  const frei = Boolean(zeitpunkt);
  const fortschritt = frei ? null : achievementProgress(entry.id);

  return h(
    'div.list-item',
    { class: frei ? 'list-item--done' : '' },
    h('span.list-item__icon', { 'aria-hidden': 'true', style: frei ? null : { filter: 'grayscale(1)', opacity: '.6' } }, entry.icon),
    h(
      'div.list-item__body',
      h('div.list-item__title', entry.name),
      h('div.tiny.muted', entry.text),
      fortschritt
        ? h(
            'div.col',
            { style: { gap: '2px', marginTop: '4px' } },
            h(
              'div.progress',
              h('div.progress__fill', {
                style: { width: `${Math.min(100, (fortschritt[0] / fortschritt[1]) * 100)}%` },
              })
            ),
            h('div.tiny.faint.mono', `${formatNumber(Math.min(fortschritt[0], fortschritt[1]))} / ${formatNumber(fortschritt[1])}`)
          )
        : null,
      frei
        ? h('div.tiny.faint', `Freigeschaltet am ${new Date(zeitpunkt).toLocaleDateString('de-DE')}`)
        : null
    ),
    h(
      'div.col',
      { style: { alignItems: 'flex-end', gap: '2px' } },
      entry.belohnung?.muenzen ? h('span.tiny.mono', `🪙 ${formatNumber(entry.belohnung.muenzen)}`) : null,
      entry.belohnung?.diamanten ? h('span.tiny.mono', `💎 ${entry.belohnung.diamanten}`) : null,
      frei ? h('span', '✓') : null
    )
  );
}

registerScreen({
  id: 'erfolge',
  label: 'Erfolge',
  icon: '🏅',
  order: 85,
  render,
});

export { render as renderAchievementScreen };
