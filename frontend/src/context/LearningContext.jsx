import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const STORAGE_KEY = 'quantumLeapLearningContext';

export const QUANTUM_CONCEPTS = [
  'Qubit',
  'Superposition',
  'Hadamard',
  'Measurement',
  'Entanglement',
  'Bell State',
  'CNOT'
];

export const TOTAL_LESSONS = 7;
export const TOTAL_CHALLENGES = 3;

/**
 * Calculates concept-level mastery scores (0-100) dynamically based on actual
 * student activities: completed lessons, quiz scores, and challenge passes.
 */
export function computeConceptMastery(lessons = [], quizzes = [], challenges = []) {
  const mastery = {};
  const hasSuperpositionLesson = lessons.includes('superposition');
  const superQuiz = quizzes.find(q => q.topic?.toLowerCase().includes('superposition') || q.lessonId === 'superposition');
  const superQuizPct = superQuiz ? (superQuiz.percentage || 0) : 0;
  const bellChallenge = challenges.find(c => c.id === 'bell-state');
  const bellPassed = bellChallenge ? bellChallenge.passed : false;
  const bellAttempted = !!bellChallenge;

  // Qubit: Basic quantum information unit
  let qubitScore = 0;
  if (hasSuperpositionLesson) qubitScore += 40;
  if (superQuizPct > 0) qubitScore += Math.round((superQuizPct / 100) * 30);
  if (bellPassed) qubitScore += 30;
  mastery['Qubit'] = Math.min(100, qubitScore);

  // Superposition: Linear combinations and state vectors
  let superScore = 0;
  if (hasSuperpositionLesson) superScore += 35;
  if (superQuizPct > 0) superScore += Math.round((superQuizPct / 100) * 40);
  if (bellPassed) superScore += 25;
  mastery['Superposition'] = Math.min(100, superScore);

  // Hadamard: Basis transformation gate
  let hadamardScore = 0;
  if (hasSuperpositionLesson) hadamardScore += 30;
  if (superQuizPct > 0) hadamardScore += Math.round((superQuizPct / 100) * 35);
  if (bellPassed) hadamardScore += 35;
  mastery['Hadamard'] = Math.min(100, hadamardScore);

  // Measurement: Projection onto computational basis
  let measureScore = 0;
  if (hasSuperpositionLesson) measureScore += 25;
  if (superQuizPct > 0) measureScore += Math.round((superQuizPct / 100) * 25);
  if (bellPassed) measureScore += 30;
  mastery['Measurement'] = Math.min(100, measureScore);

  // Entanglement: Non-separable multi-qubit correlations
  let entangleScore = 0;
  if (bellAttempted) entangleScore += 20;
  if (bellPassed) entangleScore += 65;
  if (hasSuperpositionLesson) entangleScore += 15;
  mastery['Entanglement'] = Math.min(100, entangleScore);

  // Bell State: Maximally entangled two-qubit state (|00> + |11>)/sqrt(2)
  let bellScore = 0;
  if (bellAttempted) bellScore += 20;
  if (bellPassed) bellScore += 75;
  if (hasSuperpositionLesson) bellScore += 5;
  mastery['Bell State'] = Math.min(100, bellScore);

  // CNOT: Controlled-NOT entangling two-qubit gate
  let cnotScore = 0;
  if (bellAttempted) cnotScore += 20;
  if (bellPassed) cnotScore += 70;
  if (hasSuperpositionLesson) cnotScore += 10;
  mastery['CNOT'] = Math.min(100, cnotScore);

  return mastery;
}

/**
 * Weighted overall mastery formula:
 * Lessons: 30% weight
 * Quizzes: 40% weight
 * Challenges: 30% weight
 */
export function calculateOverallMastery(lessonsCompleted = [], quizResults = [], challengeResults = []) {
  const completedLessonsCount = lessonsCompleted?.length || 0;
  const passedChallengesCount = (challengeResults || []).filter(c => c.passed).length;
  const totalQuizzes = quizResults?.length || 0;

  if (completedLessonsCount === 0 && totalQuizzes === 0 && passedChallengesCount === 0) {
    return 0;
  }

  const lessonScore = Math.min(100, (completedLessonsCount / TOTAL_LESSONS) * 100);

  let quizScore = 0;
  if (totalQuizzes > 0) {
    const totalQuizPct = quizResults.reduce((acc, q) => acc + (q.percentage ?? (q.score / (q.total || 1)) * 100), 0);
    quizScore = totalQuizPct / totalQuizzes;
  }

  const challengeScore = Math.min(100, (passedChallengesCount / TOTAL_CHALLENGES) * 100);

  const weighted = (lessonScore * 0.30) + (quizScore * 0.40) + (challengeScore * 0.30);
  return Math.min(100, Math.max(0, Math.round(weighted)));
}

