"""
Quantum Challenge Evaluator
Evaluates student quantum circuits against challenge benchmarks using Qiskit Aer simulation.

The evaluator is challenge-agnostic at the entry point (`evaluate_challenge`) and
delegates to per-challenge functions (e.g. `evaluate_bell_state`). It never leaks
raw Python/Qiskit stack traces to the student: invalid circuits and simulator
failures are converted into structured, human-readable failure results.
"""
from typing import Dict, Any, Optional, List
import logging
import math

from backend.quantum.simulator import simulate_circuit

logger = logging.getLogger("quantumleap.challenge")

DEFAULT_SHOTS = 1024

# Gates the Qiskit circuit parser (backend/quantum/circuit_parser.py) understands.
SUPPORTED_GATES = {
    "H", "X", "Y", "Z", "S", "T",
    "CNOT", "CX", "CZ", "SWAP",
    "TOFFOLI", "CCX",
    "M", "MEASURE", "RESET",
}


def _empty_result(challenge_id: str, feedback: str, shots: int, diagnostics: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Structured failure result used for empty/invalid circuits and simulator errors."""
    return {
        "challenge_id": challenge_id,
        "passed": False,
        "score": 0,
        "status": "failed",
        "fidelity": "0.0%",
        "expected": {"00": 0.5, "11": 0.5, "01": 0.0, "10": 0.0},
        "actual": {"00": 0.0, "11": 0.0, "01": 0.0, "10": 0.0},
        "probabilities": {},
        "counts": {},
        "shots": shots,
        "feedback": feedback,
        "diagnostics": diagnostics or {},
        "executionTimeMs": 0,
    }


def _validate_circuit(circuit_data: Dict[str, Any], min_qubits: int = 2) -> Optional[str]:
    """
    Structural validation of the submitted circuit.
    Returns a student-friendly error string, or None when the circuit is valid.
    """
    try:
        num_qubits = int(circuit_data.get("qubits", 2))
    except (TypeError, ValueError):
        return "The submitted circuit has an invalid qubit count."

    if num_qubits < min_qubits:
        return (
            f"The Bell State challenge requires at least {min_qubits} qubits to entangle, "
            f"but the circuit only defines {num_qubit_label(num_qubits)}."
        )

    operations = circuit_data.get("operations", [])
    if not isinstance(operations, list):
        return "The submitted circuit is malformed. Please rebuild your circuit and try again."

    for idx, op in enumerate(operations):
        if not isinstance(op, dict):
            return "The submitted circuit is malformed. Please rebuild your circuit and try again."

        step = op.get("step", idx)
        gate = str(op.get("gate", "")).strip().upper()
        if not gate:
            return f"Gate at step {step} is missing a name. Remove it and try again."
        if gate not in SUPPORTED_GATES:
            return (
                f"Gate {gate} at step {step} is not supported by the challenge simulator. "
                f"Supported gates: H, X, Y, Z, S, T, CNOT, CZ, SWAP, TOFFOLI, MEASURE, RESET."
            )

        indexes: List[Any] = [("qubit", op.get("qubit", 0))]
        for key in ("control", "target", "control1", "control2"):
            if op.get(key) is not None:
                indexes.append((key, op[key]))

        for key, raw in indexes:
            try:
                q = int(raw)
            except (TypeError, ValueError):
                return (
                    f"Gate {gate} at step {step} has an invalid {key} index "
                    f"({raw!r}). Qubit indices must be whole numbers."
                )
            if q < 0 or q >= num_qubits:
                return (
                    f"Gate {gate} at step {step} targets {key} {q}, but this circuit only has "
                    f"{num_qubit_label(num_qubits)} (valid indices: 0–{num_qubits - 1})."
                )

        control = op.get("control")
        target = op.get("target")
        if gate in ("CNOT", "CX", "CZ", "SWAP") and control is not None and target is not None:
            if int(control) == int(target):
                return (
                    f"Gate {gate} at step {step} uses qubit {control} as both control and target. "
                    "A two-qubit gate needs two different qubits."
                )

    return None


def num_qubit_label(n: int) -> str:
    return "1 qubit" if n == 1 else f"{n} qubits"


def evaluate_bell_state(
    circuit_data: Dict[str, Any],
    simulation_result: Dict[str, Any],
    shots: int = 1024
) -> Dict[str, Any]:
    """
    Evaluates Bell State Generation challenge (|Phi+> = (|00> + |11>)/sqrt(2)).

    Benchmarks (measured from the actual Qiskit simulation, 1024 shots):
    - Ideal target distribution: |00> ~ 50%, |11> ~ 50%
    - Unwanted leakage states:   |01> ~ 0%,  |10> ~ 0%
    - Tolerance: each target state within +/- 0.10 (40%–60%) and total
      leakage <= 0.10. Measurements are probabilistic, so exact 50/50 is
      NOT required — 49/51 or 52/48 both pass, while 90/10 does not.
    """
    probabilities: Dict[str, float] = simulation_result.get("probabilities") or {}
    counts: Dict[str, int] = simulation_result.get("counts") or {}
    operations = circuit_data.get("operations", []) or []

    # Check for empty operations
    if not operations:
        return _empty_result(
            "bell-state",
            "Your circuit is currently empty. To synthesize the Bell state |Φ⁺⟩, "
            "place a Hadamard (H) gate on q0 to initialize superposition, "
            "then add a CNOT gate with q0 as control and q1 as target to entangle the qubits.",
            shots,
            {"has_h_gate": False, "has_cnot": False, "target_sum": 0.0, "leakage": 0.0, "tolerance": "+/- 10%"},
        )

    # Guard against missing measurement data from the simulator
    if not probabilities:
        return _empty_result(
            "bell-state",
            "The simulation completed but returned no measurement results. "
            "Make sure your circuit is valid and try submitting again.",
            shots,
            {"missing_measurement_result": True},
        )

    # Qiskit measurement keys are binary strings like '00', '01', etc.
    p_00 = float(probabilities.get("00", 0.0))
    p_11 = float(probabilities.get("11", 0.0))
    p_01 = float(probabilities.get("01", 0.0))
    p_10 = float(probabilities.get("10", 0.0))

    target_sum = p_00 + p_11
    leakage = p_01 + p_10

    # Tolerance parameters (documented benchmark, see docstring)
    TOLERANCE_MIN = 0.40
    TOLERANCE_MAX = 0.60
    MAX_LEAKAGE = 0.10

    # Check conditions
    has_target_distribution = (
        TOLERANCE_MIN <= p_00 <= TOLERANCE_MAX and
        TOLERANCE_MIN <= p_11 <= TOLERANCE_MAX and
        leakage <= MAX_LEAKAGE
    )

    # Classical overlap / fidelity scoring:
    #   score = 100 * P(target subspace) * balance_factor
    # balance_factor penalizes deviation from the ideal 0.5/0.5 split.
    balance_deviation = abs(p_00 - 0.5) + abs(p_11 - 0.5)
    balance_factor = max(0.0, 1.0 - balance_deviation)

    raw_score = 100.0 * target_sum * balance_factor
    score = int(round(max(0.0, min(100.0, raw_score))))

    passed = has_target_distribution and score >= 80

    # Bhattacharyya fidelity against ideal Bell distribution {00: 0.5, 11: 0.5}
    fidelity_val = math.sqrt(p_00 * 0.5) + math.sqrt(p_11 * 0.5)
    fidelity_pct = min(100.0, round(fidelity_val * 100.0, 1))

    # Pedagogical feedback generation (based on actual simulation results)
    has_h = any(str(op.get("gate", "")).upper() == "H" for op in operations)
    has_cnot = any(str(op.get("gate", "")).upper() in ("CNOT", "CX") for op in operations)

    # Dominant unwanted state, reported in Qiskit's measured bit order
    leak_key, leak_p = ("01", p_01) if p_01 >= p_10 else ("10", p_10)

    if passed:
        feedback = (
            f"Excellent! Your circuit successfully generated the Bell State |Φ⁺⟩ "
            f"(state fidelity {fidelity_pct}%). Your measurements are approximately:\n"
            f"|00⟩ → {p_00 * 100:.1f}%\n"
            f"|11⟩ → {p_11 * 100:.1f}%\n\n"
            "This matches the expected entangled-state distribution (~50% / ~50%)."
        )
    elif has_h and not has_cnot:
        feedback = (
            f"Your circuit does not currently produce the expected Bell State.\n\n"
            f"Expected:\n|00⟩ ≈ 50%\n|11⟩ ≈ 50%\n\n"
            f"Your result:\n|00⟩ ≈ {p_00 * 100:.1f}%\n|{leak_key}⟩ ≈ {leak_p * 100:.1f}%\n\n"
            "You applied a Hadamard gate, but q1 was never entangled. "
            "Add a CNOT gate with q0 as the control and q1 as the target after the H gate."
        )
    elif not has_h and has_cnot:
        feedback = (
            f"Your circuit does not currently produce the expected Bell State.\n\n"
            f"Expected:\n|00⟩ ≈ 50%\n|11⟩ ≈ 50%\n\n"
            f"Your result:\n|00⟩ ≈ {p_00 * 100:.1f}%\n|11⟩ ≈ {p_11 * 100:.1f}%\n\n"
            "A CNOT gate alone cannot create entanglement: q0 is still in |0⟩, so nothing changes. "
            "Apply a Hadamard (H) gate on q0 *before* the CNOT to create superposition first."
        )
    elif leakage > 0.25:
        feedback = (
            f"Your circuit does not currently produce the expected Bell State.\n\n"
            f"Expected:\n|00⟩ ≈ 50%\n|11⟩ ≈ 50%\n\n"
            f"Your result:\n|00⟩ ≈ {p_00 * 100:.1f}%\n|11⟩ ≈ {p_11 * 100:.1f}%\n"
            f"|01⟩ ≈ {p_01 * 100:.1f}%\n|10⟩ ≈ {p_10 * 100:.1f}%\n\n"
            "Probability is leaking into unwanted states. Check whether your Hadamard and CNOT "
            "operations are placed correctly — H must act on q0 and CNOT must use q0 as control, q1 as target."
        )
    else:
        feedback = (
            f"Your circuit does not currently produce the expected Bell State.\n\n"
            f"Expected:\n|00⟩ ≈ 50%\n|11⟩ ≈ 50%\n\n"
            f"Your result:\n|00⟩ ≈ {p_00 * 100:.1f}%\n|11⟩ ≈ {p_11 * 100:.1f}%\n"
            f"|01⟩ ≈ {p_01 * 100:.1f}%\n|10⟩ ≈ {p_10 * 100:.1f}%\n\n"
            f"Your circuit scored {score}/100. Check whether your Hadamard and CNOT operations "
            "are placed correctly: H on q0 first, then CNOT with q0 as control and q1 as target."
        )

    return {
        "challenge_id": "bell-state",
        "passed": passed,
        "score": score,
        "status": "passed" if passed else "failed",
        "fidelity": f"{fidelity_pct}%",
        "expected": {
            "00": 0.5,
            "11": 0.5,
            "01": 0.0,
            "10": 0.0
        },
        "actual": {
            "00": round(p_00, 3),
            "11": round(p_11, 3),
            "01": round(p_01, 3),
            "10": round(p_10, 3)
        },
        "probabilities": probabilities,
        "counts": counts,
        "shots": shots,
        "feedback": feedback,
        "diagnostics": {
            "has_h_gate": has_h,
            "has_cnot": has_cnot,
            "target_sum": round(target_sum, 3),
            "leakage": round(leakage, 3),
            "tolerance": "+/- 10%"
        },
        "executionTimeMs": simulation_result.get("executionTimeMs", 0)
    }


# challenge_id aliases accepted by the API
_CHALLENGE_ALIASES = {
    "bell-state": "bell-state",
    "bell_state": "bell-state",
    "bell": "bell-state",
}


def evaluate_challenge(
    challenge_id: str,
    circuit_data: Dict[str, Any],
    simulation_result: Optional[Dict[str, Any]] = None,
    shots: int = DEFAULT_SHOTS
) -> Dict[str, Any]:
    """
    Main challenge evaluation dispatcher.

    1. Normalizes the challenge id (friendly failure for unknown challenges).
    2. Validates the submitted circuit structurally (friendly failure for
       empty/invalid circuits — never a raw traceback).
    3. Runs the existing Qiskit Aer simulation when no simulation_result is
       supplied (reuses backend.quantum.simulator.simulate_circuit).
    4. Dispatches to the per-challenge evaluator for scoring and feedback.
    """
    norm_id = str(challenge_id or "bell-state").strip().lower()
    canonical = _CHALLENGE_ALIASES.get(norm_id)
    if canonical is None:
        return _empty_result(
            norm_id or "unknown",
            f"The challenge '{challenge_id}' is not supported yet. "
            "Please attempt an available challenge (for example: Bell State Generation).",
            shots,
            {"unsupported_challenge": True},
        )

    validation_error = _validate_circuit(circuit_data, min_qubits=2)
    if validation_error:
        return _empty_result(
            canonical,
            validation_error,
            shots,
            {"invalid_circuit": True},
        )

    if simulation_result is None:
        try:
            simulation_result = simulate_circuit(circuit_data, shots=shots, backend="qiskit-aer")
        except Exception as exc:  # noqa: BLE001 — students must never see a stack trace
            logger.exception("Challenge simulation failed for %s", canonical)
            return _empty_result(
                canonical,
                "The quantum simulator could not run this circuit. "
                "Please check that your gates and qubit indices are valid, then try again.",
                shots,
                {"simulation_error": True, "detail": str(exc)[:300]},
            )

    return evaluate_bell_state(circuit_data, simulation_result, shots=shots)
