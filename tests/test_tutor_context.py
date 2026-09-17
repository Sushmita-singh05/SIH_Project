"""
Unit tests for context-aware AI Tutor Engine and Progressive Hint Engine.
Tests screen-specific reasoning for Simulation Output, Circuit Builder, Code Mode, Challenge, and Lessons.
"""
import unittest
import asyncio
from backend.ai.tutor import AITutorEngine
from backend.ai.hint_engine import ProgressiveHintEngine


class TestAITutorContext(unittest.TestCase):
    def setUp(self):
        self.engine = AITutorEngine()

    def test_simulation_output_bell_state_explanation(self):
        ctx = {
            "screen": "simulation-output",
            "circuit": {
                "qubits": 2,
                "operations": [
                    {"gate": "H", "qubit": 0, "step": 0},
                    {"gate": "CNOT", "control": 0, "target": 1, "step": 1}
                ]
            },
            "counts": {"00": 512, "11": 512},
            "shots": 1024,
            "backend": "Qiskit Aer Simulator",
            "bloch": [{"qubit": 0, "r": 0.0, "x": 0.0, "z": 0.0}]
        }
        res = asyncio.run(self.engine.answer_query("Why am I getting only 00 and 11?", ctx))
        self.assertIn("reply", res)
        # Should explain H creating superposition and CNOT correlating q1
        self.assertIn("Hadamard", res["reply"])
        self.assertIn("CNOT", res["reply"])
        self.assertIn("|00⟩", res["reply"])
        self.assertIn("|11⟩", res["reply"])

    def test_simulation_output_bloch_sphere_entanglement(self):
        ctx = {
            "screen": "simulation-output",
            "circuit": {"qubits": 2, "operations": [{"gate": "H", "qubit": 0}, {"gate": "CNOT", "control": 0, "target": 1}]},
            "bloch": [{"qubit": 0, "r": 0.0, "x": 0.0, "z": 0.0}],
            "statevector": [{"basis": "|00>", "prob": 0.5}, {"basis": "|11>", "prob": 0.5}]
        }
        res = asyncio.run(self.engine.answer_query("What does this Bloch Sphere mean?", ctx))
        # Should explain that r ≈ 0 is an entangled mixed subsystem at the center
        self.assertIn("center", res["reply"].lower())
        self.assertIn("mixed", res["reply"].lower())

    def test_circuit_builder_why_h_before_cnot(self):
        ctx = {
            "screen": "circuit-builder",
            "circuit": {
                "qubits": 2,
                "operations": [
                    {"gate": "H", "qubit": 0, "step": 0},
                    {"gate": "CNOT", "control": 0, "target": 1, "step": 1}
                ]
            }
        }
        res = asyncio.run(self.engine.answer_query("Why did we use H before CNOT?", ctx))
        self.assertIn("superposition", res["reply"].lower())
        self.assertIn("control", res["reply"].lower())

    def test_code_mode_cx_method(self):
        ctx = {
            "screen": "code-mode",
            "code": "qc.h(0)\nqc.cx(0, 1)",
            "circuit": {"qubits": 2, "operations": []}
        }
        res = asyncio.run(self.engine.answer_query("What does qc.cx(0, 1) do?", ctx))
        self.assertIn("Controlled-NOT", res["reply"])
        self.assertIn("target", res["reply"].lower())

    def test_challenge_hint_mode(self):
        ctx = {
            "screen": "challenge",
            "challenge": {"id": "bell-state", "title": "Bell State Generation"},
            "circuit": {"qubits": 2, "operations": []}
        }
        # Level 1 hint
        res_l1 = asyncio.run(self.engine.answer_query("I'm stuck, give me a hint", ctx, hint_level=1))
        self.assertIn("Hint 1", res_l1["reply"])
        # Should not reveal the full code solution in Hint 1
        self.assertNotIn("qc.cx(0, 1)", res_l1["reply"])

        # Level 2 hint
        res_l2 = asyncio.run(self.engine.answer_query("Give me the next hint", ctx, hint_level=1))
        self.assertIn("Hint 2", res_l2["reply"])

    def test_progressive_hint_engine(self):
        ladder = ProgressiveHintEngine.get_hint_ladder("bell-state")
        self.assertEqual(len(ladder), 3)
        self.assertTrue(ladder[0].startswith("Hint 1"))
        self.assertTrue(ladder[1].startswith("Hint 2"))
        self.assertTrue(ladder[2].startswith("Hint 3"))


if __name__ == "__main__":
    unittest.main()
