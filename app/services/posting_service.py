"""Posting service coordinating concurrent, isolated publication across all platforms."""

import asyncio
import logging
from typing import Optional, Sequence

import httpx

from app.config import Settings, get_settings
from app.platforms.base import BasePlatformAdapter
from app.platforms.bluesky import BlueskyAdapter
from app.platforms.devto import DevtoAdapter
from app.platforms.discord import DiscordAdapter
from app.platforms.mastodon import MastodonAdapter
from app.platforms.telegram import TelegramAdapter
from app.schemas import PlatformResult, PostingResponse, PostingSummary

logger = logging.getLogger("app.services.posting")


class PostingService:
    """Coordinates concurrent publication to all configured platform adapters."""

    def __init__(
        self,
        settings: Optional[Settings] = None,
        adapters: Optional[Sequence[BasePlatformAdapter]] = None,
    ) -> None:
        self.settings = settings or get_settings()

        if adapters is not None:
            self.adapters = list(adapters)
        else:
            # Default registry of all five required platform adapters
            self.adapters = [
                BlueskyAdapter(self.settings),
                MastodonAdapter(self.settings),
                DevtoAdapter(self.settings),
                TelegramAdapter(self.settings),
                DiscordAdapter(self.settings),
            ]

    async def publish_all(self, message: str) -> PostingResponse:
        """Publish the validated message across all five platforms in parallel using asyncio.gather.

        Guarantees:
        - All platform adapters are triggered concurrently.
        - Failure in any one platform (network, auth, rate limit, timeout, or config)
          is isolated and never cancels or prevents execution of the remaining adapters.
        - Every platform produces exactly one normalized PlatformResult entry.
        - Overall success is True if at least one platform succeeds, False if all fail.
        """
        logger.info(
            "Initiating multi-platform publication across %d platforms.", len(self.adapters)
        )

        # Use a shared AsyncClient with configured connection pooling and timeouts
        async with httpx.AsyncClient(timeout=self.settings.request_timeout_seconds) as client:
            tasks = [
                self._safe_execute_adapter(adapter, message, client)
                for adapter in self.adapters
            ]

            # Execute all platforms concurrently with asyncio.gather
            raw_results = await asyncio.gather(*tasks, return_exceptions=True)

        normalized_results: list[PlatformResult] = []
        for i, item in enumerate(raw_results):
            adapter = self.adapters[i]
            if isinstance(item, PlatformResult):
                normalized_results.append(item)
            elif isinstance(item, Exception):
                # Catches any unexpected base exception that somehow bypassed the adapter wrapper
                error_msg = adapter.sanitize_error(
                    f"Unhandled error in {adapter.platform_name}: {str(item)}"
                )
                logger.error("%s: %s", adapter.platform_name, error_msg)
                normalized_results.append(
                    PlatformResult(
                        platform=adapter.platform_name,
                        status="failed",
                        error=error_msg,
                    )
                )
            else:
                normalized_results.append(
                    PlatformResult(
                        platform=adapter.platform_name,
                        status="failed",
                        error="Unknown error during platform publication.",
                    )
                )

        successful_count = sum(1 for r in normalized_results if r.status == "success")
        failed_count = sum(1 for r in normalized_results if r.status == "failed")
        overall_success = successful_count > 0

        summary = PostingSummary(
            total=len(normalized_results),
            successful=successful_count,
            failed=failed_count,
        )

        logger.info(
            "Publication completed: %d succeeded, %d failed out of %d.",
            successful_count,
            failed_count,
            len(normalized_results),
        )

        return PostingResponse(
            success=overall_success,
            summary=summary,
            results=normalized_results,
        )

    async def _safe_execute_adapter(
        self,
        adapter: BasePlatformAdapter,
        message: str,
        client: httpx.AsyncClient,
    ) -> PlatformResult:
        """Execute an individual adapter with safety guarantees."""
        try:
            return await adapter.publish(message, client=client)
        except Exception as exc:
            logger.exception("Unexpected exception inside adapter %s", adapter.platform_name)
            return PlatformResult(
                platform=adapter.platform_name,
                status="failed",
                error=adapter.sanitize_error(
                    f"Unexpected adapter failure: {type(exc).__name__}: {str(exc)}"
                ),
            )
