# T1: Project Foundation & Docker Setup

## Metadata
| Field | Value |
|-------|-------|
| **ID** | `T1` |
| **Epic ID** | `EPIC-1` |
| **Created At** | 2026-01-15 09:00 |
| **Status** | DONE |
| **Size** | STORY |

## Description
Establish the foundational project structure with a polyglot monorepo architecture, Docker Compose orchestration for local development, and health check infrastructure to validate service readiness. This ticket sets up the development environment for all subsequent AI pipeline and frontend work.

## Scope

**In Scope:**
- Monorepo structure with `backend/` (Python FastAPI) and `frontend/` (React TypeScript) directories
- Docker Compose configuration with frontend and backend services
- Multi-stage Dockerfiles for both services (development + production builds)
- Environment variable configuration (`.env.example` template with API keys)
- CORS setup for cross-origin requests between frontend and backend
- API proxy configuration in Vite dev server (`/api/*` → `http://backend:8000`)
- Health check endpoint (`GET /api/health`) returning JSON status
- TCP health check configuration in Docker Compose for service readiness
- Basic project documentation (`README.md`, `AGENTS.md`)
- Git configuration (`.gitignore`, `.dockerignore`)

**Out of Scope:**
- AI service integration (T2, T3, T4)
- Frontend UI components beyond basic health check demo (T7)
- State management setup (T8)
- Canvas rendering infrastructure (T5, T6)

## Acceptance Criteria

- [x] Monorepo structure created with `backend/` and `frontend/` directories
- [x] `docker-compose.yml` defines frontend and backend services with proper networking
- [x] Backend Dockerfile uses Python 3.11+ with Uvicorn server
- [x] Frontend Dockerfile uses Node.js with Nginx multi-stage build
- [x] `.env.example` template includes placeholders for `GEMINI_API_KEY`, `NANO_BANANA_API_KEY`, `ELEVENLABS_API_KEY`
- [x] FastAPI app includes CORS middleware configured via environment variable
- [x] Vite config includes proxy rule: `/api` → `http://backend:8000`
- [x] Health check endpoint returns `{ "status": "ok", "timestamp": "..." }`
- [x] Docker Compose includes TCP health check for backend service
- [x] `docker-compose up --build` starts both services successfully
- [x] Frontend accessible at `http://localhost:5173`
- [x] Backend API accessible at `http://localhost:8000`
- [x] API docs accessible at `http://localhost:8000/docs` (Swagger UI)
- [x] Health check demo in frontend (`App.tsx`) successfully calls backend
- [x] Hot module replacement (HMR) works in frontend development mode
- [x] Backend auto-reload works with Uvicorn `--reload` flag

## Spec References

- **Epic Brief**: spec:509268fd-53cc-4271-8fce-6b32f347b891 (Section: Context & Problem - "Friction-free onboarding")
- **Tech Plan**: spec:509268fd-53cc-4271-8fce-6b32f347b891/c02c6bb2-6b7c-417a-a9b0-5d34542cd940 (Section 1: Architectural Approach - Docker orchestration)
- **Architecture Doc**: file:docs/architecture.md (Section: Technology Stack, DevOps)
- **PRD**: file:docs/prd.md (NFR1 - Local development environment)

## Dependencies

None - This is the foundation ticket that all others depend on.

## Implementation Notes

### Files Created

**Root Level:**
- `docker-compose.yml` - Service orchestration with frontend, backend, and shared network
- `docker-compose.override.yml.example` - Optional local overrides template
- `.env.example` - Environment variable template with API key placeholders
- `.dockerignore` - Excludes `node_modules`, `.git`, `__pycache__` from build context
- `.gitignore` - Standard Python, Node.js, and IDE exclusions
- `README.md` - Project overview, quick start, development workflow
- `AGENTS.md` - Developer guide with conventions and architecture

**Backend Structure:**
- `backend/Dockerfile` - Multi-stage build: development (Python 3.11 + Uvicorn) and production stages
- `backend/pyproject.toml` - Python project metadata and dependency management
- `backend/requirements.txt` - Pip dependencies mirroring pyproject.toml
- `backend/.dockerignore` - Backend-specific build exclusions
- `backend/app/__init__.py` - Package initialization
- `backend/app/main.py` - FastAPI app setup, CORS configuration, router registration
- `backend/app/core/__init__.py` - Core module initialization
- `backend/app/core/config.py` - Settings class with environment variable loading (`@lru_cache` pattern)
- `backend/app/routers/__init__.py` - Routers module initialization
- `backend/app/routers/health.py` - Health check endpoint implementation
- `backend/app/schemas/__init__.py` - Pydantic schemas with `CamelCaseModel` base class
- `backend/app/services/__init__.py` - Services module initialization

**Frontend Structure:**
- `frontend/Dockerfile` - Multi-stage build: Node.js development + Nginx production
- `frontend/package.json` - Node dependencies (React 19, Vite, TypeScript, TailwindCSS)
- `frontend/vite.config.ts` - Vite build config with API proxy to backend
- `frontend/tsconfig.json` - TypeScript project references
- `frontend/tsconfig.app.json` - Application TypeScript config
- `frontend/tsconfig.node.json` - Node scripts TypeScript config
- `frontend/tailwind.config.js` - TailwindCSS v4 configuration
- `frontend/postcss.config.js` - PostCSS plugins (Tailwind)
- `frontend/eslint.config.js` - ESLint rules for React and TypeScript
- `frontend/.dockerignore` - Frontend-specific build exclusions
- `frontend/.gitignore` - Node modules and build artifacts
- `frontend/index.html` - HTML entry point
- `frontend/nginx.conf` - Production web server config with SPA routing
- `frontend/src/main.tsx` - React app entry point
- `frontend/src/App.tsx` - Root component with health check demo
- `frontend/src/App.css` - Component-specific styles
- `frontend/src/index.css` - Global styles with Tailwind v4 imports
- `frontend/src/assets/react.svg` - React logo asset
- `frontend/public/vite.svg` - Vite logo asset

