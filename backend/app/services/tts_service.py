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


class TTSService:
    """Service for text-to-speech conversion."""
    
    async def synthesize(self, text: str, voice_id: str | None = None) -> bytes:
        """Convert text to speech audio."""
        raise NotImplementedError("TTS service not yet implemented")
    
    async def list_voices(self) -> list[dict]:
        """List available voices for TTS."""
        raise NotImplementedError("TTS service not yet implemented")
