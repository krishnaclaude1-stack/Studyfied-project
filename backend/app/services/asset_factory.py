"""
Asset Factory Service

Generates transparent PNG assets from image prompts.

Implementation Guide:
- Uses either official Gemini image generation or an OpenAI-compatible Images API
- Applies OpenCV Smart Key for background removal
- Preserves teal/orange accents while removing white background
- Generates 5 images in parallel for performance
- Related Ticket: T3 - AI Pipeline - Visual Asset Generation (updated for provider-agnostic image generation)
- Tech Plan: Canvas Rendering & AI Visual Pipeline (Refocused) (Section 1.3)
"""

import asyncio
import logging
from typing import Any

import cv2
import numpy as np
from google import genai
from google.genai import types

from app.core.config import Settings, get_settings
from app.schemas.ai_provider import AIProvider, AIProviderConfig
from app.services.openai_compatible_client import OpenAICompatibleAuth, openai_compatible_client
from app.services.gemini_rest_client import GeminiRestAuth, gemini_rest_client
from app.services.sjinn_tool_client import SjinnAuth, sjinn_tool_client
from .exceptions import (
    ImageProcessingError,
    ImageGenerationError,
    InvalidAPIKeyError,
)

logger = logging.getLogger(__name__)

# Image generation defaults
# Default image model (can be overridden per-request via AIProviderConfig.gemini.model)
DEFAULT_GEMINI_IMAGE_MODEL = "gemini-3-pro-image-preview"
DEFAULT_OPENAI_IMAGE_SIZE = "1024x1024"
DEFAULT_ASPECT_RATIO = "16:9"


