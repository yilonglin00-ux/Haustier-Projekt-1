/**
 * parts.js — Bauteil-Bibliothek für die Kreaturen.
 *
 * Alle Teile zeichnen in ein Feld von 200 × 200 Einheiten. Der Boden liegt
 * bei y = 182, die Mitte bei x = 100. Jede Körperform liefert außerdem zurück,
 * wo Kopf, Schweif und Rücken liegen — daran hängen Ohren, Augen, Flügel,
 * Kleidung und Effekte.
 *
 * Detailstufen (`d`):
 *   0 = prozedural   (gewöhnlich / ungewöhnlich): flache Farben, klarer Umriss
 *   1 = signatur     (selten):                    Verläufe, Lichtkante, Extras
 *   2 = illustriert  (episch und höher):          zusätzlich Tiefenschatten,
 *                                                 Glanzlichter, Aura, Partikel
 *
 * Alle Funktionen geben SVG-Text zurück. Das ist für pfadlastige Zeichnungen
 * deutlich lesbarer als der Aufbau über einzelne DOM-Aufrufe.
 */

export const GROUND_Y = 182;
export const CENTER_X = 100;

// ---------------------------------------------------------------------------
// Kleine Helfer
// ---------------------------------------------------------------------------

const num = (n) => Math.round(n * 100) / 100;

/** Füllung: ab Detailstufe 1 ein Verlauf, sonst die flache Farbe. */
function fill(ctx, gradientId, flat) {
  return ctx.d >= 1 ? `url(#${ctx.id}-${gradientId})` : flat;
}

/** Umrissbreite je nach Detailstufe. */
function stroke(ctx, p, width = 2.4) {
  return `stroke="${p.umriss}" stroke-width="${ctx.d >= 2 ? width * 0.85 : width}" stroke-linejoin="round"`;
}

function ellipse(cx, cy, rx, ry, attrs = '') {
  return `<ellipse cx="${num(cx)}" cy="${num(cy)}" rx="${num(rx)}" ry="${num(ry)}" ${attrs}/>`;
}

function circle(cx, cy, r, attrs = '') {
  return `<circle cx="${num(cx)}" cy="${num(cy)}" r="${num(r)}" ${attrs}/>`;
}

function path(d, attrs = '') {
  return `<path d="${d}" ${attrs}/>`;
}

// ---------------------------------------------------------------------------
// Körperformen
// ---------------------------------------------------------------------------

/**
 * @typedef {object} BodyResult
 * @property {string} hinten  wird hinter dem Körper gezeichnet
 * @property {string} koerper der Körper selbst
 * @property {string} vorne   Bauch, Glanzlichter, Details
 * @property {{x:number,y:number,r:number}} kopf
 * @property {{x:number,y:number,winkel:number}} schweif Ansatzpunkt des Schweifs
 * @property {{x:number,y:number}} ruecken  Ansatz für Flügel/Kamm
 * @property {{x:number,y:number,r:number}} rumpf  Mitte des Rumpfes
 */

