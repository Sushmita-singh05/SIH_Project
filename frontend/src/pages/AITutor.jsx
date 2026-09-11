import React, { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import TopHeader from '../components/Layout/TopHeader';
import { useLearningContext } from '../context/LearningContext';

/**
 * Evaluates simulation context (from LearningContext, localStorage quantumLeapSimulation / ql_sim_context / quantumSimulationResult)
 * to provide dynamic explanations, math representations, and progressive hints.
 */
function parseSimulationContext(learningContext = null) {
  try {
    // 1. Check direct LearningContext simulationResult first
    if (learningContext?.simulationResult?.counts) {
      return normalizeContext({
        qubits: learningContext.currentCircuit?.qubits || 2,
        lesson: learningContext.currentLesson?.title || "Foundations: Superposition & Entanglement",
        operations: learningContext.currentCircuit?.operations || [],
        result: learningContext.simulationResult
      });
    }

    // 2. Check quantumLeapSimulation
    const saved = localStorage.getItem('quantumLeapSimulation');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && (parsed.result || parsed.counts)) {
        return normalizeContext(parsed);
      }
    }

    // Check ql_sim_context (from Ask AI Tutor button)
    const askContext = localStorage.getItem('ql_sim_context');
    const simResult = localStorage.getItem('quantumSimulationResult') || localStorage.getItem('ql_simulation_result');
    const savedCircuit = localStorage.getItem('ql_circuit');

    let operations = [];
    if (savedCircuit) {
      try {
        const cParsed = JSON.parse(savedCircuit);
        operations = cParsed.operations || [];
      } catch (e) {}
    }

    if (askContext || simResult) {
      const parsedResult = simResult ? JSON.parse(simResult) : (askContext ? JSON.parse(askContext) : null);
      if (parsedResult) {
        return normalizeContext({
          qubits: parsedResult.qubits || 2,
          lesson: "Foundations: Superposition & Entanglement",
          operations,
          result: parsedResult
        });
      }
    }
  } catch (err) {
    console.warn("Failed to parse quantum simulation context:", err);
  }
  return null;
}

