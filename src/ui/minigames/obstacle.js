/**
 * obstacle.js — Hindernislauf.
 *
 * Ein Knopf, ein Sprung. Das Haustier läuft, die Hindernisse kommen schneller.
 * Läuft auf Canvas, damit es auch auf schwächeren Geräten flüssig bleibt.
 */

import { h } from '../../core/util.js';
import { activePet } from '../../core/state.js';
import { species } from '../../data/species.js';
import { element } from '../../data/elements.js';
import { randFloat } from '../../core/rng.js';

const BODEN = 150;
const SCHWERKRAFT = 0.9;
const SPRUNGKRAFT = -15;

export function createObstacleGame(onEnd) {
  const canvas = h('canvas', { width: 640, height: 220, style: { width: '100%', borderRadius: 'var(--r-lg)', touchAction: 'none' } });
  const info = h('p.muted.center', 'Tippen oder Leertaste zum Springen.');
  const host = h('div.col', h('h2.center', '🏃 Hindernislauf'), info, canvas);

  const ctx = canvas.getContext('2d');
  const pet = activePet();
  const art = pet ? species(pet.artId) : null;
  const farbe = art ? element(art.element).farbe : '#7c8cff';

  const spieler = { x: 70, y: BODEN, vy: 0, r: 18, amBoden: true };
  let hindernisse = [];
  let tempo = 5;
  let punkte = 0;
  let laeuft = true;
  let rafId = null;
  let naechstesHindernis = 60;

  function springen() {
    if (!laeuft) return;
    if (spieler.amBoden) {
      spieler.vy = SPRUNGKRAFT;
      spieler.amBoden = false;
    }
  }

  canvas.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    springen();
  });

  const onKey = (event) => {
    if (event.code === 'Space' || event.code === 'ArrowUp') {
      event.preventDefault();
      springen();
    }
  };
  document.addEventListener('keydown', onKey);

  function schleife() {
    if (!laeuft) return;

    // Spieler
    spieler.vy += SCHWERKRAFT;
    spieler.y += spieler.vy;
    if (spieler.y >= BODEN) {
      spieler.y = BODEN;
      spieler.vy = 0;
      spieler.amBoden = true;
    }

    // Hindernisse
    naechstesHindernis -= 1;
    if (naechstesHindernis <= 0) {
      const hoch = randFloat(24, 46);
      hindernisse.push({ x: canvas.width + 20, w: randFloat(16, 30), h: hoch });
      naechstesHindernis = Math.max(34, 90 - tempo * 3) + randFloat(0, 30);
    }

    hindernisse.forEach((hindernis) => {
      hindernis.x -= tempo;
    });
    hindernisse = hindernisse.filter((hindernis) => hindernis.x + hindernis.w > -10);

    // Treffer?
    for (const hindernis of hindernisse) {
      const nah = spieler.x + spieler.r > hindernis.x && spieler.x - spieler.r < hindernis.x + hindernis.w;
      const tief = spieler.y + spieler.r > BODEN + 18 - hindernis.h;
      if (nah && tief) {
        beenden();
        return;
      }
    }

    punkte += 1;
    tempo = 5 + punkte / 260;

    zeichne();
    rafId = requestAnimationFrame(schleife);
  }

  function zeichne() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Boden
    ctx.fillStyle = 'rgba(255,255,255,.12)';
    ctx.fillRect(0, BODEN + 18, canvas.width, 4);

    // Laufspur
    ctx.fillStyle = 'rgba(255,255,255,.05)';
    for (let x = (-punkte * 2) % 60; x < canvas.width; x += 60) {
      ctx.fillRect(x, BODEN + 26, 26, 3);
    }

    // Spieler
    ctx.fillStyle = farbe;
    ctx.beginPath();
    ctx.arc(spieler.x, spieler.y, spieler.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(spieler.x + 6, spieler.y - 5, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1b1d26';
    ctx.beginPath();
    ctx.arc(spieler.x + 7, spieler.y - 5, 2, 0, Math.PI * 2);
    ctx.fill();

    // Hindernisse
    ctx.fillStyle = '#ff6b7d';
    for (const hindernis of hindernisse) {
      ctx.fillRect(hindernis.x, BODEN + 18 - hindernis.h, hindernis.w, hindernis.h);
    }

    // Punktestand
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillText(`${Math.floor(punkte / 10)}`, 16, 30);
  }

  function beenden() {
    if (!laeuft) return;
    laeuft = false;
    cancelAnimationFrame(rafId);
    document.removeEventListener('keydown', onKey);
    const wert = Math.floor(punkte / 10);
    onEnd({ punkte: wert, gewonnen: wert >= 30, detail: `${wert} Meter` });
  }

  host.abbrechen = () => {
    laeuft = false;
    cancelAnimationFrame(rafId);
    document.removeEventListener('keydown', onKey);
  };

  rafId = requestAnimationFrame(schleife);
  return host;
}
