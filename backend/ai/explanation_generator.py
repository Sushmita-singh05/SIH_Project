"""
AI Explanation Generator Service
Handles AI concept analysis and structured quantum scene plan generation.
"""
import os
import json
import re
from typing import Dict, Any, List, Optional
import httpx
import yaml

VALID_VISUAL_TYPES = {
    "concept",
    "qubit",
    "superposition",
    "gate",
    "circuit",
    "measurement",
    "histogram",
    "bloch_sphere",
    "comparison",
    "text"
}

class AIProviderNotConfiguredError(Exception):
    """Raised when no external AI provider API key is configured."""
    pass

class AIResponseParsingError(Exception):
    """Raised when the AI response cannot be parsed or does not conform to schema."""
    pass

def load_config() -> dict:
    config_path = os.path.join(os.path.dirname(__file__), "..", "..", "config", "config.yaml")
    if os.path.exists(config_path):
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                return yaml.safe_load(f) or {}
        except Exception:
            return {}
    return {}

def get_gemini_api_key() -> Optional[str]:
    return (
        os.getenv("GEMINI_API_KEY")
        or os.getenv("GOOGLE_API_KEY")
        or os.getenv("GEMINI_KEY")
    )

def get_model_name() -> str:
    cfg = load_config()
    return cfg.get("ai_tutor", {}).get("model", "gemini-1.5-flash")

SYSTEM_INSTRUCTIONS = """
You are an expert quantum computing educator for the QuantumLeap-AI platform.
Analyze the user's quantum computing topic, question, or notes, and generate a comprehensive, beginner-friendly, structured scene-by-scene explanation plan.

CRITICAL QUANTUM EDUCATION INSTRUCTIONS:
1. Identify important quantum concepts (superposition, entanglement, phase, interference, measurement).
2. Explain concepts in clear, beginner-friendly pedagogical language without unnecessary mathematical jargon, while remaining scientifically precise.
3. Break the explanation into 3 to 6 logical sequential scenes.
4. Identify relevant quantum gates (H, X, Y, Z, CNOT, S, T, etc.) when appropriate.
5. Identify quantum circuits when appropriate (e.g., for Bell state: H gate on q0 followed by CNOT with q0 as control and q1 as target).
6. Assign the best visual_type for each scene from this allowed list:
   - "concept"
   - "qubit"
   - "superposition"
   - "gate"
   - "circuit"
   - "measurement"
   - "histogram"
   - "bloch_sphere"
   - "comparison"
   - "text"
7. Connect concepts to simulation where appropriate (e.g. statevector, measurement probability distribution).

OUTPUT FORMAT:
You must output strictly valid JSON matching this schema:
{
    "topic": "Clean canonical topic title (e.g. 'Quantum Superposition')",
    "difficulty": "beginner" | "intermediate" | "advanced",
    "learning_objective": "1-2 sentence core objective describing what the student will understand.",
    "scenes": [
        {
            "scene_number": 1,
            "title": "Scene title",
            "explanation": "Clear, engaging explanation paragraph for this scene.",
            "visual_type": "one of the allowed visual_type strings",
            "circuit": null or string or { "qubits": 2, "operations": [{"gate": "H", "qubit": 0}] },
            "key_concept": "Short key concept or theorem highlighted in this scene"
        }
    ]
}
"""

def clean_json_response(raw_text: str) -> str:
    cleaned = raw_text.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    return cleaned.strip()

def validate_scene_data(data: Dict[str, Any]) -> Dict[str, Any]:
    if not isinstance(data, dict):
        raise AIResponseParsingError("Generated explanation is not a JSON object")

    topic = str(data.get("topic", "")).strip() or "Quantum Computing Concept"
    difficulty = str(data.get("difficulty", "beginner")).lower().strip()
    if difficulty not in ("beginner", "intermediate", "advanced"):
        difficulty = "beginner"
    learning_objective = str(data.get("learning_objective", "")).strip() or "Understand key quantum principles."

    scenes_raw = data.get("scenes")
    if not isinstance(scenes_raw, list) or len(scenes_raw) == 0:
        raise AIResponseParsingError("Generated explanation contains no scenes")

    validated_scenes = []
    for idx, s in enumerate(scenes_raw, start=1):
        if not isinstance(s, dict):
            continue
        v_type = str(s.get("visual_type", "concept")).lower().strip()
        if v_type not in VALID_VISUAL_TYPES:
            v_type = "concept"

        validated_scenes.append({
            "scene_number": int(s.get("scene_number", idx)),
            "title": str(s.get("title", f"Scene {idx}")).strip(),
            "explanation": str(s.get("explanation", "")).strip(),
            "visual_type": v_type,
            "circuit": s.get("circuit", None),
            "key_concept": str(s.get("key_concept", "")).strip()
        })

    if not validated_scenes:
        raise AIResponseParsingError("No valid scenes could be parsed from AI response")

    return {
        "success": True,
        "topic": topic,
        "difficulty": difficulty,
        "learning_objective": learning_objective,
        "scenes": validated_scenes
    }

