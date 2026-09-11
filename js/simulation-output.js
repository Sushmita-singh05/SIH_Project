/**
 * simulation-output.js — Simulation Output Page
 * QuantumLeap-AI · Screen 4
 *
 * Responsibilities:
 *  - Load circuit from localStorage (written by circuit-builder.js)
 *  - Merge with DEMO simulation results
 *  - Render: histogram, Bloch sphere, state-vector table, summary
 *  - Wire up navigation: Modify Circuit, Run Again, Explain This Result
 *
 * DATA CONTRACT:
 *   simulationResult is the single source of truth for all visualisations.
 *   Replace it (or its values) with a real Qiskit API response later.
 */

'use strict';

(function SimulationOutputModule() {

  /* ================================================
     1. DEMO DATA — replace with API response later
     ================================================ */

  /**
   * Base demo result for a 1-qubit H gate circuit.
   * Structure mirrors what a Qiskit statevector/counts run would return.
   */
  const DEMO_RESULT = {
    shots: 1024,
    counts: {
      '0': 512,
      '1': 512,
    },
    statevector: [
      { state: '|0⟩', amplitude: 0.707, phase: 0 },
      { state: '|1⟩', amplitude: 0.707, phase: 0 },
    ],
    circuit: {
      qubits: 2,
      operations: [
        { gate: 'H', qubit: 0, step: 0 },
      ],
    },
    bloch: {
      // Cartesian coordinates on the unit sphere for |+⟩
      // |+⟩ = (|0⟩ + |1⟩)/√2  →  equator, +X axis
      x: 1.0,
      y: 0.0,
      z: 0.0,
      label: '|+⟩',
    },
  };

  /* ================================================
     2. LOAD SAVED CIRCUIT FROM localStorage
     ================================================
     circuit-builder.js stores:
       localStorage.setItem('ql_circuit', JSON.stringify(circuitData))
     We read it here and overlay it on the demo.
  ================================================ */

  function loadSimulationResult() {
    let result = JSON.parse(JSON.stringify(DEMO_RESULT)); // deep clone

    try {
      const raw = localStorage.getItem('ql_circuit');
      if (raw) {
        const saved = JSON.parse(raw);
        result.circuit = saved; // use the actual saved circuit
        // Keep demo shots/counts/statevector for now (no real sim)
      }
    } catch (_) {
      // Silent — fall back to demo
    }

    return result;
  }

  /* ================================================
     3. DOM HELPERS
     ================================================ */

  function $(id) { return document.getElementById(id); }

  function setHtml(id, html) {
    const el = $(id);
    if (el) el.innerHTML = html;
  }

  function setText(id, text) {
    const el = $(id);
    if (el) el.textContent = text;
  }

  /* ================================================
     4. CIRCUIT ASCII RENDERER
     ================================================ */

  function buildAsciiCircuit(circuit) {
    const steps = 4; // display columns
    const rows = [];

    for (let q = 0; q < circuit.qubits; q++) {
      let line = `q${q} ───`;
      for (let s = 0; s < steps; s++) {
        const op = circuit.operations.find(o => o.qubit === q && o.step === s);
        if (op) {
          line += `[ <span class="gate-highlight">${op.gate}</span> ]───`;
        } else {
          line += '───────';
        }
      }
      rows.push(line);
    }
    return rows.join('\n');
  }

  /* ================================================
     5. RENDER CIRCUIT SUMMARY
     ================================================ */

  function renderCircuitSummary(result) {
    const circuit = result.circuit;

    // ASCII diagram
    const asciiEl = $('circuitAscii');
    if (asciiEl) asciiEl.innerHTML = buildAsciiCircuit(circuit);

    // Meta stats
    const depth = circuit.operations.length > 0
      ? Math.max(...circuit.operations.map(o => o.step)) + 1
      : 0;

    setText('metaQubits', circuit.qubits);
    setText('metaGates',  circuit.operations.length);
    setText('metaDepth',  depth);
    setText('metaShots',  result.shots.toLocaleString());
  }

  /* ================================================
     6. RENDER HISTOGRAM
     ================================================ */

  function renderHistogram(result) {
    const { counts, shots } = result;
    const container = $('histogramChart');
    if (!container) return;

    setText('histogramShotsVal', shots.toLocaleString());

    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    const maxCount = Math.max(...Object.values(counts));

    container.innerHTML = '';

    const sorted = Object.entries(counts).sort(([a], [b]) => a.localeCompare(b));

    sorted.forEach(([bitstring, count]) => {
      const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
      const barPct = maxCount > 0 ? (count / maxCount) * 100 : 0;

      const row = document.createElement('div');
      row.className = 'histogram-bar-row';
      row.innerHTML = `
        <div class="histogram-bar-header">
          <span class="histogram-state-label">|${bitstring}⟩</span>
          <div class="histogram-bar-info">
            <span class="histogram-count">${count.toLocaleString()} shots</span>
            <span class="histogram-percent">${pct}%</span>
          </div>
        </div>
        <div class="histogram-track" role="progressbar"
             aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"
             aria-label="State |${bitstring}⟩: ${pct}%">
          <div class="histogram-bar-fill" style="width: 0%"
               data-target="${barPct}"></div>
        </div>`;
      container.appendChild(row);
    });

    // Axis
    const axis = document.createElement('div');
    axis.className = 'histogram-axis';
    axis.innerHTML = `
      <span class="histogram-axis-label">0%</span>
      <span class="histogram-axis-label">25%</span>
      <span class="histogram-axis-label">50%</span>
      <span class="histogram-axis-label">75%</span>
      <span class="histogram-axis-label">100%</span>`;
    container.appendChild(axis);

    // Animate bars after a frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        container.querySelectorAll('.histogram-bar-fill').forEach(bar => {
          bar.style.width = bar.dataset.target + '%';
        });
      });
    });
  }

  /* ================================================
     7. RENDER BLOCH SPHERE (SVG)
     ================================================ */

  function renderBlochSphere(bloch) {
    const svg = $('blochSvg');
    if (!svg) return;

    const cx = 115, cy = 115, r = 90;

    // Project 3D point to 2D with simple isometric-style projection
    // x-axis → right, y-axis → into screen (foreshortened), z-axis → up
    function project(bx, by, bz) {
      const screenX = cx + bx * r - by * r * 0.35;
      const screenY = cy - bz * r - by * r * 0.2;
      return { x: screenX, y: screenY };
    }

    const state = project(bloch.x, bloch.y, bloch.z);
    const north  = project(0, 0,  1);
    const south  = project(0, 0, -1);
    const east   = project(1, 0,  0);
    const west   = project(-1, 0, 0);
    const front  = project(0, 1,  0);

    // Build ellipse parameters for the equatorial ring
    const eqRx = r;
    const eqRy = r * 0.3;

    svg.innerHTML = `
      <!-- ── Sphere body ── -->
      <circle cx="${cx}" cy="${cy}" r="${r}"
              fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.5"/>

      <!-- ── Equatorial ellipse (back arc, dashed) ── -->
      <ellipse cx="${cx}" cy="${cy}"
               rx="${eqRx}" ry="${eqRy}"
               fill="none" stroke="#CBD5E1" stroke-width="1"
               stroke-dasharray="4,3"/>

      <!-- ── Vertical meridian (dashed) ── -->
      <ellipse cx="${cx}" cy="${cy}"
               rx="${r * 0.3}" ry="${r}"
               fill="none" stroke="#CBD5E1" stroke-width="1"
               stroke-dasharray="4,3"/>

      <!-- ── Axes lines ── -->
      <!-- Z axis (vertical) -->
      <line x1="${cx}" y1="${cy + r + 8}" x2="${cx}" y2="${cy - r - 14}"
            stroke="#94A3B8" stroke-width="1.2"/>
      <!-- X axis (horizontal) -->
      <line x1="${cx - r - 14}" y1="${cy}" x2="${cx + r + 14}" y2="${cy}"
            stroke="#94A3B8" stroke-width="1.2" stroke-dasharray="4,3"/>

      <!-- ── Axis arrowheads ── -->
      <polygon points="${cx},${cy - r - 14} ${cx - 4},${cy - r - 6} ${cx + 4},${cy - r - 6}"
               fill="#94A3B8"/>

      <!-- ── Axis labels ── -->
      <text x="${cx}" y="${cy - r - 22}" text-anchor="middle"
            font-size="12" font-weight="700" fill="#0F172A" font-family="Inter,sans-serif">|0⟩</text>

      <text x="${cx}" y="${cy + r + 24}" text-anchor="middle"
            font-size="12" font-weight="700" fill="#475569" font-family="Inter,sans-serif">|1⟩</text>

      <text x="${cx + r + 20}" y="${cy + 4}" text-anchor="start"
            font-size="11" font-weight="600" fill="#475569" font-family="Inter,sans-serif">|+⟩</text>

      <text x="${cx - r - 20}" y="${cy + 4}" text-anchor="end"
            font-size="11" font-weight="600" fill="#475569" font-family="Inter,sans-serif">|−⟩</text>

      <!-- ── State vector arrow ── -->
      <!-- Stem -->
      <line x1="${cx}" y1="${cy}"
            x2="${state.x - (state.x - cx) * 0.15}"
            y2="${state.y - (state.y - cy) * 0.15}"
            stroke="#2563EB" stroke-width="2.5"
            stroke-linecap="round"/>

      <!-- Arrowhead -->
      <circle cx="${state.x}" cy="${state.y}" r="5"
              fill="#2563EB"/>

      <!-- Dashed projection lines to axes -->
      <line x1="${state.x}" y1="${state.y}" x2="${state.x}" y2="${cy}"
            stroke="#2563EB" stroke-width="1" stroke-dasharray="3,2" opacity="0.4"/>
      <line x1="${state.x}" y1="${cy}" x2="${cx}" y2="${cy}"
            stroke="#2563EB" stroke-width="1" stroke-dasharray="3,2" opacity="0.4"/>

      <!-- State label -->
      <rect x="${state.x + 9}" y="${state.y - 14}"
            width="32" height="20" rx="4"
            fill="#2563EB"/>
      <text x="${state.x + 25}" y="${state.y + 1}"
            text-anchor="middle"
            font-size="11" font-weight="700" fill="white"
            font-family="'Courier New',Courier,monospace">${bloch.label}</text>

      <!-- ── Equatorial front arc (solid, on top) ── -->
      <path d="M ${cx - eqRx} ${cy} A ${eqRx} ${eqRy} 0 0 0 ${cx + eqRx} ${cy}"
            fill="none" stroke="#CBD5E1" stroke-width="1.2"/>
    `;
  }

  /* ================================================
     8. RENDER STATE VECTOR
     ================================================ */

  function renderStateVector(result) {
    const { statevector } = result;

    // Equation string
    const eqParts = statevector.map(sv => `${sv.amplitude}${sv.state}`);
    setText('svEquation', `|ψ⟩ = ${eqParts.join(' + ')}`);

    const tbody = $('svTableBody');
    if (!tbody) return;

    const maxAmp = Math.max(...statevector.map(sv => Math.abs(sv.amplitude)));

    tbody.innerHTML = statevector.map(sv => {
      const prob = (sv.amplitude * sv.amplitude * 100).toFixed(1);
      const barW = maxAmp > 0 ? (Math.abs(sv.amplitude) / maxAmp) * 100 : 0;
      return `
        <tr>
          <td>${sv.state}</td>
          <td>${sv.amplitude.toFixed(4)}</td>
          <td>
            <div class="amplitude-bar-wrap">
              <div class="amplitude-bar">
                <div class="amplitude-bar-fill"
                     style="width: 0%"
                     data-target="${barW}"></div>
              </div>
              <span style="font-size:11px;color:var(--color-text-muted);white-space:nowrap">${prob}%</span>
            </div>
          </td>
        </tr>`;
    }).join('');

    // Animate bars
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        tbody.querySelectorAll('.amplitude-bar-fill').forEach(bar => {
          bar.style.width = bar.dataset.target + '%';
        });
      });
    });
  }

  /* ================================================
     9. RENDER SIMULATION SUMMARY
     ================================================ */

  function renderSimSummary(result) {
    const gates = result.circuit.operations.map(o => o.gate).join(', ') || '—';

    setText('summaryInitialState', '|0⟩');
    setText('summaryOperation', `Hadamard (${gates})`);
    setText('summaryExpected', 'Equal probability of |0⟩ and |1⟩');
    setText('summaryObserved', 'Approximately 50% / 50%');
  }

  /* ================================================
     10. WIRE UP BUTTONS
     ================================================ */

  function wireButtons() {
    // Modify Circuit (top card)
    document.querySelectorAll('.js-modify-circuit').forEach(btn => {
      btn.addEventListener('click', () => {
        window.location.href = 'circuit-builder.html';
      });
    });

    // Run Again
    const runAgainBtn = $('runAgainBtn');
    if (runAgainBtn) {
      runAgainBtn.addEventListener('click', () => {
        runAgainBtn.disabled = true;
        runAgainBtn.textContent = 'Running…';

        // Simulate a short delay then re-render with slight randomness
        setTimeout(() => {
          const result = loadSimulationResult();

          // Add realistic statistical noise (±5%)
          const total = result.shots;
          const keys = Object.keys(result.counts);
          const base = Math.round(total / keys.length);
          const noise = Math.floor(Math.random() * 52) - 26; // ±26
          if (keys.length === 2) {
            result.counts[keys[0]] = base + noise;
            result.counts[keys[1]] = total - (base + noise);
          }

          renderAll(result);
          runAgainBtn.disabled = false;
          runAgainBtn.innerHTML = `
            Run Again
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10"/>
            </svg>`;
          showToast('Simulation re-run complete.');
        }, 820);
      });
    }

    // Explain This Result → ai-tutor.html
    const explainBtn = $('explainResultBtn');
    if (explainBtn) {
      explainBtn.addEventListener('click', () => {
        // Store simulation context for the AI Tutor to pick up
        try {
          localStorage.setItem('ql_sim_context', JSON.stringify({
            circuit:     loadSimulationResult().circuit,
            counts:      loadSimulationResult().counts,
            statevector: loadSimulationResult().statevector,
          }));
        } catch (_) { /* ignore */ }
        window.location.href = 'ai-tutor.html';
      });
    }
  }

  /* ================================================
     11. TOAST
     ================================================ */

  let _toastTimer = null;

  function showToast(msg) {
    const toast = $('simToast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('visible');
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => toast.classList.remove('visible'), 2600);
  }

  /* ================================================
     12. ORCHESTRATE RENDER
     ================================================ */

  function renderAll(result) {
    renderCircuitSummary(result);
    renderHistogram(result);
    renderBlochSphere(result.bloch);
    renderStateVector(result);
    renderSimSummary(result);
  }

  /* ================================================
     13. INIT
     ================================================ */

  const result = loadSimulationResult();
  renderAll(result);
  wireButtons();

})();
