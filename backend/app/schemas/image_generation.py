"""
Pydantic schemas for image generation services.

Defines request/response models for ImageSteeringService and AssetFactoryService.
"""

from pydantic import Field
from . import CamelCaseModel


class ImagePromptItem(CamelCaseModel):
    """Single image prompt with purpose, layout type, and prompt text."""
    
    purpose: str = Field(..., description="What this visual explains")
    layout_type: str = Field(..., description="Single / 2x2 Grid / 4x4 Grid")
    image_prompt: str = Field(..., description="Full image prompt for generation")


class StoryboardOverview(CamelCaseModel):
    """Overview of the storyboard structure."""
    
    total_images: int = Field(default=5, description="Total number of images (always 5)")
    visual_flow: str = Field(..., description="Brief 1-2 lines describing progression")


class ImageSteeringResponse(CamelCaseModel):
    """Response from ImageSteeringService containing exactly 5 image prompts."""
    
    storyboard_overview: StoryboardOverview = Field(..., description="Overview of visual flow")
    images: list[ImagePromptItem] = Field(
        ...,
        min_length=1,
        description="List of image prompts (service enforces exactly 5)"
    )


class NanoBananaSubmitRequest(CamelCaseModel):
    """Request payload for Nano Banana submit endpoint."""
    
    model: str = Field(default="google/nano-banana-pro", description="Model to use")
    prompt: str = Field(..., description="Image generation prompt")
    aspect_ratio: str = Field(default="1:1", description="Image aspect ratio")
    resolution: str = Field(default="1K", description="Image resolution (1K, 2K, 4K)")


class NanoBananaSubmitResponse(CamelCaseModel):
    """Response from Nano Banana submit endpoint."""
    
    request_id: str = Field(..., description="Request ID for polling")


class NanoBananaRespData(CamelCaseModel):
    """Response data from Nano Banana API."""
    
    request_id: str = Field(..., description="Request identifier")
    status: str = Field(..., description="Request status (queuing, processing, success, error, failed)")
    image_list: list[str] = Field(default_factory=list, description="List of generated image URLs")
    error: str | None = Field(default=None, description="Error message if failed")


class NanoBananaResultResponse(CamelCaseModel):
    """Response from Nano Banana result endpoint."""
    
    code: int = Field(..., description="HTTP status code")
    code_msg: str = Field(..., description="Status message")
    resp_data: NanoBananaRespData = Field(..., description="Response data")


class ProcessedAsset(CamelCaseModel):
    """A single processed PNG asset."""
    
    index: int = Field(..., description="Asset index (0-4)")
    png_bytes: bytes = Field(..., description="Transparent PNG as bytes")
    original_prompt: str = Field(..., description="The prompt used to generate this asset")


class AssetGenerationResponse(CamelCaseModel):
    """Final response with processed PNG assets."""
    
    assets: list[ProcessedAsset] = Field(..., description="List of 5 processed PNG assets")
    total_count: int = Field(default=5, description="Total number of assets generated")
