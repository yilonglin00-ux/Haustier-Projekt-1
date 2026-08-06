/**
 * util.js — Kleine Helfer ohne Spiel-Logik: Zahlen, Zeit, DOM.
 * Bewusst abhängigkeitsfrei, damit jedes andere Modul sie gefahrlos nutzen kann.
 */

// --- Zahlen ----------------------------------------------------------------

/** Begrenzt einen Wert auf [min, max]. */
export function clamp(value, min = 0, max = 100) {
  return value < min ? min : value > max ? max : value;
}

/** Lineare Interpolation. */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/** Rundet auf eine Nachkommastelle — reicht für alle Anzeigewerte im Spiel. */
export function round1(value) {
  return Math.round(value * 10) / 10;
}

/** 1234567 -> "1.234.567" (deutsches Format). */
export function formatNumber(value) {
  return Math.floor(value).toLocaleString('de-DE');
}

/** Kompakte Darstellung für große Zahlen: 15300 -> "15,3 Tsd". */
export function formatCompact(value) {
  if (value < 10000) return formatNumber(value);
  if (value < 1000000) return (value / 1000).toFixed(1).replace('.', ',') + ' Tsd';
  return (value / 1000000).toFixed(1).replace('.', ',') + ' Mio';
}

/** Prozentwert für Balkenbreiten. */
export function percent(value, max) {
  return max <= 0 ? 0 : clamp((value / max) * 100, 0, 100);
}

// --- Zeit ------------------------------------------------------------------

export const SECOND = 1000;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

/** "2 Std 14 Min", "45 Sek", "3 Tage 2 Std" — für Anzeigen mit viel Platz. */
export function formatDuration(ms) {
  if (ms <= 0) return 'fertig';
  const days = Math.floor(ms / DAY);
  const hours = Math.floor((ms % DAY) / HOUR);
  const minutes = Math.floor((ms % HOUR) / MINUTE);
  const seconds = Math.floor((ms % MINUTE) / SECOND);

  if (days > 0) return `${days} ${days === 1 ? 'Tag' : 'Tage'} ${hours} Std`;
  if (hours > 0) return `${hours} Std ${minutes} Min`;
  if (minutes > 0) return `${minutes} Min ${seconds} Sek`;
  return `${seconds} Sek`;
}

/** "01:23:45" oder "23:45" — für Timer mit wenig Platz. */
export function formatClock(ms) {
  const total = Math.max(0, Math.floor(ms / SECOND));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/** Datumsschlüssel der lokalen Zeitzone: "2026-08-06". Basis für Tagesaufgaben. */
export function dayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Tageszeit als Spielbegriff — beeinflusst Entwicklungen und seltene Ereignisse. */
export function timeOfDay(date = new Date()) {
  const hour = date.getHours();
  if (hour >= 5 && hour < 11) return 'morgen';
  if (hour >= 11 && hour < 17) return 'tag';
  if (hour >= 17 && hour < 22) return 'abend';
  return 'nacht';
}

/** Jahreszeit für saisonale Haustiere. */
export function season(date = new Date()) {
  const month = date.getMonth();
  if (month <= 1 || month === 11) return 'winter';
  if (month <= 4) return 'fruehling';
  if (month <= 7) return 'sommer';
  return 'herbst';
}

/** Millisekunden bis zur nächsten lokalen Mitternacht. */
export function msUntilMidnight(now = Date.now()) {
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return next.getTime() - now;
}

// --- Sonstiges -------------------------------------------------------------

let idCounter = 0;

/** Eindeutige, kurze ID für Haustiere, Eier und Expeditionen. */
export function uid(prefix = 'id') {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}${idCounter.toString(36)}${Math.floor(
    Math.random() * 1296
  ).toString(36)}`;
}

/** Tiefe Kopie über strukturiertes Klonen mit JSON-Rückfallweg. */
export function deepClone(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

/** Verzögert wiederholte Aufrufe — genutzt für das Autosave. */
export function debounce(fn, wait) {
  let timer = null;
  const wrapped = (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
  wrapped.flush = (...args) => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
      fn(...args);
    }
  };
  wrapped.cancel = () => clearTimeout(timer);
  return wrapped;
}

/** Erster Buchstabe groß. */
export function capitalize(text) {
  return text ? text[0].toUpperCase() + text.slice(1) : text;
}

/** Summiert die Werte eines Objekts. */
export function sumValues(obj) {
  return Object.values(obj).reduce((a, b) => a + b, 0);
}

// --- DOM -------------------------------------------------------------------

/**
 * Kleiner Hyperscript-Helfer.
 *
 *   h('div.card', { onclick: fn }, 'Text', h('span', 'mehr'))
 *
 * Der Tag darf Klassen als CSS-Kurzform enthalten ("button.btn.btn--primary").
 * Attribute: `class`, `style` (Objekt oder String), `dataset`, `on<event>`,
 * alles andere wird als Attribut gesetzt (bzw. als Property, wenn sinnvoll).
 */
export function h(tag, props, ...children) {
  const [name, ...classes] = String(tag).split('.');
  const node = document.createElement(name || 'div');
  if (classes.length) node.classList.add(...classes);

  if (props && (typeof props !== 'object' || props instanceof Node || Array.isArray(props))) {
    children.unshift(props);
    props = null;
  }

  if (props) {
    for (const [key, value] of Object.entries(props)) {
      if (value === null || value === undefined || value === false) continue;

      if (key === 'class' || key === 'className') {
        node.classList.add(...String(value).split(/\s+/).filter(Boolean));
      } else if (key === 'style' && typeof value === 'object') {
        // Eigene CSS-Variablen (--foo) lassen sich nicht über Object.assign
        // setzen — dafür braucht es setProperty().
        for (const [prop, wert] of Object.entries(value)) {
          if (prop.startsWith('--')) node.style.setProperty(prop, String(wert));
          else node.style[prop] = wert;
        }
      } else if (key === 'dataset') {
        Object.assign(node.dataset, value);
      } else if (key.startsWith('on') && typeof value === 'function') {
        node.addEventListener(key.slice(2).toLowerCase(), value);
      } else if (key === 'html') {
        node.innerHTML = value;
      } else if (key === 'value' || key === 'checked' || key === 'disabled') {
        node[key] = value;
      } else {
        node.setAttribute(key, value === true ? '' : String(value));
      }
    }
  }

  appendChildren(node, children);
  return node;
}

function appendChildren(node, children) {
  for (const child of children) {
    if (child === null || child === undefined || child === false || child === true) continue;
    if (Array.isArray(child)) appendChildren(node, child);
    else if (child instanceof Node) node.appendChild(child);
    else node.appendChild(document.createTextNode(String(child)));
  }
}

/** Entfernt alle Kinder eines Elements. */
export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

/** Ersetzt den Inhalt eines Elements. */
export function replace(node, ...children) {
  clear(node);
  appendChildren(node, children);
  return node;
}

export function qs(selector, root = document) {
  return root.querySelector(selector);
}

export function qsa(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

/** SVG-Element erzeugen (h() kann das nicht, weil SVG einen Namensraum braucht). */
export function svg(tag, attrs = {}, ...children) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue;
    node.setAttribute(key, String(value));
  }
  for (const child of children.flat()) {
    if (child instanceof Node) node.appendChild(child);
    else if (child !== null && child !== undefined) node.appendChild(document.createTextNode(String(child)));
  }
  return node;
}
