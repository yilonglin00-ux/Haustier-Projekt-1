/**
 * settings.js — Einstellungen, Statistiken und Spielstand-Verwaltung.
 *
 * Hier liegt alles, was nicht zum Spielen selbst gehört, aber Vertrauen
 * schafft: Wo liegt mein Fortschritt, wie hole ich ihn heraus, wie fange ich
 * neu an.
 */

import { h, formatNumber, formatDuration } from '../../core/util.js';
import { getState, update } from '../../core/state.js';
import { speciesCount } from '../../data/species.js';
import { achievementCount } from '../../data/achievements.js';
import {
  downloadSave,
  importSaveText,
  resetSave,
  saveForced,
  saveSizeKb,
  lastSaveTime,
  storageAvailable,
} from '../../core/storage.js';
import { applyTheme, applyMotion } from '../app.js';
import { syncMusic, applyVolume, playSound } from '../../audio/audio.js';
import { unlockedCount } from '../../systems/achievements.js';
import { registerScreen, refresh, navigate } from '../router.js';
import { toast } from '../components/toast.js';
import { confirmDialog, openModal } from '../components/modal.js';

function render() {
  const state = getState();

  return h(
    'div.col',
    h('div.screen__head', h('div.screen__title', h('h1', '⚙️ Einstellungen'))),

    h(
      'div.card',
      h('div.card__title', h('span', '🎨'), h('h3', 'Darstellung')),
      h(
        'div.col',
        h(
          'div.field',
          h('label.field__label', 'Design'),
          h(
            'select.select',
            {
              onchange: (event) => {
                const wert = event.target.value;
                update((s) => {
                  s.einstellungen.theme = wert;
                });
                applyTheme(wert);
                saveForced();
              },
            },
            [
              ['dark', 'Dunkel'],
              ['light', 'Hell'],
              ['system', 'Wie das System'],
            ].map(([id, label]) => h('option', { value: id, selected: state.einstellungen.theme === id }, label))
          )
        ),
        schalter('Animationen', state.einstellungen.bewegung !== 'reduziert', (an) => {
          update((s) => {
            s.einstellungen.bewegung = an ? 'voll' : 'reduziert';
          });
          applyMotion(an ? 'voll' : 'reduziert');
          saveForced();
        }, 'Weniger Bewegung, wenn dir das angenehmer ist.')
      )
    ),

    h(
      'div.card',
      h('div.card__title', h('span', '🔊'), h('h3', 'Ton')),
      h(
        'div.col',
        schalter('Geräusche', state.einstellungen.sound, (an) => {
          update((s) => {
            s.einstellungen.sound = an;
          });
          if (an) playSound('gut');
          saveForced();
        }),
        schalter('Musik', state.einstellungen.musik, (an) => {
          update((s) => {
            s.einstellungen.musik = an;
          });
          syncMusic();
          saveForced();
        }, 'Ruhige Hintergrundmelodie, direkt im Browser erzeugt.'),
        h(
          'div.field',
          h('label.field__label', `Lautstärke: ${Math.round((state.einstellungen.lautstaerke ?? 0.6) * 100)} %`),
          h('input', {
            type: 'range',
            min: '0',
            max: '100',
            value: String(Math.round((state.einstellungen.lautstaerke ?? 0.6) * 100)),
            style: { width: '100%' },
            oninput: (event) => {
              const wert = Number(event.target.value) / 100;
              update((s) => {
                s.einstellungen.lautstaerke = wert;
              }, { silent: true });
              applyVolume();
            },
            onchange: () => {
              saveForced();
              refresh();
            },
          })
        )
      )
    ),

    h(
      'div.card',
      h('div.card__title', h('span', '💾'), h('h3', 'Spielstand')),
      h(
        'div.col',
        h(
          'p.small.muted',
          storageAvailable()
            ? `Dein Fortschritt wird automatisch im Browser gespeichert (${saveSizeKb()} kB). Nichts verlässt dein Gerät.`
            : 'Achtung: Dieser Browser erlaubt kein Speichern. Dein Fortschritt geht beim Schließen verloren.'
        ),
        lastSaveTime()
          ? h('p.tiny.faint', `Zuletzt gespeichert: ${new Date(lastSaveTime()).toLocaleTimeString('de-DE')}`)
          : null,
        schalter('Automatisch speichern', state.einstellungen.autosave, (an) => {
          update((s) => {
            s.einstellungen.autosave = an;
          });
          saveForced();
        }),
        h(
          'div.row',
          h('button.btn.btn--sm', { onclick: () => { saveForced(); toast('Gespeichert.', { icon: '💾', type: 'good' }); refresh(); } }, '💾 Jetzt speichern'),
          h('button.btn.btn--sm', { onclick: exportieren }, '📤 Sicherung herunterladen'),
          h('button.btn.btn--sm', { onclick: importieren }, '📥 Sicherung laden'),
          h('button.btn.btn--sm.btn--danger', { onclick: zuruecksetzen }, '🗑️ Zurücksetzen')
        )
      )
    ),

    statistikKarte(state),

    state.galerie?.length ? galerieKarte(state) : null,

    h(
      'div.card',
      h('div.card__title', h('span', 'ℹ️'), h('h3', 'Über das Spiel')),
      h(
        'div.col',
        h('p.small.muted', 'Fabelgarten läuft vollständig in deinem Browser: kein Server, kein Konto, keine Werbung, keine Echtgeldkäufe.'),
        h('p.tiny.faint', `${speciesCount()} Haustierarten · ${achievementCount()} Erfolge · Spielstand-Version ${state.version}`)
      )
    )
  );
}

