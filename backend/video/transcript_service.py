"""
QuantumLeap-AI YouTube Transcript Extraction Service
Fetches, sanitizes, and structures captions from YouTube videos.
"""
from typing import Dict, Any, List, Sequence
from fastapi import HTTPException

try:
    from youtube_transcript_api import (
        YouTubeTranscriptApi,
        TranscriptsDisabled,
        NoTranscriptFound,
        VideoUnavailable,
        InvalidVideoId,
        CouldNotRetrieveTranscript,
        YouTubeRequestFailed,
        IpBlocked,
        RequestBlocked,
    )
    YOUTUBE_TRANSCRIPT_API_AVAILABLE = True
except ImportError:
    YOUTUBE_TRANSCRIPT_API_AVAILABLE = False


def fetch_youtube_transcript(
    video_id: str,
    languages: Sequence[str] = ("en", "hi")
) -> Dict[str, Any]:
    """
    Fetches the real YouTube transcript for a video ID.
    Supports language fallback (e.g. ['en', 'hi']).
    Returns structured segments and full combined plain-text.
    """
    if not YOUTUBE_TRANSCRIPT_API_AVAILABLE:
        raise HTTPException(
            status_code=501,
            detail="YouTube transcript extraction is no longer supported in QuantumLeap-AI."
        )

    clean_id = (video_id or "").strip()
    if not clean_id:
        raise HTTPException(
            status_code=400,
            detail="Invalid video ID provided."
        )

    try:
        api = YouTubeTranscriptApi()
        fetched = api.fetch(clean_id, languages=list(languages))

        raw_snippets = fetched.to_raw_data()
        segments: List[Dict[str, Any]] = []
        full_text_parts: List[str] = []

        for snippet in raw_snippets:
            raw_text = snippet.get("text") or ""
            # Clean up excessive whitespace/newlines inside caption lines
            clean_text = " ".join(raw_text.split())
            if clean_text:
                segments.append({
                    "text": clean_text,
                    "start": round(float(snippet.get("start", 0.0)), 2),
                    "duration": round(float(snippet.get("duration", 0.0)), 2),
                })
                full_text_parts.append(clean_text)

        if not segments:
            raise HTTPException(
                status_code=404,
                detail="Transcript is empty or unavailable for this video."
            )

        combined_text = " ".join(full_text_parts)

        return {
            "segments": segments,
            "text": combined_text,
            "language": getattr(fetched, "language", "en"),
            "language_code": getattr(fetched, "language_code", "en"),
            "is_generated": getattr(fetched, "is_generated", False),
        }

    except (TranscriptsDisabled, NoTranscriptFound):
        raise HTTPException(
            status_code=404,
            detail="Transcript is not available for this video (no captions in supported languages)."
        )
    except VideoUnavailable:
        raise HTTPException(
            status_code=404,
            detail="This YouTube video is unavailable or private."
        )
    except InvalidVideoId:
        raise HTTPException(
            status_code=400,
            detail="The provided YouTube video ID is invalid."
        )
    except (IpBlocked, RequestBlocked):
        raise HTTPException(
            status_code=502,
            detail="YouTube blocked transcript retrieval. Please try again later."
        )
    except (YouTubeRequestFailed, CouldNotRetrieveTranscript) as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Unable to retrieve transcript from YouTube: {str(exc)}"
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to retrieve transcript: {str(exc)}"
        )