### Key Technical Decisions

**1. Docker Compose Orchestration**
- **Rationale**: Simplifies local development by managing multi-service dependencies (frontend, backend) with a single command
- **Implementation**: Services share a Docker network, environment variables passed via `.env` file
- **Benefit**: Consistent development environment across team members, eliminates "works on my machine" issues

**2. Vite API Proxy Configuration**
```typescript
// frontend/vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'http://backend:8000',
      changeOrigin: true,
    }
  }
}
```
- **Rationale**: Avoids CORS issues in development by proxying API requests through Vite dev server
- **Implementation**: All `/api/*` requests forwarded to backend service
- **Benefit**: Seamless frontend-backend integration without CORS preflight complexity

**3. CORS Configuration Strategy**
```python
# backend/app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```
- **Rationale**: Allows controlled cross-origin access for frontend development
- **Implementation**: Origins configured via `CORS_ORIGINS` environment variable (default: `http://localhost:5173`)
- **Benefit**: Secure by default, easily configurable for different environments

**4. Health Check Pattern**
- **Rationale**: Provides liveness probe for Docker Compose and future deployment orchestration
- **Implementation**: Simple JSON endpoint with timestamp, TCP health check in Docker Compose
- **Benefit**: Validates service readiness before accepting traffic, aids in debugging startup issues

**5. Settings with `@lru_cache` Decorator**
```python
# backend/app/core/config.py
@lru_cache()
def get_settings():
    return Settings()
```
- **Rationale**: Singleton pattern for settings instances to avoid repeated environment variable parsing
- **Implementation**: FastAPI dependency injection pattern with cached settings
- **Benefit**: Performance optimization, consistent configuration access across app

### Challenges Overcome

**Challenge 1: Port Conflicts During Local Testing**
- **Problem**: Backend port 8000 already in use by local Python projects
- **Solution**: Documented port configuration in `.env.example`, added port mapping override instructions
- **Time Impact**: ~30 minutes debugging, resolved by checking `docker-compose ps` and `netstat`

**Challenge 2: Volume Mounting for Node Modules**
- **Problem**: Initial setup mounted entire `frontend/` directory, causing node_modules conflicts between host and container
- **Solution**: Added anonymous volume for `node_modules` in docker-compose.yml to prioritize container version
- **Time Impact**: ~45 minutes researching Docker volume precedence rules
- **Implementation**:
```yaml
volumes:
  - ./frontend:/app
  - /app/node_modules  # Anonymous volume takes precedence
```

**Challenge 3: CORS Preflight Failures in Development**
- **Problem**: Browser OPTIONS requests failing due to strict CORS policy
- **Solution**: Added `allow_credentials=True` and wildcard methods/headers to CORS middleware
- **Time Impact**: ~20 minutes debugging with browser DevTools Network tab
- **Learning**: CORS preflight requires explicit OPTIONS method support

**Challenge 4: Hot Module Replacement Not Triggering**
- **Problem**: File changes in frontend not triggering HMR in Docker container
- **Solution**: Added Vite `server.watch.usePolling: true` for Docker environments (file system event propagation issues)
- **Time Impact**: ~15 minutes researching Vite Docker configuration
- **Note**: Polling has slight performance overhead but necessary for Docker on some host systems

### Testing & Validation

**Manual Testing Performed:**
1. ✅ `docker-compose up --build` successfully builds and starts both services
2. ✅ Frontend accessible at `http://localhost:5173` with React app rendering
3. ✅ Backend API accessible at `http://localhost:8000` with FastAPI welcome message
4. ✅ Swagger UI accessible at `http://localhost:8000/docs` with health endpoint documented
5. ✅ Health check endpoint returns `{"status": "ok", "timestamp": "2026-01-15T10:30:00Z"}`
6. ✅ Frontend health check demo successfully calls backend and displays response
7. ✅ HMR works: editing `App.tsx` triggers instant browser update
8. ✅ Backend auto-reload works: editing `main.py` triggers Uvicorn restart
9. ✅ CORS working: no preflight errors in browser console
10. ✅ Logs viewable via `docker-compose logs -f [service]`

**Environment Variables Validated:**
- `GEMINI_API_KEY` - Placeholder in `.env.example`, validated in T2
- `NANO_BANANA_API_KEY` - Placeholder in `.env.example`, validated in T3
- `ELEVENLABS_API_KEY` - Placeholder in `.env.example`, validated in T4
- `CORS_ORIGINS` - Defaults to `http://localhost:5173`, tested with multiple origins

**Performance Metrics:**
- Cold start time: ~15 seconds (Docker build + service startup)
- Warm start time: ~3 seconds (cached layers, no rebuild)
- HMR update latency: <500ms (instant feedback)
- Backend reload time: ~2 seconds (Uvicorn graceful restart)

## Validation Results

**Status**: PASSED ✅  
**Completed**: 2026-01-15  
**Validated By**: Manual testing and team review

**Validation Evidence:**
- All 16 acceptance criteria met
- Docker Compose successfully orchestrates both services
- Health check endpoint operational
- CORS configured correctly for development
- API proxy working seamlessly
- Hot reload functional in both frontend and backend
- Documentation complete and accurate

**Next Steps:**
- Proceed to T2 (Content Ingestion & Topic Extraction)
- Begin AI pipeline integration with Gemini API
- Use `@plan-mode T2` to break down content ingestion implementation