function normalizeContext(data) {
  const result = data.result || data;
  const qubits = data.qubits || result.qubits || 2;
  const lesson = data.lesson || "Foundations: Superposition & Entanglement";
  const operations = data.operations || [];
  const counts = result.counts || {};
  const shots = result.shots || 1024;
  const backend = result.backend || "Qiskit Aer Simulator";
  const statevector = result.statevector || [];

  // Parse operations summary
  const opDescriptions = operations.map(op => {
    if (op.gate === 'CNOT') {
      return `CNOT(q${op.control} → q${op.target})`;
    }
    return `${op.gate} on q${op.qubit !== undefined ? op.qubit : op.target}`;
  });

  const circuitSummary = opDescriptions.length > 0 ? opDescriptions.join(' → ') : 'Identity (No gates)';

  // Gate flags
  const hasHOnQ0 = operations.some(o => o.gate === 'H' && o.qubit === 0);
  const hasHOnQ1 = operations.some(o => o.gate === 'H' && o.qubit === 1);
  const hasCNOT_0_1 = operations.some(o => o.gate === 'CNOT' && o.control === 0 && o.target === 1);
  const hasXOnQ0 = operations.some(o => o.gate === 'X' && o.qubit === 0);

  // Counts analysis
  const countEntries = Object.entries(counts);
  const totalCounts = countEntries.reduce((acc, [, v]) => acc + v, 0) || shots;

  const probStrings = countEntries
    .map(([key, count]) => `${((count / totalCounts) * 100).toFixed(1)}% (|${key}⟩)`)
    .join(' / ') || 'None';

  let concept = "Custom Quantum Circuit";
  let simulatedState = "|ψ⟩";
  let statusBadge = "Simulated";
  let explanation = "";
  let whyMatters = "";
  let hints = [];

  const count00 = counts['00'] || 0;
  const count11 = counts['11'] || 0;
  const bellFidelity = ((count00 + count11) / totalCounts) * 100;

  if (hasHOnQ0 && hasCNOT_0_1 && bellFidelity > 80) {
    // 1. Bell State
    concept = "Bell State |Φ⁺⟩ (Entanglement)";
    simulatedState = "|Φ⁺⟩ = (|00⟩ + |11⟩) / √2";
    statusBadge = "Entangled |Φ⁺⟩";
    explanation = `Your circuit successfully creates the maximally entangled Bell state |Φ⁺⟩. First, the Hadamard gate on q0 transforms |0⟩ into equal superposition (|0⟩ + |1⟩) / √2. Next, the CNOT gate with q0 as control flips q1 whenever q0 is |1⟩. Because measuring either qubit instantaneously correlates the other, we observe only |00⟩ (${((count00/totalCounts)*100).toFixed(1)}%) and |11⟩ (${((count11/totalCounts)*100).toFixed(1)}%), while |01⟩ and |10⟩ have 0% probability.`;
    whyMatters = "Quantum entanglement is the non-local correlation at the heart of quantum teleportation, superdense coding, and quantum cryptography (E91 protocol). Neither qubit can be described independently of the other!";
    hints = [
      "Notice how q0 is placed into equal superposition before interacting with q1.",
      "The CNOT gate uses q0 as control: when q0 is |1⟩, it flips q1 from |0⟩ to |1⟩, yielding (|00⟩ + |11⟩)/√2.",
      "Excellent job! You verified the Bell state with real Qiskit Aer simulation counts. Next, test what happens if you apply an X or Z gate before measurement."
    ];
  } else if (hasHOnQ0 && !hasCNOT_0_1 && operations.length === 1) {
    // 2. Superposition
    concept = "Single-Qubit Superposition";
    simulatedState = "|ψ⟩ = (|00⟩ + |01⟩) / √2";
    statusBadge = "Superposition |+⟩";
    explanation = `You placed a Hadamard (H) gate on q0 while leaving q1 in its ground state |0⟩. The H gate performs a unitary rotation that maps the computational basis state |0⟩ into an equal linear superposition |+⟩ = (|0⟩ + |1⟩)/√2. As expected from the Born rule (|α|² = |β|² = 0.5), measurements over ${shots} shots distribute evenly between |00⟩ and |01⟩.`;
    whyMatters = "Superposition enables quantum computers to evaluate exponential numbers of computational paths simultaneously through quantum parallelism.";
    hints = [
      "The Hadamard gate transforms the basis vector |0⟩ into equal parts |0⟩ and |1⟩ with equal real amplitudes (1/√2).",
      "To entangle q0 with q1, place a two-qubit entangling gate in the next step.",
      "Place a CNOT gate with q0 as the control and q1 as the target to create the Bell state |Φ⁺⟩."
    ];
  } else if (hasHOnQ0 && hasHOnQ1 && operations.length === 2) {
    // 3. Dual Superposition
    concept = "Uniform 2-Qubit Superposition";
    simulatedState = "|++⟩ = (|00⟩ + |01⟩ + |10⟩ + |11⟩) / 2";
    statusBadge = "Dual Superposition";
    explanation = `Both qubits have undergone Hadamard transformations, creating a uniform 4-state superposition. Each of the computational basis states (|00⟩, |01⟩, |10⟩, |11⟩) has an equal probability amplitude of 1/2, corresponding to a theoretical 25% measurement likelihood for each state.`;
    whyMatters = "Uniform superposition registers form the initialization phase for Grover's search algorithm and the Deutsch-Jozsa algorithm.";
    hints = [
      "Each independent Hadamard gate doubles the dimension of active superposition states.",
      "Notice that all 4 basis states are measured with approximately equal ~25% counts.",
      "Try adding a CNOT or Z gate to create phase differences and quantum interference."
    ];
  } else if (hasXOnQ0 && !hasHOnQ0) {
    // 4. Bit-flip
    concept = "Pauli-X Bit Flip";
    simulatedState = "|01⟩ (Deterministic)";
    statusBadge = "Deterministic |01⟩";
    explanation = `The Pauli-X gate acts as the quantum NOT operator. Applying X to q0 rotates the state vector around the X-axis by π radians, mapping |0⟩ to |1⟩. Since q1 remains unchanged, the register collapses deterministically to |01⟩.`;
    whyMatters = "Pauli gates form the foundation for quantum error correction and unitary bit/phase manipulation.";
    hints = [
      "The Pauli-X gate inverts computational basis states: X|0⟩ = |1⟩ and X|1⟩ = |0⟩.",
      "To test superposition instead of classical bit flips, replace X with a Hadamard (H) gate.",
      "Pairing H with CNOT allows you to explore quantum entanglement."
    ];
  } else {
    // 5. General Custom Circuit
    concept = "Custom Multi-Gate Register";
    simulatedState = "|ψ⟩ = Σ cᵢ |i⟩";
    statusBadge = "Custom Circuit";
    explanation = `Your circuit executed ${operations.length} gate operations across ${qubits} qubits. The resulting measurement distribution across ${shots} shots on ${backend} produced: ${probStrings}. Unitary evolution has transformed the quantum register according to the matrix product of your gate sequence.`;
    whyMatters = "By composing single-qubit rotations with two-qubit conditional gates, any arbitrary quantum algorithm can be synthesized (Universal Quantum Computation).";
    hints = [
      `Review your active gate sequence: ${circuitSummary}.`,
      "Inspect the measurement probabilities to verify if destructive interference has eliminated any states.",
      "Try constructing a standard Bell state by placing an H gate on q0 followed by a CNOT gate."
    ];
  }

  const activeGateText = operations.length === 1
    ? `${operations[0].gate} on q${operations[0].qubit !== undefined ? operations[0].qubit : operations[0].target}`
    : operations.length > 1
      ? `${operations.map(o => o.gate).join(', ')} (${operations.length} gates)`
      : "None (Identity Wire)";

  return {
    qubits,
    lesson,
    shots,
    backend,
    concept,
    activeGateText,
    inputState: "|00⟩",
    simulatedState,
    probStrings,
    statusBadge,
    circuitSummary,
    explanation,
    whyMatters,
    hints,
    counts,
    totalCounts
  };
}

