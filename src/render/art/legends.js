/**
 * legends.js — Handgezeichnete legendäre Haustiere.
 *
 * Jede dieser Kreaturen hat eine eigene Silhouette und einen eigenen Effekt.
 * Farben kommen weiterhin aus der Palette der Art, damit Farbvarianten
 * (Nachtschlag, Schimmernd …) auch hier greifen.
 */

import { P, C, E, G, line, bodyFill, headFill, wingFill, eyes, sheen, star, halo, flameEdge } from './shared.js';

/** Pyranthos — die erste Flamme: Drache mit Hitzeschwingen und Kronenhörnern. */
export function pyranthos(p, ctx) {
  const kopf = { x: 100, y: 74, r: 28 };
  const rumpf = { x: 100, y: 134, r: 44 };

  const schwingen =
    P('M80 100 q-62 -50 -74 -6 q-6 44 26 58 q30 10 50 -24 z', `class="pet-wing" fill="${wingFill(ctx)}" ${line(p, 2.2)}`) +
    P('M120 100 q62 -50 74 -6 q6 44 -26 58 q-30 10 -50 -24 z', `class="pet-wing" fill="${wingFill(ctx)}" ${line(p, 2.2)}`) +
    P('M70 106 q-26 -14 -46 -2 M74 122 q-26 -6 -44 10 M130 106 q26 -14 46 -2 M126 122 q26 -6 44 10',
      `stroke="${p.tief}" stroke-width="1.5" fill="none" opacity="0.45"`);

  const schweif =
    P('M136 152 q38 -4 44 -36 q18 32 -8 58 q-24 22 -42 0 q-10 -16 6 -22 z', `class="pet-tail" fill="${p.akzent}" ${line(p)}`) +
    P('M148 146 q22 -2 26 -22 q10 20 -8 34 q-16 10 -18 -12 z', `class="pet-tail" fill="${p.licht}" opacity="0.9"`);

  const beine =
    P('M72 156 q-14 16 -8 30 h20 q-10 -14 -2 -28 z', `fill="${p.schatten}" ${line(p)}`) +
    P('M128 156 q14 16 8 30 h-20 q10 -14 2 -28 z', `fill="${p.schatten}" ${line(p)}`);

  const koerper =
    P('M100 92 c32 0 50 26 50 54 c0 30 -20 50 -50 50 c-30 0 -50 -20 -50 -50 c0 -28 18 -54 50 -54 z',
      `fill="${bodyFill(ctx)}" ${line(p, 2.4)}`) +
    P('M100 114 q26 -2 30 24 q-4 30 -30 32 q-26 -2 -30 -32 q4 -26 30 -24 z', `fill="${p.bauch}" opacity="0.85"`) +
    P('M82 132 h36 M84 148 h32 M88 164 h24', `stroke="${p.tief}" stroke-width="1.8" opacity="0.4"`);

  const kamm = flameEdge(kopf.x, kopf.y + 4, kopf.r + 4, p, 13);

  const kopfTeil =
    C(kopf.x, kopf.y, kopf.r, `fill="${headFill(ctx)}" ${line(p, 2.2)}`) +
    sheen(kopf.x - 10, kopf.y - 11, 12, 8, p, 0.4) +
    P('M78 56 q-12 -24 2 -34 q10 20 8 32 z', `fill="${p.licht}" ${line(p, 1.8)}`) +
    P('M122 56 q12 -24 -2 -34 q-10 20 -8 32 z', `fill="${p.licht}" ${line(p, 1.8)}`) +
    P('M100 96 q-14 4 -18 12 q18 6 36 0 q-4 -8 -18 -12 z', `fill="${p.schatten}" ${line(p, 1.8)}`);

  const gesicht =
    eyes(kopf.x, kopf.y - 2, 12, p, { rx: 8, ry: 8 }) +
    P('M88 100 h24', `stroke="${p.pupille}" stroke-width="2" opacity="0.7"`) +
    C(94, 104, 1.6, `fill="${p.pupille}"`) +
    C(106, 104, 1.6, `fill="${p.pupille}"`);

  return {
    hinten: schwingen + schweif + beine,
    koerper,
    vorne: kamm + kopfTeil + gesicht + halo(rumpf.x, rumpf.y - 12, rumpf.r + 30, 8, p, 2.6),
    kopf,
    rumpf,
    ruecken: { x: 100, y: 100 },
  };
}

