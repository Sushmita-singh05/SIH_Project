import React, { useState, useCallback, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import TopHeader from '../components/Layout/TopHeader';
import CodeEditor from '../components/CircuitBuilder/CodeEditor';
import FloatingAITutorBtn from '../components/AITutor/FloatingAITutorBtn';
import { simulateCircuit } from '../services/api';
import { useLearningContext } from '../context/LearningContext';
import { buildTutorContext, saveTutorContext } from '../utils/tutorContext';
import {
  gridToOperations,
  operationsToGrid,
  operationsToQiskitCode,
  qiskitCodeToOperations,
  toBackendPayload,
} from '../utils/circuitUtils';

// ── Constants ──────────────────────────────
const NUM_STEPS = 8;
const SINGLE_GATES = ['H', 'X', 'Y', 'Z', 'S', 'T'];
const MULTI_GATES  = ['CNOT', 'SWAP'];
const OP_GATES     = ['M'];

// ── GateSlot (memoised for performance) ───
const GateSlot = memo(function GateSlot({ gate, label, isMulti, qIdx, sIdx, onCellClick }) {
  return (
    <div
      onClick={() => onCellClick(qIdx, sIdx)}
      style={{
        width: '48px',
        height: '48px',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: gate ? (isMulti ? '#4f46e5' : '#2563eb') : '#f8fafc',
        color: gate ? '#ffffff' : '#94a3b8',
        border: gate
          ? `2px solid ${isMulti ? '#4338ca' : '#1d4ed8'}`
          : '1px dashed #cbd5e1',
        fontWeight: 'bold',
        fontSize: label && label.length <= 2 ? '1rem' : '0.78rem',
        cursor: 'pointer',
        boxShadow: gate ? '0 4px 6px -1px rgba(37,99,235,0.18)' : 'none',
        transition: 'all 0.15s ease',
        flexShrink: 0,
      }}
    >
      {label || '+'}
    </div>
  );
});

// ── Helper: determine what to show in each cell ──
function getCellDisplay(operations, qIdx, sIdx) {
  for (const op of operations) {
    if ((op.step ?? 0) !== sIdx) continue;

    if (op.gate === 'CNOT' || op.gate === 'CX') {
      if (op.control === qIdx) return { gate: 'CNOT', label: '●',   isMulti: true };
      if (op.target  === qIdx) return { gate: 'CNOT', label: '⊕',   isMulti: true };
    } else if (op.gate === 'SWAP') {
      if (op.control === qIdx || op.target === qIdx) return { gate: 'SWAP', label: '✕', isMulti: true };
    } else if (op.gate === 'CZ') {
      if (op.control === qIdx || op.target === qIdx) return { gate: 'CZ', label: 'CZ', isMulti: true };
    } else if ((op.qubit ?? 0) === qIdx) {
      return { gate: op.gate, label: op.gate, isMulti: false };
    }
  }
  return { gate: null, label: null, isMulti: false };
}

// ── Helper: remove an operation that occupies (qIdx, sIdx) ──
function removeOpAt(ops, qIdx, sIdx) {
  return ops.filter((op) => {
    if ((op.step ?? 0) !== sIdx) return true;
    if ((op.qubit ?? 0) === qIdx) return false;
    if (op.control === qIdx || op.target === qIdx) return false;
    return true;
  });
}

// ── Helper: build a new operation for a gate placement ──
function buildOp(gate, qIdx, sIdx, numQubits) {
  if (gate === 'CNOT' || gate === 'SWAP' || gate === 'CZ') {
    const partner = qIdx < numQubits - 1 ? qIdx + 1 : qIdx - 1;
    if (partner < 0 || partner >= numQubits) return null;
    return { gate, qubit: Math.max(qIdx, partner), step: sIdx, control: Math.min(qIdx, partner), target: Math.max(qIdx, partner) };
  }
  return { gate, qubit: qIdx, step: sIdx };
}

// ════════════════════════════════════════════
//  CircuitBuilder Page
// ════════════════════════════════════════════
export default function CircuitBuilder() {
  const navigate = useNavigate();
  const {
    currentCircuit,
    updateCurrentCircuit,
    updateSimulationResult,
    setLastError,
  } = useLearningContext();

  // ── Initialise from Context / localStorage / defaults ──
  const [numQubits, setNumQubits] = useState(() => {
    if (currentCircuit?.qubits) return currentCircuit.qubits;
    try { const p = JSON.parse(localStorage.getItem('ql_circuit') || '{}'); if (p.qubits) return p.qubits; } catch {}
    return 2;
  });

  const [operations, setOperations] = useState(() => {
    if (currentCircuit?.operations?.length) return currentCircuit.operations;
    try {
      const p = JSON.parse(localStorage.getItem('ql_circuit') || '{}');
      if (p.operations?.length) return p.operations;
      if (p.grid) return gridToOperations(p.grid);           // backward compat
    } catch {}
    return [];
  });

  const [selectedGate, setSelectedGate] = useState('H');
  const [isSimulating, setIsSimulating] = useState(false);
  const [errorMessage, setErrorMessage]  = useState(null);

  // ── Mode state ──
  const [mode, setMode]               = useState('visual');   // 'visual' | 'code'
  const [codeText, setCodeText]        = useState('');
  const [codeErrors, setCodeErrors]    = useState([]);
  const [codeModified, setCodeModified] = useState(false);

  // ── Undo history ──
  const [history, setHistory] = useState([]);

  // ── Derived: visual grid ──
  const grid = useMemo(
    () => operationsToGrid(operations, numQubits, NUM_STEPS),
    [operations, numQubits],
  );

  // ── Derived stats ──
  const gateCount    = operations.length;
  const circuitDepth = operations.length > 0 ? Math.max(...operations.map((o) => (o.step ?? 0))) + 1 : 0;

  // ────────────────────────────────────────
  //  Persistence helpers
  // ────────────────────────────────────────
  const syncCircuit = useCallback((ops, qubits, actionType) => {
    const obj = { qubits, operations: ops };
    try { localStorage.setItem('ql_circuit', JSON.stringify(obj)); } catch {}
    updateCurrentCircuit(obj, actionType);
  }, [updateCurrentCircuit]);

  const pushHistory = useCallback(() => {
    setHistory((prev) => [...prev.slice(-49), JSON.stringify({ operations, numQubits })]);
  }, [operations, numQubits]);

  // shortcut: update ops + sync in one call
  const applyOps = useCallback((newOps, qubits, action) => {
    setOperations(newOps);
    syncCircuit(newOps, qubits, action);
  }, [syncCircuit]);

  // ────────────────────────────────────────
  //  Visual Mode handlers
  // ────────────────────────────────────────
  const handleCellClick = useCallback((qIdx, sIdx) => {
    const { gate: existing } = getCellDisplay(operations, qIdx, sIdx);

    pushHistory();

    if (existing) {
      // Toggle off: remove any op occupying this cell
      applyOps(removeOpAt(operations, qIdx, sIdx), numQubits, 'removed_gate');
    } else {
      // Place new gate
      const op = buildOp(selectedGate, qIdx, sIdx, numQubits);
      if (!op) return;
      applyOps([...operations, op], numQubits, 'placed_gate');
    }
  }, [operations, selectedGate, numQubits, pushHistory, applyOps]);

  const handleClear = useCallback(() => {
    pushHistory();
    applyOps([], numQubits, 'changed_circuit');
  }, [numQubits, pushHistory, applyOps]);

  const handleUndo = useCallback(() => {
    if (!history.length) return;
    const prev = JSON.parse(history[history.length - 1]);
    setHistory((h) => h.slice(0, -1));
    setNumQubits(prev.numQubits);
    applyOps(prev.operations, prev.numQubits, 'changed_circuit');
  }, [history, applyOps]);

  const handleLoadDemo = useCallback(() => {
    pushHistory();
    const demo = [{ gate: 'H', qubit: 0, step: 0 }];
    setNumQubits(2);
    applyOps(demo, 2, 'changed_circuit');
  }, [pushHistory, applyOps]);

  const handleQubitChange = useCallback((n) => {
    if (n === numQubits) return;
    pushHistory();
    // prune ops that reference out-of-range qubits
    const filtered = operations.filter((op) => {
      if ((op.qubit ?? 0) >= n) return false;
      if (op.control != null && op.control >= n) return false;
      if (op.target  != null && op.target  >= n) return false;
      return true;
    });
    setNumQubits(n);
    applyOps(filtered, n, 'changed_circuit');
  }, [numQubits, operations, pushHistory, applyOps]);

  // ────────────────────────────────────────
  //  Mode switching
  // ────────────────────────────────────────
  const switchMode = useCallback((target) => {
    if (target === mode) return;

    if (target === 'code') {
      // Generate code from current operations
      setCodeText(operationsToQiskitCode(operations, numQubits));
      setCodeErrors([]);
      setCodeModified(false);
      setErrorMessage(null);
      setMode('code');
    } else {
      // Switching to visual → apply code changes first
      if (codeModified) {
        const { numQubits: pq, operations: po, errors } = qiskitCodeToOperations(codeText);
        if (errors.length) {
          setCodeErrors(errors);
          setErrorMessage('Fix code errors before switching to Visual Mode.');
          return;
        }
        pushHistory();
        setNumQubits(pq);
        applyOps(po, pq, 'changed_circuit');
        setCodeModified(false);
      }
      setCodeErrors([]);
      setErrorMessage(null);
      setMode('visual');
    }
  }, [mode, operations, numQubits, codeText, codeModified, pushHistory, applyOps]);

  // ────────────────────────────────────────
  //  Code Mode handlers
  // ────────────────────────────────────────
  const handleCodeChange = useCallback((txt) => {
    setCodeText(txt);
    setCodeModified(true);
    if (codeErrors.length) setCodeErrors([]);          // clear stale errors on edit
  }, [codeErrors.length]);

  const handleApplyCode = useCallback(() => {
    const { numQubits: pq, operations: po, errors } = qiskitCodeToOperations(codeText);
    if (errors.length) { setCodeErrors(errors); return; }

    pushHistory();
    setNumQubits(pq);
    applyOps(po, pq, 'changed_circuit');
    setCodeErrors([]);
    setCodeModified(false);
    setErrorMessage(null);
  }, [codeText, pushHistory, applyOps]);

  // ────────────────────────────────────────
  //  AI Tutor Context Builder
  // ────────────────────────────────────────
  const getTutorContextData = useCallback(() => ({
    mode,
    qubits: numQubits,
    operations,
    selectedGate,
    code: codeText || operationsToQiskitCode(operations, numQubits),
    errors: codeErrors,
  }), [mode, numQubits, operations, selectedGate, codeText, codeErrors]);

  const handleAskTutor = useCallback(() => {
    const screen = mode === 'code' ? 'code-mode' : 'circuit-builder';
    const ctx = buildTutorContext(screen, getTutorContextData());
    saveTutorContext(ctx);
    navigate('/ai-tutor');
  }, [mode, getTutorContextData, navigate]);

  // ────────────────────────────────────────
  //  Simulate
  // ────────────────────────────────────────
  const handleSimulate = useCallback(async () => {
    let simOps    = operations;
    let simQubits = numQubits;

    // Auto-apply unsaved code edits before simulating
    if (mode === 'code' && codeModified) {
      const { numQubits: pq, operations: po, errors } = qiskitCodeToOperations(codeText);
      if (errors.length) {
        setCodeErrors(errors);
        setErrorMessage('Fix code errors before simulating.');
        return;
      }
      simOps    = po;
      simQubits = pq;
      setNumQubits(pq);
      setOperations(po);
      syncCircuit(po, pq, 'changed_circuit');
      setCodeModified(false);
    }

    if (!simOps.length) {
      setErrorMessage('Add at least one gate before simulating.');
      return;
    }

    setIsSimulating(true);
    setErrorMessage(null);

    const payload = toBackendPayload(simQubits, simOps);
    console.log('SIMULATION REQUEST:', JSON.stringify(payload, null, 2));

    try {
      const result = await simulateCircuit(payload);

      // Persist for SimulationOutput + AI Tutor
      const tutorCtx = { qubits: simQubits, lesson: 'Foundations: Superposition & Entanglement', operations: simOps, result };
      localStorage.setItem('quantumLeapSimulation',   JSON.stringify(tutorCtx));
      localStorage.setItem('quantumSimulationResult',  JSON.stringify(result));
      localStorage.setItem('ql_simulation_result',     JSON.stringify(result));

      updateSimulationResult(result);
      navigate('/simulation-output');
    } catch (err) {
      console.warn('Simulation error:', err);
      const msg = 'Unable to connect to the quantum simulator. Please make sure the backend is running.';
      setErrorMessage(msg);
      setLastError(msg);
    } finally {
      setIsSimulating(false);
    }
  }, [operations, numQubits, mode, codeModified, codeText, navigate, updateSimulationResult, setLastError, syncCircuit]);

  // ════════════════════════════════════════
  //  RENDER
  // ════════════════════════════════════════
  return (
    <div className="app-main-content">
      <TopHeader title="Circuit Builder" subtitle="Construct quantum circuits and inspect unitary transformations." />

      <div className="builder-container">
        {/* ━━━ Toolbar ━━━ */}
        <div className="card builder-toolbar" style={{ marginBottom: '1.25rem' }}>
          {/* Row 1 — Mode toggle, qubit selector, actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: mode === 'visual' ? '0.75rem' : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              {/* Mode toggle */}
              <div className="mode-toggle">
                <button className={`mode-toggle-btn ${mode === 'visual' ? 'active' : ''}`} onClick={() => switchMode('visual')}>
                  ⚡ Visual
                </button>
                <button className={`mode-toggle-btn ${mode === 'code' ? 'active' : ''}`} onClick={() => switchMode('code')}>
                  {'</>'} Code
                </button>
              </div>

              {/* Qubit selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>Qubits:</span>
                <div className="mode-toggle">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      className={`mode-toggle-btn ${numQubits === n ? 'active' : ''}`}
                      onClick={() => handleQubitChange(n)}
                      disabled={mode === 'code'}
                      style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right-hand actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                Gates: {gateCount} · Depth: {circuitDepth}
              </span>
              <button className="btn btn-sm btn-ghost"   onClick={handleLoadDemo} disabled={isSimulating}>Demo</button>
              <button className="btn btn-sm btn-outline"  onClick={handleUndo}     disabled={!history.length || isSimulating}>Undo</button>
              <button className="btn btn-sm btn-outline"  onClick={handleClear}    disabled={isSimulating}>Clear</button>
              <button className="btn btn-sm btn-outline"  onClick={handleAskTutor} style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)', fontWeight: 600 }}>
                🤖 Ask AI Tutor
              </button>
              <button className="btn btn-sm btn-primary"  onClick={handleSimulate}  disabled={isSimulating}>
                {isSimulating ? 'Simulating…' : 'Simulate ▶'}
              </button>
            </div>
          </div>

          {/* Row 2 — Gate palette (visual mode only) */}
          {mode === 'visual' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderTop: '1px solid var(--color-border-soft)', paddingTop: '0.75rem' }}>
              <span style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>Gates:</span>
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                {[...SINGLE_GATES, ...MULTI_GATES, ...OP_GATES].map((g) => (
                  <button
                    key={g}
                    className={`btn btn-sm ${selectedGate === g ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setSelectedGate(g)}
                    style={{ minWidth: '38px', fontWeight: 'bold', padding: '4px 10px' }}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ━━━ Error banner ━━━ */}
        {errorMessage && (
          <div style={{ marginBottom: '1.25rem', padding: '0.75rem 1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>⚠️</span>
            <span style={{ flex: 1 }}>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b', fontWeight: 'bold', fontSize: '1rem', lineHeight: 1 }}>✕</button>
          </div>
        )}

        {/* ━━━ Visual Mode ━━━ */}
        {mode === 'visual' && (
          <div className="card circuit-canvas-card" style={{ padding: '2rem 1.5rem', minHeight: '280px', background: '#ffffff', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
            {/* Canvas header */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem' }}>
                  Interactive Quantum Register ({numQubits} Qubit{numQubits > 1 ? 's' : ''})
                </h3>
                <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-secondary)', fontSize: '0.82rem' }}>
                  Click any slot to place or remove the selected <strong>{selectedGate}</strong> gate.
                </p>
              </div>
              <span className="badge badge-primary">Qiskit Aer Ready</span>
            </div>

            {/* Qubit wires */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.25rem', overflowX: 'auto', position: 'relative' }}>
              {Array.from({ length: numQubits }, (_, qIdx) => (
                <div key={qIdx} style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                  {/* Label */}
                  <div style={{ width: '68px', fontWeight: 600, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                    <span>q{qIdx}:</span>
                    <span style={{ fontSize: '0.82rem', color: '#64748b' }}>|0⟩</span>
                  </div>

                  {/* Wire line */}
                  <div style={{ position: 'absolute', left: '68px', right: 0, height: '2px', background: '#cbd5e1', zIndex: 1 }} />

                  {/* Slots */}
                  <div style={{ display: 'flex', gap: '4px', marginLeft: '68px', zIndex: 2 }}>
                    {Array.from({ length: NUM_STEPS }, (_, sIdx) => {
                      const { gate, label, isMulti } = getCellDisplay(operations, qIdx, sIdx);
                      return (
                        <GateSlot
                          key={sIdx}
                          gate={gate}
                          label={label}
                          isMulti={isMulti}
                          qIdx={qIdx}
                          sIdx={sIdx}
                          onCellClick={handleCellClick}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ━━━ Code Mode ━━━ */}
        {mode === 'code' && (
          <CodeEditor
            code={codeText}
            onChange={handleCodeChange}
            errors={codeErrors}
            onApply={handleApplyCode}
          />
        )}

        {/* ━━━ Bottom guidance card ━━━ */}
        <div className="card" style={{ marginTop: '1.5rem', background: '#f8fafc' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontWeight: 600, color: '#1e3a8a', fontSize: '0.95rem' }}>
                {mode === 'visual' ? 'Visual Circuit Builder' : 'Qiskit Code Editor'}
              </div>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#475569' }}>
                {mode === 'visual'
                  ? <>Place gates on the quantum register, then click <strong>Simulate</strong> to run on Qiskit Aer.</>
                  : <>Write Qiskit-style code, click <strong>Apply Code</strong> to update the circuit, then <strong>Simulate</strong>.</>}
              </p>
            </div>
            <button className="btn btn-primary" onClick={handleSimulate} disabled={isSimulating}>
              {isSimulating ? 'Running…' : 'Run Simulation & Inspect Results →'}
            </button>
          </div>
        </div>
      </div>

      {/* Floating AI Tutor Entry Button */}
      <FloatingAITutorBtn
        screen={mode === 'code' ? 'code-mode' : 'circuit-builder'}
        getContextData={getTutorContextData}
        customLabel="Ask AI Tutor"
      />
    </div>
  );
}
