/**
 * sidebar.js — Sidebar navigation interactions
 * QuantumLeap-AI Dashboard
 */

'use strict';

(function SidebarModule() {
  const sidebar        = document.getElementById('sidebar');
  const hamburgerBtn   = document.getElementById('hamburgerBtn');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const navLinks       = document.querySelectorAll('.nav-link');

  if (!sidebar || !hamburgerBtn) return;

  // ---- Open / Close sidebar (mobile) ----
  function openSidebar() {
    sidebar.classList.add('open');
    sidebarOverlay.classList.add('visible');
    sidebarOverlay.setAttribute('aria-hidden', 'false');
    hamburgerBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('visible');
    sidebarOverlay.setAttribute('aria-hidden', 'true');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  hamburgerBtn.addEventListener('click', () => {
    const isOpen = sidebar.classList.contains('open');
    isOpen ? closeSidebar() : openSidebar();
  });

  // Close when clicking overlay
  sidebarOverlay.addEventListener('click', closeSidebar);

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('open')) {
      closeSidebar();
    }
  });

  // ---- Navigation routing ----
  const routePlaceholder = document.getElementById('routePlaceholder');
  const placeholderClose = document.getElementById('placeholderClose');

  navLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      const route = link.dataset.route;

      // Dashboard — already on dashboard page, no navigation needed
      if (route === 'dashboard') {
        e.preventDefault();
        closeSidebar();
        return;
      }

      // Learn — built route, let the browser follow the href naturally
      if (route === 'learn') {
        closeSidebar();
        return; // do NOT preventDefault
      }

      // Practice — built route (Circuit Builder), follow href naturally
      if (route === 'practice') {
        closeSidebar();
        return; // do NOT preventDefault
      }

      // All other routes are unbuilt — show placeholder
      if (AppData.unbuiltRoutes.has(route)) {
        e.preventDefault();
        closeSidebar();
        showRoutePlaceholder();
        return;
      }

      // Future built routes: closeSidebar and allow navigation
      closeSidebar();
    });

    // Keyboard: activate on Enter/Space
    link.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        link.click();
      }
    });
  });

  function showRoutePlaceholder() {
    if (!routePlaceholder) return;
    routePlaceholder.classList.add('visible');
    routePlaceholder.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    placeholderClose && placeholderClose.focus();
  }

  function hideRoutePlaceholder() {
    if (!routePlaceholder) return;
    routePlaceholder.classList.remove('visible');
    routePlaceholder.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (placeholderClose) {
    placeholderClose.addEventListener('click', hideRoutePlaceholder);
  }

  if (routePlaceholder) {
    routePlaceholder.addEventListener('click', (e) => {
      if (e.target === routePlaceholder) hideRoutePlaceholder();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && routePlaceholder.classList.contains('visible')) {
        hideRoutePlaceholder();
      }
    });
  }

  // ---- Hook Start Challenge button to placeholder ----
  // Note: continueLearnBtn now navigates to a real page (lesson-superposition.html)
  // and should NOT be intercepted here.
  const startChallengeBtn = document.getElementById('startChallengeBtn');
  if (startChallengeBtn) {
    startChallengeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showRoutePlaceholder();
    });
  }

})();
