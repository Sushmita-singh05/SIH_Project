"""
Circuit Simulation API Endpoints
"""
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.quantum.simulator import simulate_circuit

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


@router.post("/simulate")
async def run_simulation(req: CircuitRequest) -> Dict[str, Any]:
    """
    Executes a circuit on Qiskit Aer and returns measurement counts, statevector, and execution stats.
    """
    try:
        circuit_dict = req.model_dump()
        result = simulate_circuit(circuit_dict, shots=req.shots)
        return result
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Quantum simulation error: {str(exc)}")

