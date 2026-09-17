import pytest
from backend.ai.storyboard_generator import generate_storyboard, _get_fallback_storyboard
from backend.ai.storyboard_validator import validate_storyboard
from backend.ai.tutor import AITutorEngine

class TestStoryboard:

    @pytest.mark.asyncio
    async def test_fallback_bell_state_generation(self):
        storyboard = await generate_storyboard("Bell State")
        assert storyboard is not None
        assert storyboard["topic"] == "Bell State"
        assert len(storyboard["scenes"]) >= 5
        types = [s["type"] for s in storyboard["scenes"]]
        assert "concept" in types
        assert "circuit" in types
        assert "quiz" in types
        assert "summary" in types

    @pytest.mark.asyncio
    async def test_fallback_superposition(self):
        storyboard = await generate_storyboard("Superposition")
        assert storyboard["topic"] == "Superposition"
        circuit_scenes = [s for s in storyboard["scenes"] if s["type"] == "circuit"]
        assert len(circuit_scenes) > 0
        ops = circuit_scenes[0]["circuit"]["operations"]
        assert any(op["gate"] == "H" for op in ops)

    def test_validator_accepts_valid_storyboard(self):
        sb = _get_fallback_storyboard("qubit")
        is_valid, cleaned, errors = validate_storyboard(sb)
        assert is_valid is True
        assert len(errors) == 0
        assert cleaned["title"] == sb["title"]

    def test_validator_repairs_invalid_gate(self):
        sb = {
            "title": "Test Gate Repair",
            "topic": "Test",
            "difficulty": "beginner",
            "scenes": [
                {"id": "scene-1", "title": "Concept", "type": "concept", "narration": "Intro"},
                {
                    "id": "scene-2",
                    "title": "Circuit",
                    "type": "circuit",
                    "narration": "Circuit description",
                    "circuit": {
                        "qubits": 2,
                        "operations": [
                            {"gate": "H", "qubit": 0, "step": 0},
                            {"gate": "MAGIC_QUANTUM_GATE", "qubit": 1, "step": 1},
                        ]
                    }
                },
                {
                    "id": "scene-3",
                    "title": "Quiz",
                    "type": "quiz",
                    "question": "What gate was used?",
                    "options": ["H", "X"],
                    "correctIndex": 0,
                    "explanation": "H gate"
                }
            ]
        }
        is_valid, cleaned, errors = validate_storyboard(sb)
        assert is_valid is True
        circuit_ops = cleaned["scenes"][1]["circuit"]["operations"]
        assert len(circuit_ops) == 1
        assert circuit_ops[0]["gate"] == "H"
        assert any("MAGIC_QUANTUM_GATE" in e for e in errors)

    def test_validator_repairs_unknown_scene_type(self):
        sb = {
            "title": "Test Type Repair",
            "topic": "Test",
            "difficulty": "beginner",
            "scenes": [
                {"id": "scene-1", "title": "Concept", "type": "concept", "narration": "Intro"},
                {"id": "scene-2", "title": "Unknown", "type": "hyper_dimensional_projection", "narration": "Some visual"},
                {
                    "id": "scene-3",
                    "title": "Quiz",
                    "type": "quiz",
                    "question": "Q?",
                    "options": ["A", "B"],
                    "correctIndex": 0
                }
            ]
        }
        is_valid, cleaned, errors = validate_storyboard(sb)
        assert is_valid is True
        assert cleaned["scenes"][1]["type"] == "concept"

    def test_validator_rejects_malformed_quiz(self):
        sb = {
            "title": "Bad Quiz",
            "topic": "Test",
            "difficulty": "beginner",
            "scenes": [
                {"id": "s-1", "title": "C", "type": "concept", "narration": "N"},
                {"id": "s-2", "title": "C2", "type": "concept", "narration": "N2"},
                {
                    "id": "s-3",
                    "title": "Q",
                    "type": "quiz",
                    "question": "Q?",
                    "options": ["A", "B"],
                    "correctIndex": 10
                }
            ]
        }
        is_valid, cleaned, errors = validate_storyboard(sb)
        assert any("correctIndex" in e for e in errors)

    @pytest.mark.asyncio
    async def test_all_seven_fallback_topics(self):
        topics = [
            "qubit",
            "superposition",
            "hadamard",
            "measurement",
            "entanglement",
            "bell state",
            "cnot"
        ]
        for topic in topics:
            sb = await generate_storyboard(topic)
            assert sb is not None
            assert len(sb["scenes"]) >= 5
            is_valid, _, errors = validate_storyboard(sb)
            assert is_valid is True
            assert len(errors) == 0

    @pytest.mark.asyncio
    async def test_tutor_with_video_learning_context(self):
        tutor = AITutorEngine()
        context = {
            "screen": "video-learning",
            "topic": "Bell State",
            "lessonId": "fallback-bell-state",
            "sceneTitle": "Step 3: Apply CNOT",
            "sceneType": "circuit",
            "narration": "The CNOT gate correlates qubit 1 with qubit 0.",
            "circuit": {
                "qubits": 2,
                "operations": [
                    {"gate": "H", "qubit": 0, "step": 0},
                    {"gate": "CNOT", "control": 0, "target": 1, "step": 1}
                ]
            }
        }
        res = await tutor.answer_query(
            query="Why is CNOT applied after H in the Bell State circuit?",
            context=context,
            hint_level=1
        )
        assert res is not None
        reply = res.get("reply", "")
        assert len(reply) > 50
