"""
Abstract Base Class for Quantum Simulator Adapters.
Enforces a uniform contract across all simulation engines.
"""
from abc import ABC, abstractmethod
from typing import Dict, Any


class QuantumSimulatorAdapter(ABC):
    """
    Standard interface for all quantum simulation backends.
    Translates common circuit specification dictionaries into backend-specific
    executions and normalizes simulation output.
    """

    @abstractmethod
    def simulate(self, circuit_data: Dict[str, Any], shots: int = 1024) -> Dict[str, Any]:
        """
        Execute simulation on the quantum backend.

        Args:
            circuit_data: Dictionary containing 'qubits', 'operations', etc.
            shots: Number of measurement shots to sample.

        Returns:
            Normalized dictionary containing:
              - success (bool)
              - backend (str)
              - shots (int)
              - qubits (int)
              - executionTimeMs (float)
              - counts (Dict[str, int])
              - probabilities (Dict[str, float])
              - statevector (List[Dict[str, Any]])
              - blochSpheres (List[Dict[str, Any]])
              - circuit (Dict[str, Any])
        """
        pass

    @abstractmethod
    def is_available(self) -> bool:
        """Return True if backend library and runtime are available."""
        pass

    @abstractmethod
    def get_metadata(self) -> Dict[str, Any]:
        """Return metadata describing backend capabilities and status."""
        pass
