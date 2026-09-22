"""
Quantum Challenge Evaluation API Endpoints
"""
import logging
from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.api.circuit import GateOperation
from backend.quantum.challenge_evaluator import evaluate_challenge

logger = logging.getLogger("quantumleap.challenge")

router = APIRouter(prefix="/api/challenge", tags=["Challenge"])


class ChallengeEvaluationRequest(BaseModel):
    challenge_id: str = Field(default="bell-state")
    qubits: int = Field(default=2, ge=1, le=10)
    shots: int = Field(default=1024, ge=1, le=100000)
    operations: List[GateOperation] = Field(default_factory=list)


@router.post("/evaluate")
async def evaluate_challenge_endpoint(req: ChallengeEvaluationRequest) -> Dict[str, Any]:
    """
    Simulates a submitted challenge circuit with Qiskit Aer and evaluates it
    against the target challenge physics benchmarks.
    """
    try:
        circuit_dict = req.model_dump()
        result = evaluate_challenge(
            challenge_id=req.challenge_id,
            circuit_data=circuit_dict,
            shots=req.shots
        )
        return result
    except ValueError as ve:
        # Validation-style errors: safe to surface directly to the student.
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as exc:  # noqa: BLE001 — never expose raw stack traces to students
        logger.exception("Challenge evaluation failed")
        raise HTTPException(
            status_code=400,
            detail="The quantum simulator could not evaluate this circuit. "
                   "Please verify your circuit and try again."
        )