class AssetFactoryService:
    """Generate transparent PNG assets from image prompts.

    Image generation provider is selected per-request via `AIProviderConfig`:
    - Official Gemini image generation (google-genai)
    - OpenAI-compatible Images API

    Output bytes are then processed with OpenCV HSV Smart Key to remove white background.
    """

    def __init__(self, settings: Settings | None = None):
        """
        Initialize the Asset Factory service.
        
        Args:
            settings: Application settings. If None, loads from environment.
        """
        self._settings = settings or get_settings()
        self._gemini_client: genai.Client | None = None
    
    def _get_gemini_client(self, api_key: str) -> genai.Client:
        if not api_key:
            raise InvalidAPIKeyError()
        if self._gemini_client is None:
            self._gemini_client = genai.Client(api_key=api_key)
        return self._gemini_client
    
    async def generate_assets(
        self,
        image_prompts: list[str],
        ai_config: AIProviderConfig | None = None,
    ) -> list[bytes]:
        """
        Generate transparent PNG assets from image prompts in parallel.
        
        Args:
            image_prompts: List of image prompt strings (typically 5).
            
        Returns:
            List of transparent PNG bytes, one per prompt.
            
        Raises:
            ImageGenerationError: If image generation fails.
            ImageProcessingError: If image processing fails.
        """
        ai_config = ai_config or AIProviderConfig()

        logger.info(f"Starting parallel generation of {len(image_prompts)} assets")

        # Generate all images in parallel
        tasks = [
            self._generate_single_asset(prompt, index, ai_config)
            for index, prompt in enumerate(image_prompts)
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Check for exceptions and collect results
        processed_results: list[bytes] = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"Asset {i} generation failed: {result}")
                raise result
            processed_results.append(result)
        
        logger.info(f"Successfully generated {len(processed_results)} assets")
        return processed_results
    
    async def _generate_single_asset(self, prompt: str, index: int, ai_config: AIProviderConfig) -> bytes:
        """
        Generate a single transparent PNG asset from a prompt.
        
        Args:
            prompt: The image generation prompt.
            index: Index of this asset (for logging).
            
        Returns:
            Transparent PNG bytes.
            
        Raises:
            ImageGenerationError: If image generation fails.
            ImageProcessingError: If processing fails.
        """
        logger.info(f"Generating asset {index}: generating image bytes")

        image_bytes = await self._generate_image_bytes(prompt, ai_config=ai_config)
        logger.info(f"Asset {index}: generated {len(image_bytes)} bytes")

        # Process with OpenCV Smart Key
        transparent_png = self._process_image_with_smart_key(image_bytes, index)
        logger.info(f"Asset {index}: processed to transparent PNG ({len(transparent_png)} bytes)")

        return transparent_png
    
    async def _generate_image_bytes(self, prompt: str, *, ai_config: AIProviderConfig) -> bytes:
        """Generate raw image bytes (PNG/JPG) from a prompt using the selected provider."""

        try:
            if ai_config.provider == AIProvider.SJINN:
                if not ai_config.sjinn:
                    raise ImageGenerationError(
                        message="sjinn config is required when provider=sjinn",
                        code="IMAGE_PROVIDER_CONFIG_MISSING",
                        details={},
                    )

                auth = SjinnAuth(
                    base_url=str(ai_config.sjinn.base_url),
                    api_key=ai_config.sjinn.api_key,
                )

                # Only Pro model supports resolution parameter
                is_pro_model = ai_config.sjinn.model == "nano-banana-image-pro-api"
                
                task_id = await sjinn_tool_client.create_nano_banana_task(
                    auth=auth,
                    prompt=prompt,
                    tool_type=ai_config.sjinn.model,  # Use model from config
                    aspect_ratio=(ai_config.image_aspect_ratio or "auto"),
                    resolution=(ai_config.image_size or "1K") if is_pro_model else None,
                    image_list=[str(u) for u in ai_config.sjinn.image_list],
                )
                output_urls = await sjinn_tool_client.poll_task_output_urls(auth=auth, task_id=task_id)
                # SJinn returns output_urls (strings). Download first.
                return await sjinn_tool_client.download_bytes(auth=auth, url=output_urls[0])

            if ai_config.provider == AIProvider.OPENAI_COMPATIBLE:
                if not ai_config.openai_compatible:
                    raise ImageGenerationError(
                        message="openaiCompatible config is required when provider=openaiCompatible",
                        code="IMAGE_PROVIDER_CONFIG_MISSING",
                        details={},
                    )

                auth = OpenAICompatibleAuth(
                    base_url=str(ai_config.openai_compatible.base_url),
                    api_key=ai_config.openai_compatible.api_key,
                )

                # 1) Try the standard OpenAI Images API first
                try:
                    data = await openai_compatible_client.images_generations(
                        auth=auth,
                        model=ai_config.openai_compatible.model,
                        prompt=prompt,
                        size=(ai_config.image_size or DEFAULT_OPENAI_IMAGE_SIZE),
                        response_format="b64_json",
                        aspect_ratio=ai_config.image_aspect_ratio,
                    )

                    images = data.get("data") or []
                    if not images:
                        raise ImageGenerationError(
                            message="OpenAI-compatible image response missing data",
                            code="IMAGE_GENERATION_FAILED",
                            details={},
                        )
                    b64 = images[0].get("b64_json")
                    if not b64:
                        raise ImageGenerationError(
                            message="OpenAI-compatible image response missing b64_json",
                            code="IMAGE_GENERATION_FAILED",
                            details={},
                        )

                    import base64

                    return base64.b64decode(b64)
                except Exception as e:
                    # 2) Fallback: some OpenAI-compatible vendors implement image generation via
                    # /chat/completions with a multimodal response containing message.images[].
                    msg = str(e)
                    if "images error 404" not in msg and "404 page not found" not in msg:
                        raise

                # Chat-completions image generation fallback
                image_prompt = prompt
                if ai_config.image_aspect_ratio:
                    image_prompt += f"\n\naspect_ratio: {ai_config.image_aspect_ratio}"
                if ai_config.image_size:
                    image_prompt += f"\nsize: {ai_config.image_size}"

                message = await openai_compatible_client.chat_completions_message(
                    auth=auth,
                    model=ai_config.openai_compatible.model,
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "text",
                                    "text": (
                                        "Generate an image for the following prompt. "
                                        "Return the result as an image in the response.\n\n" + image_prompt
                                    ),
                                }
                            ],
                        }
                    ],
                    temperature=0.7,
                    max_tokens=2048,
                    response_format="text",
                )

                images = message.get("images") or []
                if not images:
                    raise ImageGenerationError(
                        message="OpenAI-compatible chat image response missing message.images",
                        code="IMAGE_GENERATION_FAILED",
                        details={"message": message},
                    )

                image_url = (images[0].get("image_url") or {}).get("url")
                if not image_url or not image_url.startswith("data:image/"):
                    raise ImageGenerationError(
                        message="OpenAI-compatible chat image response missing data:image URL",
                        code="IMAGE_GENERATION_FAILED",
                        details={"images": images[:1]},
                    )

                import base64

                b64_part = image_url.split(",", 1)[1]
                return base64.b64decode(b64_part)

            # Official Gemini image generation
            # Use generateContent with imageConfig (per Google docs) instead of models.generate_images,
            # because many Gemini image models (e.g., gemini-3-pro-image-preview) are exposed via
            # :generateContent and not supported for predict/generate_images.
            api_key = ai_config.resolve_gemini_api_key(self._settings.gemini_api_key)
            model_name = ai_config.resolve_gemini_model(DEFAULT_GEMINI_IMAGE_MODEL)
            if not model_name:
                raise ImageGenerationError(
                    message="Gemini image model name is required (configure it in /settings)",
                    code="IMAGE_PROVIDER_CONFIG_MISSING",
                    details={},
                )
            client = self._get_gemini_client(api_key)

            generation_config: dict[str, Any] = {}
            image_config: dict[str, Any] = {}
            if ai_config.image_aspect_ratio:
                # Docs use camelCase: aspectRatio
                image_config["aspectRatio"] = ai_config.image_aspect_ratio
            if ai_config.image_size:
                # Docs use camelCase: imageSize (e.g., "2K", "4K")
                image_config["imageSize"] = ai_config.image_size
            if image_config:
                generation_config["imageConfig"] = image_config

            # Use REST for `:generateContent` + `generationConfig.imageConfig` (per docs).
            image_config: dict[str, Any] = {}
            if ai_config.image_aspect_ratio:
                image_config["aspectRatio"] = ai_config.image_aspect_ratio
            if ai_config.image_size:
                image_config["imageSize"] = ai_config.image_size

            try:
                return await gemini_rest_client.generate_image_bytes(
                    auth=GeminiRestAuth(api_key=api_key),
                    model=model_name,
                    prompt=prompt,
                    image_config=(image_config or None),
                )
            except Exception as e:
                raise ImageGenerationError(
                    message=f"Gemini image generation failed: {e}",
                    code="IMAGE_GENERATION_FAILED",
                    details={"model": model_name},
                )

        except InvalidAPIKeyError:
            raise
        except Exception as e:
            msg = str(e).lower()
            if "api key" in msg or "authentication" in msg or "401" in msg:
                raise InvalidAPIKeyError()
            raise ImageGenerationError(
                message=f"Image generation failed: {e}",
                code="IMAGE_GENERATION_FAILED",
                details={},
            )
    
    def _process_image_with_smart_key(self, image_bytes: bytes, index: int) -> bytes:
        """
        Process image with OpenCV HSV Smart Key to remove white background.
        
        Preserves teal (H: 80-100) and orange (H: 10-25) accent colors
        while making the white background transparent.
        
        Args:
            image_bytes: Raw image bytes.
            index: Asset index (for logging).
            
        Returns:
            Transparent PNG bytes.
            
        Raises:
            ImageProcessingError: If processing fails.
        """
        try:
            # Convert bytes to numpy array
            nparr = np.frombuffer(image_bytes, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if image is None:
                raise ImageProcessingError(f"Failed to decode image {index}")
            
            # Convert BGR to HSV for color analysis
            hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
            
            # Define white background range in HSV
            # H: 0-180 (any hue), S: 0-30 (low saturation), V: 200-255 (high value/brightness)
            white_lower = np.array([0, 0, 200])
            white_upper = np.array([180, 30, 255])
            
            # Create mask for white pixels (background)
            white_mask = cv2.inRange(hsv, white_lower, white_upper)
            
            # Define teal color range in HSV (to preserve)
            # Teal is typically around H: 80-100 in OpenCV's 0-180 range
            teal_lower = np.array([80, 50, 50])
            teal_upper = np.array([100, 255, 255])
            teal_mask = cv2.inRange(hsv, teal_lower, teal_upper)
            
            # Define orange color range in HSV (to preserve)
            # Orange is typically around H: 10-25 in OpenCV's 0-180 range
            orange_lower = np.array([10, 50, 50])
            orange_upper = np.array([25, 255, 255])
            orange_mask = cv2.inRange(hsv, orange_lower, orange_upper)
            
            # Combine accent color masks (pixels to preserve even if near-white)
            accent_mask = cv2.bitwise_or(teal_mask, orange_mask)
            
            # Final background mask: white pixels that are NOT accent colors
            background_mask = cv2.bitwise_and(white_mask, cv2.bitwise_not(accent_mask))
            
            # Convert image to BGRA (add alpha channel)
            bgra = cv2.cvtColor(image, cv2.COLOR_BGR2BGRA)
            
            # Set alpha channel: 0 for background, 255 for foreground
            # Invert the background mask to get foreground mask
            foreground_mask = cv2.bitwise_not(background_mask)
            bgra[:, :, 3] = foreground_mask
            
            # Encode as PNG with transparency
            success, png_bytes = cv2.imencode('.png', bgra)
            
            if not success:
                raise ImageProcessingError(f"Failed to encode PNG for asset {index}")
            
            return png_bytes.tobytes()
            
        except ImageProcessingError:
            raise
        except Exception as e:
            raise ImageProcessingError(f"OpenCV processing error for asset {index}: {e}")


# Module-level singleton for performance
asset_factory_service = AssetFactoryService()
