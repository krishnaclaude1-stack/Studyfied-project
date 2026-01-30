"""
Text-to-Speech Service

Responsible for converting text to speech audio.
This is a placeholder for the MVP implementation.
"""


class TTSService:
    """Service for text-to-speech conversion."""
    
    async def synthesize(self, text: str, voice_id: str | None = None) -> bytes:
        """Convert text to speech audio."""
        raise NotImplementedError("TTS service not yet implemented")
    
    async def list_voices(self) -> list[dict]:
        """List available voices for TTS."""
        raise NotImplementedError("TTS service not yet implemented")
