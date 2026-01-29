"""
AI Director Service

Orchestrates lesson generation with audio-visual synchronization.

Implementation Guide:
- Prompt Specification: docs/prompt-spec.md (lines 280-483)
- Key Requirements:
  - Maximum lesson duration: 180 seconds
  - Khan Academy-style narration (friendly, conversational)
  - Explain-as-you-draw narration (not before/after)
  - Each narration block maps to a checkpoint for audio-visual sync
  - Output strict JSON with scenes, voiceover, events, interactions
- Related Ticket: T4 - AI Pipeline - Lesson Script Generation & Audio
"""

import asyncio
import json
import logging
from typing import Any

from google import genai
from google.genai import types
from pydantic import ValidationError

from app.core.config import Settings, get_settings
from app.schemas.lesson import LessonManifest
from app.schemas.ai_provider import AIProvider, AIProviderConfig
from app.services.openai_compatible_client import OpenAICompatibleAuth, openai_compatible_client
from .exceptions import (
    InvalidAPIKeyError,
    LessonScriptGenerationError,
    InvalidLessonDurationError,
    InvalidSceneCountError,
)

logger = logging.getLogger(__name__)

# AI Director system prompt based on docs/prompt-spec.md (lines 280-483)
AI_DIRECTOR_SYSTEM_PROMPT = """You are a professional Storyboard Director for interactive whiteboard-style educational videos.

Your sole task is to analyze the given topic and the provided visual assets (all supplied in the same context window) and produce a STRICT JSON lesson plan for a 3-minute sketchnote-style whiteboard video.

HARD CONSTRAINTS:
- You do NOT generate images
- You do NOT explain concepts in long text
- You do NOT output markdown
- You do NOT output YAML
- You ONLY output valid JSON
- Maximum lesson duration: 180 seconds (never exceed this limit)
- Maximum number of scenes: 5
- All scenes must be planned in a SINGLE response

INPUTS YOU RECEIVE:
- Topic or lesson text
- A list of visual assets (images or SVGs) provided as active visual inputs
- Asset identifiers (e.g., asset_0, asset_1, asset_2, asset_3, asset_4)
- All assets are visible to you simultaneously via attention

CORE ASSUMPTIONS:
- All assets are available in the same context window
- You can visually inspect and understand each asset directly
- You may freely reuse any asset across multiple scenes
- You do NOT need semantic metadata to identify or remember assets
- Asset identity is stable within this single call

CORE RESPONSIBILITIES:

1. ANALYZE CONTENT:
   - Identify the core idea and supporting ideas from the topic
   - Identify processes, cause–effect relationships, contrasts, and outcomes
   - Think like a teacher planning a whiteboard explanation

2. SCENE PLANNING:
   - Break the lesson into up to 5 scenes
   - Each scene must have one clear instructional purpose
   - Scenes should build logically on previous scenes
   - Reuse visuals when they help reinforce understanding

3. TEMPORAL DESIGN:
   - Write an engaging, educational narration script for TTS (Khan Academy style)
   - Tone: Friendly, conversational, enthusiastic, and "teacher-next-door"
   - Use connective phrases: "So, let's look at...", "Now typically...", "Notice how..."
   - Address the viewer directly ("You might wonder...", "Here we see...")
   - Narrate while the drawing is happening (explain-as-you-draw, not before/after)
   - Each narration block must map to a checkpoint
   - Narration should be substantial (20-40 words per checkpoint) but sound spontaneous

4. VISUAL DIRECTION:
   - Decide which assets appear in which scenes
   - Decide when an asset is:
       - drawn progressively
       - faded in
       - highlighted
   - You may reuse the same asset in multiple scenes
   - Do NOT assume exact image size or geometry

5. INTERACTION DESIGN:
   - Include at least one interaction every 1–2 scenes
   - Supported interaction types:
       - pauseAndThink
       - quiz
       - labelPrediction

CANVAS COMPOSITION RULES:
You are directing a teacher-style whiteboard, not a slide deck. Think in terms of semantic regions, not coordinates.

Available zones:
- centerMain: primary diagram area
- leftSupport: secondary diagrams or comparisons
- rightNotes: short supporting text or labels
- topHeader: framing phrase or scene title
- bottomContext: outcomes, constraints, or summary cues

Rules:
- Use zones consistently to preserve spatial memory
- Not all zones must be used in every scene
- Never overcrowd a zone
- If a scene requires more than two zones, split into another scene
- Use empty space intentionally to avoid clutter

SEMANTIC SIZE AND ROLE RULES:
Decide visual importance, not geometry.

Asset roles:
- primaryDiagram
- supportingDiagram
- prop
- icon

Scale hints:
- large
- medium
- small

Rules:
- Do NOT output width, height, or pixel values
- Use scaleHint to express visual importance
- The rendering engine will determine final size

TEXT AND LABEL RULES:
- Supporting text must be short (maximum 7 words)
- Text must be placed relative to a referenced asset or within a note zone
- Allowed text placement positions: above, below, left, right
- Never place long sentences in the centerMain zone

OUTPUT FORMAT (STRICT JSON):
{
  "lessonDurationSec": <number, total estimated duration in seconds, must be <= 180>,
  "scenes": [
    {
      "sceneId": "<string>",
      "purpose": "<string>",
      "assetsUsed": ["<asset_id>", ...],
      "voiceover": [
        {
          "text": "<Full TTS narration script for this segment>",
          "checkpointId": "<string>"
        }
      ],
      "events": [
        {
          "type": "<draw|fadeIn|highlight|move|pause|quiz>",
          "assetId": "<string>",
          "checkpointId": "<string>",
          "zone": "<centerMain|leftSupport|rightNotes|topHeader|bottomContext>",
          "role": "<primaryDiagram|supportingDiagram|prop|icon>",
          "scaleHint": "<large|medium|small>",
          "params": {}
        }
      ],
      "interaction": {
        "type": "<quiz|pauseAndThink|labelPrediction|none>",
        "prompt": "<string>",
        "options": ["<string>", ...],
        "correctAnswer": "<string>"
      }
    }
  ]
}

VALIDATION RULES:
- Output must be valid JSON
- No trailing commas
- No comments
- No extra keys outside the schema
- Every visual event must reference a valid assetId
- Every narration line must have a checkpointId
- Scene count must not exceed 5
- Total narration must reasonably fit within 180 seconds
- lessonDurationSec must be <= 180
- Each narration block must align with a visual event at the same checkpointId
- At least one scene must include an interaction with type != "none"

INTERNAL THINKING MODE:
- All assets are visually attended in the same context window
- No persistence or cross-call assumptions
- Decide what must be shown, not explained
- Optimize for fast comprehension during playback
- Prefer visual continuity over visual novelty
- Prefer reusing previously introduced assets when possible to reinforce learning
- Ensure the lesson includes attention, activation, explanation, practice, and reinforcement

FINAL OUTPUT RULE:
Your response must contain ONLY the JSON object described above."""


