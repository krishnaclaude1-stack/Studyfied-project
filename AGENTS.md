# Studyfied Developer Guide

Studyfied is a **Generative AI Web Application for EdTech** that transforms static study materials (PDFs, URLs) into interactive, bite-sized **whiteboard video lessons**. This guide provides essential information for developers working on the project.

## Project Overview

- **Purpose**: Generate interactive, animated video lessons from educational content using AI
- **Tech Stack**: Polyglot monorepo with React (Vite/TypeScript) frontend and FastAPI (Python) backend
- **Key Innovation**: "Live Canvas" engine rendering lessons as real-time React applications rather than static videos, enabling in-frame interaction
- **Architecture**: Docker Compose orchestrated local development environment
- **Storage Model**: Client-side IndexedDB for assets, stateless backend (no database persistence)

## Technology Stack

### Frontend
- **Framework**: React 19 + TypeScript (Vite build tool)
- **Styling**: TailwindCSS v4
- **Canvas Rendering**: Konva.js (react-konva) for interactive graphics
- **State Management**: Zustand (transient state) + IndexedDB (persistent assets)
- **HTTP Client**: TanStack Query (React Query) for async operations
- **Build**: Vite with React SWC plugin for fast compilation
- **Dev Server**: Node.js on port 5173 with API proxy to backend

### Backend
- **Framework**: FastAPI (Python 3.11+) with Uvicorn server
- **Async Runtime**: asyncio with async/await patterns
- **Data Validation**: Pydantic v2 with camelCase JSON serialization
- **Content Extraction**:
  - **URLs**: Crawl4AI (headless browser crawler bypassing anti-bot checks)
  - **PDFs**: PyMuPDF (fitz) for fast text extraction
- **AI Services**:
  - **LLM**: Google Gemini 3 Flash Preview
  - **Image Generation**: Provider-selectable (Gemini Images or OpenAI-compatible Images API)
  - **Text-to-Speech**: ElevenLabs (production) / Browser TTS (dev)
- **Server Port**: 8000 with auto-reload in development

### DevOps
- **Orchestration**: Docker Compose
- **Frontend Container**: Node.js base with Nginx multi-stage build
- **Backend Container**: Python 3.11+ with Uvicorn
- **Health Checks**: Backend includes TCP health check for service readiness

## Project Structure

```
studyfied/
├── README.md                    # Main project documentation
├── AGENTS.md                    # This file
├── docker-compose.yml           # Service orchestration
├── .env.example                 # Environment template
│
├── backend/
│   ├── pyproject.toml          # Python dependencies and metadata
│   ├── requirements.txt         # Pip dependencies (mirrors pyproject.toml)
│   ├── Dockerfile              # Multi-stage build for Python app
│   └── app/
│       ├── main.py             # FastAPI app setup + CORS config
│       ├── core/
│       │   └── config.py        # Settings from environment variables
│       ├── routers/
│       │   ├── health.py        # GET /api/health liveness check
│       │   ├── analyze.py       # POST /api/v1/analyze* endpoints
│       │   └── generate_assets.py  # POST /api/v1/generate-* endpoints
│       ├── schemas/
│       │   ├── __init__.py      # CamelCaseModel base class
│       │   ├── analyze.py       # Pydantic models for analyze endpoint
│       │   ├── image_generation.py  # Pydantic models for image generation
│       │   └── lesson.py        # Pydantic models for lesson manifest
│       └── services/
│           ├── content_ingestor.py     # URL/PDF extraction + validation
│           ├── librarian.py            # Topic extraction via Gemini
│           ├── image_steering.py       # Image prompt generation via Gemini
│           ├── asset_factory.py        # Image generation via Nano Banana + OpenCV
│           ├── ai_director.py          # Lesson script generation (TODO)
│           ├── tts_service.py          # Audio generation (TODO)
│           └── exceptions.py           # Custom exception hierarchy
│
├── frontend/
│   ├── package.json             # Node dependencies and scripts
│   ├── vite.config.ts           # Vite build config + dev server proxy
│   ├── tsconfig.json            # TypeScript project references
│   ├── tailwind.config.js        # TailwindCSS configuration
│   ├── eslint.config.js          # ESLint rules
│   ├── Dockerfile               # Multi-stage build for SPA
│   ├── index.html               # HTML entry point
│   ├── nginx.conf               # Production web server config
│   └── src/
│       ├── main.tsx             # React app entry
│       ├── App.tsx              # Root component (health check demo)
│       ├── index.css            # Global styles
│       ├── assets/              # Static assets (SVGs, etc.)
│       ├── features/            # Domain-grouped feature directories
│       │   ├── dashboard/       # [TODO] Lesson list / creation flow
│       │   ├── editor/          # [TODO] Annotation/remix interface
│       │   └── player/          # [TODO] Interactive lesson playback
│       ├── lib/
│       │   ├── db.ts            # IndexedDB wrapper
│       │   └── konva-utils/     # Canvas utility functions [TODO]
│       ├── shared/              # Reusable UI components [TODO]
│       └── stores/              # Zustand store definitions [TODO]
│
├── docs/
│   ├── architecture.md          # Architecture Decision Document
│   ├── prd.md                   # Product Requirements Document
│   ├── prompt-spec.md           # AI prompt specifications for all agents
│   └── ...
```

