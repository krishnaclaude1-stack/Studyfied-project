"""
Librarian Service

Analyzes source text and extracts teachable topics for video lessons.

Implementation Guide:
- Prompt Specification: docs/prompt-spec.md (lines 524-565)
- Key Requirements:
  - Variable topic count (1-5+ based on source density)
  - Each topic must be convertible to 2-3 minute video
  - Strict adherence to provided text only
  - Output JSON schema defined in prompt spec
- Related Ticket: T2 - AI Pipeline - Content Ingestion & Topic Extraction
"""

import asyncio
import json
import logging
from typing import Any

from google import genai
from google.genai import types
from pydantic import ValidationError

from app.core.config import Settings, get_settings
from app.schemas.analyze import AnalyzeResponse, TopicItem
from app.schemas.ai_provider import AIProvider, AIProviderConfig
from app.services.openai_compatible_client import OpenAICompatibleAuth, openai_compatible_client
from .exceptions import InvalidAPIKeyError, TopicExtractionFailedError

logger = logging.getLogger(__name__)

# Librarian Agent system prompt based on docs/prompt-spec.md
LIBRARIAN_SYSTEM_PROMPT = """You are an expert Educational Content Librarian.
Your role is to analyze source text and extract teachable topics for video lessons.

CRITICAL RULES:
1. STRICT ADHERENCE: Use ONLY the provided text. Do not add external knowledge or related topics.
2. GRANULARITY: If the text is short (like a single paragraph), generate ONLY ONE topic.
3. SCOPE: Each topic must be convertible into a 2-3 minute video.
4. VARIABLE TOPIC COUNT: Output 1-5 topics based on the length and density of the source. Only exceed 5 topics if the source is very long (full chapter+).
5. AVOID ARTIFICIAL FIXES: Do not force an exact number of topics; quality and coverage matter more than quantity.

TASKS:
1. Analyze provided text.
2. Decide the number of topics that best fits the source (1-5 for most inputs).
3. Extract topics based on strict rules.
4. Output JSON menu.

OUTPUT FORMAT:
Return a valid JSON object with a "topics" array. Each topic object must have:
- "id": unique identifier string (e.g., "topic_1", "topic_2")
- "title": engaging title for the topic
- "focus": specific learning objective from the text
- "hook": why this topic matters to learners
- "visual_potential_score": number from 1-10 indicating visual potential
- "key_visuals": array of strings describing key visual elements

Example output structure:
{
  "topics": [
    {
      "id": "topic_1",
      "title": "Example Title",
      "focus": "Specific learning objective",
      "hook": "Why this matters",
      "visual_potential_score": 8,
      "key_visuals": ["visual 1", "visual 2"]
    }
  ]
}"""


