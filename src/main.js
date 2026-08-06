/**
 * main.js — Einstiegspunkt.
 *
 * Reihenfolge beim Start:
 *   1. Spielstand laden (oder neu anlegen)
 *   2. Systeme an den Spiel-Loop hängen
 *   3. Oberfläche aufbauen und Bildschirme anmelden
 *   4. Abwesenheit nachrechnen, dann den Loop starten
 *
 * Die Bildschirme melden sich beim Import selbst am Router an — deshalb genügt
 * hier der Import, es gibt keine zentrale Liste, die aus dem Takt geraten kann.
 */

import { setState, getState, subscribe, update } from './core/state.js';
import { loadSave, installAutosave } from './core/storage.js';
import { startLoop, catchUp, installDayWatcher, installPlaytimeTracker, onTick } from './core/loop.js';
import { mountApp, applyTheme, applyMotion, installResponsiveNav } from './ui/app.js';
import { navigate } from './ui/router.js';
import { toast } from './ui/components/toast.js';
import { showWelcomeBack } from './ui/components/welcomeBack.js';
import { formatDuration } from './core/util.js';

import { tickPets } from './systems/pets.js';
import { installEggSystem } from './systems/eggs.js';
import { installExpeditionSystem } from './systems/expeditions.js';
import { installQuestSystem } from './systems/quests.js';
import { installAchievementSystem } from './systems/achievements.js';
import { installRareEvents } from './systems/rareEvents.js';
import { installGardenHarvest } from './systems/home.js';
import { installAudio } from './audio/audio.js';

// Bildschirme (melden sich selbst an)
import './ui/screens/starter.js';
import './ui/screens/home.js';
import './ui/screens/team.js';
import './ui/screens/dex.js';
import './ui/screens/bag.js';
import './ui/screens/shop.js';
import './ui/screens/house.js';
import './ui/screens/eggs.js';
import './ui/screens/expedition.js';
import './ui/screens/minigames.js';
import './ui/screens/quests.js';
import './ui/screens/achievements.js';
import './ui/screens/settings.js';

function boot() {
  // 1. Spielstand ---------------------------------------------------------
  const { save, isNew, error } = loadSave();
  setState(save);
  update(
    (s) => {
      s.statistik.sitzungen += 1;
    },
    { silent: true }
  );

  applyTheme(save.einstellungen.theme);
  applyMotion(save.einstellungen.bewegung);

  // 2. Systeme ------------------------------------------------------------
  onTick(tickPets);
  installDayWatcher();
  installPlaytimeTracker();
  installEggSystem();
  installExpeditionSystem();
  installQuestSystem();
  installAchievementSystem();
  installRareEvents();
  installGardenHarvest();
  installAudio();
  installAutosave(subscribe);

  // 3. Oberfläche ---------------------------------------------------------
  mountApp();
  installResponsiveNav();
  navigate(getState().flags.starterGewaehlt ? 'zuhause' : 'starter');

  // 4. Abwesenheit nachrechnen und loslaufen -------------------------------
  const abwesenheit = catchUp();
  startLoop();

  if (error) toast(error, { icon: '⚠️', type: 'bad', duration: 6000 });
  if (isNew) {
    toast('Willkommen im Fabelgarten!', { icon: '🌿', type: 'good' });
  } else if (abwesenheit.elapsedMs > 5 * 60 * 1000) {
    // Gibt es etwas abzuholen, erklärt der Dialog es; sonst genügt ein Hinweis.
    const gezeigt = showWelcomeBack(abwesenheit);
    if (!gezeigt) {
      toast(`Willkommen zurück! Du warst ${formatDuration(abwesenheit.elapsedMs)} weg.`, {
        icon: '👋',
        type: 'good',
        duration: 4000,
      });
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
