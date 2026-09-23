"""
Simulation-Based Challenge Evaluation tests (Bell State).

Covers the required test matrix:
  TEST 1 — Correct Bell State (H + CNOT)        -> passed, high score
  TEST 2 — Only H                               -> not a correct Bell State
  TEST 3 — Incorrect circuit                    -> failed / low score
  Tolerance checks                              -> 49/51 passes, 90/10 fails
  Failure cases                                 -> empty / invalid circuit,
                                                   invalid qubit index,
                                                   missing measurement result,
                                                   unknown challenge
  API contract                                  -> POST /api/challenge/evaluate
"""
import unittest

from fastapi.testclient import TestClient

from backend.main import app
from backend.quantum.challenge_evaluator import evaluate_challenge, evaluate_bell_state


BELL_OPS = [
    {"gate": "H", "qubit": 0, "step": 0},
    {"gate": "CNOT", "qubit": 1, "step": 1, "control": 0, "target": 1},
]


def bell_circuit(operations=None, qubits=2, shots=1024):
    return {
        "qubits": qubits,
        "shots": shots,
        "operations": BELL_OPS if operations is None else operations,
    }


def fake_sim(probabilities, counts=None, shots=1024):
    """Deterministic stand-in for a Qiskit simulation result."""
    return {
        "success": True,
        "shots": shots,
        "probabilities": probabilities,
        "counts": counts or {k: int(round(v * shots)) for k, v in probabilities.items()},
        "executionTimeMs": 1.0,
    }


class TestBellStateSimulationEvaluation(unittest.TestCase):
    """TEST 1–3: end-to-end evaluation through the real Qiskit Aer simulator."""

    def test_1_correct_bell_state_passes_with_high_score(self):
        result = evaluate_challenge("bell-state", bell_circuit())
        self.assertTrue(result["passed"], result["feedback"])
        self.assertGreaterEqual(result["score"], 80)
        self.assertLessEqual(result["score"], 100)
        self.assertEqual(result["status"], "passed")
        # Actual distribution must be close to 50/50 on the target subspace
        self.assertAlmostEqual(result["actual"]["00"], 0.5, delta=0.1)
        self.assertAlmostEqual(result["actual"]["11"], 0.5, delta=0.1)
        self.assertLessEqual(result["actual"]["01"] + result["actual"]["10"], 0.1)
        self.assertIn("Excellent", result["feedback"])

    def test_2_only_h_gate_fails(self):
        result = evaluate_challenge(
            "bell-state",
            bell_circuit(operations=[{"gate": "H", "qubit": 0, "step": 0}]),
        )
        self.assertFalse(result["passed"])
        self.assertLess(result["score"], 80)
        # H alone leaks 50% into a non-target state
        leakage = result["actual"]["01"] + result["actual"]["10"]
        self.assertGreater(leakage, 0.3)
        self.assertIn("CNOT", result["feedback"])

    def test_3_incorrect_circuit_fails_with_low_score(self):
        # X then CNOT produces a deterministic |11> product state, not a Bell state
        result = evaluate_challenge(
            "bell-state",
            bell_circuit(operations=[
                {"gate": "X", "qubit": 0, "step": 0},
                {"gate": "CNOT", "qubit": 1, "step": 1, "control": 0, "target": 1},
            ]),
        )
        self.assertFalse(result["passed"])
        self.assertLess(result["score"], 80)
        self.assertEqual(result["status"], "failed")

    def test_cnot_only_fails(self):
        result = evaluate_challenge(
            "bell-state",
            bell_circuit(operations=[{"gate": "CNOT", "qubit": 1, "step": 0, "control": 0, "target": 1}]),
        )
        self.assertFalse(result["passed"])
        self.assertIn("Hadamard", result["feedback"])


class TestToleranceAndScoring(unittest.TestCase):
    """Deterministic tolerance checks: probabilistic 50/50 is accepted, skew is not."""

    def test_near_ideal_distribution_passes(self):
        for probs in ({"00": 0.49, "11": 0.51}, {"00": 0.52, "11": 0.48}, {"00": 0.5, "11": 0.5}):
            result = evaluate_bell_state(bell_circuit(), fake_sim(probs))
            self.assertTrue(result["passed"], probs)
            self.assertGreaterEqual(result["score"], 90, probs)

    def test_skewed_distribution_fails(self):
        # 90% |00>, 10% |01> must never be accepted as a Bell state
        result = evaluate_bell_state(bell_circuit(), fake_sim({"00": 0.9, "01": 0.1}))
        self.assertFalse(result["passed"])
        self.assertLess(result["score"], 80)

    def test_score_is_continuous_not_fixed(self):
        weak = evaluate_bell_state(bell_circuit(), fake_sim({"00": 0.7, "11": 0.2, "10": 0.1}))
        partial = evaluate_bell_state(bell_circuit(), fake_sim({"00": 0.44, "11": 0.44, "01": 0.12}))
        strong = evaluate_bell_state(bell_circuit(), fake_sim({"00": 0.51, "11": 0.49}))
        self.assertFalse(weak["passed"])
        self.assertFalse(partial["passed"])   # leakage 12% > 10% tolerance
        self.assertTrue(strong["passed"])
        # Scores are computed from the distribution, never fixed constants
        self.assertGreater(strong["score"], partial["score"])
        self.assertGreater(partial["score"], weak["score"])
        self.assertGreaterEqual(weak["score"], 0)

    def test_expected_output_is_reported(self):
        result = evaluate_bell_state(bell_circuit(), fake_sim({"00": 0.5, "11": 0.5}))
        self.assertEqual(result["expected"], {"00": 0.5, "11": 0.5, "01": 0.0, "10": 0.0})