## Naming Conventions

All code MUST follow these patterns for consistency across the polyglot codebase.

### Python (Backend)

- **Files**: `snake_case.py` (e.g., `content_ingestor.py`, `ai_director.py`)
- **Functions/Variables**: `snake_case` (e.g., `extract_from_url()`, `max_pdf_size`)
- **Classes**: `PascalCase` (e.g., `ContentIngestorService`, `LibrarianService`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MAX_PDF_SIZE_BYTES`)

### TypeScript (Frontend)

- **Files**: `PascalCase.tsx` for React components, `camelCase.ts` for utilities
- **Components**: `PascalCase` (e.g., `LessonPlayer.tsx`, `CanvasEditor.tsx`)
- **Functions/Variables**: `camelCase` (e.g., `extractTopics()`, `maxPdfSize`)
- **Constants**: `UPPER_SNAKE_CASE` or `camelCase` depending on scope

### JSON API Contract

- **All JSON responses**: `camelCase` (e.g., `visualPotentialScore`, `keyVisuals`)
- **Pydantic models MUST use**: `alias_generator=to_camel` and `populate_by_name=True`
- This allows backend Python to use `snake_case` internally while API always returns `camelCase`

## API Design Patterns

### Success Response
Return direct JSON data or wrapped in `{ data: ... }` for lists:
```json
{
  "topics": [{ "id": "topic_1", "title": "...", ... }]
}
```

### Error Response
All errors follow this structure:
```json
{
  "error": {
    "code": "ERROR_CODE_STRING",
    "message": "Human readable error message",
    "details": { "field": "validation error details (optional)" }
  }
}
```

### API Endpoints

**Content Analysis Pipeline** (`/api/v1/analyze*`)
- `POST /api/v1/analyze/url` - Extract and analyze content from URL
- `POST /api/v1/analyze/pdf` - Extract and analyze content from PDF file
- Both return: `{ topics: TopicItem[] }` or error response

**Asset Generation Pipeline** (`/api/v1/generate*`)
- `POST /api/v1/generate-prompts` - Generate 5 image prompts from topic text (no images)
- `POST /api/v1/generate-assets` - Full pipeline: prompts + images + processing (30-60s)
- `POST /api/v1/generate` - Complete lesson generation: assets + manifest + TTS audio (60-90s)
- Returns: `{ storyboardOverview: {...}, assets/images: [...] }` or error response

**Health Check** (`/api/health`)
- `GET /api/health` - Liveness probe, returns `{ status: "ok", timestamp: "..." }`

### Data Validation Rules

1. **Pydantic on Backend**: All LLM output MUST be validated by a Pydantic model
2. **Retry Logic**: If Pydantic validation fails, backend retries LLM once (max 1 retry)
3. **Never Return Raw Invalid Data**: Invalid LLM JSON is NEVER returned to frontend
4. **Error Messaging**: Use structured ErrorResponse with appropriate HTTP status codes

## Development Workflow

### Prerequisites

- Docker & Docker Compose v2.0+
- Node.js v20+ (for local frontend development)
- Python 3.11+ (for local backend development)

### Quick Start

1. **Clone and configure**:
   ```bash
   git clone <repository-url>
   cd studyfied
   cp .env.example .env
   # Edit .env and add your API keys (no quotes):
   # GEMINI_API_KEY=your_key_here
   # ELEVENLABS_API_KEY=your_key_here
   ```

2. **Start services**:
   ```bash
   docker-compose up --build
   ```
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs (interactive Swagger UI)

3. **View logs**:
   ```bash
   docker-compose logs -f              # All services
   docker-compose logs -f frontend     # Frontend only
   docker-compose logs -f backend      # Backend only
   ```

4. **Install dependencies in container**:
   ```bash
   docker-compose exec frontend npm install <package>
   docker-compose exec backend pip install <package>
   # Then update package.json or requirements.txt accordingly
   ```

5. **Stop services**:
   ```bash
   docker-compose down       # Stop containers
   docker-compose down -v    # Stop and remove volumes (including node_modules)
   ```

6. **Rebuild after dependency changes**:
   ```bash
   docker-compose up --build  # Rebuild images with new dependencies
   ```

### Local Development (No Docker)

**Frontend**:
```bash
cd frontend
npm install
npm run dev
```

**Backend**:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Running Tests

```bash
# Backend tests (pytest)
docker-compose exec backend pytest
# Or with coverage
docker-compose exec backend pytest --cov=app --cov-report=html

# Frontend tests (vitest)
docker-compose exec frontend npm test
# Or with coverage
docker-compose exec frontend npm run test:coverage
```

### Common Development Tasks

```bash
# Lint frontend code
docker-compose exec frontend npm run lint

# Build frontend for production
docker-compose exec frontend npm run build

# Check backend API documentation
# Open browser to http://localhost:8000/docs

# Access Python shell in backend container
docker-compose exec backend python

# Access Node shell in frontend container
docker-compose exec frontend npm run dev

# Restart a single service
docker-compose restart backend

# View service status
docker-compose ps
```

## Service Architecture

### Content Ingestion Pipeline

```
User Input (URL or PDF)
    ↓
ContentIngestorService
  ├── extract_from_url() [Crawl4AI]
  ├── extract_from_pdf() [PyMuPDF]
  └── validate_content()
    ↓
LibrarianService
  └── extract_topics() [Gemini LLM]
    ↓
AnalyzeResponse JSON
    ↓
Frontend State Management
```

### Services Overview

**ContentIngestorService** (`backend/app/services/content_ingestor.py`)
- Extracts text from URLs (bypassing anti-bot checks with Crawl4AI)
- Extracts text from PDFs (PyMuPDF with size validation)
- Validates content length (100 - 50,000 characters)
- Custom exceptions for each failure mode

**LibrarianService** (`backend/app/services/librarian.py`)
- Uses Gemini 3 Flash Preview to extract teachable topics
- Generates JSON response with topic metadata
- Implements 1-retry logic for JSON/validation failures
- System prompt defines strict extraction rules from `docs/prompt-spec.md`

**AIDirectorService** (`backend/app/services/ai_director.py`)
- Uses Gemini 3 Flash Preview to generate complete lesson manifests with scenes, checkpoints, and visual events
- Orchestrates lesson script generation with audio-visual sync (Khan Academy style narration)
- Maps TTS lines to visual events and checkpoints for synchronization
- Enforces hard constraints: max 180 seconds duration, max 5 scenes
- Validates all asset references and checkpoint consistency
- Implements 1-retry logic for JSON/validation failures
- References `docs/prompt-spec.md` section "Language Model Prompt (Lesson Director)" (lines 280-483)

**AssetFactoryService** (`backend/app/services/asset_factory.py`)
- Calls Nano Banana Pro API for high-res image generation (async polling with backoff)
- Processes images with OpenCV HSV Smart Key for background removal
- Preserves teal (H: 80-100) and orange (H: 10-25) accent colors
- Generates transparent PNG assets in parallel for performance
- Uses module-level singleton with shared aiohttp session

**ImageSteeringService** (`backend/app/services/image_steering.py`)
- Analyzes topics and generates exactly 5 sketch-note style image prompts via Gemini
- Ensures visual consistency (Black/White + Teal/Orange accents)
- Validates mandatory prompt prefix and enforces exactly 5 images
- Implements 1-retry logic for validation failures

**TTSService** (`backend/app/services/tts_service.py`)
- Generates audio from lesson narration script using ElevenLabs API
- Uses Rachel voice (voice ID: 21m00Tcm4TlvDq8ikWAM) with eleven_multilingual_v2 model
- Returns MP3 audio at 44.1kHz/128kbps for optimal quality
- Graceful fallback in development: returns empty audio when API key not configured
- Concatenates narration segments with pauses (" ... ") between segments
- Provides audio duration extraction using mutagen library
- Handles quota limits and authentication errors with structured exceptions

### Exception Hierarchy

Custom exceptions in `backend/app/services/exceptions.py`:
- `ContentIngestorError` (base)
  - `URLNotAccessibleError` (404, timeout, paywall)
  - `PDFTooLargeError` (>10MB)
  - `PDFInvalidError` (corrupted, encrypted)
  - `ContentExtractionError` (parsing failed)
  - `ContentTooShortError` (<100 chars)
  - `ContentTooLongError` (>50,000 chars)
- `TopicExtractionError` (base)
  - `InvalidAPIKeyError` (shared with ImageSteeringService - both use Gemini)
  - `TopicExtractionFailedError` (LLM generation failed)
- `ImageGenerationError` (base)
  - `ImagePromptGenerationError` (Gemini prompt generation failed)
  - `InvalidImagePromptCountError` (not exactly 5 prompts)
  - `ImageGenerationError` (image generation API errors)
  - `ImageProcessingError` (OpenCV processing failures)
- `LessonGenerationError` (base)
  - `LessonScriptGenerationError` (Gemini lesson generation failed)
  - `InvalidLessonDurationError` (duration exceeds 180 seconds)
  - `InvalidSceneCountError` (scene count exceeds 5)
- `TTSGenerationError` (base)
  - `ElevenLabsAPIError` (ElevenLabs API call failures)
  - `AudioGenerationError` (audio generation failures)

## Key Implementation Details

### Audio-Visual Synchronization (Checkpoint Sync)

**Pattern**: Instead of syncing every pixel to audio, the system forces animation to wait for TTS timestamp at the end of every sentence before starting the next stroke.

**Implementation Location**: `AIDirectorService.generate_lesson_manifest()` - Each narration segment has a `checkpointId` that aligns with visual events

**Data Flow**:
1. Backend generates lesson manifest with synchronized checkpoints
2. Frontend types in `frontend/src/types/lesson.ts` mirror backend Pydantic schemas
3. Zustand stores manage playback state (`playerStore.ts`) and lesson data (`lessonStore.ts`)
4. Visual events trigger at specific checkpoint timestamps during audio playback

### Asset Pipeline

**Process**:
1. ImageSteeringService generates prompts (sketch-note style)
2. AssetFactoryService calls Nano Banana Pro API in parallel
3. OpenCV processes images with HSV Smart Key for background removal
4. Transparent PNGs are stored in IndexedDB as Blobs
5. Konva canvas injects Blobs as Image nodes

**Technical Details**:
- Images are fetched as base64 or URLs from backend
- Frontend converts to Blob and stores in IndexedDB using `idb-keyval`
- Blob URLs are created for rendering: `URL.createObjectURL(blob)`
- Konva Image nodes use these blob URLs as `src` property

### State Management

**Transient State** (Zustand): Current playback position, user interactions, UI state
**Persistent State** (IndexedDB): Generated assets (PNG Blobs), audio files, lesson JSON

### CORS Configuration

- Development: Frontend on localhost:5173, Backend on localhost:8000
- Both directions proxied through Vite dev server and Docker Compose environment variables
- Configured in `app/main.py` via `settings.cors_origins_list`

## Performance Targets

- **End-to-End Latency**: <60 seconds from input submission to lesson playback
- **Canvas FPS**: 60fps on average laptop (Chrome/Edge/Firefox)
- **Hallucination Rate**: <10% factual errors in generated scripts (user-reported)
- **Recovery**: System must alert user within 10s if generation fails

## Privacy & Security

- **No PII Storage**: User inputs (PDFs/URLs) processed in memory only
- **No Database**: Guest mode only, stateless backend
- **No Authentication**: Frictionless "Time to Insight"
- **CORS Protection**: Restricted to configured origins
- **Input Validation**: Pydantic schemas on all endpoints

## Best Practices

### Backend Development

1. **Always use async/await**: Use `asyncio.to_thread()` to wrap blocking sync calls
2. **Validate AI output**: Parse all LLM responses through Pydantic before returning
3. **Implement retry logic**: One automatic retry for JSON/validation errors
4. **Use structured exceptions**: Custom exceptions with descriptive error codes (see `backend/app/services/exceptions.py`)
5. **Log appropriately**: Use logging module, not print statements
6. **Service singletons**: Module-level service instances for performance (stateless for request data)
7. **Session management**: Shared HTTP sessions in singletons must not be closed per-request (race condition risk)
8. **Pydantic validation**: Use `max_length` constraints carefully - they prevent graceful handling of excess data
9. **Settings pattern**: Use `@lru_cache` decorator for settings instances (see `backend/app/core/config.py`)
10. **Router organization**: Group related endpoints in routers (health, analyze, generate_assets, generate_lesson)

### Frontend Development

1. **Feature-based organization**: Use `/src/features/{domain}` for related components
2. **Reusable components**: Extract common UI to `/src/shared`
3. **Type safety**: Use TypeScript strict mode for all files
4. **Type alignment**: TypeScript types in `frontend/src/types/` must match backend Pydantic schemas (camelCase)
5. **React Query**: Wrap all async operations for automatic caching/refetching
6. **Zustand stores**: Keep state management focused and composable (separate stores for lesson, player, annotations)
7. **IndexedDB for assets**: Use idb-keyval wrapper in `/src/lib/db.ts`
8. **Konva best practices**: Reference canvas utilities in `/src/lib/konva-utils`
9. **Component organization**: `.tsx` for React components, `.ts` for utilities
10. **Export pattern**: Use barrel exports (`index.ts`) for feature modules
11. **Tailwind v4 compliance**: Follow semantic utility classes from `tailwindv4.md` (see CSS & Styling section below)

### Code Style

1. **ESLint**: Run `npm run lint` before committing frontend code
2. **Type annotations**: Explicit return types on all functions
3. **Comments**: Docstrings on services and public APIs (reference docs/prompt-spec.md when applicable)
4. **No hardcoding**: Use configuration files or environment variables
5. **Error handling**: Never silently fail; always log and return structured errors
6. **Imports**: Use absolute imports where configured, group by external/internal

### CSS & Styling (Tailwind v4)

**This project uses Tailwind v4 with the Theme-First Strategy. Follow these rules strictly:**

1. **Use semantic utilities**: `bg-primary`, `text-danger`, `border-success` (defined in `@theme` block)
2. **Never use arbitrary color values**: Avoid `bg-[#3b82f6]` or `text-[var(--color-primary)]`
3. **Opacity modifiers work automatically**: Use `bg-primary/90`, `text-danger/80` instead of defining separate shades
4. **Import syntax**: Use `@import "tailwindcss";` (not the old `@tailwind` directives)
5. **Theme definition**: All colors, fonts, spacing go in `@theme` block in `frontend/src/index.css`
6. **Standard grays are OK**: Using `bg-gray-50`, `text-gray-600` is acceptable (Tailwind defaults)

**Theme Colors (defined in `frontend/src/index.css`):**
- `primary` (#3b82f6) - Main brand color for buttons, links, accents
- `secondary` (#8b5cf6) - Secondary brand color
- `accent` (#3b82f6) - Accent color for highlights
- `danger` (#ef4444) - Error states, destructive actions
- `success` (#10b981) - Success states, confirmations
- `warning` (#f59e0b) - Warning states, cautions
- `info` (#06b6d4) - Informational messages

**Examples:**
```tsx
// ✅ CORRECT - Semantic utilities with opacity modifiers
<button className="bg-primary hover:bg-primary/90 text-white">Click Me</button>
<div className="border border-danger/20 text-danger">Error message</div>
<input className="accent-primary" type="range" />

// ❌ WRONG - Hardcoded colors or arbitrary values
<button className="bg-blue-600 hover:bg-blue-700">Click Me</button>
<div className="border border-[#ef444420]">Error message</div>
<input className="accent-[#3b82f6]" type="range" />
```

**Reference**: See `tailwindv4.md` for complete Tailwind v4 guidelines and migration notes

## Useful Documentation References

- **Product Requirements**: `docs/prd.md` - Full feature set, user journeys, success criteria
- **Architecture Decisions**: `docs/architecture.md` - Tech stack rationale, patterns, boundaries
- **AI Prompt Specifications**: `docs/prompt-spec.md` - Complete prompt templates for all LLM calls
- **PRD Prompt Engineering Task**: `docs/T0__Prompt_Engineering_&_AI_Quality_Tuning.md`
- **Task: Prompt Spec Integration**: `docs/TASK__Add_Prompt_Spec_References_to_Backend_Service_Placeholders.md`

## Feature Implementation Roadmap

### Phase 1: MVP (Current)
- ✅ Content Ingestion (URLs, PDFs) - ContentIngestorService
- ✅ Topic Extraction (Librarian Agent) - LibrarianService
- ✅ Image Prompt Generation - ImageSteeringService
- ✅ Asset Generation & Processing - AssetFactoryService (Nano Banana + OpenCV)
- ✅ Lesson Script Generation - AIDirectorService
- ✅ Audio Generation & Sync - TTSService
- 🔄 Canvas Rendering & Playback
- 🔄 Interactive Quizzes

### Phase 2: Growth Features (Post-MVP)
- [ ] Teacher Mode with dashboard
- [ ] Student lesson annotation/remixing
- [ ] Visual Q&A with Lasso selection
- [ ] Optimistic UI for async operations

### Phase 3: Vision (Future)
- [ ] Full Textbook Mode (semester-long curriculum)
- [ ] Multi-device synchronization (Smart Class)

## Debugging Tips

### Backend Issues

1. **Check logs**: `docker-compose logs -f backend`
2. **API Docs**: Open http://localhost:8000/docs for interactive Swagger UI
3. **Test endpoints**: Use curl or Postman to test individual endpoints
4. **Environment variables**: Verify `.env` has required API keys (e.g., `GEMINI_API_KEY`, `ELEVENLABS_API_KEY`) or configure keys in the UI settings page (`/settings`).
5. **Python errors**: Full traceback appears in logs with async context
6. **Health check**: Verify `/api/health` returns `{"status": "ok"}` before debugging other endpoints
7. **Pydantic validation errors**: Check if LLM output matches expected schema in `backend/app/schemas/`

### Frontend Issues

1. **Dev console**: Browser DevTools (F12) for JS errors
2. **Network tab**: Check API requests/responses (should show `/api/*` proxied to backend)
3. **Vite HMR**: Hot module replacement should work; check console for issues
4. **Build errors**: Run `npm run build` locally to catch TypeScript issues
5. **Type mismatches**: Ensure frontend types match backend schema (camelCase conversion)
6. **Zustand DevTools**: Install Redux DevTools extension for state inspection

### Common Issues

- **Backend won't start**: Check if port 8000 is already in use or health check is failing
- **Frontend won't connect**: Verify proxy URL in `vite.config.ts` matches backend address (default: `http://backend:8000`)
- **API keys not working**: Ensure .env file exists in root directory and is properly formatted (no quotes around values)
- **Dependency conflicts**: Try `npm ci` (frontend) or remove `venv` and reinstall (backend)
- **CORS errors**: Verify `CORS_ORIGINS` in docker-compose.yml matches frontend URL
- **Docker build fails**: Check if volumes are properly mounted in docker-compose.yml
- **Module not found**: Ensure dependencies are installed inside containers with `docker-compose exec {service} npm install` or `pip install`

## Contributing Guidelines

1. **Branch naming**: Use `feature/`, `fix/`, `docs/` prefixes
2. **Commit messages**: Be descriptive; reference related docs or tickets
3. **Testing**: Run tests before pushing; maintain or improve coverage
4. **Type safety**: Fix all TypeScript errors before submitting PR
5. **API contracts**: Update schema docs if changing request/response formats
6. **Naming**: Follow established conventions; update AGENTS.md if creating new patterns

## Contact & Support

For questions about this guide or project architecture:
1. Check related documentation files in `/docs`
2. Review architecture.md for decision rationale
3. Check TASK files for implementation guidance
4. Search codebase for similar patterns

---

## Known Issues and Gotchas

### Race Conditions
- **Fixed**: AssetFactoryService no longer closes shared HTTP session per-request
- Module-level singletons with async resources must manage lifecycle carefully

### Validation Constraints
- **Fixed**: ImageSteeringResponse removed `max_length=5` to allow graceful slicing
- Pydantic `max_length` causes validation errors before code can handle excess data

### Color Processing
- Teal HSV range in OpenCV: H: 80-100 (not 160-180 which would be magenta)
- Orange HSV range: H: 10-25
- Smart Key preserves accent colors while removing white background (S: 0-30, V: 200-255)

### API Polling
- Nano Banana polling: ~2-2.5 minutes max with exponential backoff (30 attempts)
- Initial interval: 2s, backoff: 1.2x, max interval: 5s

## Quick Reference

### Key Commands

| Task | Command |
|------|---------|
| Start all services | `docker-compose up --build` |
| Stop all services | `docker-compose down` |
| View logs | `docker-compose logs -f [service]` |
| Install package (frontend) | `docker-compose exec frontend npm install <pkg>` |
| Install package (backend) | `docker-compose exec backend pip install <pkg>` |
| Lint frontend | `docker-compose exec frontend npm run lint` |
| Run tests (backend) | `docker-compose exec backend pytest` |
| Run tests (frontend) | `docker-compose exec frontend npm test` |

### Important URLs

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | React application |
| Backend API | http://localhost:8000 | FastAPI backend |
| API Docs | http://localhost:8000/docs | Interactive Swagger UI |
| Health Check | http://localhost:8000/api/health | Service health status |

### Key Files Reference

| File | Purpose |
|------|---------|
| `backend/app/main.py` | FastAPI app setup, CORS config, router registration |
| `backend/app/core/config.py` | Environment settings with `@lru_cache` |
| `backend/app/schemas/__init__.py` | CamelCaseModel base class for API contracts |
| `backend/app/services/exceptions.py` | Custom exception hierarchy |
| `frontend/src/types/lesson.ts` | TypeScript types matching backend schemas |
| `frontend/vite.config.ts` | Vite config with API proxy setup |
| `docs/prompt-spec.md` | Complete AI prompt specifications |
| `docs/architecture.md` | Architecture decisions and rationale |

---

**Last Updated**: 2026-01-31
**Document Version**: 1.2
