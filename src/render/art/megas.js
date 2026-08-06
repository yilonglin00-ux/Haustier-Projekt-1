/**
 * megas.js — Handgezeichnete Megaformen der drei Starter.
 *
 * Megaformen sind der Höhepunkt einer Linie. Sie bekommen deshalb je eine
 * eigene Silhouette, mehrschichtige Verläufe und einen eigenen Effekt.
 */

import { P, C, E, G, line, bodyFill, headFill, wingFill, eyes, sheen, star, halo, flameEdge } from './shared.js';

/** Infernopard ✦ Mega — Raubkatze aus lebender Glut mit Hitzeschwingen. */
export function infernopardMega(p, ctx) {
  const kopf = { x: 100, y: 78, r: 30 };
  const rumpf = { x: 100, y: 132, r: 46 };

  const schwingen =
    P('M84 104 q-58 -44 -76 -8 q-8 38 22 54 q28 12 52 -20 z', `class="pet-wing" fill="${wingFill(ctx)}" ${line(p, 2.2)} opacity="0.95"`) +
    P('M116 104 q58 -44 76 -8 q8 38 -22 54 q-28 12 -52 -20 z', `class="pet-wing" fill="${wingFill(ctx)}" ${line(p, 2.2)} opacity="0.95"`) +
    P('M74 112 q-26 -12 -44 -2 M78 126 q-24 -4 -40 8 M126 112 q26 -12 44 -2 M122 126 q24 -4 40 8',
      `stroke="${p.tief}" stroke-width="1.6" fill="none" opacity="0.4"`);

  const schweif =
    P('M140 148 q34 -6 40 -34 q16 30 -8 52 q-20 20 -38 2 q-10 -14 6 -20 z', `class="pet-tail" fill="${p.akzent}" ${line(p)}`) +
    P('M150 142 q20 -4 24 -22 q8 18 -6 32 q-14 10 -20 -4 z', `class="pet-tail" fill="${p.licht}" opacity="0.85"`);

  const beine =
    P('M70 154 q-12 16 -6 30 h18 q-8 -14 0 -28 z', `fill="${p.schatten}" ${line(p)}`) +
    P('M130 154 q12 16 6 30 h-18 q8 -14 0 -28 z', `fill="${p.schatten}" ${line(p)}`) +
    P('M84 160 q-8 14 -4 24 h14 q-6 -12 0 -22 z', `fill="${p.tief}" opacity="0.75"`);

  const koerper =
    P('M100 92 c34 0 50 26 50 54 c0 30 -20 50 -50 50 c-30 0 -50 -20 -50 -50 c0 -28 16 -54 50 -54 z',
      `fill="${bodyFill(ctx)}" ${line(p, 2.4)}`) +
    P('M100 116 c18 0 26 16 26 32 c0 18 -10 30 -26 30 c-16 0 -26 -12 -26 -30 c0 -16 8 -32 26 -32 z',
      `fill="${p.bauch}" opacity="0.9"`);

  const maehne = flameEdge(kopf.x, kopf.y + 6, kopf.r + 6, p, 11);

  const kopfTeil =
    C(kopf.x, kopf.y, kopf.r, `fill="${headFill(ctx)}" ${line(p, 2.2)}`) +
    sheen(kopf.x - 10, kopf.y - 12, 13, 9, p, 0.4) +
    P('M78 58 l-8 -26 l24 14 z', `class="pet-ear" fill="${p.akzent}" ${line(p)}`) +
    P('M122 58 l8 -26 l-24 14 z', `class="pet-ear" fill="${p.akzent}" ${line(p)}`) +
    P('M100 46 l-6 -20 l6 -12 l6 12 z', `fill="${p.licht}" ${line(p, 1.6)}`);

  const gesicht =
    eyes(kopf.x, kopf.y + 2, 13, p, { rx: 8, ry: 9 }) +
    P('M92 96 q8 8 16 0', `stroke="${p.pupille}" stroke-width="2.4" fill="none"`) +
    P('M88 88 l-10 -4 M112 88 l10 -4', `stroke="${p.umriss}" stroke-width="1.8" opacity="0.6"`);

  const glut =
    P('M76 138 q10 -14 22 -4 M112 148 q10 -12 20 -2', `stroke="${p.licht}" stroke-width="2.6" fill="none" opacity="0.55"`) +
    halo(rumpf.x, rumpf.y - 10, rumpf.r + 26, 6, p, 2.6);

  return {
    hinten: schwingen + schweif + beine,
    koerper,
    vorne: maehne + kopfTeil + gesicht + glut,
    kopf,
    rumpf,
    ruecken: { x: 100, y: 104 },
  };
}

