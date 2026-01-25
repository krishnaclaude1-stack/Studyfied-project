"""
Image Steering Service

Generates exactly 5 image prompts for sketchnote-style educational visuals.

Implementation Guide:
- Prompt Specification: docs/prompt-spec.md (lines 1-279)
- Key Requirements:
  - Generate exactly 5 image prompts (one per visual beat)
  - Black-and-white sketchnote style with teal/orange accents
  - Emphasis on explanatory internal structure over icon-like simplicity
  - Hand-drawn aesthetic, not photorealistic
- Related Ticket: T3 - AI Pipeline - Visual Asset Generation
"""

import asyncio
import json
import logging
from typing import Any

from google import genai
from google.genai import types
from pydantic import ValidationError

from app.core.config import Settings, get_settings
from app.schemas.image_generation import ImageSteeringResponse
from .exceptions import (
    InvalidAPIKeyError,
    ImagePromptGenerationError,
    InvalidImagePromptCountError,
)

logger = logging.getLogger(__name__)

# Mandatory prefix that must appear in every image prompt (from docs/prompt-spec.md)
MANDATORY_PROMPT_PREFIX = "Sketchnote-style black-and-white instructional illustration"

# Image Steering system prompt based on docs/prompt-spec.md (lines 1-279)
IMAGE_STEERING_SYSTEM_PROMPT = """You are a professional Sketchnote artist, storyboard planner, and information designer specializing in whiteboard-style educational videos.

PRIMARY OBJECTIVE:
Your sole output is to analyze the given topic and generate image prompts only, designed for a 3-minute sketchnote-style video lecture.

CONSTRAINTS:
- You do NOT generate images.
- You do NOT explain the topic in long text.
- Storyboard structure is allowed only to support image prompt planning.

ALLOWED OUTPUT:
- Structured storyboard planning
- High-quality image prompts suitable for an image generation model

TASK:
Given a topic or text input:

1. Analyze the content:
   - Identify the core idea, sub-ideas, processes, cause-effect relationships, and outcomes.
   - Think like a sketchnote artist planning a video narration.

2. Storyboard the explanation:
   - Break the topic into exactly 5 visual beats (scenes) suitable for ~3 minutes of explanation.
   - Every beat must correspond to one image prompt (no more, no fewer).
   - Decide whether each beat should be:
     - A single large illustration
     - A grid of small illustrations (e.g., 2x2 or 4x4 assets) for modular narration

3. Generate IMAGE PROMPTS ONLY:
   - Each storyboard beat must output a standalone image prompt.
   - Produce exactly 5 image prompts total (Image_1 through Image_5).
   - Prompts should be clear, explicit, and optimized for an image generation model.

IMAGE PROMPT STYLE RULES (CRITICAL):

Master Visual Style Rule (GLOBAL):
Black-and-white sketchnote style with restrained color accents:
Apply flat, muted color markers (specifically teal, orange, or muted red) to at most two semantic elements for emphasis; all other elements must remain black line art on a pure white background. Use each color only to encode meaning, not decoration.
Illustrations must prioritize explanatory internal structure over icon-like simplicity.

Style Anchor Rule:
Maintain consistency via Stateless Description.
Since the image generator cannot see previous panels, do NOT write "Same character as before".
Instead, re-state the unique visual identifiers (e.g., "The water molecule character (blue, round, big eyes, wearing glasses)") in EVERY prompt where that character appears.

Negative Prompt Strategy:
Use negative constraints to prevent style drift.
Explicitly forbid: "photorealistic", "shaded", "gradient", "3d render", "complex background", "text clutter", "minimalist", "icon-only".
These prohibitions MUST be explicitly written inside every Image_Prompt string.

Semantic Color Consistency Rule:
If an accent color is used to represent a concept (e.g., energy source, life base, producer level), that same color must be applied consistently to all visually equivalent or parallel concepts across all scenes or grid cells.
Do not leave an alternative or parallel concept uncolored.

Grid Slicing Optimization:
For grid layouts (2x2, 4x4), strictly ensure "island" separation.
Surround each cell with at least 10% whitespace margin to facilitate automated slicing (OpenCV/Potrace). No elements may bridge the gap.

Style Guidelines:
- Style: Sketchnote / Excalidraw-style hand-drawn illustration
- Lines: Black marker-style strokes, slightly imperfect, handwritten feel
- Color Usage: Default black ink only; accent colors follow Master Visual Style Rule
- Icons: Simple, minimal icons (1-2 per concept)
- Text: Labels must be short (1-3 words) and placed near relevant elements, hand-written style font
- Composition: Clear visual hierarchy, plenty of white space, no overlapping arrows, logical flow

Prohibited:
- Gradients, Shadows, Photos, 3D effects, Realistic rendering
- Color fills beyond the allowed accents
- Complex text descriptions (show, don't tell)

Grid Image Constraints (for grid layouts):
- Treat each grid cell as an independent mini-canvas
- Each cell must have one self-contained idea
- No arrows, lines, or connectors crossing cell boundaries
- Leave thick white margins between grid cells
- All arrows must stay fully inside a single grid cell
- If a concept requires cross-relationships, use multiple standalone images, NOT a grid layout

MANDATORY IMAGE PROMPT PREFIX (include in EVERY prompt):
"Sketchnote-style black-and-white instructional illustration, hand-drawn marker lines on a pure white background, with visible internal structure for teaching. NOT photorealistic, NOT shaded, NOT gradient, NOT 3d render, NOT complex background, NOT text clutter, NOT minimalist, NOT icon-only."

OUTPUT FORMAT (strict JSON):
{
  "storyboard_overview": {
    "total_images": 5,
    "visual_flow": "brief 1-2 lines describing progression"
  },
  "images": [
    {
      "purpose": "what this visual explains",
      "layout_type": "Single / 2x2 Grid / 4x4 Grid",
      "image_prompt": "MANDATORY PREFIX + full detailed prompt"
    },
    // ... exactly 5 image objects
  ]
}"""