const BODIES = {
  // --- Rundes Fellknäuel ---------------------------------------------------
  rund(p, ctx) {
    const body = ellipse(100, 128, 50, 46, `fill="${fill(ctx, 'koerper', p.haupt)}" ${stroke(ctx, p)}`);
    const feet =
      ellipse(78, 172, 15, 9, `fill="${p.schatten}" ${stroke(ctx, p, 2)}`) +
      ellipse(122, 172, 15, 9, `fill="${p.schatten}" ${stroke(ctx, p, 2)}`);
    const belly = ellipse(100, 145, 30, 24, `fill="${p.bauch}" opacity="0.85"`);
    const shine = ctx.d >= 1 ? ellipse(80, 105, 16, 11, `fill="${p.licht}" opacity="0.4"`) : '';
    return {
      hinten: feet,
      koerper: body,
      vorne: belly + shine,
      kopf: { x: 100, y: 110, r: 34 },
      schweif: { x: 146, y: 138, winkel: -20 },
      ruecken: { x: 100, y: 92 },
      rumpf: { x: 100, y: 132, r: 46 },
    };
  },

  // --- Katzenartig ---------------------------------------------------------
  katze(p, ctx) {
    const legs =
      path('M74 160 q-4 14 2 20 h11 q-5 -8 -3 -20 z', `fill="${p.schatten}" ${stroke(ctx, p, 2)}`) +
      path('M126 160 q4 14 -2 20 h-11 q5 -8 3 -20 z', `fill="${p.schatten}" ${stroke(ctx, p, 2)}`);
    const body = path(
      'M100 78 c30 0 44 22 44 48 c0 28 -16 52 -44 52 c-28 0 -44 -24 -44 -52 c0 -26 14 -48 44 -48 z',
      `fill="${fill(ctx, 'koerper', p.haupt)}" ${stroke(ctx, p)}`
    );
    const belly = path(
      'M100 108 c16 0 24 14 24 30 c0 18 -10 30 -24 30 c-14 0 -24 -12 -24 -30 c0 -16 8 -30 24 -30 z',
      `fill="${p.bauch}" opacity="0.9"`
    );
    const shine = ctx.d >= 1 ? ellipse(80, 98, 13, 20, `fill="${p.licht}" opacity="0.32"`) : '';
    return {
      hinten: legs,
      koerper: body,
      vorne: belly + shine,
      kopf: { x: 100, y: 90, r: 32 },
      schweif: { x: 142, y: 146, winkel: -25 },
      ruecken: { x: 100, y: 100 },
      rumpf: { x: 100, y: 132, r: 42 },
    };
  },

  // --- Wolfsartig ----------------------------------------------------------
  wolf(p, ctx) {
    const legs =
      path('M70 152 q-6 16 0 26 h12 q-6 -10 -2 -26 z', `fill="${p.schatten}" ${stroke(ctx, p, 2)}`) +
      path('M130 152 q6 16 0 26 h-12 q6 -10 2 -26 z', `fill="${p.schatten}" ${stroke(ctx, p, 2)}`) +
      path('M88 156 q-4 14 0 24 h11 q-5 -10 -1 -24 z', `fill="${p.tief}" opacity="0.8"`);
    const body = path(
      'M62 128 c0 -26 18 -44 38 -44 c22 0 38 18 38 44 c0 24 -12 44 -38 44 c-26 0 -38 -20 -38 -44 z',
      `fill="${fill(ctx, 'koerper', p.haupt)}" ${stroke(ctx, p)}`
    );
    const chest = path(
      'M100 116 c14 0 20 12 20 26 c0 14 -8 24 -20 24 c-12 0 -20 -10 -20 -24 c0 -14 6 -26 20 -26 z',
      `fill="${p.bauch}" opacity="0.9"`
    );
    const shine = ctx.d >= 1 ? ellipse(80, 106, 12, 18, `fill="${p.licht}" opacity="0.3"`) : '';
    return {
      hinten: legs,
      koerper: body,
      vorne: chest + shine,
      kopf: { x: 100, y: 84, r: 31 },
      schweif: { x: 140, y: 140, winkel: -34 },
      ruecken: { x: 100, y: 96 },
      rumpf: { x: 100, y: 130, r: 40 },
    };
  },

  // --- Vogelartig ----------------------------------------------------------
  vogel(p, ctx) {
    const legs =
      path('M92 166 l-3 14 M92 180 h-8 M92 180 h8', `stroke="${p.tief}" stroke-width="3" fill="none" stroke-linecap="round"`) +
      path('M110 166 l3 14 M110 180 h-8 M110 180 h8', `stroke="${p.tief}" stroke-width="3" fill="none" stroke-linecap="round"`);
    const body = path(
      'M100 74 c24 0 40 26 40 54 c0 26 -18 42 -40 42 c-22 0 -40 -16 -40 -42 c0 -28 16 -54 40 -54 z',
      `fill="${fill(ctx, 'koerper', p.haupt)}" ${stroke(ctx, p)}`
    );
    const belly = ellipse(100, 132, 24, 30, `fill="${p.bauch}" opacity="0.9"`);
    const beak = path('M100 94 l14 8 l-14 7 z', `fill="${p.akzent}" ${stroke(ctx, p, 1.8)}`);
    const shine = ctx.d >= 1 ? ellipse(82, 100, 11, 18, `fill="${p.licht}" opacity="0.32"`) : '';
    return {
      hinten: legs,
      koerper: body,
      vorne: belly + beak + shine,
      kopf: { x: 100, y: 86, r: 27 },
      schweif: { x: 136, y: 150, winkel: -40 },
      ruecken: { x: 100, y: 104 },
      rumpf: { x: 100, y: 128, r: 40 },
    };
  },

  // --- Fischartig ----------------------------------------------------------
  fisch(p, ctx) {
    const body = path(
      'M60 128 c0 -30 20 -50 42 -50 c24 0 38 22 38 50 c0 28 -16 48 -38 48 c-22 0 -42 -18 -42 -48 z',
      `fill="${fill(ctx, 'koerper', p.haupt)}" ${stroke(ctx, p)}`
    );
    const fins =
      path('M58 122 q-22 -10 -26 8 q4 20 26 12 z', `fill="${p.akzent}" ${stroke(ctx, p, 2)}`) +
      path('M142 122 q22 -10 26 8 q-4 20 -26 12 z', `fill="${p.akzent}" ${stroke(ctx, p, 2)}`);
    const belly = ellipse(100, 144, 26, 22, `fill="${p.bauch}" opacity="0.88"`);
    const gill = ctx.d >= 1 ? path('M78 118 q6 12 0 24', `stroke="${p.tief}" stroke-width="2" fill="none" opacity="0.5"`) : '';
    const shine = ctx.d >= 1 ? ellipse(84, 104, 12, 16, `fill="${p.licht}" opacity="0.34"`) : '';
    return {
      hinten: fins,
      koerper: body,
      vorne: belly + gill + shine,
      kopf: { x: 100, y: 104, r: 30 },
      schweif: { x: 142, y: 132, winkel: -12 },
      ruecken: { x: 100, y: 82 },
      rumpf: { x: 100, y: 128, r: 42 },
    };
  },

  // --- Insektenartig -------------------------------------------------------
  insekt(p, ctx) {
    const legs = path(
      'M74 138 l-20 14 M74 150 l-18 20 M126 138 l20 14 M126 150 l18 20',
      `stroke="${p.tief}" stroke-width="3" fill="none" stroke-linecap="round"`
    );
    const abdomen = ellipse(100, 146, 32, 32, `fill="${fill(ctx, 'koerper', p.haupt)}" ${stroke(ctx, p)}`);
    const thorax = ellipse(100, 112, 26, 24, `fill="${p.schatten}" ${stroke(ctx, p)}`);
    const segments = ctx.d >= 1
      ? path('M74 146 h52 M78 158 h44', `stroke="${p.tief}" stroke-width="2" opacity="0.45" fill="none"`)
      : '';
    const shine = ctx.d >= 1 ? ellipse(86, 136, 10, 12, `fill="${p.licht}" opacity="0.3"`) : '';
    return {
      hinten: legs,
      koerper: abdomen + thorax,
      vorne: segments + shine,
      kopf: { x: 100, y: 88, r: 22 },
      schweif: { x: 100, y: 176, winkel: 0 },
      ruecken: { x: 100, y: 104 },
      rumpf: { x: 100, y: 140, r: 34 },
    };
  },

  // --- Reptilartig ---------------------------------------------------------
  reptil(p, ctx) {
    const legs =
      path('M66 150 q-14 12 -10 26 h14 q-6 -12 4 -22 z', `fill="${p.schatten}" ${stroke(ctx, p, 2)}`) +
      path('M134 150 q14 12 10 26 h-14 q6 -12 -4 -22 z', `fill="${p.schatten}" ${stroke(ctx, p, 2)}`);
    const body = path(
      'M100 76 c26 0 44 22 44 50 c0 30 -18 48 -44 48 c-26 0 -44 -18 -44 -48 c0 -28 18 -50 44 -50 z',
      `fill="${fill(ctx, 'koerper', p.haupt)}" ${stroke(ctx, p)}`
    );
    const belly = path(
      'M100 112 c14 0 22 14 22 30 c0 16 -8 28 -22 28 c-14 0 -22 -12 -22 -28 c0 -16 8 -30 22 -30 z',
      `fill="${p.bauch}" opacity="0.9"`
    );
    const scales = ctx.d >= 1
      ? path('M86 126 h28 M86 140 h28 M88 154 h24', `stroke="${p.muster}" stroke-width="1.8" opacity="0.4" fill="none"`)
      : '';
    const shine = ctx.d >= 1 ? ellipse(80, 100, 12, 18, `fill="${p.licht}" opacity="0.3"`) : '';
    return {
      hinten: legs,
      koerper: body,
      vorne: belly + scales + shine,
      kopf: { x: 100, y: 86, r: 30 },
      schweif: { x: 142, y: 142, winkel: -22 },
      ruecken: { x: 100, y: 92 },
      rumpf: { x: 100, y: 130, r: 42 },
    };
  },

  // --- Aufrecht (humanoid) -------------------------------------------------
  humanoid(p, ctx) {
    const legs =
      path('M86 158 v20 h-8 v6 h20 v-26 z', `fill="${p.schatten}" ${stroke(ctx, p, 2)}`) +
      path('M114 158 v20 h8 v6 h-20 v-26 z', `fill="${p.schatten}" ${stroke(ctx, p, 2)}`);
    const arms =
      path('M66 118 q-10 22 -4 38 l10 -2 q-4 -18 4 -34 z', `fill="${p.schatten}" ${stroke(ctx, p, 2)}`) +
      path('M134 118 q10 22 4 38 l-10 -2 q4 -18 -4 -34 z', `fill="${p.schatten}" ${stroke(ctx, p, 2)}`);
    const torso = path(
      'M100 90 c22 0 32 16 32 38 c0 24 -10 38 -32 38 c-22 0 -32 -14 -32 -38 c0 -22 10 -38 32 -38 z',
      `fill="${fill(ctx, 'koerper', p.haupt)}" ${stroke(ctx, p)}`
    );
    const chest = ellipse(100, 132, 18, 22, `fill="${p.bauch}" opacity="0.85"`);
    const shine = ctx.d >= 1 ? ellipse(84, 110, 9, 16, `fill="${p.licht}" opacity="0.3"`) : '';
    return {
      hinten: legs + arms,
      koerper: torso,
      vorne: chest + shine,
      kopf: { x: 100, y: 70, r: 26 },
      schweif: { x: 132, y: 150, winkel: -30 },
      ruecken: { x: 100, y: 100 },
      rumpf: { x: 100, y: 126, r: 34 },
    };
  },

  // --- Gallertartig --------------------------------------------------------
  gallert(p, ctx) {
    const body = path(
      'M100 76 c30 0 50 30 50 60 c0 26 -22 40 -50 40 c-28 0 -50 -14 -50 -40 c0 -30 20 -60 50 -60 z',
      `fill="${fill(ctx, 'koerper', p.haupt)}" ${stroke(ctx, p)} opacity="0.92"`
    );
    const inner = ellipse(100, 138, 28, 24, `fill="${p.bauch}" opacity="0.55"`);
    const bubbles = ctx.d >= 1
      ? circle(84, 116, 6, `fill="${p.licht}" opacity="0.55"`) +
        circle(118, 128, 4, `fill="${p.licht}" opacity="0.4"`) +
        circle(106, 104, 3, `fill="${p.licht}" opacity="0.5"`)
      : '';
    const shine = path('M74 104 q10 -18 30 -20 q-22 4 -30 20 z', `fill="${p.licht}" opacity="0.6"`);
    return {
      hinten: '',
      koerper: body,
      vorne: inner + bubbles + shine,
      kopf: { x: 100, y: 108, r: 30 },
      schweif: { x: 144, y: 150, winkel: -10 },
      ruecken: { x: 100, y: 84 },
      rumpf: { x: 100, y: 132, r: 46 },
    };
  },

  // --- Felsartig -----------------------------------------------------------
  fels(p, ctx) {
    const body = path(
      'M56 156 l10 -52 l26 -26 h20 l28 26 l8 52 l-14 20 h-64 z',
      `fill="${fill(ctx, 'koerper', p.haupt)}" ${stroke(ctx, p, 2.8)}`
    );
    const facets = path(
      'M66 104 l34 20 l-8 52 M134 104 l-34 20 l8 52',
      `stroke="${p.tief}" stroke-width="2" fill="none" opacity="0.55"`
    );
    const light = ctx.d >= 1
      ? path('M92 78 l-26 26 l34 20 z', `fill="${p.licht}" opacity="0.28"`)
      : '';
    return {
      hinten: '',
      koerper: body,
      vorne: facets + light,
      kopf: { x: 100, y: 104, r: 28 },
      schweif: { x: 140, y: 160, winkel: -8 },
      ruecken: { x: 100, y: 82 },
      rumpf: { x: 100, y: 134, r: 44 },
    };
  },

  // --- Pflanzenartig -------------------------------------------------------
  pflanze(p, ctx) {
    const pot = path(
      'M74 154 q26 10 52 0 l-6 26 h-40 z',
      `fill="${p.schatten}" ${stroke(ctx, p, 2)}`
    );
    const body = path(
      'M100 82 c24 0 38 20 38 42 c0 24 -16 36 -38 36 c-22 0 -38 -12 -38 -36 c0 -22 14 -42 38 -42 z',
      `fill="${fill(ctx, 'koerper', p.haupt)}" ${stroke(ctx, p)}`
    );
    const leaves =
      path('M100 84 q-26 -20 -34 -2 q14 16 34 2 z', `fill="${p.akzent}" ${stroke(ctx, p, 2)}`) +
      path('M100 84 q26 -20 34 -2 q-14 16 -34 2 z', `fill="${p.akzent}" ${stroke(ctx, p, 2)}`);
    const belly = ellipse(100, 128, 22, 20, `fill="${p.bauch}" opacity="0.85"`);
    const shine = ctx.d >= 1 ? ellipse(84, 102, 10, 14, `fill="${p.licht}" opacity="0.32"`) : '';
    return {
      hinten: pot + leaves,
      koerper: body,
      vorne: belly + shine,
      kopf: { x: 100, y: 106, r: 28 },
      schweif: { x: 138, y: 140, winkel: -30 },
      ruecken: { x: 100, y: 84 },
      rumpf: { x: 100, y: 124, r: 38 },
    };
  },

  // --- Geisterhaft ---------------------------------------------------------
  geist(p, ctx) {
    const body = path(
      'M100 66 c28 0 44 24 44 52 c0 22 -6 38 -12 50 q-10 -12 -16 -2 q-6 10 -16 0 q-10 10 -16 2 q-14 -18 -20 -34 c-6 -18 8 -68 36 -68 z',
      `fill="${fill(ctx, 'koerper', p.haupt)}" ${stroke(ctx, p)} opacity="0.94"`
    );
    const inner = ellipse(100, 116, 24, 26, `fill="${p.bauch}" opacity="0.4"`);
    const wisp = ctx.d >= 1
      ? path('M76 96 q10 -20 28 -22 q-20 6 -28 22 z', `fill="${p.licht}" opacity="0.5"`)
      : '';
    return {
      hinten: '',
      koerper: body,
      vorne: inner + wisp,
      kopf: { x: 100, y: 98, r: 30 },
      schweif: { x: 100, y: 168, winkel: 0 },
      ruecken: { x: 100, y: 74 },
      rumpf: { x: 100, y: 120, r: 42 },
    };
  },
};

