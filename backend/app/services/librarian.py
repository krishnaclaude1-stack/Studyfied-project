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


class LibrarianService:
    """
    Service for extracting topics from educational content.
    
    Uses Gemini 3 Flash Preview to analyze content and generate topic menu.
    See docs/prompt-spec.md section "Language Model Prompt (Librarian Agent)"
    for complete prompt specification and JSON schema.
    """
    
    async def search_resources(self, query: str) -> list[dict]:
        """Search for educational resources."""
        raise NotImplementedError("Librarian service not yet implemented")
    
    async def get_resource(self, resource_id: str) -> dict:
        """Retrieve a specific resource by ID."""
        raise NotImplementedError("Librarian service not yet implemented")
