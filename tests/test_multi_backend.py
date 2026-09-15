"""
Unit tests for multi-backend quantum simulator architecture.
Tests Qiskit Aer active simulation, PennyLane adapter interface, and backend registry.
"""
import unittest
from backend.quantum.simulator import simulate_circuit, get_available_backends, QuantumSimulator


class TestMultiBackend(unittest.TestCase):
    def test_backend_registry(self):
        backends = get_available_backends()
        self.assertIsInstance(backends, list)
        self.assertGreaterEqual(len(backends), 2)
        backend_ids = [b["id"] for b in backends]
        self.assertIn("qiskit-aer", backend_ids)
        self.assertIn("pennylane", backend_ids)

        # Qiskit should be active
        qiskit_meta = next(b for b in backends if b["id"] == "qiskit-aer")
        self.assertEqual(qiskit_meta["status"], "active")
        self.assertTrue(qiskit_meta["installed"])

    def test_qiskit_simulation_hadamard(self):
        circuit = {
            "qubits": 1,
            "shots": 500,
            "operations": [{"gate": "H", "qubit": 0, "step": 0}]
        }
        res = simulate_circuit(circuit, shots=500, backend="qiskit-aer")
        self.assertTrue(res["success"])
        self.assertEqual(res["backend"], "Qiskit Aer Simulator")
        self.assertIn("0", res["counts"])
        self.assertIn("1", res["counts"])
        self.assertEqual(len(res["blochSpheres"]), 1)
        # Check that x is close to 1 for H on |0>
        b0 = res["blochSpheres"][0]
        self.assertAlmostEqual(b0["x"], 1.0, delta=0.05)
        self.assertAlmostEqual(b0["z"], 0.0, delta=0.05)

    def test_qiskit_simulation_pauli_x(self):
        circuit = {
            "qubits": 1,
            "shots": 200,
            "operations": [{"gate": "X", "qubit": 0, "step": 0}]
        }
        res = simulate_circuit(circuit, shots=200, backend="qiskit-aer")
        self.assertTrue(res["success"])
        self.assertEqual(res["counts"].get("1"), 200)
        b0 = res["blochSpheres"][0]
        # Pauli X on |0> produces |1> -> z = -1
        self.assertAlmostEqual(b0["z"], -1.0, delta=0.05)

    def test_pennylane_graceful_handling(self):
        circuit = {"qubits": 1, "shots": 100, "operations": []}
        try:
            # If PennyLane is not installed, it should raise a clear RuntimeError
            res = simulate_circuit(circuit, shots=100, backend="pennylane")
            self.assertIn("backend", res)
        except RuntimeError as e:
            self.assertIn("PennyLane is not installed", str(e))

    def test_invalid_backend_raises_value_error(self):
        circuit = {"qubits": 1, "shots": 100, "operations": []}
        with self.assertRaises(ValueError):
            simulate_circuit(circuit, shots=100, backend="invalid_backend_engine")

    def test_backward_compatibility_quantum_simulator_class(self):
        sim = QuantumSimulator(default_shots=512)
        res = sim.run({})
        self.assertEqual(res["shots"], 512)
        self.assertTrue(res["success"])


if __name__ == "__main__":
    unittest.main()