async def generate_explanation(text: str) -> Dict[str, Any]:
    """
    Generates a structured quantum visual explanation plan for the given user text.
    Uses configured Gemini API, or checks for development fallback if enabled.
    Raises AIProviderNotConfiguredError if no AI provider is configured.
    """
    api_key = get_gemini_api_key()

    # Check for developer mock mode if explicitly enabled in environment
    if not api_key:
        allow_dev_mock = os.getenv("ALLOW_DEV_AI_MOCK", "").lower() in ("true", "1", "yes")
        if allow_dev_mock:
            return _generate_development_mock(text)

        raise AIProviderNotConfiguredError(
            "AI provider is not configured. Please set the GEMINI_API_KEY (or GOOGLE_API_KEY) "
            "environment variable to enable live AI explanation generation."
        )

    model = get_model_name()
    # Normalize model name for Google API if needed
    if model.startswith("models/"):
        model = model.replace("models/", "")
    if model == "gemini-1.5-pro":
        # gemini-1.5-flash is faster & highly capable for structured educational JSON
        api_model = "gemini-1.5-flash"
    else:
        api_model = model

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{api_model}:generateContent?key={api_key}"

    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [
                    {
                        "text": f"{SYSTEM_INSTRUCTIONS}\n\nUSER TOPIC / NOTES TO EXPLAIN:\n{text.strip()}"
                    }
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "responseMimeType": "application/json"
        }
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(url, json=payload)
        except httpx.RequestError as exc:
            raise AIResponseParsingError(f"Network error connecting to AI provider: {str(exc)}")

    if response.status_code != 200:
        error_detail = response.text
        try:
            err_json = response.json()
            if "error" in err_json and "message" in err_json["error"]:
                error_detail = err_json["error"]["message"]
        except Exception:
            pass
        raise AIResponseParsingError(f"AI provider returned error ({response.status_code}): {error_detail}")

    resp_data = response.json()
    candidates = resp_data.get("candidates", [])
    if not candidates:
        raise AIResponseParsingError("AI provider returned no candidates")

    raw_text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
    if not raw_text:
        raise AIResponseParsingError("AI provider returned empty content")

    cleaned_json = clean_json_response(raw_text)
    try:
        parsed_json = json.loads(cleaned_json)
    except json.JSONDecodeError as exc:
        raise AIResponseParsingError(f"Failed to decode AI response JSON: {str(exc)}")

    return validate_scene_data(parsed_json)