/** Zeichnet den Körper einer Form. Unbekannte Formen fallen auf „rund" zurück. */
export function drawBody(shape, p, ctx) {
  return (BODIES[shape] || BODIES.rund)(p, ctx);
}

export const BODY_SHAPES = Object.keys(BODIES);

// ---------------------------------------------------------------------------
// Ohren
// ---------------------------------------------------------------------------

const EARS = {
  keine: () => '',
  spitz: (k, p, ctx) =>
    path(
      `M${num(k.x - k.r * 0.62)} ${num(k.y - k.r * 0.6)} l-6 -26 l22 12 z`,
      `class="pet-ear" fill="${p.haupt}" ${stroke(ctx, p, 2)}`
    ) +
    path(
      `M${num(k.x + k.r * 0.62)} ${num(k.y - k.r * 0.6)} l6 -26 l-22 12 z`,
      `class="pet-ear" fill="${p.haupt}" ${stroke(ctx, p, 2)}`
    ),
  rund: (k, p, ctx) =>
    circle(k.x - k.r * 0.72, k.y - k.r * 0.66, 11, `class="pet-ear" fill="${p.haupt}" ${stroke(ctx, p, 2)}`) +
    circle(k.x + k.r * 0.72, k.y - k.r * 0.66, 11, `class="pet-ear" fill="${p.haupt}" ${stroke(ctx, p, 2)}`),
  lang: (k, p, ctx) =>
    ellipse(k.x - k.r * 0.5, k.y - k.r * 1.15, 8, 24, `class="pet-ear" fill="${p.haupt}" ${stroke(ctx, p, 2)}`) +
    ellipse(k.x + k.r * 0.5, k.y - k.r * 1.15, 8, 24, `class="pet-ear" fill="${p.haupt}" ${stroke(ctx, p, 2)}`) +
    ellipse(k.x - k.r * 0.5, k.y - k.r * 1.15, 4, 16, `fill="${p.bauch}" opacity="0.8"`) +
    ellipse(k.x + k.r * 0.5, k.y - k.r * 1.15, 4, 16, `fill="${p.bauch}" opacity="0.8"`),
  feder: (k, p, ctx) =>
    path(
      `M${num(k.x - k.r * 0.5)} ${num(k.y - k.r * 0.8)} q-14 -22 4 -26 q6 14 4 26 z`,
      `class="pet-ear" fill="${p.akzent}" ${stroke(ctx, p, 1.8)}`
    ) +
    path(
      `M${num(k.x + k.r * 0.5)} ${num(k.y - k.r * 0.8)} q14 -22 -4 -26 q-6 14 -4 26 z`,
      `class="pet-ear" fill="${p.akzent}" ${stroke(ctx, p, 1.8)}`
    ),
  horn: (k, p, ctx) =>
    path(
      `M${num(k.x - k.r * 0.55)} ${num(k.y - k.r * 0.7)} q-6 -26 8 -32 q2 20 6 30 z`,
      `class="pet-ear" fill="${p.akzent}" ${stroke(ctx, p, 2)}`
    ) +
    path(
      `M${num(k.x + k.r * 0.55)} ${num(k.y - k.r * 0.7)} q6 -26 -8 -32 q-2 20 -6 30 z`,
      `class="pet-ear" fill="${p.akzent}" ${stroke(ctx, p, 2)}`
    ),
};