/** Abyssaria — Königin der Tiefe: Schleierflossen und Lichtperlen. */
export function abyssaria(p, ctx) {
  const kopf = { x: 100, y: 88, r: 28 };
  const rumpf = { x: 100, y: 132, r: 44 };

  const schleier =
    P('M56 116 q-40 -22 -46 12 q10 42 46 26 z', `class="pet-wing" fill="${wingFill(ctx)}" ${line(p, 1.8)} opacity="0.85"`) +
    P('M144 116 q40 -22 46 12 q-10 42 -46 26 z', `class="pet-wing" fill="${wingFill(ctx)}" ${line(p, 1.8)} opacity="0.85"`) +
    P('M52 124 q-20 -4 -32 6 M148 124 q20 -4 32 6', `stroke="${p.licht}" stroke-width="1.6" fill="none" opacity="0.55"`);

  const schweif =
    P('M100 172 q-22 12 -30 26 q30 6 60 0 q-8 -14 -30 -26 z', `class="pet-tail" fill="${p.akzent}" ${line(p)} opacity="0.9"`) +
    P('M100 176 v22 M86 194 q14 6 28 0', `stroke="${p.licht}" stroke-width="1.8" fill="none" opacity="0.6"`);

  const koerper =
    P('M100 96 c30 0 46 24 46 52 c0 26 -18 44 -46 44 c-28 0 -46 -18 -46 -44 c0 -28 16 -52 46 -52 z',
      `fill="${bodyFill(ctx)}" ${line(p, 2.3)}`) +
    E(100, 148, 24, 26, `fill="${p.bauch}" opacity="0.65"`) +
    P('M78 122 q22 -10 44 0 M80 140 q20 -8 40 0 M84 158 q16 -6 32 0',
      `stroke="${p.glanz}" stroke-width="1.8" fill="none" opacity="0.5"`);

  const kopfTeil =
    C(kopf.x, kopf.y, kopf.r, `fill="${headFill(ctx)}" ${line(p, 2.2)}`) +
    sheen(kopf.x - 9, kopf.y - 11, 11, 8, p, 0.38) +
    P('M74 74 q-16 -18 -6 -30 q16 12 18 28 z', `class="pet-ear" fill="${p.akzent}" ${line(p, 1.8)}`) +
    P('M126 74 q16 -18 6 -30 q-16 12 -18 28 z', `class="pet-ear" fill="${p.akzent}" ${line(p, 1.8)}`) +
    E(100, 58, 9, 12, `fill="${p.licht}" ${line(p, 1.6)} opacity="0.9"`) +
    C(100, 58, 4, `fill="#ffffff" opacity="0.85"`);

  const gesicht =
    eyes(kopf.x, kopf.y + 2, 12, p, { rx: 8.5, ry: 9.5 }) +
    P('M94 104 q6 6 12 0', `stroke="${p.pupille}" stroke-width="2.2" fill="none"`);

  const perlen = G(
    'pet-orbit',
    [0, 60, 120, 180, 240, 300]
      .map((a) => {
        const rad = (a * Math.PI) / 180;
        return C(rumpf.x + Math.cos(rad) * 62, rumpf.y - 8 + Math.sin(rad) * 30, 3, `fill="${p.licht}" opacity="0.8"`);
      })
      .join('')
  );

  return {
    hinten: schleier + schweif,
    koerper,
    vorne: kopfTeil + gesicht + perlen,
    kopf,
    rumpf,
    ruecken: { x: 100, y: 100 },
  };
}