const HintLadder = memo(function HintLadder({ hints = [], hintLevel = 1, onHintChange }) {
  const activeHints = hints.length >= 3 ? hints : [
    "The Hadamard gate transforms the basis vector |0⟩ into equal parts |0⟩ and |1⟩ with equal real amplitudes (1/√2).",
    "What happens if you place a Pauli-Z gate next? Z applies a relative π phase shift, turning (|0⟩+|1⟩)/√2 into (|0⟩-|1⟩)/√2.",
    "To entangle q0 with q1, place a CNOT gate with q0 as the control! This creates the famous Bell state |Φ⁺⟩."
  ];

  const currentStep = Math.min(Math.max(1, hintLevel), activeHints.length);

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h4 style={{ margin: 0 }}>Progressive Hint Ladder</h4>
        <span className="badge badge-outline">{currentStep} of {activeHints.length}</span>
      </div>

      <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', minHeight: '90px' }}>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#334155' }}>
          <strong>Hint {currentStep}:</strong> {activeHints[currentStep - 1]}
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
        <button
          className="btn btn-sm btn-outline"
          disabled={currentStep <= 1}
          onClick={() => onHintChange && onHintChange(Math.max(1, currentStep - 1))}
        >
          Previous Hint
        </button>
        <button
          className="btn btn-sm btn-primary"
          disabled={currentStep >= activeHints.length}
          onClick={() => onHintChange && onHintChange(Math.min(activeHints.length, currentStep + 1))}
        >
          Next Hint →
        </button>
      </div>
    </div>
  );
});

