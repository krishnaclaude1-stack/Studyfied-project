"""
Generate Assets Router

Provides endpoints for generating visual assets from topic text.
Combines ImageSteeringService and AssetFactoryService for end-to-end asset generation.
Also provides the complete pipeline endpoint for lesson generation.
"""

import base64
import logging
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.schemas import CamelCaseModel
from app.schemas.generation_config import AIAgentsConfig
from app.services.image_steering import image_steering_service
from app.services.asset_factory import asset_factory_service
from app.services.ai_director import ai_director_service
from app.services.tts_service import tts_service
from app.services.exceptions import (
    InvalidAPIKeyError,
    ImagePromptGenerationError,
    InvalidImagePromptCountError,
    ImageProcessingError,
    ImageGenerationError,
    LessonGenerationError,
    LessonScriptGenerationError,
    InvalidLessonDurationError,
    InvalidSceneCountError,
    TTSGenerationError,
    ElevenLabsAPIError,
    AudioGenerationError,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["assets"])


class GenerateAssetsRequest(CamelCaseModel):
    """Request body for asset generation."""

    topic_text: str = Field(
        ...,
        min_length=10,
        description="Topic text to generate visual assets for",
    )
    ai: AIAgentsConfig | None = Field(default=None, description="Optional per-request AI provider configuration")


class GeneratedAsset(CamelCaseModel):
    """A single generated asset with base64-encoded PNG."""
    
    asset_id: str = Field(..., description="Asset identifier (e.g., 'asset_0') matching lesson manifest references")
    index: int = Field(..., description="Asset index (0-4)")
    purpose: str = Field(..., description="What this visual explains")
    layout_type: str = Field(..., description="Single / 2x2 Grid / 4x4 Grid")
    image_prompt: str = Field(..., description="The prompt used for generation")
    png_base64: str = Field(..., description="Base64-encoded transparent PNG")


class GenerateAssetsResponse(CamelCaseModel):
    """Response containing generated assets."""
    
    storyboard_overview: dict[str, Any] = Field(..., description="Overview of visual flow")
    assets: list[GeneratedAsset] = Field(..., description="List of generated assets")


class ImagePromptsResponse(CamelCaseModel):
    """Response containing only image prompts (without generated images)."""
    
    storyboard_overview: dict[str, Any] = Field(..., description="Overview of visual flow")
    images: list[dict[str, Any]] = Field(..., description="List of image prompts")


class ErrorDetail(CamelCaseModel):
    """Error detail response."""
    
    code: str = Field(..., description="Error code")
    message: str = Field(..., description="Error message")
    details: dict[str, Any] = Field(default_factory=dict, description="Additional details")


class ErrorResponse(CamelCaseModel):
    """Error response wrapper."""
    
    error: ErrorDetail


@router.post(
    "/generate-prompts",
    response_model=ImagePromptsResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Bad request"},
        401: {"model": ErrorResponse, "description": "Invalid API key"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
    }
)
async def generate_image_prompts(request: GenerateAssetsRequest) -> ImagePromptsResponse:
    """
    Generate image prompts from topic text.
    
    This endpoint only generates the prompts without creating actual images.
    Useful for testing and previewing the prompt generation.
    """
    try:
        logger.info(f"Generating image prompts for topic ({len(request.topic_text)} chars)")
        
        result = await image_steering_service.generate_image_prompts(
            request.topic_text,
            ai_config=(request.ai.image_steering if request.ai else None),
        )

        return ImagePromptsResponse(
            storyboard_overview=result["storyboardOverview"],
            images=result["images"]
        )
        
    except InvalidAPIKeyError as e:
        logger.error(f"Invalid API key: {e}")
        raise HTTPException(
            status_code=401,
            detail={"error": {"code": e.code, "message": e.message, "details": e.details}}
        )
    except (ImagePromptGenerationError, InvalidImagePromptCountError) as e:
        logger.error(f"Prompt generation failed: {e}")
        raise HTTPException(
            status_code=500,
            detail={"error": {"code": e.code, "message": e.message, "details": e.details}}
        )
    except Exception as e:
        logger.exception(f"Unexpected error generating prompts: {e}")
        raise HTTPException(
            status_code=500,
            detail={"error": {"code": "INTERNAL_ERROR", "message": str(e), "details": {}}}
        )


