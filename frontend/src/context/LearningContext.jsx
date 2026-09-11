import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const STORAGE_KEY = 'quantumLeapLearningContext';

// Default / Initial state conforming to requirements:
// 1. currentLesson
// 2. studentLevel
// 3. currentCircuit
// 4. simulationResult
// 5. expectedOutput
// 6. lastError
// 7. currentChallenge
// 8. quizState
// 9. hintLevel
// 10. lastUserAction
const initialContextState = {
  currentLesson: {
    id: 'superposition',
    title: 'Superposition & The Hadamard Gate',
    module: 'Module 4 · Foundations of Quantum Logic'
  },
  studentLevel: 'Intermediate Learner',
  currentCircuit: {
    qubits: 2,
    grid: [
      [null, null, null, null],
      [null, null, null, null]
    ],
    operations: []
  },
  simulationResult: null, // Populated with REAL Qiskit Aer simulation result
  expectedOutput: {
    description: 'Bell State |Φ⁺⟩: 50% |00⟩, 50% |11⟩',
    targetStates: ['00', '11']
  },
  lastError: null,
  currentChallenge: {
    id: 'bell-state',
    title: 'Bell State Generation',
    objective: 'Synthesize the maximally entangled state |Φ⁺⟩ = (|00⟩ + |11⟩)/√2'
  },
  quizState: {
    selectedAnswer: null,
    isSubmitted: false,
    isCorrect: null
  },
  hintLevel: 1,
  lastUserAction: null
};

// Safe localStorage loader with error handling
function loadSavedContext() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        return {
          ...initialContextState,
          ...parsed,
          currentLesson: parsed.currentLesson || initialContextState.currentLesson,
          currentCircuit: parsed.currentCircuit || initialContextState.currentCircuit,
          expectedOutput: parsed.expectedOutput || initialContextState.expectedOutput,
          currentChallenge: parsed.currentChallenge || initialContextState.currentChallenge,
          quizState: parsed.quizState || initialContextState.quizState
        };
      }
    }
  } catch (err) {
    console.warn('Malformed learning context in localStorage, initializing clean context:', err);
  }
  return initialContextState;
}

const LearningContext = createContext(null);

export function LearningProvider({ children }) {
  const [contextState, setContextState] = useState(() => loadSavedContext());

  // Persist important learning context to localStorage (safe fields only)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(contextState));
    } catch (e) {
      console.warn('Failed to persist learning context:', e);
    }

    // Development-only console logging
    if (import.meta.env.DEV) {
      console.log('Learning Context Updated:', contextState);
    }
  }, [contextState]);

  // Context updater action helpers
  const updateCurrentLesson = useCallback((lesson) => {
    setContextState(prev => {
      const normalizedLesson = typeof lesson === 'string'
        ? { id: lesson, title: lesson, module: 'Quantum Foundations' }
        : lesson;
      return {
        ...prev,
        currentLesson: normalizedLesson,
        lastUserAction: 'opened_lesson'
      };
    });
  }, []);

  const updateCurrentCircuit = useCallback((circuit, actionType = 'changed_circuit') => {
    setContextState(prev => ({
      ...prev,
      currentCircuit: circuit,
      lastUserAction: actionType // 'placed_gate' | 'removed_gate' | 'changed_circuit'
    }));
  }, []);

  const updateSimulationResult = useCallback((result) => {
    setContextState(prev => ({
      ...prev,
      simulationResult: result,
      lastError: null,
      lastUserAction: 'ran_simulation'
    }));
  }, []);

  const updateCurrentChallenge = useCallback((challenge, expected = null) => {
    setContextState(prev => ({
      ...prev,
      currentChallenge: challenge,
      ...(expected ? { expectedOutput: expected } : {}),
      lastUserAction: 'started_challenge'
    }));
  }, []);

  const submitChallengeAttempt = useCallback((success, error = null) => {
    setContextState(prev => ({
      ...prev,
      lastError: success ? null : error,
      lastUserAction: 'submitted_challenge'
    }));
  }, []);

  const updateQuizState = useCallback((newQuizState) => {
    setContextState(prev => ({
      ...prev,
      quizState: {
        ...prev.quizState,
        ...newQuizState
      },
      lastUserAction: 'answered_quiz'
    }));
  }, []);

  const setHintLevel = useCallback((level) => {
    setContextState(prev => ({
      ...prev,
      hintLevel: level,
      lastUserAction: 'requested_hint'
    }));
  }, []);

  const setStudentLevel = useCallback((level) => {
    setContextState(prev => ({
      ...prev,
      studentLevel: level
    }));
  }, []);

  const setLastError = useCallback((err) => {
    setContextState(prev => ({
      ...prev,
      lastError: err
    }));
  }, []);

  const setLastUserAction = useCallback((action) => {
    setContextState(prev => ({
      ...prev,
      lastUserAction: action
    }));
  }, []);

  const value = useMemo(() => ({
    // 10 Context fields
    currentLesson: contextState.currentLesson,
    studentLevel: contextState.studentLevel,
    currentCircuit: contextState.currentCircuit,
    simulationResult: contextState.simulationResult,
    expectedOutput: contextState.expectedOutput,
    lastError: contextState.lastError,
    currentChallenge: contextState.currentChallenge,
    quizState: contextState.quizState,
    hintLevel: contextState.hintLevel,
    lastUserAction: contextState.lastUserAction,

    // Full state snapshot
    contextState,

    // Actions & Updaters
    updateCurrentLesson,
    updateCurrentCircuit,
    updateSimulationResult,
    updateCurrentChallenge,
    submitChallengeAttempt,
    updateQuizState,
    setHintLevel,
    setStudentLevel,
    setLastError,
    setLastUserAction
  }), [
    contextState,
    updateCurrentLesson,
    updateCurrentCircuit,
    updateSimulationResult,
    updateCurrentChallenge,
    submitChallengeAttempt,
    updateQuizState,
    setHintLevel,
    setStudentLevel,
    setLastError,
    setLastUserAction
  ]);

  return (
    <LearningContext.Provider value={value}>
      {children}
    </LearningContext.Provider>
  );
}

export function useLearningContext() {
  const context = useContext(LearningContext);
  if (!context) {
    throw new Error('useLearningContext must be used within a <LearningProvider>');
  }
  return context;
}

export default LearningContext;