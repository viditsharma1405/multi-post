"""Dev.to (Forem API) platform adapter."""

from datetime import datetime, timezone
from typing import Optional
import httpx

from app.platforms.base import BasePlatformAdapter
from app.schemas import PlatformResult


class DevtoAdapter(BasePlatformAdapter):
    """Adapter for publishing articles to Dev.to using the Forem Articles API.

    Architectural Note:
    Unlike micro-blogging platforms (Bluesky, Mastodon), Dev.to is designed for
    technical articles and long-form publications. It does not possess a micro-status
    endpoint. Therefore, this adapter creates a published article with the submitted
    message formatted as the article markdown body, under a configured or default title.
    """

    DEVTO_ENDPOINT = "https://dev.to/api/articles"

    @property
    def platform_name(self) -> str:
        return "devto"

    def is_configured(self) -> bool:
        return bool(self.settings.devto_api_key)

    def get_configuration_error(self) -> str:
        return "Dev.to is not configured: DEVTO_API_KEY is missing."

    def _parse_published_at(self, raw_timestamp: Optional[str]) -> tuple[Optional[str], Optional[str]]:
        """Parse Dev.to's published_at or created_at timestamp into UTC (date, time).

        Returns (None, None) if the platform response does not confirm a timestamp.
        """
        if not raw_timestamp:
            return None, None

        try:
            clean_ts = raw_timestamp.replace("Z", "+00:00")
            dt = datetime.fromisoformat(clean_ts).astimezone(timezone.utc)
            return dt.strftime("%Y-%m-%d"), dt.strftime("%H:%M:%S")
        except Exception:
            return None, None

    async def _publish_impl(self, message: str, client: httpx.AsyncClient) -> PlatformResult:
        """Create and publish an article on Dev.to."""
        headers = {
            "api-key": self.settings.devto_api_key,
            "Content-Type": "application/json",
        }

        title = self.settings.devto_article_title or "Automated Platform Update"
        payload = {
            "article": {
                "title": title,
                "body_markdown": message,
                "published": True,
            }
        }

        response = await client.post(self.DEVTO_ENDPOINT, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()

        # Extract published article URL and publication timestamp
        posted_url = data.get("url")
        timestamp_field = data.get("published_at") or data.get("created_at")
        date_str, time_str = self._parse_published_at(timestamp_field)

        return PlatformResult(
            platform=self.platform_name,
            status="success",
            posted_url=posted_url,
            public_access=None,  # Evaluated by BasePlatformAdapter.verify_public_url
            date=date_str,
            time=time_str,
            error=None,
        )
