# TASK: Add Prompt Spec References to Backend Service Placeholders

## Scope

Add docstring references to file:docs/prompt-spec.md in backend service placeholder files to guide implementation of T2-T4 (AI Pipeline tickets).

**In Scope:**

- Update service placeholder docstrings with prompt spec references
- Add implementation guidance comments
- Link to specific sections of prompt-spec.md
- Ensure developers can easily find the relevant prompts

**Out of Scope:**

- Actual service implementation (covered by T2-T4)
- Changing service structure or signatures

## Files to Update

### 1. file:backend/app/services/librarian.py

**Current** (lines 1-19):

```python
"""
Librarian Service

Responsible for managing and organizing educational content resources.
This is a placeholder for the MVP implementation.
"""

class LibrarianService:
    """Service for managing educational content library."""
    
    async def search_resources(self, query: str) -> list[dict]:
        """Search for educational resources."""
        raise NotImplementedError("Librarian service not yet implemented")
```

**Proposed**:

```python
"""
Librarian Service

Analyzes source text and extracts teachable topics for video lessons.

Implementation Guide:
- Prompt Specification: <traycer-file absPath="d:\Studyfied-project\docs\prompt-spec.md">docs/prompt-spec.md</traycer-file> (lines 524-565)
- Key Requirements:
  - Variable topic count (1-5+ based on source density)
  - Each topic must be convertible to 2-3 minute video
  - Strict adherence to provided text only
  - Output JSON schema defined in prompt spec
- Related Ticket: <traycer-ticket epicId="509268fd-53cc-4271-8fce-6b32f347b891" ticketId="ac8b82e0-ba34-4902-878a-00eb9ed0bb8a" title="T2: AI Pipeline - Content Ingestion &amp; Topic Extraction" status="Todo">ticket:509268fd-53cc-4271-8fce-6b32f347b891/ac8b82e0-ba34-4902-878a-00eb9ed0bb8a</traycer-ticket> (T2)
"""

class LibrarianService:
    """
    Service for extracting topics from educational content.
    
    Uses Gemini 3 Flash Preview to analyze content and generate topic menu.
    See <traycer-file absPath="d:\Studyfied-project\docs\prompt-spec.md">docs/prompt-spec.md</traycer-file> section "Language Model Prompt (Librarian Agent)"
    for complete prompt specification and JSON schema.
    """
```

### 2. file:backend/app/services/image_steering.py

**Proposed**:

```python
"""
Image Steering Service

Generates exactly 5 image prompts for sketchnote-style educational visuals.

Implementation Guide:
- Prompt Specification: <traycer-file absPath="d:\Studyfied-project\docs\prompt-spec.md">docs/prompt-spec.md</traycer-file> (lines 1-279)
- Key Requirements:
  - Generate exactly 5 image prompts (one per visual beat)
  - Black-and-white sketchnote style with teal/orange accents
  - Emphasis on explanatory internal structure over icon-like simplicity
  - Hand-drawn aesthetic, not photorealistic
- Related Ticket: <traycer-ticket epicId="509268fd-53cc-4271-8fce-6b32f347b891" ticketId="c7c81a58-a65d-44c4-8c5d-d27c8193b14b" title="T3: AI Pipeline - Visual Asset Generation" status="Todo">ticket:509268fd-53cc-4271-8fce-6b32f347b891/c7c81a58-a65d-44c4-8c5d-d27c8193b14b</traycer-ticket> (T3)
"""

class ImageSteeringService:
    """
    Service for generating image prompts for visual assets.
    
    Uses Gemini 3 Flash Preview to create 5 image prompts optimized for
    Nano Banana Pro image generation.
    See <traycer-file absPath="d:\Studyfied-project\docs\prompt-spec.md">docs/prompt-spec.md</traycer-file> section "Image Steering Prompt (Visual Style)"
    for complete prompt specification and style rules.
    """
```

### 3. file:backend/app/services/ai_director.py

**Proposed**:

```python
"""
AI Director Service

Orchestrates lesson generation with audio-visual synchronization.

Implementation Guide:
- Prompt Specification: <traycer-file absPath="d:\Studyfied-project\docs\prompt-spec.md">docs/prompt-spec.md</traycer-file> (lines 280-483)
- Key Requirements:
  - Maximum lesson duration: 180 seconds
  - Khan Academy-style narration (friendly, conversational)
  - Explain-as-you-draw narration (not before/after)
  - Each narration block maps to a checkpoint for audio-visual sync
  - Output strict JSON with scenes, voiceover, events, interactions
- Related Ticket: <traycer-ticket epicId="509268fd-53cc-4271-8fce-6b32f347b891" ticketId="5573882f-a52c-4547-82ef-4a6e302bed4e" title="T4: AI Pipeline - Lesson Script Generation &amp; Audio" status="Todo">ticket:509268fd-53cc-4271-8fce-6b32f347b891/5573882f-a52c-4547-82ef-4a6e302bed4e</traycer-ticket> (T4)
"""

class AIDirectorService:
    """
    Service for directing AI-powered lesson generation.
    
    Uses Gemini 3 Flash Preview to generate lesson manifest with scenes,
    checkpoints, visual events, and narration script.
    See <traycer-file absPath="d:\Studyfied-project\docs\prompt-spec.md">docs/prompt-spec.md</traycer-file> section "Language Model Prompt (Lesson Director)"
    for complete prompt specification and JSON schema.
    """
```

