/**
 * audio.js — Klang ohne Audiodateien.
 *
 * Alle Geräusche werden zur Laufzeit mit der WebAudio-API erzeugt. Das hält
 * das Spiel bei einer einzigen HTML-Datei und funktioniert offline.
 * Der Audio-Kontext startet erst nach der ersten Eingabe des Spielers —
 * Browser erlauben es nicht anders, und ungefragter Ton wäre auch unhöflich.
 */

import { getState } from '../core/state.js';
import { on, EVENTS } from '../core/events.js';

let ctx = null;
let masterGain = null;
let musicGain = null;
let musicTimer = null;
let musicStep = 0;

/** Tonleiter für die Hintergrundmusik (pentatonisch — klingt immer freundlich). */
const SKALA = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25];

function ensureContext() {
  if (ctx) return ctx;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;

  ctx = new AudioCtx();
  masterGain = ctx.createGain();
  masterGain.gain.value = getState().einstellungen.lautstaerke ?? 0.6;
  masterGain.connect(ctx.destination);

  musicGain = ctx.createGain();
  musicGain.gain.value = 0.16;
  musicGain.connect(masterGain);

  return ctx;
}

/** Aktualisiert die Lautstärke aus den Einstellungen. */
export function applyVolume() {
  if (masterGain) masterGain.gain.value = getState().einstellungen.lautstaerke ?? 0.6;
}

/** Ein einzelner Ton. */
function ton({ frequenz, dauer = 0.16, typ = 'sine', gain = 0.22, verzoegerung = 0, ziel = null, glide = 0 }) {
  const audio = ensureContext();
  if (!audio) return;

  const osc = audio.createOscillator();
  const hüllkurve = audio.createGain();
  const start = audio.currentTime + verzoegerung;

  osc.type = typ;
  osc.frequency.setValueAtTime(frequenz, start);
  if (glide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, frequenz * glide), start + dauer);

  hüllkurve.gain.setValueAtTime(0.0001, start);
  hüllkurve.gain.exponentialRampToValueAtTime(gain, start + 0.012);
  hüllkurve.gain.exponentialRampToValueAtTime(0.0001, start + dauer);

  osc.connect(hüllkurve);
  hüllkurve.connect(ziel || masterGain);
  osc.start(start);
  osc.stop(start + dauer + 0.05);
}

/** Kurzes Rauschen — für Blubbern und Waschen. */
function rauschen(dauer = 0.2, gain = 0.12) {
  const audio = ensureContext();
  if (!audio) return;

  const puffer = audio.createBuffer(1, audio.sampleRate * dauer, audio.sampleRate);
  const daten = puffer.getChannelData(0);
  for (let i = 0; i < daten.length; i += 1) {
    daten[i] = (Math.random() * 2 - 1) * (1 - i / daten.length);
  }

  const quelle = audio.createBufferSource();
  quelle.buffer = puffer;
  const filter = audio.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 900;
  const hüllkurve = audio.createGain();
  hüllkurve.gain.value = gain;

  quelle.connect(filter);
  filter.connect(hüllkurve);
  hüllkurve.connect(masterGain);
  quelle.start();
}

/** Die Klangbibliothek. */
const SOUNDS = {
  klick: () => ton({ frequenz: 620, dauer: 0.07, typ: 'triangle', gain: 0.12 }),
  gut: () => {
    ton({ frequenz: 523, dauer: 0.12, typ: 'triangle' });
    ton({ frequenz: 659, dauer: 0.14, typ: 'triangle', verzoegerung: 0.08 });
  },
  fehler: () => ton({ frequenz: 180, dauer: 0.22, typ: 'sawtooth', gain: 0.16, glide: 0.6 }),
  fuettern: () => {
    ton({ frequenz: 380, dauer: 0.1, typ: 'sine' });
    ton({ frequenz: 300, dauer: 0.12, typ: 'sine', verzoegerung: 0.09 });
  },
  wasser: () => rauschen(0.22, 0.1),
  streicheln: () => ton({ frequenz: 440, dauer: 0.35, typ: 'sine', gain: 0.14, glide: 1.28 }),
  spielen: () => {
    [523, 659, 784].forEach((f, i) => ton({ frequenz: f, dauer: 0.1, typ: 'square', gain: 0.1, verzoegerung: i * 0.07 }));
  },
  muenze: () => {
    ton({ frequenz: 988, dauer: 0.08, typ: 'triangle', gain: 0.16 });
    ton({ frequenz: 1319, dauer: 0.12, typ: 'triangle', gain: 0.13, verzoegerung: 0.06 });
  },
  levelup: () => {
    [523, 659, 784, 1047].forEach((f, i) => ton({ frequenz: f, dauer: 0.18, typ: 'triangle', gain: 0.16, verzoegerung: i * 0.09 }));
  },
  entwicklung: () => {
    [392, 523, 659, 784, 1047, 1319].forEach((f, i) =>
      ton({ frequenz: f, dauer: 0.3, typ: 'sine', gain: 0.16, verzoegerung: i * 0.13 })
    );
  },
  schluepfen: () => {
    ton({ frequenz: 300, dauer: 0.08, typ: 'square', gain: 0.12 });
    ton({ frequenz: 420, dauer: 0.08, typ: 'square', gain: 0.12, verzoegerung: 0.12 });
    ton({ frequenz: 880, dauer: 0.26, typ: 'triangle', gain: 0.16, verzoegerung: 0.28 });
  },
  erfolg: () => {
    [659, 880, 1047].forEach((f, i) => ton({ frequenz: f, dauer: 0.22, typ: 'triangle', gain: 0.15, verzoegerung: i * 0.11 }));
  },
  selten: () => {
    [523, 784, 1047, 1319, 1568].forEach((f, i) =>
      ton({ frequenz: f, dauer: 0.34, typ: 'sine', gain: 0.15, verzoegerung: i * 0.1 })
    );
  },
};

