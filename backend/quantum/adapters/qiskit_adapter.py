"""
Qiskit Aer Simulator Adapter
Implements QuantumSimulatorAdapter using IBM Qiskit and Qiskit Aer.
"""
import time
from typing import Dict, Any
from qiskit import transpile
from qiskit.quantum_info import Statevector
from qiskit_aer import AerSimulator

from backend.quantum.adapters.base import QuantumSimulatorAdapter
from backend.quantum.circuit_parser import parse_circuit
from backend.quantum.state_utils import (
    format_statevector,
    compute_probabilities,
    compute_bloch_coordinates,
)


class QiskitAerAdapter(QuantumSimulatorAdapter):
    """
    Adapter for Qiskit Aer Simulator.
    Computes exact pre-measurement statevector and samples measurement counts.
    """

    def is_available(self) -> bool:
        return True

    def get_metadata(self) -> Dict[str, Any]:
        return {
            "id": "qiskit-aer",
            "name": "Qiskit Aer Simulator",
            "provider": "IBM Qiskit",
            "type": "Statevector & Shot Simulator",
            "status": "active",
            "is_default": True,
            "installed": True,
            "description": "High-performance C++ simulator with exact statevector, Bloch sphere coordinates, and noise-free shot sampling.",
        }

    def simulate(self, circuit_data: Dict[str, Any], shots: int = 1024) -> Dict[str, Any]:
        start_time = time.perf_counter()
        num_qubits = circuit_data.get("qubits", 2)
        shots_count = circuit_data.get("shots", shots)

        # 1. Parse JSON into QuantumCircuit
        qc = parse_circuit(circuit_data)

        # 2. Compute theoretical Statevector before measurement collapses it
        bloch_spheres = []
        try:
            sv = Statevector.from_instruction(qc)
            formatted_statevector = format_statevector(sv, num_qubits)
            bloch_spheres = compute_bloch_coordinates(sv, num_qubits)
        except Exception:
            formatted_statevector = []

        # 3. Add measurements if not already present
        has_measurements = any(inst.operation.name in ("measure", "m") for inst in qc.data)
        if not has_measurements:
            qc.measure_all()

        # 4. Transpile and execute on Qiskit Aer simulator
        simulator = AerSimulator()
        transpiled_qc = transpile(qc, simulator)
        job = simulator.run(transpiled_qc, shots=shots_count)
        result = job.result()
        raw_counts = result.get_counts()

        # Format measurement keys into clean binary bitstrings
        formatted_counts: Dict[str, int] = {}
        for bitstring, count in raw_counts.items():
            clean_key = bitstring.replace(" ", "")
            formatted_counts[clean_key] = int(count)

        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        probabilities = compute_probabilities(formatted_counts, shots_count)

        return {
            "success": True,
            "backend": "Qiskit Aer Simulator",
            "backendId": "qiskit-aer",
            "shots": shots_count,
            "qubits": num_qubits,
            "executionTimeMs": elapsed_ms,
            "counts": formatted_counts,
            "probabilities": probabilities,
            "statevector": formatted_statevector,
            "blochSpheres": bloch_spheres,
            "circuit": circuit_data,
        }
