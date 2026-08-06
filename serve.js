#!/usr/bin/env node
/**
 * serve.js — Winziger Entwicklungs-Server ohne Abhängigkeiten.
 *
 * Wird nur zum Entwickeln gebraucht: Browser blockieren ES-Module über `file://`,
 * deshalb liefert dieses Skript `index.html` und `src/` über HTTP aus.
 * Das fertige Spiel (`dist/index.html`) braucht ihn nicht.
 */

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 8123;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

const server = createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const relPath = normalize(urlPath === '/' ? '/index.html' : urlPath).replace(/^(\.\.[/\\])+/, '');
    const filePath = resolve(join(ROOT, relPath));

    // Ausbrechen aus dem Projektordner verhindern.
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403).end('Verboten');
      return;
    }

    const info = await stat(filePath);
    const target = info.isDirectory() ? join(filePath, 'index.html') : filePath;
    const body = await readFile(target);

    res.writeHead(200, {
      'Content-Type': MIME[extname(target)] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Nicht gefunden');
  }
});

server.listen(PORT, () => {
  console.log(`🐾 Entwicklungs-Server läuft:  http://localhost:${PORT}/`);
  console.log('   Fertige Einzeldatei bauen:  npm run build');
});
