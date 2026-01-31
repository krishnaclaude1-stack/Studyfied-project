# T8: State Management & Session Persistence

## Scope

Implement Zustand stores for state management and localStorage-based session persistence with single-tab enforcement.

**In Scope:**
- Multiple Zustand stores (playerStore, sessionStore, lessonStore)
- Session persistence utilities (save, load, clear)
- Zustand middleware for auto-sync to localStorage
- Per-lesson session isolation (`studyfied_session_{lessonId}`)
- Single-tab enforcement (tab flag checking)
- Session hydration with loading state
- Debounced localStorage writes (max 1 write/sec)
- Session cleanup on "New Material" action

**Out of Scope:**
- quizStore (part of quiz ticket)
- IndexedDB for assets (already in architecture)

## Acceptance Criteria

- [ ] playerStore manages playback state (playing, currentTime, duration)
- [ ] sessionStore manages annotations, layer preferences, transcript state
- [ ] lessonStore manages lesson manifest and assets
- [ ] Session data persists to localStorage on state changes (debounced)
- [ ] Session loads on workspace mount (with loading spinner)
- [ ] Per-lesson isolation: Lesson A annotations don't appear in Lesson B
- [ ] Single-tab enforcement: Warning shown if lesson open in another tab
- [ ] "New Material" action clears all session data
- [ ] "Replay" action resets playback but keeps annotations
- [ ] Tab flag includes timestamp (ignore if >5 min old)
- [ ] Session data serializable to JSON (no functions, no circular refs)

## References

- **Tech Plan**: spec:509268fd-53cc-4271-8fce-6b32f347b891/c02c6bb2-6b7c-417a-a9b0-5d34542cd940 (Section 1.2, 3.2)
- **Validation Report**: spec:509268fd-53cc-4271-8fce-6b32f347b891/4c497b15-664c-45f2-987c-c0f0e86e9398 (Session Management)
- **Architecture**: file:docs/architecture.md (State Manager decision)

## Dependencies

- T1: Project Foundation (requires frontend scaffolding)

## Priority

**MEDIUM** - Supporting feature, enables persistence