/**
 * header.js — Top header interactions
 * Handles notification popover and profile dropdown
 * QuantumLeap-AI Dashboard
 */

'use strict';

(function HeaderModule() {

  // ---- Generic popover manager ----
  const popovers = [];

  function registerPopover({ triggerEl, popoverEl, expandedAttr }) {
    if (!triggerEl || !popoverEl) return;

    function open() {
      // Close all other popovers first
      popovers.forEach((p) => {
        if (p.popoverEl !== popoverEl) close(p);
      });
      popoverEl.classList.add('open');
      popoverEl.setAttribute('aria-hidden', 'false');
      triggerEl.setAttribute(expandedAttr || 'aria-expanded', 'true');
    }

    function close({ popoverEl: el, triggerEl: btn, expandedAttr: attr } = { popoverEl, triggerEl, expandedAttr }) {
      el.classList.remove('open');
      el.setAttribute('aria-hidden', 'true');
      btn.setAttribute(attr || 'aria-expanded', 'false');
    }

    function toggle() {
      const isOpen = popoverEl.classList.contains('open');
      isOpen ? close({ popoverEl, triggerEl, expandedAttr }) : open();
    }

    triggerEl.addEventListener('click', (e) => {
      e.stopPropagation();
      toggle();
    });

    popovers.push({ triggerEl, popoverEl, expandedAttr, close });
    return { open, close: () => close({ popoverEl, triggerEl, expandedAttr }), toggle };
  }

  // ---- Notification Popover ----
  const notifBtn     = document.getElementById('notifBtn');
  const notifPopover = document.getElementById('notifPopover');
  const notifClose   = document.getElementById('notifClose');

  const notifHandler = registerPopover({
    triggerEl: notifBtn,
    popoverEl: notifPopover,
    expandedAttr: 'aria-expanded',
  });

  if (notifClose && notifHandler) {
    notifClose.addEventListener('click', () => notifHandler.close());
  }

  // ---- Profile Dropdown ----
  const profileBtn     = document.getElementById('profileBtn');
  const profilePopover = document.getElementById('profilePopover');

  registerPopover({
    triggerEl: profileBtn,
    popoverEl: profilePopover,
    expandedAttr: 'aria-expanded',
  });

  // ---- Close popovers on outside click ----
  document.addEventListener('click', () => {
    popovers.forEach((p) => {
      if (p.popoverEl.classList.contains('open')) {
        p.close(p);
      }
    });
  });

  // Prevent clicks inside a popover from closing it
  [notifPopover, profilePopover].forEach((el) => {
    if (!el) return;
    el.addEventListener('click', (e) => e.stopPropagation());
  });

  // ---- Close popovers on Escape ----
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      popovers.forEach((p) => {
        if (p.popoverEl.classList.contains('open')) {
          p.close(p);
          p.triggerEl.focus();
        }
      });
    }
  });

  // ---- Trap focus within open popover (basic) ----
  [notifPopover, profilePopover].forEach((popover) => {
    if (!popover) return;
    popover.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      const focusable = popover.querySelectorAll(
        'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  });

})();
