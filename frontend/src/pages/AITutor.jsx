import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import TopHeader from '../components/Layout/TopHeader';
import { useLearningContext } from '../context/LearningContext';
import { loadTutorContext, saveTutorContext, buildTutorContext } from '../utils/tutorContext';
import { chatWithAITutor } from '../services/api';

/**
 * Screen label metadata
 */
const SCREEN_META = {
  'simulation-output': { label: 'Simulation Output', icon: '📊', color: '#2563eb' },
  'circuit-builder': { label: 'Circuit Builder (Visual)', icon: '⚡', color: '#4f46e5' },
  'code-mode': { label: 'Circuit Builder (Code)', icon: '</>', color: '#0891b2' },
  'challenge': { label: 'Challenge (Hint Mode)', icon: '🎯', color: '#d97706' },
  'lesson': { label: 'Lesson: Superposition', icon: '📖', color: '#16a34a' },
  'dashboard': { label: 'Dashboard & Progress', icon: '🏠', color: '#6366f1' },
  'progress': { label: 'Mastery & Evaluation', icon: '📈', color: '#8b5cf6' },
};

/**
 * Screen-specific default suggested questions
 */
const SCREEN_SUGGESTIONS = {
  'simulation-output': [
    'Why am I getting only 00 and 11?',
    'What does this Bloch Sphere mean?',
    'Why is the state vector pointing here?',
    'What happens if I remove the H gate?',
  ],
  'circuit-builder': [
    'Why did we use H before CNOT?',
    'What does this circuit do?',
    'How do I create quantum entanglement?',
    'Explain my gate sequence.',
  ],
  'code-mode': [
    'What does qc.cx(0, 1) do?',
    'Explain my Qiskit code line by line.',
    'Are there any syntax or validation errors?',
  ],
  'challenge': [
    "I'm stuck, give me a hint.",
    'Why isn\'t my circuit verifying?',
    'What is the objective of this challenge?',
    'Give me the next hint.',
  ],
  'lesson': [
    'Explain this concept simply.',
    'Give a real-world example of superposition.',
    'Explain the Dirac notation equation.',
    'Ask me a quick check question.',
  ],
  'dashboard': [
    'What should I learn next?',
    'Which topic am I weak in?',
    'Explain my overall progress and mastery.',
  ],
  'progress': [
    'How do I improve my quantum mastery score?',
    'What are the hardest topics in quantum computing?',
    'Explain learning gains.',
  ],
};

/**
 * Progressive Hint Ladder component for Challenge mode
 */
