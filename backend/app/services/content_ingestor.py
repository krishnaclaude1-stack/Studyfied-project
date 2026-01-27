"""
Content Ingestor Service

Extracts text content from PDFs and URLs for analysis.

Implementation Guide:
- PDF extraction: PyMuPDF
- URL extraction: Crawl4AI
- Input validation: URL accessibility, PDF size <10MB
- Output: Raw text for Librarian Agent
- Related Ticket: T2 - AI Pipeline - Content Ingestion & Topic Extraction
- Architecture: docs/architecture.md (Service Boundaries)
"""

import asyncio
import logging
from typing import Optional

import aiohttp
import pymupdf
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig

from .exceptions import (
    URLNotAccessibleError,
    PDFTooLargeError,
    PDFInvalidError,
    ContentExtractionError,
    ContentTooShortError,
    ContentTooLongError,
)

logger = logging.getLogger(__name__)

# Constants
MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024  # 10MB
MIN_CONTENT_LENGTH = 100
MAX_CONTENT_LENGTH = 50000
URL_TIMEOUT_SECONDS = 10


class ContentIngestorService:
    """Service for ingesting and processing educational content."""
    
    def __init__(self):
        """Initialize the content ingestor service."""
        self._browser_config = BrowserConfig(
            headless=True,
            verbose=False,
        )
    
    async def extract_from_url(self, url: str) -> str:
        """
        Extract text content from a URL using Crawl4AI.
        
        Args:
            url: The URL to extract content from.
            
        Returns:
            Extracted text content as a string.
            
        Raises:
            URLNotAccessibleError: If the URL cannot be accessed.
            ContentExtractionError: If content extraction fails.
        """
        # First, validate URL accessibility with HEAD request
        await self._validate_url_accessibility(url)
        
        try:
            async with AsyncWebCrawler(config=self._browser_config) as crawler:
                crawler_config = CrawlerRunConfig(
                    word_count_threshold=10,
                    excluded_tags=["nav", "footer", "header", "aside"],
                    exclude_external_links=True,
                )
                result = await crawler.arun(url=url, config=crawler_config)
                
                if not result.success:
                    raise ContentExtractionError(
                        source=url,
                        reason=f"Crawler failed: {result.error_message or 'Unknown error'}"
                    )
                
                # Use fit_markdown for filtered content, fallback to markdown
                text = ""
                if result.markdown:
                    if hasattr(result.markdown, 'fit_markdown') and result.markdown.fit_markdown:
                        text = result.markdown.fit_markdown
                    elif hasattr(result.markdown, 'raw_markdown') and result.markdown.raw_markdown:
                        text = result.markdown.raw_markdown
                    elif isinstance(result.markdown, str):
                        text = result.markdown
                
                if not text:
                    raise ContentExtractionError(
                        source=url,
                        reason="No text content could be extracted from the URL"
                    )
                
                logger.info(f"Successfully extracted {len(text)} characters from URL: {url}")
                return text
                
        except (URLNotAccessibleError, ContentExtractionError):
            raise
        except Exception as e:
            logger.error(f"Failed to extract content from URL {url}: {e}")
            raise ContentExtractionError(
                source=url,
                reason=str(e)
            )
    
    async def _validate_url_accessibility(self, url: str) -> None:
        """
        Validate that a URL is accessible.
        
        Args:
            url: The URL to validate.
            
        Raises:
            URLNotAccessibleError: If the URL is not accessible.
        """
        try:
            timeout = aiohttp.ClientTimeout(total=URL_TIMEOUT_SECONDS)
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
            async with aiohttp.ClientSession(timeout=timeout, headers=headers) as session:
                # Use GET instead of HEAD since many websites block HEAD requests.
                # aiohttp doesn't download the response body until explicitly read,
                # so we just check the status and exit the context manager.
                async with session.get(url, allow_redirects=True) as response:
                    if response.status in (401, 403):
                        raise URLNotAccessibleError(
                            url=url,
                            reason="Content is paywalled or requires authentication"
                        )
                    if response.status >= 400:
                        raise URLNotAccessibleError(
                            url=url,
                            reason=f"HTTP error {response.status}"
                        )
                    # Body is not read; aiohttp discards it when context exits
        except URLNotAccessibleError:
            raise
        except aiohttp.ClientError as e:
            raise URLNotAccessibleError(
                url=url,
                reason=f"Connection error: {str(e)}"
            )
        except asyncio.TimeoutError:
            raise URLNotAccessibleError(
                url=url,
                reason=f"Connection timeout after {URL_TIMEOUT_SECONDS} seconds"
            )
    
    async def extract_from_pdf(self, file_bytes: bytes) -> str:
        """
        Extract text content from a PDF file.
        
        Args:
            file_bytes: The PDF file content as bytes.
            
        Returns:
            Extracted text content as a string.
            
        Raises:
            PDFTooLargeError: If the PDF exceeds size limit.
            PDFInvalidError: If the PDF is corrupted or password-protected.
            ContentExtractionError: If content extraction fails.
        """
        # Validate file size
        if len(file_bytes) > MAX_PDF_SIZE_BYTES:
            raise PDFTooLargeError(
                size_bytes=len(file_bytes),
                max_size_bytes=MAX_PDF_SIZE_BYTES
            )
        
        doc = None
        try:
            # Open PDF from bytes
            doc = pymupdf.open(stream=file_bytes, filetype="pdf")
            
            # Check if PDF is encrypted/password-protected
            if doc.is_encrypted:
                raise PDFInvalidError(reason="PDF is password-protected")
            
            # Extract text from all pages
            text_parts = []
            for page_num, page in enumerate(doc):
                page_text = page.get_text()
                if page_text:
                    text_parts.append(page_text)
            
            if not text_parts:
                raise PDFInvalidError(reason="PDF contains no extractable text")
            
            text = "\n".join(text_parts)
            logger.info(f"Successfully extracted {len(text)} characters from PDF ({len(file_bytes)} bytes)")
            return text
            
        except (PDFTooLargeError, PDFInvalidError):
            raise
        except Exception as e:
            logger.error(f"Failed to extract content from PDF: {e}")
            raise PDFInvalidError(reason=f"Failed to parse PDF: {str(e)}")
        finally:
            # Ensure document is always closed to prevent resource leaks
            if doc is not None:
                doc.close()
    
    def validate_content(self, text: str) -> str:
        """
        Validate extracted content meets requirements.
        
        Args:
            text: The extracted text content.
            
        Returns:
            The validated text (with leading/trailing whitespace stripped).
            
        Raises:
            ContentTooShortError: If content is below minimum length.
            ContentTooLongError: If content exceeds maximum length (rejected, not truncated).
        """
        # Strip whitespace and check length
        text = text.strip()
        
        if len(text) < MIN_CONTENT_LENGTH:
            raise ContentTooShortError(
                length=len(text),
                min_length=MIN_CONTENT_LENGTH
            )
        
        if len(text) > MAX_CONTENT_LENGTH:
            raise ContentTooLongError(
                length=len(text),
                max_length=MAX_CONTENT_LENGTH
            )
        
        return text
