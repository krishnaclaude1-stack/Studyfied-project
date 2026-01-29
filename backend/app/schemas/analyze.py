"""
Pydantic schemas for the analyze endpoint.

Defines request/response models for content analysis and topic extraction.
"""

from typing import Optional
from pydantic import Field, HttpUrl

from . import CamelCaseModel
from .ai_provider import AIProviderConfig


# Request Models
class AnalyzeUrlRequest(CamelCaseModel):
    """Request model for URL-based content analysis."""

    url: HttpUrl = Field(..., description="URL of the content to analyze")
    ai_config: AIProviderConfig | None = Field(
        default=None,
        description="Optional AI provider configuration for the Librarian agent",
    )


# Response Models
class TopicItem(CamelCaseModel):
    """
    A single topic extracted from the source content.
    
    Matches the Librarian Agent JSON schema from docs/prompt-spec.md.
    """
    
    id: str = Field(..., description="Unique identifier for the topic")
    title: str = Field(..., description="Engaging title for the topic")
    focus: str = Field(..., description="Specific learning objective from text")
    hook: str = Field(..., description="Why this topic matters")
    visual_potential_score: float = Field(
        ..., 
        ge=1, 
        le=10, 
        description="Score indicating visual potential (1-10)"
    )
    key_visuals: list[str] = Field(
        ..., 
        description="List of key visual elements for this topic"
    )


class AnalyzeResponse(CamelCaseModel):
    """Response model containing extracted topics."""
    
    topics: list[TopicItem] = Field(
        ..., 
        description="List of extracted topics (1-5+ based on content density)"
    )


# Error Models
class ErrorDetail(CamelCaseModel):
    """Detailed error information."""
    
    code: str = Field(..., description="Error code string")
    message: str = Field(..., description="Human readable error message")
    details: Optional[dict] = Field(
        default=None, 
        description="Additional error details"
    )


class ErrorResponse(CamelCaseModel):
    """Structured error response wrapper."""
    
    error: ErrorDetail = Field(..., description="Error details")