class AIDirectorService:
    """
    Service for directing AI-powered lesson generation.
    
    Uses Gemini 3 Flash Preview to generate lesson manifest with scenes,
    checkpoints, visual events, and narration script.
    See docs/prompt-spec.md section "Language Model Prompt (Lesson Director)"
    for complete prompt specification and JSON schema.
    """
    
    def __init__(self, settings: Settings | None = None):
        """
        Initialize the AI Director service.
        
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
    
    async def generate_lesson_manifest(
        self,
        topic_text: str,
        asset_ids: list[str],
        retry_count: int = 0,
        ai_config: AIProviderConfig | None = None,
    ) -> dict[str, Any]:
        """
        Generate a lesson manifest for a given topic with associated assets.
        
        Args:
            topic_text: The topic content to create a lesson for.
            asset_ids: List of asset identifiers (e.g., ["asset_0", "asset_1", ...]).
            retry_count: Current retry attempt (max 1 retry).
            
        Returns:
            Dictionary containing the lesson manifest with scenes, checkpoints, and events.
            
        Raises:
            InvalidAPIKeyError: If API key is invalid.
            LessonScriptGenerationError: If lesson generation fails.
            InvalidLessonDurationError: If duration exceeds 180 seconds.
            InvalidSceneCountError: If scene count exceeds 5.
        """
        ai_config = ai_config or AIProviderConfig()

        # Construct the user prompt
        asset_list = ", ".join(asset_ids)
        user_prompt = f"""Analyze the following topic and create a lesson plan using the provided assets:

