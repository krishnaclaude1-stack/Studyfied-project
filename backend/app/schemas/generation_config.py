"""Request-time configuration for the AI pipeline.

Frontend can send these fields per-request to select provider/model settings.
"""

from pydantic import Field

from app.schemas import CamelCaseModel
from app.schemas.ai_provider import AIProviderConfig


class AIAgentsConfig(CamelCaseModel):
    librarian: AIProviderConfig | None = Field(default=None)
    image_steering: AIProviderConfig | None = Field(default=None, alias="imageSteering")
    ai_director: AIProviderConfig | None = Field(default=None, alias="aiDirector")
    image_generation: AIProviderConfig | None = Field(default=None, alias="imageGeneration")
