import React, { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import TopHeader from '../components/Layout/TopHeader';
import { useLearningContext } from '../context/LearningContext';

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
    submitChallengeAttempt
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
  const [verificationResult, setVerificationResult] = useState(null);

  const handleCellClick = useCallback((qIdx, sIdx) => {
    setGrid(prev => {
      const newGrid = prev.map(r => [...r]);
      newGrid[qIdx][sIdx] = newGrid[qIdx][sIdx] === selectedGate ? null : selectedGate;
      return newGrid;
    });
    setVerificationResult(null);
  }, [selectedGate]);

  const handleVerify = useCallback(() => {
    // Correct Bell state circuit:
    // H gate on q0 (slot 0 or 1)
    // CNOT gate on q0 & q1 in subsequent slot
    const hasHonQ0 = grid[0][0] === 'H' || grid[0][1] === 'H';
    const hasCNOT = (grid[0][1] === 'CNOT' && grid[1][1] === 'CNOT') || 
                    (grid[0][2] === 'CNOT' && grid[1][2] === 'CNOT') ||
                    (grid[1][1] === 'CNOT' || grid[1][2] === 'CNOT');

    if (hasHonQ0 && hasCNOT) {
      setVerificationResult({
        success: true,
        title: "Bell State Confirmed! (|Φ⁺⟩)",
        message: "Excellent work! Applying H on q0 followed by CNOT targeting q1 produces the maximally entangled state (|00⟩ + |11⟩)/√2.",
        fidelity: "100.0%"
      });
      submitChallengeAttempt(true);
    } else {
      const errReason = "To produce Bell state |Φ⁺⟩, you must place an H gate on q0, followed by a CNOT gate coupling q0 to q1.";
      setVerificationResult({
        success: false,
        title: "Circuit Incomplete",
        message: errReason,
        fidelity: "0.0%"
      });
      submitChallengeAttempt(false, errReason);
    }
  }, [grid, submitChallengeAttempt]);

  const handlePreFillSolution = useCallback(() => {
    setGrid([
      ['H', 'CNOT', null],
      [null, 'CNOT', null]
    ]);
  }, []);

  return (
    <div className="app-main-content">
      <TopHeader title="Challenge: Bell State Generation" subtitle="Synthesize the maximally entangled state |Φ⁺⟩ = (|00⟩ + |11⟩)/√2." />

      <div className="challenge-container">
        {/* Challenge Objective Card */}
        <div className="card" style={{ marginBottom: '1.5rem', background: '#eff6ff', border: '1px solid #bfdbfe' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span className="badge badge-primary">Assessment Objective</span>
              <h3 style={{ margin: '0.5rem 0 0.25rem 0', color: '#1e3a8a' }}>Construct Bell State |Φ⁺⟩</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#2563eb' }}>
                1. Superpose q0 with a Hadamard gate.<br />
                2. Entangle q1 using a CNOT gate with q0 as the control.
              </p>
            </div>
            <button className="btn btn-sm btn-outline" onClick={handlePreFillSolution}>
              Auto-place Solution
            </button>
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
            <button className="btn btn-primary btn-sm" onClick={handleVerify}>
              Verify Circuit Check ✓
            </button>
          </div>
        </div>

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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, color: verificationResult.success ? '#166534' : '#991b1b' }}>
                  {verificationResult.title}
                </h3>
                <p style={{ margin: '0.5rem 0 0 0', color: verificationResult.success ? '#15803d' : '#b91c1c', fontSize: '0.9rem' }}>
                  {verificationResult.message}
                </p>
              </div>
              {verificationResult.success && (
                <button className="btn btn-primary" onClick={() => navigate('/progress')}>
                  View Updated Progress →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