/** Fluttitan ✦ Mega — Panzerkoloss mit stehenden Wasserringen. */
export function fluttitanMega(p, ctx) {
  const kopf = { x: 100, y: 76, r: 29 };
  const rumpf = { x: 100, y: 134, r: 48 };

  const ringe = G(
    'pet-orbit',
    E(rumpf.x, rumpf.y - 6, 74, 20, `fill="none" stroke="${p.glanz}" stroke-width="4" opacity="0.6"`) +
      E(rumpf.x, rumpf.y - 6, 60, 14, `fill="none" stroke="${p.licht}" stroke-width="2.4" opacity="0.5"`) +
      C(rumpf.x + 74, rumpf.y - 6, 4, `fill="${p.licht}"`) +
      C(rumpf.x - 62, rumpf.y - 2, 3, `fill="${p.glanz}"`)
  );

  const flossen =
    P('M54 118 q-32 -16 -38 8 q6 30 38 18 z', `class="pet-wing" fill="${wingFill(ctx)}" ${line(p)}`) +
    P('M146 118 q32 -16 38 8 q-6 30 -38 18 z', `class="pet-wing" fill="${wingFill(ctx)}" ${line(p)}`);

  const schweif = P('M142 152 q34 -14 42 -38 q12 34 -14 56 q-24 16 -36 -6 z',
    `class="pet-tail" fill="${p.akzent}" ${line(p)}`);

  const beine =
    P('M70 158 q-14 14 -8 28 h20 q-8 -12 -2 -26 z', `fill="${p.schatten}" ${line(p)}`) +
    P('M130 158 q14 14 8 28 h-20 q8 -12 2 -26 z', `fill="${p.schatten}" ${line(p)}`);

  const koerper =
    P('M100 92 c34 0 52 26 52 56 c0 30 -22 48 -52 48 c-30 0 -52 -18 -52 -48 c0 -30 18 -56 52 -56 z',
      `fill="${bodyFill(ctx)}" ${line(p, 2.4)}`) +
    P('M100 108 q34 -6 40 24 q-6 34 -40 36 q-34 -2 -40 -36 q6 -30 40 -24 z',
      `fill="${p.schatten}" ${line(p, 2)} opacity="0.92"`) +
    P('M76 128 q24 -10 48 0 M80 146 q20 -8 40 0 M86 162 q14 -6 28 0',
      `stroke="${p.tief}" stroke-width="2" fill="none" opacity="0.45"`) +
    E(100, 150, 22, 20, `fill="${p.bauch}" opacity="0.55"`);

  const kopfTeil =
    C(kopf.x, kopf.y, kopf.r, `fill="${headFill(ctx)}" ${line(p, 2.2)}`) +
    sheen(kopf.x - 9, kopf.y - 12, 12, 8, p, 0.4) +
    P('M76 60 q-8 -26 6 -32 q6 20 8 30 z', `class="pet-ear" fill="${p.akzent}" ${line(p)}`) +
    P('M124 60 q8 -26 -6 -32 q-6 20 -8 30 z', `class="pet-ear" fill="${p.akzent}" ${line(p)}`) +
    P('M100 48 q-14 -6 -16 -20 q16 4 16 20 z M100 48 q14 -6 16 -20 q-16 4 -16 20 z',
      `fill="${p.licht}" opacity="0.8"`);

  const gesicht =
    eyes(kopf.x, kopf.y + 2, 12, p, { rx: 8, ry: 9 }) +
    P('M92 94 q8 7 16 0', `stroke="${p.pupille}" stroke-width="2.4" fill="none"`);

  const tropfen =
    C(64, 96, 3.5, `fill="${p.licht}" opacity="0.7"`) +
    C(140, 88, 2.8, `fill="${p.licht}" opacity="0.6"`) +
    C(120, 68, 2.2, `fill="${p.glanz}" opacity="0.7"`);

  return {
    hinten: ringe + flossen + schweif + beine,
    koerper,
    vorne: kopfTeil + gesicht + tropfen,
    kopf,
    rumpf,
    ruecken: { x: 100, y: 104 },
  };
}

