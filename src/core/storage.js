/**
 * storage.js — Spielstand sichern, laden, sichern lassen (Backup) und zurücksetzen.
 *
 * Es gibt genau einen LocalStorage-Schlüssel. Beim Laden wird der gespeicherte
 * Stand über einen frischen Standard-Spielstand gelegt: dadurch tauchen neue
 * Felder späterer Spielversionen automatisch mit sinnvollen Werten auf, ohne
 * dass alte Spielstände kaputtgehen.
 */

import { createNewSave, SAVE_VERSION, getState, setState } from './state.js';
import { debounce, dayKey } from './util.js';

export const SAVE_KEY = 'fabelgarten.save';
const BACKUP_KEY = 'fabelgarten.save.backup';

/** Ist LocalStorage überhaupt benutzbar? (Privater Modus, deaktivierte Cookies …) */
export function storageAvailable() {
  try {
    const probe = '__fg_test__';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Laden
// ---------------------------------------------------------------------------

/**
 * Lädt den Spielstand.
 * @returns {{save:object, isNew:boolean, error:string|null}}
 */
export function loadSave() {
  if (!storageAvailable()) {
    return { save: createNewSave(), isNew: true, error: 'Speichern ist in diesem Browser nicht möglich.' };
  }

  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return { save: createNewSave(), isNew: true, error: null };

  try {
    const parsed = JSON.parse(raw);
    return { save: prepare(parsed), isNew: false, error: null };
  } catch (error) {
    console.error('Spielstand konnte nicht gelesen werden:', error);
    // Kaputten Stand nicht wegwerfen — als Notkopie behalten.
    try {
      localStorage.setItem(BACKUP_KEY, raw);
    } catch {
      /* Platz voll — dann eben nicht. */
    }
    return {
      save: createNewSave(),
      isNew: true,
      error: 'Der gespeicherte Fortschritt war beschädigt. Ein neues Spiel wurde gestartet.',
    };
  }
}

/** Migriert und vervollständigt einen geladenen Spielstand. */
function prepare(parsed) {
  const migrated = migrate(parsed);
  return mergeDefaults(createNewSave(), migrated);
}

/**
 * Wandelt ältere Spielstände schrittweise um.
 * Jeder Schritt hebt genau eine Version an — so bleiben die Regeln nachvollziehbar.
 */
function migrate(save) {
  let current = save;
  let version = Number(current.version) || 0;

  // Beispiel für künftige Schritte:
  // if (version < 2) { current = migrateV1toV2(current); version = 2; }

  current.version = Math.max(version, SAVE_VERSION);
  return current;
}

/**
 * Legt gespeicherte Werte über die Standardstruktur.
 * Objekte werden rekursiv zusammengeführt, Listen komplett übernommen.
 */
function mergeDefaults(defaults, saved) {
  if (!isPlainObject(saved)) return defaults;
  const result = Array.isArray(defaults) ? [] : { ...defaults };

  for (const [key, savedValue] of Object.entries(saved)) {
    const defaultValue = defaults[key];
    if (isPlainObject(defaultValue) && isPlainObject(savedValue)) {
      result[key] = mergeDefaults(defaultValue, savedValue);
    } else if (savedValue !== undefined) {
      result[key] = savedValue;
    }
  }
  return result;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

// ---------------------------------------------------------------------------
// Speichern
// ---------------------------------------------------------------------------

let lastSaveAt = 0;
let saveFailed = false;

/** Schreibt sofort. Wird von `queueSave` und beim Verlassen der Seite genutzt. */
export function saveNow() {
  const state = getState();
  if (!state.einstellungen.autosave && !forceNextSave) return false;
  forceNextSave = false;

  try {
    state.lastSeen = Date.now();
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    lastSaveAt = Date.now();
    saveFailed = false;
    return true;
  } catch (error) {
    // Häufigster Fall: Speicher voll. Galerie ist der größte Brocken.
    console.error('Speichern fehlgeschlagen:', error);
    saveFailed = true;
    return false;
  }
}

let forceNextSave = false;

/** Erzwingt das nächste Speichern, auch wenn Autosave aus ist (z. B. Einstellungswechsel). */
export function saveForced() {
  forceNextSave = true;
  return saveNow();
}

/** Entprelltes Autosave — wird nach jeder Zustandsänderung angestoßen. */
export const queueSave = debounce(saveNow, 1500);

export function lastSaveTime() {
  return lastSaveAt;
}

export function hasSaveError() {
  return saveFailed;
}

/**
 * Hängt das Autosave an Zustandsänderungen und an das Verlassen der Seite.
 * Wird einmalig beim Start aufgerufen.
 */
export function installAutosave(subscribeFn) {
  subscribeFn(() => queueSave());

  const flush = () => {
    queueSave.cancel();
    saveNow();
  };

  window.addEventListener('pagehide', flush);
  window.addEventListener('beforeunload', flush);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
}

// ---------------------------------------------------------------------------
// Backup: Export / Import / Zurücksetzen
// ---------------------------------------------------------------------------

/** Baut die Backup-Datei als Text. */
export function exportSaveText() {
  const state = getState();
  return JSON.stringify(
    {
      spiel: 'Fabelgarten',
      version: state.version,
      exportiertAm: new Date().toISOString(),
      daten: state,
    },
    null,
    2
  );
}

/** Lädt den Spielstand als `.json`-Datei herunter. */
export function downloadSave() {
  const text = exportSaveText();
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `fabelgarten-${dayKey()}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Übernimmt eine Backup-Datei.
 * @param {string} text Dateiinhalt
 * @returns {{ok:boolean, error?:string}}
 */
export function importSaveText(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Die Datei ist keine gültige Sicherung (kein lesbares JSON).' };
  }

  const data = parsed && parsed.daten ? parsed.daten : parsed;
  const problem = validateSave(data);
  if (problem) return { ok: false, error: problem };

  // Vor dem Überschreiben eine Notkopie des aktuellen Stands ablegen.
  try {
    localStorage.setItem(BACKUP_KEY, JSON.stringify(getState()));
  } catch {
    /* egal */
  }

  setState(prepare(data));
  saveForced();
  return { ok: true };
}

/** Grobe Plausibilitätsprüfung, damit kein Unsinn den Spielstand zerstört. */
function validateSave(data) {
  if (!isPlainObject(data)) return 'Die Datei enthält keinen Spielstand.';
  if (!Array.isArray(data.haustiere)) return 'Im Spielstand fehlt die Liste der Haustiere.';
  if (!isPlainObject(data.spieler)) return 'Im Spielstand fehlen die Spielerdaten.';
  if (Number(data.version) > SAVE_VERSION) {
    return 'Die Sicherung stammt aus einer neueren Spielversion und kann nicht geladen werden.';
  }
  return null;
}

/** Setzt alles zurück und beginnt von vorn. */
export function resetSave() {
  try {
    localStorage.setItem(BACKUP_KEY, JSON.stringify(getState()));
    localStorage.removeItem(SAVE_KEY);
  } catch {
    /* egal */
  }
  setState(createNewSave());
  saveForced();
}

/** Gibt die Größe des Spielstands in kB zurück (für die Statistik-Anzeige). */
export function saveSizeKb() {
  try {
    const raw = localStorage.getItem(SAVE_KEY) || '';
    return Math.round((new Blob([raw]).size / 1024) * 10) / 10;
  } catch {
    return 0;
  }
}
