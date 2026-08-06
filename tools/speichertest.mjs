#!/usr/bin/env node
/**
 * tools/speichertest.mjs — Prüft das Speichersystem ohne Browser.
 *
 * Export, Import, Zurücksetzen, Ablehnen kaputter Dateien und das Ergänzen
 * fehlender Felder in alten Spielständen. Läuft in Node mit einem winzigen
 * LocalStorage-Ersatz:
 *
 *   node tools/speichertest.mjs
 */
class LocalStorageShim {
  constructor(){ this.map = new Map(); }
  getItem(k){ return this.map.has(k) ? this.map.get(k) : null; }
  setItem(k,v){ this.map.set(k, String(v)); }
  removeItem(k){ this.map.delete(k); }
}
globalThis.localStorage = new LocalStorageShim();
globalThis.requestAnimationFrame = (fn) => setTimeout(() => fn(0), 0);
globalThis.Blob = class { constructor(parts){ this.size = parts.join('').length; } };

const hier = new URL('.', import.meta.url).href;
const state = await import(hier + '../src/core/state.js');
const storage = await import(hier + '../src/core/storage.js');
const pets = await import(hier + '../src/systems/pets.js');

const ergebnisse = [];
const pruef = (name, ok, zusatz='') => ergebnisse.push(`${ok ? '✅' : '❌'} ${name}${zusatz ? ' — ' + zusatz : ''}`);

// 1. Frischer Stand + Haustier
state.setState(state.createNewSave());
const pet = pets.createPet('flammkitz');
pet.name = 'Testkitz';
pets.adoptPet(pet, 'test');
state.update((s) => { s.spieler.muenzen = 1234; s.spieler.diamanten = 7; });
pruef('Haustier aufgenommen', state.getState().haustiere.length === 1);

// 2. Speichern
pruef('saveForced schreibt', storage.saveForced() === true);
pruef('Schlüssel belegt', (localStorage.getItem('fabelgarten.save') || '').length > 500);

// 3. Export
const text = storage.exportSaveText();
const geparst = JSON.parse(text);
pruef('Export ist gültiges JSON', geparst.spiel === 'Fabelgarten');
pruef('Export enthält Haustier', geparst.daten.haustiere[0].name === 'Testkitz');

// 4. Zurücksetzen
storage.resetSave();
pruef('Reset leert Haustiere', state.getState().haustiere.length === 0);
pruef('Reset setzt Münzen zurück', state.getState().spieler.muenzen === 250);

// 5. Import
const importiert = storage.importSaveText(text);
pruef('Import meldet Erfolg', importiert.ok === true, importiert.error || '');
pruef('Import stellt Haustier her', state.getState().haustiere[0]?.name === 'Testkitz');
pruef('Import stellt Münzen her', state.getState().spieler.muenzen === 1234);
pruef('Import stellt Diamanten her', state.getState().spieler.diamanten === 7);

// 6. Fehlerfälle
pruef('Kaputtes JSON abgelehnt', storage.importSaveText('{kein json').ok === false);
pruef('Fremde Datei abgelehnt', storage.importSaveText('{"foo":1}').ok === false);
pruef('Neuere Version abgelehnt',
  storage.importSaveText(JSON.stringify({ daten: { version: 99, haustiere: [], spieler: {} } })).ok === false);

// 7. Laden mit fehlenden Feldern (Vorwärtskompatibilität)
localStorage.setItem('fabelgarten.save', JSON.stringify({ version: 1, haustiere: [], spieler: { muenzen: 5 } }));
const geladen = storage.loadSave();
pruef('Alter Stand lädt', geladen.error === null);
pruef('Fehlende Felder ergänzt', typeof geladen.save.einstellungen?.theme === 'string' && Array.isArray(geladen.save.eier));
pruef('Gespeicherte Werte bleiben', geladen.save.spieler.muenzen === 5);

console.log(ergebnisse.join('\n'));
const fehler = ergebnisse.filter((r) => r.startsWith('❌'));
console.log(fehler.length ? `\n❌ ${fehler.length} Prüfung(en) fehlgeschlagen.` : '\n✅ Alle Prüfungen bestanden.');
process.exit(fehler.length ? 1 : 0);