export function drawEars(type, kopf, p, ctx) {
  return (EARS[type] || EARS.keine)(kopf, p, ctx);
}

// ---------------------------------------------------------------------------
// Schweife
// ---------------------------------------------------------------------------

const TAILS = {
  keine: () => '',
  flauschig: (a, p, ctx) =>
    path(
      `M${num(a.x)} ${num(a.y)} q34 -6 30 -34 q14 26 -8 44 q-16 12 -24 -4 z`,
      `class="pet-tail" fill="${p.haupt}" ${stroke(ctx, p, 2)}`
    ),
  duenn: (a, p, ctx) =>
    path(
      `M${num(a.x)} ${num(a.y)} q30 4 34 -26`,
      `class="pet-tail" fill="none" stroke="${p.haupt}" stroke-width="7" stroke-linecap="round"`
    ),
  flamme: (a, p, ctx) =>
    path(
      `M${num(a.x)} ${num(a.y)} q26 0 30 -22 q10 20 -4 34 q-6 18 -22 8 q-12 -8 -4 -20 z`,
      `class="pet-tail" fill="${p.akzent}" ${stroke(ctx, p, 2)}`
    ) +
    path(
      `M${num(a.x + 12)} ${num(a.y - 4)} q14 -2 16 -14 q4 12 -4 20 q-10 6 -12 -6 z`,
      `class="pet-tail" fill="${p.licht}" opacity="0.85"`
    ),
  flosse: (a, p, ctx) =>
    path(
      `M${num(a.x)} ${num(a.y)} q28 -18 34 -30 q6 30 -6 46 q-18 4 -28 -16 z`,
      `class="pet-tail" fill="${p.akzent}" ${stroke(ctx, p, 2)}`
    ),
  blatt: (a, p, ctx) =>
    path(
      `M${num(a.x)} ${num(a.y)} q26 -10 34 -32 q8 24 -8 38 q-16 12 -26 -6 z`,
      `class="pet-tail" fill="${p.akzent}" ${stroke(ctx, p, 2)}`
    ) +
    path(
      `M${num(a.x + 6)} ${num(a.y - 4)} q16 -6 24 -22`,
      `class="pet-tail" stroke="${p.tief}" stroke-width="1.6" fill="none" opacity="0.6"`
    ),
  blitz: (a, p, ctx) =>
    path(
      `M${num(a.x)} ${num(a.y)} l18 -10 l-8 -12 l24 -16 l-6 18 l10 -2 l-24 26 z`,
      `class="pet-tail" fill="${p.akzent}" ${stroke(ctx, p, 2)}`
    ),
  kristall: (a, p, ctx) =>
    path(
      `M${num(a.x)} ${num(a.y)} l14 -12 l6 12 l12 -20 l6 22 l-24 16 z`,
      `class="pet-tail" fill="${p.akzent}" ${stroke(ctx, p, 2)} opacity="0.92"`
    ),
  nebel: (a, p, ctx) =>
    path(
      `M${num(a.x)} ${num(a.y)} q26 4 28 -20 q10 22 -6 34 q-18 10 -22 -14 z`,
      `class="pet-tail" fill="${p.akzent}" opacity="0.55"`
    ),
};

