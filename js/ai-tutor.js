/**
 * ai-tutor.js — AI Tutor Logic
 * QuantumLeap-AI · Screen 5
 *
 * Provides:
 *  - Contextual mock AI explanation and context parameters
 *  - Progressive hint unlock (Level 1 -> Level 2 -> Level 3)
 *  - Dynamic UI updates for hint level badge and cards
 *  - Navigation handlers (Back to Simulation, Try Another Challenge)
 */

'use strict';

(function AITutorModule() {

  /* ================================================
     1. CONTEXT ARCHITECTURE
     ================================================ */

  const tutorContext = {
    lesson: "Superposition",
    studentLevel: "Beginner",
    circuit: [
      { gate: "H", qubit: 0, step: 0 }
    ],
    expectedOutput: {
      "0": 0.5,
      "1": 0.5
    },
    actualOutput: {
      "0": 0.5,
      "1": 0.5
    },
    hintLevel: 1
  };

  const HINTS = [
    {
      level: 1,
      tag: "Guiding Concept",
      text: "Think about what the Hadamard gate does to |0⟩."
    },
    {
      level: 2,
      tag: "Intermediate Clue",
      text: "The Hadamard gate creates an equal superposition of |0⟩ and |1⟩."
    },
    {
      level: 3,
      tag: "Deep Mathematical Insight",
      text: "Applying H to |0⟩ produces (|0⟩ + |1⟩) / √2, giving equal measurement probabilities."
    }
  ];

  /* ================================================
     2. DOM ELEMENTS
     =============================================== */

  const hintBadgeEl      = document.getElementById('hintLevelBadge');
  const hintLevelMetaEl  = document.getElementById('hintLevelMeta');
  const nextHintBtn      = document.getElementById('nextHintBtn');
  const hintReachedMsg   = document.getElementById('hintReachedMsg');
  const backToSimBtn     = document.getElementById('backToSimBtn');
  const tryChallengeBtn  = document.getElementById('tryChallengeBtn');

  const contextLessonEl  = document.getElementById('contextLesson');
  const contextLevelEl   = document.getElementById('contextLevel');
  const contextCircuitEl = document.getElementById('contextCircuit');
  const contextExpectedEl= document.getElementById('contextExpected');
  const contextActualEl  = document.getElementById('contextActual');

  /* ================================================
     3. INITIALISE DATA & POPULATE CONTEXT
     =============================================== */

  function initContext() {
    // Ensure all circuit context values on this page consistently refer to Gate: H, Qubit: q0
    tutorContext.circuit = [
      { gate: "H", qubit: 0, step: 0 }
    ];

    if (contextLessonEl) contextLessonEl.textContent = tutorContext.lesson;
    if (contextLevelEl) contextLevelEl.textContent = tutorContext.studentLevel;

    // Circuit context displays Hadamard (H) on q0
    if (contextCircuitEl) contextCircuitEl.textContent = 'Hadamard (H) on q0';

    const expectedText = `${(tutorContext.expectedOutput['0'] * 100).toFixed(0)}% |0⟩ / ${(tutorContext.expectedOutput['1'] * 100).toFixed(0)}% |1⟩`;
    const actualText = `${(tutorContext.actualOutput['0'] * 100).toFixed(0)}% |0⟩ / ${(tutorContext.actualOutput['1'] * 100).toFixed(0)}% |1⟩`;

    if (contextExpectedEl) contextExpectedEl.textContent = expectedText;
    if (contextActualEl) contextActualEl.textContent = actualText;

    updateHintUI();
  }

  /* ================================================
     4. PROGRESSIVE HINTS LOGIC
     =============================================== */

  function updateHintUI() {
    const currentLevel = tutorContext.hintLevel;

    // Update level display
    if (hintBadgeEl) hintBadgeEl.textContent = `${currentLevel} / 3`;
    if (hintLevelMetaEl) hintLevelMetaEl.textContent = `${currentLevel} / 3`;

    // Update individual hint DOM elements
    for (let i = 1; i <= 3; i++) {
      const hintCard = document.getElementById(`hintCard${i}`);
      const hintIcon = document.getElementById(`hintIcon${i}`);

      if (!hintCard) continue;

      if (i <= currentLevel) {
        hintCard.classList.remove('locked');
        hintCard.classList.add('active');
        if (hintIcon) {
          hintIcon.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;
        }
      } else {
        hintCard.classList.add('locked');
        hintCard.classList.remove('active');
        if (hintIcon) {
          hintIcon.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;
        }
      }
    }

    // If reached max level (3)
    if (currentLevel >= 3) {
      if (nextHintBtn) {
        nextHintBtn.disabled = true;
        nextHintBtn.innerHTML = `
          Full Explanation Reached
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        `;
      }
      if (hintReachedMsg) {
        hintReachedMsg.classList.add('visible');
      }
    }
  }

  function handleNextHint() {
    if (tutorContext.hintLevel < 3) {
      tutorContext.hintLevel += 1;
      updateHintUI();

      // Scroll to newly revealed hint smoothly on smaller viewports
      const nextCard = document.getElementById(`hintCard${tutorContext.hintLevel}`);
      if (nextCard && window.innerWidth < 1024) {
        nextCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }

  /* ================================================
     5. NAVIGATION HANDLERS
     =============================================== */

  if (nextHintBtn) {
    nextHintBtn.addEventListener('click', handleNextHint);
  }

  if (backToSimBtn) {
    backToSimBtn.addEventListener('click', () => {
      window.location.href = 'simulation-output.html';
    });
  }

  if (tryChallengeBtn) {
    tryChallengeBtn.addEventListener('click', () => {
      window.location.href = 'challenge.html';
    });
  }

  // Sidebar navigation handling
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      const route = link.dataset.route;
      if (route === 'dashboard') return;
      if (route === 'learn') return;
      if (route === 'practice') return;
      // Other unbuilt links show placeholder if present
      const routePlaceholder = document.getElementById('routePlaceholder');
      if (routePlaceholder) {
        e.preventDefault();
        routePlaceholder.classList.add('visible');
        routePlaceholder.setAttribute('aria-hidden', 'false');
      }
    });
  });

  const placeholderClose = document.getElementById('placeholderClose');
  if (placeholderClose) {
    placeholderClose.addEventListener('click', () => {
      const routePlaceholder = document.getElementById('routePlaceholder');
      if (routePlaceholder) {
        routePlaceholder.classList.remove('visible');
        routePlaceholder.setAttribute('aria-hidden', 'true');
      }
    });
  }

  /* ================================================
     6. STARTUP
     =============================================== */
  initContext();

})();