const ChatInput = memo(function ChatInput({ onSendMessage }) {
  const [inputText, setInputText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
      <input
        type="text"
        className="search-input"
        placeholder="Ask about phase, superposition, or circuit behavior..."
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        style={{ flex: 1, padding: '0.65rem 1rem' }}
      />
      <button type="submit" className="btn btn-primary">
        Send
      </button>
    </form>
  );
});

export default function AITutor() {
  const navigate = useNavigate();
  const learningContext = useLearningContext();
  const { hintLevel, setHintLevel } = learningContext;

  // Load simulation context on mount
  const [contextData, setContextData] = useState(() => parseSimulationContext(learningContext));

  // Sync if learningContext updates
  useEffect(() => {
    const updated = parseSimulationContext(learningContext);
    if (updated) setContextData(updated);
  }, [learningContext.simulationResult, learningContext.currentCircuit]);

  // Function to refresh context from localStorage without reloading
  const handleRefreshContext = useCallback(() => {
    const updated = parseSimulationContext(learningContext);
    setContextData(updated);
  }, [learningContext]);

  // Initial welcome message tailored to the current simulation context
  const [messages, setMessages] = useState(() => {
    const initial = parseSimulationContext();
    if (initial) {
      return [
        {
          sender: 'ai',
          text: `Hello Alex! I've ingested your latest quantum simulation (${initial.concept}). ${initial.explanation}`
        }
      ];
    }
    return [
      {
        sender: 'ai',
        text: "Hello Alex! I am your QuantumLeap-AI Tutor. You haven't executed a circuit simulation yet. Once you simulate a circuit in the Circuit Builder, I will automatically analyze your gates, statevectors, and measurement distributions here!"
      }
    ];
  });

  // Keep chat updated if context is refreshed
  useEffect(() => {
    if (contextData) {
      setMessages([
        {
          sender: 'ai',
          text: `Hello Alex! I've ingested your simulation of "${contextData.concept}". ${contextData.explanation}`
        }
      ]);
    }
  }, [contextData?.concept, contextData?.circuitSummary]);

  const handleSendMessage = useCallback((text) => {
    const userMsg = { sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);

    const lower = text.toLowerCase();
    setTimeout(() => {
      let reply = "";
      if (lower.includes("entangle") || lower.includes("bell")) {
        reply = "Entanglement means the joint state of the system cannot be factored into product states of the individual qubits. In the Bell state |Φ⁺⟩ = (|00⟩ + |11⟩)/√2, measuring qubit 0 as |0⟩ collapses qubit 1 into |0⟩ with 100% certainty, even across arbitrary distances!";
      } else if (lower.includes("phase") || lower.includes("z")) {
        reply = "Phase affects the relative angle between basis states in the complex plane. A Pauli-Z gate transforms |+⟩ into |−⟩ by introducing a π phase shift on |1⟩. While both states yield 50/50 measurement probabilities in the Z-basis, they behave completely differently when interfered via another Hadamard gate.";
      } else if (lower.includes("superposition") || lower.includes("h") || lower.includes("hadamard")) {
        reply = `Because the Hadamard operator is unitary (H†H = I), it preserves state vector norm while mapping computational basis states into balanced superpositions. Measurements over ${contextData?.shots || 1024} shots follow a binomial distribution around 50%.`;
      } else {
        reply = `Based on your active circuit (${contextData ? contextData.circuitSummary : 'default register'}), the probability distribution is governed by the statevector amplitudes |α|². Notice how the observed counts (${contextData ? contextData.probStrings : '50/50'}) strictly reflect the unitary transformations applied to your qubits.`;
      }

      setMessages(prev => [...prev, { sender: 'ai', text: reply }]);
    }, 400);
  }, [contextData]);

  return (
    <div className="app-main-content">
      <TopHeader title="AI Tutor" subtitle="Understand your circuit and simulation results with context-aware guidance." />

      <div className="ai-tutor-container">
        {/* Top Context Status & Refresh Bar */}
        <div className="card" style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="badge badge-primary">
              {contextData ? contextData.statusBadge : 'No Simulation'}
            </span>
            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              {contextData ? (
                <>
                  Active Lesson: <strong>{contextData.lesson}</strong> · Backend: <strong>{contextData.backend}</strong> · Shots: <strong>{contextData.shots}</strong>
                </>
              ) : (
                'No recent simulation found. Build and run a circuit to activate real AI analysis.'
              )}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-outline btn-sm" onClick={handleRefreshContext}>
              🔄 Refresh Context
            </button>
            {!contextData && (
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/circuit-builder')}>
                Build a Circuit →
              </button>
            )}
          </div>
        </div>

        {/* Fallback notification if no simulation context */}
        {!contextData && (
          <div style={{ marginBottom: '1.25rem', padding: '1rem 1.25rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', color: '#1e40af', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>💡 Pro-tip:</strong> Head to the <strong>Circuit Builder</strong>, place an H gate (or Bell state) and click <strong>Simulate Circuit</strong> to see live Qiskit Aer insights here!
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/circuit-builder')}>
              Open Circuit Builder
            </button>
          </div>
        )}

        {/* Layout: Left Conversation / Explanation & Right Ingestion Context */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '1.5rem' }}>
          {/* Main Discussion Area */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '620px' }}>
            <div className="card-header" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem' }}>🤖</span>
                <h3 className="card-title" style={{ margin: 0 }}>Quantum Explanation Assistant</h3>
              </div>
              <span className="badge badge-primary">Context Aware</span>
            </div>

            {/* Chat message stream */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem' }}>
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    padding: '0.85rem 1.15rem',
                    borderRadius: '12px',
                    background: m.sender === 'user' ? '#2563eb' : '#f1f5f9',
                    color: m.sender === 'user' ? '#ffffff' : '#1e293b',
                    fontSize: '0.9rem',
                    lineHeight: '1.5'
                  }}
                >
                  {m.text}
                </div>
              ))}
            </div>

            {/* Input bar */}
            <ChatInput onSendMessage={handleSendMessage} />
          </div>

          {/* Right Context & Progressive Hint Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Tutor Context Ingestion Card */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, color: 'var(--color-primary)' }}>TUTOR CONTEXT INGESTION</h4>
                <span className="badge badge-outline" style={{ fontSize: '0.75rem' }}>
                  {contextData ? `${contextData.qubits} Qubits` : '2 Qubits'}
                </span>
              </div>

              <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div>
                  <strong>Circuit Concept:</strong> {contextData ? contextData.concept : 'Default Superposition'}
                </div>
                <div>
                  <strong>Active Gate(s):</strong> {contextData ? contextData.activeGateText : 'Hadamard (H) on q0'}
                </div>
                <div>
                  <strong>Input State:</strong> |00⟩
                </div>
                <div>
                  <strong>Simulated State:</strong> {contextData ? contextData.simulatedState : '|ψ⟩ = (|00⟩ + |01⟩)/√2'}
                </div>
                <div>
                  <strong>Measurement Ratio:</strong> {contextData ? contextData.probStrings : '50.7% (|00⟩) / 49.3% (|01⟩)'}
                </div>
                <div>
                  <strong>Circuit Path:</strong> <code>{contextData ? contextData.circuitSummary : 'H on q0'}</code>
                </div>
              </div>
            </div>

            {/* Progressive Hint Ladder */}
            <HintLadder
              hints={contextData ? contextData.hints : undefined}
              hintLevel={hintLevel}
              onHintChange={setHintLevel}
            />

            {/* Action Card */}
            <div className="card" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e3a8a' }}>Ready for the Challenge?</h4>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#2563eb' }}>
                Test your mastery of multi-qubit entanglement by generating a Bell state.
              </p>
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/challenge')}>
                Go to Bell State Challenge →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

