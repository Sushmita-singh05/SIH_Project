"""
AI Tutor & Quantum Explanation API Endpoints
Supports context-aware interactive quantum tutoring and structured visual explanations.
"""
from typing import List, Dict, Any, Optional, Union
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field, field_validator

from backend.ai.explanation_generator import (
    generate_explanation,
    AIProviderNotConfiguredError,
    AIResponseParsingError,
    VALID_VISUAL_TYPES
)
from backend.ai.tutor import AITutorEngine
from backend.ai.hint_engine import ProgressiveHintEngine

router = APIRouter(prefix="/api/ai", tags=["AI Tutor"])


class TutorContextRequest(BaseModel):
    lesson: str = "Superposition"
    student_level: str = "Beginner"
    circuit: List[Dict[str, Any]]
    expected_output: Dict[str, float]
    actual_output: Dict[str, float]
    hint_level: int = 1


class TutorChatRequest(BaseModel):
    query: str = Field(..., description="Student's question or message to the AI Tutor")
    context: Dict[str, Any] = Field(default_factory=dict, description="Screen-aware TutorContext")
    hint_level: Optional[int] = Field(default=1, ge=1, le=3, description="Active progressive hint level")


class GenerateExplanationRequest(BaseModel):
    text: str = Field(..., description="Quantum computing topic, question, or notes")

    @field_validator("text")
    @classmethod
    def validate_text_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Please enter a quantum topic or some learning material.")
        return v.strip()


class SceneModel(BaseModel):
    scene_number: int
    title: str
    explanation: str
    visual_type: str
    circuit: Optional[Union[Dict[str, Any], str]] = None
    key_concept: str


class ExplanationResponse(BaseModel):
    success: bool = True
    topic: str
    difficulty: str
    learning_objective: str
    scenes: List[SceneModel]


@router.post("/chat", summary="Context-aware conversational quantum tutoring")
async def chat_with_tutor(req: TutorChatRequest) -> Dict[str, Any]:
    """
    Evaluates the student's question against their active screen context
    (circuit, simulation counts, Bloch coordinates, code, or challenge).
    """
    try:
        engine = AITutorEngine()
        result = await engine.answer_query(
            query=req.query,
            context=req.context,
            hint_level=req.hint_level or 1
        )
        return result
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI Tutor error: {str(exc)}"
        )


@router.post("/explain")
async def get_explanation(req: TutorContextRequest) -> Dict[str, Any]:
    """
    Legacy scaffold endpoint for contextual circuit explanation.
    """
    hint = ProgressiveHintEngine.get_hint(level=req.hint_level, topic=req.lesson, current_circuit=req.circuit)
    return {
        "explanation": "Your circuit applies a Hadamard (H) gate to q0, transforming |0> into (|0> + |1>)/sqrt(2).",
        "bloch_state": "|+>",
        "hint": hint,
        "hint_level": req.hint_level
    }


@router.post(
    "/generate-explanation",
    response_model=ExplanationResponse,
    summary="Generate a structured quantum visual explanation plan"
)
async def create_visual_explanation(req: GenerateExplanationRequest) -> Dict[str, Any]:
    """
    Analyzes a quantum topic, question, or notes and generates a structured scene-by-scene explanation.
    """
    try:
        explanation = await generate_explanation(req.text)
        return explanation
    except AIProviderNotConfiguredError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc)
        )
    except AIResponseParsingError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI Explanation Error: {str(exc)}"
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error generating explanation: {str(exc)}"
        )
