/**
 * mystics.js — Handgezeichnete mystische Haustiere.
 *
 * Die seltenste Stufe im Spiel. Diese Kreaturen bekommen jeweils einen
 * eigenen, sofort erkennbaren Effekt: kreisende Zeitringe, Sternenfeld,
 * Doppelkorona, Prismenfächer, Obsidianbruch.
 */

import { P, C, E, G, line, bodyFill, headFill, wingFill, eyes, sheen, star, halo } from './shared.js';

/** Aeternum — geronnene Zeit: schwebender Kristallkörper in drei Ringen. */
export function aeternum(p, ctx) {
  const kopf = { x: 100, y: 92, r: 26 };
  const rumpf = { x: 100, y: 122, r: 42 };

  const ringe = G(
    'pet-orbit',
    E(100, 122, 72, 24, `fill="none" stroke="${p.glanz}" stroke-width="3.4" opacity="0.7"`) +
      E(100, 122, 58, 40, `fill="none" stroke="${p.licht}" stroke-width="2.4" opacity="0.55" transform="rotate(28 100 122)"`) +
      E(100, 122, 58, 40, `fill="none" stroke="${p.akzent}" stroke-width="2.4" opacity="0.5" transform="rotate(-28 100 122)"`) +
      C(172, 122, 4, `fill="${p.licht}"`) +
      C(28, 122, 3, `fill="${p.glanz}"`)
  );

  const zeiger = P('M100 122 l0 -30 M100 122 l22 12', `stroke="${p.licht}" stroke-width="2.6" opacity="0.75" stroke-linecap="round"`);

  const koerper =
    P('M100 74 l32 24 l-12 44 l-40 0 l-12 -44 z', `fill="${bodyFill(ctx)}" ${line(p, 2.3)}`) +
    P('M100 74 l32 24 l-32 14 l-32 -14 z', `fill="${p.licht}" opacity="0.35"`) +
    P('M100 112 l20 -14 l-8 44 h-24 l-8 -44 z', `fill="${p.bauch}" opacity="0.35"`);

  const splitter =
    P('M64 108 l-16 -16 l4 20 z', `fill="${p.akzent}" ${line(p, 1.4)} opacity="0.9"`) +
    P('M136 108 l16 -16 l-4 20 z', `fill="${p.akzent}" ${line(p, 1.4)} opacity="0.9"`) +
    P('M100 60 l-8 -20 l16 0 z', `fill="${p.licht}" ${line(p, 1.4)}`);

  const gesicht =
    eyes(kopf.x, kopf.y + 4, 11, p, { rx: 7, ry: 8 }) +
    P('M94 108 q6 5 12 0', `stroke="${p.pupille}" stroke-width="2" fill="none" opacity="0.8"`);

  return {
    hinten: ringe,
    koerper,
    vorne: splitter + zeiger + gesicht + halo(100, 122, 88, 10, p, 2),
    kopf,
    rumpf,
    ruecken: { x: 100, y: 78 },
  };
}

/** Nyxaria — die Nacht selbst: Sternenschleier und Mondsichel. */
export function nyxaria(p, ctx) {
  const kopf = { x: 100, y: 88, r: 27 };
  const rumpf = { x: 100, y: 126, r: 44 };

  const schleier =
    P('M100 62 c34 0 54 30 54 62 c0 26 -8 42 -16 54 q-12 -14 -20 -2 q-8 12 -18 0 q-10 12 -18 0 q-8 12 -20 2 c-8 -12 -16 -28 -16 -54 c0 -32 20 -62 54 -62 z',
      `fill="${bodyFill(ctx)}" ${line(p, 2.2)} opacity="0.95"`) +
    [[-24, 96], [18, 112], [-8, 136], [30, 90], [-34, 124], [6, 78]]
      .map(([dx, dy], i) => star(100 + dx, dy, i % 2 ? 3.4 : 4.6, `fill="${p.licht}" opacity="${0.6 + (i % 3) * 0.12}"`))
      .join('');

  const mond = P('M100 40 a20 20 0 1 0 14 34 a16 16 0 1 1 -14 -34 z', `fill="${p.licht}" ${line(p, 1.6)} opacity="0.95"`);

  const schleppen = G(
    'pet-funken',
    [[-52, 70], [56, 84], [-44, 148], [50, 150]]
      .map(([dx, dy], i) =>
        C(100 + dx, dy, 2.6, `fill="${p.glanz}" opacity="0.8" style="animation:pet-float ${2.8 + i * 0.4}s ease-in-out ${i * 0.5}s infinite"`)
      )
      .join('')
  );

  const kopfTeil =
    C(kopf.x, kopf.y, kopf.r, `fill="${headFill(ctx)}" ${line(p, 2)} opacity="0.9"`) +
    sheen(kopf.x - 9, kopf.y - 10, 10, 8, p, 0.3) +
    P('M76 72 q-10 -22 2 -30 q10 16 10 28 z', `class="pet-ear" fill="${p.akzent}" ${line(p, 1.6)}`) +
    P('M124 72 q10 -22 -2 -30 q-10 16 -10 28 z', `class="pet-ear" fill="${p.akzent}" ${line(p, 1.6)}`);

  const gesicht =
    eyes(kopf.x, kopf.y + 2, 11, p, { rx: 8, ry: 9 }) +
    P('M94 104 q6 6 12 0', `stroke="${p.pupille}" stroke-width="2" fill="none"`);

  return {
    hinten: mond + schleppen,
    koerper: schleier,
    vorne: kopfTeil + gesicht,
    kopf,
    rumpf,
    ruecken: { x: 100, y: 72 },
  };
}

