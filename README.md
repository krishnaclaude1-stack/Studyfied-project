# Studyfied

AI-powered educational content generation platform that transforms learning materials into interactive, animated lessons.

## Architecture Overview

Studyfied is a polyglot monorepo with:

- **Frontend**: Vite + React + TypeScript with TailwindCSS and Konva.js for canvas rendering
- **Backend**: FastAPI + Python for AI processing pipeline
- **Storage**: Client-side IndexedDB for stateless backend architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Docker Compose                          │
├─────────────────────────┬───────────────────────────────────┤
│   Frontend (port 5173)  │      Backend (port 8000)          │
│   ┌─────────────────┐   │   ┌─────────────────────────────┐ │
│   │  Vite + React   │   │   │  FastAPI + Python           │ │
│   │  + TypeScript   │◄──┼──►│  + Pydantic                 │ │
│   │  + TailwindCSS  │   │   │  + AI Services              │ │
│   │  + Konva.js     │   │   └─────────────────────────────┘ │
│   └─────────────────┘   │                                   │
└─────────────────────────┴───────────────────────────────────┘
```

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (v20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.0+)
- [Node.js](https://nodejs.org/) (v20+) - for local frontend development
- [Python](https://www.python.org/) (v3.11+) - for local backend development

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd studyfied
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env and add your API keys
   ```

3. **Start the development environment**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## Development Workflow

### Starting Services

```bash
# Start all services
docker-compose up

# Start in detached mode
docker-compose up -d

# Rebuild after dependency changes
docker-compose up --build
```

### Viewing Logs

```bash
# View all logs
docker-compose logs -f

# View frontend logs only
docker-compose logs -f frontend

# View backend logs only
docker-compose logs -f backend
```

### Running Commands in Containers

```bash
# Frontend: Install a new package
docker-compose exec frontend npm install <package-name>

# Backend: Run a Python command
docker-compose exec backend python -c "print('Hello')"
```

### Stopping Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

## Project Structure

```
studyfied/
├── docker-compose.yml       # Orchestration configuration
├── .env                     # Environment variables (gitignored)
├── .env.example             # Environment template
├── .gitignore               # Combined ignore patterns
├── README.md                # This file
│
├── frontend/                # Vite + React + TypeScript
│   ├── Dockerfile           # Multi-stage build configuration
│   ├── package.json         # Dependencies
│   ├── vite.config.ts       # Vite configuration with API proxy
│   ├── tsconfig.json        # TypeScript strict configuration
│   ├── tailwind.config.js   # TailwindCSS configuration
│   └── src/
│       ├── main.tsx         # React entry point
│       ├── App.tsx          # Root component with health check
│       ├── features/        # Feature-based organization
│       │   ├── editor/      # Input & lesson configuration
│       │   ├── player/      # Canvas runtime (Konva)
│       │   └── dashboard/   # Guest dashboard
│       ├── stores/          # Zustand state management
│       ├── shared/          # Reusable UI components
│       └── lib/
│           ├── konva-utils/ # Canvas utilities
│           └── db.ts        # IndexedDB wrapper
│
└── backend/                 # FastAPI + Python
    ├── Dockerfile           # Production configuration
    ├── pyproject.toml       # Python dependencies
    ├── requirements.txt     # Generated dependencies
    └── app/
        ├── main.py          # FastAPI app with CORS
        ├── core/
        │   └── config.py    # Environment configuration
        ├── routers/         # API endpoints
        │   └── health.py    # Health check endpoint
        ├── schemas/         # Pydantic models (camelCase)
        └── services/        # Business logic placeholders
            ├── librarian.py
            ├── content_ingestor.py
            ├── image_steering.py
            ├── asset_factory.py
            ├── ai_director.py
            └── tts_service.py
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `ENVIRONMENT` | Runtime environment (development/production) | No |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) | No |
| `GEMINI_API_KEY` | Google Gemini API key for AI features | Yes* |
| `NANO_BANANA_API_KEY` | Nano Banana API key for image generation | Yes* |
| `ELEVENLABS_API_KEY` | ElevenLabs API key for TTS | No |

*Required for full AI functionality

## API Endpoints

### Health Check

```
GET /api/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2026-01-30T12:00:00.000Z"
}
```

## Troubleshooting

### Port Already in Use

If ports 5173 or 8000 are already in use:

```bash
# Find and kill the process
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Linux/macOS
lsof -i :5173
kill -9 <PID>
```

Or change ports in `docker-compose.yml`.

### CORS Errors

If you see CORS errors in the browser console:

1. Verify `CORS_ORIGINS` in `.env` includes your frontend URL
2. Ensure the backend is running and accessible
3. Check that the frontend is calling the correct API URL

### Module Not Found

If you get "module not found" errors after adding dependencies:

```bash
# Rebuild containers
docker-compose up --build
```

### Container Won't Start

Check logs for specific errors:

```bash
docker-compose logs backend
docker-compose logs frontend
```

## Tech Stack

### Frontend
- [Vite](https://vitejs.dev/) - Build tool
- [React](https://react.dev/) - UI library
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [TailwindCSS](https://tailwindcss.com/) - Styling
- [Konva.js](https://konvajs.org/) - Canvas rendering
- [Zustand](https://zustand-demo.pmnd.rs/) - State management
- [TanStack Query](https://tanstack.com/query) - Server state
- [idb-keyval](https://github.com/jakearchibald/idb-keyval) - IndexedDB

### Backend
- [FastAPI](https://fastapi.tiangolo.com/) - Web framework
- [Pydantic](https://docs.pydantic.dev/) - Data validation
- [Uvicorn](https://www.uvicorn.org/) - ASGI server

## License

MIT
