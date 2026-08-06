/**
 * app.js — Die Hülle: Kopfleiste, Navigation, Bildschirmfläche.
 *
 * Zeichnet nur, was sich geändert hat: Kopfleiste und Navigation werden
 * punktuell aktualisiert, der Bildschirm bei Zustandsänderungen neu gebaut
 * (die Bildschirme sind klein genug, dass sich Feinarbeit dort nicht lohnt).
 */

import { h, replace, formatCompact } from '../core/util.js';
import { getState, subscribe } from '../core/state.js';
import { on, EVENTS } from '../core/events.js';
import { navScreens, getScreen, currentScreenId, currentScreenParams, navigate } from './router.js';

let elements = null;
let pendingRender = false;

/** Baut das Grundgerüst und hängt alle Hörer ein. Einmal beim Start aufrufen. */
export function mountApp() {
  const app = document.getElementById('app');

  const wallet = h('div.topbar__wallet');
  const themeButton = h(
    'button.btn.btn--ghost.btn--icon',
    { onclick: toggleTheme, 'aria-label': 'Helles oder dunkles Design wechseln', title: 'Design wechseln' },
    themeIcon()
  );

  const topbar = h(
    'header.topbar',
    h(
      'div.topbar__brand',
      h('span', { 'aria-hidden': 'true' }, '🌿'),
      h('span', 'Fabelgarten')
    ),
    h('div.topbar__spacer'),
    wallet,
    themeButton
  );

  const screen = h('main.screen', { id: 'screen', tabindex: '-1' });
  const nav = h('nav.nav', { 'aria-label': 'Hauptnavigation' });

  replace(app, topbar, screen, nav);
  app.hidden = false;
  document.getElementById('boot')?.remove();

  elements = { app, topbar, wallet, themeButton, screen, nav };

  buildNav();
  renderWallet();
  applyTheme(getState().einstellungen.theme);
  applyMotion(getState().einstellungen.bewegung);

  on(EVENTS.SCREEN_CHANGED, () => {
    buildNav();
    renderScreen();
    elements.screen.scrollTo?.({ top: 0 });
  });

  subscribe(() => {
    renderWallet();
    updateNavBadges();
    const screenDef = getScreen(currentScreenId());
    if (screenDef?.live) scheduleRender();
  });

  return elements;
}

// --- Bildschirm ------------------------------------------------------------

/** Sammelt mehrere Änderungen zu einem Neuzeichnen. */
function scheduleRender() {
  if (pendingRender) return;
  pendingRender = true;
  requestAnimationFrame(() => {
    pendingRender = false;
    renderScreen();
  });
}

function renderScreen() {
  const def = getScreen(currentScreenId());
  if (!def || !elements) return;

  const content = def.render(currentScreenParams());
  replace(elements.screen, content);
}

// --- Kopfleiste ------------------------------------------------------------

function renderWallet() {
  if (!elements) return;
  const { spieler } = getState();
  replace(
    elements.wallet,
    h('span.chip.chip--wallet', { title: 'Münzen' }, h('span', { 'aria-hidden': 'true' }, '🪙'), formatCompact(spieler.muenzen)),
    h('span.chip.chip--wallet', { title: 'Diamanten' }, h('span', { 'aria-hidden': 'true' }, '💎'), formatCompact(spieler.diamanten))
  );
}

// --- Navigation ------------------------------------------------------------

