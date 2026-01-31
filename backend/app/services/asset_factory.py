"""
Asset Factory Service

Generates transparent PNG assets from image prompts using Nano Banana Pro.

Implementation Guide:
- Uses Nano Banana Pro API (apifree.ai) for image generation
- Applies OpenCV Smart Key for background removal
- Preserves teal/orange accents while removing white background
- Generates 5 images in parallel for performance
- Related Ticket: T3 - AI Pipeline - Visual Asset Generation
- Tech Plan: Canvas Rendering & AI Visual Pipeline (Refocused) (Section 1.3)
"""

import asyncio
import logging
from typing import Any

import aiohttp
import cv2
import numpy as np

from app.core.config import Settings, get_settings
from .exceptions import (
    NanoBananaAPIError,
    ImageProcessingError,
)

logger = logging.getLogger(__name__)

# Nano Banana API configuration
NANO_BANANA_BASE_URL = "https://api.apifree.ai"
NANO_BANANA_MODEL = "google/nano-banana-pro"
DEFAULT_ASPECT_RATIO = "16:9"
DEFAULT_RESOLUTION = "2K"

# Polling configuration - targeting ~2 minute ceiling per image
# With 2s initial interval and 1.2x backoff capped at 5s, 30 attempts ≈ 2 minutes
POLL_INITIAL_INTERVAL = 2  # seconds
POLL_MAX_ATTEMPTS = 30  # ~2 minutes max with backoff
POLL_BACKOFF_MULTIPLIER = 1.2  # Gentle exponential backoff
POLL_MAX_INTERVAL = 5  # Max interval between polls (seconds)

# HTTP client timeouts (seconds)
HTTP_TOTAL_TIMEOUT = 60  # Total timeout for any single HTTP request
HTTP_CONNECT_TIMEOUT = 10  # Timeout for establishing connection
HTTP_READ_TIMEOUT = 30  # Timeout for reading response


