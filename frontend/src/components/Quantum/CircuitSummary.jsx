import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * CircuitSummary component
 * Displays a compact, readable summary of the quantum circuit that produced
 * the active simulation results.
 */
function CircuitSummary({
  operations = [],
  qubits = 2,
  shots = 1024,
  backend = 'Qiskit Aer Simulator',
  executionTimeMs = null,
}) {
  const navigate = useNavigate();

  // Format operations into clean mathematical / gate descriptions
  const sortedOps = [...operations].sort((a, b) => (a.step ?? 0) - (b.step ?? 0));

  const formattedGates = sortedOps.map((op, idx) => {
    const gate = op.gate?.toUpperCase() || 'GATE';
    let desc = '';

    if (gate === 'CNOT' || gate === 'CX') {
      const c = op.control != null ? op.control : 0;
      const t = op.target != null ? op.target : 1;
      desc = `CNOT(q${c} → q${t})`;
    } else if (gate === 'CZ') {
      const c = op.control != null ? op.control : 0;
      const t = op.target != null ? op.target : 1;
      desc = `CZ(q${c}, q${t})`;
    } else if (gate === 'SWAP') {
      const q1 = op.control != null ? op.control : (op.qubit ?? 0);
      const q2 = op.target != null ? op.target : 1;
      desc = `SWAP(q${q1}, q${q2})`;
    } else if (gate === 'TOFFOLI' || gate === 'CCX') {
      const c1 = op.control1 != null ? op.control1 : 0;
      const c2 = op.control2 != null ? op.control2 : 1;
      const t = op.target != null ? op.target : 2;
      desc = `CCX(q${c1}, q${c2} → q${t})`;
    } else if (['RX', 'RY', 'RZ'].includes(gate)) {
      const angle = op.params && op.params[0] != null ? op.params[0] : 'π/2';
      desc = `${gate}(θ=${angle}, q${op.qubit ?? 0})`;
    } else if (gate === 'M' || gate === 'MEASURE') {
      desc = `Measure(q${op.qubit ?? 0})`;
    } else {
      desc = `${gate}(q${op.qubit ?? 0})`;
    }

    return { id: idx, desc, step: op.step ?? idx, gate };
  });

  return (
    <div className="card circuit-summary-card" style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        {/* Left: Metadata Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>
            Circuit Summary:
          </span>

          <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
            {qubits} Qubit{qubits !== 1 ? 's' : ''}
          </span>

          <span className="badge badge-outline" style={{ fontSize: '0.75rem' }}>
            {shots} Shots
          </span>

          <span className="badge badge-outline" style={{ fontSize: '0.75rem' }}>
            Backend: {backend}
          </span>

          {executionTimeMs != null && (
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
              ⏱ {executionTimeMs} ms
            </span>
          )}
        </div>

        {/* Right: Modify in Builder Action */}
        <button
          className="btn btn-outline btn-sm"
          style={{ fontSize: '0.75rem', padding: '4px 12px' }}
          onClick={() => navigate('/circuit-builder')}
        >
          ✏️ Edit Circuit in Builder
        </button>
      </div>

      {/* Sequential Gate Flow */}
      <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border-soft)' }}>
        {formattedGates.length > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
              Sequence:
            </span>
            {formattedGates.map((item, idx) => (
              <React.Fragment key={item.id}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    fontFamily: 'monospace',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: '#1e3a8a',
                  }}
                >
                  {item.desc}
                </span>
                {idx < formattedGates.length - 1 && (
                  <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>→</span>
                )}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
            No gates placed. Initial state |0...0⟩ measured directly.
          </p>
        )}
      </div>
    </div>
  );
}

export default memo(CircuitSummary);