/** Solmarax — Sonne und Feuer vereint: Doppelkorona und Flammenmähne. */
export function solmarax(p, ctx) {
  const kopf = { x: 100, y: 78, r: 28 };
  const rumpf = { x: 100, y: 132, r: 44 };

  const korona = G(
    'pet-orbit',
    [...Array(16).keys()]
      .map((i) => {
        const a = (Math.PI * 2 * i) / 16;
        const inner = 58;
        const outer = i % 2 === 0 ? 82 : 70;
        return P(
          `M${100 + Math.cos(a) * inner} ${126 + Math.sin(a) * inner * 0.72} L${100 + Math.cos(a) * outer} ${126 + Math.sin(a) * outer * 0.72}`,
          `stroke="${p.licht}" stroke-width="${i % 2 === 0 ? 4 : 2.4}" opacity="0.6" stroke-linecap="round"`
        );
      })
      .join('')
  );

  const schwingen =
    P('M80 104 q-54 -40 -68 -2 q-2 40 28 50 q26 8 44 -22 z', `class="pet-wing" fill="${wingFill(ctx)}" ${line(p, 2.2)}`) +
    P('M120 104 q54 -40 68 -2 q2 40 -28 50 q-26 8 -44 -22 z', `class="pet-wing" fill="${wingFill(ctx)}" ${line(p, 2.2)}`);

  const schweif = P('M136 152 q36 -8 40 -38 q16 32 -10 54 q-24 18 -38 -2 q-8 -12 8 -14 z',
    `class="pet-tail" fill="${p.akzent}" ${line(p)}`);

  const koerper =
    P('M100 92 c32 0 48 26 48 54 c0 28 -18 46 -48 46 c-30 0 -48 -18 -48 -46 c0 -28 16 -54 48 -54 z',
      `fill="${bodyFill(ctx)}" ${line(p, 2.4)}`) +
    P('M100 116 q24 -2 28 24 q-4 28 -28 30 q-24 -2 -28 -30 q4 -26 28 -24 z', `fill="${p.bauch}" opacity="0.8"`) +
    P('M80 130 h40 M84 148 h32', `stroke="${p.licht}" stroke-width="2" opacity="0.5"`);

  const maehne = P(
    'M100 44 l-16 18 l-24 -4 l12 20 l-24 12 l24 12 l-10 20 l24 -8 l14 20 l14 -20 l24 8 l-10 -20 l24 -12 l-24 -12 l12 -20 l-24 4 z',
    `fill="${p.akzent}" ${line(p, 2)} opacity="0.9"`
  );

  const kopfTeil =
    C(kopf.x, kopf.y, kopf.r, `fill="${headFill(ctx)}" ${line(p, 2.2)}`) +
    sheen(kopf.x - 10, kopf.y - 11, 12, 8, p, 0.42) +
    star(100, 42, 9, `fill="${p.licht}" ${line(p, 1.4)}`);

  const gesicht =
    eyes(kopf.x, kopf.y, 12, p, { rx: 8, ry: 8 }) +
    P('M92 96 q8 8 16 0', `stroke="${p.pupille}" stroke-width="2.2" fill="none"`);

  return {
    hinten: korona + schwingen + schweif + maehne,
    koerper,
    vorne: kopfTeil + gesicht,
    kopf,
    rumpf,
    ruecken: { x: 100, y: 102 },
  };
}

