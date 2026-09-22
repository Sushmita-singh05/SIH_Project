import React, { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import TopHeader from '../components/Layout/TopHeader';
import FloatingAITutorBtn from '../components/AITutor/FloatingAITutorBtn';
import { useLearningContext } from '../context/LearningContext';
import { buildTutorContext, saveTutorContext } from '../utils/tutorContext';
import { gridToOperations } from '../utils/circuitUtils';
import { evaluateChallenge } from '../services/api';

const ChallengeGateSlot = memo(function ChallengeGateSlot({ gate, qIdx, sIdx, onCellClick }) {
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
        background: gate ? '#2563eb' : '#ffffff',
        color: gate ? '#ffffff' : '#94a3b8',
        border: gate ? '2px solid #1d4ed8' : '1px dashed #cbd5e1',
        fontWeight: 'bold',
        cursor: 'pointer'
      }}
    >
      {gate || '+'}
    </div>
  );
});

export default function Challenge() {
  const navigate = useNavigate();
  const {
    currentChallenge,
    expectedOutput,
    updateCurrentChallenge,
    submitChallengeAttempt,
    recordChallengeResult,
    updateSimulationResult,
    progress,
    lastUserAction,
  } = useLearningContext();

  // Set challenge and expectedOutput when mounting Challenge page
  useEffect(() => {
    updateCurrentChallenge(
      {
        id: 'bell-state',
        title: 'Bell State Generation',
        objective: 'Synthesize the maximally entangled state |Φ⁺⟩ = (|00⟩ + |11⟩)/√2'
      },
      {
        description: 'Bell State |Φ⁺⟩: ~50% |00⟩, ~50% |11⟩, 0% |01⟩, 0% |10⟩',
        targetStates: ['00', '11']
      }
    );
  }, [updateCurrentChallenge]);

  // Challenge grid: 2 qubits x 3 slots
  const [grid, setGrid] = useState([
    [null, null, null],
    [null, null, null]
  ]);
  const [selectedGate, setSelectedGate] = useState('H');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalError, setEvalError] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);

  const handleCellClick = useCallback((qIdx, sIdx) => {
    setGrid(prev => {
      const newGrid = prev.map(r => [...r]);
      newGrid[qIdx][sIdx] = newGrid[qIdx][sIdx] === selectedGate ? null : selectedGate;
      return newGrid;
    });
    setVerificationResult(null);
    setEvalError(null);
  }, [selectedGate]);

  const handleVerify = useCallback(async () => {
    if (isEvaluating) return;
    setIsEvaluating(true);
    setEvalError(null);

    // Convert visual grid to canonical operations array
    const operations = gridToOperations(grid);

    // Guard: Empty circuit check
    if (!operations || operations.length === 0) {
      const emptyMsg = "Your circuit is currently empty. Place a Hadamard (H) gate on q0 to initialize superposition, then add a CNOT gate with q0 as control and q1 as target to entangle the qubits into Bell state |Φ⁺⟩.";
      const res = {
        success: false,
        score: 0,
        status: 'Failed',
        title: 'Circuit Incomplete',
        message: emptyMsg,
        fidelity: '0.0%',
        expected: { '00': 0.5, '11': 0.5, '01': 0.0, '10': 0.0 },
        actual: { '00': 0.0, '11': 0.0, '01': 0.0, '10': 0.0 },
        feedback: emptyMsg,
        diagnostics: { has_h_gate: false, has_cnot: false }
      };
      setVerificationResult(res);
      submitChallengeAttempt(false, emptyMsg);
      recordChallengeResult({
        id: 'bell-state',
        title: 'Bell State Generation',
        topic: 'Entanglement & Bell States',
        passed: false,
        score: 0
      });
      setIsEvaluating(false);
      return;
    }

    try {
      // Execute Qiskit Aer quantum simulation and challenge evaluation
      const evalResponse = await evaluateChallenge('bell-state', {
        qubits: 2,
        shots: 1024,
        operations
      });

      const isPassed = Boolean(evalResponse.passed);
      const scoreVal = typeof evalResponse.score === 'number' ? evalResponse.score : (isPassed ? 100 : 0);

      const res = {
        success: isPassed,
        score: scoreVal,
        status: isPassed ? 'Passed' : 'Failed',
        title: isPassed ? 'Bell State Confirmed! (|Φ⁺⟩)' : 'Challenge Attempt Evaluated',
        message: evalResponse.feedback,
        fidelity: evalResponse.fidelity || `${scoreVal}%`,
        expected: evalResponse.expected || { '00': 0.5, '11': 0.5, '01': 0.0, '10': 0.0 },
        actual: evalResponse.actual || {},
        probabilities: evalResponse.probabilities || {},
        counts: evalResponse.counts || {},
        feedback: evalResponse.feedback,
        diagnostics: evalResponse.diagnostics,
        executionTimeMs: evalResponse.executionTimeMs
      };

      setVerificationResult(res);
      submitChallengeAttempt(isPassed, isPassed ? null : evalResponse.feedback);
      recordChallengeResult({
        id: 'bell-state',
        title: 'Bell State Generation',
        topic: 'Entanglement & Bell States',
        passed: isPassed,
        score: scoreVal
      });

      if (evalResponse.probabilities) {
        updateSimulationResult({
          counts: evalResponse.counts,
          probabilities: evalResponse.probabilities,
          shots: evalResponse.shots || 1024,
          qubits: 2,
          backend: 'Qiskit Aer Simulator',
          executionTimeMs: evalResponse.executionTimeMs || 42
        });
      }
    } catch (err) {
      console.error('Challenge simulation evaluation failed:', err);
      const friendlyErr = 'Unable to evaluate your circuit with the quantum simulator. Please ensure the Python backend is running on port 8010 and try again.';
      // Never surface raw Python stack traces or internal paths to the student.
      const rawMsg = typeof err?.message === 'string' ? err.message : '';
      const isSafe = rawMsg.length > 0
        && !/Traceback|File "|\.py", line|<class '/i.test(rawMsg);
      const studentMsg = isSafe ? rawMsg : friendlyErr;
      setEvalError(studentMsg);
      setVerificationResult({
        success: false,
        score: 0,
        status: 'Error',
        title: 'Evaluation Could Not Complete',
        message: studentMsg,
        fidelity: '0.0%',
        expected: { '00': 0.5, '11': 0.5, '01': 0.0, '10': 0.0 },
        actual: { '00': 0.0, '11': 0.0, '01': 0.0, '10': 0.0 },
        feedback: studentMsg
      });
    } finally {
      setIsEvaluating(false);
    }
  }, [grid, isEvaluating, submitChallengeAttempt, recordChallengeResult, updateSimulationResult]);

  const getChallengeContextData = useCallback(() => {
    const ops = gridToOperations(grid);
    return {
      topic: currentChallenge?.title || 'Bell State Generation',
      challenge: currentChallenge || { id: 'bell-state', title: 'Bell State Generation' },
      circuit: { qubits: 2, operations: ops },
      grid,
      hintLevel: 1,
      hintMode: true,
      lastError: verificationResult && !verificationResult.success ? verificationResult.message : null,
      evaluationResult: verificationResult,
      score: verificationResult ? verificationResult.score : null,
      passed: verificationResult ? verificationResult.success : null,
      progress: progress,
      lastAction: lastUserAction,
    };
  }, [currentChallenge, grid, verificationResult, progress, lastUserAction]);

  const handleAskTutor = useCallback(() => {
    const ctx = buildTutorContext('challenge', getChallengeContextData());
    saveTutorContext(ctx);
    navigate('/ai-tutor');
  }, [getChallengeContextData, navigate]);

  const handlePreFillSolution = useCallback(() => {
    setGrid([
      ['H', 'CNOT', null],
      [null, 'CNOT', null]
    ]);
    setVerificationResult(null);
    setEvalError(null);
  }, []);

  return (
    <div className="app-main-content">
      <TopHeader title="Challenge: Bell State Generation" subtitle="Synthesize the maximally entangled state |Φ⁺⟩ = (|00⟩ + |11⟩)/√2." />

      <div className="challenge-container">
        {/* Challenge Objective Card */}
        <div className="card" style={{ marginBottom: '1.5rem', background: '#eff6ff', border: '1px solid #bfdbfe' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <span className="badge badge-primary">Assessment Objective</span>
              <h3 style={{ margin: '0.5rem 0 0.25rem 0', color: '#1e3a8a' }}>Construct Bell State |Φ⁺⟩</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#2563eb' }}>
                1. Superpose q0 with a Hadamard gate.<br />
                2. Entangle q1 using a CNOT gate with q0 as the control.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-sm btn-outline" onClick={handleAskTutor} style={{ borderColor: '#2563eb', color: '#2563eb', fontWeight: 600 }}>
                💡 Need a Hint?
              </button>
              <button className="btn btn-sm btn-outline" onClick={handlePreFillSolution}>
                Auto-place Solution
              </button>
            </div>
          </div>
        </div>

        {/* Builder Toolbar */}
        <div className="card" style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Select Gate:</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['H', 'CNOT', 'X', 'Z'].map((gate) => (
                <button
                  key={gate}
                  className={`btn btn-sm ${selectedGate === gate ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setSelectedGate(gate)}
                  style={{ minWidth: '45px', fontWeight: 'bold' }}
                >
                  {gate}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-outline btn-sm" onClick={() => setGrid([[null, null, null], [null, null, null]])}>
              Clear
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleVerify} disabled={isEvaluating}>
              {isEvaluating ? 'Simulating…' : 'Verify Circuit Check ✓'}
            </button>
          </div>
        </div>

        {/* User-friendly evaluation error banner */}
        {evalError && (
          <div
            role="alert"
            style={{
              marginTop: '0.75rem',
              padding: '0.7rem 1rem',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#991b1b',
              fontSize: '0.9rem'
            }}
          >
            {evalError}
          </div>
        )}

        {/* Circuit Canvas */}
        <div className="card" style={{ padding: '2.5rem 2rem', minHeight: '280px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem', position: 'relative' }}>
            {[0, 1].map((qIdx) => (
              <div key={qIdx} style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                <div style={{ width: '80px', fontWeight: 600, color: 'var(--color-primary)' }}>
                  q{qIdx}: |0⟩
                </div>
                <div style={{ position: 'absolute', left: '80px', right: '40px', height: '2px', background: '#cbd5e1', zIndex: 1 }}></div>

                <div style={{ display: 'flex', justifyContent: 'space-around', flex: 1, marginLeft: '80px', marginRight: '40px', zIndex: 2 }}>
                  {[0, 1, 2].map((sIdx) => (
                    <ChallengeGateSlot
                      key={sIdx}
                      gate={grid[qIdx][sIdx]}
                      qIdx={qIdx}
                      sIdx={sIdx}
                      onCellClick={handleCellClick}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Verification Result Feedback */}
        {verificationResult && (
          <div
            className="card"
            style={{
              marginTop: '1.5rem',
              background: verificationResult.success ? '#f0fdf4' : '#fef2f2',
              borderColor: verificationResult.success ? '#bbf7d0' : '#fecaca'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, color: verificationResult.success ? '#166534' : '#991b1b' }}>
                  {verificationResult.title}
                </h3>
                <p style={{ margin: '0.5rem 0 0 0', color: verificationResult.success ? '#15803d' : '#b91c1c', fontSize: '0.9rem' }}>
                  Score: {verificationResult.score}/100 · Status: {verificationResult.status}
                </p>
              </div>
              {verificationResult.success && (
                <button className="btn btn-primary" onClick={() => navigate('/progress')}>
                  View Updated Progress →
                </button>
              )}
            </div>

            {/* Expected vs. actual measurement distributions */}
            {(verificationResult.expected || verificationResult.actual) && (
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                {[
                  { label: 'Expected Output', data: verificationResult.expected, color: '#1e3a8a' },
                  { label: 'Your Output (simulated)', data: verificationResult.actual, color: verificationResult.success ? '#166534' : '#991b1b' }
                ].map((col) => (
                  col.data ? (
                    <div key={col.label} style={{ flex: '1 1 220px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem 1rem' }}>
                      <strong style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: col.color }}>
                        {col.label}
                      </strong>
                      <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#334155', fontFamily: 'monospace', lineHeight: 1.7 }}>
                        {Object.entries(col.data).map(([state, p]) => (
                          <div key={state}>
                            |{state}⟩ ≈ {typeof p === 'number' ? `${Math.round(p * 100)}%` : p}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null
                ))}
              </div>
            )}

            <div style={{ marginTop: '1rem' }}>
              <strong style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569' }}>
                Feedback
              </strong>
              <p style={{ margin: '0.35rem 0 0 0', whiteSpace: 'pre-line', fontSize: '0.92rem', color: '#1f2937', lineHeight: 1.6 }}>
                {verificationResult.feedback}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Floating AI Tutor Entry Button */}
      <FloatingAITutorBtn
        screen="challenge"
        getContextData={getChallengeContextData}
        customLabel="Need a Hint? Ask Tutor"
      />
    </div>
  );
}
