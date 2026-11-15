"""FastAPI application entry point for the Automated Multi-Platform Posting System."""

import logging
from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse

from app.config import Settings, get_settings
from app.schemas import HealthResponse, PostingRequest, PostingResponse
from app.services.posting_service import PostingService

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)
logger = logging.getLogger("app.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle event handler for FastAPI startup and shutdown."""
    settings = get_settings()
    logger.info("Starting Automated Multi-Platform Posting System on port 4000.")
    logger.info(
        "Platform readiness: Bluesky=%s, Mastodon=%s, Dev.to=%s, Telegram=%s, Discord=%s",
        settings.is_bluesky_configured,
        settings.is_mastodon_configured,
        settings.is_devto_configured,
        settings.is_telegram_configured,
        settings.is_discord_configured,
    )
    yield
    logger.info("Shutting down Automated Multi-Platform Posting System.")


app = FastAPI(
    title="Automated Multi-Platform Posting System",
    description=(
        "Production-ready REST API for concurrently publishing updates to "
        "Bluesky, Mastodon, Dev.to, Telegram, and Discord with URL extraction, "
        "public access verification, and isolated error handling."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Enable CORS for frontend web integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc: RequestValidationError):
    """Format Pydantic validation errors with clear, actionable error feedback."""
    errors = []
    for err in exc.errors():
        field_loc = " -> ".join(str(loc) for loc in err.get("loc", []))
        errors.append(f"{field_loc}: {err.get('msg')}")

    return JSONResponse(
        status_code=422,
        content={
            "detail": "Input validation error",
            "errors": errors,
        },
    )


def get_posting_service(
    settings: Annotated[Settings, Depends(get_settings)]
) -> PostingService:
    """Dependency provider for PostingService."""
    return PostingService(settings=settings)


@app.get("/", include_in_schema=False)
async def root():
    """Redirect root access directly to interactive Swagger UI documentation."""
    return RedirectResponse(url="/docs")


@app.get(
    "/health",
    response_model=HealthResponse,
    summary="Service Health and Platform Readiness",
    tags=["System"],
)
async def health_check(
    settings: Annotated[Settings, Depends(get_settings)]
) -> HealthResponse:
    """Check health status and verify which platform credentials are configured."""
    return HealthResponse(
        status="ok",
        platforms_configured={
            "bluesky": settings.is_bluesky_configured,
            "mastodon": settings.is_mastodon_configured,
            "devto": settings.is_devto_configured,
            "telegram": settings.is_telegram_configured,
            "discord": settings.is_discord_configured,
        },
        version="1.0.0",
    )


@app.post(
    "/posting",
    response_model=PostingResponse,
    status_code=status.HTTP_200_OK,
    summary="Publish message across all platforms",
    tags=["Posting"],
)
async def publish_message(
    payload: PostingRequest,
    posting_service: Annotated[PostingService, Depends(get_posting_service)],
) -> PostingResponse:
    """Accept a validated message containing exactly one HTTP/HTTPS URL and publish it concurrently.

    Requirements:
    - Message length <= 200 characters.
    - Exactly one valid HTTP or HTTPS URL.
    - Client cannot select platforms; publication is handled across all 5 platforms.
    - Isolated execution: any individual platform failure does not cancel remaining platforms.
    - Returns normalized response with overall success flag, summary counts, and per-platform results.
    """
    try:
        response = await posting_service.publish_all(payload.message)
        return response
    except Exception as exc:
        logger.exception("Unexpected system failure during posting execution.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during multi-platform posting operation.",
        )