class AssetFactoryService:
    """
    Service for generating transparent PNG assets from image prompts.
    
    Uses Nano Banana Pro API for image generation and OpenCV for
    background removal with HSV Smart Key processing.
    """
    
    def __init__(self, settings: Settings | None = None):
        """
        Initialize the Asset Factory service.
        
        Args:
            settings: Application settings. If None, loads from environment.
        """
        self._settings = settings or get_settings()
        self._session: aiohttp.ClientSession | None = None
    
    def _get_headers(self) -> dict[str, str]:
        """
        Get HTTP headers for Nano Banana API requests.
        
        Returns:
            Dictionary of headers including authorization.
            
        Raises:
            NanoBananaAPIError: If API key is not configured.
        """
        if not self._settings.nano_banana_api_key:
            raise NanoBananaAPIError("Nano Banana API key is not configured")
        
        return {
            "Authorization": f"Bearer {self._settings.nano_banana_api_key}",
            "Content-Type": "application/json"
        }
    
    async def _get_session(self) -> aiohttp.ClientSession:
        """
        Get or create the aiohttp session with configured timeouts.
        
        Returns:
            Active aiohttp ClientSession with timeout configuration.
        """
        if self._session is None or self._session.closed:
            timeout = aiohttp.ClientTimeout(
                total=HTTP_TOTAL_TIMEOUT,
                connect=HTTP_CONNECT_TIMEOUT,
                sock_read=HTTP_READ_TIMEOUT
            )
            self._session = aiohttp.ClientSession(timeout=timeout)
        return self._session
    
    async def close(self) -> None:
        """Close the aiohttp session."""
        if self._session and not self._session.closed:
            await self._session.close()
    
    async def generate_assets(self, image_prompts: list[str]) -> list[bytes]:
        """
        Generate transparent PNG assets from image prompts in parallel.
        
        Args:
            image_prompts: List of image prompt strings (typically 5).
            
        Returns:
            List of transparent PNG bytes, one per prompt.
            
        Raises:
            NanoBananaAPIError: If API calls fail.
            ImageProcessingError: If image processing fails.
        """
        logger.info(f"Starting parallel generation of {len(image_prompts)} assets")
        
        # Generate all images in parallel
        tasks = [
            self._generate_single_asset(prompt, index)
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
    
    async def _generate_single_asset(self, prompt: str, index: int) -> bytes:
        """
        Generate a single transparent PNG asset from a prompt.
        
        Args:
            prompt: The image generation prompt.
            index: Index of this asset (for logging).
            
        Returns:
            Transparent PNG bytes.
            
        Raises:
            NanoBananaAPIError: If API call fails.
            ImageProcessingError: If processing fails.
        """
        logger.info(f"Generating asset {index}: submitting to Nano Banana API")
        
        # Step 1: Submit request to Nano Banana API
        request_id = await self._submit_image_request(prompt)
        logger.info(f"Asset {index}: received request_id={request_id}")
        
        # Step 2: Poll for completion
        image_url = await self._poll_for_result(request_id, index)
        logger.info(f"Asset {index}: image ready at {image_url[:50]}...")
        
        # Step 3: Download the image
        image_bytes = await self._download_image(image_url)
        logger.info(f"Asset {index}: downloaded {len(image_bytes)} bytes")
        
        # Step 4: Process with OpenCV Smart Key
        transparent_png = self._process_image_with_smart_key(image_bytes, index)
        logger.info(f"Asset {index}: processed to transparent PNG ({len(transparent_png)} bytes)")
        
        return transparent_png
    
    async def _submit_image_request(self, prompt: str) -> str:
        """
        Submit an image generation request to Nano Banana API.
        
        Args:
            prompt: The image generation prompt.
            
        Returns:
            The request_id for polling.
            
        Raises:
            NanoBananaAPIError: If submission fails.
        """
        session = await self._get_session()
        headers = self._get_headers()
        
        payload = {
            "model": NANO_BANANA_MODEL,
            "prompt": prompt,
            "aspect_ratio": DEFAULT_ASPECT_RATIO,
            "resolution": DEFAULT_RESOLUTION
        }
        
        url = f"{NANO_BANANA_BASE_URL}/v1/image/submit"
        
        try:
            async with session.post(url, headers=headers, json=payload) as response:
                if response.status != 200:
                    text = await response.text()
                    raise NanoBananaAPIError(
                        f"Submit request failed with status {response.status}: {text}",
                        status_code=response.status
                    )
                
                data = await response.json()
                
                if data.get("code") != 200:
                    raise NanoBananaAPIError(
                        f"API error: {data.get('code_msg', 'Unknown error')}",
                        status_code=data.get("code")
                    )
                
                request_id = data.get("resp_data", {}).get("request_id")
                if not request_id:
                    raise NanoBananaAPIError("No request_id in response")
                
                return request_id
                
        except asyncio.TimeoutError:
            raise NanoBananaAPIError("Request timeout during submit")
        except aiohttp.ClientError as e:
            raise NanoBananaAPIError(f"Network error during submit: {e}")
    
    async def _poll_for_result(self, request_id: str, index: int) -> str:
        """
        Poll for image generation completion.
        
        Args:
            request_id: The request ID to poll.
            index: Asset index (for logging).
            
        Returns:
            The URL of the generated image.
            
        Raises:
            NanoBananaAPIError: If polling fails or times out.
        """
        session = await self._get_session()
        headers = self._get_headers()
        url = f"{NANO_BANANA_BASE_URL}/v1/image/{request_id}/result"
        
        interval = POLL_INITIAL_INTERVAL
        
        for attempt in range(POLL_MAX_ATTEMPTS):
            try:
                async with session.get(url, headers=headers) as response:
                    if response.status != 200:
                        text = await response.text()
                        raise NanoBananaAPIError(
                            f"Poll request failed with status {response.status}: {text}",
                            status_code=response.status,
                            request_id=request_id
                        )
                    
                    data = await response.json()
                    
                    if data.get("code") != 200:
                        raise NanoBananaAPIError(
                            f"API error: {data.get('code_msg', 'Unknown error')}",
                            status_code=data.get("code"),
                            request_id=request_id
                        )
                    
                    resp_data = data.get("resp_data", {})
                    status = resp_data.get("status", "")
                    
                    if status == "success":
                        image_list = resp_data.get("image_list", [])
                        if not image_list:
                            raise NanoBananaAPIError(
                                "No images in response",
                                request_id=request_id
                            )
                        return image_list[0]
                    
                    elif status in ("error", "failed"):
                        error_msg = resp_data.get("error", "Unknown error")
                        raise NanoBananaAPIError(
                            f"Image generation failed: {error_msg}",
                            request_id=request_id
                        )
                    
                    elif status in ("processing", "queuing"):
                        logger.debug(f"Asset {index}: status={status}, attempt {attempt + 1}/{POLL_MAX_ATTEMPTS}")
                    
                    else:
                        logger.warning(f"Asset {index}: unknown status '{status}'")
                
            except asyncio.TimeoutError:
                logger.warning(f"Asset {index}: request timeout during poll attempt {attempt + 1}")
            except aiohttp.ClientError as e:
                logger.warning(f"Asset {index}: network error during poll: {e}")
            
            # Wait before next poll with exponential backoff
            await asyncio.sleep(interval)
            interval = min(interval * POLL_BACKOFF_MULTIPLIER, POLL_MAX_INTERVAL)
        
        raise NanoBananaAPIError(
            f"Timeout waiting for image generation after {POLL_MAX_ATTEMPTS} attempts (~2 minutes)",
            request_id=request_id
        )
    
    async def _download_image(self, url: str) -> bytes:
        """
        Download an image from URL.
        
        Args:
            url: The image URL.
            
        Returns:
            Image bytes.
            
        Raises:
            NanoBananaAPIError: If download fails.
        """
        session = await self._get_session()
        
        try:
            async with session.get(url) as response:
                if response.status != 200:
                    raise NanoBananaAPIError(
                        f"Image download failed with status {response.status}"
                    )
                return await response.read()
                
        except asyncio.TimeoutError:
            raise NanoBananaAPIError("Request timeout during image download")
        except aiohttp.ClientError as e:
            raise NanoBananaAPIError(f"Network error during image download: {e}")
    
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
