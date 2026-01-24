"""
Analyze Router

Provides the POST /api/v1/analyze endpoint for content ingestion and topic extraction.

Orchestrates ContentIngestorService and LibrarianService to:
1. Extract text from URL or PDF
2. Validate content
3. Extract topics using Gemini AI
4. Return structured topic menu
"""

import logging
from typing import Annotated, Optional, Union

from fastapi import APIRouter, File, HTTPException, UploadFile, status
from fastapi.responses import JSONResponse

from app.schemas.analyze import (
    AnalyzeUrlRequest,
    AnalyzeResponse,
    ErrorDetail,
    ErrorResponse,
)
from app.services.content_ingestor import ContentIngestorService
from app.services.librarian import LibrarianService
from app.services.exceptions import (
    ContentIngestorError,
    URLNotAccessibleError,
    PDFTooLargeError,
    PDFInvalidError,
    ContentExtractionError,
    ContentTooShortError,
    ContentTooLongError,
    TopicExtractionError,
    InvalidAPIKeyError,
    TopicExtractionFailedError,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["analyze"])

# Service instances (module-level singletons shared across all requests).
# This is intentional for performance - avoids recreating browser configs and API clients.
# These services are stateless for request-specific data, so sharing is safe.
content_ingestor = ContentIngestorService()
librarian = LibrarianService()


def create_error_response(
    status_code: int,
    code: str,
    message: str,
    details: Optional[dict] = None
) -> JSONResponse:
    """Create a structured error response."""
    error_response = ErrorResponse(
        error=ErrorDetail(
            code=code,
            message=message,
            details=details
        )
    )
    return JSONResponse(
        status_code=status_code,
        content=error_response.model_dump(by_alias=True)
    )


async def _process_and_extract_topics(raw_text: str, source_description: str):
    """Common logic to validate content and extract topics."""
    # Validate extracted content
    try:
        raw_text = content_ingestor.validate_content(raw_text)
    except ContentTooShortError as e:
        logger.warning(f"Content too short from {source_description}: {e.message}")
        return create_error_response(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            code=e.code,
            message=e.message,
            details=e.details
        )
    except ContentTooLongError as e:
        logger.warning(f"Content too long from {source_description}: {e.message}")
        return create_error_response(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            code=e.code,
            message=e.message,
            details=e.details
        )
    
    # Extract topics using Librarian service
    try:
        logger.info(f"Extracting topics from {len(raw_text)} characters of content")
        topics_data = await librarian.extract_topics(raw_text)
        return AnalyzeResponse(**topics_data)
    except InvalidAPIKeyError as e:
        logger.error(f"Invalid API key: {e.message}")
        return create_error_response(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code=e.code,
            message=e.message,
            details=e.details
        )
    except TopicExtractionFailedError as e:
        logger.error(f"Topic extraction failed: {e.message}")
        return create_error_response(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code=e.code,
            message=e.message,
            details=e.details
        )
    except TopicExtractionError as e:
        logger.error(f"Topic extraction error: {e.message}")
        return create_error_response(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code=e.code,
            message=e.message,
            details=e.details
        )
    except Exception as e:
        logger.exception(f"Unexpected error during topic extraction: {e}")
        return create_error_response(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code="INTERNAL_ERROR",
            message="An unexpected error occurred during topic extraction",
            details={"error": str(e)}
        )


@router.post(
    "/analyze",
    response_model=AnalyzeResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Bad Request - URL not accessible"},
        422: {"model": ErrorResponse, "description": "Unprocessable Entity - Content extraction failed"},
        500: {"model": ErrorResponse, "description": "Internal Server Error - Topic extraction failed"},
    },
    summary="Analyze URL content and extract topics",
    description="""
    Analyze educational content from a URL and extract teachable topics.
    
    Provide a JSON body with a `url` field.
    
    Returns a list of 1-5+ topics based on content density, each suitable for a 2-3 minute video lesson.
    """
)
async def analyze_url(request: AnalyzeUrlRequest) -> Union[AnalyzeResponse, JSONResponse]:
    """
    Analyze URL content and extract topics.
    
    Accepts JSON body with URL: {"url": "https://example.com/article"}
    
    Returns extracted topics suitable for video lessons.
    """
    url_str = str(request.url)
    source_description = f"URL: {url_str}"
    logger.info(f"Processing URL: {url_str}")
    
    try:
        raw_text = await content_ingestor.extract_from_url(url_str)
    except URLNotAccessibleError as e:
        logger.warning(f"URL not accessible: {e.message}")
        return create_error_response(
            status_code=status.HTTP_400_BAD_REQUEST,
            code=e.code,
            message=e.message,
            details=e.details
        )
    except ContentExtractionError as e:
        logger.error(f"URL extraction error: {e.message}")
        return create_error_response(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            code=e.code,
            message=e.message,
            details=e.details
        )
    except ContentIngestorError as e:
        logger.error(f"Content ingestor error: {e.message}")
        return create_error_response(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            code=e.code,
            message=e.message,
            details=e.details
        )
    
    return await _process_and_extract_topics(raw_text, source_description)


@router.post(
    "/analyze/pdf",
    response_model=AnalyzeResponse,
    responses={
        413: {"model": ErrorResponse, "description": "Payload Too Large - PDF exceeds size limit"},
        422: {"model": ErrorResponse, "description": "Unprocessable Entity - Content extraction failed"},
        500: {"model": ErrorResponse, "description": "Internal Server Error - Topic extraction failed"},
    },
    summary="Analyze PDF content and extract topics",
    description="""
    Analyze educational content from a PDF file and extract teachable topics.
    
    Upload a PDF file using multipart/form-data.
    
    Returns a list of 1-5+ topics based on content density, each suitable for a 2-3 minute video lesson.
    """
)
async def analyze_pdf(
    file: Annotated[UploadFile, File(description="PDF file to analyze")]
) -> Union[AnalyzeResponse, JSONResponse]:
    """
    Analyze PDF content and extract topics.
    
    Accepts multipart form with PDF file upload.
    
    Returns extracted topics suitable for video lessons.
    """
    source_description = f"PDF file: {file.filename}"
    logger.info(f"Processing PDF upload: {file.filename}")
    
    try:
        file_bytes = await file.read()
        raw_text = await content_ingestor.extract_from_pdf(file_bytes)
    except PDFTooLargeError as e:
        logger.warning(f"PDF too large: {e.message}")
        return create_error_response(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            code=e.code,
            message=e.message,
            details=e.details
        )
    except PDFInvalidError as e:
        logger.warning(f"Invalid PDF: {e.message}")
        return create_error_response(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            code=e.code,
            message=e.message,
            details=e.details
        )
    except ContentIngestorError as e:
        logger.error(f"PDF extraction error: {e.message}")
        return create_error_response(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            code=e.code,
            message=e.message,
            details=e.details
        )
    
    return await _process_and_extract_topics(raw_text, source_description)
