"""
Progressive Hint Engine Ladder
Generates multi-tier pedagogical hint ladders that scaffold learning without immediately
revealing the full solution.
Level 1: Conceptual orientation
Level 2: Transformation & intermediate clue
Level 3: Concrete structural solution
"""
from typing import List, Dict, Any, Optional


class ProgressiveHintEngine:
    """
    Provides progressive pedagogical hints tailored to the student's active challenge,
    current circuit configuration, and error state.
    """

    CHALLENGE_LADDERS = {
        "bell-state": [
            "Hint 1 (Concept): A Bell state requires maximal quantum entanglement. To entangle two qubits, one qubit must first be in a superposition before interacting with the second qubit.",
            "Hint 2 (Transformation): Apply a single-qubit gate to qubit 0 that creates an equal superposition of |0⟩ and |1⟩. Then apply a two-qubit controlled gate where qubit 0 controls qubit 1.",
            "Hint 3 (Solution): Place a Hadamard (H) gate on q0, followed by a CNOT gate with q0 as the control and q1 as the target. This maps |00⟩ into (|00⟩ + |11⟩)/√2."
        ],
        "superposition": [
            "Hint 1 (Concept): Superposition allows a qubit to exist in a linear combination of basis states |0⟩ and |1⟩ simultaneously.",
            "Hint 2 (Transformation): You need a unitary gate that rotates the basis state |0⟩ on the Z-axis onto the equator of the Bloch sphere (+X axis).",
            "Hint 3 (Solution): Place a Hadamard (H) gate on the qubit wire. H maps |0⟩ to |+⟩ = (|0⟩ + |1⟩)/√2, giving a 50/50 measurement probability."
        ],
        "bit-flip": [
            "Hint 1 (Concept): A quantum bit-flip performs the quantum equivalent of a classical NOT gate.",
            "Hint 2 (Transformation): Look for a Pauli operator that rotates the state vector by 180 degrees (π radians) around the X-axis.",
            "Hint 3 (Solution): Use the Pauli-X gate. X|0⟩ = |1⟩ and X|1⟩ = |0⟩ with 100% deterministic probability."
        ],
        "phase-flip": [
            "Hint 1 (Concept): A phase-flip changes the relative sign between |0⟩ and |1⟩ without altering computational basis probabilities.",
            "Hint 2 (Transformation): In Dirac notation, you want to transform (|0⟩ + |1⟩)/√2 into (|0⟩ - |1⟩)/√2. Which Pauli gate leaves |0⟩ unchanged but applies -1 to |1⟩?",
            "Hint 3 (Solution): Use the Pauli-Z gate. Z leaves |0⟩ unchanged and maps |1⟩ to -|1⟩, rotating the Bloch vector to -X (|−⟩)."
        ]
    }

    @classmethod
    def get_hint_ladder(
        cls,
        topic: str = "bell-state",
        current_circuit: Optional[List[Dict[str, Any]]] = None,
        target_concept: Optional[str] = None
    ) -> List[str]:
        """
        Returns a 3-step progressive hint ladder customized to the student's circuit progress.
        """
        normalized_topic = str(topic or "bell-state").lower().replace(" ", "-")

        # Match known challenge topic or look for keywords
        matched_key = None
        for key in cls.CHALLENGE_LADDERS:
            if key in normalized_topic:
                matched_key = key
                break

        if not matched_key:
            matched_key = "bell-state"

        base_hints = cls.CHALLENGE_LADDERS[matched_key].copy()

        # Dynamic circuit inspection refinement
        if current_circuit is not None:
            ops = current_circuit if isinstance(current_circuit, list) else current_circuit.get("operations", [])
            has_h = any(o.get("gate") == "H" for o in ops)
            has_cnot = any(o.get("gate") in ("CNOT", "CX") for o in ops)

            if matched_key == "bell-state":
                if not has_h and not has_cnot:
                    base_hints[0] = "Hint 1 (Concept): Start by placing an H gate on qubit 0 to create the superposition needed before entangling."
                elif has_h and not has_cnot:
                    base_hints[0] = "Hint 1 (Progress): Good! You have the Hadamard gate on q0. Now, how do you correlate q1 with q0?"
                    base_hints[1] = "Hint 2 (Next Gate): Place a CNOT gate with q0 as the control and q1 as the target."
                elif not has_h and has_cnot:
                    base_hints[0] = "Hint 1 (Correction): You placed a CNOT, but without superposition on the control qubit, CNOT|00⟩ just remains |00⟩. Place an H gate on q0 first."

        return base_hints

    @classmethod
    def get_hint(
        cls,
        level: int = 1,
        topic: str = "bell-state",
        current_circuit: Optional[List[Dict[str, Any]]] = None
    ) -> str:
        """
        Returns the specific hint string corresponding to the requested difficulty level (1-3).
        """
        ladder = cls.get_hint_ladder(topic=topic, current_circuit=current_circuit)
        idx = max(0, min(len(ladder) - 1, int(level or 1) - 1))
        return ladder[idx]
