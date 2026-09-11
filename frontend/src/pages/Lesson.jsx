import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import TopHeader from '../components/Layout/TopHeader';
import { useLearningContext } from '../context/LearningContext';

export default function Lesson() {
  const navigate = useNavigate();
  const {
    currentLesson,
    updateCurrentLesson,
    quizState,
    updateQuizState
  } = useLearningContext();

  // Ensure currentLesson is set when Lesson is mounted
  useEffect(() => {
    updateCurrentLesson({
      id: 'superposition',
      title: 'Superposition & The Hadamard Gate',
      module: 'Module 4 · Foundations of Quantum Logic'
    });
  }, [updateCurrentLesson]);

  const [selectedQuiz, setSelectedQuiz] = useState(quizState?.selectedAnswer || null);
  const [quizSubmitted, setQuizSubmitted] = useState(quizState?.isSubmitted || false);

  const handleSelectQuiz = useCallback((id) => {
    setSelectedQuiz(id);
    updateQuizState({
      selectedAnswer: id,
      isSubmitted: false,
      isCorrect: null
    });
  }, [updateQuizState]);

  const handleCheckAnswer = useCallback(() => {
    setQuizSubmitted(true);
    const isCorrect = selectedQuiz === 'b';
    updateQuizState({
      selectedAnswer: selectedQuiz,
      isSubmitted: true,
      isCorrect
    });
  }, [selectedQuiz, updateQuizState]);

  return (
    <div className="app-main-content">
      <TopHeader title="Lesson: Superposition & The Hadamard Gate" subtitle="Module 4 · Foundations of Quantum Logic" />

      <div className="lesson-container">
        {/* Breadcrumbs */}
        <div className="lesson-breadcrumbs">
          <span>Foundations</span> &gt; <span>Module 4</span> &gt; <span className="active">Superposition</span>
        </div>

        {/* Content Section */}
        <div className="lesson-grid">
          <div className="lesson-main card">
            <h2 className="lesson-heading">What is Superposition?</h2>
            <p className="lesson-text">
              In classical computing, a bit exists deterministically in either state <code>0</code> or <code>1</code>. 
              A quantum bit (<strong>qubit</strong>), however, can exist in a linear combination of basis states:
            </p>

            <div className="math-callout">
              |ψ⟩ = α|0⟩ + β|1⟩, &nbsp;&nbsp; where |α|² + |β|² = 1
            </div>

            <p className="lesson-text">
              Here, <code>α</code> and <code>β</code> are complex probability amplitudes. The probability of measuring 
              state <code>0</code> is <code>|α|²</code>, and the probability of measuring <code>1</code> is <code>|β|²</code>.
            </p>

            <h3 className="lesson-subheading">The Hadamard Gate (H)</h3>
            <p className="lesson-text">
              The Hadamard gate is the quantum circuit element used to create an equal superposition from a basis state.
              When applied to the ground state <code>|0⟩</code>, it produces the <code>|+⟩</code> state:
            </p>

            <div className="math-callout">
              H|0⟩ = (|0⟩ + |1⟩) / √2 = |+⟩
            </div>

            <p className="lesson-text">
              When measured along the computational basis (Z-basis), this state has exactly a <strong>50% probability</strong> of yielding 0 and <strong>50% probability</strong> of yielding 1.
            </p>

            {/* Quick Check Quiz */}
            <div className="quiz-card" style={{ marginTop: '2rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div className="quiz-header" style={{ fontWeight: 600, color: 'var(--color-primary)', marginBottom: '0.75rem' }}>
                Quick Concept Check:
              </div>
              <p style={{ marginBottom: '1rem', fontWeight: 500 }}>
                If a qubit is initialized in |0⟩ and we apply an H gate, what is the probability of measuring 0?
              </p>
              
              <div className="quiz-options" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                  { id: 'a', label: '100%' },
                  { id: 'b', label: '50% (Equal probability with 1)' },
                  { id: 'c', label: '0%' },
                  { id: 'd', label: '25%' }
                ].map((opt) => (
                  <label 
                    key={opt.id} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.75rem', 
                      padding: '0.6rem 1rem', 
                      borderRadius: '6px',
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: selectedQuiz === opt.id ? '#2563eb' : '#cbd5e1',
                      background: selectedQuiz === opt.id ? '#eff6ff' : '#fff'
                    }}
                  >
                    <input 
                      type="radio" 
                      name="lessonQuiz" 
                      value={opt.id} 
                      checked={selectedQuiz === opt.id}
                      onChange={() => handleSelectQuiz(opt.id)}
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>

              <div style={{ marginTop: '1rem' }}>
                {!quizSubmitted ? (
                  <button 
                    className="btn btn-primary btn-sm" 
                    disabled={!selectedQuiz}
                    onClick={handleCheckAnswer}
                  >
                    Check Answer
                  </button>
                ) : (
                  <div style={{ padding: '0.75rem', borderRadius: '6px', background: selectedQuiz === 'b' ? '#f0fdf4' : '#fef2f2', border: selectedQuiz === 'b' ? '1px solid #bbf7d0' : '1px solid #fecaca' }}>
                    <span style={{ fontWeight: 600, color: selectedQuiz === 'b' ? '#166534' : '#991b1b' }}>
                      {selectedQuiz === 'b' ? '✓ Correct!' : '✗ Not quite.'}
                    </span>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem' }}>
                      Since |α|² = (1/√2)² = 1/2, the probability is exactly 50%.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation to Circuit Builder */}
            <div className="lesson-footer" style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem' }}>
              <button className="btn btn-outline" onClick={() => navigate('/')}>
                ← Back to Dashboard
              </button>
              <button className="btn btn-primary" id="startBuildingBtn" onClick={() => navigate('/circuit-builder')}>
                Start Building →
              </button>
            </div>
          </div>

          {/* Lesson Sidebar Details */}
          <div className="lesson-side card">
            <h4 style={{ marginBottom: '1rem' }}>Key Takeaways</h4>
            <ul style={{ paddingLeft: '1.2rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              <li>Qubits can represent linear combinations of |0⟩ and |1⟩.</li>
              <li>Hadamard (H) transforms computational basis vectors into equal superpositions.</li>
              <li>Measurement collapses the quantum state with probabilities dictated by amplitude squares.</li>
            </ul>

            <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-primary)' }}>NEXT LAB STEP:</div>
              <div style={{ fontSize: '0.85rem', marginTop: '0.35rem', color: 'var(--color-text-secondary)' }}>
                Construct a 2-qubit circuit and place the Hadamard gate on q0.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
