"""AI provider configuration schemas.

These models let the frontend choose between:
- Official Gemini SDK (google-genai)
- Any OpenAI-compatible endpoint (custom base URL + API key + model)

All fields serialize in camelCase via CamelCaseModel.
"""

from __future__ import annotations

from enum import Enum

from pydantic import Field
from pydantic.networks import AnyHttpUrl as HttpUrl

from . import CamelCaseModel


class AIProvider(str, Enum):
    GEMINI = "gemini"
    OPENAI_COMPATIBLE = "openaiCompatible"
    SJINN = "sjinn"


class GeminiProviderConfig(CamelCaseModel):
    """Config for the official Gemini API.

    Note: `api_key` is optional. If omitted, the backend falls back to `GEMINI_API_KEY`.
    """

    api_key: str | None = Field(default=None, description="Gemini API key override")
    # The app defaults to `gemini-flash-latest`. UI may choose to keep this fixed.
    model: str | None = Field(default=None, description="Gemini model name")


class OpenAICompatibleProviderConfig(CamelCaseModel):
    """Config for any OpenAI-compatible API endpoint."""

    base_url: HttpUrl = Field(
        ..., description="Base URL of the OpenAI-compatible endpoint (e.g., https://api.openai.com/v1)"
    )
    api_key: str = Field(..., description="API key for the OpenAI-compatible endpoint")
    model: str = Field(..., min_length=1, description="Model name")


class SjinnConfig(CamelCaseModel):
    """Config for SJinn Tool API (Nano Banana Image Generation).

    Supports both standard (50 credits) and pro (150 credits) models.
    """

    base_url: HttpUrl = Field(..., description="SJinn API base URL (e.g., https://sjinn.ai)")
    api_key: str = Field(..., description="SJinn API key")
    model: str = Field(
        default="nano-banana-image-api",
        description="Model to use: 'nano-banana-image-api' (standard, 50 credits) or 'nano-banana-image-pro-api' (pro, 150 credits)"
    )
    # Optional reference images
    image_list: list[HttpUrl] = Field(default_factory=list, alias="imageList")


class AIProviderConfig(CamelCaseModel):
    """Top-level provider selection used by agents.

    Note: `image_size` / `image_aspect_ratio` are optional hints used by image generation.
    Providers that don't support them will ignore them.
    """

    provider: AIProvider = Field(default=AIProvider.GEMINI)
    gemini: GeminiProviderConfig | None = None
    openai_compatible: OpenAICompatibleProviderConfig | None = Field(default=None, alias="openaiCompatible")
    sjinn: SjinnConfig | None = None

    # Optional image-generation hints
    # OpenAI providers interpret `image_size` as pixel dimensions (e.g., 1024x1024).
    # SJinn interprets `image_size` as resolution tier (e.g., 1K, 2K).
    image_size: str | None = Field(default=None, alias="imageSize")
    image_aspect_ratio: str | None = Field(default=None, alias="imageAspectRatio")

    def resolve_gemini_model(self, default_model: str) -> str:
        if self.gemini and self.gemini.model:
            return self.gemini.model
        return default_model

    def resolve_gemini_api_key(self, default_key: str) -> str:
        if self.gemini and self.gemini.api_key is not None:
            return self.gemini.api_key
        return default_key