// Default / Initial state conforming to requirements
const initialContextState = {
  // 10 core fields
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
  simulationResult: null,
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
  lastUserAction: null,

  // Dynamic progress tracking fields
  lessonsCompleted: [],
  quizResults: [],
  challengeResults: [],
  conceptMastery: {
    'Qubit': 0,
    'Superposition': 0,
    'Hadamard': 0,
    'Measurement': 0,
    'Entanglement': 0,
    'Bell State': 0,
    'CNOT': 0
  },
  activityHistory: [],
  initialMastery: 0,
  lastActivity: null
};

// Safe localStorage loader with error handling
function loadSavedContext() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        const loadedLessons = Array.isArray(parsed.lessonsCompleted) ? parsed.lessonsCompleted : [];
        const loadedQuizzes = Array.isArray(parsed.quizResults) ? parsed.quizResults : [];
        const loadedChallenges = Array.isArray(parsed.challengeResults) ? parsed.challengeResults : [];
        const loadedMastery = parsed.conceptMastery && typeof parsed.conceptMastery === 'object'
          ? parsed.conceptMastery
          : computeConceptMastery(loadedLessons, loadedQuizzes, loadedChallenges);

        return {
          ...initialContextState,
          ...parsed,
          currentLesson: parsed.currentLesson || initialContextState.currentLesson,
          currentCircuit: parsed.currentCircuit || initialContextState.currentCircuit,
          expectedOutput: parsed.expectedOutput || initialContextState.expectedOutput,
          currentChallenge: parsed.currentChallenge || initialContextState.currentChallenge,
          quizState: parsed.quizState || initialContextState.quizState,
          lessonsCompleted: loadedLessons,
          quizResults: loadedQuizzes,
          challengeResults: loadedChallenges,
          conceptMastery: loadedMastery,
          activityHistory: Array.isArray(parsed.activityHistory) ? parsed.activityHistory : [],
          initialMastery: typeof parsed.initialMastery === 'number' ? parsed.initialMastery : 0,
          lastActivity: parsed.lastActivity || null
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

  // --- Dynamic Progress Tracking Updaters ---

  const recordLessonCompletion = useCallback((lessonId, lessonTitle = 'Lesson', topics = ['Superposition', 'Hadamard']) => {
    setContextState(prev => {
      const prevLessons = prev.lessonsCompleted || [];
      const isAlreadyCompleted = prevLessons.includes(lessonId);
      const updatedLessons = isAlreadyCompleted ? prevLessons : [...prevLessons, lessonId];

      const now = new Date().toISOString();
      const newActivity = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        type: 'lesson',
        title: isAlreadyCompleted ? `Reviewed: ${lessonTitle}` : `Completed: ${lessonTitle}`,
        topic: topics[0] || 'Quantum Foundations',
        timestamp: now,
        details: `Finished lesson module on ${lessonTitle}`
      };

      const updatedHistory = [newActivity, ...(prev.activityHistory || [])].slice(0, 20);
      const updatedConceptMastery = computeConceptMastery(
        updatedLessons,
        prev.quizResults || [],
        prev.challengeResults || []
      );

      return {
        ...prev,
        lessonsCompleted: updatedLessons,
        activityHistory: updatedHistory,
        conceptMastery: updatedConceptMastery,
        lastActivity: now,
        lastUserAction: 'completed_lesson'
      };
    });
  }, []);

  const recordQuizResult = useCallback(({ topic = 'Superposition', score = 1, total = 1, lessonId = 'superposition' }) => {
    setContextState(prev => {
      const percentage = Math.round((score / (total || 1)) * 100);
      const prevQuizzes = prev.quizResults || [];
      const now = new Date().toISOString();

      const existingIndex = prevQuizzes.findIndex(
        q => q.topic === topic || (lessonId && q.lessonId === lessonId)
      );

      let updatedQuizzes;
      if (existingIndex >= 0) {
        updatedQuizzes = [...prevQuizzes];
        updatedQuizzes[existingIndex] = {
          ...updatedQuizzes[existingIndex],
          score,
          total,
          percentage,
          timestamp: now
        };
      } else {
        updatedQuizzes = [
          ...prevQuizzes,
          {
            id: `quiz-${Date.now()}`,
            lessonId,
            topic,
            score,
            total,
            percentage,
            timestamp: now
          }
        ];
      }

      const newActivity = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        type: 'quiz',
        title: `Quiz: ${topic}`,
        topic,
        timestamp: now,
        details: `Scored ${score}/${total} (${percentage}%)`
      };

      const updatedHistory = [newActivity, ...(prev.activityHistory || [])].slice(0, 20);
      const updatedConceptMastery = computeConceptMastery(
        prev.lessonsCompleted || [],
        updatedQuizzes,
        prev.challengeResults || []
      );

      return {
        ...prev,
        quizResults: updatedQuizzes,
        activityHistory: updatedHistory,
        conceptMastery: updatedConceptMastery,
        lastActivity: now,
        lastUserAction: 'recorded_quiz_result'
      };
    });
  }, []);

  const recordChallengeResult = useCallback(({ id = 'bell-state', title = 'Bell State Generation', topic = 'Entanglement', passed = true, score = 100 }) => {
    setContextState(prev => {
      const prevChallenges = prev.challengeResults || [];
      const now = new Date().toISOString();
      const existingIndex = prevChallenges.findIndex(c => c.id === id);

      let updatedChallenges;
      if (existingIndex >= 0) {
        updatedChallenges = [...prevChallenges];
        const wasPassed = updatedChallenges[existingIndex].passed;
        updatedChallenges[existingIndex] = {
          ...updatedChallenges[existingIndex],
          passed: wasPassed || passed,
          score: wasPassed ? Math.max(updatedChallenges[existingIndex].score, score) : score,
          timestamp: now
        };
      } else {
        updatedChallenges = [
          ...prevChallenges,
          {
            id,
            title,
            topic,
            passed,
            score,
            timestamp: now
          }
        ];
      }

      const newActivity = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        type: 'challenge',
        title: `${passed ? 'Passed' : 'Attempted'}: ${title}`,
        topic,
        timestamp: now,
        details: passed ? `Successfully completed with ${score}% fidelity` : 'Attempt did not meet target state'
      };

      const updatedHistory = [newActivity, ...(prev.activityHistory || [])].slice(0, 20);
      const updatedConceptMastery = computeConceptMastery(
        prev.lessonsCompleted || [],
        prev.quizResults || [],
        updatedChallenges
      );

      return {
        ...prev,
        challengeResults: updatedChallenges,
        activityHistory: updatedHistory,
        conceptMastery: updatedConceptMastery,
        lastActivity: now,
        lastUserAction: 'recorded_challenge_result'
      };
    });
  }, []);

  const resetProgress = useCallback(() => {
    setContextState(prev => ({
      ...prev,
      lessonsCompleted: [],
      quizResults: [],
      challengeResults: [],
      conceptMastery: {
        'Qubit': 0,
        'Superposition': 0,
        'Hadamard': 0,
        'Measurement': 0,
        'Entanglement': 0,
        'Bell State': 0,
        'CNOT': 0
      },
      activityHistory: [],
      initialMastery: 0,
      lastActivity: null,
      quizState: {
        selectedAnswer: null,
        isSubmitted: false,
        isCorrect: null
      }
    }));
  }, []);

  // Computed progress metrics
  const progressMetrics = useMemo(() => {
    const lessonsCompleted = contextState.lessonsCompleted || [];
    const quizResults = contextState.quizResults || [];
    const challengeResults = contextState.challengeResults || [];
    const passedChallenges = challengeResults.filter(c => c.passed);

    const overallMastery = calculateOverallMastery(lessonsCompleted, quizResults, challengeResults);
    const learningGain = Math.max(0, overallMastery - (contextState.initialMastery || 0));

    const totalQuizzes = quizResults.length;
    const avgQuizScore = totalQuizzes > 0
      ? Math.round(quizResults.reduce((acc, q) => acc + (q.percentage || 0), 0) / totalQuizzes)
      : 0;

    const conceptMastery = contextState.conceptMastery || computeConceptMastery(lessonsCompleted, quizResults, challengeResults);

    return {
      lessonsCompletedCount: lessonsCompleted.length,
      lessonsCompletedList: lessonsCompleted,
      totalLessons: TOTAL_LESSONS,
      lessonProgressPercent: Math.round((lessonsCompleted.length / TOTAL_LESSONS) * 100),
      challengesPassedCount: passedChallenges.length,
      totalChallenges: TOTAL_CHALLENGES,
      challengeProgressPercent: Math.round((passedChallenges.length / TOTAL_CHALLENGES) * 100),
      overallMastery,
      learningGain,
      quizzesTaken: totalQuizzes,
      averageQuizScore: avgQuizScore,
      quizResults,
      challengeResults,
      activityHistory: contextState.activityHistory || [],
      conceptMastery,
      lastActivity: contextState.lastActivity
    };
  }, [contextState]);

  const getProgress = useCallback(() => progressMetrics, [progressMetrics]);
  const getConceptMastery = useCallback(() => progressMetrics.conceptMastery, [progressMetrics]);

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

    // Dynamic progress state fields
    lessonsCompleted: contextState.lessonsCompleted || [],
    quizResults: contextState.quizResults || [],
    challengeResults: contextState.challengeResults || [],
    conceptMastery: contextState.conceptMastery || progressMetrics.conceptMastery,
    activityHistory: contextState.activityHistory || [],
    initialMastery: contextState.initialMastery || 0,
    lastActivity: contextState.lastActivity,
    progress: progressMetrics,

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
    setLastUserAction,

    // Progress actions
    recordLessonCompletion,
    recordQuizResult,
    recordChallengeResult,
    resetProgress,
    getProgress,
    getConceptMastery
  }), [
    contextState,
    progressMetrics,
    updateCurrentLesson,
    updateCurrentCircuit,
    updateSimulationResult,
    updateCurrentChallenge,
    submitChallengeAttempt,
    updateQuizState,
    setHintLevel,
    setStudentLevel,
    setLastError,
    setLastUserAction,
    recordLessonCompletion,
    recordQuizResult,
    recordChallengeResult,
    resetProgress,
    getProgress,
    getConceptMastery
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