class LibrarianService:
    """
    Service for extracting topics from educational content.
    
    Uses Gemini to analyze content and generate topic menu.
    See docs/prompt-spec.md section "Language Model Prompt (Librarian Agent)"
    for complete prompt specification and JSON schema.
    """
    
    def __init__(self, settings: Settings | None = None):
        """
        Initialize the Librarian service.
        
        Args:
            settings: Application settings. If None, loads from environment.
        """
        self._settings = settings or get_settings()
        self._client: genai.Client | None = None
        self._model_name = "gemini-flash-latest"
    
    def _get_client(self) -> genai.Client:
        """
        Get or create the Gemini client.
        
        Returns:
            Initialized Gemini client.
            
        Raises:
            InvalidAPIKeyError: If API key is not configured.
        """
        if not self._settings.gemini_api_key:
            raise InvalidAPIKeyError()
        
        if self._client is None:
            self._client = genai.Client(api_key=self._settings.gemini_api_key)
        
        return self._client
    
    async def extract_topics(
        self,
        raw_text: str,
        retry_count: int = 0,
        ai_config: AIProviderConfig | None = None,
    ) -> dict[str, Any]:
        """
        Extract topics from raw text using Gemini.
        
        Args:
            raw_text: The source text to analyze.
            retry_count: Current retry attempt (max 1 retry).
            
        Returns:
            Dictionary containing the extracted topics.
            
        Raises:
            InvalidAPIKeyError: If API key is invalid.
            TopicExtractionFailedError: If extraction fails after retries.
        """
        ai_config = ai_config or AIProviderConfig()

        # Construct the prompt
        user_prompt = f"""Analyze the following educational content and extract teachable topics:

---BEGIN SOURCE TEXT---
{raw_text}
---END SOURCE TEXT---

Extract topics following the rules and output valid JSON."""

        try:
            if ai_config.provider == AIProvider.OPENAI_COMPATIBLE:
                if not ai_config.openai_compatible:
                    raise TopicExtractionFailedError(
                        "openaiCompatible config is required when provider=openaiCompatible"
                    )

                content = await openai_compatible_client.chat_completions(
                    auth=OpenAICompatibleAuth(
                        base_url=str(ai_config.openai_compatible.base_url),
                        api_key=ai_config.openai_compatible.api_key,
                    ),
                    model=ai_config.openai_compatible.model,
                    messages=[
                        {"role": "system", "content": LIBRARIAN_SYSTEM_PROMPT},
                        {"role": "user", "content": user_prompt},
                    ],
                    temperature=0.7,
                    max_tokens=4096,
                    response_format="json_object",
                )

                try:
                    from app.services.json_utils import extract_json
                    result = extract_json(content)
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse OpenAI-compatible response as JSON: {e}")
                    logger.error(f"Response content: {content[:500]}")
                    if retry_count < 1:
                        logger.info("Retrying request (attempt 2/2)...")
                        return await self.extract_topics(raw_text, retry_count + 1, ai_config=ai_config)
                    raise TopicExtractionFailedError(f"Invalid JSON response: {e}")
            else:
                # Official Gemini
                client = self._get_client()
                model_name = ai_config.resolve_gemini_model(self._model_name)
                api_key = ai_config.resolve_gemini_api_key(self._settings.gemini_api_key)
                if api_key != self._settings.gemini_api_key:
                    # Per-request override: create a short-lived client for this call.
                    client = genai.Client(api_key=api_key)

                # Call Gemini API with JSON response format
                response = await asyncio.to_thread(
                    client.models.generate_content,
                    model=model_name,
                    contents=[
                        types.Content(
                            role="user",
                            parts=[types.Part(text=LIBRARIAN_SYSTEM_PROMPT + "\n\n" + user_prompt)],
                        )
                    ],
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.7,
                        max_output_tokens=4096,
                    ),
                )

                if not response.text:
                    raise TopicExtractionFailedError("Empty response from Gemini API")

                try:
                    from app.services.json_utils import extract_json
                    result = extract_json(response.text)
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse Gemini response as JSON: {e}")
                    logger.error(f"Response content: {response.text[:500]}")
                    if retry_count < 1:
                        logger.info("Retrying request (attempt 2/2)...")
                        return await self.extract_topics(raw_text, retry_count + 1, ai_config=ai_config)
                    raise TopicExtractionFailedError(f"Invalid JSON response: {e}")
            
            # Validate with Pydantic
            try:
                validated = AnalyzeResponse(**result)
                logger.info(f"Successfully extracted {len(validated.topics)} topics")
                return validated.model_dump(by_alias=True)
            except ValidationError as e:
                logger.error(f"Pydantic validation failed: {e}")
                if retry_count < 1:
                    # Retry with same prompt; LLM randomness may yield valid schema
                    logger.info("Retrying request due to validation failure (attempt 2/2)...")
                    return await self.extract_topics(raw_text, retry_count + 1, ai_config=ai_config)
                raise TopicExtractionFailedError(f"Response validation failed: {e}")
                
        except InvalidAPIKeyError:
            raise
        except TopicExtractionFailedError:
            raise
        except Exception as e:
            logger.error(f"LLM provider error: {e}")
            error_str = str(e).lower()
            if "api key" in error_str or "authentication" in error_str or "401" in error_str:
                raise InvalidAPIKeyError()
            raise TopicExtractionFailedError(f"Gemini API error: {e}")