class ImageSteeringService:
    """
    Service for generating image prompts for visual assets.
    
    Uses Gemini 3 Flash Preview to create 5 image prompts optimized for
    Nano Banana Pro image generation.
    See docs/prompt-spec.md section "Image Steering Prompt (Visual Style)"
    for complete prompt specification and style rules.
    """
    
    def __init__(self, settings: Settings | None = None):
        """
        Initialize the Image Steering service.
        
        Args:
            settings: Application settings. If None, loads from environment.
        """
        self._settings = settings or get_settings()
        self._client: genai.Client | None = None
        self._model_name = "gemini-3-flash-preview"
    
    def _get_client(self) -> genai.Client:
        """
        Get or create the Gemini client.
        
        Returns:
            Initialized Gemini client.
            
        Raises:
            InvalidAPIKeyError: If API key is not configured.
        """
        if not self._settings.gemini_api_key:
            raise InvalidAPIKeyError()
        
        if self._client is None:
            self._client = genai.Client(api_key=self._settings.gemini_api_key)
        
        return self._client
    
    async def generate_image_prompts(self, topic_text: str, retry_count: int = 0) -> dict[str, Any]:
        """
        Generate exactly 5 image prompts from topic text using Gemini.
        
        Args:
            topic_text: The topic text to create image prompts for.
            retry_count: Current retry attempt (max 1 retry).
            
        Returns:
            Dictionary containing the storyboard overview and 5 image prompts.
            
        Raises:
            InvalidAPIKeyError: If API key is invalid.
            ImagePromptGenerationError: If generation fails after retries.
            InvalidImagePromptCountError: If fewer than 5 prompts generated after retry.
        """
        client = self._get_client()
        
        # Construct the user prompt
        user_prompt = f"""Analyze the following topic and generate exactly 5 image prompts for a sketchnote-style educational video:

---BEGIN TOPIC---
{topic_text}
---END TOPIC---

Generate exactly 5 image prompts following the rules. Output valid JSON only."""

        try:
            # Call Gemini API with JSON response format
            # Wrap synchronous call in asyncio.to_thread to avoid blocking the event loop
            response = await asyncio.to_thread(
                client.models.generate_content,
                model=self._model_name,
                contents=[
                    types.Content(
                        role="user",
                        parts=[types.Part(text=IMAGE_STEERING_SYSTEM_PROMPT + "\n\n" + user_prompt)]
                    )
                ],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.7,
                    max_output_tokens=4096,
                )
            )
            
            # Extract response text
            if not response.text:
                raise ImagePromptGenerationError("Empty response from Gemini API")
            
            # Parse JSON response
            try:
                result = json.loads(response.text)
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse Gemini response as JSON: {e}")
                if retry_count < 1:
                    logger.info("Retrying request (attempt 2/2)...")
                    return await self.generate_image_prompts(topic_text, retry_count + 1)
                raise ImagePromptGenerationError(f"Invalid JSON response: {e}")
            
            # Validate with Pydantic
            try:
                validated = ImageSteeringResponse(**result)
                
                # Enforce exactly 5 prompts - slice if more than 5
                if len(validated.images) > 5:
                    logger.warning(f"Received {len(validated.images)} prompts, slicing to first 5")
                    validated.images = validated.images[:5]
                
                # If fewer than 5, retry or error
                if len(validated.images) < 5:
                    logger.warning(f"Received only {len(validated.images)} prompts, expected 5")
                    if retry_count < 1:
                        logger.info("Retrying request due to insufficient prompts (attempt 2/2)...")
                        return await self.generate_image_prompts(topic_text, retry_count + 1)
                    raise InvalidImagePromptCountError(len(validated.images), 5)
                
                # Validate mandatory prefix in all prompts
                missing_prefix_indices = []
                for i, img in enumerate(validated.images):
                    if MANDATORY_PROMPT_PREFIX.lower() not in img.image_prompt.lower():
                        missing_prefix_indices.append(i)
                
                if missing_prefix_indices:
                    logger.warning(f"Prompts at indices {missing_prefix_indices} missing mandatory prefix")
                    if retry_count < 1:
                        logger.info("Retrying request due to missing mandatory prefix (attempt 2/2)...")
                        return await self.generate_image_prompts(topic_text, retry_count + 1)
                    raise ImagePromptGenerationError(
                        f"Image prompts at indices {missing_prefix_indices} missing mandatory sketchnote prefix"
                    )
                
                logger.info(f"Successfully generated {len(validated.images)} image prompts")
                return validated.model_dump(by_alias=True)
                
            except ValidationError as e:
                logger.error(f"Pydantic validation failed: {e}")
                if retry_count < 1:
                    logger.info("Retrying request due to validation failure (attempt 2/2)...")
                    return await self.generate_image_prompts(topic_text, retry_count + 1)
                raise ImagePromptGenerationError(f"Response validation failed: {e}")
                
        except InvalidAPIKeyError:
            raise
        except (ImagePromptGenerationError, InvalidImagePromptCountError):
            raise
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            error_str = str(e).lower()
            if "api key" in error_str or "authentication" in error_str or "401" in error_str:
                raise InvalidAPIKeyError()
            raise ImagePromptGenerationError(f"Gemini API error: {e}")


# Module-level singleton for performance
image_steering_service = ImageSteeringService()
