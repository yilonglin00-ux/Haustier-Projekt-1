#!/usr/bin/env node
/**
 * build.js — Bündelt das Spiel in eine einzige, eigenständige `dist/index.html`.
 *
 * Warum ein eigener Bundler?
 * Das Spiel soll ohne jede Installation laufen — auch ohne `npm install`. Deshalb
 * kommt dieses Skript ohne Abhängigkeiten aus. Es ist bewusst klein gehalten und
 * versteht nur den Modul-Stil, den dieses Projekt verwendet (siehe unten).
 *
 * Unterstützter Import-/Export-Stil (bewusst eingeschränkt, damit die Analyse
 * ohne echten JS-Parser zuverlässig bleibt):
 *
 *   import { a, b as c } from './pfad.js';
 *   import * as ns       from './pfad.js';
 *   import './pfad.js';
 *   export function foo() {}
 *   export const  BAR = 1;
 *   export class  Baz {}
 *   export { a, b as c };
 *
 * `import`/`export` müssen dabei am Zeilenanfang stehen und die Anweisung muss auf
 * einer einzigen Zeile abgeschlossen sein. Verstöße melden wir mit klarer Fehlermeldung.
 *
 * Jedes Modul wird in eine eigene Factory-Funktion gewickelt und über eine winzige
 * `__require`-Laufzeit geladen. Dadurch gibt es keine Namenskollisionen zwischen
 * Modulen, und die Ausführungsreihenfolge ergibt sich automatisch (lazy + memoisiert).
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve, relative, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const ENTRY = resolve(ROOT, 'src/main.js');
const HTML_TEMPLATE = resolve(ROOT, 'index.html');
const OUT_DIR = resolve(ROOT, 'dist');
const OUT_FILE = join(OUT_DIR, 'index.html');

const CHECK_ONLY = process.argv.includes('--check');

// ---------------------------------------------------------------------------
// Modul-Analyse
// ---------------------------------------------------------------------------

/** Kennung eines Moduls im Bundle: Pfad relativ zum Projektstamm, immer mit "/". */
function moduleId(absPath) {
  return relative(ROOT, absPath).split('\\').join('/');
}

const RE_IMPORT_NAMED = /^import\s+\{([^}]*)\}\s+from\s+['"]([^'"]+)['"];?\s*$/;
const RE_IMPORT_NS = /^import\s+\*\s+as\s+([A-Za-z_$][\w$]*)\s+from\s+['"]([^'"]+)['"];?\s*$/;
const RE_IMPORT_BARE = /^import\s+['"]([^'"]+)['"];?\s*$/;
const RE_IMPORT_ANY = /^import\s/;
const RE_EXPORT_DECL = /^export\s+(async\s+function|function|const|let|var|class)\s+([A-Za-z_$][\w$]*)/;
const RE_EXPORT_LIST = /^export\s*\{([^}]*)\};?\s*$/;
const RE_EXPORT_ANY = /^export\s/;

/**
 * Liest ein Modul, ersetzt import/export durch die Laufzeit-Entsprechungen und
 * liefert Quelltext plus Liste der importierten Dateien zurück.
 */
/**
 * Fasst mehrzeilige Import-Anweisungen zu einer Zeile zusammen.
 *
 *   import {
 *     a,
 *     b,
 *   } from './x.js';
 *
 * wird zu `import { a, b } from './x.js';`. Die entfallenden Zeilen bleiben als
 * Leerzeilen stehen, damit Zeilennummern in Fehlermeldungen weiter stimmen.
 */
function normalizeImports(source) {
  const lines = source.split('\n');
  const out = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const beginnt = /^import\s/.test(line);
    const vollstaendig = /from\s+['"][^'"]+['"];?\s*$/.test(line) || /^import\s+['"][^'"]+['"];?\s*$/.test(line);

    if (!beginnt || vollstaendig) {
      out.push(line);
      continue;
    }

    // Zeilen sammeln, bis die Anweisung abgeschlossen ist.
    const teile = [line];
    let j = i;
    while (j + 1 < lines.length && !/from\s+['"][^'"]+['"];?\s*$/.test(lines[j])) {
      j += 1;
      teile.push(lines[j]);
    }

    out.push(teile.join(' ').replace(/\s+/g, ' ').trim());
    for (let k = i + 1; k <= j; k += 1) out.push('');
    i = j;
  }

  return out.join('\n');
}

