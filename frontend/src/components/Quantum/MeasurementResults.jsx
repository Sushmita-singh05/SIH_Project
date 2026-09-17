import React, { useState, memo } from 'react';

/**
 * MeasurementResults component
 * Visualizes quantum measurement statistics, probabilities, and shot counts
 * across all computational basis states.
 */
function MeasurementResults({
  counts = {},
  probabilities = {},
  shots = 1024,
  numQubits = 2,
}) {
  const [viewMode, setViewMode] = useState('bars'); // 'bars' | 'table'

  // Generate all 2^numQubits basis strings (e.g. '00', '01', '10', '11' for 2 qubits)
  const totalStates = Math.pow(2, Math.max(1, Math.min(6, numQubits)));
  const allBasisKeys = [];
  for (let i = 0; i < totalStates; i++) {
    allBasisKeys.push(i.toString(2).padStart(numQubits, '0'));
  }

  // Calculate stats
  const totalMeasuredShots = Object.values(counts).reduce((acc, c) => acc + c, 0) || shots;
  const nonZeroCount = Object.keys(counts).filter((k) => (counts[k] || 0) > 0).length;

  return (
    <div className="card measurement-results-card" style={{ padding: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h3 className="card-title" style={{ margin: 0, fontSize: '1.05rem' }}>
              Measurement Probabilities
            </h3>
            <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
              {shots} Shots
            </span>
          </div>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
            Empirical distribution across computational basis states |x⟩.
          </p>
        </div>

        {/* View mode toggle */}
        <div style={{ display: 'flex', gap: '2px', background: 'var(--color-bg)', padding: '2px', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
          <button
            className={`btn btn-sm ${viewMode === 'bars' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '3px 10px', fontSize: '0.75rem' }}
            onClick={() => setViewMode('bars')}
          >
            Bars
          </button>
          <button
            className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '3px 10px', fontSize: '0.75rem' }}
            onClick={() => setViewMode('table')}
          >
            Table
          </button>
        </div>
      </div>

      {/* Main Content */}
      {viewMode === 'bars' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
          {allBasisKeys.map((stateKey) => {
            const count = counts[stateKey] || 0;
            const prob = probabilities[stateKey] != null
              ? probabilities[stateKey]
              : count / totalMeasuredShots;
            const pct = (prob * 100).toFixed(1);
            const isObserved = count > 0;

            return (
              <div
                key={stateKey}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '70px 1fr 65px 75px',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  background: isObserved ? '#f8fafc' : 'transparent',
                  border: isObserved ? '1px solid #e2e8f0' : '1px solid transparent',
                  transition: 'background 0.2s',
                }}
              >
                {/* Basis Ket label */}
                <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.9rem', color: isObserved ? '#1e3a8a' : '#94a3b8' }}>
                  |{stateKey}⟩
                </div>

                {/* Progress Bar */}
                <div style={{ background: '#e2e8f0', borderRadius: '4px', height: '14px', width: '100%', overflow: 'hidden', position: 'relative' }}>
                  <div
                    style={{
                      width: `${Math.min(100, Math.max(0, prob * 100))}%`,
                      height: '100%',
                      background: isObserved
                        ? 'linear-gradient(90deg, #2563eb, #3b82f6)'
                        : 'transparent',
                      borderRadius: '4px',
                      transition: 'width 0.4s ease-out',
                    }}
                  />
                </div>

                {/* Percentage */}
                <div style={{ textAlign: 'right', fontWeight: 600, fontSize: '0.85rem', color: isObserved ? '#0f172a' : '#94a3b8' }}>
                  {pct}%
                </div>

                {/* Shot count badge */}
                <div style={{ textAlign: 'right', fontSize: '0.78rem', color: '#64748b' }}>
                  {count} shot{count !== 1 ? 's' : ''}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div style={{ overflowX: 'auto', marginTop: '0.5rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                <th style={{ padding: '8px' }}>Basis State</th>
                <th style={{ padding: '8px' }}>Counts</th>
                <th style={{ padding: '8px' }}>Measured Probability</th>
                <th style={{ padding: '8px' }}>Percentage</th>
              </tr>
            </thead>
            <tbody>
              {allBasisKeys.map((stateKey) => {
                const count = counts[stateKey] || 0;
                const prob = probabilities[stateKey] != null
                  ? probabilities[stateKey]
                  : count / totalMeasuredShots;
                return (
                  <tr key={stateKey} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px', fontWeight: 700, fontFamily: 'monospace' }}>|{stateKey}⟩</td>
                    <td style={{ padding: '8px' }}>{count}</td>
                    <td style={{ padding: '8px', color: '#475569' }}>{prob.toFixed(4)}</td>
                    <td style={{ padding: '8px', fontWeight: 600, color: count > 0 ? '#2563eb' : '#94a3b8' }}>
                      {(prob * 100).toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary Footer */}
      <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--color-text-secondary)', flexWrap: 'wrap', gap: '0.5rem' }}>
        <span>
          Active outcomes: <strong>{nonZeroCount} of {totalStates}</strong> states observed
        </span>
        <span>
          Total sampled: <strong>{totalMeasuredShots.toLocaleString()}</strong> shots
        </span>
      </div>
    </div>
  );
}

export default memo(MeasurementResults);
