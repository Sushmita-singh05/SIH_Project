import React, { memo, useMemo } from 'react';

/**
 * Derives dynamic beginner-friendly physics explanations
 * from circuit operations and measurement results.
 */
function analyzeCircuitResult(operations = [], qubits = 2, counts = {}) {
  const gates = operations.map((o) => o.gate?.toUpperCase());
  const hasHOnQ0 = operations.some((o) => o.gate === 'H' && o.qubit === 0);
  const hasHOnQ1 = operations.some((o) => o.gate === 'H' && o.qubit === 1);
  const hasCNOT_0_1 = operations.some(
    (o) => (o.gate === 'CNOT' || o.gate === 'CX') && o.control === 0 && o.target === 1
  );
  const hasXOnQ0 = operations.some((o) => o.gate === 'X' && o.qubit === 0);
  const hasZOnQ0 = operations.some((o) => o.gate === 'Z' && o.qubit === 0);

  const observedStates = Object.keys(counts).filter((k) => (counts[k] || 0) > 0);

  // 1. Bell State (|Φ⁺⟩ = (|00⟩ + |11⟩)/√2)
  if (qubits === 2 && hasHOnQ0 && hasCNOT_0_1 && operations.length === 2) {
    return {
      title: 'Bell State Generation (|Φ⁺⟩)',
      concept: 'Quantum Entanglement & Superposition',
      paragraphs: [
        'The Hadamard (H) gate put qubit 0 into an equal superposition state: (|0⟩ + |1⟩)/√2.',
        'The CNOT gate then correlated qubit 1 with qubit 0, creating maximal quantum entanglement.',
        'As a result, measuring qubit 0 immediately determines the state of qubit 1. The measurement outcomes are concentrated strictly around |00⟩ (~50%) and |11⟩ (~50%), with zero probability for |01⟩ or |10⟩.',
      ],
      takeaways: [
        'Entangled qubits share quantum information that cannot be described individually.',
        'The Bloch vector for each individual entangled qubit sits at the center (r ≈ 0), indicating a mixed subsystem.',
      ],
      tutorPrompts: [
        'Why did I get 50% 00 and 50% 11 in this Bell state?',
        'What does the center of the Bloch sphere mean for entangled qubits?',
        'What happens if I add an X gate before the CNOT?',
      ],
    };
  }

  // 2. Single-Qubit Hadamard Superposition
  if (hasHOnQ0 && operations.length === 1) {
    return {
      title: 'Single-Qubit Superposition (|+⟩)',
      concept: 'Quantum Superposition & Basis Change',
      paragraphs: [
        'The Hadamard (H) gate mapped the ground state |0⟩ to the equal superposition state |+⟩ = (|0⟩ + |1⟩)/√2.',
        'On the Bloch sphere, the state vector rotated from the North Pole (+z) to the equator at +x.',
        'When measured in the standard computational basis, the quantum wave function collapses with equal ~50% probability to |0⟩ or |1⟩.',
      ],
      takeaways: [
        'Superposition is true quantum indeterminacy, not classical lack of knowledge.',
        'Repeated measurements over multiple shots reveal the Born rule probability: P(x) = |⟨x|ψ⟩|².',
      ],
      tutorPrompts: [
        'Why does the Bloch vector point to +X after an H gate?',
        'What happens if I apply a second H gate?',
        'How does measurement collapse the wave function?',
      ],
    };
  }

  // 3. Single-Qubit Pauli-X (Bit Flip)
  if (hasXOnQ0 && operations.length === 1) {
    return {
      title: 'Quantum Bit-Flip (Pauli-X)',
      concept: 'Deterministic State Transformation',
      paragraphs: [
        'The Pauli-X gate acts as a quantum NOT gate, rotating the state vector by π radians (180°) around the X-axis.',
        'The input state |0⟩ was inverted directly into the orthogonal excited state |1⟩.',
        'Measurements yield |1⟩ with deterministic ~100% probability.',
      ],
      takeaways: [
        'Pauli-X rotates the Bloch vector from +z (|0⟩) to -z (|1⟩).',
        'Single-qubit unitary operations preserve the vector norm (r = 1.0).',
      ],
      tutorPrompts: [
        'Why does the Bloch vector point to -Z for |1⟩?',
        'How is a quantum NOT gate different from a classical NOT gate?',
      ],
    };
  }

  // 4. Default / Arbitrary Circuit Analysis
  const hasEntanglingGate = operations.some((o) => ['CNOT', 'CX', 'CZ', 'SWAP', 'TOFFOLI', 'CCX'].includes(o.gate?.toUpperCase()));
  const hasSuperpositionGate = operations.some((o) => ['H', 'RX', 'RY'].includes(o.gate?.toUpperCase()));

  return {
    title: `${operations.length} Gate Transformation (${qubits} Qubit${qubits !== 1 ? 's' : ''})`,
    concept: hasEntanglingGate
      ? 'Multi-Qubit Entangled Circuit'
      : hasSuperpositionGate
      ? 'Interference & Superposition Circuit'
      : 'Quantum Register Transformation',
    paragraphs: [
      `Your circuit applied ${operations.length} quantum operation${operations.length !== 1 ? 's' : ''} across ${qubits} qubit${qubits !== 1 ? 's' : ''}.`,
      hasSuperpositionGate
        ? 'Superposition gates created non-zero quantum amplitudes across multiple computational basis states.'
        : 'The gates applied deterministic rotations without creating equal superpositions.',
      hasEntanglingGate
        ? 'Multi-qubit controlled gates created correlations between distinct quantum wires.'
        : 'Qubits remained separable product states throughout the circuit.',
      `Observed ${observedStates.length} distinct outcome${observedStates.length !== 1 ? 's' : ''} in measurement sampling: ${observedStates.slice(0, 4).map((s) => `|${s}⟩`).join(', ')}${observedStates.length > 4 ? '...' : ''}.`,
    ],
    takeaways: [
      'Each gate represents a reversible unitary matrix multiplication on the statevector.',
      'Check the Bloch sphere for each individual qubit to observe its reduced polarization vector.',
    ],
    tutorPrompts: [
      'Can you explain the physical meaning of this circuit result?',
      'Why are certain basis states zero while others are non-zero?',
      'How does the statevector relate to these measurement counts?',
    ],
  };
}

