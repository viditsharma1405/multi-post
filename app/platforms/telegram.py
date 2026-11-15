"""Telegram Bot API platform adapter."""

from datetime import datetime, timezone
from typing import Optional
import httpx

from app.platforms.base import BasePlatformAdapter
from app.schemas import PlatformResult


class TelegramAdapter(BasePlatformAdapter):
    """Adapter for broadcasting messages to Telegram channels and chats via Bot API."""

    TELEGRAM_API_BASE = "https://api.telegram.org"

    @property
    def platform_name(self) -> str:
        return "telegram"

    def is_configured(self) -> bool:
        return bool(self.settings.telegram_bot_token and self.settings.telegram_chat_id)

    def get_configuration_error(self) -> str:
        return (
            "Telegram is not configured: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is missing."
        )

    async def _publish_impl(self, message: str, client: httpx.AsyncClient) -> PlatformResult:
        """Send message via Telegram Bot API sendMessage endpoint."""
        token = self.settings.telegram_bot_token
        endpoint = f"{self.TELEGRAM_API_BASE}/bot{token}/sendMessage"

        payload = {
            "chat_id": self.settings.telegram_chat_id,
            "text": message,
        }

        response = await client.post(endpoint, json=payload)
        response.raise_for_status()
        data = response.json()

        if not data.get("ok"):
            error_description = data.get("description", "Unknown Telegram API error")
            return PlatformResult(
                platform=self.platform_name,
                status="failed",
                error=self.sanitize_error(f"Telegram error: {error_description}"),
            )

        result_data = data.get("result", {})
        message_id = result_data.get("message_id")
        chat_info = result_data.get("chat", {})

        # Telegram public URLs can only be constructed when a public channel username is present.
        # Private channels (numeric ID), direct messages, or private groups do not possess public web URLs.
        channel_username = (
            chat_info.get("username")
            or self.settings.telegram_channel_username
        )

        posted_url: Optional[str] = None
        if channel_username and message_id:
            clean_username = channel_username.lstrip("@")
            posted_url = f"https://t.me/{clean_username}/{message_id}"

        # Parse publication timestamp from Telegram's Unix timestamp
        unix_date = result_data.get("date")
        if unix_date:
            dt = datetime.fromtimestamp(unix_date, tz=timezone.utc)
            date_str = dt.strftime("%Y-%m-%d")
            time_str = dt.strftime("%H:%M:%S")
        else:
            now = datetime.now(timezone.utc)
            date_str = now.strftime("%Y-%m-%d")
            time_str = now.strftime("%H:%M:%S")

        return PlatformResult(
            platform=self.platform_name,
            status="success",
            posted_url=posted_url,
            # If no public URL could be determined (private chat), public_access remains None.
            # If public URL was constructed, BasePlatformAdapter.publish will verify via HTTP GET.
            public_access=None,
            date=date_str,
            time=time_str,
            error=None,
        )
