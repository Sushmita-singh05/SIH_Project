/**
 * Common TutorContext Utility
 * Normalizes, persists, and recovers screen-specific quantum tutoring context
 * across the QuantumLeap-AI application.
 */

const STORAGE_KEY = 'ql_tutor_context';

/**
 * Builds a standardized TutorContext object tailored to the active screen.
 * @param {string} screen - 'dashboard' | 'lesson' | 'circuit-builder' | 'code-mode' | 'simulation-output' | 'challenge' | 'progress'
 * @param {Object} [data={}] - Screen-specific payload
 * @returns {Object} Structured TutorContext
 */
export function buildTutorContext(screen, data = {}) {
  const context = {
    screen: screen || 'dashboard',
    timestamp: Date.now(),
    topic: data.topic || null,
    lastAction: data.lastAction || data.lastUserAction || null,
    progress: data.progress || null,
  };

  // 1. Simulation Output context
  if (screen === 'simulation-output') {
    context.topic = data.topic || 'Simulation Analysis';
    context.circuit = data.circuit || {
      qubits: data.qubits || 2,
      operations: data.operations || [],
    };
    context.backend = data.backend || 'qiskit-aer';
    context.shots = data.shots || 1024;
    context.counts = data.counts || {};
    context.probabilities = data.probabilities || {};
    context.statevector = Array.isArray(data.statevector) && data.statevector.length > 0 ? data.statevector : null;
    context.bloch = data.bloch || data.blochSpheres || [];
    context.error = data.error || data.lastError || null;
    context.executionTimeMs = data.executionTimeMs ?? null;
    context.userPrompt = data.userPrompt || null;
    if (data.progress) {
      context.progress = data.progress;
    }
  }

  // 2. Circuit Builder & Code Mode context
  else if (screen === 'circuit-builder' || screen === 'code-mode') {
    context.topic = data.mode === 'code' ? 'Qiskit Circuit Code' : 'Visual Circuit Construction';
    context.circuit = {
      qubits: data.qubits || 2,
      operations: data.operations || [],
    };
    context.mode = data.mode || 'visual';
    context.selectedGate = data.selectedGate || null;
    context.code = data.code || '';
    context.errors = data.errors || [];
    context.lastAction = data.lastAction || data.lastUserAction || null;
    context.userPrompt = data.userPrompt || null;
    if (data.progress) {
      context.progress = data.progress;
    }
  }

  // 3. Challenge context
  else if (screen === 'challenge') {
    context.topic = data.challenge?.title || 'Quantum Challenge';
    context.challenge = data.challenge || { id: 'bell-state', title: 'Bell State Generation' };
    context.circuit = {
      qubits: data.circuit?.qubits || data.qubits || 2,
      operations: data.circuit?.operations || data.operations || [],
      grid: data.grid || null,
    };
    context.hintLevel = data.hintLevel || 1;
    context.hintMode = true;
    context.lastError = data.lastError || null;
    context.evaluationResult = data.evaluationResult || null;
    context.challengeExpected = data.expectedOutput || data.challenge?.expected || data.evaluationResult?.expected || null;
    context.challengeActual = data.actualOutput || data.evaluationResult?.actual || null;
    context.score = data.score ?? data.evaluationResult?.score ?? null;
    context.passed = data.passed ?? data.evaluationResult?.passed ?? null;
    context.feedback = data.feedback || data.evaluationResult?.feedback || null;
    context.lastAction = data.lastAction || data.lastUserAction || null;
    context.userPrompt = data.userPrompt || null;
    if (data.progress) {
      context.progress = data.progress;
    }
  }

  // 4. Lesson context
  else if (screen === 'lesson') {
    context.topic = data.lesson?.title || data.topic || 'Superposition & The Hadamard Gate';
    context.lesson = data.lesson || {
      id: 'superposition',
      title: 'Superposition & The Hadamard Gate',
      module: 'Module 4 · Foundations of Quantum Logic',
    };
    context.quizState = data.quizState ?? null;
    context.lastAction = data.lastAction || data.lastUserAction || null;
    context.userPrompt = data.userPrompt || null;
    if (data.progress) {
      context.progress = data.progress;
    }
  }

  // 5. Dashboard & Progress context
  else if (screen === 'dashboard' || screen === 'progress') {
    context.topic = 'Learning Progress & Next Steps';
    context.studentProgress = data.studentProgress || {
      overallMastery: 0,
      completedLabs: 0,
      studyStreakDays: 1,
      recommendedTopic: 'Module 4: Superposition & The Hadamard Gate',
    };
    context.conceptMastery = data.progress?.conceptMastery || null;
    context.lastAction = data.lastAction || data.lastUserAction || null;
    context.userPrompt = data.userPrompt || null;
    if (data.progress) {
      context.progress = data.progress;
    }
  }

  else if (screen === 'video-learning') {
    context.topic = data.topic || 'Quantum Visual Learning';
    context.lessonId = data.lessonId || null;
    context.sceneTitle = data.sceneTitle || null;
    context.sceneType = data.sceneType || null;
    context.narration = data.narration || null;
    context.circuit = data.circuit || null;
    if (data.operations) {
      context.circuit = {
        qubits: data.qubits || 2,
        operations: data.operations,
      };
    }
    context.userPrompt = data.userPrompt || null;
  }

  return context;
}

/**
 * Saves a TutorContext to localStorage and updates legacy synchronization keys.
 * @param {Object} context
 */
export function saveTutorContext(context) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(context));

    // Keep legacy ql_sim_context synchronized if simulation data is present
    if (context.counts) {
      localStorage.setItem('ql_sim_context', JSON.stringify({
        screen: context.screen,
        counts: context.counts,
        shots: context.shots,
        statevector: context.statevector,
        backend: context.backend,
        circuit: context.circuit?.operations || [],
      }));
    }
  } catch (err) {
    console.warn('Failed to save TutorContext:', err);
  }
}

/**
 * Recovers the active TutorContext from localStorage with intelligent fallbacks.
 * @returns {Object} TutorContext
 */
export function loadTutorContext() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') return parsed;
    }

    // Fallback: check legacy ql_sim_context
    const simSaved = localStorage.getItem('ql_sim_context') || localStorage.getItem('quantumLeapSimulation');
    if (simSaved) {
      const sim = JSON.parse(simSaved);
      const res = sim.result || sim;
      return buildTutorContext('simulation-output', {
        topic: sim.lesson || 'Simulation Analysis',
        qubits: sim.qubits || res.qubits || 2,
        operations: sim.operations || [],
        backend: res.backend || 'qiskit-aer',
        shots: res.shots || 1024,
        counts: res.counts || {},
        probabilities: res.probabilities || {},
        statevector: res.statevector || [],
        blochSpheres: res.blochSpheres || [],
      });
    }
  } catch (err) {
    console.warn('Failed to load TutorContext:', err);
  }

  // Default fallback
  return buildTutorContext('dashboard');
}