/** Sylvaronn — der erste Wald: Geweih aus Ästen, Moosmantel, Glühsporen. */
export function sylvaronn(p, ctx) {
  const kopf = { x: 100, y: 66, r: 26 };
  const rumpf = { x: 100, y: 130, r: 42 };

  const geweih =
    P('M86 46 q-14 -18 -12 -36 M74 22 q-12 -4 -16 -16 M78 34 q-14 0 -20 -10',
      `stroke="${p.tief}" stroke-width="4" fill="none" stroke-linecap="round"`) +
    P('M114 46 q14 -18 12 -36 M126 22 q12 -4 16 -16 M122 34 q14 0 20 -10',
      `stroke="${p.tief}" stroke-width="4" fill="none" stroke-linecap="round"`) +
    [[-30, 14], [-42, 8], [30, 14], [42, 8], [-24, 30], [24, 30]]
      .map(([dx, dy]) => C(100 + dx, dy, 3.4, `fill="${p.licht}" opacity="0.85"`))
      .join('');

  const mantel =
    P('M64 104 q-14 44 -4 76 q40 12 80 0 q10 -32 -4 -76 q-36 -14 -72 0 z',
      `fill="${p.tief}" ${line(p, 2.2)}`) +
    P('M72 126 q28 -10 56 0 M74 148 q26 -8 52 0 M78 168 q22 -6 44 0',
      `stroke="${p.akzent}" stroke-width="2.2" fill="none" opacity="0.55"`) +
    P('M64 104 q36 -14 72 0 q-36 10 -72 0 z', `fill="${p.licht}" opacity="0.35"`);

  const koerper =
    P('M100 84 c24 0 36 18 36 40 c0 28 -12 48 -36 48 c-24 0 -36 -20 -36 -48 c0 -22 12 -40 36 -40 z',
      `fill="${bodyFill(ctx)}" ${line(p, 2.3)}`) +
    E(100, 132, 16, 22, `fill="${p.bauch}" opacity="0.55"`);

  const kopfTeil =
    C(kopf.x, kopf.y, kopf.r, `fill="${headFill(ctx)}" ${line(p, 2.2)}`) +
    sheen(kopf.x - 9, kopf.y - 10, 10, 8, p, 0.34) +
    E(100, 78, 10, 7, `fill="${p.tief}" opacity="0.5"`);

  const gesicht =
    eyes(kopf.x, kopf.y, 11, p, { rx: 7.5, ry: 8 }) +
    P('M95 80 q5 5 10 0', `stroke="${p.pupille}" stroke-width="2" fill="none"`);

  const sporen = G(
    'pet-funken',
    [[-46, -20], [44, -8], [-30, 30], [38, 26], [0, -46]]
      .map(([dx, dy], i) =>
        C(rumpf.x + dx, rumpf.y + dy, 2.6, `fill="${p.licht}" opacity="0.75" style="animation:pet-float ${2.6 + i * 0.3}s ease-in-out ${i * 0.4}s infinite"`)
      )
      .join('')
  );

  return {
    // Der Moosmantel liegt über dem Körper, nicht dahinter — sonst verdeckt
    // ihn die Silhouette vollständig.
    hinten: geweih,
    koerper,
    vorne: mantel + kopfTeil + gesicht + sporen,
    kopf,
    rumpf,
    ruecken: { x: 100, y: 94 },
  };
}

