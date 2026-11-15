"""Discord Webhook platform adapter."""

from datetime import datetime, timezone
from typing import Optional
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse
import httpx

from app.platforms.base import BasePlatformAdapter
from app.schemas import PlatformResult


class DiscordAdapter(BasePlatformAdapter):
    """Adapter for broadcasting messages via Discord Webhook.

    Architectural & Access Note:
    - Discord webhooks execute on a specific channel. Passing ?wait=true is required
      so the API returns the created message object with its snowflake ID and channel ID,
      instead of HTTP 204 No Content.
    - Discord message URLs follow the format:
      https://discord.com/channels/{guild_id}/{channel_id}/{message_id}
    - Webhook responses provide message_id and channel_id, but omit guild_id.
      A valid client navigation URL can only be formed if DISCORD_GUILD_ID is provided.
    - Discord is an authenticated, gated platform. Even when a message link exists,
      channels require Discord login and server membership. Unauthenticated public access
      is not permitted by Discord, and public_access will reflect this restriction.
    """

    @property
    def platform_name(self) -> str:
        return "discord"

    def is_configured(self) -> bool:
        return bool(self.settings.discord_webhook_url)

    def get_configuration_error(self) -> str:
        return "Discord is not configured: DISCORD_WEBHOOK_URL is missing."

    def _prepare_webhook_url(self) -> str:
        """Ensure the webhook URL includes wait=true to receive the message JSON body."""
        url = self.settings.discord_webhook_url.strip()
        parsed = urlparse(url)
        query_params = parse_qs(parsed.query)
        query_params["wait"] = ["true"]
        new_query = urlencode(query_params, doseq=True)
        return urlunparse(parsed._replace(query=new_query))

    def _parse_timestamp(self, raw_timestamp: Optional[str]) -> tuple[Optional[str], Optional[str]]:
        """Parse Discord's ISO 8601 timestamp into UTC (date, time)."""
        if not raw_timestamp:
            now = datetime.now(timezone.utc)
            return now.strftime("%Y-%m-%d"), now.strftime("%H:%M:%S")

        try:
            clean_ts = raw_timestamp.replace("Z", "+00:00")
            dt = datetime.fromisoformat(clean_ts).astimezone(timezone.utc)
            return dt.strftime("%Y-%m-%d"), dt.strftime("%H:%M:%S")
        except Exception:
            now = datetime.now(timezone.utc)
            return now.strftime("%Y-%m-%d"), now.strftime("%H:%M:%S")

    async def _publish_impl(self, message: str, client: httpx.AsyncClient) -> PlatformResult:
        """Execute the Discord webhook with wait=true to capture message ID and metadata."""
        webhook_url = self._prepare_webhook_url()
        payload = {"content": message}

        response = await client.post(webhook_url, json=payload)
        response.raise_for_status()
        data = response.json()

        message_id = data.get("id")
        channel_id = data.get("channel_id")
        timestamp_str = data.get("timestamp")

        date_str, time_str = self._parse_timestamp(timestamp_str)

        # Discord message URLs require guild_id + channel_id + message_id.
        # If guild context is configured, construct the URL. Otherwise return null.
        posted_url: Optional[str] = None
        if self.settings.discord_guild_id and channel_id and message_id:
            guild_id = self.settings.discord_guild_id
            posted_url = f"https://discord.com/channels/{guild_id}/{channel_id}/{message_id}"

        return PlatformResult(
            platform=self.platform_name,
            status="success",
            posted_url=posted_url,
            # Public access will be evaluated via verify_public_url if posted_url is present,
            # which will correctly yield False because Discord channels require authentication.
            public_access=None,
            date=date_str,
            time=time_str,
            error=None,
        )
