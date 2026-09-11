"""
Quantum State Vector Utilities
Provides helper functions for converting statevector amplitudes into readable basis states,
calculating Born rule probabilities, and formatting amplitudes for the frontend.
"""
import math
from typing import List, Dict, Any
import numpy as np


def format_statevector(statevector: Any, num_qubits: int) -> List[Dict[str, Any]]:
    """
    Converts a statevector (numpy array, list, or Qiskit Statevector) into a structured
    list of basis states formatted for the frontend.
    
    Format:
    [
      {
        "basis": "|00>",
        "real": 0.7071,
        "imag": 0.0,
        "prob": 0.5,
        "phaseRad": 0.0,
        "phaseDeg": "0°"
      },
      ...
    ]
    """
    # Convert input to 1D numpy array of complex numbers
    if hasattr(statevector, "data"):
        data = statevector.data
    else:
        data = np.asarray(statevector, dtype=complex)

    total_dim = len(data)
    # If num_qubits not specified or inconsistent, derive from length
    derived_qubits = int(round(math.log2(total_dim))) if total_dim > 0 else num_qubits
    qubits = max(num_qubits, derived_qubits)

    result = []
    for idx, amp in enumerate(data):
        # Basis representation in computational basis |00>, |01>, ...
        # Note: Qiskit standard qubit ordering has q0 as rightmost in ket: |q1 q0>
        # To match standard binary format:
        bin_str = format(idx, f"0{qubits}b")
        basis_label = f"|{bin_str}>"

        real_part = float(np.real(amp))
        imag_part = float(np.imag(amp))
        prob = float(np.abs(amp) ** 2)

        # Phase calculation
        if prob > 1e-6:
            phase_rad = float(np.angle(amp))
            phase_deg_val = round(math.degrees(phase_rad))
            if phase_deg_val < 0:
                phase_deg_val += 360
            phase_deg = f"{phase_deg_val}°"
        else:
            phase_rad = 0.0
            phase_deg = "—"

        result.append({
            "basis": basis_label,
            "real": round(real_part, 4),
            "imag": round(imag_part, 4),
            "prob": round(prob, 4),
            "phaseRad": round(phase_rad, 4),
            "phaseDeg": phase_deg
        })

    return result


def compute_probabilities(counts: Dict[str, int], shots: int) -> Dict[str, float]:
    """
    Computes measurement probabilities from integer shot counts.
    """
    if shots <= 0:
        return {}
    return {k: round(v / shots, 4) for k, v in counts.items()}


def compute_bloch_coordinates(statevector: Any, num_qubits: int) -> List[Dict[str, Any]]:
    """
    Calculates exact Bloch vector coordinates (theta, phi, x, y, z) for each individual qubit
    from the global statevector using partial trace and Pauli expectation values.
    """
    from qiskit.quantum_info import Statevector, partial_trace, Pauli
    
    if not isinstance(statevector, Statevector):
        try:
            statevector = Statevector(statevector)
        except Exception:
            return []

    bloch_list = []
    for q_idx in range(num_qubits):
        try:
            # Trace out all qubits except q_idx
            qubits_to_trace = [i for i in range(num_qubits) if i != q_idx]
            if qubits_to_trace:
                rho = partial_trace(statevector, qubits_to_trace)
            else:
                rho = statevector

            x = float(np.real(rho.expectation_value(Pauli('X'))))
            y = float(np.real(rho.expectation_value(Pauli('Y'))))
            z = float(np.real(rho.expectation_value(Pauli('Z'))))

            r = math.sqrt(x**2 + y**2 + z**2)
            if r > 1e-5:
                theta = math.acos(max(-1.0, min(1.0, z / r)))
                phi = math.atan2(y, x)
                if phi < 0:
                    phi += 2 * math.pi
            else:
                # Maximally mixed state (e.g. entangled subsystem)
                theta = math.pi / 2
                phi = 0.0

            # Derive clean label
            if r < 0.1:
                label = f"q{q_idx}: Entangled (Mixed state)"
            elif abs(z - 1.0) < 0.05:
                label = f"q{q_idx}: |0⟩"
            elif abs(z + 1.0) < 0.05:
                label = f"q{q_idx}: |1⟩"
            elif abs(x - 1.0) < 0.05:
                label = f"q{q_idx}: |+⟩"
            elif abs(x + 1.0) < 0.05:
                label = f"q{q_idx}: |-⟩"
            else:
                label = f"q{q_idx}: [{x:.2f}, {y:.2f}, {z:.2f}]"

            bloch_list.append({
                "qubit": q_idx,
                "theta": round(theta, 4),
                "phi": round(phi, 4),
                "x": round(x, 4),
                "y": round(y, 4),
                "z": round(z, 4),
                "r": round(r, 4),
                "label": label
            })
        except Exception as e:
            continue

    return bloch_list


