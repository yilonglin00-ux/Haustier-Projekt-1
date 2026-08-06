#!/usr/bin/env node
/**
 * tools/kontaktbogen.js — Zeichnet alle Kreaturen auf eine Seite.
 *
 * Prüfwerkzeug für die Kunst-Pipeline: zeigt jede Art nach Seltenheit sortiert,
 * damit auf einen Blick erkennbar ist, ob seltene Haustiere aufwendiger
 * aussehen als gewöhnliche — und ob keine Zeichnung kaputt ist.
 *
 *   node tools/kontaktbogen.js [ausgabedatei]
 */

import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { SPECIES } from '../src/data/species.js';
import { RARITY_ORDER, RARITIES, VARIANT_ORDER } from '../src/data/rarity.js';
import { spriteMarkup } from '../src/render/petSprite.js';
import { hasCustomArt } from '../src/render/art/index.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = process.argv[2] || resolve(ROOT, 'dist/kontaktbogen.html');

function card(entry, variante = 'normal') {
  const ra = RARITIES[entry.rarity];
  const marke = hasCustomArt(entry.id) ? '✍️ handgezeichnet' : ra.kunst;
  return `<figure class="k" style="--c:${ra.farbe}">
    <div class="art">${spriteMarkup({ artId: entry.id, variante })}</div>
    <figcaption>
      <b>${entry.name}</b>
      <span>${ra.symbol} ${ra.name} · Stufe ${entry.stufe}</span>
      <em>${marke}</em>
    </figcaption>
  </figure>`;
}

const sections = RARITY_ORDER.map((id) => {
  const list = SPECIES.filter((entry) => entry.rarity === id);
  return `<h2>${RARITIES[id].symbol} ${RARITIES[id].name} <small>(${list.length})</small></h2>
    <div class="grid">${list.map((entry) => card(entry)).join('')}</div>`;
}).join('');

const variants = `<h2>Farbvarianten am Beispiel Flammkitz</h2><div class="grid">${VARIANT_ORDER.map(
  (v) => card(SPECIES.find((e) => e.id === 'flammkitz'), v)
).join('')}</div>`;

const html = `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8">
<title>Kontaktbogen — alle Kreaturen</title>
<style>
  body{font-family:system-ui,sans-serif;background:#0e1220;color:#eaeefb;margin:0;padding:24px}
  h1{margin:0 0 8px}
  h2{margin:32px 0 12px;font-size:1.1rem;border-bottom:1px solid #2e3859;padding-bottom:6px}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:14px}
  .k{margin:0;background:#171d31;border:1px solid var(--c);border-radius:16px;padding:8px;text-align:center}
  .art{aspect-ratio:1;display:grid;place-items:center}
  .art svg{width:100%;height:100%;overflow:visible}
  figcaption{display:flex;flex-direction:column;gap:2px;font-size:.74rem}
  figcaption b{font-size:.86rem}
  figcaption span{color:var(--c)}
  figcaption em{color:#6f7a99;font-style:normal;font-size:.66rem}
</style></head><body>
<h1>Kontaktbogen — ${SPECIES.length} Kreaturen</h1>
<p style="color:#a7b1cd">Sortiert nach Seltenheit. Je seltener, desto aufwendiger die Darstellung.</p>
${sections}
${variants}
</body></html>`;

writeFileSync(OUT, html, 'utf8');
console.log(`✅ Kontaktbogen geschrieben: ${OUT} (${SPECIES.length} Kreaturen)`);
