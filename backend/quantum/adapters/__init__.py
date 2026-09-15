"""
Quantum Simulator Adapters
Multi-backend abstraction layer for QuantumLeap-AI.
Supports Qiskit Aer (active) and prepared interfaces for future backends (PennyLane, etc.).
"""
from backend.quantum.adapters.base import QuantumSimulatorAdapter
from backend.quantum.adapters.qiskit_adapter import QiskitAerAdapter
from backend.quantum.adapters.pennylane_adapter import PennyLaneAdapter

__all__ = [
    "QuantumSimulatorAdapter",
    "QiskitAerAdapter",
    "PennyLaneAdapter",
]
