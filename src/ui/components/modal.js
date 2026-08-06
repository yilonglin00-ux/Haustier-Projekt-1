/**
 * modal.js — Dialoge mit Fokusfalle und Escape-Taste.
 *
 * Es ist immer höchstens ein Dialog offen; ein neuer ersetzt den alten.
 * Das hält die Bedienung auf dem Smartphone übersichtlich.
 */

import { h, clear } from '../../core/util.js';

let closeCurrent = null;

function root() {
  return document.getElementById('modal-root');
}

/**
 * Öffnet einen Dialog.
 * @param {{
 *   title?:string,
 *   icon?:string,
 *   body:Node|Node[],
 *   actions?:Array<{label:string, onClick?:Function, variant?:string, close?:boolean}>,
 *   dismissable?:boolean,
 *   wide?:boolean,
 *   onClose?:Function
 * }} config
 * @returns {Function} schließt den Dialog
 */
export function openModal(config) {
  closeModal();

  const {
    title = '',
    icon = '',
    body,
    actions = [],
    dismissable = true,
    wide = false,
    onClose,
  } = config;

  const previousFocus = document.activeElement;

  const dialog = h(
    'div.modal',
    {
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': title || 'Dialog',
      style: wide ? { width: 'min(820px, 100%)' } : null,
    },
    title
      ? h(
          'div.modal__head',
          h(
            'h2',
            icon ? h('span', { 'aria-hidden': 'true', style: { marginRight: '.4rem' } }, icon) : null,
            title
          ),
          dismissable
            ? h(
                'button.btn.btn--ghost.btn--icon',
                { onclick: () => closeModal(), 'aria-label': 'Schließen' },
                '✕'
              )
            : null
        )
      : null,
    h('div.modal__body', body),
    actions.length
      ? h(
          'div.modal__foot',
          actions.map((action) =>
            h(
              'button.btn',
              {
                class: action.variant ? `btn--${action.variant}` : '',
                onclick: () => {
                  const keepOpen = action.onClick && action.onClick() === false;
                  if (action.close !== false && !keepOpen) closeModal();
                },
              },
              action.label
            )
          )
        )
      : null
  );

  const backdrop = h(
    'div.modal-backdrop',
    {
      onclick: (event) => {
        if (dismissable && event.target === backdrop) closeModal();
      },
    },
    dialog
  );

  const onKeyDown = (event) => {
    if (event.key === 'Escape' && dismissable) {
      event.preventDefault();
      closeModal();
    } else if (event.key === 'Tab') {
      trapFocus(event, dialog);
    }
  };

  document.addEventListener('keydown', onKeyDown);
  clear(root());
  root().appendChild(backdrop);

  // Ersten sinnvollen Fokus setzen.
  const focusable = dialog.querySelector('button, [href], input, select, textarea, [tabindex]');
  (focusable || dialog).focus?.();

  closeCurrent = () => {
    document.removeEventListener('keydown', onKeyDown);
    backdrop.remove();
    closeCurrent = null;
    previousFocus?.focus?.();
    onClose?.();
  };

  return closeModal;
}

export function closeModal() {
  closeCurrent?.();
}

export function isModalOpen() {
  return Boolean(closeCurrent);
}

/** Hält den Tastaturfokus innerhalb des Dialogs. */
function trapFocus(event, dialog) {
  const items = Array.from(
    dialog.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
  ).filter((el) => !el.disabled && el.offsetParent !== null);

  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

/**
 * Ja/Nein-Rückfrage. Praktisch für Zurücksetzen, Verkaufen, Freilassen.
 * @returns {Promise<boolean>}
 */
export function confirmDialog({ title, message, confirmLabel = 'Ja', cancelLabel = 'Abbrechen', danger = false }) {
  return new Promise((resolve) => {
    let answered = false;
    openModal({
      title,
      icon: danger ? '⚠️' : '❓',
      body: h('p.muted', message),
      actions: [
        {
          label: cancelLabel,
          onClick: () => {
            answered = true;
            resolve(false);
          },
        },
        {
          label: confirmLabel,
          variant: danger ? 'danger' : 'primary',
          onClick: () => {
            answered = true;
            resolve(true);
          },
        },
      ],
      onClose: () => {
        if (!answered) resolve(false);
      },
    });
  });
}

/** Eingabefeld-Dialog, z. B. zum Umbenennen. */
export function promptDialog({ title, label, value = '', maxLength = 16, placeholder = '' }) {
  return new Promise((resolve) => {
    let answered = false;
    const input = h('input.input', { value, maxlength: maxLength, placeholder, autocomplete: 'off' });

    openModal({
      title,
      icon: '✏️',
      body: h('div.field', h('label.field__label', label), input),
      actions: [
        {
          label: 'Abbrechen',
          onClick: () => {
            answered = true;
            resolve(null);
          },
        },
        {
          label: 'Übernehmen',
          variant: 'primary',
          onClick: () => {
            answered = true;
            resolve(input.value.trim() || null);
          },
        },
      ],
      onClose: () => {
        if (!answered) resolve(null);
      },
    });

    setTimeout(() => {
      input.focus();
      input.select();
    }, 40);
  });
}
