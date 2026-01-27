"""
Generate Assets Router

Provides endpoints for generating visual assets from topic text.
Combines ImageSteeringService and AssetFactoryService for end-to-end asset generation.
"""

import base64
import logging
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.schemas import CamelCaseModel
from app.services.image_steering import image_steering_service
from app.services.asset_factory import asset_factory_service
from app.services.exceptions import (
    InvalidAPIKeyError,
    ImagePromptGenerationError,
    InvalidImagePromptCountError,
    NanoBananaAPIError,
    ImageProcessingError,
    ImageGenerationError,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["assets"])


class GenerateAssetsRequest(CamelCaseModel):
    """Request body for asset generation."""
    
    topic_text: str = Field(
        ...,
        min_length=10,
        description="Topic text to generate visual assets for"
    )


class GeneratedAsset(CamelCaseModel):
    """A single generated asset with base64-encoded PNG."""
    
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
        
        result = await image_steering_service.generate_image_prompts(request.topic_text)
        
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
    2. Creates images using Nano Banana Pro API
    3. Processes images with OpenCV for transparent background
    4. Returns base64-encoded PNG assets
    
    Note: This operation may take 30-60 seconds to complete.
    """
    try:
        logger.info(f"Generating assets for topic ({len(request.topic_text)} chars)")
        
        # Step 1: Generate image prompts
        logger.info("Step 1: Generating image prompts...")
        prompts_result = await image_steering_service.generate_image_prompts(request.topic_text)
        
        # Step 2: Extract prompt strings
        image_prompts = prompts_result["images"]
        prompt_texts = [img["imagePrompt"] for img in image_prompts]
        
        # Step 3: Generate assets in parallel
        logger.info("Step 2: Generating images and processing...")
        asset_pngs = await asset_factory_service.generate_assets(prompt_texts)
        
        # Step 4: Build response with base64-encoded PNGs
        assets = []
        for i, (prompt_info, png_bytes) in enumerate(zip(image_prompts, asset_pngs)):
            assets.append(GeneratedAsset(
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
