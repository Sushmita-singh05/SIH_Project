"""
QuantumLeap-AI Circuit Parser
Converts frontend JSON representations into Qiskit QuantumCircuit instances.
"""
from typing import Dict, Any
from qiskit import QuantumCircuit


def parse_circuit(circuit_data: Dict[str, Any]) -> QuantumCircuit:
    """
    Parses circuit specification dictionary from frontend/API into a Qiskit QuantumCircuit.
    
    Supported gates/operations:
    - H (Hadamard)
    - X (Pauli-X / NOT)
    - Y (Pauli-Y)
    - Z (Pauli-Z)
    - S (Phase gate)
    - T (T gate)
    - CNOT / CX (Controlled-NOT)
    - CZ (Controlled-Z)
    - SWAP (Swap gate)
    - Toffoli / CCX (Controlled-Controlled-NOT)
    - Measure
    - Reset
    """
    num_qubits = circuit_data.get("qubits", 2)
    if num_qubits < 1:
        num_qubits = 1

    qc = QuantumCircuit(num_qubits)
    operations = circuit_data.get("operations", [])

    # Sort operations by step if step is provided
    sorted_ops = sorted(operations, key=lambda op: op.get("step", 0))

    for op in sorted_ops:
        gate = str(op.get("gate", "")).strip().upper()
        q = int(op.get("qubit", 0))
        control = op.get("control")
        target = op.get("target")

        # Single-qubit gates
        if gate == "H":
            qc.h(q)
        elif gate == "X":
            qc.x(q)
        elif gate == "Y":
            qc.y(q)
        elif gate == "Z":
            qc.z(q)
        elif gate == "S":
            qc.s(q)
        elif gate == "T":
            qc.t(q)
        elif gate in ("CNOT", "CX"):
            c = int(control) if control is not None else 0
            t = int(target) if target is not None else (1 if c == 0 else 0)
            qc.cx(c, t)
        elif gate == "CZ":
            c = int(control) if control is not None else 0
            t = int(target) if target is not None else (1 if c == 0 else 0)
            qc.cz(c, t)
        elif gate == "SWAP":
            q1 = int(control) if control is not None else q
            q2 = int(target) if target is not None else (1 if q1 == 0 else 0)
            qc.swap(q1, q2)
        elif gate in ("TOFFOLI", "CCX"):
            c1 = int(op.get("control1", 0))
            c2 = int(op.get("control2", 1))
            t = int(target) if target is not None else 2
            qc.ccx(c1, c2, t)
        elif gate in ("M", "MEASURE"):
            qc.measure(q, q)
        elif gate == "RESET":
            qc.reset(q)

    return qc


class CircuitParser:
    """Backward compatibility wrapper for legacy scaffold tests."""
    @staticmethod
    def parse_frontend_json(data: dict):
        return data.get("operations", [])
