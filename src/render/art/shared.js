/**
 * shared.js — Werkzeug für die handgezeichneten Illustrationen.
 *
 * Die Illustrationen in diesem Ordner zeichnen ihre Kreatur vollständig selbst.
 * Sie liefern dasselbe Ergebnis-Objekt wie der Bauteil-Zeichner, damit
 * Kleidung, Animationen und Fotomodus unverändert funktionieren:
 *
 *   { hinten, koerper, vorne, kopf, rumpf, ruecken }
 */

const num = (n) => Math.round(n * 100) / 100;

/** Pfad. */
export function P(d, attrs = '') {
  return `<path d="${d}" ${attrs}/>`;
}

/** Kreis. */
export function C(cx, cy, r, attrs = '') {
  return `<circle cx="${num(cx)}" cy="${num(cy)}" r="${num(r)}" ${attrs}/>`;
}

/** Ellipse. */
export function E(cx, cy, rx, ry, attrs = '') {
  return `<ellipse cx="${num(cx)}" cy="${num(cy)}" rx="${num(rx)}" ry="${num(ry)}" ${attrs}/>`;
}

/** Gruppe. */
export function G(klasse, inhalt, attrs = '') {
  return `<g class="${klasse}" ${attrs}>${inhalt}</g>`;
}

/** Standard-Umriss der Illustrationen — etwas feiner als bei den Bauteilen. */
export function line(p, width = 2.1) {
  return `stroke="${p.umriss}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round"`;
}

/** Körperfüllung mit dem Verlauf, den petSprite.js bereitstellt. */
export function bodyFill(ctx) {
  return `url(#${ctx.id}-koerper)`;
}

export function headFill(ctx) {
  return `url(#${ctx.id}-kopf)`;
}

export function wingFill(ctx) {
  return `url(#${ctx.id}-fluegel)`;
}

/**
 * Augenpaar im Illustrations-Stil: Iris mit Verlaufsandeutung, zwei Glanzpunkte,
 * feine Lidkante. Deutlich aufwendiger als die Bauteil-Variante.
 */
export function eyes(cx, cy, dx, p, { rx = 9, ry = 10, leuchten = true } = {}) {
  const one = (x) =>
    (leuchten ? E(x, cy, rx + 5, ry + 5, `fill="${p.glanz}" opacity="0.3"`) : '') +
    E(x, cy, rx, ry, `class="pet-eye" fill="#ffffff" stroke="${p.umriss}" stroke-width="1.6"`) +
    E(x, cy + ry * 0.06, rx * 0.7, ry * 0.82, `class="pet-eye" fill="${p.iris}"`) +
    E(x, cy + ry * 0.12, rx * 0.4, ry * 0.54, `class="pet-eye" fill="${p.pupille}"`) +
    C(x - rx * 0.32, cy - ry * 0.38, rx * 0.26, `fill="#ffffff" opacity="0.95"`) +
    C(x + rx * 0.3, cy + ry * 0.3, rx * 0.14, `fill="#ffffff" opacity="0.65"`) +
    P(`M${num(x - rx)} ${num(cy - ry * 0.72)} q${num(rx)} ${num(-ry * 0.5)} ${num(rx * 2)} 0`, `stroke="${p.umriss}" stroke-width="1.8" fill="none" opacity="0.55"`);
  return one(cx - dx) + one(cx + dx);
}

/** Weiche Innenzeichnung: hebt eine Fläche plastisch hervor. */
export function sheen(cx, cy, rx, ry, p, opacity = 0.34, rotate = 0) {
  const t = rotate ? ` transform="rotate(${rotate} ${num(cx)} ${num(cy)})"` : '';
  return `<ellipse cx="${num(cx)}" cy="${num(cy)}" rx="${num(rx)}" ry="${num(ry)}" fill="${p.licht}" opacity="${opacity}"${t}/>`;
}

/** Fünfzackiger Stern. */
export function star(cx, cy, r, attrs = '') {
  const points = [];
  for (let i = 0; i < 10; i += 1) {
    const radius = i % 2 === 0 ? r : r * 0.42;
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    points.push(`${num(cx + Math.cos(angle) * radius)},${num(cy + Math.sin(angle) * radius)}`);
  }
  return `<polygon points="${points.join(' ')}" ${attrs}/>`;
}

/** Kranz kleiner Lichtpunkte um einen Mittelpunkt. */
export function halo(cx, cy, r, count, p, size = 2.4) {
  let out = '';
  for (let i = 0; i < count; i += 1) {
    const angle = (Math.PI * 2 * i) / count;
    out += C(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r * 0.55, size, `fill="${p.licht}" opacity="0.8"`);
  }
  return G('pet-orbit', out);
}

/** Zackiger Flammensaum — für Feuerwesen. */
export function flameEdge(cx, cy, r, p, zacken = 9) {
  let d = '';
  for (let i = 0; i <= zacken; i += 1) {
    const a = Math.PI + (Math.PI * i) / zacken;
    const outer = i % 2 === 0 ? r * 1.24 : r * 1.04;
    d += `${i === 0 ? 'M' : 'L'}${num(cx + Math.cos(a) * outer)} ${num(cy + Math.sin(a) * outer)}`;
  }
  return P(d + ' Z', `fill="${p.akzent}" opacity="0.85"`);
}
