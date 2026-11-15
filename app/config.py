"""Application configuration and environment variable management using Pydantic Settings."""

from functools import lru_cache
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuration settings loaded from environment variables and .env file."""

    # Bluesky / AT Protocol credentials
    bluesky_handle: Optional[str] = None
    bluesky_app_password: Optional[str] = None

    # Mastodon credentials
    mastodon_instance_url: Optional[str] = None
    mastodon_access_token: Optional[str] = None

    # Dev.to credentials
    devto_api_key: Optional[str] = None
    devto_article_title: str = "Automated Platform Update"

    # Telegram Bot API credentials
    telegram_bot_token: Optional[str] = None
    telegram_chat_id: Optional[str] = None
    telegram_channel_username: Optional[str] = None

    # Discord Webhook credentials
    discord_webhook_url: Optional[str] = None
    discord_guild_id: Optional[str] = None

    # HTTP Client timeouts (seconds)
    request_timeout_seconds: float = 10.0
    verification_timeout_seconds: float = 5.0

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
        str_strip_whitespace=True,
    )

    @staticmethod
    def _is_valid_credential(val: Optional[str]) -> bool:
        """Check if a credential value is populated and not an unedited template placeholder."""
        if not val or not isinstance(val, str):
            return False
        clean = val.strip()
        return bool(clean and not clean.startswith("YOUR_"))

    @property
    def is_bluesky_configured(self) -> bool:
        """Check if Bluesky has the required configuration parameters."""
        return bool(
            self._is_valid_credential(self.bluesky_handle)
            and self._is_valid_credential(self.bluesky_app_password)
        )

    @property
    def is_mastodon_configured(self) -> bool:
        """Check if Mastodon has the required configuration parameters."""
        return bool(
            self._is_valid_credential(self.mastodon_instance_url)
            and self._is_valid_credential(self.mastodon_access_token)
        )

    @property
    def is_devto_configured(self) -> bool:
        """Check if Dev.to has the required configuration parameters."""
        return bool(self._is_valid_credential(self.devto_api_key))

    @property
    def is_telegram_configured(self) -> bool:
        """Check if Telegram has the required configuration parameters."""
        return bool(
            self._is_valid_credential(self.telegram_bot_token)
            and self._is_valid_credential(self.telegram_chat_id)
        )

    @property
    def is_discord_configured(self) -> bool:
        """Check if Discord has the required configuration parameters."""
        url = self.discord_webhook_url or ""
        return bool(
            self._is_valid_credential(self.discord_webhook_url)
            and (url.startswith("http://") or url.startswith("https://"))
        )


@lru_cache()
def get_settings() -> Settings:
    """Return a cached instance of application settings."""
    return Settings()