---BEGIN TOPIC---
{topic_text}
---END TOPIC---

Available assets: {asset_list}

Generate a complete lesson manifest following the rules and output valid JSON."""

        try:
            if ai_config.provider == AIProvider.OPENAI_COMPATIBLE:
                if not ai_config.openai_compatible:
                    raise LessonScriptGenerationError(
                        "openaiCompatible config is required when provider=openaiCompatible"
                    )

                content = await openai_compatible_client.chat_completions(
                    auth=OpenAICompatibleAuth(
                        base_url=str(ai_config.openai_compatible.base_url),
                        api_key=ai_config.openai_compatible.api_key,
                    ),
                    model=ai_config.openai_compatible.model,
                    messages=[
                        {"role": "system", "content": AI_DIRECTOR_SYSTEM_PROMPT},
                        {"role": "user", "content": user_prompt},
                    ],
                    temperature=0.7,
                    max_tokens=8192,
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
                        return await self.generate_lesson_manifest(
                            topic_text, asset_ids, retry_count + 1, ai_config=ai_config
                        )
                    raise LessonScriptGenerationError(f"Invalid JSON response: {e}")
            else:
                client = self._get_client()
                model_name = ai_config.resolve_gemini_model(self._model_name)
                api_key = ai_config.resolve_gemini_api_key(self._settings.gemini_api_key)
                if api_key != self._settings.gemini_api_key:
                    client = genai.Client(api_key=api_key)

                response = await asyncio.to_thread(
                    client.models.generate_content,
                    model=model_name,
                    contents=[
                        types.Content(
                            role="user",
                            parts=[types.Part(text=AI_DIRECTOR_SYSTEM_PROMPT + "\n\n" + user_prompt)],
                        )
                    ],
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.7,
                        max_output_tokens=8192,
                    ),
                )

                if not response.text:
                    raise LessonScriptGenerationError("Empty response from Gemini API")

                try:
                    result = json.loads(response.text)
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse Gemini response as JSON: {e}")
                    if retry_count < 1:
                        logger.info("Retrying request (attempt 2/2)...")
                        return await self.generate_lesson_manifest(
                            topic_text, asset_ids, retry_count + 1, ai_config=ai_config
                        )
                    raise LessonScriptGenerationError(f"Invalid JSON response: {e}")
            
            # Validate with Pydantic
            try:
                validated = LessonManifest(**result)
                
                # Additional validation for duration and scene count
                if validated.lesson_duration_sec > 180:
                    raise InvalidLessonDurationError(validated.lesson_duration_sec)
                
                if len(validated.scenes) > 5:
                    raise InvalidSceneCountError(len(validated.scenes))
                
                # Validate that all asset IDs are valid
                for scene in validated.scenes:
                    for event in scene.events:
                        if event.asset_id not in asset_ids:
                            raise LessonScriptGenerationError(
                                f"Invalid asset reference: {event.asset_id} not in {asset_ids}"
                            )
                
                logger.info(
                    f"Successfully generated lesson manifest with {len(validated.scenes)} scenes, "
                    f"duration: {validated.lesson_duration_sec}s"
                )
                return validated.model_dump(by_alias=True)
                
            except ValidationError as e:
                logger.error(f"Pydantic validation failed: {e}")
                if retry_count < 1:
                    logger.info("Retrying request due to validation failure (attempt 2/2)...")
                    return await self.generate_lesson_manifest(topic_text, asset_ids, retry_count + 1, ai_config=ai_config)
                raise LessonScriptGenerationError(f"Response validation failed: {e}")
                
        except InvalidAPIKeyError:
            raise
        except (LessonScriptGenerationError, InvalidLessonDurationError, InvalidSceneCountError):
            raise
        except Exception as e:
            logger.error(f"LLM provider error: {e}")
            error_str = str(e).lower()
            if "api key" in error_str or "authentication" in error_str or "401" in error_str:
                raise InvalidAPIKeyError()
            raise LessonScriptGenerationError(f"Gemini API error: {e}")


# Module-level singleton for performance
ai_director_service = AIDirectorService()
