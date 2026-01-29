"""
Pydantic schemas for lesson manifest structure.

These models define the complete lesson structure including scenes, checkpoints,
visual events, and interactions. All models use camelCase for JSON serialization.
"""

from enum import Enum
from typing import Any

from pydantic import Field, field_validator

from . import CamelCaseModel


class VisualEventType(str, Enum):
    """Types of visual events that can occur during a lesson."""
    DRAW = "draw"
    FADE_IN = "fadeIn"
    HIGHLIGHT = "highlight"
    MOVE = "move"
    PAUSE = "pause"
    QUIZ = "quiz"


class Zone(str, Enum):
    """Canvas zones for positioning visual elements."""
    CENTER_MAIN = "centerMain"
    LEFT_SUPPORT = "leftSupport"
    RIGHT_NOTES = "rightNotes"
    TOP_HEADER = "topHeader"
    BOTTOM_CONTEXT = "bottomContext"


class Role(str, Enum):
    """Semantic roles for visual elements."""
    PRIMARY_DIAGRAM = "primaryDiagram"
    SUPPORTING_DIAGRAM = "supportingDiagram"
    PROP = "prop"
    ICON = "icon"


class ScaleHint(str, Enum):
    """Size hints for visual elements."""
    LARGE = "large"
    MEDIUM = "medium"
    SMALL = "small"


class InteractionType(str, Enum):
    """Types of interactions available in lessons."""
    QUIZ = "quiz"
    PAUSE_AND_THINK = "pauseAndThink"
    LABEL_PREDICTION = "labelPrediction"
    NONE = "none"


class VoiceoverSegment(CamelCaseModel):
    """A segment of narration text aligned to a checkpoint."""
    text: str = Field(..., description="Narration script text")
    checkpoint_id: str = Field(..., description="Checkpoint identifier for sync")


class VisualEvent(CamelCaseModel):
    """A visual event that occurs during the lesson."""
    type: VisualEventType = Field(..., description="Type of visual event")
    asset_id: str = Field(..., description="Asset ID to display")
    checkpoint_id: str = Field(..., description="Checkpoint for synchronization")
    zone: Zone = Field(..., description="Canvas zone for positioning")
    role: Role = Field(..., description="Semantic role of the visual")
    scale_hint: ScaleHint = Field(..., description="Size hint for the visual")
    params: dict[str, Any] = Field(default_factory=dict, description="Event-specific parameters")
    
    @field_validator("asset_id")
    @classmethod
    def validate_asset_id(cls, v: str) -> str:
        """Validate that asset_id is not empty."""
        if not v or not v.strip():
            raise ValueError("Asset ID cannot be empty")
        return v


class Interaction(CamelCaseModel):
    """An interactive element within a scene."""
    type: InteractionType = Field(..., description="Type of interaction")
    prompt: str | None = Field(None, description="Prompt text for the interaction")
    options: list[str] = Field(default_factory=list, description="Answer options for quiz")
    correct_answer: str | None = Field(None, description="Correct answer for quiz")


class Scene(CamelCaseModel):
    """A scene within the lesson, containing voiceover, events, and interactions."""
    scene_id: str = Field(..., description="Unique scene identifier")
    purpose: str = Field(..., description="Educational purpose of the scene")
    assets_used: list[str] = Field(default_factory=list, description="Asset IDs used in this scene")
    voiceover: list[VoiceoverSegment] = Field(..., description="Narration segments")
    events: list[VisualEvent] = Field(..., description="Visual events in this scene")
    interaction: Interaction = Field(..., description="Interactive element")


class LessonManifest(CamelCaseModel):
    """Complete lesson manifest with scenes and metadata."""
    lesson_duration_sec: float = Field(..., le=180, description="Total lesson duration in seconds (max 180)")
    scenes: list[Scene] = Field(..., max_length=5, description="List of scenes (max 5)")

    @field_validator("lesson_duration_sec")
    @classmethod
    def validate_duration(cls, v: float) -> float:
        """Validate that duration is positive and within limits."""
        if v <= 0:
            raise ValueError("Lesson duration must be positive")
        if v > 180:
            raise ValueError("Lesson duration must not exceed 180 seconds")
        return v

    @field_validator("scenes")
    @classmethod
    def validate_scenes(cls, v: list[Scene]) -> list[Scene]:
        """Validate scene count and checkpoint consistency."""
        if len(v) == 0:
            raise ValueError("Lesson must contain at least one scene")
        if len(v) > 5:
            raise ValueError("Lesson must not contain more than 5 scenes")
        
        # Validate checkpoint consistency per scene
        for scene_idx, scene in enumerate(v):
            # Collect checkpoint IDs from voiceover and events within this scene
            checkpoint_ids_voiceover = set()
            checkpoint_ids_events = set()
            
            for segment in scene.voiceover:
                checkpoint_ids_voiceover.add(segment.checkpoint_id)
            for event in scene.events:
                checkpoint_ids_events.add(event.checkpoint_id)
            
            # Verify that checkpoints referenced in events exist in voiceover
            # (More lenient: allows voiceover checkpoints without events, but not vice versa)
            missing_in_voiceover = checkpoint_ids_events - checkpoint_ids_voiceover
            if missing_in_voiceover:
                raise ValueError(
                    f"Checkpoint mismatch in scene {scene_idx + 1} ({scene.scene_id}): "
                    f"Event checkpoint IDs {missing_in_voiceover} do not exist in voiceover segments. "
                    f"Every visual event must be synchronized with a voiceover checkpoint."
                )
        
        # Validate that at least one scene has a non-"none" interaction
        has_required_interaction = any(
            scene.interaction.type != InteractionType.NONE
            for scene in v
        )
        if not has_required_interaction:
            raise ValueError(
                "Lesson must contain at least one scene with an interaction type other than 'none'"
            )
        
        return v


class LessonManifestResponse(CamelCaseModel):
    """Response containing lesson manifest, audio, and metadata."""
    lesson_manifest: LessonManifest = Field(..., description="Complete lesson manifest")
    audio_url: str = Field(..., description="Base64-encoded audio data URL")
    transcript: list[str] = Field(..., description="Narration text for accessibility")