export function drawTail(type, anchor, p, ctx) {
  return (TAILS[type] || TAILS.keine)(anchor, p, ctx);
}

// ---------------------------------------------------------------------------
// Augen
// ---------------------------------------------------------------------------

const EYES = {
  rund: (k, p, ctx) => eyePair(k, p, ctx, 7, 7),
  gross: (k, p, ctx) => eyePair(k, p, ctx, 10, 11),
  schmal: (k, p, ctx) => eyePair(k, p, ctx, 8, 4.5),
  leuchtend: (k, p, ctx) => eyePair(k, p, ctx, 8, 8, true),
  facette: (k, p, ctx) => {
    const dx = k.r * 0.42;
    const face = (cx) =>
      path(
        `M${num(cx - 9)} ${num(k.y - 2)} q9 -12 18 0 q-9 14 -18 0 z`,
        `class="pet-eye" fill="${p.auge}" ${stroke(ctx, p, 1.6)}`
      ) + path(`M${num(cx - 5)} ${num(k.y - 3)} q5 -5 10 0`, `stroke="${p.licht}" stroke-width="1.6" fill="none"`);
    return face(k.x - dx) + face(k.x + dx);
  },
  geschlossen: (k, p) => {
    const dx = k.r * 0.42;
    const lid = (cx) =>
      path(`M${num(cx - 8)} ${num(k.y)} q8 7 16 0`, `stroke="${p.pupille}" stroke-width="2.6" fill="none" stroke-linecap="round"`);
    return lid(k.x - dx) + lid(k.x + dx);
  },
};

