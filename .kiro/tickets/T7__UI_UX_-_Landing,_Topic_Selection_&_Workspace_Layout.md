# T7: UI/UX - Landing, Topic Selection & Workspace Layout

## Scope

Implement all user-facing screens and navigation flow from landing page to interactive workspace.

**In Scope:**
- Landing page with URL input and "Generate" button
- Source selection screen (PDF upload vs URL paste)
- Processing screens (analysis and generation with progress indicators)
- Topic selection screen (dynamic grid for 1-5+ topics)
- Workspace layout (toolbar, canvas area, transcript sidebar)
- Navigation flow and routing
- Mobile-responsive design
- Error screens (unsupported content, generation failure)
- Completion overlay (Replay, Choose Another Topic, New Material)

**Out of Scope:**
- Canvas rendering logic (already in T5)
- Annotation controls (already in T6)
- Quiz UI (separate ticket)

## Acceptance Criteria

- [ ] Landing page matches file:docs/code.html design
- [ ] URL input with validation (immediate error for unsupported content)
- [ ] PDF upload with file size validation (<10MB)
- [ ] Processing screens show animated progress with stage names
- [ ] Topic selection displays 1-5+ topics dynamically (responsive grid)
- [ ] Workspace toolbar includes: back button, title, player controls, layer toggle, scribble button, transcript toggle
- [ ] Transcript sidebar (responsive drawer on mobile)
- [ ] Completion overlay with 3 action buttons
- [ ] Error overlays with "Retry" and "Go Back" options
- [ ] Mobile-responsive (works on phone, tablet, desktop)
- [ ] Navigation flow matches spec:509268fd-53cc-4271-8fce-6b32f347b891/c0117da8-c026-4647-8654-58dae0da1be2

## References

- **Core Flows**: spec:509268fd-53cc-4271-8fce-6b32f347b891/c0117da8-c026-4647-8654-58dae0da1be2 (All flows)
- **UI Mockup**: file:docs/code.html (All components)
- **PRD**: file:docs/prd.md (User Journeys)

## Dependencies

- T1: Project Foundation (requires frontend scaffolding)

## Priority

**HIGH** - User-facing experience, needed for demo