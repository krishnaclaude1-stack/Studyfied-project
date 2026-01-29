"""SJinn Tool API client.

Implements Nano Banana Pro image generation using:
- POST /api/un-api/create_tool_task
- POST /api/un-api/query_tool_task_status

Docs: https://sjinn.ai/docs/api/tool/nano-banana-image-pro
"""

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass
from typing import Any
from urllib.parse import urljoin

import aiohttp

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class SjinnAuth:
    base_url: str  # e.g. https://sjinn.ai
    api_key: str


class SjinnToolClient:
    def __init__(self, timeout_seconds: float = 180.0):
        self._timeout = aiohttp.ClientTimeout(total=timeout_seconds)
        self._session: aiohttp.ClientSession | None = None

    async def _get_session(self) -> aiohttp.ClientSession:
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession(timeout=self._timeout)
        return self._session

    async def close(self) -> None:
        """Close the HTTP session. Should be called on shutdown."""
        if self._session and not self._session.closed:
            await self._session.close()
            self._session = None

    @staticmethod
    def _headers(api_key: str) -> dict[str, str]:
        return {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}

    async def create_nano_banana_task(
        self,
        *,
        auth: SjinnAuth,
        prompt: str,
        tool_type: str = "nano-banana-image-api",
        aspect_ratio: str = "auto",
        resolution: str = "1K",
        image_list: list[str] | None = None,
    ) -> str:
        """Create a SJinn tool task and return task_id.
        
        Args:
            prompt: Text description of the image content (required, must be non-empty)
            tool_type: Either "nano-banana-image-api" (standard, 50 credits) 
                       or "nano-banana-image-pro-api" (pro, 150 credits)
            aspect_ratio: Optional aspect ratio
            resolution: Optional resolution
            image_list: Optional reference images for editing
        
        Raises:
            ValueError: If prompt or API key is empty or None
        """
        
        # Validate required parameters
        if not auth.api_key or not auth.api_key.strip():
            raise ValueError("api_key must be a non-empty string")
        
        if not prompt or not prompt.strip():
            raise ValueError("prompt must be a non-empty string")

        session = await self._get_session()
        url = auth.base_url.rstrip("/") + "/api/un-api/create_tool_task"

        payload: dict[str, Any] = {
            "tool_type": tool_type,
            "input": {
                "prompt": prompt,
            },
        }

        if image_list:
            payload["input"]["image_list"] = image_list
        if aspect_ratio:
            payload["input"]["aspect_ratio"] = aspect_ratio
        if resolution:
            payload["input"]["resolution"] = resolution

        cost = 150 if tool_type == "nano-banana-image-pro-api" else 50
        logger.info(
            f"Creating SJinn task with tool_type={payload['tool_type']}, "
            f"resolution={resolution or 'default'}, aspect_ratio={aspect_ratio or 'default'}, "
            f"estimated_cost={cost} credits"
        )

        logger.info(f"Sending request to {url}")
        logger.info(f"Payload: {payload}")
        
        async with session.post(url, headers=self._headers(auth.api_key), json=payload) as resp:
            data = await resp.json(content_type=None)
            logger.info(f"Response status: {resp.status}")
            logger.info(f"Response data: {data}")
            
            if resp.status >= 400:
                raise RuntimeError(f"SJinn create_task HTTP {resp.status}: {data}")
            if not data.get("success", False):
                raise RuntimeError(f"SJinn create_task failed: {data.get('errorMsg') or data}")
            task_id = (data.get("data") or {}).get("task_id")
            if not task_id:
                raise RuntimeError(f"SJinn create_task missing task_id: {data}")
            
            logger.info(f"Task created successfully: {task_id}")
            return task_id

    async def poll_task_output_urls(
        self,
        *,
        auth: SjinnAuth,
        task_id: str,
        max_wait_seconds: int = 120,
        interval_seconds: float = 2.0,
    ) -> list[str]:
        """Poll task status until completed and return output_urls."""

        session = await self._get_session()
        url = auth.base_url.rstrip("/") + "/api/un-api/query_tool_task_status"

        deadline = asyncio.get_event_loop().time() + max_wait_seconds
        poll_count = 0
        
        logger.info(f"Starting to poll task {task_id} (max {max_wait_seconds}s, interval {interval_seconds}s)")
        
        while True:
            poll_count += 1
            elapsed = asyncio.get_event_loop().time() - (deadline - max_wait_seconds)
            
            async with session.post(
                url,
                headers=self._headers(auth.api_key),
                json={"task_id": task_id},
            ) as resp:
                data = await resp.json(content_type=None)
                
                if resp.status >= 400:
                    logger.error(f"Poll {poll_count}: HTTP {resp.status} - {data}")
                    raise RuntimeError(f"SJinn query_status HTTP {resp.status}: {data}")
                    
                if not data.get("success", False):
                    logger.error(f"Poll {poll_count}: API returned success=False - {data}")
                    raise RuntimeError(f"SJinn query_status failed: {data.get('errorMsg') or data}")

                payload = data.get("data") or {}
                status = payload.get("status")
                
                logger.info(f"Poll {poll_count} ({elapsed:.1f}s): status={status}, payload={payload}")
                
                if status == 1:
                    output_urls = payload.get("output_urls") or []
                    if not output_urls:
                        raise RuntimeError(f"SJinn completed but no output_urls: {payload}")
                    logger.info(f"Task completed! Output URLs: {output_urls}")
                    return output_urls
                    
                if status == -1:
                    error_msg = payload.get("error_msg") or payload.get("errorMsg") or "Unknown error"
                    logger.error(f"Task failed: {error_msg}")
                    raise RuntimeError(f"SJinn task failed: {payload}")

            if asyncio.get_event_loop().time() >= deadline:
                logger.error(f"Timeout after {poll_count} polls ({max_wait_seconds}s). Last status: {status}")
                raise RuntimeError(f"SJinn task timeout after {max_wait_seconds}s (polled {poll_count} times, last status={status})")

            await asyncio.sleep(interval_seconds)

    async def download_bytes(self, *, auth: SjinnAuth, url: str) -> bytes:
        session = await self._get_session()
        full_url = url
        if url.startswith("/"):
            full_url = urljoin(auth.base_url.rstrip("/") + "/", url.lstrip("/"))
        async with session.get(full_url) as resp:
            if resp.status >= 400:
                text = await resp.text()
                raise RuntimeError(f"SJinn download failed HTTP {resp.status}: {text[:300]}")
            return await resp.read()


sjinn_tool_client = SjinnToolClient()
