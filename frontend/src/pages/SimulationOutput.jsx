import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import TopHeader from '../components/Layout/TopHeader';
import BlochSphere from '../components/Quantum/BlochSphere';
import MeasurementResults from '../components/Quantum/MeasurementResults';
import CircuitSummary from '../components/Quantum/CircuitSummary';
import SimulationExplanation from '../components/Quantum/SimulationExplanation';
import FloatingAITutorBtn from '../components/AITutor/FloatingAITutorBtn';
import { DEMO_RESULT } from '../data/mockData';
import { simulateCircuit, getAvailableBackends } from '../services/api';
import { useLearningContext } from '../context/LearningContext';
import { buildTutorContext, saveTutorContext } from '../utils/tutorContext';

export default function SimulationOutput() {
  const navigate = useNavigate();
  const {
    simulationResult,
    updateSimulationResult,
    currentCircuit,
    setLastError,
  } = useLearningContext();

  // Multi-backend state
  const [availableBackends, setAvailableBackends] = useState([
    {
      id: 'qiskit-aer',
      name: 'Qiskit Aer Simulator',
      status: 'active',
      is_default: true,
      description: 'High-performance C++ simulator with exact statevector and noise-free sampling.',
    },
    {
      id: 'pennylane',
      name: 'PennyLane (default.qubit)',
      status: 'coming_soon',
      is_default: false,
      description: 'PennyLane adapter architecture prepared. Requires pennylane package.',
    },
  ]);

  const [selectedBackend, setSelectedBackend] = useState('qiskit-aer');
  const [backendNotice, setBackendNotice] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showStatevectorTable, setShowStatevectorTable] = useState(false);

  // Load backend catalog dynamically on mount
  useEffect(() => {
    let isMounted = true;
    getAvailableBackends()
      .then((backends) => {
        if (isMounted && Array.isArray(backends) && backends.length > 0) {
          setAvailableBackends(backends);
        }
      })
      .catch((err) => {
        console.warn('Using default backend catalog fallback:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Initialize simData from LearningContext -> localStorage -> DEMO_RESULT (initial blank visit only)
  const [simData, setSimData] = useState(() => {
    if (simulationResult && simulationResult.counts) {
      const sv = simulationResult.statevector && simulationResult.statevector.length > 0
        ? simulationResult.statevector
        : null;
      const bs = simulationResult.blochSpheres && simulationResult.blochSpheres.length > 0
        ? simulationResult.blochSpheres
        : [];
      return {
        isRealResult: true,
        backend: simulationResult.backend || 'Qiskit Aer Simulator',
        backendId: simulationResult.backendId || 'qiskit-aer',
        shots: simulationResult.shots || 1024,
        qubits: simulationResult.qubits || 2,
        executionTimeMs: simulationResult.executionTimeMs || 35,
        counts: simulationResult.counts,
        probabilities: simulationResult.probabilities || {},
        statevector: sv,
        blochSpheres: bs,
        circuit: simulationResult.circuit,
      };
    }

    try {
      const saved = localStorage.getItem('quantumSimulationResult') || localStorage.getItem('ql_simulation_result');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.counts) {
          const sv = parsed.statevector && parsed.statevector.length > 0
            ? parsed.statevector
            : null;
          const bs = parsed.blochSpheres && parsed.blochSpheres.length > 0
            ? parsed.blochSpheres
            : [];
          return {
            isRealResult: true,
            backend: parsed.backend || 'Qiskit Aer Simulator',
            backendId: parsed.backendId || 'qiskit-aer',
            shots: parsed.shots || 1024,
            qubits: parsed.qubits || 2,
            executionTimeMs: parsed.executionTimeMs || 35,
            counts: parsed.counts,
            probabilities: parsed.probabilities || {},
            statevector: sv,
            blochSpheres: bs,
            circuit: parsed.circuit,
          };
        }
      }
    } catch (e) {
      console.warn('Could not parse saved simulation result:', e);
    }
    return { ...DEMO_RESULT, isRealResult: false, backendId: 'qiskit-aer' };
  });

  const [shots, setShots] = useState(simData.shots || 1024);
  const [counts, setCounts] = useState(simData.counts || DEMO_RESULT.counts);

  // Sync if LearningContext's simulationResult updates externally
  useEffect(() => {
    if (simulationResult && simulationResult.counts) {
      const sv = simulationResult.statevector && simulationResult.statevector.length > 0
        ? simulationResult.statevector
        : null;
      const bs = simulationResult.blochSpheres && simulationResult.blochSpheres.length > 0
        ? simulationResult.blochSpheres
        : [];
      setSimData({
        isRealResult: true,
        backend: simulationResult.backend || 'Qiskit Aer Simulator',
        backendId: simulationResult.backendId || 'qiskit-aer',
        shots: simulationResult.shots || 1024,
        qubits: simulationResult.qubits || 2,
        executionTimeMs: simulationResult.executionTimeMs || 35,
        counts: simulationResult.counts,
        probabilities: simulationResult.probabilities || {},
        statevector: sv,
        blochSpheres: bs,
        circuit: simulationResult.circuit,
      });
    }
  }, [simulationResult]);

  // Sync local state when simData updates
  useEffect(() => {
    if (simData) {
      setShots(simData.shots || 1024);
      setCounts(simData.counts || DEMO_RESULT.counts);
      if (simData.backendId) setSelectedBackend(simData.backendId);
    }
  }, [simData]);

  // Extract operations list
  const operations = useMemo(() => {
    if (currentCircuit?.operations && currentCircuit.operations.length > 0) {
      return currentCircuit.operations;
    }
    if (simData.circuit?.operations && simData.circuit.operations.length > 0) {
      return simData.circuit.operations;
    }
    try {
      const s = localStorage.getItem('ql_circuit');
      if (s) return JSON.parse(s).operations || [];
    } catch (_) {}
    return [];
  }, [currentCircuit, simData]);

  // Backend Selector change handler
  const handleBackendChange = useCallback((newBackendId) => {
    setSelectedBackend(newBackendId);
    setErrorMessage(null);

    const backendMeta = availableBackends.find((b) => b.id === newBackendId);
    if (newBackendId === 'pennylane' && (!backendMeta || backendMeta.status !== 'active')) {
      setBackendNotice(
        'PennyLane adapter architecture is prepared in backend/quantum/adapters/pennylane_adapter.py. ' +
        'Install pennylane (pip install pennylane) in your Python environment to enable live execution. ' +
        'Simulation will currently route to Qiskit Aer.'
      );
    } else {
      setBackendNotice(null);
    }
  }, [availableBackends]);

  // Re-run simulation
  const handleRerun = useCallback(async () => {
    setIsSimulating(true);
    setErrorMessage(null);

    const effectiveBackend = selectedBackend === 'pennylane' ? 'pennylane' : 'qiskit-aer';

    try {
      const payload = {
        qubits: simData.qubits || 2,
        shots,
        operations,
        backend: effectiveBackend,
      };

      const freshData = await simulateCircuit(payload, effectiveBackend);
      const normalizedData = { ...freshData, isRealResult: true };

      localStorage.setItem('quantumSimulationResult', JSON.stringify(freshData));
      localStorage.setItem('ql_simulation_result', JSON.stringify(freshData));
      localStorage.setItem('quantumLeapSimulation', JSON.stringify({
        qubits: simData.qubits || 2,
        lesson: 'Foundations: Superposition & Entanglement',
        operations,
        result: freshData,
        backend: freshData.backend || 'Qiskit Aer Simulator',
      }));

      updateSimulationResult(freshData);
      setSimData(normalizedData);
      setCounts(freshData.counts);
      setBackendNotice(null);
    } catch (err) {
      console.warn('Simulation rerun error:', err);
      const msg = err.message || 'Simulation execution failed. Verify backend service is running.';
      setErrorMessage(msg);
      setLastError(msg);
    } finally {
      setIsSimulating(false);
    }
  }, [shots, operations, simData.qubits, selectedBackend, updateSimulationResult, setLastError]);

  // AI Tutor Context Passing
  const getSimContextData = useCallback((optionalQuestion = null) => ({
    topic: 'Simulation Output Analysis',
    circuit: {
      qubits: simData.qubits || 2,
      operations,
    },
    backend: selectedBackend,
    shots,
    counts,
    probabilities: simData.probabilities || {},
    statevector: simData.statevector,
    bloch: simData.blochSpheres || [],
    userPrompt: optionalQuestion || null,
  }), [simData, operations, selectedBackend, shots, counts]);

  const handleAskTutor = useCallback((optionalQuestion = null) => {
    const data = getSimContextData(optionalQuestion);
    const tutorContext = buildTutorContext('simulation-output', data);
    saveTutorContext(tutorContext);
    navigate('/ai-tutor');
  }, [getSimContextData, navigate]);

  const statevectorRows = simData.statevector || DEMO_RESULT.statevector || [];

  return (
    <div className="app-main-content">
      <TopHeader
        title="Simulation Output"
        subtitle="Multi-Backend Quantum Execution Results and State Representations."
      />

      <div className="sim-content" style={{ padding: '0 0 2rem 0' }}>
        {/* Top Controls Bar */}
        <div
          className="card"
          style={{
            marginBottom: '1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            padding: '1rem 1.25rem',
          }}
        >
          {/* Left: Status & Multi-Backend Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <span className={`badge ${simData.isRealResult ? 'badge-success' : 'badge-outline'}`}>
              {simData.isRealResult ? '✓ Real Simulation' : 'Demo Fallback Data'}
            </span>

            {/* Backend Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label htmlFor="backendSelect" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                Backend:
              </label>
              <select
                id="backendSelect"
                value={selectedBackend}
                onChange={(e) => handleBackendChange(e.target.value)}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border)',
                  background: '#ffffff',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#1e3a8a',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {availableBackends.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} {b.status === 'active' ? '(Active)' : '(Prepared)'}
                  </option>
                ))}
              </select>
            </div>

            <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
              Shots: <strong>{shots}</strong>
            </span>
          </div>

          {/* Right: Actions */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => navigate('/circuit-builder')}
            >
              ← Back to Circuit
            </button>
            <button
              className="btn btn-outline btn-sm"
              onClick={handleRerun}
              disabled={isSimulating}
            >
              {isSimulating ? 'Running…' : '🔄 Re-run Simulation'}
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => handleAskTutor()}
            >
              🤖 Ask AI Tutor →
            </button>
          </div>
        </div>

        {/* Backend In-Preparation Notification */}
        {backendNotice && (
          <div
            style={{
              marginBottom: '1.25rem',
              padding: '0.75rem 1rem',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '8px',
              color: '#1e40af',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
            }}
          >
            <span>ℹ️</span>
            <div style={{ flex: 1 }}>{backendNotice}</div>
            <button
              onClick={() => setBackendNotice(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1e40af', fontWeight: 'bold' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div
            style={{
              marginBottom: '1.25rem',
              padding: '0.75rem 1rem',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#991b1b',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span>⚠️</span>
            <span style={{ flex: 1 }}>{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b', fontWeight: 'bold' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* 1. Circuit Summary */}
        <CircuitSummary
          operations={operations}
          qubits={simData.qubits || 2}
          shots={shots}
          backend={simData.backend || 'Qiskit Aer Simulator'}
          executionTimeMs={simData.executionTimeMs}
        />

        {/* 2. Visualizations Grid: Measurement Results & 3D Bloch Sphere */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '1.25rem',
            alignItems: 'start',
          }}
        >
          {/* Measurement Results */}
          <MeasurementResults
            counts={counts}
            probabilities={simData.probabilities || {}}
            shots={shots}
            numQubits={simData.qubits || 2}
          />

          {/* Interactive 3D Bloch Sphere */}
          <BlochSphere
            blochData={simData.blochSpheres}
            numQubits={simData.qubits || 2}
            statevector={simData.statevector}
          />
        </div>

        {/* 3. Learning Explanation: "What happened?" */}
        <SimulationExplanation
          operations={operations}
          qubits={simData.qubits || 2}
          counts={counts}
          onAskPrompt={handleAskTutor}
        />

        {/* 4. Collapsible Theoretical Statevector & Amplitudes Table */}
        <div className="card" style={{ marginTop: '1.25rem', padding: '1rem 1.25rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              userSelect: 'none',
            }}
            onClick={() => setShowStatevectorTable((prev) => !prev)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3 className="card-title" style={{ margin: 0, fontSize: '1rem' }}>
                Theoretical Statevector & Complex Amplitudes
              </h3>
              <span className="badge badge-outline" style={{ fontSize: '0.72rem' }}>
                {statevectorRows.length} Basis States
              </span>
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600 }}>
              {showStatevectorTable ? '▲ Hide Details' : '▼ Expand Table'}
            </span>
          </div>

          {showStatevectorTable && (
            <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                    <th style={{ padding: '0.65rem' }}>Basis State</th>
                    <th style={{ padding: '0.65rem' }}>Real (Re)</th>
                    <th style={{ padding: '0.65rem' }}>Imag (Im)</th>
                    <th style={{ padding: '0.65rem' }}>Theoretical Prob (|α|²)</th>
                    <th style={{ padding: '0.65rem' }}>Phase</th>
                  </tr>
                </thead>
                <tbody>
                  {statevectorRows.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.65rem', fontWeight: 700, fontFamily: 'monospace' }}>
                        {row.basis}
                      </td>
                      <td style={{ padding: '0.65rem' }}>{Number(row.real || 0).toFixed(4)}</td>
                      <td style={{ padding: '0.65rem' }}>{Number(row.imag || 0).toFixed(4)}</td>
                      <td style={{ padding: '0.65rem', fontWeight: 600, color: Number(row.prob || 0) > 0.001 ? '#2563eb' : '#94a3b8' }}>
                        {(Number(row.prob || 0) * 100).toFixed(1)}%
                      </td>
                      <td style={{ padding: '0.65rem' }}>{row.phaseDeg || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Floating AI Tutor Entry Button */}
      <FloatingAITutorBtn
        screen="simulation-output"
        getContextData={getSimContextData}
        customLabel="Ask AI Tutor"
      />
    </div>
  );
}
