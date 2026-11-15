"""Mastodon platform adapter."""

from datetime import datetime, timezone
from typing import Optional
import httpx

from app.platforms.base import BasePlatformAdapter
from app.schemas import PlatformResult


class MastodonAdapter(BasePlatformAdapter):
    """Adapter for publishing status updates to a Mastodon instance via REST API v1."""

    @property
    def platform_name(self) -> str:
        return "mastodon"

    def is_configured(self) -> bool:
        return bool(self.settings.mastodon_instance_url and self.settings.mastodon_access_token)

    def get_configuration_error(self) -> str:
        return (
            "Mastodon is not configured: MASTODON_INSTANCE_URL or MASTODON_ACCESS_TOKEN is missing."
        )

    def _parse_created_at(self, raw_timestamp: Optional[str]) -> tuple[Optional[str], Optional[str]]:
        """Parse Mastodon's ISO 8601 created_at timestamp into UTC (date, time) strings."""
        if not raw_timestamp:
            now = datetime.now(timezone.utc)
            return now.strftime("%Y-%m-%d"), now.strftime("%H:%M:%S")

        try:
            # Handle ISO string with Z or timezone offset
            clean_ts = raw_timestamp.replace("Z", "+00:00")
            dt = datetime.fromisoformat(clean_ts).astimezone(timezone.utc)
            return dt.strftime("%Y-%m-%d"), dt.strftime("%H:%M:%S")
        except Exception:
            now = datetime.now(timezone.utc)
            return now.strftime("%Y-%m-%d"), now.strftime("%H:%M:%S")

    async def _publish_impl(self, message: str, client: httpx.AsyncClient) -> PlatformResult:
        """Post a status update to the configured Mastodon instance."""
        base_url = self.settings.mastodon_instance_url.rstrip("/")
        endpoint = f"{base_url}/api/v1/statuses"

        headers = {
            "Authorization": f"Bearer {self.settings.mastodon_access_token}",
            "Content-Type": "application/json",
        }
        payload = {"status": message}

        response = await client.post(endpoint, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()

        # Extract status URL and publication timestamp
        posted_url = data.get("url") or data.get("uri")
        date_str, time_str = self._parse_created_at(data.get("created_at"))

        return PlatformResult(
            platform=self.platform_name,
            status="success",
            posted_url=posted_url,
            public_access=None,  # Evaluated by BasePlatformAdapter.verify_public_url
            date=date_str,
            time=time_str,
            error=None,
        )
