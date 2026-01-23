from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.routers import health, analyze, generate_assets, generate_lesson

settings = get_settings()

app = FastAPI(
    title="Studyfied API",
    description="AI-powered educational content generation backend",
    version="0.1.0",
)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router)
app.include_router(analyze.router)
app.include_router(generate_assets.router)
app.include_router(generate_lesson.router)