function transformModule(absPath) {
  const source = normalizeImports(readFileSync(absPath, 'utf8'));
  const dir = dirname(absPath);
  const deps = [];
  const exportedNames = new Set();
  const out = [];

  source.split('\n').forEach((line, index) => {
    const where = `${moduleId(absPath)}:${index + 1}`;

    // --- Imports ---------------------------------------------------------
    if (RE_IMPORT_ANY.test(line)) {
      let m;
      if ((m = line.match(RE_IMPORT_NAMED))) {
        const spec = resolveSpecifier(dir, m[2], where);
        deps.push(spec);
        // "a, b as c" -> "a, b: c"
        const bindings = m[1]
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .map((s) => s.replace(/\s+as\s+/, ': '))
          .join(', ');
        out.push(`const { ${bindings} } = __require(${JSON.stringify(moduleId(spec))});`);
        return;
      }
      if ((m = line.match(RE_IMPORT_NS))) {
        const spec = resolveSpecifier(dir, m[2], where);
        deps.push(spec);
        out.push(`const ${m[1]} = __require(${JSON.stringify(moduleId(spec))});`);
        return;
      }
      if ((m = line.match(RE_IMPORT_BARE))) {
        const spec = resolveSpecifier(dir, m[1], where);
        deps.push(spec);
        out.push(`__require(${JSON.stringify(moduleId(spec))});`);
        return;
      }
      throw new Error(
        `${where}: Import-Stil wird nicht unterstützt.\n  ${line.trim()}\n` +
          `  Erlaubt sind einzeilige Imports der Form:\n` +
          `    import { a, b as c } from './x.js';\n` +
          `    import * as ns from './x.js';\n` +
          `    import './x.js';`
      );
    }

    // --- Exports ---------------------------------------------------------
    if (RE_EXPORT_ANY.test(line)) {
      let m;
      if ((m = line.match(RE_EXPORT_DECL))) {
        exportedNames.add(m[2]);
        out.push(line.replace(/^export\s+/, ''));
        return;
      }
      if ((m = line.match(RE_EXPORT_LIST))) {
        m[1]
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .forEach((entry) => {
            const [local, exported] = entry.split(/\s+as\s+/).map((s) => s.trim());
            exportedNames.add(exported || local);
            out.push(`__exports[${JSON.stringify(exported || local)}] = ${local};`);
          });
        return;
      }
      throw new Error(
        `${where}: Export-Stil wird nicht unterstützt.\n  ${line.trim()}\n` +
          `  Erlaubt sind: "export function/const/let/var/class …" und "export { a, b as c };"`
      );
    }

    out.push(line);
  });

  // Benannte Deklarationen am Ende an das exports-Objekt hängen.
  for (const name of exportedNames) {
    if (!out.some((l) => l.startsWith(`__exports[${JSON.stringify(name)}]`))) {
      out.push(`__exports[${JSON.stringify(name)}] = ${name};`);
    }
  }

  return { code: out.join('\n'), deps };
}

/** Löst einen relativen Import-Pfad zu einer echten Datei auf. */
function resolveSpecifier(fromDir, specifier, where) {
  if (!specifier.startsWith('.')) {
    throw new Error(
      `${where}: Nur relative Importe ("./" oder "../") werden unterstützt — gefunden: "${specifier}".`
    );
  }
  const abs = resolve(fromDir, specifier);
  if (!existsSync(abs)) {
    throw new Error(`${where}: Importierte Datei existiert nicht: ${moduleId(abs)}`);
  }
  return abs;
}

/** Läuft den Modulgraphen ab dem Einstiegspunkt ab. */
function collectModules(entry) {
  const modules = new Map(); // id -> code
  const stack = [entry];
  const seen = new Set();
  const graph = new Map(); // id -> [id]

  while (stack.length) {
    const current = stack.pop();
    const id = moduleId(current);
    if (seen.has(id)) continue;
    seen.add(id);

    const { code, deps } = transformModule(current);
    modules.set(id, code);
    graph.set(id, deps.map(moduleId));
    for (const dep of deps) stack.push(dep);
  }

  warnOnCycles(graph);
  return modules;
}

/**
 * Zyklische Importe funktionieren mit der `const {…} = __require(…)`-Form nicht
 * zuverlässig. Wir melden sie deshalb laut, statt sie stillschweigend zu dulden.
 */
function warnOnCycles(graph) {
  const state = new Map(); // 0 = offen, 1 = in Bearbeitung, 2 = fertig
  const path = [];
  const cycles = [];

  function visit(id) {
    if (state.get(id) === 2) return;
    if (state.get(id) === 1) {
      cycles.push([...path.slice(path.indexOf(id)), id].join(' → '));
      return;
    }
    state.set(id, 1);
    path.push(id);
    for (const dep of graph.get(id) || []) visit(dep);
    path.pop();
    state.set(id, 2);
  }

  for (const id of graph.keys()) visit(id);

  if (cycles.length) {
    console.warn('\n⚠️  Zirkuläre Importe gefunden — bitte auflösen:');
    for (const c of new Set(cycles)) console.warn('   ' + c);
    console.warn('');
  }
}

// ---------------------------------------------------------------------------
// HTML zusammenbauen
// ---------------------------------------------------------------------------

const RUNTIME_HEAD = `(function(){
"use strict";
var __defs = {}, __cache = {};
function __require(id){
  var cached = __cache[id];
  if (cached) return cached.exports;
  var mod = __cache[id] = { exports: {} };
  var factory = __defs[id];
  if (!factory) throw new Error('Modul nicht gefunden: ' + id);
  factory(mod.exports, __require);
  return mod.exports;
}
function __define(id, factory){ __defs[id] = factory; }
`;

