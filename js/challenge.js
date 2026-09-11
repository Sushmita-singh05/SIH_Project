/**
 * challenge.js — Challenge & Assessment Logic
 * QuantumLeap-AI · Screen 6
 *
 * Implements:
 *  - Interactive simplified circuit builder (H, CNOT, X, Z)
 *  - Dynamic circuit statistics (Qubits, Gates, Depth)
 *  - Circuit validation against Bell State target
 *  - Assessment result reporting with timer, score, and hints count
 *  - Progressive hints unlocking (1/3 -> 2/3 -> 3/3)
 *  - Learning Check interactive multiple-choice assessment
 *  - Navigation handling
 */

'use strict';

(function ChallengeModule() {

  /* ================================================
     1. DATA ARCHITECTURE
     ================================================ */

  const challengeData = {
    title: "Build a Bell State",
    difficulty: "Intermediate",
    qubits: 2,
    targetCircuit: [
      { gate: "H", qubit: 0, step: 0 },
      { gate: "CNOT", control: 0, target: 1, step: 1 }
    ],
    expectedOutput: {
      "00": 0.5,
      "01": 0,
      "10": 0,
      "11": 0.5
    },
    hintLevel: 1,
    score: null
  };

  const HINTS = [
    {
      level: 1,
      tag: "Hint 1 · Superposition",
      text: "Which gate creates a superposition from |0⟩?"
    },
    {
      level: 2,
      tag: "Hint 2 · Sequence",
      text: "Apply H to q0 first, then use q0 as the control for a CNOT."
    },
    {
      level: 3,
      tag: "Hint 3 · Solution",
      text: "The Bell State circuit is H on q0 followed by CNOT(q0,q1)."
    }
  ];

  /* ================================================
     2. CIRCUIT BUILDER STATE
     ================================================ */

  const MAX_STEPS = 4;
  let selectedGate = null;
  /** @type {Array<{gate: string, qubit?: number, control?: number, target?: number, step: number}>} */
  let placedOperations = [];

  const startTime = Date.now();

  /* ================================================
     3. DOM REFERENCES
     ================================================ */

  const circuitCanvasEl   = document.getElementById('challengeCanvas');
  const gateTiles         = document.querySelectorAll('.challenge-gate-tile');
  const clearCircuitBtn   = document.getElementById('challengeClearBtn');
  const statGatesEl       = document.getElementById('statGates');
  const statDepthEl       = document.getElementById('statDepth');

  const checkCircuitBtn   = document.getElementById('checkCircuitBtn');
  const feedbackCardEl    = document.getElementById('feedbackCard');
  const feedbackTitleEl   = document.getElementById('feedbackTitle');
  const feedbackDescEl    = document.getElementById('feedbackDesc');
  const feedbackHintEl    = document.getElementById('feedbackHint');
  const measurementDispEl = document.getElementById('measurementDisplay');

  const assessCardEl      = document.getElementById('assessmentResultCard');
  const metricHintsEl     = document.getElementById('metricHintsUsed');
  const metricTimeEl      = document.getElementById('metricTimeSpent');
  const continueAssessBtn = document.getElementById('continueAssessBtn');

  const hintBadgeEl       = document.getElementById('challengeHintBadge');
  const nextHintBtn       = document.getElementById('nextChallengeHintBtn');
  const hintNoticeEl      = document.getElementById('hintFinishedNotice');
  const openAITutorBtn    = document.getElementById('openAITutorBtn');

  // Learning check elements
  const quizOptionBtns    = document.querySelectorAll('.quiz-option-btn');
  const checkQuizBtn      = document.getElementById('checkQuizBtn');
  const quizFeedbackEl    = document.getElementById('quizFeedback');

  /* ================================================
     4. RENDER SIMPLIFIED CIRCUIT
     ================================================ */

  function renderCircuit() {
    if (!circuitCanvasEl) return;
    circuitCanvasEl.innerHTML = '';

    // Step column headers
    const stepHeaders = document.createElement('div');
    stepHeaders.className = 'challenge-step-headers';
    for (let s = 0; s < MAX_STEPS; s++) {
      const col = document.createElement('div');
      col.className = 'challenge-step-col';
      col.textContent = `Step ${s + 1}`;
      stepHeaders.appendChild(col);
    }
    circuitCanvasEl.appendChild(stepHeaders);

    // Qubit rows (q0 and q1)
    for (let q = 0; q < 2; q++) {
      const row = document.createElement('div');
      row.className = 'challenge-wire-row';

      const label = document.createElement('div');
      label.className = 'challenge-wire-label';
      label.textContent = `q${q}`;
      row.appendChild(label);

      const track = document.createElement('div');
      track.className = 'challenge-wire-track';

      const wireLine = document.createElement('div');
      wireLine.className = 'challenge-wire-line';
      track.appendChild(wireLine);

      const slots = document.createElement('div');
      slots.className = 'challenge-slots';

      for (let s = 0; s < MAX_STEPS; s++) {
        const slot = document.createElement('div');
        slot.className = 'challenge-slot';
        slot.dataset.qubit = q;
        slot.dataset.step = s;

        // Check if there is an operation at (q, s)
        const singleOp = placedOperations.find(o => o.qubit === q && o.step === s);
        const cnotOp   = placedOperations.find(o => o.gate === 'CNOT' && o.step === s);

        if (singleOp) {
          slot.classList.add('has-gate');
          const gateEl = document.createElement('div');
          gateEl.className = 'challenge-placed-gate';
          gateEl.textContent = singleOp.gate;

          const removeX = document.createElement('span');
          removeX.className = 'challenge-remove-x';
          removeX.textContent = '×';
          removeX.addEventListener('click', (e) => {
            e.stopPropagation();
            removeOperation(q, s);
          });
          gateEl.appendChild(removeX);
          slot.appendChild(gateEl);

        } else if (cnotOp) {
          slot.classList.add('has-gate');

          if (q === cnotOp.control) {
            // Control node (dot)
            const dot = document.createElement('div');
            dot.className = 'cnot-control-node';
            slot.appendChild(dot);

            // Vertical connecting line downward to q1
            const link = document.createElement('div');
            link.className = 'cnot-vertical-link';
            slot.appendChild(link);

            const removeX = document.createElement('span');
            removeX.className = 'challenge-remove-x';
            removeX.textContent = '×';
            removeX.addEventListener('click', (e) => {
              e.stopPropagation();
              removeCnot(s);
            });
            slot.appendChild(removeX);

          } else if (q === cnotOp.target) {
            // Target node (⊕ symbol)
            const target = document.createElement('div');
            target.className = 'cnot-target-node';
            target.textContent = '⊕';

            const removeX = document.createElement('span');
            removeX.className = 'challenge-remove-x';
            removeX.textContent = '×';
            removeX.addEventListener('click', (e) => {
              e.stopPropagation();
              removeCnot(s);
            });
            target.appendChild(removeX);
            slot.appendChild(target);
          }
        }

        // Slot click handler
        slot.addEventListener('click', () => handleSlotClick(q, s));
        slots.appendChild(slot);
      }

      track.appendChild(slots);
      row.appendChild(track);
      circuitCanvasEl.appendChild(row);
    }

    updateStats();
  }

  /* ================================================
     5. INTERACTIVE GATE PLACEMENT
     ================================================ */

  function handleSlotClick(qubit, step) {
    if (!selectedGate) return;

    // Remove any existing gate at this step/qubit
    placedOperations = placedOperations.filter(o => {
      if (selectedGate === 'CNOT') {
        return o.step !== step;
      } else {
        return !(o.qubit === qubit && o.step === step) && !(o.gate === 'CNOT' && o.step === step);
      }
    });

    if (selectedGate === 'CNOT') {
      // CNOT always connects control q0 to target q1 in this challenge
      placedOperations.push({ gate: 'CNOT', control: 0, target: 1, step });
    } else {
      placedOperations.push({ gate: selectedGate, qubit, step });
    }

    renderCircuit();
  }

  function removeOperation(qubit, step) {
    placedOperations = placedOperations.filter(o => !(o.qubit === qubit && o.step === step));
    renderCircuit();
  }

  function removeCnot(step) {
    placedOperations = placedOperations.filter(o => !(o.gate === 'CNOT' && o.step === step));
    renderCircuit();
  }

  function updateStats() {
    const gateCount = placedOperations.length;
    if (statGatesEl) statGatesEl.textContent = gateCount;

    if (statDepthEl) {
      if (gateCount === 0) {
        statDepthEl.textContent = '0';
      } else {
        const maxStep = Math.max(...placedOperations.map(o => o.step));
        statDepthEl.textContent = maxStep + 1;
      }
    }
  }

  // Palette tile selection
  gateTiles.forEach(tile => {
    tile.addEventListener('click', () => {
      const gate = tile.dataset.gate;
      if (selectedGate === gate) {
        selectedGate = null;
        tile.classList.remove('selected');
      } else {
        gateTiles.forEach(t => t.classList.remove('selected'));
        selectedGate = gate;
        tile.classList.add('selected');
      }
    });
  });

  // Clear circuit
  if (clearCircuitBtn) {
    clearCircuitBtn.addEventListener('click', () => {
      placedOperations = [];
      renderCircuit();
      hideFeedback();
    });
  }

  /* ================================================
     6. CIRCUIT VALIDATION
     ================================================ */

  function checkCircuit() {
    // Requirement for Bell State:
    // 1. H gate on q0 at step s1
    // 2. CNOT with control 0 and target 1 at step s2 where s2 > s1
    const hOp = placedOperations.find(o => o.gate === 'H' && o.qubit === 0);
    const cnotOp = placedOperations.find(o => o.gate === 'CNOT' && o.control === 0 && o.target === 1);

    const isCorrect = (hOp !== undefined) && (cnotOp !== undefined) && (cnotOp.step > hOp.step);

    if (isCorrect) {
      // Success
      challengeData.score = 1.0;

      if (feedbackCardEl) {
        feedbackCardEl.className = 'feedback-card correct visible';
        feedbackTitleEl.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Circuit Correct!`;
        feedbackDescEl.textContent = 'Great work! You created the Bell State circuit.';
        feedbackHintEl.style.display = 'none';
        if (measurementDispEl) measurementDispEl.style.display = 'block';
      }

      // Show Assessment Result Card
      const elapsedSec = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
      const mins = Math.floor(elapsedSec / 60);
      const secs = elapsedSec % 60;
      const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

      if (metricHintsEl) metricHintsEl.textContent = `${challengeData.hintLevel} of 3`;
      if (metricTimeEl) metricTimeEl.textContent = timeStr;

      if (assessCardEl) {
        assessCardEl.classList.add('visible');
        assessCardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

    } else {
      // Incomplete / incorrect
      if (feedbackCardEl) {
        feedbackCardEl.className = 'feedback-card incorrect visible';
        feedbackTitleEl.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> Not quite yet`;
        feedbackDescEl.textContent = 'Your circuit needs the Hadamard gate on q0 and a CNOT connecting q0 to q1.';
        feedbackHintEl.style.display = 'inline-block';
        feedbackHintEl.textContent = 'Hint: Start by creating a superposition on q0.';
        if (measurementDispEl) measurementDispEl.style.display = 'none';
      }
      if (assessCardEl) {
        assessCardEl.classList.remove('visible');
      }
    }
  }

  function hideFeedback() {
    if (feedbackCardEl) feedbackCardEl.classList.remove('visible');
    if (assessCardEl) assessCardEl.classList.remove('visible');
  }

  if (checkCircuitBtn) {
    checkCircuitBtn.addEventListener('click', checkCircuit);
  }

  /* ================================================
     7. PROGRESSIVE HINTS
     ================================================ */

  function updateHintUI() {
    const level = challengeData.hintLevel;
    if (hintBadgeEl) hintBadgeEl.textContent = `${level} / 3`;

    for (let i = 1; i <= 3; i++) {
      const card = document.getElementById(`challengeHint${i}`);
      if (!card) continue;

      if (i <= level) {
        card.classList.remove('locked');
        card.classList.add('active');
      } else {
        card.classList.add('locked');
        card.classList.remove('active');
      }
    }

    if (level >= 3) {
      if (nextHintBtn) {
        nextHintBtn.disabled = true;
        nextHintBtn.textContent = 'Full hint revealed.';
      }
      if (hintNoticeEl) {
        hintNoticeEl.classList.add('visible');
      }
    }
  }

  if (nextHintBtn) {
    nextHintBtn.addEventListener('click', () => {
      if (challengeData.hintLevel < 3) {
        challengeData.hintLevel += 1;
        updateHintUI();
      }
    });
  }

  /* ================================================
     8. LEARNING CHECK (PRE/POST ASSESSMENT)
     ================================================ */

  let selectedQuizOption = null;

  quizOptionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      quizOptionBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedQuizOption = btn.dataset.option;
      if (checkQuizBtn) checkQuizBtn.disabled = false;
    });
  });

  if (checkQuizBtn) {
    checkQuizBtn.addEventListener('click', () => {
      if (!selectedQuizOption || !quizFeedbackEl) return;

      quizFeedbackEl.className = 'quiz-feedback-box visible';

      if (selectedQuizOption === 'B') {
        quizFeedbackEl.classList.add('correct');
        quizFeedbackEl.textContent = 'Correct! The CNOT creates entanglement between the qubits.';
      } else {
        quizFeedbackEl.classList.add('incorrect');
        quizFeedbackEl.textContent = 'Not quite. Think about what the CNOT does when its control qubit is in superposition.';
      }
    });
  }

  /* ================================================
     9. NAVIGATION
     ================================================ */

  if (openAITutorBtn) {
    openAITutorBtn.addEventListener('click', () => {
      window.location.href = 'ai-tutor.html';
    });
  }

  if (continueAssessBtn) {
    continueAssessBtn.addEventListener('click', () => {
      window.location.href = 'progress.html';
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
     10. STARTUP
     ================================================ */
  renderCircuit();
  updateHintUI();

})();
