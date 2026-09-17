/**
 * QuantumLeap-AI API Service
 * Handles communication with the FastAPI + Qiskit backend running on port 8010.
 */

const API_BASE_URL = 'http://127.0.0.1:8010';

/**
 * Sends a quantum circuit JSON to the backend for quantum simulation.
 * @param {Object} circuitData - { qubits, shots, operations, backend }
 * @param {string} [backend='qiskit-aer'] - Target simulation engine
 * @returns {Promise<Object>} Full simulation result with counts, probabilities, statevector, and metadata.
 */
export async function simulateCircuit(circuitData, backend = 'qiskit-aer') {
  const payload = {
    ...circuitData,
    backend: circuitData.backend || backend || 'qiskit-aer'
  };

  const response = await fetch(API_BASE_URL + '/api/circuit/simulate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMsg = response.statusText;
    try {
      const errJson = await response.json();
      if (errJson && errJson.detail) errorMsg = errJson.detail;
    } catch (_) {
      try {
        const text = await response.text();
        if (text) errorMsg = text;
      } catch (__) {}
    }
    throw new Error(errorMsg || `Quantum simulation failed (${response.status})`);
  }

  return await response.json();
}

/**
 * Fetches the list of registered quantum simulation backends from the API.
 * @returns {Promise<Array<{id: string, name: string, status: string, is_default: boolean}>>}
 */
export async function getAvailableBackends() {
  const response = await fetch(API_BASE_URL + '/api/circuit/backends');
  if (!response.ok) {
    throw new Error('Failed to fetch quantum simulation backends: ' + response.statusText);
  }
  return await response.json();
}

/**
 * Sends a query and screen context to the context-aware AI Tutor engine.
 * @param {string} query - Student's question
 * @param {Object} context - Structured TutorContext (screen, circuit, counts, bloch, etc.)
 * @param {number} [hintLevel=1] - Active hint level
 * @returns {Promise<Object>} { reply, hints, hint_level, suggested_questions, source }
 */
export async function chatWithAITutor(query, context = {}, hintLevel = 1) {
  const response = await fetch(API_BASE_URL + '/api/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      context,
      hint_level: hintLevel,
    }),
  });

  if (!response.ok) {
    let errorMsg = response.statusText;
    try {
      const errJson = await response.json();
      if (errJson && errJson.detail) errorMsg = errJson.detail;
    } catch (_) {}
    throw new Error(errorMsg || `AI Tutor request failed (${response.status})`);
  }

  return await response.json();
}

/**
 * Checks backend health status.
 * @returns {Promise<Object>}
 */
export async function checkHealth() {
  const response = await fetch(API_BASE_URL + '/api/health');
  if (!response.ok) {
    throw new Error('Health check failed: ' + response.statusText);
  }
  return await response.json();
}

/**
 * Submits a video URL to the FastAPI backend for validation and analysis.
 * Endpoint: POST http://127.0.0.1:8010/api/video/analyze
 * @param {string} url - The video URL to analyze
 * @returns {Promise<{success: boolean, video_id: string, url: string, status: string}>}
 */
export async function analyzeVideo(url) {
  const response = await fetch(API_BASE_URL + '/api/video/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errJson = await response.json();
      if (errJson && errJson.detail) {
        errorDetail = errJson.detail;
      }
    } catch (_) {
      try {
        const text = await response.text();
        if (text) errorDetail = text;
      } catch (__) {}
    }
    throw new Error(errorDetail || `Analysis failed (${response.status})`);
  }

  return await response.json();
}

/**
 * Sends a quantum topic, question, or learning notes to the FastAPI AI explanation generator.
 * Endpoint: POST http://127.0.0.1:8010/api/ai/generate-explanation
 * @param {string} text - The quantum topic or text to explain
 * @returns {Promise<{success: boolean, topic: string, difficulty: string, learning_objective: string, scenes: Array}>}
 */
export async function generateVisualExplanation(text) {
  let response;
  try {
    response = await fetch(API_BASE_URL + '/api/ai/generate-explanation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });
  } catch (netErr) {
    throw new Error(
      'Unable to connect to the QuantumLeap-AI backend service. Please verify that the FastAPI server is running on port 8010.'
    );
  }

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errJson = await response.json();
      if (errJson && errJson.detail) {
        if (Array.isArray(errJson.detail)) {
          errorDetail = errJson.detail.map((d) => d.msg || d).join(', ');
        } else {
          errorDetail = errJson.detail;
        }
      }
    } catch (_) {
      try {
        const textErr = await response.text();
        if (textErr) errorDetail = textErr;
      } catch (__) {}
    }

    if (response.status === 503) {
      throw new Error(errorDetail || 'AI provider is unavailable or not configured.');
    }
    if (response.status === 422) {
      throw new Error(errorDetail || 'Please enter a quantum topic or some learning material.');
    }
    throw new Error(errorDetail || `Unable to generate explanation (HTTP ${response.status})`);
  }

  const data = await response.json();
  if (!data || !Array.isArray(data.scenes) || data.scenes.length === 0) {
    throw new Error('Received an invalid or empty explanation plan from the backend.');
  }

  return data;
}

/**
 * Generates an interactive lesson storyboard for a quantum topic.
 * Endpoint: POST http://127.0.0.1:8010/api/video/generate
 * @param {string} topic - The quantum topic to generate a lesson for
 * @param {string} [difficulty='beginner'] - Difficulty level
 * @param {string} [language='English'] - Language
 * @returns {Promise<{lessonId: string, title: string, topic: string, scenes: Array, source: string}>}
 */
export async function generateLesson(topic, difficulty = 'beginner', language = 'English') {
  let response;
  try {
    response = await fetch(API_BASE_URL + '/api/video/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, difficulty, language }),
    });
  } catch (netErr) {
    throw new Error(
      'Unable to connect to the QuantumLeap-AI backend. Please verify the FastAPI server is running on port 8010.'
    );
  }

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errJson = await response.json();
      if (errJson && errJson.detail) errorDetail = errJson.detail;
    } catch (_) {}
    throw new Error(errorDetail || `Failed to generate lesson (HTTP ${response.status})`);
  }

  const data = await response.json();
  if (!data || !Array.isArray(data.scenes) || data.scenes.length === 0) {
    throw new Error('Received an empty lesson from the backend.');
  }
  return data;
}