const RUNTIME_TAIL = `__require("src/main.js");
})();`;

function buildBundle(modules) {
  const parts = [RUNTIME_HEAD];
  for (const [id, code] of modules) {
    parts.push(`__define(${JSON.stringify(id)}, function(__exports, __require){\n${code}\n});\n`);
  }
  parts.push(RUNTIME_TAIL);
  return parts.join('\n');
}

/** Entfernt Kommentare und überflüssige Leerzeichen aus JavaScript. */
function minifyJS(code) {
  let result = '';
  let i = 0;
  let inString = false;
  let inTemplate = false;
  let stringChar = '';

  while (i < code.length) {
    const char = code[i];
    const next = code[i + 1];

    // Template-Literal verfolgen
    if (char === '`' && (i === 0 || code[i - 1] !== '\\')) {
      inTemplate = !inTemplate;
      result += char;
      i += 1;
      continue;
    }

    if (inTemplate) {
      result += char;
      i += 1;
      continue;
    }

    // String-Zustand verfolgen
    if ((char === '"' || char === "'" || char === '`') && (i === 0 || code[i - 1] !== '\\')) {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
      }
      result += char;
      i += 1;
      continue;
    }

    if (inString) {
      result += char;
      i += 1;
      continue;
    }

    // Einzeilige Kommentare
    if (char === '/' && next === '/') {
      while (i < code.length && code[i] !== '\n') i += 1;
      continue;
    }

    // Mehrzeilige Kommentare
    if (char === '/' && next === '*') {
      i += 2;
      while (i < code.length - 1) {
        if (code[i] === '*' && code[i + 1] === '/') {
          i += 2;
          break;
        }
        i += 1;
      }
      continue;
    }

    // Überflüssige Whitespaces komprimieren
    if (/\s/.test(char)) {
      // Ein Leerzeichen pro Sequenz, aber keine um Symbole
      if (result && !/[\s({[,;:\-+*/%=<>!&|^?]$/.test(result) && i + 1 < code.length && !/[\s);}\],.;:\-+*/%=<>!&|^?]/.test(code[i + 1])) {
        result += ' ';
      }
      i += 1;
      while (i < code.length && /\s/.test(code[i])) i += 1;
      continue;
    }

    result += char;
    i += 1;
  }

  return result;
}

/** Entfernt Kommentare und überflüssige Leerzeichen aus CSS. */
function minifyCSS(code) {
  // Entferne Kommentare
  let result = code.replace(/\/\*[\s\S]*?\*\//g, '');

  // Komprimiere Whitespace
  result = result
    .replace(/\s+/g, ' ') // Mehrfache Leerzeichen → eins
    .replace(/\s*([{}:;,>+~])\s*/g, '$1') // Leerzeichen um Symbole
    .replace(/;\s*}/g, '}') // Letzte Semikolon vor }
    .trim();

  return result;
}

/** Zieht die im Template verlinkten Stylesheets zusammen. */
function inlineStyles(html) {
  const linkRe = /[ \t]*<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>\s*\n?/g;
  const collected = [];
  const stripped = html.replace(linkRe, (_match, href) => {
    collected.push(readFileSync(resolve(ROOT, href), 'utf8'));
    return '';
  });
  return { html: stripped, css: collected.join('\n') };
}

function main() {
  const modules = collectModules(ENTRY);
  const bundle = buildBundle(modules);

  if (CHECK_ONLY) {
    console.log(`✅ ${modules.size} Module analysiert, keine Stil-Verstöße gefunden.`);
    return;
  }

  const template = readFileSync(HTML_TEMPLATE, 'utf8');
  const { html, css } = inlineStyles(template);

  // Das Modul-Script-Tag des Entwicklungs-Einstiegs durch das Bundle ersetzen.
  const scriptRe = /[ \t]*<script[^>]*type=["']module["'][^>]*><\/script>\s*\n?/;
  if (!scriptRe.test(html)) {
    throw new Error('index.html enthält kein <script type="module"> — Template unerwartet.');
  }

  const minifiedCSS = minifyCSS(css);
  const minifiedJS = minifyJS(bundle);

  const output = html
    .replace('</head>', `  <style>\n${minifiedCSS}\n  </style>\n</head>`)
    .replace(scriptRe, `  <script>\n${minifiedJS}\n  </script>\n`);

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_FILE, output, 'utf8');

  const kb = (Buffer.byteLength(output, 'utf8') / 1024).toFixed(1);
  console.log(`✅ dist/index.html gebaut — ${modules.size} Module, ${kb} kB, keine externen Dateien.`);
}

try {
  main();
} catch (error) {
  console.error('\n❌ Build fehlgeschlagen:\n' + error.message + '\n');
  process.exit(1);
}
