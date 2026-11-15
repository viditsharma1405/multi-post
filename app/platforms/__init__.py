"""Platform adapter module for automated multi-platform posting."""

from app.platforms.base import BasePlatformAdapter
from app.platforms.bluesky import BlueskyAdapter
from app.platforms.mastodon import MastodonAdapter
from app.platforms.devto import DevtoAdapter
from app.platforms.telegram import TelegramAdapter
from app.platforms.discord import DiscordAdapter

__all__ = [
    "BasePlatformAdapter",
    "BlueskyAdapter",
    "MastodonAdapter",
    "DevtoAdapter",
    "TelegramAdapter",
    "DiscordAdapter",
]
