/**
 * collect.js — Sammelspiel.
 *
 * 30 Sekunden lang fällt Futter vom Himmel — und gelegentlich etwas, das man
 * lieber nicht fängt. Der Korb folgt Maus, Finger oder Pfeiltasten.
 */

import { h } from '../../core/util.js';
import { randFloat, randInt, chance } from '../../core/rng.js';

const DAUER = 30000;

const GUT = ['🍎', '🍖', '🫐', '💧', '🍯', '🌾'];
const SCHLECHT = ['🪨', '🥀', '💣'];
const BONUS = ['💎', '⭐'];

export function createCollectGame(onEnd) {
  const canvas = h('canvas', {
    width: 640,
    height: 380,
    style: { width: '100%', borderRadius: 'var(--r-lg)', touchAction: 'none', cursor: 'none' },
  });
  const info = h('p.muted.center', 'Fange Gutes, weiche Steinen aus.');
  const host = h('div.col', h('h2.center', '🧺 Sammelspiel'), info, canvas);

  const ctx = canvas.getContext('2d');
  const korb = { x: canvas.width / 2, breite: 88 };
  let objekte = [];
  let punkte = 0;
  let verfehlt = 0;
  let laeuft = true;
  let rafId = null;
  let start = performance.now();
  let spawnTimer = 0;
  const tasten = { links: false, rechts: false };

  function positionAus(event) {
    const box = canvas.getBoundingClientRect();
    const relativ = (event.clientX - box.left) / box.width;
    korb.x = Math.max(korb.breite / 2, Math.min(canvas.width - korb.breite / 2, relativ * canvas.width));
  }

  canvas.addEventListener('pointermove', positionAus);
  canvas.addEventListener('pointerdown', positionAus);

  const onKeyDown = (event) => {
    if (event.code === 'ArrowLeft') tasten.links = true;
    if (event.code === 'ArrowRight') tasten.rechts = true;
  };
  const onKeyUp = (event) => {
    if (event.code === 'ArrowLeft') tasten.links = false;
    if (event.code === 'ArrowRight') tasten.rechts = false;
  };
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);

  function schleife(jetzt) {
    if (!laeuft) return;
    const rest = DAUER - (jetzt - start);
    if (rest <= 0) {
      beenden();
      return;
    }

    if (tasten.links) korb.x = Math.max(korb.breite / 2, korb.x - 9);
    if (tasten.rechts) korb.x = Math.min(canvas.width - korb.breite / 2, korb.x + 9);

    // Neue Objekte
    spawnTimer -= 1;
    if (spawnTimer <= 0) {
      const typ = chance(0.06) ? 'bonus' : chance(0.22) ? 'schlecht' : 'gut';
      const symbol =
        typ === 'bonus' ? BONUS[randInt(0, BONUS.length - 1)]
        : typ === 'schlecht' ? SCHLECHT[randInt(0, SCHLECHT.length - 1)]
        : GUT[randInt(0, GUT.length - 1)];
      objekte.push({
        x: randFloat(30, canvas.width - 30),
        y: -20,
        vy: randFloat(2.4, 4.6),
        symbol,
        typ,
      });
      spawnTimer = randInt(18, 34);
    }

    // Bewegen und einsammeln
    for (const objekt of objekte) {
      objekt.y += objekt.vy;
      const imKorb =
        objekt.y > canvas.height - 54 &&
        objekt.y < canvas.height - 18 &&
        Math.abs(objekt.x - korb.x) < korb.breite / 2;

      if (imKorb && !objekt.weg) {
        objekt.weg = true;
        if (objekt.typ === 'gut') punkte += 3;
        else if (objekt.typ === 'bonus') punkte += 12;
        else punkte = Math.max(0, punkte - 6);
      } else if (objekt.y > canvas.height + 20 && !objekt.weg) {
        objekt.weg = true;
        if (objekt.typ === 'gut') verfehlt += 1;
      }
    }
    objekte = objekte.filter((objekt) => !objekt.weg && objekt.y < canvas.height + 30);

    zeichne(rest);
    rafId = requestAnimationFrame(schleife);
  }

  function zeichne(rest) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Objekte
    ctx.font = '30px system-ui, sans-serif';
    ctx.textAlign = 'center';
    for (const objekt of objekte) {
      ctx.fillText(objekt.symbol, objekt.x, objekt.y);
    }

    // Korb
    ctx.font = '46px system-ui, sans-serif';
    ctx.fillText('🧺', korb.x, canvas.height - 12);

    // Anzeige
    ctx.textAlign = 'left';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    ctx.fillText(`${punkte} Punkte`, 16, 30);
    ctx.textAlign = 'right';
    ctx.fillText(`${(rest / 1000).toFixed(1)} s`, canvas.width - 16, 30);
  }

  function beenden() {
    if (!laeuft) return;
    laeuft = false;
    cancelAnimationFrame(rafId);
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
    onEnd({ punkte, gewonnen: punkte >= 60, detail: `${punkte} Punkte, ${verfehlt} verpasst` });
  }

  host.abbrechen = () => {
    laeuft = false;
    cancelAnimationFrame(rafId);
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
  };

  rafId = requestAnimationFrame(schleife);
  return host;
}