function buildNav() {
  if (!elements) return;
  const isDesktop = window.matchMedia('(min-width: 900px)').matches;
  const screens = navScreens();
  const active = currentScreenId();

  /*
     Auf dem Smartphone zeigt die Bodenleiste höchstens vier Ziele plus einen
     „Mehr“-Knopf. Mehr Einträge würden sich nicht mehr sinnvoll beschriften
     lassen und die Leiste über den Bildschirmrand schieben.
  */
  const MAX_MOBIL = 4;
  const visible = isDesktop ? screens : screens.filter((s) => s.primary).slice(0, MAX_MOBIL);

  const items = visible.map((screen) =>
    h(
      'button.nav__item',
      {
        onclick: () => navigate(screen.id),
        'aria-current': screen.id === active ? 'page' : null,
        'data-screen': screen.id,
        title: screen.label,
      },
      h('span.nav__icon', { 'aria-hidden': 'true' }, screen.icon),
      h('span', screen.label),
      badgeNode(screen)
    )
  );

  if (!isDesktop) {
    // Liegt der aktuelle Bildschirm hinter „Mehr“, wird der Knopf hervorgehoben —
    // sonst wüsste man nicht, wo man gerade ist.
    const versteckt = !visible.some((screen) => screen.id === active);
    const aktuell = versteckt ? getScreen(active) : null;

    items.push(
      h(
        'button.nav__item',
        {
          onclick: openMoreSheet,
          'aria-label': 'Weitere Bereiche',
          'aria-current': versteckt ? 'page' : null,
          title: 'Weitere Bereiche',
        },
        h('span.nav__icon', { 'aria-hidden': 'true' }, aktuell ? aktuell.icon : '⋯'),
        h('span', aktuell ? aktuell.label : 'Mehr'),
        offeneAbzeichen(visible)
      )
    );
  }

  replace(elements.nav, items);
}

function badgeNode(screen) {
  const value = screen.badge?.();
  if (!value) return null;
  return h('span.nav__badge', String(value));
}

/**
 * Sammelt die Abzeichen aller Bildschirme, die hinter „Mehr“ liegen.
 * Ohne das bliebe eine schlupfbereite Ei-Meldung auf dem Smartphone unsichtbar.
 */
function offeneAbzeichen(sichtbar) {
  const versteckt = navScreens().filter((screen) => !sichtbar.some((s) => s.id === screen.id));
  const summe = versteckt.reduce((total, screen) => {
    const wert = Number(screen.badge?.() || 0);
    return total + (Number.isFinite(wert) ? wert : 0);
  }, 0);
  return summe ? h('span.nav__badge', String(summe)) : null;
}

function updateNavBadges() {
  if (!elements) return;
  for (const screen of navScreens()) {
    const item = elements.nav.querySelector(`[data-screen="${screen.id}"]`);
    if (!item) continue;
    item.querySelector('.nav__badge')?.remove();
    const badge = badgeNode(screen);
    if (badge) item.appendChild(badge);
  }
}

/** Blatt mit allen Bereichen (nur Smartphone). */
function openMoreSheet() {
  // Absichtlich ohne modal.js-Import, um Ringabhängigkeiten zu vermeiden:
  // dieses Blatt ist Teil der Navigation, kein inhaltlicher Dialog.
  const existing = document.querySelector('.more-sheet');
  if (existing) {
    existing.remove();
    return;
  }

  const sheet = h(
    'div.modal-backdrop.more-sheet',
    {
      onclick: (event) => {
        if (event.target === sheet) sheet.remove();
      },
    },
    h(
      'div.modal',
      { style: { width: 'min(520px, 100%)' } },
      h('div.modal__head', h('h2', 'Alle Bereiche')),
      h(
        'div.grid.grid--tiles',
        navScreens().map((screen) =>
          h(
            'button.tile',
            {
              onclick: () => {
                sheet.remove();
                navigate(screen.id);
              },
            },
            h('span.tile__icon', { 'aria-hidden': 'true' }, screen.icon),
            h('span.tile__label', screen.label),
            (() => {
              const value = screen.badge?.();
              return value ? h('span.tile__count', String(value)) : null;
            })()
          )
        )
      )
    )
  );

  document.getElementById('modal-root').appendChild(sheet);
}

// --- Design ----------------------------------------------------------------

function themeIcon() {
  return document.documentElement.dataset.theme === 'light' ? '🌙' : '☀️';
}

export function applyTheme(theme) {
  const resolved =
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: light)').matches
        ? 'light'
        : 'dark'
      : theme;
  document.documentElement.dataset.theme = resolved;
  if (elements) replace(elements.themeButton, themeIcon());
}

export function applyMotion(mode) {
  document.documentElement.dataset.motion = mode === 'reduziert' ? 'reduced' : 'full';
}

function toggleTheme() {
  const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  applyTheme(next);
  // Direktes Schreiben ohne update(), um kein volles Neuzeichnen auszulösen.
  getState().einstellungen.theme = next;
}

/** Reagiert auf Größenänderungen: Bodenleiste ↔ Seitenleiste. */
export function installResponsiveNav() {
  const query = window.matchMedia('(min-width: 900px)');
  query.addEventListener('change', buildNav);
}
