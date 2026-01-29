"""
Generate Lesson Router

Provides the POST /api/v1/generate endpoint for lesson generation using pre-generated assets.

Orchestrates AIDirectorService and TTSService to:
1. Generate lesson manifest from topic text + asset IDs
2. Generate narration audio
3. Return complete lesson manifest with audio and transcript
"""

import base64
import logging

from fastapi import APIRouter, HTTPException, status
from pydantic import Field

from app.schemas import CamelCaseModel
from app.schemas.lesson import LessonManifestResponse
from app.schemas.generation_config import AIAgentsConfig
from app.services.ai_director import ai_director_service
from app.services.tts_service import tts_service
from app.services.exceptions import (
    InvalidAPIKeyError,
    LessonScriptGenerationError,
    InvalidLessonDurationError,
    InvalidSceneCountError,
    ElevenLabsAPIError,
    AudioGenerationError,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["lesson"])


class ErrorDetail(CamelCaseModel):
    """Error detail response."""

    code: str = Field(..., description="Error code")
    message: str = Field(..., description="Error message")
    details: dict = Field(default_factory=dict, description="Additional details")


class ErrorResponse(CamelCaseModel):
    """Error response wrapper."""

    error: ErrorDetail


class GenerateLessonRequest(CamelCaseModel):
    """Request body for lesson generation using pre-generated assets."""

    topic_text: str = Field(..., min_length=10, description="Topic content")
    asset_ids: list[str] = Field(..., min_length=5, max_length=5, description="Asset IDs (exactly 5)")

    ai: AIAgentsConfig | None = Field(default=None, description="Optional per-request AI provider configuration")
    eleven_labs_api_key: str | None = Field(default=None, alias="elevenLabsApiKey")


@router.post(
    "/generate-lesson",
    response_model=LessonManifestResponse,
    responses={
        401: {"model": ErrorResponse, "description": "Invalid API key"},
        422: {"model": ErrorResponse, "description": "Unprocessable Entity"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
    summary="Generate complete lesson from topic and assets",
    description="""
    Generate a complete lesson manifest and audio from topic text and pre-generated assets.

    This endpoint orchestrates only the AI Director and TTS services, validates audio duration
    against the manifest duration, and returns the lesson manifest with base64-encoded audio.

    Typical latency: 15-25 seconds.
    """
)
async def generate_lesson(request: GenerateLessonRequest) -> LessonManifestResponse:
    """
    Generate a lesson manifest with narration audio using pre-generated assets.
    """
    try:
        logger.info(
            "Starting lesson generation (topic length: %s, assets: %s)",
            len(request.topic_text),
            len(request.asset_ids)
        )

        lesson_manifest = await ai_director_service.generate_lesson_manifest(
            topic_text=request.topic_text,
            asset_ids=request.asset_ids,
            ai_config=(request.ai.ai_director if request.ai else None),
        )

        narration_segments = []
        for scene in lesson_manifest.get("scenes", []):
            narration_segments.extend(scene.get("voiceover", []))

        audio_bytes = await tts_service.synthesize_narration(
            narration_segments,
            elevenlabs_api_key=request.eleven_labs_api_key,
        )

        if audio_bytes:
            audio_duration = await tts_service.get_audio_duration(audio_bytes)
            manifest_duration = lesson_manifest.get("lessonDurationSec", 0)

            if manifest_duration > 0:
                mismatch_percent = abs(audio_duration - manifest_duration) / manifest_duration * 100
                if mismatch_percent > 10:
                    logger.warning(
                        "Audio duration mismatch: expected=%.2fs actual=%.2fs (%.2f%%)",
                        manifest_duration,
                        audio_duration,
                        mismatch_percent
                    )

        if audio_bytes:
            audio_base64 = base64.b64encode(audio_bytes).decode("utf-8")
            audio_url = f"data:audio/mp3;base64,{audio_base64}"
        else:
            audio_url = "data:audio/mp3;base64,"

        transcript = [segment.get("text", "") for segment in narration_segments]

        logger.info(
            "Lesson generation complete: %s scenes, %s narration segments",
            len(lesson_manifest.get("scenes", [])),
            len(narration_segments)
        )

        return LessonManifestResponse(
            lesson_manifest=lesson_manifest,
            audio_url=audio_url,
            transcript=transcript
        )

    except InvalidAPIKeyError as e:
        logger.error("Invalid API key: %s", e.message)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": {"code": e.code, "message": e.message, "details": e.details}}
        )
    except (InvalidLessonDurationError, InvalidSceneCountError) as e:
        logger.error("Lesson validation error: %s", e.message)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error": {"code": e.code, "message": e.message, "details": e.details}}
        )
    except LessonScriptGenerationError as e:
        logger.error("Lesson script generation failed: %s", e.message)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": {"code": e.code, "message": e.message, "details": e.details}}
        )
    except (ElevenLabsAPIError, AudioGenerationError) as e:
        logger.error("TTS generation failed: %s", e.message)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": {"code": e.code, "message": e.message, "details": e.details}}
        )
    except Exception as e:
        logger.exception("Unexpected error during lesson generation: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": {"code": "INTERNAL_ERROR", "message": str(e), "details": {}}}
        )
