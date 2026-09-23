"""
Progress & Learning Metrics API Endpoints
"""
from fastapi import APIRouter
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/progress", tags=["Progress"])

class ProgressPayload(BaseModel):
    user_id: Optional[str] = "alex"
    lessons_completed: List[str] = Field(default_factory=list)
    quiz_results: List[Dict[str, Any]] = Field(default_factory=list)
    challenge_results: List[Dict[str, Any]] = Field(default_factory=list)
    concept_mastery: Dict[str, int] = Field(default_factory=dict)
    overall_mastery: int = 0
    learning_gain: int = 0

# In-memory storage for session/demo
_current_progress: Dict[str, Any] = {
    "user_id": "alex",
    "lessons_completed": [],
    "quiz_results": [],
    "challenge_results": [],
    "concept_mastery": {
        "Qubit": 0,
        "Superposition": 0,
        "Hadamard": 0,
        "Measurement": 0,
        "Entanglement": 0,
        "Bell State": 0,
        "CNOT": 0
    },
    "overall_mastery": 0,
    "learning_gain": 0
}

@router.get("/metrics")
async def get_progress_metrics() -> Dict[str, Any]:
    return _current_progress

@router.post("/sync")
async def sync_progress(payload: ProgressPayload) -> Dict[str, Any]:
    global _current_progress
    _current_progress = payload.dict()
    return {"status": "synced", "data": _current_progress}

@router.post("/reset")
async def reset_progress() -> Dict[str, Any]:
    global _current_progress
    _current_progress = {
        "user_id": "alex",
        "lessons_completed": [],
        "quiz_results": [],
        "challenge_results": [],
        "concept_mastery": {c: 0 for c in ["Qubit", "Superposition", "Hadamard", "Measurement", "Entanglement", "Bell State", "CNOT"]},
        "overall_mastery": 0,
        "learning_gain": 0
    }
    return {"status": "reset", "data": _current_progress}