def _generate_development_mock(text: str) -> Dict[str, Any]:
    """
    Optional development engine used only when ALLOW_DEV_AI_MOCK=true is explicitly set.
    """
    lower = text.lower()
    is_bell = "bell" in lower or "entangle" in lower or "cnot" in lower
    is_superposition = "superposition" in lower or "hadamard" in lower or "h gate" in lower

    if is_bell:
        topic = "Bell State Entanglement"
        difficulty = "intermediate"
        objective = "Understand how Hadamard and CNOT gates create a maximally entangled two-qubit Bell pair."
        scenes = [
            {
                "scene_number": 1,
                "title": "What is Quantum Entanglement?",
                "explanation": "Quantum entanglement is a physical phenomenon where two or more particles become correlated such that the quantum state of each particle cannot be described independently of the others.",
                "visual_type": "concept",
                "circuit": None,
                "key_concept": "Non-local quantum correlation"
            },
            {
                "scene_number": 2,
                "title": "Superposition on Qubit 0",
                "explanation": "Both qubits start in the ground state |00⟩. Applying a Hadamard gate to qubit 0 transforms it into equal superposition (|0⟩ + |1⟩)/√2.",
                "visual_type": "bloch_sphere",
                "circuit": None,
                "key_concept": "Hadamard rotation onto equatorial plane"
            },
            {
                "scene_number": 3,
                "title": "Entangling with CNOT Gate",
                "explanation": "Next, a CNOT gate is applied with qubit 0 as control and qubit 1 as target. When qubit 0 is |1⟩, it flips qubit 1 to |1⟩, creating the Bell state |Φ⁺⟩ = (|00⟩ + |11⟩)/√2.",
                "visual_type": "circuit",
                "circuit": {
                    "qubits": 2,
                    "operations": [
                        {"gate": "H", "qubit": 0},
                        {"gate": "CNOT", "control": 0, "target": 1}
                    ]
                },
                "key_concept": "Controlled-NOT conditional entanglement"
            },
            {
                "scene_number": 4,
                "title": "Measurement & Correlated Collapse",
                "explanation": "Measuring either qubit immediately forces both qubits into matching outcomes: 50% probability of |00⟩ and 50% probability of |11⟩. The states |01⟩ and |10⟩ never occur.",
                "visual_type": "histogram",
                "circuit": None,
                "key_concept": "50/50 Correlated Basis Collapse"
            }
        ]
    elif is_superposition:
        topic = "Quantum Superposition"
        difficulty = "beginner"
        objective = "Understand how a quantum bit exists in linear combinations of |0⟩ and |1⟩ until measured."
        scenes = [
            {
                "scene_number": 1,
                "title": "Classical Bits vs Quantum Qubits",
                "explanation": "Unlike a classical bit that is deterministically 0 or 1, a qubit can exist in a continuum of states described by probability amplitudes alpha and beta.",
                "visual_type": "qubit",
                "circuit": None,
                "key_concept": "Statevector |ψ⟩ = α|0⟩ + β|1⟩"
            },
            {
                "scene_number": 2,
                "title": "The Hadamard Gate Transformation",
                "explanation": "Applying the Hadamard (H) gate to the ground state |0⟩ rotates the qubit vector into an equal superposition: |+⟩ = (|0⟩ + |1⟩)/√2.",
                "visual_type": "bloch_sphere",
                "circuit": {
                    "qubits": 1,
                    "operations": [{"gate": "H", "qubit": 0}]
                },
                "key_concept": "Equatorial superposition (|0⟩ + |1⟩)/√2"
            },
            {
                "scene_number": 3,
                "title": "Born Rule & Measurement",
                "explanation": "When observed, the superposition collapses according to the Born Rule, yielding outcome '0' with 50% probability and '1' with 50% probability.",
                "visual_type": "measurement",
                "circuit": None,
                "key_concept": "Probability P = |amplitude|²"
            }
        ]
    else:
        topic = text.strip()[:40].title()
        difficulty = "beginner"
        objective = f"Explore foundational quantum computing principles regarding {topic}."
        scenes = [
            {
                "scene_number": 1,
                "title": f"Introduction to {topic}",
                "explanation": f"This introductory scene outlines the core physical laws and quantum mechanisms underlying {topic}.",
                "visual_type": "concept",
                "circuit": None,
                "key_concept": f"Foundational Principles of {topic}"
            },
            {
                "scene_number": 2,
                "title": "State Preparation & Transformations",
                "explanation": "Qubits are initialized and manipulated using unitary quantum gates to create the necessary phase relations.",
                "visual_type": "superposition",
                "circuit": None,
                "key_concept": "Unitary Quantum Evolution"
            },
            {
                "scene_number": 3,
                "title": "Quantum Circuit Implementation",
                "explanation": "A sequential series of quantum logic gates operates on the qubit register to execute the desired transformation.",
                "visual_type": "circuit",
                "circuit": {
                    "qubits": 2,
                    "operations": [{"gate": "H", "qubit": 0}]
                },
                "key_concept": "Quantum Circuit Execution"
            },
            {
                "scene_number": 4,
                "title": "Experimental Observation",
                "explanation": "Measurement projects the quantum state into classical readout statistics to observe experimental outcomes.",
                "visual_type": "histogram",
                "circuit": None,
                "key_concept": "Measurement Statistics"
            }
        ]

    return {
        "success": True,
        "topic": topic,
        "difficulty": difficulty,
        "learning_objective": objective,
        "scenes": scenes
    }
