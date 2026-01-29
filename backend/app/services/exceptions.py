"""
Custom exceptions for service layer.

Defines specific exceptions for content ingestion and topic extraction errors.
"""


class ContentIngestorError(Exception):
    """Base exception for content ingestor errors."""
    
    def __init__(self, message: str, code: str, details: dict | None = None):
        self.message = message
        self.code = code
        self.details = details or {}
        super().__init__(self.message)


class URLNotAccessibleError(ContentIngestorError):
    """Raised when a URL cannot be accessed."""
    
    def __init__(self, url: str, reason: str = "URL is not accessible"):
        super().__init__(
            message=f"Cannot access URL: {reason}",
            code="URL_NOT_ACCESSIBLE",
            details={"url": url, "reason": reason}
        )


class PDFTooLargeError(ContentIngestorError):
    """Raised when a PDF exceeds the size limit."""
    
    def __init__(self, size_bytes: int, max_size_bytes: int = 10 * 1024 * 1024):
        super().__init__(
            message=f"PDF file size ({size_bytes / 1024 / 1024:.2f}MB) exceeds maximum allowed ({max_size_bytes / 1024 / 1024:.0f}MB)",
            code="PDF_TOO_LARGE",
            details={"size_bytes": size_bytes, "max_size_bytes": max_size_bytes}
        )


class PDFInvalidError(ContentIngestorError):
    """Raised when a PDF is corrupted or password-protected."""
    
    def __init__(self, reason: str = "PDF is invalid or corrupted"):
        super().__init__(
            message=reason,
            code="PDF_INVALID",
            details={"reason": reason}
        )


class ContentExtractionError(ContentIngestorError):
    """Raised when content extraction fails."""
    
    def __init__(self, source: str, reason: str = "Failed to extract content"):
        super().__init__(
            message=f"Content extraction failed: {reason}",
            code="CONTENT_EXTRACTION_FAILED",
            details={"source": source, "reason": reason}
        )


class ContentTooShortError(ContentIngestorError):
    """Raised when extracted content is too short."""
    
    def __init__(self, length: int, min_length: int = 100):
        super().__init__(
            message=f"Extracted content too short ({length} chars). Minimum required: {min_length} chars",
            code="CONTENT_TOO_SHORT",
            details={"length": length, "min_length": min_length}
        )


class ContentTooLongError(ContentIngestorError):
    """Raised when extracted content exceeds maximum length."""
    
    def __init__(self, length: int, max_length: int = 50000):
        super().__init__(
            message=f"Extracted content too long ({length} chars). Maximum allowed: {max_length} chars",
            code="CONTENT_TOO_LONG",
            details={"length": length, "max_length": max_length}
        )


class TopicExtractionError(Exception):
    """Base exception for topic extraction errors."""
    
    def __init__(self, message: str, code: str, details: dict | None = None):
        self.message = message
        self.code = code
        self.details = details or {}
        super().__init__(self.message)


class InvalidAPIKeyError(TopicExtractionError):
    """Raised when the Gemini API key is invalid or missing."""
    
    def __init__(self):
        super().__init__(
            message="Gemini API key is invalid or not configured",
            code="INVALID_API_KEY",
            details={}
        )


class TopicExtractionFailedError(TopicExtractionError):
    """Raised when topic extraction fails."""
    
    def __init__(self, reason: str = "Failed to extract topics from content"):
        super().__init__(
            message=reason,
            code="TOPIC_EXTRACTION_FAILED",
            details={"reason": reason}
        )


class ImageGenerationError(Exception):
    """Base exception for image generation errors."""
    
    def __init__(self, message: str, code: str, details: dict | None = None):
        self.message = message
        self.code = code
        self.details = details or {}
        super().__init__(self.message)


class ImagePromptGenerationError(ImageGenerationError):
    """Raised when Gemini fails to generate valid image prompts."""
    
    def __init__(self, reason: str = "Failed to generate image prompts"):
        super().__init__(
            message=reason,
            code="IMAGE_PROMPT_GENERATION_FAILED",
            details={"reason": reason}
        )


class InvalidImagePromptCountError(ImageGenerationError):
    """Raised when prompt count is not exactly 5."""
    
    def __init__(self, count: int, expected: int = 5):
        super().__init__(
            message=f"Invalid image prompt count: {count}. Expected exactly {expected} prompts.",
            code="INVALID_IMAGE_PROMPT_COUNT",
            details={"count": count, "expected": expected}
        )


# Nano Banana exception removed (legacy).


class ImageProcessingError(ImageGenerationError):
    """Raised when OpenCV processing fails."""
    
    def __init__(self, reason: str = "Image processing failed"):
        super().__init__(
            message=f"Image processing error: {reason}",
            code="IMAGE_PROCESSING_ERROR",
            details={"reason": reason}
        )


class LessonGenerationError(Exception):
    """Base exception for lesson generation errors."""
    
    def __init__(self, message: str, code: str, details: dict | None = None):
        self.message = message
        self.code = code
        self.details = details or {}
        super().__init__(self.message)


class LessonScriptGenerationError(LessonGenerationError):
    """Raised when Gemini fails to generate valid lesson script."""
    
    def __init__(self, reason: str = "Failed to generate lesson script"):
        super().__init__(
            message=reason,
            code="LESSON_SCRIPT_GENERATION_FAILED",
            details={"reason": reason}
        )


class InvalidLessonDurationError(LessonGenerationError):
    """Raised when lesson duration exceeds 180 seconds."""
    
    def __init__(self, duration: float, max_duration: float = 180.0):
        super().__init__(
            message=f"Lesson duration ({duration}s) exceeds maximum allowed ({max_duration}s)",
            code="INVALID_LESSON_DURATION",
            details={"duration": duration, "max_duration": max_duration}
        )


class InvalidSceneCountError(LessonGenerationError):
    """Raised when scene count exceeds 5."""
    
    def __init__(self, count: int, max_count: int = 5):
        super().__init__(
            message=f"Scene count ({count}) exceeds maximum allowed ({max_count})",
            code="INVALID_SCENE_COUNT",
            details={"count": count, "max_count": max_count}
        )


class TTSGenerationError(Exception):
    """Base exception for TTS-related errors."""
    
    def __init__(self, message: str, code: str, details: dict | None = None):
        self.message = message
        self.code = code
        self.details = details or {}
        super().__init__(self.message)


class ElevenLabsAPIError(TTSGenerationError):
    """Raised when ElevenLabs API calls fail."""
    
    def __init__(self, reason: str, status_code: int | None = None):
        super().__init__(
            message=f"ElevenLabs API error: {reason}",
            code="ELEVENLABS_API_ERROR",
            details={"reason": reason, "status_code": status_code}
        )


class AudioGenerationError(TTSGenerationError):
    """Raised when audio generation fails."""
    
    def __init__(self, reason: str = "Audio generation failed"):
        super().__init__(
            message=f"Audio generation error: {reason}",
            code="AUDIO_GENERATION_ERROR",
            details={"reason": reason}
        )