/** Voltarax — Sturmwolf, dem der Donner hinterherläuft. */
export function voltarax(p, ctx) {
  const kopf = { x: 100, y: 76, r: 29 };
  const rumpf = { x: 100, y: 132, r: 42 };

  const blitze = G(
    'pet-orbit',
    P('M46 96 l14 -4 l-6 -14 l22 20 l-14 4 l6 16 z', `fill="${p.akzent}" opacity="0.85"`) +
      P('M154 96 l-14 -4 l6 -14 l-22 20 l14 4 l-6 16 z', `fill="${p.akzent}" opacity="0.85"`)
  );

  const schweif =
    P('M138 146 l22 -12 l-10 -16 l32 -18 l-8 24 l14 -2 l-32 34 z', `class="pet-tail" fill="${p.akzent}" ${line(p)}`) +
    P('M148 138 l14 -8 l-6 -10 l18 -10', `stroke="${p.licht}" stroke-width="2" fill="none" opacity="0.75"`);

  const beine =
    P('M70 152 q-12 18 -6 32 h18 q-8 -16 0 -30 z', `fill="${p.schatten}" ${line(p)}`) +
    P('M130 152 q12 18 6 32 h-18 q8 -16 0 -30 z', `fill="${p.schatten}" ${line(p)}`) +
    P('M86 158 q-8 14 -4 24 h14 q-6 -12 0 -22 z', `fill="${p.tief}" opacity="0.75"`);

  const koerper =
    P('M100 90 c30 0 46 24 46 52 c0 28 -18 46 -46 46 c-28 0 -46 -18 -46 -46 c0 -28 16 -52 46 -52 z',
      `fill="${bodyFill(ctx)}" ${line(p, 2.3)}`) +
    P('M100 116 q22 -2 26 22 q-4 28 -26 30 q-22 -2 -26 -30 q4 -24 26 -22 z', `fill="${p.bauch}" opacity="0.85"`) +
    P('M76 122 l14 10 l-10 8 M124 122 l-14 10 l10 8', `stroke="${p.glanz}" stroke-width="2.4" fill="none" opacity="0.7"`);

  const maehne = P(
    'M100 44 l-14 20 l-22 -6 l10 22 l-22 10 l22 12 l-8 20 l24 -8 l10 20 l10 -20 l24 8 l-8 -20 l22 -12 l-22 -10 l10 -22 l-22 6 z',
    `fill="${p.akzent}" ${line(p, 2)} opacity="0.92"`
  );

  const kopfTeil =
    C(kopf.x, kopf.y, kopf.r, `fill="${headFill(ctx)}" ${line(p, 2.2)}`) +
    sheen(kopf.x - 10, kopf.y - 11, 11, 8, p, 0.4) +
    P('M78 58 l-6 -22 l20 12 z', `class="pet-ear" fill="${p.haupt}" ${line(p, 1.8)}`) +
    P('M122 58 l6 -22 l-20 12 z', `class="pet-ear" fill="${p.haupt}" ${line(p, 1.8)}`) +
    P('M100 90 q-12 4 -14 10 q14 6 28 0 q-2 -6 -14 -10 z', `fill="${p.schatten}" ${line(p, 1.8)}`);

  const gesicht = eyes(kopf.x, kopf.y - 2, 12, p, { rx: 8, ry: 7 });

  return {
    hinten: blitze + maehne + schweif + beine,
    koerper,
    vorne: kopfTeil + gesicht,
    kopf,
    rumpf,
    ruecken: { x: 100, y: 98 },
  };
}

/** Lumindra — Lichtvogel, dessen Federn Sonnenaufgänge tragen. */
export function lumindra(p, ctx) {
  const kopf = { x: 100, y: 70, r: 24 };
  const rumpf = { x: 100, y: 128, r: 40 };

  const schwingen =
    P('M82 100 q-64 -34 -76 6 q10 44 44 48 q26 2 36 -30 z', `class="pet-wing" fill="${wingFill(ctx)}" ${line(p, 2.2)}`) +
    P('M118 100 q64 -34 76 6 q-10 44 -44 48 q-26 2 -36 -30 z', `class="pet-wing" fill="${wingFill(ctx)}" ${line(p, 2.2)}`) +
    P('M62 108 q-22 2 -38 14 M70 124 q-22 6 -34 20 M138 108 q22 2 38 14 M130 124 q22 6 34 20',
      `stroke="${p.licht}" stroke-width="1.8" fill="none" opacity="0.6"`);

  const schweif =
    P('M100 168 q-26 18 -32 32 q34 8 64 0 q-6 -14 -32 -32 z', `class="pet-tail" fill="${p.akzent}" ${line(p, 2)} opacity="0.9"`) +
    P('M100 170 v28 M86 190 q14 8 28 0', `stroke="${p.licht}" stroke-width="2" fill="none" opacity="0.7"`);

  const koerper =
    P('M100 84 c26 0 40 26 40 52 c0 26 -16 42 -40 42 c-24 0 -40 -16 -40 -42 c0 -26 14 -52 40 -52 z',
      `fill="${bodyFill(ctx)}" ${line(p, 2.3)}`) +
    E(100, 138, 20, 26, `fill="${p.bauch}" opacity="0.7"`);

  const kopfTeil =
    C(kopf.x, kopf.y, kopf.r, `fill="${headFill(ctx)}" ${line(p, 2.2)}`) +
    sheen(kopf.x - 8, kopf.y - 9, 9, 7, p, 0.4) +
    P('M100 80 l16 8 l-16 8 z', `fill="${p.akzent}" ${line(p, 1.6)}`) +
    P('M92 48 q-4 -20 8 -26 q12 6 8 26 z', `class="pet-ear" fill="${p.akzent}" ${line(p, 1.8)}`) +
    star(100, 40, 7, `fill="${p.licht}" opacity="0.95"`);

  const gesicht = eyes(kopf.x, kopf.y, 10, p, { rx: 7, ry: 7.5 });

  const strahlen = G(
    'pet-orbit',
    [0, 45, 90, 135, 180, 225, 270, 315]
      .map((a) => {
        const rad = (a * Math.PI) / 180;
        return P(
          `M${100 + Math.cos(rad) * 60} ${128 + Math.sin(rad) * 44} l${Math.cos(rad) * 12} ${Math.sin(rad) * 9}`,
          `stroke="${p.licht}" stroke-width="2.4" opacity="0.5" stroke-linecap="round"`
        );
      })
      .join('')
  );

  return {
    hinten: strahlen + schwingen + schweif,
    koerper,
    vorne: kopfTeil + gesicht,
    kopf,
    rumpf,
    ruecken: { x: 100, y: 100 },
  };
}

