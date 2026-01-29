"""
Text-to-Speech Service

Converts narration text to speech audio for lesson playback.

Implementation Guide:
- Production: ElevenLabs API (Rachel voice)
- Development: Browser TTS fallback
- Input: Narration text from AI Director
- Output: Audio blob URL for playback
- Related Ticket: T4 - AI Pipeline - Lesson Script Generation & Audio
- Tech Plan: Canvas Rendering & AI Visual Pipeline (Refocused) (Section 3.2)
"""

import asyncio
import logging
from io import BytesIO

from app.core.config import Settings, get_settings
from .exceptions import ElevenLabsAPIError, AudioGenerationError

logger = logging.getLogger(__name__)

# Rachel voice ID for ElevenLabs
RACHEL_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"


class TTSService:
    """
    Service for text-to-speech conversion.
    
    Uses ElevenLabs API in production with Rachel voice.
    Falls back to empty audio in development (browser TTS handles playback).
    """
    
    def __init__(self, settings: Settings | None = None):
        """
        Initialize the TTS service.
        
        Args:
            settings: Application settings. If None, loads from environment.
        """
        self._settings = settings or get_settings()
        self._client = None
    
    def _get_client(self):
        """
        Get or create the ElevenLabs client.
        
        Returns:
            Initialized ElevenLabs client or None if not configured.
        """
        if not self._settings.elevenlabs_api_key:
            logger.warning("ElevenLabs API key not configured - TTS will return empty audio")
            return None
        
        if self._client is None:
            try:
                from elevenlabs.client import AsyncElevenLabs
                self._client = AsyncElevenLabs(api_key=self._settings.elevenlabs_api_key)
            except ImportError:
                logger.error("elevenlabs package not installed - install with: pip install elevenlabs")
                return None
        
        return self._client
    
    async def synthesize_narration(
        self,
        narration_segments: list[dict],
        voice_id: str | None = None,
        elevenlabs_api_key: str | None = None,
    ) -> bytes:
        """
        Synthesize narration text to speech audio.
        
        Args:
            narration_segments: List of voiceover segments with 'text' and 'checkpointId'.
            voice_id: Voice ID to use. Defaults to Rachel voice.
            
        Returns:
            Audio bytes in MP3 format, or empty bytes if ElevenLabs is not configured.
            
        Raises:
            ElevenLabsAPIError: If API call fails.
            AudioGenerationError: If audio generation fails.
        """
        client = None
        if elevenlabs_api_key:
            try:
                from elevenlabs.client import AsyncElevenLabs

                client = AsyncElevenLabs(api_key=elevenlabs_api_key)
            except ImportError:
                logger.error("elevenlabs package not installed - install with: pip install elevenlabs")
                client = None
        else:
            client = self._get_client()
        
        # Extract all narration text
        narration_texts = [segment.get("text", "") for segment in narration_segments]
        full_text = " ... ".join(narration_texts)  # Add pauses between segments
        
        if not full_text.strip():
            raise AudioGenerationError("No narration text provided")
        
        # Development mode: return empty audio (frontend will use browser TTS)
        if client is None:
            logger.info("Returning empty audio (development mode - browser TTS will handle playback)")
            return b""
        
        # Production mode: use ElevenLabs
        try:
            voice_id = voice_id or RACHEL_VOICE_ID
            
            logger.info(f"Generating TTS audio with ElevenLabs (voice: {voice_id}, {len(full_text)} chars)")
            
            # Call ElevenLabs API
            audio_generator = client.text_to_speech.convert(
                voice_id=voice_id,
                text=full_text,
                model_id="eleven_multilingual_v2",
                output_format="mp3_44100_128",
            )
            
            # Collect audio chunks
            audio_buffer = BytesIO()
            async for chunk in audio_generator:
                audio_buffer.write(chunk)
            
            audio_bytes = audio_buffer.getvalue()
            
            if not audio_bytes:
                raise AudioGenerationError("ElevenLabs returned empty audio")
            
            logger.info(f"Successfully generated {len(audio_bytes)} bytes of audio")
            return audio_bytes
            
        except Exception as e:
            logger.error(f"ElevenLabs API error: {e}")
            error_str = str(e).lower()
            
            if "api key" in error_str or "authentication" in error_str or "401" in error_str:
                raise ElevenLabsAPIError("Invalid API key", status_code=401)
            
            if "quota" in error_str or "limit" in error_str:
                raise ElevenLabsAPIError("API quota exceeded", status_code=429)
            
            raise ElevenLabsAPIError(str(e))
    
    async def get_audio_duration(self, audio_bytes: bytes) -> float:
        """
        Extract audio duration from audio bytes.
        
        Args:
            audio_bytes: Audio data in MP3 format.
            
        Returns:
            Duration in seconds.
            
        Raises:
            AudioGenerationError: If duration extraction fails.
        """
        if not audio_bytes:
            return 0.0
        
        try:
            # Try using mutagen for MP3 duration
            from mutagen.mp3 import MP3
            from io import BytesIO
            
            audio_file = BytesIO(audio_bytes)
            audio = MP3(audio_file)
            duration = audio.info.length
            
            logger.info(f"Audio duration: {duration:.2f} seconds")
            return duration
            
        except ImportError:
            logger.warning("mutagen not installed - cannot extract audio duration")
            # Estimate duration based on text length (rough approximation: ~150 words per minute)
            # This is a fallback and should not be relied upon
            return 0.0
        except Exception as e:
            logger.error(f"Failed to extract audio duration: {e}")
            raise AudioGenerationError(f"Failed to extract audio duration: {e}")


# Module-level singleton for performance
tts_service = TTSService()