/**
 * Augenpaar: weiße Lederhaut, kräftige Iris, dunkle Pupille, ein Glanzpunkt.
 * Die Lederhaut bleibt immer weiß — nur so heben sich die Augen auch bei
 * gelben oder weißen Kreaturen deutlich vom Kopf ab.
 */
function eyePair(k, p, ctx, rx, ry, glow = false) {
  const dx = k.r * 0.42;
  const one = (cx) => {
    const glowRing = glow && ctx.d >= 1 ? ellipse(cx, k.y, rx + 4, ry + 4, `fill="${p.glanz}" opacity="0.35"`) : '';
    return (
      glowRing +
      ellipse(cx, k.y, rx, ry, `class="pet-eye" fill="#ffffff" ${stroke(ctx, p, 1.4)}`) +
      ellipse(cx, k.y + ry * 0.06, rx * 0.68, ry * 0.8, `class="pet-eye" fill="${p.iris}"`) +
      ellipse(cx, k.y + ry * 0.1, rx * 0.38, ry * 0.5, `class="pet-eye" fill="${p.pupille}"`) +
      circle(cx - rx * 0.3, k.y - ry * 0.36, Math.max(1.4, rx * 0.22), `fill="#ffffff" opacity="0.95"`)
    );
  };
  return one(k.x - dx) + one(k.x + dx);
}

export function drawEyes(type, kopf, p, ctx) {
  return (EYES[type] || EYES.rund)(kopf, p, ctx);
}

/** Kleiner Mund — gibt dem Gesicht Ausdruck, abhängig von der Stimmung. */
export function drawMouth(kopf, p, mood = 'normal') {
  const y = kopf.y + kopf.r * 0.42;
  if (mood === 'traurig') {
    return path(`M${num(kopf.x - 8)} ${num(y + 3)} q8 -7 16 0`, `stroke="${p.pupille}" stroke-width="2.2" fill="none" stroke-linecap="round"`);
  }
  if (mood === 'schlafend') {
    return path(`M${num(kopf.x - 5)} ${num(y)} q5 5 10 0`, `stroke="${p.pupille}" stroke-width="2" fill="none" stroke-linecap="round"`);
  }
  if (mood === 'begeistert') {
    return path(`M${num(kopf.x - 9)} ${num(y - 2)} q9 12 18 0 q-9 5 -18 0 z`, `fill="${p.pupille}" opacity="0.85"`);
  }
  return path(`M${num(kopf.x - 7)} ${num(y)} q7 6 14 0`, `stroke="${p.pupille}" stroke-width="2.2" fill="none" stroke-linecap="round"`);
}

// ---------------------------------------------------------------------------
// Muster
// ---------------------------------------------------------------------------

const PATTERNS = {
  keine: () => '',
  flecken: (r, p) =>
    ellipse(r.x - 20, r.y - 6, 9, 7, `fill="${p.muster}" opacity="0.55"`) +
    ellipse(r.x + 16, r.y + 10, 7, 6, `fill="${p.muster}" opacity="0.5"`) +
    ellipse(r.x + 2, r.y - 18, 6, 5, `fill="${p.muster}" opacity="0.45"`),
  streifen: (r, p) =>
    path(
      `M${num(r.x - 26)} ${num(r.y - 10)} q26 -8 52 0 M${num(r.x - 24)} ${num(r.y + 6)} q24 -8 48 0 M${num(r.x - 18)} ${num(r.y + 20)} q18 -6 36 0`,
      `stroke="${p.muster}" stroke-width="4" fill="none" opacity="0.5" stroke-linecap="round"`
    ),
  punkte: (r, p) =>
    [-18, 0, 18]
      .map((dx, i) => circle(r.x + dx, r.y - 8 + (i % 2) * 18, 4, `fill="${p.muster}" opacity="0.5"`))
      .join(''),
  wirbel: (r, p) =>
    path(
      `M${num(r.x - 14)} ${num(r.y)} q14 -18 28 0 q-10 16 -22 6 q-4 -8 8 -10`,
      `stroke="${p.muster}" stroke-width="3" fill="none" opacity="0.55" stroke-linecap="round"`
    ),
  sterne: (r, p) =>
    [[-20, -10], [14, 4], [0, 18]]
      .map(([dx, dy]) => star(r.x + dx, r.y + dy, 5, `fill="${p.muster}" opacity="0.6"`))
      .join(''),
  bluete: (r, p) =>
    [0, 72, 144, 216, 288]
      .map((a) => {
        const rad = (a * Math.PI) / 180;
        return ellipse(r.x + Math.cos(rad) * 12, r.y + Math.sin(rad) * 12, 6, 4, `fill="${p.muster}" opacity="0.5" transform="rotate(${a} ${num(r.x + Math.cos(rad) * 12)} ${num(r.y + Math.sin(rad) * 12)})"`);
      })
      .join(''),
};

