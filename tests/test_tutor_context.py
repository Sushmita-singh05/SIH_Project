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

    def test_challenge_evaluation_result_feeds_tutor(self):
        """Challenge evaluation results (score/passed/expected/actual/feedback)
        must be available to the AI Tutor for questions about a failed attempt."""
        ctx = {
            "screen": "challenge",
            "challenge": {"id": "bell-state", "title": "Bell State Generation"},
            "circuit": {"qubits": 2, "operations": [
                {"gate": "H", "qubit": 0, "step": 0}
            ]},
            "evaluationResult": {
                "passed": False,
                "score": 25,
                "expected": {"00": 0.5, "11": 0.5, "01": 0.0, "10": 0.0},
                "actual": {"00": 0.53, "11": 0.0, "01": 0.47, "10": 0.0},
                "feedback": "You applied a Hadamard gate, but q1 was never entangled.",
            },
            "score": 25,
            "passed": False,
        }
        res = asyncio.run(self.engine.answer_query("Why did my verification fail?", ctx))
        self.assertIn("Simulation Evaluation Feedback", res["reply"])
        self.assertIn("25/100", res["reply"])
        self.assertIn("q1 was never entangled", res["reply"])

    def test_challenge_includes_expected_actual_distribution(self):
        """The tutor surfaces the expected vs actual distribution when available."""
        ctx = {
            "screen": "challenge",
            "challenge": {"id": "bell-state", "title": "Bell State Generation"},
            "challengeExpected": {"00": 0.5, "11": 0.5, "01": 0.0, "10": 0.0},
            "challengeActual": {"00": 0.53, "11": 0.47},
            "passed": True,
            "score": 97,
        }
        res = asyncio.run(self.engine.answer_query("Why did I pass?", ctx))
        self.assertIn("Expected distribution", res["reply"])
        self.assertIn("Your actual (simulated) distribution", res["reply"])
        self.assertIn("✅ Passed", res["reply"])

    def test_lesson_quiz_feedback_is_grounded(self):
        """After a wrong quiz answer, the tutor gives feedback grounded in the lesson topic."""
        ctx = {
            "screen": "lesson",
            "lesson": {"id": "superposition", "title": "Superposition & The Hadamard Gate"},
            "quizState": {"isSubmitted": True, "isCorrect": False},
        }
        res = asyncio.run(self.engine.answer_query("Explain this concept", ctx))
        self.assertIn("Not quite", res["reply"])
        self.assertIn("Superposition & The Hadamard Gate", res["reply"])

    def test_circuit_builder_describes_actual_gates(self):
        """'What does my circuit do?' must reference the student's real gates and qubits."""
        ctx = {
            "screen": "circuit-builder",
            "circuit": {"qubits": 2, "operations": [
                {"gate": "H", "qubit": 0, "step": 0},
                {"gate": "CNOT", "qubit": 1, "step": 1, "control": 0, "target": 1},
            ]},
        }
        res = asyncio.run(self.engine.answer_query("What does my circuit do?", ctx))
        self.assertIn("H", res["reply"])
        self.assertIn("CNOT", res["reply"])
        self.assertIn("q0", res["reply"])
        self.assertIn("q1", res["reply"])

    def test_simulation_references_mastery_when_available(self):
        """The tutor calibrates explanation when concept mastery is present."""
        ctx = {
            "screen": "simulation-output",
            "circuit": {"qubits": 2, "operations": [
                {"gate": "H", "qubit": 0, "step": 0},
                {"gate": "CNOT", "qubit": 1, "step": 1, "control": 0, "target": 1},
            ]},
            "counts": {"00": 512, "11": 512},
            "shots": 1024,
            "progress": {"conceptMastery": {"Entanglement": 45, "Bell State": 30}},
        }
        res = asyncio.run(self.engine.answer_query("Why am I getting only 00 and 11?", ctx))
        self.assertIn("00", res["reply"])
        self.assertIn("11", res["reply"])

    def test_dashboard_uses_real_mastery(self):
        """Progress replies should surface the student's actual concept mastery."""
        ctx = {
            "screen": "progress",
            "studentProgress": {"overallMastery": 62},
            "conceptMastery": {"Entanglement": 45, "Bell State": 30, "Superposition": 85},
        }
        res = asyncio.run(self.engine.answer_query("Which topic am I weak in?", ctx))
        self.assertIn("Entanglement", res["reply"])
        self.assertIn("Bell State", res["reply"])


if __name__ == "__main__":
    unittest.main()
