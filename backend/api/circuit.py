"""
Circuit Simulation API Endpoints
Supports multi-backend simulation execution and backend catalog discovery.
"""
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.quantum.simulator import simulate_circuit, get_available_backends

router = APIRouter(prefix="/api/circuit", tags=["Circuit"])


class GateOperation(BaseModel):
    gate: str
    qubit: int = 0
    step: int = 0
    control: Optional[int] = None
    target: Optional[int] = None
    control1: Optional[int] = None
    control2: Optional[int] = None


class CircuitRequest(BaseModel):
    qubits: int = Field(default=2, ge=1, le=10)
    shots: int = Field(default=1024, ge=1, le=100000)
    operations: List[GateOperation] = Field(default_factory=list)
    backend: Optional[str] = Field(default="qiskit-aer", description="Target simulation backend engine")


@router.get("/backends")
async def list_simulation_backends() -> List[Dict[str, Any]]:
    """
    Returns the catalog of configured quantum simulation backends.
    """
    try:
        return get_available_backends()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to load backends: {str(exc)}")


@router.post("/simulate")
async def run_simulation(req: CircuitRequest) -> Dict[str, Any]:
    """
    Executes a circuit on the requested quantum backend (default: Qiskit Aer).
    Returns measurement counts, probabilities, statevector, and execution stats.
    """
    try:
        circuit_dict = req.model_dump()
        result = simulate_circuit(
            circuit_dict,
            shots=req.shots,
            backend=req.backend or "qiskit-aer"
        )
        return result
    except RuntimeError as r_exc:
        # Graceful error for prepared/uninstalled backends (e.g. PennyLane)
        raise HTTPException(status_code=400, detail=str(r_exc))
    except ValueError as v_exc:
        raise HTTPException(status_code=400, detail=str(v_exc))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Quantum simulation error: {str(exc)}")