const HintLadder = memo(function HintLadder({
  hints = [],
  hintLevel = 1,
  onNextHint = null,
  onPrevHint = null,
}) {
  const activeHints = hints && hints.length > 0 ? hints : [
    'Hint 1 (Concept): Start by creating an equal superposition on qubit 0 using a Hadamard (H) gate.',
    'Hint 2 (Transformation): Now correlate qubit 1 with qubit 0 by applying a CNOT gate with q0 as control.',
    'Hint 3 (Solution): Applying H on q0 followed by CNOT(q0 → q1) produces the maximally entangled Bell state |Φ⁺⟩.',
  ];

  const currentStep = Math.min(Math.max(1, hintLevel), activeHints.length);

  return (
    <div className="card" style={{ marginBottom: '1.25rem', border: '1px solid #fde68a', background: '#fffbeb' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.1rem' }}>💡</span>
          <h4 style={{ margin: 0, color: '#92400e', fontSize: '0.95rem' }}>Progressive Hint Ladder</h4>
        </div>
        <span className="badge" style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', fontSize: '0.75rem' }}>
          Hint {currentStep} of {activeHints.length}
        </span>
      </div>

      <div style={{ background: '#ffffff', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #fef3c7', minHeight: '60px' }}>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#78350f', lineHeight: 1.55 }}>
          {activeHints[currentStep - 1]}
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem' }}>
        <button
          className="btn btn-sm btn-outline"
          disabled={currentStep <= 1}
          onClick={onPrevHint}
          style={{ fontSize: '0.75rem', padding: '3px 10px' }}
        >
          ← Previous Hint
        </button>
        <button
          className="btn btn-sm btn-primary"
          disabled={currentStep >= activeHints.length}
          onClick={onNextHint}
          style={{ fontSize: '0.75rem', padding: '3px 12px' }}
        >
          Next Hint ({currentStep + 1} of {activeHints.length}) →
        </button>
      </div>
    </div>
  );
});

/**
 * ChatInput component
 */
const ChatInput = memo(function ChatInput({ onSendMessage, disabled = false }) {
  const [inputText, setInputText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim() || disabled) return;
    onSendMessage(inputText);
    setInputText('');
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
      <input
        type="text"
        className="search-input"
        placeholder="Ask a question about your circuit, measurement, code, or concept..."
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        disabled={disabled}
        style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}
      />
      <button type="submit" className="btn btn-primary" disabled={disabled || !inputText.trim()}>
        {disabled ? 'Thinking…' : 'Send ↵'}
      </button>
    </form>
  );
});

export default function AITutor() {
  const navigate = useNavigate();
  const learningContext = useLearningContext();
  const chatBottomRef = useRef(null);

  // Load initial context from localStorage or fallbacks
  const [context, setContext] = useState(() => loadTutorContext());
  const [hintLevel, setHintLevel] = useState(() => context?.hintLevel || 1);
  const [isLoading, setIsLoading] = useState(false);

  // Initial welcome message tailored to the current context
  const [messages, setMessages] = useState(() => {
    const ctx = loadTutorContext();
    const screen = ctx?.screen || 'dashboard';
    const meta = SCREEN_META[screen] || SCREEN_META['dashboard'];

    let initialText = `Hello Alex! I am your **QuantumLeap-AI Tutor**. `;
    if (screen === 'simulation-output') {
      const shots = ctx?.shots || 1024;
      const backend = ctx?.backend || 'Qiskit Aer';
      initialText += `I've ingested your latest quantum simulation on **${backend}** (${shots} shots). Ask me about your measurement distribution, entanglement, or Bloch sphere coordinates!`;
    } else if (screen === 'circuit-builder' || screen === 'code-mode') {
      const ops = ctx?.circuit?.operations || [];
      initialText += `I see your circuit with **${ops.length} gate(s)**. Ask me how these gates transform the qubits or how to construct Bell states!`;
    } else if (screen === 'challenge') {
      initialText += `I'm operating in **Hint Mode** for this challenge. I won't spoil the answer right away, but I will guide you step-by-step!`;
    } else if (screen === 'lesson') {
      initialText += `You're exploring **${ctx?.topic || 'Superposition & The Hadamard Gate'}**. Ask me to break this down simply or provide physical analogies!`;
    } else {
      initialText += `I have your learning pathway and progress loaded. Ask me what to learn next or which topics to review!`;
    }

    return [{ sender: 'ai', text: initialText, id: 1 }];
  });

  // Hints state
  const [hints, setHints] = useState(() => {
    return [
      'Hint 1 (Concept): Start by creating an equal superposition on qubit 0 using a Hadamard (H) gate.',
      'Hint 2 (Transformation): Correlate qubit 1 with qubit 0 by applying a CNOT gate with q0 as control.',
      'Hint 3 (Solution): Applying H on q0 followed by CNOT(q0 → q1) produces the maximally entangled Bell state |Φ⁺⟩.',
    ];
  });

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle sending a message
  const handleSendMessage = useCallback(async (queryText) => {
    if (!queryText || !queryText.trim()) return;

    const userMsg = { sender: 'user', text: queryText.trim(), id: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await chatWithAITutor(queryText.trim(), context, hintLevel);
      const aiReply = res.reply || 'I analyzed your quantum context.';
      if (Array.isArray(res.hints) && res.hints.length > 0) {
        setHints(res.hints);
      }
      setMessages((prev) => [...prev, { sender: 'ai', text: aiReply, id: Date.now() + 1 }]);
    } catch (err) {
      console.warn('AI Tutor backend call fallback:', err);
      // Client-side fallback reply
      setTimeout(() => {
        let fallbackReply = `Based on your active **${context.screen}** context, your circuit operations strictly govern the quantum probability distribution.`;
        if (queryText.toLowerCase().includes('00 and 11')) {
          fallbackReply = "In the Bell state |Φ⁺⟩ = (|00⟩ + |11⟩)/√2, applying Hadamard on q0 creates superposition, and CNOT flips q1 when q0 is |1⟩. Therefore, only |00⟩ and |11⟩ have non-zero probability!";
        } else if (queryText.toLowerCase().includes('bloch')) {
          fallbackReply = "A single qubit in a pure state lies on the surface of the Bloch sphere (r = 1.0). When qubits are maximally entangled, tracing out one qubit leaves the other in a mixed state at the origin (r ≈ 0).";
        } else if (queryText.toLowerCase().includes('h before cnot')) {
          fallbackReply = "Without H first, the control qubit is in |0⟩, so CNOT does nothing! The H gate creates the superposition needed for entanglement.";
        }
        setMessages((prev) => [...prev, { sender: 'ai', text: fallbackReply, id: Date.now() + 1 }]);
      }, 400);
    } finally {
      setIsLoading(false);
    }
  }, [context, hintLevel]);

  // If user navigated with a preset userPrompt, auto-send it
  useEffect(() => {
    if (context?.userPrompt) {
      const prompt = context.userPrompt;
      // Clear it from context so it doesn't re-trigger
      setContext((prev) => ({ ...prev, userPrompt: null }));
      handleSendMessage(prompt);
    }
  }, [context?.userPrompt, handleSendMessage]);

  // Context Switcher (allows student to change context directly)
  const handleSwitchScreenContext = useCallback((newScreen) => {
    let newCtx;
    if (newScreen === 'simulation-output') {
      newCtx = buildTutorContext('simulation-output', {
        topic: 'Bell State Simulation',
        qubits: 2,
        operations: [
          { gate: 'H', qubit: 0, step: 0 },
          { gate: 'CNOT', control: 0, target: 1, step: 1 },
        ],
        shots: 1024,
        backend: 'Qiskit Aer Simulator',
        counts: { '00': 512, '11': 512 },
        probabilities: { '00': 0.5, '11': 0.5 },
        statevector: [{ basis: '|00>', prob: 0.5 }, { basis: '|11>', prob: 0.5 }],
        bloch: [{ qubit: 0, r: 0.0, x: 0.0, z: 0.0, label: 'Entangled' }],
      });
    } else if (newScreen === 'circuit-builder') {
      newCtx = buildTutorContext('circuit-builder', {
        qubits: 2,
        operations: [
          { gate: 'H', qubit: 0, step: 0 },
          { gate: 'CNOT', control: 0, target: 1, step: 1 },
        ],
        mode: 'visual',
        selectedGate: 'H',
      });
    } else if (newScreen === 'code-mode') {
      newCtx = buildTutorContext('code-mode', {
        qubits: 2,
        operations: [
          { gate: 'H', qubit: 0, step: 0 },
          { gate: 'CNOT', control: 0, target: 1, step: 1 },
        ],
        mode: 'code',
        code: 'from qiskit import QuantumCircuit\n\nqc = QuantumCircuit(2)\nqc.h(0)\nqc.cx(0, 1)',
        errors: [],
      });
    } else if (newScreen === 'challenge') {
      newCtx = buildTutorContext('challenge', {
        challenge: { id: 'bell-state', title: 'Bell State Generation' },
        qubits: 2,
        hintLevel: 1,
      });
      setHintLevel(1);
    } else if (newScreen === 'lesson') {
      newCtx = buildTutorContext('lesson', {
        topic: 'Superposition & The Hadamard Gate',
        lesson: { id: 'superposition', title: 'Superposition & The Hadamard Gate' },
      });
    } else {
      newCtx = buildTutorContext('dashboard');
    }

    setContext(newCtx);
    saveTutorContext(newCtx);

    const screenMeta = SCREEN_META[newScreen] || SCREEN_META['dashboard'];
    setMessages((prev) => [
      ...prev,
      {
        sender: 'ai',
        text: `Switched context to **${screenMeta.label}**. How can I help you with this topic?`,
        id: Date.now(),
      },
    ]);
  }, []);

  const currentScreen = context?.screen || 'dashboard';
  const meta = SCREEN_META[currentScreen] || SCREEN_META['dashboard'];
  const suggestedQuestions = SCREEN_SUGGESTIONS[currentScreen] || SCREEN_SUGGESTIONS['dashboard'];

  // Operations list from context
  const ops = context?.circuit?.operations || [];
  const counts = context?.counts || {};
  const shots = context?.shots || 1024;

  return (
    <div className="app-main-content">
      <TopHeader
        title="AI Tutor"
        subtitle="Context-aware quantum learning assistant tailored to your active workspace."
      />

      <div className="ai-tutor-container" style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 0 3rem 0' }}>
        {/* ━━━ TOP CONTEXT BANNER ━━━ */}
        <div
          className="card"
          style={{
            marginBottom: '1.25rem',
            padding: '1rem 1.25rem',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid #cbd5e1',
            borderRadius: '10px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            {/* Left: Active Context Identity */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: meta.color,
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  flexShrink: 0,
                }}
              >
                {meta.icon}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: 700 }}>
                    Active Screen Context
                  </span>
                  <span className="badge badge-primary" style={{ fontSize: '0.72rem' }}>
                    Live Connected
                  </span>
                </div>
                <h3 style={{ margin: '0.15rem 0 0', fontSize: '1.05rem', color: '#1e293b' }}>
                  {meta.label} — {context?.topic || 'Quantum Exploration'}
                </h3>
              </div>
            </div>

            {/* Right: Switch Context Dropdown & Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label htmlFor="contextSwitch" style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                Switch Context:
              </label>
              <select
                id="contextSwitch"
                value={currentScreen}
                onChange={(e) => handleSwitchScreenContext(e.target.value)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#1e3a8a',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="simulation-output">Simulation Output</option>
                <option value="circuit-builder">Circuit Builder (Visual)</option>
                <option value="code-mode">Circuit Builder (Code)</option>
                <option value="challenge">Challenge (Hint Mode)</option>
                <option value="lesson">Lesson (Superposition)</option>
                <option value="dashboard">Dashboard & Progress</option>
              </select>
            </div>
          </div>

          {/* Context Details Strip (Pills) */}
          <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.8rem' }}>
            <span style={{ color: '#64748b', fontWeight: 600 }}>Context Data:</span>

            {/* Simulation Output Pills */}
            {currentScreen === 'simulation-output' && (
              <>
                <span className="badge badge-outline">Backend: {context?.backend || 'Qiskit Aer'}</span>
                <span className="badge badge-outline">Shots: {shots}</span>
                {Object.keys(counts).length > 0 && (
                  <span className="badge badge-outline">
                    Outcomes: {Object.entries(counts).map(([k, v]) => `|${k}⟩: ${((v / shots) * 100).toFixed(0)}%`).join(', ')}
                  </span>
                )}
                {context?.bloch && context.bloch[0] && (
                  <span className="badge badge-outline">
                    Bloch q0: r={Number(context.bloch[0].r || 0).toFixed(2)}
                  </span>
                )}
              </>
            )}

            {/* Circuit Builder Pills */}
            {(currentScreen === 'circuit-builder' || currentScreen === 'code-mode') && (
              <>
                <span className="badge badge-outline">Qubits: {context?.circuit?.qubits || 2}</span>
                <span className="badge badge-outline">
                  Gates ({ops.length}): {ops.length > 0 ? ops.map((o) => o.gate).join(', ') : 'Empty wire'}
                </span>
                {currentScreen === 'code-mode' && (
                  <span className="badge badge-outline">Qiskit Code Synced</span>
                )}
              </>
            )}

            {/* Challenge Pills */}
            {currentScreen === 'challenge' && (
              <>
                <span className="badge badge-primary">Hint Mode Active</span>
                <span className="badge badge-outline">Target: Bell State |Φ⁺⟩</span>
                <span className="badge badge-outline">Level: {hintLevel} of 3</span>
              </>
            )}

            {/* Lesson Pills */}
            {currentScreen === 'lesson' && (
              <>
                <span className="badge badge-outline">Module 4: Quantum Logic</span>
                <span className="badge badge-outline">Concept: Superposition & Hadamard</span>
              </>
            )}

            {/* Dashboard Pills */}
            {(currentScreen === 'dashboard' || currentScreen === 'progress') && (
              <>
                <span className="badge badge-outline">Mastery: 72%</span>
                <span className="badge badge-outline">Streak: 14 Days</span>
                <span className="badge badge-outline">Level: Intermediate</span>
              </>
            )}
          </div>
        </div>

        {/* ━━━ CHALLENGE PROGRESSIVE HINT LADDER (If in Challenge screen) ━━━ */}
        {currentScreen === 'challenge' && (
          <HintLadder
            hints={hints}
            hintLevel={hintLevel}
            onNextHint={() => {
              const next = Math.min(3, hintLevel + 1);
              setHintLevel(next);
              handleSendMessage(`Give me Hint ${next}`);
            }}
            onPrevHint={() => {
              const prev = Math.max(1, hintLevel - 1);
              setHintLevel(prev);
            }}
          />
        )}

        {/* ━━━ QUICK QUESTION CHIPS (Context-Tailored) ━━━ */}
        <div style={{ marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.5rem' }}>
            Suggested questions for this screen:
          </span>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {suggestedQuestions.map((qText, idx) => (
              <button
                key={idx}
                className="btn btn-sm btn-outline"
                style={{
                  background: '#ffffff',
                  fontSize: '0.8rem',
                  padding: '5px 12px',
                  borderRadius: '20px',
                  borderColor: '#cbd5e1',
                  color: '#1e3a8a',
                  fontWeight: 500,
                  transition: 'all 0.15s',
                }}
                onClick={() => handleSendMessage(qText)}
                disabled={isLoading}
              >
                💬 {qText}
              </button>
            ))}
          </div>
        </div>

        {/* ━━━ CHAT MESSAGES LOG ━━━ */}
        <div
          className="card"
          style={{
            padding: '1.5rem',
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            minHeight: '380px',
            maxHeight: '520px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  marginBottom: '0.25rem',
                  fontSize: '0.75rem',
                  color: '#64748b',
                  fontWeight: 600,
                }}
              >
                <span>{msg.sender === 'user' ? 'You' : '🤖 Quantum Tutor'}</span>
              </div>

              <div
                style={{
                  maxWidth: '85%',
                  padding: '0.85rem 1.15rem',
                  borderRadius: msg.sender === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  background: msg.sender === 'user' ? '#2563eb' : '#f8fafc',
                  color: msg.sender === 'user' ? '#ffffff' : '#1e293b',
                  border: msg.sender === 'user' ? 'none' : '1px solid #e2e8f0',
                  fontSize: '0.9rem',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                }}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.82rem', padding: '0.5rem 0' }}>
              <span>🤖 Quantum Tutor is formulating explanation…</span>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* ━━━ CHAT INPUT ━━━ */}
        <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
      </div>
    </div>
  );
}
