"""
Data Models (Scaffold)
"""
from pydantic import BaseModel
from typing import Dict

class StudentProgress(BaseModel):
    user_id: str
    overall_mastery: int
    concept_scores: Dict[str, int]