### 4. file:backend/app/services/asset_factory.py

**Proposed**:

```python
"""
Asset Factory Service

Generates transparent PNG assets from image prompts using Nano Banana Pro.

Implementation Guide:
- Uses Nano Banana Pro API (apifree.ai) for image generation
- Applies OpenCV Smart Key for background removal
- Preserves teal/orange accents while removing white background
- Generates 5 images in parallel for performance
- Related Ticket: <traycer-ticket epicId="509268fd-53cc-4271-8fce-6b32f347b891" ticketId="c7c81a58-a65d-44c4-8c5d-d27c8193b14b" title="T3: AI Pipeline - Visual Asset Generation" status="Todo">ticket:509268fd-53cc-4271-8fce-6b32f347b891/c7c81a58-a65d-44c4-8c5d-d27c8193b14b</traycer-ticket> (T3)
- Tech Plan: <traycer-spec epicId="509268fd-53cc-4271-8fce-6b32f347b891" specId="c02c6bb2-6b7c-417a-a9b0-5d34542cd940" title="Tech Plan: Canvas Rendering &amp; AI Visual Pipeline (Refocused)">spec:509268fd-53cc-4271-8fce-6b32f347b891/c02c6bb2-6b7c-417a-a9b0-5d34542cd940</traycer-spec> (Section 1.3)
"""
```

### 5. file:backend/app/services/tts_service.py

**Proposed**:

```python
"""
TTS Service

Converts narration text to speech audio for lesson playback.

Implementation Guide:
- Production: ElevenLabs API (Rachel voice)
- Development: Browser TTS fallback
- Input: Narration text from AI Director
- Output: Audio blob URL for playback
- Related Ticket: <traycer-ticket epicId="509268fd-53cc-4271-8fce-6b32f347b891" ticketId="5573882f-a52c-4547-82ef-4a6e302bed4e" title="T4: AI Pipeline - Lesson Script Generation &amp; Audio" status="Todo">ticket:509268fd-53cc-4271-8fce-6b32f347b891/5573882f-a52c-4547-82ef-4a6e302bed4e</traycer-ticket> (T4)
- Tech Plan: <traycer-spec epicId="509268fd-53cc-4271-8fce-6b32f347b891" specId="c02c6bb2-6b7c-417a-a9b0-5d34542cd940" title="Tech Plan: Canvas Rendering &amp; AI Visual Pipeline (Refocused)">spec:509268fd-53cc-4271-8fce-6b32f347b891/c02c6bb2-6b7c-417a-a9b0-5d34542cd940</traycer-spec> (Section 3.2)
"""
```

### 6. file:backend/app/services/content_ingestor.py

**Proposed**:

```python
"""
Content Ingestor Service

Extracts text content from PDFs and URLs for analysis.

Implementation Guide:
- PDF extraction: PyMuPDF
- URL extraction: Crawl4AI
- Input validation: URL accessibility, PDF size <10MB
- Output: Raw text for Librarian Agent
- Related Ticket: <traycer-ticket epicId="509268fd-53cc-4271-8fce-6b32f347b891" ticketId="ac8b82e0-ba34-4902-878a-00eb9ed0bb8a" title="T2: AI Pipeline - Content Ingestion &amp; Topic Extraction" status="Todo">ticket:509268fd-53cc-4271-8fce-6b32f347b891/ac8b82e0-ba34-4902-878a-00eb9ed0bb8a</traycer-ticket> (T2)
- Architecture: <traycer-file absPath="d:\Studyfied-project\docs\architecture.md">docs/architecture.md</traycer-file> (Service Boundaries)
"""
```

## Acceptance Criteria

- [ ] All 6 service files have updated docstrings
- [ ] Docstrings reference specific sections of file:docs/prompt-spec.md
- [ ] Implementation guidance includes key requirements
- [ ] Related tickets are linked for context
- [ ] Developers can easily find prompt specifications when implementing T2-T4

## Benefits

1. **Improved Developer Experience**: Clear guidance on where to find implementation details
2. **Reduced Context Switching**: Developers don't need to search for prompt specs
3. **Better Code Documentation**: Service purpose and requirements are explicit
4. **Easier Onboarding**: New developers can understand service responsibilities quickly

## References

- **Prompt Specifications**: file:docs/prompt-spec.md
- **Tech Plan**: spec:509268fd-53cc-4271-8fce-6b32f347b891/c02c6bb2-6b7c-417a-a9b0-5d34542cd940
- **Related Tickets**: T2, T3, T4 (AI Pipeline)

## Priority

**MEDIUM** - Improves developer experience for upcoming AI pipeline implementation

## Dependencies

- ticket:509268fd-53cc-4271-8fce-6b32f347b891/f82cea98-85fb-46b6-9139-509433a653b4 (T1) - Done
- ticket:509268fd-53cc-4271-8fce-6b32f347b891/9dbd330a-2fb1-4855-9d6b-c8700edb8adb (T0) - Done

