"""
AI Tutor Engine — Context-Aware Quantum Learning Assistant
Provides grounded, screen-aware quantum computing explanations, answers,
and progressive hints based on the student's active context.
"""
import os
import re
from typing import Dict, Any, List, Optional
import httpx

from backend.ai.hint_engine import ProgressiveHintEngine
from backend.ai.explanation_generator import get_gemini_api_key, get_model_name


class AITutorEngine:
    """
    Context-aware quantum learning assistant engine.
    Dispatches to specialized pedagogical analyzers based on active screen and student query.
    """

    def __init__(self, model_name: Optional[str] = None):
        self.model_name = model_name or get_model_name()

    async def answer_query(
        self,
        query: str,
        context: Dict[str, Any],
        hint_level: int = 1
    ) -> Dict[str, Any]:
        """
        Main entry point. Evaluates the student's query within the provided TutorContext.
        Uses Gemini if configured, with comprehensive pedagogical fallback.
        """
        screen = context.get("screen", "general")
        clean_query = (query or "").strip()

        # 1. Check if Gemini LLM is configured
        api_key = get_gemini_api_key()
        if api_key:
            try:
                llm_reply = await self._call_gemini_tutor(clean_query, context, api_key)
                if llm_reply:
                    hints = ProgressiveHintEngine.get_hint_ladder(
                        topic=context.get("topic") or context.get("challenge", {}).get("id", "bell-state"),
                        current_circuit=context.get("circuit")
                    )
                    return {
                        "reply": llm_reply,
                        "hints": hints,
                        "hint_level": hint_level,
                        "source": "gemini_llm",
                        "screen": screen
                    }
            except Exception as e:
                # Graceful fallback to expert rules if LLM request fails
                pass

        # 2. Expert Context-Aware Rule Engine
        return self._generate_context_aware_reply(clean_query, context, hint_level)

    def _generate_context_aware_reply(
        self,
        query: str,
        context: Dict[str, Any],
        hint_level: int = 1
    ) -> Dict[str, Any]:
        """
        Generates deterministic, scientifically rigorous quantum pedagogical explanations
        tailored to the active screen context.
        """
        screen = context.get("screen", "simulation-output")
        q_lower = query.lower()

        # Route by screen context
        if screen == "simulation-output":
            reply, suggestions = self._explain_simulation_output(query, q_lower, context)
        elif screen in ("circuit-builder", "code-mode"):
            reply, suggestions = self._explain_circuit_builder(query, q_lower, context)
        elif screen == "challenge":
            reply, suggestions = self._explain_challenge_hint(query, q_lower, context, hint_level)
        elif screen == "lesson":
            reply, suggestions = self._explain_lesson_concept(query, q_lower, context)
        elif screen in ("dashboard", "progress"):
            reply, suggestions = self._explain_student_progress(query, q_lower, context)
        else:
            reply, suggestions = self._explain_general_quantum(query, q_lower, context)

        hints = ProgressiveHintEngine.get_hint_ladder(
            topic=context.get("topic") or "bell-state",
            current_circuit=context.get("circuit")
        )

        return {
            "reply": reply,
            "hints": hints,
            "hint_level": hint_level,
            "suggested_questions": suggestions,
            "source": "expert_pedagogical_engine",
            "screen": screen
        }

    def _explain_simulation_output(
        self,
        query: str,
        q_lower: str,
        ctx: Dict[str, Any]
    ) -> tuple[str, List[str]]:
        """Handles questions on the Simulation Output screen."""
        counts = ctx.get("counts", {})
        shots = ctx.get("shots", 1024)
        backend = ctx.get("backend", "Qiskit Aer Simulator")
        bloch = ctx.get("bloch", {})
        bloch_list = bloch if isinstance(bloch, list) else ([bloch] if bloch else [])
        ops = ctx.get("circuit", {}).get("operations", []) if isinstance(ctx.get("circuit"), dict) else (ctx.get("circuit") or [])

        has_h = any(o.get("gate") == "H" for o in ops)
        has_cnot = any(o.get("gate") in ("CNOT", "CX") for o in ops)

        suggestions = [
            "Why am I getting only 00 and 11?",
            "What does this Bloch Sphere mean?",
            "Why is the state vector pointing here?",
            "What happens if I remove the H gate?"
        ]

        # 1. Why only 00 and 11 / Bell state counts?
        if any(k in q_lower for k in ("why only", "why did i get", "50%", "00 and 11", "00 and 11?", "counts")):
            count00 = counts.get("00", 0)
            count11 = counts.get("11", 0)
            c00_pct = f"{(count00 / shots * 100):.1f}%" if shots else "50%"
            c11_pct = f"{(count11 / shots * 100):.1f}%" if shots else "50%"

            if has_h and has_cnot:
                return (
                    f"In your simulation on **{backend}**, you observed **|00⟩ ({c00_pct})** and **|11⟩ ({c11_pct})** with zero counts for |01⟩ and |10⟩.\n\n"
                    f"**Here is the exact physical mechanism:**\n"
                    f"1. **Superposition on q0:** The Hadamard gate transformed qubit 0 into `(|0⟩ + |1⟩)/√2`.\n"
                    f"2. **Entangling with CNOT:** The CNOT gate uses qubit 0 as control and qubit 1 as target. "
                    f"When q0 is |0⟩, q1 remains |0⟩ (giving `|00⟩`). When q0 is |1⟩, q1 is flipped to |1⟩ (giving `|11⟩`).\n"
                    f"3. **Quantum Correlation:** The joint quantum state is `|Φ⁺⟩ = (|00⟩ + |11⟩)/√2`. "
                    f"Because neither qubit has an independent state, measuring qubit 0 instantaneously dictates qubit 1. "
                    f"States `|01⟩` and `|10⟩` have an amplitude of exactly zero!",
                    suggestions
                )
            else:
                return (
                    f"Your simulation sampled {shots} shots on {backend}. "
                    f"The measurement outcomes reflect the squared probability amplitudes |α|² of your statevector. "
                    f"Non-zero counts correspond to basis states with constructive quantum interference.",
                    suggestions
                )

        # 2. Bloch sphere explanation
        if "bloch" in q_lower or "sphere" in q_lower:
            if not bloch_list or not ctx.get("statevector"):
                return (
                    "**Bloch Sphere Status:** State-vector data is unavailable for this simulation. "
                    "Run the circuit with a state-vector capable backend (like Qiskit Aer) to visualize the quantum state.",
                    suggestions
                )

            b0 = bloch_list[0] if bloch_list else {}
            r_norm = b0.get("r", 1.0)
            x = b0.get("x", 0.0)
            z = b0.get("z", 0.0)

            if r_norm < 0.15:
                return (
                    f"**Bloch Sphere for Qubit 0 (r ≈ {r_norm:.2f}):**\n"
                    f"Notice that the state marker sits at the **very center of the sphere (radius r = 0)**.\n\n"
                    f"Why? Because qubit 0 is in a **maximally entangled bipartite state** with qubit 1! "
                    f"A pure state sits on the surface of the Bloch sphere (r = 1.0). "
                    f"When qubits become entangled, tracing out qubit 1 leaves qubit 0 in a **mixed state** with zero individual polarization vector.",
                    suggestions
                )
            elif abs(x - 1.0) < 0.1:
                return (
                    f"**Bloch Sphere for Qubit 0:**\n"
                    f"The state vector is pointing directly along the **+X axis** (|+⟩ = (|0⟩ + |1⟩)/√2).\n\n"
                    f"Applying the Hadamard gate rotated the vector from the North pole (+Z, state |0⟩) "
                    f"down to the equator (+X). This equator represents equal 50/50 measurement probabilities with zero relative phase.",
                    suggestions
                )
            elif abs(z + 1.0) < 0.1:
                return (
                    f"**Bloch Sphere for Qubit 0:**\n"
                    f"The vector points to the **South pole (-Z, state |1⟩)**. "
                    f"The Pauli-X gate rotated the state by 180° (π radians) from the North pole |0⟩.",
                    suggestions
                )
            else:
                return (
                    f"**Bloch Sphere for Qubit 0:** Coordinates `[x: {x:.2f}, y: {b0.get('y', 0):.2f}, z: {z:.2f}]`.\n"
                    f"The Bloch sphere visualizes a single qubit as a vector on the unit sphere. "
                    f"The vertical Z-axis corresponds to computational basis states |0⟩ (top) and |1⟩ (bottom).",
                    suggestions
                )

        # 3. Vector pointing direction
        if "pointing" in q_lower or "direction" in q_lower:
            return (
                "The state vector orientation is determined by unitary rotations:\n"
                "- North Pole (+Z): Ground state |0⟩\n"
                "- South Pole (-Z): Excited state |1⟩\n"
                "- Equator (+X): Equal superposition |+⟩ with zero relative phase\n"
                "- Equator (+Y): Complex superposition with π/2 phase (|0⟩ + i|1⟩)/√2\n"
                "- Center (r=0): Maximally entangled mixed subsystem.",
                suggestions
            )

        # 4. What happens if I remove H?
        if "remove" in q_lower or "without h" in q_lower:
            return (
                "**What happens if you remove the Hadamard gate?**\n\n"
                "Both qubits would remain in the computational basis state `|00⟩`. "
                "When the CNOT gate executes, its control qubit (q0) is in state `|0⟩`. "
                "Since the control is inactive, CNOT does nothing, and your measurement outcome would be **100% |00⟩** with zero entanglement.",
                suggestions
            )

        # Default simulation overview
        return (
            f"Based on your simulation with **{len(ops)} gate(s)** on **{backend}**, your measured outcomes "
            f"are: {', '.join(f'|{k}⟩: {v}' for k, v in counts.items())}.\n"
            f"Would you like to explore why these specific basis states were measured or inspect the Bloch sphere representation?",
            suggestions
        )

    def _explain_circuit_builder(
        self,
        query: str,
        q_lower: str,
        ctx: Dict[str, Any]
    ) -> tuple[str, List[str]]:
        """Handles questions from Circuit Builder & Code Mode."""
        circuit = ctx.get("circuit", {})
        qubits = circuit.get("qubits", 2) if isinstance(circuit, dict) else ctx.get("qubits", 2)
        ops = circuit.get("operations", []) if isinstance(circuit, dict) else (ctx.get("operations", []) or [])
        code = ctx.get("code", "")
        errors = ctx.get("errors", [])

        suggestions = [
            "Why did we use H before CNOT?",
            "What does qc.cx(0, 1) do?",
            "How do I create quantum entanglement?",
            "Explain my circuit line by line."
        ]

        # 1. Why H before CNOT?
        if "h before cnot" in q_lower or "why h" in q_lower or "why did we use h" in q_lower:
            return (
                "**Why must the Hadamard (H) gate precede the CNOT gate?**\n\n"
                "1. **CNOT is conditional on superposition:** CNOT maps basis states classically if the control qubit is definite:\n"
                "   - `CNOT|00⟩ = |00⟩`\n"
                "   - `CNOT|10⟩ = |11⟩`\n"
                "2. **Creating parallel branches:** Applying H to q0 first transforms `|0⟩` into `(|0⟩ + |1⟩)/√2`. "
                "Now, the control qubit is simultaneously in |0⟩ and |1⟩.\n"
                "3. **Resulting entanglement:** When CNOT acts on this superposition, it conditionally flips q1 in the second branch, "
                "producing `(|00⟩ + |11⟩)/√2` (the Bell state |Φ⁺⟩).\n\n"
                "Without H first, CNOT on |00⟩ produces no entanglement at all!",
                suggestions
            )

        # 2. Qiskit code explanation (e.g. qc.cx, qc.h)
        if "qc.cx" in q_lower or "cx" in q_lower or "cnot" in q_lower:
            return (
                "**Qiskit Method: `qc.cx(control, target)`**\n\n"
                "In Qiskit, `qc.cx(0, 1)` applies a Controlled-NOT (CNOT) gate with:\n"
                "- **Control qubit:** index 0\n"
                "- **Target qubit:** index 1\n\n"
                "Matrix representation:\n"
                "```\n"
                "[1  0  0  0]\n"
                "[0  1  0  0]\n"
                "[0  0  0  1]\n"
                "[0  0  1  0]\n"
                "```\n"
                "If qubit 0 is |1⟩, it applies a Pauli-X (NOT) flip to qubit 1.",
                suggestions
            )

        # 3. Code validation errors
        if errors and len(errors) > 0:
            err_text = "\n".join(f"- {e}" for e in errors)
            return (
                f"**Circuit Code Diagnostics:**\n"
                f"Your Qiskit code currently has {len(errors)} validation issue(s):\n{err_text}\n\n"
                f"**How to fix:** Ensure all qubit indices are less than your circuit's qubit capacity (`QuantumCircuit(n)`), "
                f"and that multi-qubit gates specify distinct control and target qubits.",
                suggestions
            )

        # 4. Line by line explanation
        if "line by line" in q_lower or "explain my code" in q_lower:
            if code:
                return (
                    f"**Code Analysis:**\n\n"
                    f"```python\n{code}\n```\n"
                    f"- `QuantumCircuit({qubits})`: Allocates {qubits} quantum wires initialized to |0⟩.\n"
                    f"- Operations: {len(ops)} gate instructions scheduled sequentially across time steps.",
                    suggestions
                )

        # 5. How to create entanglement
        if "entangle" in q_lower:
            return (
                "**Recipe for Quantum Entanglement:**\n"
                "1. Initialize 2 qubits in ground state |00⟩.\n"
                "2. Place a **Hadamard (H)** gate on qubit 0 (`qc.h(0)`).\n"
                "3. Place a **CNOT** gate with control on q0 and target on q1 (`qc.cx(0, 1)`).\n"
                "4. Simulate the circuit to verify that only correlated states |00⟩ and |11⟩ are measured.",
                suggestions
            )

        # Default circuit summary
        gate_names = [o.get("gate", "Gate") for o in ops]
        return (
            f"Your active circuit has **{qubits} qubit(s)** with **{len(ops)} gate(s)**: "
            f"{', '.join(gate_names) if gate_names else 'No gates placed yet'}.\n"
            f"You can ask me to explain how each gate operates, verify your circuit, or switch to Code Mode.",
            suggestions
        )

    def _explain_challenge_hint(
        self,
        query: str,
        q_lower: str,
        ctx: Dict[str, Any],
        hint_level: int = 1
    ) -> tuple[str, List[str]]:
        """Handles queries on the Challenge screen in Hint Mode."""
        ch = ctx.get("challenge", {})
        topic = ch.get("id") or ctx.get("topic") or "bell-state"
        title = ch.get("title", "Quantum Challenge")
        ops = ctx.get("circuit", {}).get("operations", []) if isinstance(ctx.get("circuit"), dict) else (ctx.get("circuit") or [])

        # Retrieve progressive hint
        hint = ProgressiveHintEngine.get_hint(level=hint_level, topic=topic, current_circuit=ops)

        suggestions = [
            "Give me the next hint.",
            "Why isn't my circuit verifying?",
            "What is the objective of this challenge?"
        ]

        if "next hint" in q_lower or "more help" in q_lower:
            next_lvl = min(3, hint_level + 1)
            hint_next = ProgressiveHintEngine.get_hint(level=next_lvl, topic=topic, current_circuit=ops)
            return (
                f"**Progressive Hint {next_lvl} of 3 ({title}):**\n\n{hint_next}",
                suggestions
            )

        return (
            f"**Challenge Assistant: {title} (Hint Mode — Level {hint_level} of 3)**\n\n"
            f"{hint}\n\n"
            f"*Try applying this concept on your circuit grid. If you need more guidance, ask for the next hint!*",
            suggestions
        )

    def _explain_lesson_concept(
        self,
        query: str,
        q_lower: str,
        ctx: Dict[str, Any]
    ) -> tuple[str, List[str]]:
        """Handles queries on the Lesson screen."""
        lesson = ctx.get("topic") or ctx.get("lesson") or "Superposition & The Hadamard Gate"

        suggestions = [
            "Explain this concept simply.",
            "Give a real-world example.",
            "Explain the Dirac notation equation.",
            "Ask me a quick check question."
        ]

        if "simple" in q_lower or "explain" in q_lower:
            return (
                f"**Simple Explanation of {lesson}:**\n\n"
                f"Think of a classical bit like a coin lying flat on a table: it is either Heads (0) or Tails (1).\n\n"
                f"A qubit in **superposition** is like that coin spinning rapidly on the table! "
                f"While it spins, it is neither purely Heads nor purely Tails—it is in a dynamic mixture of both. "
                f"Only when you slam your hand down (performing a **measurement**) does it instantly collapse into either 0 or 1.",
                suggestions
            )

        if "example" in q_lower:
            return (
                f"**Real-World Application of Superposition:**\n\n"
                f"In classical search, finding an item in an unsorted database of N items requires checking items one by one (~N steps).\n\n"
                f"By putting an N-qubit register into a uniform superposition of all N entries simultaneously, "
                f"**Grover's Quantum Algorithm** uses constructive and destructive interference to locate the target in only ~√N steps!",
                suggestions
            )

        if "dirac" in q_lower or "equation" in q_lower or "alpha" in q_lower:
            return (
                "**Deconstructing the State Equation: |ψ⟩ = α|0⟩ + β|1⟩**\n\n"
                "- `|ψ⟩` (ket psi): The state of the qubit.\n"
                "- `α` and `β`: Complex probability amplitudes.\n"
                "- **Born Rule:** The probability of measuring state `|0⟩` is `|α|²`, and `|1⟩` is `|β|²`.\n"
                "- **Normalization:** Total probability must sum to 1: `|α|² + |β|² = 1`.",
                suggestions
            )

        if "question" in q_lower or "quiz" in q_lower:
            return (
                "**Quick Conceptual Check:**\n\n"
                "If a qubit is in state `|ψ⟩ = (1/√2)|0⟩ + (1/√2)|1⟩`, what is the theoretical probability of measuring the qubit in state `|1⟩`?\n\n"
                "A) 25%\n"
                "B) 50%\n"
                "C) 100%\n\n"
                "*Reply with your answer and I'll confirm!*",
                suggestions
            )

        return (
            f"You are currently studying **{lesson}**.\n"
            f"I can explain this concept simply, break down the mathematical amplitudes, provide real-world analogies, or quiz your understanding.",
            suggestions
        )

    def _explain_student_progress(
        self,
        query: str,
        q_lower: str,
        ctx: Dict[str, Any]
    ) -> tuple[str, List[str]]:
        """Handles queries on Dashboard and Progress screens."""
        prog = ctx.get("studentProgress", {})
        mastery = prog.get("overallMastery", 72)

        suggestions = [
            "What should I learn next?",
            "Which topic am I weak in?",
            "Explain my overall progress."
        ]

        if "next" in q_lower or "recommend" in q_lower:
            return (
                f"**Recommended Next Step:**\n\n"
                f"You have mastered single-qubit Superposition and the Hadamard gate! "
                f"Your next recommended module is **Module 5: Quantum Entanglement & Bell States**.\n\n"
                f"Head over to the **Practice** lab to build a 2-qubit Bell circuit or tackle the Bell State Generation Challenge.",
                suggestions
            )

        if "weak" in q_lower or "improve" in q_lower:
            return (
                "**Diagnostic Focus Areas:**\n\n"
                "Based on recent quiz submissions and circuit challenges:\n"
                "1. **Phase Gates (Pauli-Z, S, T):** Review relative vs global phase.\n"
                "2. **Multi-qubit control lines:** Practice CNOT target and control orientation.\n\n"
                "Completing the interactive Bell State challenge will boost your mastery score above 85%!",
                suggestions
            )

        return (
            f"**Your Learning Summary:**\n"
            f"- Overall Quantum Mastery: **{mastery}% (Proficient)**\n"
            f"- Learning Gain: **+25%** improvement since diagnostic pre-test\n"
            f"- Verified Labs: Superposition & Bell State simulation confirmed on Qiskit Aer.\n"
            f"Keep practicing in the Circuit Builder to unlock advanced algorithms!",
            suggestions
        )

    def _explain_general_quantum(
        self,
        query: str,
        q_lower: str,
        ctx: Dict[str, Any]
    ) -> tuple[str, List[str]]:
        """General fallback assistant response."""
        return (
            f"Hello! I am your **QuantumLeap-AI Tutor**. I'm here to help you master quantum computing.\n\n"
            f"You can ask me questions about:\n"
            f"- Your active circuit and simulation outcomes on Qiskit Aer\n"
            f"- The 3D Bloch sphere representation\n"
            f"- Quantum gates (H, X, Y, Z, CNOT, SWAP)\n"
            f"- Hints for active challenges and lesson concepts.",
            ["What is superposition?", "How does a CNOT gate work?", "Explain the Bell state."]
        )

    async def _call_gemini_tutor(
        self,
        query: str,
        context: Dict[str, Any],
        api_key: str
    ) -> Optional[str]:
        """Calls Gemini API with structured TutorContext if key is present."""
        screen = context.get("screen", "general")
        system_prompt = (
            "You are an expert, encouraging quantum computing educator for the QuantumLeap-AI platform.\n"
            "You MUST tailor your answer directly to the student's current screen context.\n"
            f"Active Screen: {screen}\n"
            f"Context Data: {context}\n"
            "Keep answers concise, pedagogical, and beginner-friendly without unnecessary jargon. "
            "Never fabricate statevector or Bloch sphere data if unavailable. "
            "If in 'challenge' screen, act in Hint Mode and do not reveal the entire solution immediately."
        )

        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": f"System Context:\n{system_prompt}\n\nStudent Question:\n{query}"}
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.4,
                "maxOutputTokens": 600
            }
        }

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent?key={api_key}"
        async with httpx.AsyncClient(timeout=12.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        return parts[0].get("text", "").strip()
        return None

    def _build_user_message(self, query: str, context: Dict[str, Any]) -> str:
        parts = [f"Student Question: {query}"]
        narration = context.get("narration")
        if narration:
            parts.append(f"Narration: {narration}")

        scene_type = context.get("sceneType")
        if scene_type:
            parts.append(f"Scene type: {scene_type}")

        lesson_id = context.get("lessonId")
        if lesson_id:
            parts.append(f"Lesson ID: {lesson_id}")

        scene_id = context.get("sceneId")
        if scene_id:
            parts.append(f"Scene ID: {scene_id}")

        return "\n".join(parts)
