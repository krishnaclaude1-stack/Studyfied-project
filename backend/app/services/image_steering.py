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


class ImageSteeringService:
    """
    Service for generating image prompts for visual assets.
    
    Uses Gemini 3 Flash Preview to create 5 image prompts optimized for
    Nano Banana Pro image generation.
    See docs/prompt-spec.md section "Image Steering Prompt (Visual Style)"
    for complete prompt specification and style rules.
    """
    
    async def generate_image(self, prompt: str) -> bytes:
        """Generate an image from a text prompt."""
        raise NotImplementedError("Image steering service not yet implemented")
    
    async def refine_image(self, image: bytes, adjustments: dict) -> bytes:
        """Refine an existing image with adjustments."""
        raise NotImplementedError("Image steering service not yet implemented")
