"""
Image Steering Service

Responsible for AI-powered image generation and manipulation.
This is a placeholder for the MVP implementation.
"""


class ImageSteeringService:
    """Service for AI image generation and steering."""
    
    async def generate_image(self, prompt: str) -> bytes:
        """Generate an image from a text prompt."""
        raise NotImplementedError("Image steering service not yet implemented")
    
    async def refine_image(self, image: bytes, adjustments: dict) -> bytes:
        """Refine an existing image with adjustments."""
        raise NotImplementedError("Image steering service not yet implemented")