/** Spielt ein Geräusch, sofern Sound eingeschaltet ist. */
export function playSound(name) {
  if (!getState().einstellungen.sound) return;
  SOUNDS[name]?.();
}

// ---------------------------------------------------------------------------
// Hintergrundmusik
// ---------------------------------------------------------------------------

/**
 * Erzeugt eine ruhige, endlose Melodie aus der pentatonischen Skala.
 * Absichtlich schlicht: sie soll im Hintergrund bleiben, nicht auffallen.
 */
export function startMusic() {
  const audio = ensureContext();
  if (!audio || musicTimer) return;

  musicTimer = setInterval(() => {
    if (!getState().einstellungen.musik) return;
    musicStep += 1;

    const grundton = SKALA[(musicStep * 3) % SKALA.length];
    ton({ frequenz: grundton, dauer: 1.4, typ: 'sine', gain: 0.1, ziel: musicGain });

    if (musicStep % 2 === 0) {
      ton({ frequenz: grundton / 2, dauer: 1.8, typ: 'triangle', gain: 0.07, ziel: musicGain });
    }
    if (musicStep % 4 === 1) {
      ton({ frequenz: SKALA[(musicStep * 5) % SKALA.length] * 2, dauer: 0.8, typ: 'sine', gain: 0.05, ziel: musicGain });
    }
  }, 900);
}

export function stopMusic() {
  clearInterval(musicTimer);
  musicTimer = null;
}

/** Schaltet die Musik entsprechend der Einstellung. */
export function syncMusic() {
  if (getState().einstellungen.musik) startMusic();
  else stopMusic();
}

// ---------------------------------------------------------------------------
// Anbindung
// ---------------------------------------------------------------------------

/** Verbindet Spielereignisse mit Klängen. */
export function installAudio() {
  // Audio darf erst nach einer Eingabe starten.
  const wecken = () => {
    ensureContext();
    if (ctx?.state === 'suspended') ctx.resume();
    syncMusic();
    document.removeEventListener('pointerdown', wecken);
    document.removeEventListener('keydown', wecken);
  };
  document.addEventListener('pointerdown', wecken);
  document.addEventListener('keydown', wecken);

  const AKTION_KLANG = {
    fuettern: 'fuettern',
    traenken: 'wasser',
    streicheln: 'streicheln',
    spielen: 'spielen',
    training: 'gut',
    baden: 'wasser',
    spazieren: 'gut',
    schlafen: 'streicheln',
    medizin: 'gut',
  };

  on(EVENTS.PET_ACTION, ({ actionId }) => playSound(AKTION_KLANG[actionId] || 'klick'));
  on(EVENTS.PET_LEVEL_UP, () => playSound('levelup'));
  on(EVENTS.PET_EVOLVED, () => playSound('entwicklung'));
  on(EVENTS.EGG_HATCHED, () => playSound('schluepfen'));
  on(EVENTS.ACHIEVEMENT_UNLOCKED, () => playSound('erfolg'));
  on(EVENTS.RARE_EVENT, () => playSound('selten'));
  on(EVENTS.COINS_CHANGED, ({ delta }) => {
    if (delta > 40) playSound('muenze');
  });
}
