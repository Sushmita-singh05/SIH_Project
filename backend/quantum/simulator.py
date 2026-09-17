"""
Quantum Simulator Interface & Multi-Backend Dispatcher
Dispatches circuit simulation to registered adapters (Qiskit Aer, PennyLane, etc.).
"""
from typing import Dict, Any, List
from backend.quantum.adapters.qiskit_adapter import QiskitAerAdapter
from backend.quantum.adapters.pennylane_adapter import PennyLaneAdapter
from backend.quantum.adapters.base import QuantumSimulatorAdapter

# Registered backend adapters registry
_ADAPTER_REGISTRY: Dict[str, QuantumSimulatorAdapter] = {
    "qiskit-aer": QiskitAerAdapter(),
    "qiskit": QiskitAerAdapter(),
    "pennylane": PennyLaneAdapter(),
}


def get_available_backends() -> List[Dict[str, Any]]:
    """
    Returns metadata list of all configured simulation backends.
    Used by frontend to populate backend selector dynamically.
    """
    backends = [
        QiskitAerAdapter().get_metadata(),
        PennyLaneAdapter().get_metadata(),
    ]
    return backends


def simulate_circuit(
    circuit_data: Dict[str, Any],
    shots: int = 1024,
    backend: str = "qiskit-aer",
) -> Dict[str, Any]:
    """
    Simulates a quantum circuit using the specified backend engine.

    Args:
        circuit_data: Dictionary with circuit specifications.
        shots: Number of measurement shots.
        backend: Target backend identifier ('qiskit-aer', 'pennylane', etc.).
    """
    normalized_backend = str(backend or "qiskit-aer").strip().lower()

    adapter = _ADAPTER_REGISTRY.get(normalized_backend)
    if not adapter:
        valid_ids = sorted(list(set(b["id"] for b in get_available_backends())))
        raise ValueError(
            f"Unsupported simulation backend '{backend}'. Supported backends: {', '.join(valid_ids)}"
        )

    return adapter.simulate(circuit_data, shots=shots)


class QuantumSimulator:
    """Backward compatibility wrapper for legacy scaffold tests."""
    def __init__(self, backend_name: str = "aer_simulator", default_shots: int = 1024):
        self.backend_name = backend_name
        self.default_shots = default_shots

    def run(self, circuit_dict: dict) -> dict:
        return simulate_circuit(circuit_dict, shots=self.default_shots, backend="qiskit-aer")
