"""Minimal REST client for the Gemini API.

We use this for image generation because some image-capable models are exposed via
`models/{model}:generateContent` with `generationConfig.imageConfig` (per docs), and
SDK surface area may vary.
"""

from __future__ import annotations

import asyncio
import base64
from dataclasses import dataclass
from typing import Any

import aiohttp


@dataclass(frozen=True)
class GeminiRestAuth:
    api_key: str


class GeminiRestClient:
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

    async def generate_content_raw(
        self,
        *,
        auth: GeminiRestAuth,
        model: str,
        contents: list[dict[str, Any]],
        generation_config: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        # Validate API key
        if not auth.api_key or not auth.api_key.strip():
            raise ValueError("api_key must be a non-empty string")
        
        session = await self._get_session()
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

        payload: dict[str, Any] = {"contents": contents}
        if generation_config:
            payload["generationConfig"] = generation_config

        try:
            async with session.post(
                url,
                headers={"Content-Type": "application/json"},
                params={"key": auth.api_key},
                json=payload,
            ) as resp:
                text = await resp.text()
                if resp.status >= 400:
                    raise RuntimeError(f"Gemini REST error {resp.status}: {text[:800]}")
                return await resp.json()
        except asyncio.TimeoutError as e:
            raise RuntimeError("Gemini REST request timed out") from e
        except aiohttp.ClientError as e:
            raise RuntimeError(f"Gemini REST network error: {e}") from e

    async def generate_image_bytes(
        self,
        *,
        auth: GeminiRestAuth,
        model: str,
        prompt: str,
        image_config: dict[str, Any] | None = None,
    ) -> bytes:
        data = await self.generate_content_raw(
            auth=auth,
            model=model,
            contents=[{"parts": [{"text": prompt}]}],
            generation_config=(
                {"imageConfig": image_config} if image_config else None
            ),
        )

        candidates = data.get("candidates") or []
        for cand in candidates:
            content = cand.get("content") or {}
            parts = content.get("parts") or []
            for part in parts:
                inline = part.get("inlineData") or part.get("inline_data")
                if inline and inline.get("data"):
                    return base64.b64decode(inline["data"])

        raise RuntimeError("Gemini REST response contained no inline image data")


gemini_rest_client = GeminiRestClient()