/** Goldkitz — aus dem goldenen Ei: Glücksbringer mit Münzenkranz. */
export function goldkitz(p, ctx) {
  const kopf = { x: 100, y: 84, r: 30 };
  const rumpf = { x: 100, y: 136, r: 40 };

  const kranz = G(
    'pet-orbit',
    [0, 72, 144, 216, 288]
      .map((a) => {
        const rad = (a * Math.PI) / 180;
        return (
          C(100 + Math.cos(rad) * 62, 132 + Math.sin(rad) * 30, 6, `fill="${p.licht}" stroke="${p.tief}" stroke-width="1.4" opacity="0.9"`) +
          C(100 + Math.cos(rad) * 62, 132 + Math.sin(rad) * 30, 2.6, `fill="${p.akzent}" opacity="0.9"`)
        );
      })
      .join('')
  );

  const schweif = P('M138 150 q34 -8 34 -38 q18 28 -4 50 q-22 18 -36 0 q-8 -10 6 -12 z',
    `class="pet-tail" fill="${p.haupt}" ${line(p)}`);

  const beine =
    P('M76 162 q-10 14 -4 24 h16 q-8 -10 -2 -22 z', `fill="${p.schatten}" ${line(p, 1.8)}`) +
    P('M124 162 q10 14 4 24 h-16 q8 -10 2 -22 z', `fill="${p.schatten}" ${line(p, 1.8)}`);

  const koerper =
    P('M100 100 c28 0 42 22 42 46 c0 26 -16 42 -42 42 c-26 0 -42 -16 -42 -42 c0 -24 14 -46 42 -46 z',
      `fill="${bodyFill(ctx)}" ${line(p, 2.3)}`) +
    E(100, 148, 20, 22, `fill="${p.bauch}" opacity="0.8"`);

  const kopfTeil =
    C(kopf.x, kopf.y, kopf.r, `fill="${headFill(ctx)}" ${line(p, 2.2)}`) +
    sheen(kopf.x - 10, kopf.y - 12, 12, 9, p, 0.42) +
    P('M78 64 l-6 -24 l22 12 z', `class="pet-ear" fill="${p.haupt}" ${line(p, 1.8)}`) +
    P('M122 64 l6 -24 l-22 12 z', `class="pet-ear" fill="${p.haupt}" ${line(p, 1.8)}`) +
    P('M80 60 l-2 -14 l12 7 z M120 60 l2 -14 l-12 7 z', `fill="${p.akzent}" opacity="0.9"`);

  const gesicht =
    eyes(kopf.x, kopf.y + 2, 12, p, { rx: 8.5, ry: 9 }) +
    P('M92 100 q8 8 16 0', `stroke="${p.pupille}" stroke-width="2.2" fill="none"`) +
    P('M84 92 l-10 -3 M116 92 l10 -3', `stroke="${p.umriss}" stroke-width="1.6" opacity="0.55"`);

  return {
    hinten: kranz + schweif + beine,
    koerper,
    vorne: kopfTeil + gesicht,
    kopf,
    rumpf,
    ruecken: { x: 100, y: 104 },
  };
}
