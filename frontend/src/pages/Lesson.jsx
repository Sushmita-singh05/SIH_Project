import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import TopHeader from '../components/Layout/TopHeader';
import FloatingAITutorBtn from '../components/AITutor/FloatingAITutorBtn';
import { useLearningContext } from '../context/LearningContext';
import { buildTutorContext, saveTutorContext } from '../utils/tutorContext';
import '../styles/lesson.css';

export default function Lesson() {
  const navigate = useNavigate();
  const {
    currentLesson,
    updateCurrentLesson,
    quizState,
    updateQuizState,
    recordLessonCompletion,
    recordQuizResult,
    progress,
    lastUserAction,
  } = useLearningContext();

  const getLessonContextData = useCallback(() => ({
    topic: currentLesson?.title || 'Superposition & The Hadamard Gate',
    lesson: currentLesson || {
      id: 'superposition',
      title: 'Superposition & The Hadamard Gate',
      module: 'Module 4 · Foundations of Quantum Logic',
    },
    quizState,
    progress: progress,
    lastAction: lastUserAction,
  }), [currentLesson, quizState, progress, lastUserAction]);

  const handleAskTutor = useCallback(() => {
    const ctx = buildTutorContext('lesson', getLessonContextData());
    saveTutorContext(ctx);
    navigate('/ai-tutor');
  }, [getLessonContextData, navigate]);

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
  const quizCorrect = quizState?.isCorrect === true;

  // Progress percentage (shows motivating progress, fills to 100% when quiz passed)
  const displayProgress = quizSubmitted && quizCorrect
    ? 100
    : Math.max(
        progress?.overallProgress || 0,
        Math.round(((progress?.lessonsCompleted?.length || 0) / 7) * 100) || 40
      );

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

    // Dynamically record quiz result
    recordQuizResult({
      topic: 'Superposition & Hadamard Gate',
      score: isCorrect ? 1 : 0,
      total: 1,
      lessonId: 'superposition'
    });

    // Completing the quiz successfully also records lesson progress
    if (isCorrect) {
      recordLessonCompletion(
        'superposition',
        'Superposition & The Hadamard Gate',
        ['Superposition', 'Hadamard', 'Qubit']
      );
    }
  }, [selectedQuiz, updateQuizState, recordQuizResult, recordLessonCompletion]);

  const handleStartBuilding = useCallback(() => {
    recordLessonCompletion(
      'superposition',
      'Superposition & The Hadamard Gate',
      ['Superposition', 'Hadamard', 'Qubit']
    );
    navigate('/circuit-builder');
  }, [recordLessonCompletion, navigate]);

  // Quiz option class builder
  const quizOptionClass = (optId) => {
    const isSelected = selectedQuiz === optId;
    if (!quizSubmitted) {
      return `quiz-option compact ${isSelected ? 'selected' : ''}`;
    }
    if (optId === 'b' && quizCorrect) return 'quiz-option compact correct';
    if (isSelected && !quizCorrect) return 'quiz-option compact incorrect';
    return 'quiz-option compact';
  };

  return (
    <div className="app-main-content">
      <TopHeader title="Lesson: Superposition & The Hadamard Gate" subtitle="Module 4 · Foundations of Quantum Logic" />

      <div className="lesson-container">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <div className="breadcrumb-list">
            <a className="breadcrumb-link" href="/">Foundations</a>
            <span className="breadcrumb-sep">/</span>
            <a className="breadcrumb-link" href="/">Module 4</a>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">Superposition</span>
          </div>
        </div>

        {/* Lesson Header: Title + Progress spanning full width */}
        <div className="lesson-header-block">
          <div className="lesson-title-row">
            <h1 className="lesson-heading">Superposition & The Hadamard Gate</h1>
            <div className="lesson-progress-row">
              <span className="lesson-progress-title">Lesson Progress</span>
              <div className="lesson-progress-bar-wrap">
                <div
                  className="lesson-progress-bar-fill"
                  style={{ width: `${displayProgress}%` }}
                />
              </div>
              <span className="lesson-progress-pct">{displayProgress}%</span>
            </div>
          </div>
          <div className="lesson-meta-row">
            <span className="lesson-meta-pill">📖 Lesson 1 of 7</span>
            <span className="lesson-meta-pill">⏱ ~5 min</span>
            <span className="lesson-meta-pill">🎯 {progress?.lessonsCompleted?.length || 0} lessons done</span>
          </div>
        </div>

        {/* Content: two-column grid */}
        <div className="lesson-body">
          {/* Main Learning Column */}
          <div className="lesson-main">
            {/* 1. Concept Section 1 */}
            <div className="concept-card">
              <div className="concept-card-header">
                <div className="concept-header-left">
                  <span className="concept-icon-badge icon-blue">⚛</span>
                  <h2 className="concept-title">What is Superposition?</h2>
                </div>
                <span className="concept-tag tag-blue">CORE</span>
              </div>
              <div className="concept-text">
                In classical computing, a bit exists deterministically in either state <code>0</code> or <code>1</code>. A quantum bit (<strong>qubit</strong>), however, can exist in a linear combination of basis states:
              </div>
              <div className="math-callout">
                |ψ⟩ = α|0⟩ + β|1⟩, &nbsp;&nbsp;&nbsp;&nbsp; where |α|² + |β|² = 1
              </div>
              <div className="concept-text">
                Here, <code>α</code> and <code>β</code> are complex probability amplitudes. The probability of measuring state <code>0</code> is <code>|α|²</code>, and the probability of measuring <code>1</code> is <code>|β|²</code>.
              </div>
            </div>

            {/* Concept Section 2 */}
            <div className="concept-card">
              <div className="concept-card-header">
                <div className="concept-header-left">
                  <span className="concept-icon-badge icon-indigo">H</span>
                  <h2 className="concept-title">The Hadamard Gate</h2>
                </div>
                <span className="concept-tag tag-indigo">GATE</span>
              </div>
              <div className="concept-text">
                The Hadamard gate is the quantum circuit element used to create an equal superposition from a basis state. When applied to the ground state <code>|0⟩</code>, it produces the <code>|+⟩</code> state:
              </div>
              <div className="math-callout">
                H|0⟩ = (|0⟩ + |1⟩) / √2 = |+⟩
              </div>
              <div className="concept-text">
                When measured along the computational basis (Z-basis), this state has exactly a <strong>50% probability</strong> of yielding 0 and <strong>50% probability</strong> of yielding 1.
              </div>
            </div>

            {/* 4. Quick Concept Check / Quiz */}
            <div className="quiz-card">
              <div className="quiz-header">
                <span className="quiz-header-icon">📝</span>
                <span className="quiz-header-title">Quick Concept Check</span>
              </div>
              <p className="quiz-question">
                If a qubit is initialized in |0⟩ and we apply an H gate, what is the probability of measuring 0?
              </p>

              <div className="quiz-options compact">
                {[
                  { id: 'a', label: '100%' },
                  { id: 'b', label: '50% (Equal probability with 1)' },
                  { id: 'c', label: '0%' },
                  { id: 'd', label: '25%' }
                ].map((opt) => {
                  const isSelected = selectedQuiz === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      className={quizOptionClass(opt.id)}
                      onClick={() => handleSelectQuiz(opt.id)}
                      disabled={quizSubmitted}
                      aria-pressed={isSelected}
                    >
                      <span className={`quiz-radio ${isSelected ? 'selected' : ''}`}>
                        {isSelected && <span className="quiz-radio-inner" />}
                      </span>
                      <span className="option-text">{opt.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Quiz Actions */}
              <div className="quiz-actions">
                {!quizSubmitted && (
                  <button
                    type="button"
                    className="btn btn-primary quiz-submit-btn"
                    id="quizSubmitBtn"
                    onClick={handleCheckAnswer}
                    disabled={!selectedQuiz}
                  >
                    Check Answer
                  </button>
                )}
                {quizSubmitted && !quizCorrect && (
                  <button
                    type="button"
                    className="btn btn-outline quiz-retry-btn"
                    id="quizRetryBtn"
                    onClick={() => {
                      setQuizSubmitted(false);
                      setSelectedQuiz(null);
                      updateQuizState({ selectedAnswer: null, isSubmitted: false, isCorrect: null });
                    }}
                  >
                    Try Again
                  </button>
                )}
              </div>

              {quizSubmitted && (
                <div className={`quiz-feedback visible ${quizCorrect ? 'correct-feedback' : 'incorrect-feedback'}`}>
                  {quizCorrect ? '✓ Correct!' : '✗ Not quite.'}
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: 'var(--font-size-sm)', fontWeight: 400 }}>
                    Since |α|² = (1/√2)² = 1/2, the probability is exactly 50%.
                  </p>
                </div>
              )}
            </div>

            {/* 5. Previous / Next Lesson Navigation */}
            <div className="lesson-footer">
              <button className="btn btn-outline" onClick={() => navigate('/')}>
                ← Previous Lesson
              </button>
              <button className="btn btn-primary" id="startBuildingBtn" onClick={handleStartBuilding}>
                Next Lesson →
              </button>
            </div>
          </div>

          {/* Right Column: Sidebar */}
          <div className="lesson-aside">
            {/* Learning Objectives */}
            <div className="aside-card objectives-card">
              <div className="aside-card-title">
                <span className="aside-title-icon">🎯</span> Learning Objectives
              </div>
              <div className="objectives-list">
                <div className="objective-item">
                  <span className="obj-check">✓</span>
                  <span>Qubits can represent linear combinations of |0⟩ and |1⟩.</span>
                </div>
                <div className="objective-item">
                  <span className="obj-check">✓</span>
                  <span>Hadamard transforms basis vectors into equal superpositions.</span>
                </div>
                <div className="objective-item">
                  <span className="obj-check">✓</span>
                  <span>Measurement collapses the state with probabilities from amplitudes.</span>
                </div>
              </div>
            </div>

            {/* AI Tutor Card */}
            <div className="aside-card ai-tutor-card">
              <div className="ai-tutor-header">
                <div className="ai-tutor-header-left">
                  <span className="ai-tutor-avatar">🤖</span>
                  <span className="ai-tutor-title">AI Tutor</span>
                </div>
                <span className="ai-tutor-badge">LIVE</span>
              </div>
              <p className="ai-tutor-subtext">
                Need help with this concept?<br />
                Ask about the lesson, circuit or any doubt you have.
              </p>
              <button className="btn btn-primary ai-tutor-btn" onClick={handleAskTutor}>
                Ask AI Tutor
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating AI Tutor — safely in bottom-right corner */}
      <FloatingAITutorBtn
        screen="lesson"
        getContextData={getLessonContextData}
        customLabel="Ask AI Tutor"
        bottom="24px"
        right="24px"
      />
    </div>
  );
}
