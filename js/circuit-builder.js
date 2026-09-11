/**
 * circuit-builder.js — Interactive Quantum Circuit Builder
 * QuantumLeap-AI · Screen 3
 *
 * Manages gate selection, placement (click-to-place + drag-and-drop),
 * undo/redo, circuit JSON state, and dynamic UI updates.
 */

'use strict';

(function CircuitBuilderModule() {

  /* ================================================
     1. CONFIGURATION
     ================================================ */
  const MAX_STEPS = 8;
  const DEFAULT_QUBITS = 2;
  const GATE_DATA = {
    // Single-qubit gates
    H:       { name: 'H',       desc: 'Hadamard',           type: 'single', qubits: 1 },
    X:       { name: 'X',       desc: 'Bit flip',           type: 'single', qubits: 1 },
    Y:       { name: 'Y',       desc: 'Y rotation',         type: 'single', qubits: 1 },
    Z:       { name: 'Z',       desc: 'Phase flip',         type: 'single', qubits: 1 },
    S:       { name: 'S',       desc: 'Phase gate',         type: 'single', qubits: 1 },
    T:       { name: 'T',       desc: 'T gate',             type: 'single', qubits: 1 },
    // Multi-qubit gates
    CNOT:    { name: 'CNOT',    desc: 'Controlled-X',       type: 'multi',  qubits: 2 },
    CZ:      { name: 'CZ',     desc: 'Controlled-Z',       type: 'multi',  qubits: 2 },
    SWAP:    { name: 'SWAP',    desc: 'Swap two qubits',    type: 'multi',  qubits: 2 },
    Toffoli: { name: 'Toffoli', desc: 'Controlled-controlled-X', type: 'multi', qubits: 3 },
    // Operations
    Measure: { name: 'M',       desc: 'Measure',            type: 'op',     qubits: 1 },
  };

  /* ================================================
     2. STATE
     ================================================ */
  let state = {
    numQubits: DEFAULT_QUBITS,
    /** @type {{ gate: string, qubit: number, step: number }[]} */
    operations: [],
    selectedGate: null,
    undoStack: [],
    redoStack: [],
  };

  /* ================================================
     3. DOM REFERENCES
     ================================================ */
  const circuitGrid        = document.getElementById('circuitGrid');
  const stepHeaders        = document.getElementById('stepHeaders');
  const qubitBtns          = document.querySelectorAll('.qubit-btn');
  const gateTiles          = document.querySelectorAll('.gate-tile');
  const undoBtn            = document.getElementById('undoBtn');
  const redoBtn            = document.getElementById('redoBtn');
  const clearBtn           = document.getElementById('clearCircuitBtn');
  const runSimBtn          = document.getElementById('runSimBtn');
  const viewJsonBtn        = document.getElementById('viewJsonBtn');
  const jsonModal          = document.getElementById('jsonModal');
  const jsonModalClose     = document.getElementById('jsonModalClose');
  const jsonPre            = document.getElementById('jsonPre');
  const toast              = document.getElementById('cbToast');
  const statQubits         = document.getElementById('statQubits');
  const statGates          = document.getElementById('statGates');
  const statDepth          = document.getElementById('statDepth');
  const measureBtn         = document.getElementById('measureBtn');
  const resetBtn           = document.getElementById('resetBtn');
  const clearPaletteBtn    = document.getElementById('clearPaletteBtn');

  if (!circuitGrid) return; // guard

  /* ================================================
     4. CIRCUIT RENDERING
     ================================================ */

  /** Build the circuit grid DOM from current state. */
  function renderCircuit() {
    // Step headers
    stepHeaders.innerHTML = '';
    for (let s = 0; s < MAX_STEPS; s++) {
      const span = document.createElement('span');
      span.className = 'step-header';
      span.textContent = `Step ${s + 1}`;
      stepHeaders.appendChild(span);
    }

    // Qubit rows
    circuitGrid.innerHTML = '';
    for (let q = 0; q < state.numQubits; q++) {
      const row = document.createElement('div');
      row.className = 'circuit-qubit-row';
      row.dataset.qubit = q;

      // Label
      const label = document.createElement('span');
      label.className = 'qubit-label';
      label.textContent = `q${q}`;
      row.appendChild(label);

      // Wire container
      const wire = document.createElement('div');
      wire.className = 'qubit-wire';

      // Wire line
      const wireLine = document.createElement('div');
      wireLine.className = 'qubit-wire-line';
      wire.appendChild(wireLine);

      // Slots
      const slots = document.createElement('div');
      slots.className = 'circuit-slots';

      for (let s = 0; s < MAX_STEPS; s++) {
        const slot = document.createElement('div');
        slot.className = 'circuit-slot';
        slot.dataset.qubit = q;
        slot.dataset.step = s;
        slot.setAttribute('role', 'button');
        slot.setAttribute('tabindex', '0');
        slot.setAttribute('aria-label', `Qubit ${q}, Step ${s + 1} — empty`);

        // Check if there's a gate here
        const op = state.operations.find(o => o.qubit === q && o.step === s);
        if (op) {
          slot.classList.add('has-gate');
          const gateEl = document.createElement('div');
          gateEl.className = 'placed-gate';
          if (GATE_DATA[op.gate] && GATE_DATA[op.gate].type === 'multi') {
            gateEl.classList.add('multi-qubit');
          }
          gateEl.textContent = GATE_DATA[op.gate] ? GATE_DATA[op.gate].name : op.gate;
          gateEl.setAttribute('aria-label', `${op.gate} gate on q${q}`);

          // Remove button
          const removeBtn = document.createElement('button');
          removeBtn.className = 'gate-remove-btn';
          removeBtn.innerHTML = '×';
          removeBtn.setAttribute('aria-label', `Remove ${op.gate} from q${q}, step ${s + 1}`);
          removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeGate(q, s);
          });
          gateEl.appendChild(removeBtn);

          slot.appendChild(gateEl);
          slot.setAttribute('aria-label', `Qubit ${q}, Step ${s + 1} — ${op.gate} gate`);
        }

        // Click to place
        slot.addEventListener('click', () => handleSlotClick(q, s));

        // Keyboard
        slot.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleSlotClick(q, s);
          }
        });

        // Drag-and-drop: accept drops
        slot.addEventListener('dragover', (e) => {
          e.preventDefault();
          if (!slot.classList.contains('has-gate')) {
            slot.classList.add('drop-target');
          }
        });

        slot.addEventListener('dragleave', () => {
          slot.classList.remove('drop-target');
        });

        slot.addEventListener('drop', (e) => {
          e.preventDefault();
          slot.classList.remove('drop-target');
          const gateName = e.dataTransfer.getData('text/plain');
          if (gateName && !slot.classList.contains('has-gate')) {
            placeGate(gateName, q, s);
          }
        });

        slots.appendChild(slot);
      }

      wire.appendChild(slots);
      row.appendChild(wire);
      circuitGrid.appendChild(row);
    }

    updateStats();
    updateUndoRedoBtns();
  }


  /* ================================================
     5. GATE PLACEMENT / REMOVAL
     ================================================ */

  function pushUndo() {
    state.undoStack.push(JSON.stringify(state.operations));
    state.redoStack = [];
    // Limit stack size
    if (state.undoStack.length > 50) state.undoStack.shift();
  }

  function placeGate(gateName, qubit, step) {
    // Don't place on occupied slot
    const exists = state.operations.find(o => o.qubit === qubit && o.step === step);
    if (exists) return;

    pushUndo();
    state.operations.push({ gate: gateName, qubit, step });
    renderCircuit();
    deselectGate();
    showToast(`${gateName} gate placed on q${qubit}`);
  }

  function removeGate(qubit, step) {
    const idx = state.operations.findIndex(o => o.qubit === qubit && o.step === step);
    if (idx === -1) return;

    pushUndo();
    state.operations.splice(idx, 1);
    renderCircuit();
  }

  function handleSlotClick(qubit, step) {
    const exists = state.operations.find(o => o.qubit === qubit && o.step === step);
    if (exists) return; // slot occupied

    if (state.selectedGate) {
      placeGate(state.selectedGate, qubit, step);
    }
  }

  /* ================================================
     6. GATE SELECTION (Click-to-place)
     ================================================ */

  function selectGate(gateName) {
    deselectGate();
    state.selectedGate = gateName;
    // Highlight the tile
    gateTiles.forEach(tile => {
      if (tile.dataset.gate === gateName) {
        tile.classList.add('selected');
      }
    });
  }

  function deselectGate() {
    state.selectedGate = null;
    gateTiles.forEach(tile => tile.classList.remove('selected'));
  }

  // Wire up gate tiles
  gateTiles.forEach(tile => {
    const gateName = tile.dataset.gate;

    tile.addEventListener('click', () => {
      if (tile.classList.contains('selected')) {
        deselectGate();
      } else {
        selectGate(gateName);
      }
    });

    // Drag support
    tile.setAttribute('draggable', 'true');
    tile.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', gateName);
      e.dataTransfer.effectAllowed = 'copy';
      tile.style.opacity = '0.5';
    });
    tile.addEventListener('dragend', () => {
      tile.style.opacity = '';
    });
  });

  /* ================================================
     7. OPERATIONS (Measure, Reset, Clear)
     ================================================ */

  if (measureBtn) {
    measureBtn.addEventListener('click', () => {
      selectGate('Measure');
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      // Reset is effectively removing all gates — confirm
      if (state.operations.length === 0) return;
      pushUndo();
      state.operations = [];
      renderCircuit();
      showToast('Circuit reset');
    });
  }

  if (clearPaletteBtn) {
    clearPaletteBtn.addEventListener('click', () => {
      if (state.operations.length === 0) return;
      pushUndo();
      state.operations = [];
      renderCircuit();
      showToast('Circuit cleared');
    });
  }

  /* ================================================
     8. UNDO / REDO
     ================================================ */

  function undo() {
    if (state.undoStack.length === 0) return;
    state.redoStack.push(JSON.stringify(state.operations));
    state.operations = JSON.parse(state.undoStack.pop());
    renderCircuit();
  }

  function redo() {
    if (state.redoStack.length === 0) return;
    state.undoStack.push(JSON.stringify(state.operations));
    state.operations = JSON.parse(state.redoStack.pop());
    renderCircuit();
  }

  function updateUndoRedoBtns() {
    if (undoBtn) undoBtn.disabled = state.undoStack.length === 0;
    if (redoBtn) redoBtn.disabled = state.redoStack.length === 0;
  }

  if (undoBtn) undoBtn.addEventListener('click', undo);
  if (redoBtn) redoBtn.addEventListener('click', redo);

  /* ================================================
     9. CLEAR CIRCUIT
     ================================================ */

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (state.operations.length === 0) return;
      pushUndo();
      state.operations = [];
      renderCircuit();
      showToast('Circuit cleared');
    });
  }

  /* ================================================
     10. QUBIT SELECTOR
     ================================================ */

  qubitBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const num = parseInt(btn.dataset.qubits, 10);
      if (num === state.numQubits) return;

      // Remove gates on qubits that no longer exist
      pushUndo();
      state.numQubits = num;
      state.operations = state.operations.filter(o => o.qubit < num);

      // Update active button
      qubitBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      renderCircuit();
    });
  });

  /* ================================================
     11. STATS UPDATE
     ================================================ */

  function updateStats() {
    if (statQubits) statQubits.textContent = state.numQubits;

    const gateCount = state.operations.length;
    if (statGates) statGates.textContent = gateCount;

    // Depth = max step index + 1 (or 0 if empty)
    if (statDepth) {
      if (gateCount === 0) {
        statDepth.textContent = '0';
      } else {
        const maxStep = Math.max(...state.operations.map(o => o.step));
        statDepth.textContent = maxStep + 1;
      }
    }
  }

  /* ================================================
     12. CIRCUIT JSON
     ================================================ */

  function getCircuitJSON() {
    return {
      qubits: state.numQubits,
      operations: state.operations
        .slice()
        .sort((a, b) => a.step - b.step || a.qubit - b.qubit)
        .map(o => ({ gate: o.gate, qubit: o.qubit, step: o.step })),
    };
  }

  // View JSON button
  if (viewJsonBtn && jsonModal) {
    viewJsonBtn.addEventListener('click', () => {
      const data = getCircuitJSON();
      jsonPre.textContent = JSON.stringify(data, null, 2);
      jsonModal.classList.add('visible');
      jsonModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    });
  }

  // Close modal
  if (jsonModalClose) {
    jsonModalClose.addEventListener('click', closeJsonModal);
  }
  if (jsonModal) {
    jsonModal.addEventListener('click', (e) => {
      if (e.target === jsonModal) closeJsonModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && jsonModal.classList.contains('visible')) {
        closeJsonModal();
      }
    });
  }

  function closeJsonModal() {
    jsonModal.classList.remove('visible');
    jsonModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  /* ================================================
     13. RUN SIMULATION
     ================================================ */

  if (runSimBtn) {
    runSimBtn.addEventListener('click', () => {
      if (state.operations.length === 0) {
        showToast('Add at least one gate before simulating.');
        return;
      }
      // Persist circuit for simulation-output.html to consume
      const circuitData = getCircuitJSON();
      window.__quantumCircuit = circuitData; // in-memory reference
      try {
        localStorage.setItem('ql_circuit', JSON.stringify(circuitData));
      } catch (_) { /* ignore QuotaExceededError */ }

      showToast('Launching simulation…');
      // Navigate after a brief moment so the toast is visible
      setTimeout(() => {
        window.location.href = 'simulation-output.html';
      }, 600);
    });
  }


  /* ================================================
     14. TOAST NOTIFICATIONS
     ================================================ */

  let toastTimer = null;

  function showToast(message, variant) {
    if (!toast) return;
    toast.textContent = message;
    toast.className = 'cb-toast';
    if (variant === 'success') toast.classList.add('toast-success');

    // Force reflow for animation restart
    void toast.offsetWidth;
    toast.classList.add('visible');

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('visible');
    }, 2500);
  }

  /* ================================================
     15. KEYBOARD SHORTCUTS
     ================================================ */

  document.addEventListener('keydown', (e) => {
    // Ctrl+Z / Cmd+Z → Undo
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
    }
    // Ctrl+Shift+Z / Ctrl+Y → Redo
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault();
      redo();
    }
    // Escape → deselect gate
    if (e.key === 'Escape' && state.selectedGate) {
      deselectGate();
    }
  });

  /* ================================================
     16. INITIALISE
     ================================================ */
  renderCircuit();

})();