/** Prismara — alle Farben zugleich: Prismenfächer statt Schwingen. */
export function prismara(p, ctx) {
  const kopf = { x: 100, y: 74, r: 24 };
  const rumpf = { x: 100, y: 130, r: 40 };

  const faecher = (dir) =>
    [0, 1, 2, 3, 4]
      .map((i) => {
        const spread = 12 + i * 13;
        const laenge = 52 - i * 4;
        return P(
          `M${100 + dir * 16} 108 q${dir * laenge} ${-spread} ${dir * (laenge + 14)} ${-spread + 26} q${-dir * 20} ${18} ${-dir * (laenge + 6)} ${spread - 14} z`,
          `class="pet-wing" fill="${i % 2 ? p.licht : p.akzent}" ${line(p, 1.5)} opacity="${0.9 - i * 0.09}"`
        );
      })
      .join('');

  const schweif =
    P('M100 168 l-14 30 l14 -8 l14 8 z', `class="pet-tail" fill="${p.akzent}" ${line(p, 1.8)}`) +
    P('M100 170 v26', `stroke="${p.licht}" stroke-width="2" opacity="0.7"`);

  const koerper =
    P('M100 86 c24 0 38 24 38 48 c0 24 -16 38 -38 38 c-22 0 -38 -14 -38 -38 c0 -24 14 -48 38 -48 z',
      `fill="${bodyFill(ctx)}" ${line(p, 2.2)}`) +
    P('M100 96 l24 30 l-24 34 l-24 -34 z', `fill="${p.licht}" opacity="0.3"`) +
    E(100, 140, 16, 20, `fill="${p.bauch}" opacity="0.5"`);

  const kopfTeil =
    C(kopf.x, kopf.y, kopf.r, `fill="${headFill(ctx)}" ${line(p, 2)}`) +
    sheen(kopf.x - 8, kopf.y - 9, 9, 7, p, 0.4) +
    P('M100 84 l14 8 l-14 7 z', `fill="${p.akzent}" ${line(p, 1.5)}`) +
    P('M100 50 l-10 -22 l10 -12 l10 12 z', `fill="${p.licht}" ${line(p, 1.5)}`);

  const gesicht = eyes(kopf.x, kopf.y, 10, p, { rx: 7, ry: 7.5 });

  const funkeln = G(
    'pet-funken',
    [[-56, 66], [58, 74], [-48, 150], [52, 146], [0, 34]]
      .map(([dx, dy], i) => star(100 + dx, dy, 4, `fill="${p.licht}" opacity="0.8" style="animation:pet-float ${2.4 + i * 0.35}s ease-in-out ${i * 0.3}s infinite"`))
      .join('')
  );

  return {
    hinten: faecher(-1) + faecher(1) + schweif,
    koerper,
    vorne: kopfTeil + gesicht + funkeln,
    kopf,
    rumpf,
    ruecken: { x: 100, y: 104 },
  };
}

/** Obsidiel — Feuer traf Nacht: gebrochene Glasplatten mit glühenden Rissen. */
export function obsidiel(p, ctx) {
  const kopf = { x: 100, y: 78, r: 27 };
  const rumpf = { x: 100, y: 134, r: 44 };

  const scherben = G(
    'pet-orbit',
    [[-64, 96, 14], [62, 106, 12], [-48, 156, 10], [54, 158, 9], [0, 44, 11]]
      .map(([dx, dy, size]) =>
        P(`M${100 + dx} ${dy} l${size} ${-size * 0.7} l${size * 0.4} ${size} l${-size * 0.9} ${size * 0.5} z`,
          `fill="${p.schatten}" ${line(p, 1.4)} opacity="0.85"`)
      )
      .join('')
  );

  const schwingen =
    P('M80 106 q-48 -34 -62 0 q-2 36 26 44 q24 6 40 -20 z', `class="pet-wing" fill="${p.schatten}" ${line(p, 2)} opacity="0.9"`) +
    P('M120 106 q48 -34 62 0 q2 36 -26 44 q-24 6 -40 -20 z', `class="pet-wing" fill="${p.schatten}" ${line(p, 2)} opacity="0.9"`) +
    P('M70 112 l-20 8 M74 126 l-22 12 M130 112 l20 8 M126 126 l22 12',
      `stroke="${p.akzent}" stroke-width="1.8" opacity="0.7"`);

  const schweif = P('M138 154 q34 -10 36 -40 q18 32 -8 54 q-24 18 -36 -2 z',
    `class="pet-tail" fill="${p.schatten}" ${line(p)}`);

  const koerper =
    P('M100 94 l40 26 l-10 56 l-60 0 l-10 -56 z', `fill="${bodyFill(ctx)}" ${line(p, 2.4)}`) +
    P('M100 94 l40 26 l-40 16 l-40 -16 z', `fill="${p.licht}" opacity="0.22"`) +
    P('M100 110 l-14 66 M100 110 l16 66 M74 130 l52 14',
      `stroke="${p.akzent}" stroke-width="2.6" opacity="0.85" stroke-linecap="round"`);

  const kopfTeil =
    P('M100 52 l28 20 l-10 34 h-36 l-10 -34 z', `fill="${headFill(ctx)}" ${line(p, 2.2)}`) +
    P('M100 52 l28 20 l-28 12 l-28 -12 z', `fill="${p.licht}" opacity="0.25"`) +
    P('M82 48 l-6 -22 l18 12 z M118 48 l6 -22 l-18 12 z', `class="pet-ear" fill="${p.schatten}" ${line(p, 1.6)}`);

  const gesicht =
    eyes(kopf.x, kopf.y + 2, 11, p, { rx: 7, ry: 6 }) +
    P('M90 96 h20', `stroke="${p.akzent}" stroke-width="2.4" opacity="0.9"`);

  return {
    hinten: scherben + schwingen + schweif,
    koerper,
    vorne: kopfTeil + gesicht + halo(rumpf.x, rumpf.y - 10, rumpf.r + 34, 8, p, 2.2),
    kopf,
    rumpf,
    ruecken: { x: 100, y: 104 },
  };
}