class TestFailureCases(unittest.TestCase):
    """Friendly, non-technical failures — never a raw Python traceback."""

    def test_empty_circuit_fails_gracefully(self):
        result = evaluate_challenge("bell-state", bell_circuit(operations=[]))
        self.assertFalse(result["passed"])
        self.assertEqual(result["score"], 0)
        self.assertIn("empty", result["feedback"].lower())

    def test_invalid_qubit_index_fails_gracefully(self):
        result = evaluate_challenge(
            "bell-state",
            bell_circuit(operations=[{"gate": "H", "qubit": 5, "step": 0}]),
        )
        self.assertFalse(result["passed"])
        self.assertEqual(result["score"], 0)
        self.assertIn("qubit", result["feedback"].lower())
        self.assertNotIn("Traceback", result["feedback"])

    def test_control_equals_target_fails_gracefully(self):
        result = evaluate_challenge(
            "bell-state",
            bell_circuit(operations=[{"gate": "CNOT", "qubit": 0, "step": 0, "control": 0, "target": 0}]),
        )
        self.assertFalse(result["passed"])
        self.assertIn("control", result["feedback"].lower())

    def test_single_qubit_circuit_rejected(self):
        result = evaluate_challenge(
            "bell-state",
            bell_circuit(qubits=1, operations=[{"gate": "H", "qubit": 0, "step": 0}]),
        )
        self.assertFalse(result["passed"])
        self.assertIn("2 qubits", result["feedback"])

    def test_unsupported_gate_rejected(self):
        result = evaluate_challenge(
            "bell-state",
            bell_circuit(operations=[{"gate": "ROTATE", "qubit": 0, "step": 0}]),
        )
        self.assertFalse(result["passed"])
        self.assertIn("not supported", result["feedback"])

    def test_missing_measurement_result_fails_gracefully(self):
        result = evaluate_bell_state(bell_circuit(), {"success": True, "probabilities": {}, "counts": {}})
        self.assertFalse(result["passed"])
        self.assertEqual(result["score"], 0)
        self.assertIn("no measurement results", result["feedback"])

    def test_unknown_challenge_fails_gracefully(self):
        result = evaluate_challenge("teleportation", bell_circuit())
        self.assertFalse(result["passed"])
        self.assertEqual(result["score"], 0)
        self.assertIn("not supported", result["feedback"])

    def test_simulation_error_never_leaks_stack_trace(self):
        # Force the simulator itself to blow up and assert the student still
        # receives a structured, friendly failure instead of a traceback.
        import backend.quantum.challenge_evaluator as evaluator_mod

        original = evaluator_mod.simulate_circuit
        def exploding_sim(*args, **kwargs):
            raise RuntimeError("Traceback (most recent call last): internal boom in qiskit_aer/simulator.py")

        evaluator_mod.simulate_circuit = exploding_sim
        try:
            result = evaluate_challenge("bell-state", bell_circuit())
        finally:
            evaluator_mod.simulate_circuit = original

        self.assertFalse(result["passed"])
        self.assertEqual(result["score"], 0)
        self.assertNotIn("Traceback", result["feedback"])
        self.assertNotIn(".py", result["feedback"])
        self.assertIn("could not run", result["feedback"])


class TestChallengeApi(unittest.TestCase):
    """POST /api/challenge/evaluate contract."""

    def setUp(self):
        self.client = TestClient(app)

    def test_evaluate_correct_bell_state(self):
        resp = self.client.post("/api/challenge/evaluate", json={
            "challenge_id": "bell-state",
            "qubits": 2,
            "shots": 1024,
            "operations": BELL_OPS,
        })
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data["passed"])
        self.assertGreaterEqual(data["score"], 80)
        self.assertIn("feedback", data)
        self.assertIn("expected", data)
        self.assertIn("actual", data)
        self.assertIn("probabilities", data)

    def test_evaluate_only_h_state(self):
        resp = self.client.post("/api/challenge/evaluate", json={
            "challenge_id": "bell-state",
            "qubits": 2,
            "shots": 1024,
            "operations": [{"gate": "H", "qubit": 0, "step": 0}],
        })
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertFalse(data["passed"])
        self.assertLess(data["score"], 80)

    def test_evaluate_empty_circuit(self):
        resp = self.client.post("/api/challenge/evaluate", json={
            "challenge_id": "bell-state", "qubits": 2, "shots": 1024, "operations": [],
        })
        self.assertEqual(resp.status_code, 200)
        self.assertFalse(resp.json()["passed"])

    def test_evaluate_rejects_oversized_qubit_count(self):
        resp = self.client.post("/api/challenge/evaluate", json={
            "challenge_id": "bell-state", "qubits": 9999, "shots": 1024, "operations": [],
        })
        self.assertEqual(resp.status_code, 422)  # pydantic validation

    def test_health_route_still_available(self):
        self.assertEqual(self.client.get("/api/health").json()["status"], "ok")


if __name__ == "__main__":
    unittest.main()
