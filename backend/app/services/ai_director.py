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


class AIDirectorService:
    """
    Service for directing AI-powered lesson generation.
    
    Uses Gemini 3 Flash Preview to generate lesson manifest with scenes,
    checkpoints, visual events, and narration script.
    See docs/prompt-spec.md section "Language Model Prompt (Lesson Director)"
    for complete prompt specification and JSON schema.
    """
    
    async def generate_lesson_plan(self, topic: str, options: dict) -> dict:
        """Generate a lesson plan for a given topic."""
        raise NotImplementedError("AI director service not yet implemented")
    
    async def generate_scene(self, scene_params: dict) -> dict:
        """Generate a single scene for a lesson."""
        raise NotImplementedError("AI director service not yet implemented")