/** Waldhüter ✦ Mega — wandelnder Hain mit Blütenkrone. */
export function waldhueterMega(p, ctx) {
  const kopf = { x: 100, y: 68, r: 27 };
  const rumpf = { x: 100, y: 132, r: 42 };

  const krone =
    E(100, 40, 46, 26, `fill="${p.akzent}" ${line(p, 2.2)} opacity="0.95"`) +
    E(72, 50, 24, 16, `fill="${p.akzent}" ${line(p, 2)} opacity="0.9"`) +
    E(128, 50, 24, 16, `fill="${p.akzent}" ${line(p, 2)} opacity="0.9"`) +
    E(100, 32, 26, 14, `fill="${p.licht}" opacity="0.45"`) +
    [[-30, 44], [-6, 30], [22, 40], [36, 54], [-40, 58]]
      .map(([dx, dy]) => star(100 + dx, dy, 4.6, `fill="${p.licht}" opacity="0.85"`))
      .join('');

  const aeste =
    P('M74 96 q-30 -14 -44 -40 M126 96 q30 -14 44 -40',
      `stroke="${p.tief}" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.85"`) +
    P('M46 70 q-12 -6 -18 -18 M154 70 q12 -6 18 -18',
      `stroke="${p.tief}" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.7"`);

  const wurzeln =
    P('M74 168 q-18 8 -26 22 h20 q4 -12 14 -16 z', `fill="${p.tief}" ${line(p, 1.8)} opacity="0.9"`) +
    P('M126 168 q18 8 26 22 h-20 q-4 -12 -14 -16 z', `fill="${p.tief}" ${line(p, 1.8)} opacity="0.9"`) +
    P('M100 176 v14 M92 190 h16', `stroke="${p.tief}" stroke-width="4" stroke-linecap="round"`);

  const koerper =
    P('M100 88 c26 0 40 20 40 44 c0 30 -14 50 -40 50 c-26 0 -40 -20 -40 -50 c0 -24 14 -44 40 -44 z',
      `fill="${bodyFill(ctx)}" ${line(p, 2.4)}`) +
    P('M84 108 q16 -8 32 0 M80 128 q20 -8 40 0 M84 150 q16 -6 32 0',
      `stroke="${p.tief}" stroke-width="2.2" fill="none" opacity="0.45"`) +
    E(100, 140, 18, 24, `fill="${p.bauch}" opacity="0.5"`);

  const kopfTeil =
    C(kopf.x, kopf.y, kopf.r, `fill="${headFill(ctx)}" ${line(p, 2.2)}`) +
    sheen(kopf.x - 9, kopf.y - 10, 11, 8, p, 0.36) +
    P('M82 52 q-6 -18 4 -24 q6 14 6 22 z', `class="pet-ear" fill="${p.tief}" ${line(p, 1.8)}`) +
    P('M118 52 q6 -18 -4 -24 q-6 14 -6 22 z', `class="pet-ear" fill="${p.tief}" ${line(p, 1.8)}`);

  const gesicht =
    eyes(kopf.x, kopf.y + 2, 11, p, { rx: 7.5, ry: 8.5 }) +
    P('M94 84 q6 6 12 0', `stroke="${p.pupille}" stroke-width="2.2" fill="none"`);

  const glueh = halo(rumpf.x, rumpf.y - 12, rumpf.r + 28, 7, p, 2.4);

  return {
    hinten: aeste + wurzeln,
    koerper,
    vorne: krone + kopfTeil + gesicht + glueh,
    kopf,
    rumpf,
    ruecken: { x: 100, y: 96 },
  };
}
