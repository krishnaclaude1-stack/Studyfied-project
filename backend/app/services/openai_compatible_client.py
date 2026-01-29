"""OpenAI-compatible client.

This is intentionally minimal and HTTP-based so it works with *any* vendor that
implements the OpenAI API shape, when the user provides:
- base URL
- API key
- model name

We use Chat Completions for text agents and Images API for image generation.
"""

from __future__ import annotations

import asyncio
import json
import logging
from dataclasses import dataclass
from typing import Any, Literal

import aiohttp

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class OpenAICompatibleAuth:
    base_url: str  # should include /v1
    api_key: str


class OpenAICompatibleClient:
    """Thin async wrapper around OpenAI-compatible REST endpoints."""

    def __init__(self, timeout_seconds: float = 120.0):
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
        return {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

    async def chat_completions_message(
        self,
        *,
        auth: OpenAICompatibleAuth,
        model: str,
        messages: list[dict[str, Any]],
        temperature: float = 0.7,
        max_tokens: int | None = None,
        response_format: Literal["json_object", "text"] = "text",
    ) -> dict[str, Any]:
        """Call POST /chat/completions and return the first assistant message dict.

        This supports multimodal responses where `message.content` may be null and
        image data may be returned in `message.images` (vendor-specific but common).
        """
        
        # Validate API key
        if not auth.api_key or not auth.api_key.strip():
            raise ValueError("api_key must be a non-empty string")

        url = auth.base_url.rstrip("/") + "/chat/completions"
        payload: dict[str, Any] = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "stream": False,
        }
        if max_tokens is not None:
            payload["max_tokens"] = max_tokens
        if response_format == "json_object":
            # Many OpenAI-compatible providers support this.
            payload["response_format"] = {"type": "json_object"}

        session = await self._get_session()

        try:
            async with session.post(url, headers=self._headers(auth.api_key), json=payload) as resp:
                text = await resp.text()
                if resp.status >= 400:
                    raise RuntimeError(f"OpenAI-compatible chat error {resp.status}: {text[:500]}")

                data = json.loads(text)
                choices = data.get("choices") or []
                if not choices:
                    raise RuntimeError("OpenAI-compatible response missing choices")
                message = choices[0].get("message") or {}
                return message
        except asyncio.TimeoutError as e:
            raise RuntimeError("OpenAI-compatible chat request timed out") from e
        except aiohttp.ClientError as e:
            raise RuntimeError(f"OpenAI-compatible chat network error: {e}") from e

    async def chat_completions(
        self,
        *,
        auth: OpenAICompatibleAuth,
        model: str,
        messages: list[dict[str, Any]],
        temperature: float = 0.7,
        max_tokens: int | None = None,
        response_format: Literal["json_object", "text"] = "text",
    ) -> str:
        """Call POST /chat/completions and return assistant text content."""

        message = await self.chat_completions_message(
            auth=auth,
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            response_format=response_format,
        )
        content = message.get("content")
        if content is None or (isinstance(content, str) and not content.strip()):
            raise RuntimeError(
                "OpenAI-compatible response missing or empty message.content. "
                f"Full message: {message}"
            )
        return content

    async def images_generations(
        self,
        *,
        auth: OpenAICompatibleAuth,
        model: str,
        prompt: str,
        size: str = "1024x1024",
        response_format: Literal["b64_json", "url"] = "b64_json",
        aspect_ratio: str | None = None,
    ) -> dict[str, Any]:
        """Call POST /images/generations and return parsed JSON."""
        
        # Validate API key
        if not auth.api_key or not auth.api_key.strip():
            raise ValueError("api_key must be a non-empty string")

        url = auth.base_url.rstrip("/") + "/images/generations"
        payload: dict[str, Any] = {
            "model": model,
            "prompt": prompt,
            "size": size,
            "response_format": response_format,
        }
        if aspect_ratio:
            # Not part of the official OpenAI Images API, but some OpenAI-compatible vendors support it.
            payload["aspect_ratio"] = aspect_ratio

        session = await self._get_session()

        try:
            async with session.post(url, headers=self._headers(auth.api_key), json=payload) as resp:
                text = await resp.text()
                if resp.status >= 400:
                    raise RuntimeError(f"OpenAI-compatible images error {resp.status}: {text[:500]}")
                return json.loads(text)
        except asyncio.TimeoutError as e:
            raise RuntimeError("OpenAI-compatible images request timed out") from e
        except aiohttp.ClientError as e:
            raise RuntimeError(f"OpenAI-compatible images network error: {e}") from e


openai_compatible_client = OpenAICompatibleClient()