@router.post(
    "/generate-assets",
    response_model=GenerateAssetsResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Bad request"},
        401: {"model": ErrorResponse, "description": "Invalid API key"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
    }
)
async def generate_assets(request: GenerateAssetsRequest) -> GenerateAssetsResponse:
    """
    Generate visual assets from topic text.
    
    This endpoint:
    1. Generates 5 image prompts using ImageSteeringService
    2. Creates images using the configured image generation provider (Gemini or OpenAI-compatible)
    3. Processes images with OpenCV for transparent background
    4. Returns base64-encoded PNG assets
    
    Note: This operation may take 30-60 seconds to complete.
    """
    try:
        logger.info(f"Generating assets for topic ({len(request.topic_text)} chars)")
        
        # Step 1: Generate image prompts
        logger.info("Step 1: Generating image prompts...")
        prompts_result = await image_steering_service.generate_image_prompts(
            request.topic_text,
            ai_config=(request.ai.image_steering if request.ai else None),
        )

        # Step 2: Extract prompt strings
        image_prompts = prompts_result["images"]
        prompt_texts = [img["imagePrompt"] for img in image_prompts]
        
        # Step 3: Generate assets in parallel
        logger.info("Step 2: Generating images and processing...")
        asset_pngs = await asset_factory_service.generate_assets(
            prompt_texts,
            ai_config=(request.ai.image_generation if request.ai else None),
        )

        # Create asset IDs
        asset_ids = [f"asset_{i}" for i in range(len(asset_pngs))]
        
        # Step 4: Build response with base64-encoded PNGs
        assets = []
        for i, (asset_id, prompt_info, png_bytes) in enumerate(zip(asset_ids, image_prompts, asset_pngs)):
            assets.append(GeneratedAsset(
                asset_id=asset_id,
                index=i,
                purpose=prompt_info["purpose"],
                layout_type=prompt_info["layoutType"],
                image_prompt=prompt_info["imagePrompt"],
                png_base64=base64.b64encode(png_bytes).decode("utf-8")
            ))
        
        logger.info(f"Successfully generated {len(assets)} assets")
        
        return GenerateAssetsResponse(
            storyboard_overview=prompts_result["storyboardOverview"],
            assets=assets
        )
        
    except InvalidAPIKeyError as e:
        logger.error(f"Invalid API key: {e}")
        raise HTTPException(
            status_code=401,
            detail={"error": {"code": e.code, "message": e.message, "details": e.details}}
        )
    except ImageGenerationError as e:
        logger.error(f"Image generation failed: {e}")
        raise HTTPException(
            status_code=500,
            detail={"error": {"code": e.code, "message": e.message, "details": e.details}}
        )
    except Exception as e:
        logger.exception(f"Unexpected error generating assets: {e}")
        raise HTTPException(
            status_code=500,
            detail={"error": {"code": "INTERNAL_ERROR", "message": str(e), "details": {}}}
        )


class GenerateLessonRequest(CamelCaseModel):
    """Request body for complete lesson generation."""

    topic_text: str = Field(
        ...,
        min_length=10,
        description="Topic text to generate lesson for",
    )
    topic_id: str | None = Field(None, description="Optional topic ID for tracking")
    include_quiz: bool = Field(default=False, description="Include quiz interactions (for future integration)")

    ai: AIAgentsConfig | None = Field(default=None, description="Optional per-request AI provider configuration")
    eleven_labs_api_key: str | None = Field(default=None, alias="elevenLabsApiKey")


class GenerateLessonResponse(CamelCaseModel):
    """Response containing complete lesson with manifest, audio, and assets."""
    
    lesson_manifest: dict[str, Any] = Field(..., description="Complete lesson manifest with scenes")
    audio_url: str = Field(..., description="Base64-encoded audio data URL")
    assets: list[GeneratedAsset] = Field(..., description="List of generated visual assets")
    transcript: list[str] = Field(..., description="Narration text for accessibility")


