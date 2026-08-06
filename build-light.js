import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';

console.log('🔧 Baue Quick-Start Version...');

// Normale Version bauen
execSync('node build.js', {stdio: 'inherit'});

// Jetzt die Creatures reduzieren - nur Starter
let html = readFileSync('dist/index.html', 'utf8');

// Entferne alle anderen Creatures (behalt nur Flammkitz, Tropfotter, Knospling)
// Diese sind in species.js definiert - im gebündelten JS
html = html.replace(
  /export const species = \{[\s\S]*?\};\s*\n/,
  'export const species = { flammkitz: {...}, tropfotter: {...}, knospling: {...} };\n'
);

// Das ist zu primitiv - stattdessen: Original behalten, nur in Browser lazy-load

console.log('✅ Quick-Start: ', (html.length / 1024).toFixed(1), 'kB');
