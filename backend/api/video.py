"""
Video Analysis API Endpoints
Handles video URL validation, YouTube video ID extraction,
and transcript extraction.
"""
from typing import List, Optional
from urllib.parse import urlparse, parse_qs
import re
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.video.transcript_service import fetch_youtube_transcript

router = APIRouter(prefix="/api/video", tags=["Video"])


class VideoAnalyzeRequest(BaseModel):
    url: str = Field(..., description="YouTube or supported video URL")


class TranscriptSegment(BaseModel):
    text: str
    start: float
    duration: float


class TranscriptData(BaseModel):
    text: str
    segments: List[TranscriptSegment]


class VideoAnalyzeResponse(BaseModel):
    success: bool
    video_id: str
    url: str
    status: str
    transcript: Optional[TranscriptData] = None


def extract_youtube_video_id(url: str) -> Optional[str]:
    """
    Extracts the YouTube video ID from supported formats:
    - https://www.youtube.com/watch?v=VIDEO_ID
    - https://youtu.be/VIDEO_ID
    - https://www.youtube.com/embed/VIDEO_ID
    - https://www.youtube.com/shorts/VIDEO_ID
    - https://m.youtube.com/watch?v=VIDEO_ID
    """
    if not url:
        return None
    url = url.strip()
    try:
        parsed = urlparse(url)
        if parsed.scheme not in ("http", "https"):
            return None

        hostname = (parsed.hostname or "").lower()
        if "youtube.com" in hostname:
            if parsed.path == "/watch":
                qs = parse_qs(parsed.query)
                v_list = qs.get("v")
                if v_list and len(v_list[0]) > 0:
                    vid = v_list[0].split("?")[0].split("&")[0]
                    if re.match(r"^[a-zA-Z0-9_-]{5,}$", vid):
                        return vid
            elif parsed.path.startswith(("/embed/", "/v/", "/shorts/")):
                parts = [p for p in parsed.path.split("/") if p]
                if len(parts) >= 2:
                    vid = parts[1].split("?")[0].split("&")[0]
                    if re.match(r"^[a-zA-Z0-9_-]{5,}$", vid):
                        return vid
        elif hostname == "youtu.be" or hostname.endswith(".youtu.be"):
            parts = [p for p in parsed.path.split("/") if p]
            if parts:
                vid = parts[0].split("?")[0].split("&")[0]
                if re.match(r"^[a-zA-Z0-9_-]{5,}$", vid):
                    return vid
    except Exception:
        return None

    return None


@router.post("/analyze", response_model=VideoAnalyzeResponse)
async def analyze_video(req: VideoAnalyzeRequest) -> VideoAnalyzeResponse:
    """
    Validates YouTube URL, extracts video ID, and retrieves real transcript data.
    """
    url = req.url.strip() if req.url else ""
    if not url:
        raise HTTPException(
            status_code=400,
            detail="Video URL cannot be empty."
        )

    try:
        parsed = urlparse(url)
        if parsed.scheme not in ("http", "https") or not parsed.netloc:
            raise HTTPException(
                status_code=400,
                detail="Invalid URL format. Please provide a valid HTTP or HTTPS URL."
            )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid URL format. Please provide a valid HTTP or HTTPS URL."
        )

    video_id = extract_youtube_video_id(url)
    if not video_id:
        raise HTTPException(
            status_code=400,
            detail="Unsupported or invalid YouTube URL. Please provide a valid YouTube link (e.g. https://www.youtube.com/watch?v=... or https://youtu.be/...)."
        )

    # Fetch real YouTube transcript
    transcript_res = fetch_youtube_transcript(video_id, languages=("en", "hi"))

    transcript_segments = [
        TranscriptSegment(
            text=s["text"],
            start=s["start"],
            duration=s["duration"]
        )
        for s in transcript_res["segments"]
    ]

    return VideoAnalyzeResponse(
        success=True,
        video_id=video_id,
        url=url,
        status="transcript_ready",
        transcript=TranscriptData(
            text=transcript_res["text"],
            segments=transcript_segments
        )
    )

from backend.ai.storyboard_generator import generate_storyboard

class LessonGenerateRequest(BaseModel):
    topic: str = Field(..., description="Quantum topic to generate lesson for")
    difficulty: str = Field(default="beginner")
    language: str = Field(default="English")

@router.post("/generate")
async def generate_lesson(req: LessonGenerateRequest):
    topic = (req.topic or "").strip()
    if not topic:
        raise HTTPException(status_code=400, detail="Please enter a quantum topic.")
    try:
        result = await generate_storyboard(topic, req.difficulty, req.language)
        return result
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to generate lesson: {str(exc)}")