@router.post(
    "/generate",
    response_model=GenerateLessonResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Bad request"},
        401: {"model": ErrorResponse, "description": "Invalid API key"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
    }
)
async def generate_lesson(request: GenerateLessonRequest) -> GenerateLessonResponse:
    """
    Generate complete lesson from topic text.
    
    This endpoint orchestrates the full pipeline:
    1. Generate 5 image prompts using ImageSteeringService
    2. Generate assets using AssetFactoryService
    3. Generate lesson manifest using AIDirectorService
    4. Generate TTS audio using TTSService
    5. Return complete lesson with manifest, audio, and assets
    
    Note: This operation may take 60-90 seconds to complete.
    """
    try:
        logger.info(f"Starting lesson generation for topic ({len(request.topic_text)} chars)")
        
        # Step 1: Generate image prompts
        logger.info("Step 1/4: Generating image prompts...")
        prompts_result = await image_steering_service.generate_image_prompts(
            request.topic_text,
            ai_config=(request.ai.image_steering if request.ai else None),
        )

        # Step 2: Generate assets
        logger.info("Step 2/4: Generating visual assets...")
        image_prompts = prompts_result["images"]
        prompt_texts = [img["imagePrompt"] for img in image_prompts]
        asset_pngs = await asset_factory_service.generate_assets(
            prompt_texts,
            ai_config=(request.ai.image_generation if request.ai else None),
        )

        # Create asset IDs
        asset_ids = [f"asset_{i}" for i in range(len(asset_pngs))]
        
        # Step 3: Generate lesson manifest
        logger.info("Step 3/4: Generating lesson manifest...")
        lesson_manifest = await ai_director_service.generate_lesson_manifest(
            topic_text=request.topic_text,
            asset_ids=asset_ids,
            ai_config=(request.ai.ai_director if request.ai else None),
        )
        
        # Extract narration segments from all scenes
        narration_segments = []
        for scene in lesson_manifest.get("scenes", []):
            voiceover = scene.get("voiceover", [])
            narration_segments.extend(voiceover)
        
        # Step 4: Generate TTS audio
        logger.info("Step 4/4: Generating TTS audio...")
        audio_bytes = await tts_service.synthesize_narration(
            narration_segments,
            elevenlabs_api_key=request.eleven_labs_api_key,
        )
        
        # Validate audio duration against manifest duration
        if audio_bytes:
            audio_duration = await tts_service.get_audio_duration(audio_bytes)
            manifest_duration = lesson_manifest.get("lessonDurationSec", 0)
            
            # Allow 10% tolerance for duration mismatch
            tolerance = manifest_duration * 0.1
            if audio_duration > manifest_duration + tolerance:
                logger.error(
                    f"Audio duration ({audio_duration:.2f}s) exceeds manifest duration "
                    f"({manifest_duration:.2f}s) with tolerance ({tolerance:.2f}s)"
                )
                raise HTTPException(
                    status_code=500,
                    detail={
                        "error": {
                            "code": "AUDIO_DURATION_MISMATCH",
                            "message": f"Generated audio duration ({audio_duration:.2f}s) exceeds "
                                      f"lesson manifest duration ({manifest_duration:.2f}s)",
                            "details": {
                                "audioDuration": audio_duration,
                                "manifestDuration": manifest_duration,
                                "tolerance": tolerance
                            }
                        }
                    }
                )
            
            logger.info(
                f"Audio duration validated: {audio_duration:.2f}s "
                f"(manifest: {manifest_duration:.2f}s, tolerance: {tolerance:.2f}s)"
            )
        
        # Encode audio as base64 data URL
        if audio_bytes:
            audio_base64 = base64.b64encode(audio_bytes).decode("utf-8")
            audio_url = f"data:audio/mp3;base64,{audio_base64}"
        else:
            # Development mode: empty audio
            audio_url = "data:audio/mp3;base64,"
        
        # Build asset list for response
        assets = []
        for i, (asset_id, prompt_info, png_bytes) in enumerate(zip(asset_ids, image_prompts, asset_pngs)):
            assets.append(GeneratedAsset(
                asset_id=asset_id,
                index=i,
                purpose=prompt_info["purpose"],
                layout_type=prompt_info["layoutType"],
                image_prompt=prompt_info["imagePrompt"],
                png_base64=base64.b64encode(png_bytes).decode("utf-8")
            ))
        
        # Build transcript for accessibility
        transcript = [seg.get("text", "") for seg in narration_segments]
        
        logger.info(
            f"Successfully generated lesson: "
            f"{len(lesson_manifest.get('scenes', []))} scenes, "
            f"{len(assets)} assets, "
            f"{len(transcript)} narration segments"
        )
        
        return GenerateLessonResponse(
            lesson_manifest=lesson_manifest,
            audio_url=audio_url,
            assets=assets,
            transcript=transcript
        )
        
    except InvalidAPIKeyError as e:
        logger.error(f"Invalid API key: {e}")
        raise HTTPException(
            status_code=401,
            detail={"error": {"code": e.code, "message": e.message, "details": e.details}}
        )
    except (ImageGenerationError, LessonGenerationError, TTSGenerationError) as e:
        logger.error(f"Service error during lesson generation: {e}")
        raise HTTPException(
            status_code=500,
            detail={"error": {"code": e.code, "message": e.message, "details": e.details}}
        )
    except Exception as e:
        logger.exception(f"Unexpected error generating lesson: {e}")
        raise HTTPException(
            status_code=500,
            detail={"error": {"code": "INTERNAL_ERROR", "message": str(e), "details": {}}}
        )