export function drawPattern(type, rumpf, p, _ctx) {
  return (PATTERNS[type] || PATTERNS.keine)(rumpf, p);
}

/** Fünfzackiger Stern als Pfad. */
export function star(cx, cy, r, attrs = '') {
  const points = [];
  for (let i = 0; i < 10; i += 1) {
    const radius = i % 2 === 0 ? r : r * 0.45;
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    points.push(`${num(cx + Math.cos(angle) * radius)},${num(cy + Math.sin(angle) * radius)}`);
  }
  return `<polygon points="${points.join(' ')}" ${attrs}/>`;
}

// ---------------------------------------------------------------------------
// Besondere Anbauten
// ---------------------------------------------------------------------------

const EXTRAS = {
  keine: () => ({ hinten: '', vorne: '' }),

  fluegel: (g, p, ctx) => ({
    hinten: wingPair(g.ruecken, p, ctx, 0.62),
    vorne: '',
  }),

  grossfluegel: (g, p, ctx) => ({
    hinten: wingPair(g.ruecken, p, ctx, 1),
    vorne: '',
  }),

  hoerner: (g, p, ctx) => ({
    hinten: '',
    vorne:
      path(
        `M${num(g.kopf.x - g.kopf.r * 0.6)} ${num(g.kopf.y - g.kopf.r * 0.55)} q-14 -20 -2 -32 q14 12 12 30 z`,
        `fill="${p.akzent}" ${stroke(ctx, p, 2)}`
      ) +
      path(
        `M${num(g.kopf.x + g.kopf.r * 0.6)} ${num(g.kopf.y - g.kopf.r * 0.55)} q14 -20 2 -32 q-14 12 -12 30 z`,
        `fill="${p.akzent}" ${stroke(ctx, p, 2)}`
      ),
  }),

  kamm: (g, p, ctx) => ({
    hinten: '',
    vorne: path(
      `M${num(g.kopf.x - 16)} ${num(g.kopf.y - g.kopf.r * 0.86)} l6 -18 l6 12 l6 -20 l6 16 l6 -12 l4 20 z`,
      `fill="${p.akzent}" ${stroke(ctx, p, 1.8)}`
    ),
  }),

  maehne: (g, p, ctx) => ({
    hinten: path(
      `M${num(g.kopf.x)} ${num(g.kopf.y)} m-${num(g.kopf.r + 8)} 0 a${num(g.kopf.r + 12)} ${num(g.kopf.r + 12)} 0 1 0 ${num((g.kopf.r + 8) * 2)} 0 a${num(g.kopf.r + 12)} ${num(g.kopf.r + 12)} 0 1 0 -${num((g.kopf.r + 8) * 2)} 0 z`,
      `fill="${p.akzent}" ${stroke(ctx, p, 2)} opacity="0.9"`
    ),
    vorne: '',
  }),

  panzer: (g, p, ctx) => ({
    hinten: '',
    vorne:
      path(
        `M${num(g.rumpf.x - 34)} ${num(g.rumpf.y - 6)} q34 -26 68 0 q-4 30 -34 34 q-30 -4 -34 -34 z`,
        `fill="${p.schatten}" ${stroke(ctx, p, 2.2)} opacity="0.95"`
      ) +
      path(
        `M${num(g.rumpf.x - 20)} ${num(g.rumpf.y - 2)} q20 -12 40 0 M${num(g.rumpf.x - 14)} ${num(g.rumpf.y + 12)} q14 -8 28 0`,
        `stroke="${p.tief}" stroke-width="2" fill="none" opacity="0.5"`
      ),
  }),

  kristalle: (g, p, ctx) => ({
    hinten: '',
    vorne:
      path(
        `M${num(g.rumpf.x - 32)} ${num(g.rumpf.y - 16)} l8 -22 l10 20 z`,
        `fill="${p.akzent}" ${stroke(ctx, p, 1.6)} opacity="0.9"`
      ) +
      path(
        `M${num(g.rumpf.x + 20)} ${num(g.rumpf.y - 20)} l10 -26 l10 24 z`,
        `fill="${p.licht}" ${stroke(ctx, p, 1.6)} opacity="0.9"`
      ) +
      path(
        `M${num(g.rumpf.x - 6)} ${num(g.rumpf.y - 26)} l7 -18 l8 16 z`,
        `fill="${p.akzent}" ${stroke(ctx, p, 1.6)} opacity="0.85"`
      ),
  }),

  bluete: (g, p, ctx) => ({
    hinten: '',
    vorne:
      [0, 72, 144, 216, 288]
        .map((a) => {
          const rad = (a * Math.PI) / 180;
          const cx = g.kopf.x + Math.cos(rad) * 16;
          const cy = g.kopf.y - g.kopf.r * 0.95 + Math.sin(rad) * 10;
          return ellipse(cx, cy, 9, 6, `fill="${p.akzent}" ${stroke(ctx, p, 1.4)} transform="rotate(${a} ${num(cx)} ${num(cy)})"`);
        })
        .join('') + circle(g.kopf.x, g.kopf.y - g.kopf.r * 0.95, 6, `fill="${p.licht}" ${stroke(ctx, p, 1.4)}`),
  }),

  tentakel: (g, p, ctx) => ({
    hinten: [-26, -10, 8, 24]
      .map((dx, i) =>
        path(
          `M${num(g.rumpf.x + dx)} ${num(g.rumpf.y + 18)} q${i % 2 ? 8 : -8} 22 ${i % 2 ? -4 : 4} 34`,
          `stroke="${p.akzent}" stroke-width="6" fill="none" stroke-linecap="round" opacity="0.85"`
        )
      )
      .join(''),
    vorne: '',
  }),

  schwebe: (g, p) => ({
    hinten: ellipse(g.rumpf.x, GROUND_Y - 2, 34, 7, `fill="${p.tief}" opacity="0.25"`),
    vorne: '',
  }),

  aura: (g, p, ctx) => ({
    hinten: circle(
      g.rumpf.x,
      g.rumpf.y - 6,
      g.rumpf.r + 16,
      `class="pet-aura" fill="${ctx.d >= 1 ? `url(#${ctx.id}-aura)` : p.glanz}" opacity="0.4"`
    ),
    vorne: '',
  }),

  ringe: (g, p, ctx) => ({
    hinten:
      `<g class="pet-orbit">` +
      ellipse(g.rumpf.x, g.rumpf.y - 8, g.rumpf.r + 22, 14, `fill="none" stroke="${p.glanz}" stroke-width="3" opacity="0.65"`) +
      ellipse(g.rumpf.x, g.rumpf.y - 8, g.rumpf.r + 14, 9, `fill="none" stroke="${p.licht}" stroke-width="2" opacity="0.5"`) +
      `</g>`,
    vorne:
      ctx.d >= 2
        ? `<g class="pet-orbit">` +
          circle(g.rumpf.x + g.rumpf.r + 20, g.rumpf.y - 8, 3.5, `fill="${p.licht}"`) +
          circle(g.rumpf.x - g.rumpf.r - 16, g.rumpf.y - 4, 2.5, `fill="${p.glanz}"`) +
          `</g>`
        : '',
  }),

  nebel: (g, p) => ({
    hinten:
      ellipse(g.rumpf.x - 16, g.rumpf.y + 26, 24, 9, `fill="${p.akzent}" opacity="0.28"`) +
      ellipse(g.rumpf.x + 18, g.rumpf.y + 34, 20, 7, `fill="${p.akzent}" opacity="0.22"`),
    vorne: '',
  }),
};

/**
 * Ein Schwingenpaar mit gefiedertem Saum.
 * Der Umriss läuft vom Ansatz nach hinten oben und kommt über drei Federbögen
 * zurück — dadurch wirkt die Silhouette wie eine Schwinge und nicht wie ein Ohr.
 * @param {{x:number,y:number}} anchor Rückenansatz
 * @param {number} scale 1 = große Schwinge, kleiner = Stummelflügel
 */
function wingPair(anchor, p, ctx, scale = 1) {
  const wing = (dir) => {
    const x = anchor.x + dir * 10;
    const y = anchor.y + 2;
    const l = 74 * scale; // Länge nach hinten
    const h = 46 * scale; // Höhe nach oben
    const d = [
      `M${num(x)} ${num(y)}`,
      `C${num(x - dir * l * 0.3)} ${num(y - h)} ${num(x - dir * l * 0.82)} ${num(y - h * 0.92)} ${num(x - dir * l)} ${num(y - h * 0.24)}`,
      `C${num(x - dir * l * 0.94)} ${num(y + h * 0.14)} ${num(x - dir * l * 0.86)} ${num(y + h * 0.1)} ${num(x - dir * l * 0.8)} ${num(y + h * 0.3)}`,
      `C${num(x - dir * l * 0.72)} ${num(y + h * 0.12)} ${num(x - dir * l * 0.62)} ${num(y + h * 0.16)} ${num(x - dir * l * 0.54)} ${num(y + h * 0.38)}`,
      `C${num(x - dir * l * 0.46)} ${num(y + h * 0.18)} ${num(x - dir * l * 0.34)} ${num(y + h * 0.22)} ${num(x - dir * l * 0.26)} ${num(y + h * 0.42)}`,
      `C${num(x - dir * l * 0.18)} ${num(y + h * 0.24)} ${num(x - dir * l * 0.08)} ${num(y + h * 0.2)} ${num(x)} ${num(y)}`,
      'Z',
    ].join(' ');

    const federn = [0.32, 0.58, 0.82]
      .map(
        (t) =>
          `M${num(x - dir * l * t * 0.35)} ${num(y - h * 0.06)} Q${num(x - dir * l * t * 0.7)} ${num(y - h * 0.3)} ${num(x - dir * l * t)} ${num(y - h * 0.1)}`
      )
      .join(' ');

    return (
      path(d, `class="pet-wing" fill="${fill(ctx, 'fluegel', p.akzent)}" ${stroke(ctx, p, 2)}`) +
      path(federn, `stroke="${p.tief}" stroke-width="1.5" fill="none" opacity="0.4"`)
    );
  };

  return wing(1) + wing(-1);
}

export function drawExtra(type, geometry, p, ctx) {
  return (EXTRAS[type] || EXTRAS.keine)(geometry, p, ctx);
}

export const EXTRA_TYPES = Object.keys(EXTRAS);
