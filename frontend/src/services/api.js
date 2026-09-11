/**
 * QuantumLeap-AI API Service
 * Handles communication with the FastAPI + Qiskit backend running on port 8001.
 */

const API_BASE_URL = 'http://localhost:8001';

/**
 * Sends a quantum circuit JSON to the backend for Qiskit Aer simulation.
 * @param {Object} circuitData - { qubits, shots, operations }
 * @returns {Promise<Object>} Full simulation result with counts, probabilities, statevector, and metadata.
 */
export async function simulateCircuit(circuitData) {
  const response = await fetch(API_BASE_URL + '/api/circuit/simulate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(circuitData),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error('Quantum simulation failed (' + response.status + '): ' + (errorBody || response.statusText));
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
