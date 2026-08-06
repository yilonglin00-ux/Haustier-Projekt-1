/**
 * main.js — Einstiegspunkt.
 *
 * Reihenfolge beim Start:
 *   1. Spielstand laden (oder neu anlegen)
 *   2. Systeme an den Spiel-Loop hängen
 *   3. Oberfläche aufbauen und Bildschirme anmelden
 *   4. Abwesenheit nachrechnen, dann den Loop starten
 */

import { setState, getState, subscribe, update } from './core/state.js';
import { loadSave, installAutosave } from './core/storage.js';
import { startLoop, catchUp, installDayWatcher, installPlaytimeTracker } from './core/loop.js';
import { mountApp, applyTheme, applyMotion, installResponsiveNav } from './ui/app.js';
import { navigate, registerScreen } from './ui/router.js';
import { toast } from './ui/components/toast.js';
import { h } from './core/util.js';

function boot() {
  // 1. Spielstand ---------------------------------------------------------
  const { save, isNew, error } = loadSave();
  setState(save);
  update((s) => {
    s.statistik.sitzungen += 1;
  }, { silent: true });

  applyTheme(save.einstellungen.theme);
  applyMotion(save.einstellungen.bewegung);

  // 2. Systeme ------------------------------------------------------------
  installDayWatcher();
  installPlaytimeTracker();
  installAutosave(subscribe);

  // 3. Oberfläche ---------------------------------------------------------
  registerPlaceholderScreen();
  mountApp();
  installResponsiveNav();

  navigate(getState().flags.starterGewaehlt ? 'zuhause' : 'zuhause');

  // 4. Abwesenheit + Loop -------------------------------------------------
  catchUp();
  startLoop();

  if (error) toast(error, { icon: '⚠️', type: 'bad', duration: 5000 });
  if (isNew) toast('Willkommen im Fabelgarten!', { icon: '🌿', type: 'good' });
}

/** Vorläufiger Bildschirm — wird in den folgenden Ausbaustufen ersetzt. */
function registerPlaceholderScreen() {
  registerScreen({
    id: 'zuhause',
    label: 'Zuhause',
    icon: '🏡',
    order: 10,
    primary: true,
    render: () =>
      h(
        'div.card',
        h('h1', 'Fabelgarten'),
        h('p.muted', 'Das Fundament steht. Die Spielinhalte folgen.')
      ),
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