function SimulationExplanation({
  operations = [],
  qubits = 2,
  counts = {},
  onAskPrompt = null,
}) {
  const analysis = useMemo(
    () => analyzeCircuitResult(operations, qubits, counts),
    [operations, qubits, counts]
  );

  return (
    <div className="card simulation-explanation-card" style={{ padding: '1.25rem', marginTop: '1.25rem', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.2rem' }}>💡</span>
          <h3 className="card-title" style={{ margin: 0, fontSize: '1.05rem', color: '#1e3a8a' }}>
            What Happened? — {analysis.title}
          </h3>
        </div>
        <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
          {analysis.concept}
        </span>
      </div>

      {/* Paragraphs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
        {analysis.paragraphs.map((p, i) => (
          <p key={i} style={{ margin: 0, fontSize: '0.88rem', color: '#334155', lineHeight: 1.6 }}>
            {p}
          </p>
        ))}
      </div>

      {/* Educational Key Takeaways */}
      <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem' }}>
        <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f172a', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Key Takeaways:
        </div>
        <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {analysis.takeaways.map((t, idx) => (
            <li key={idx}>{t}</li>
          ))}
        </ul>
      </div>

      {/* Suggested Questions for AI Tutor */}
      {analysis.tutorPrompts.length > 0 && (
        <div>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
            Suggested questions to ask AI Tutor:
          </span>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {analysis.tutorPrompts.map((promptText, idx) => (
              <button
                key={idx}
                className="btn btn-sm btn-outline"
                style={{ fontSize: '0.78rem', padding: '4px 10px', background: '#ffffff' }}
                onClick={() => onAskPrompt && onAskPrompt(promptText)}
              >
                💬 "{promptText}"
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(SimulationExplanation);