/** Ein Umschalter im Einstellungsstil. */
function schalter(label, an, onChange, hinweis = '') {
  return h(
    'button.switch',
    {
      role: 'switch',
      'aria-checked': an ? 'true' : 'false',
      onclick: (event) => {
        const neu = event.currentTarget.getAttribute('aria-checked') !== 'true';
        event.currentTarget.setAttribute('aria-checked', neu ? 'true' : 'false');
        onChange(neu);
      },
    },
    h('span.col', { style: { gap: '2px', alignItems: 'flex-start' } }, h('b', label), hinweis ? h('span.tiny.faint', hinweis) : null),
    h('span.switch__track')
  );
}

function statistikKarte(state) {
  const s = state.statistik;
  const zeilen = [
    ['⏱️ Spielzeit', formatDuration(s.spielzeitMs)],
    ['📅 Tage gespielt', formatNumber(s.tageGespielt)],
    ['🔥 Längste Serie', `${formatNumber(s.besteSerie)} Tage`],
    ['🐾 Haustiere', formatNumber(state.haustiere.length)],
    ['📔 Arten entdeckt', `${Object.values(state.buch).filter((e) => e.gefangen).length} / ${speciesCount()}`],
    ['🏅 Erfolge', `${unlockedCount(state)} / ${achievementCount()}`],
    ['✨ Aktionen', formatNumber(s.aktionenGesamt)],
    ['🥚 Eier geschlüpft', formatNumber(s.eierGeschluepft)],
    ['🦋 Entwicklungen', formatNumber(s.entwicklungen)],
    ['🧭 Expeditionen', formatNumber(s.expeditionen)],
    ['🎮 Minispiele gewonnen', formatNumber(s.minispieleGewonnen)],
    ['🪙 Münzen verdient', formatNumber(s.muenzenGesamt)],
    ['💎 Diamanten verdient', formatNumber(s.diamantenGesamt)],
    ['📸 Fotos', formatNumber(s.fotos)],
  ];

  return h(
    'div.card',
    h('div.card__title', h('span', '📊'), h('h3', 'Statistiken')),
    h(
      'div.grid',
      { style: { gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' } },
      zeilen.map(([label, wert]) =>
        h('div.spread', { style: { padding: '.3rem 0' } }, h('span.small.muted', label), h('b.mono', wert))
      )
    )
  );
}

function galerieKarte(state) {
  return h(
    'div.card',
    h('div.card__title', h('span', '📸'), h('h3', 'Fotoalbum')),
    h(
      'div.row',
      state.galerie.slice(0, 12).map((eintrag) =>
        h(
          'span.chip',
          { title: new Date(eintrag.at).toLocaleString('de-DE') },
          '📷',
          eintrag.name
        )
      )
    ),
    h('p.tiny.faint', 'Die Bilder selbst liegen als Download auf deinem Gerät — hier steht nur, wann du sie gemacht hast.')
  );
}

function exportieren() {
  downloadSave();
  toast('Sicherung heruntergeladen.', { icon: '📤', type: 'good' });
}

function importieren() {
  const input = h('input', { type: 'file', accept: 'application/json,.json', style: { display: 'none' } });
  input.addEventListener('change', async () => {
    const datei = input.files?.[0];
    if (!datei) return;
    const text = await datei.text();
    const ergebnis = importSaveText(text);
    if (ergebnis.ok) {
      toast('Spielstand geladen!', { icon: '📥', type: 'good' });
      navigate('zuhause');
    } else {
      toast(ergebnis.error, { icon: '⚠️', type: 'bad', duration: 5000 });
    }
    input.remove();
  });
  document.body.appendChild(input);
  input.click();
}

async function zuruecksetzen() {
  const sicher = await confirmDialog({
    title: 'Wirklich alles zurücksetzen?',
    message:
      'Alle Haustiere, Gegenstände und Erfolge werden gelöscht. Lade dir vorher eine Sicherung herunter, wenn du zurückwillst.',
    confirmLabel: 'Alles löschen',
    danger: true,
  });
  if (!sicher) return;

  resetSave();
  toast('Neuer Anfang. Viel Freude!', { icon: '🌱', type: 'good' });
  navigate('starter');
}

registerScreen({
  id: 'einstellungen',
  label: 'Einstellungen',
  icon: '⚙️',
  order: 90,
  render,
});

export { render as renderSettingsScreen };
