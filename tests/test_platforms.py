"""Unit tests for platform adapters, public URL resolution, and credential sanitization."""

import httpx
import pytest
import respx

from app.config import Settings
from app.platforms.bluesky import BlueskyAdapter
from app.platforms.devto import DevtoAdapter
from app.platforms.discord import DiscordAdapter
from app.platforms.mastodon import MastodonAdapter
from app.platforms.telegram import TelegramAdapter


@pytest.fixture
def mock_settings() -> Settings:
    """Fixture providing populated configuration for all platforms."""
    return Settings(
        bluesky_handle="alice.bsky.social",
        bluesky_app_password="secret-bsky-password",
        mastodon_instance_url="https://mastodon.social",
        mastodon_access_token="secret-mastodon-token",
        devto_api_key="secret-devto-key",
        devto_article_title="Custom Launch Title",
        telegram_bot_token="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11",
        telegram_chat_id="-1001234567890",
        telegram_channel_username="tech_announcements",
        discord_webhook_url="https://discord.com/api/webhooks/11223344/abcdef_secret_token",
        discord_guild_id="9988776655",
        request_timeout_seconds=5.0,
        verification_timeout_seconds=2.0,
    )


class TestBlueskyAdapter:
    """Tests for Bluesky AT Protocol adapter."""

    def test_unconfigured(self):
        adapter = BlueskyAdapter(Settings())
        assert not adapter.is_configured()
        assert "BLUESKY_HANDLE or BLUESKY_APP_PASSWORD is missing" in adapter.get_configuration_error()

    @pytest.mark.asyncio
    @respx.mock
    async def test_successful_publish(self, mock_settings):
        # Mock session creation
        respx.post("https://bsky.social/xrpc/com.atproto.server.createSession").mock(
            return_value=httpx.Response(
                200,
                json={
                    "accessJwt": "jwt.access.token",
                    "did": "did:plc:abcdef123456",
                    "handle": "alice.bsky.social",
                },
            )
        )
        # Mock record creation
        respx.post("https://bsky.social/xrpc/com.atproto.repo.createRecord").mock(
            return_value=httpx.Response(
                200,
                json={
                    "uri": "at://did:plc:abcdef123456/app.bsky.feed.post/3kxyz789",
                    "cid": "bafyreih3kxyz",
                },
            )
        )
        # Mock verification
        expected_url = "https://bsky.app/profile/alice.bsky.social/post/3kxyz789"
        respx.get(expected_url).mock(return_value=httpx.Response(200, text="Post content"))

        adapter = BlueskyAdapter(mock_settings)
        result = await adapter.publish("Check out our site https://example.com")

        assert result.platform == "bluesky"
        assert result.status == "success"
        assert result.posted_url == expected_url
        assert result.public_access is True
        assert result.date is not None
        assert result.time is not None
        assert result.error is None

    @pytest.mark.asyncio
    @respx.mock
    async def test_auth_failure(self, mock_settings):
        respx.post("https://bsky.social/xrpc/com.atproto.server.createSession").mock(
            return_value=httpx.Response(401, text="Invalid identifier or password")
        )

        adapter = BlueskyAdapter(mock_settings)
        result = await adapter.publish("Test message https://example.com")

        assert result.status == "failed"
        assert result.posted_url is None
        assert result.error is not None
        assert "HTTP 401" in result.error
        # Password must not be in error message
        assert mock_settings.bluesky_app_password not in result.error


class TestMastodonAdapter:
    """Tests for Mastodon REST API adapter."""

    def test_unconfigured(self):
        adapter = MastodonAdapter(Settings())
        assert not adapter.is_configured()
        assert "MASTODON_INSTANCE_URL or MASTODON_ACCESS_TOKEN is missing" in adapter.get_configuration_error()

    @pytest.mark.asyncio
    @respx.mock
    async def test_successful_publish(self, mock_settings):
        respx.post("https://mastodon.social/api/v1/statuses").mock(
            return_value=httpx.Response(
                200,
                json={
                    "id": "1122334455",
                    "url": "https://mastodon.social/@alice/1122334455",
                    "created_at": "2026-11-15T08:15:30.000Z",
                },
            )
        )
        respx.get("https://mastodon.social/@alice/1122334455").mock(
            return_value=httpx.Response(200, text="Toot content")
        )

        adapter = MastodonAdapter(mock_settings)
        result = await adapter.publish("Hello Mastodon https://example.com")

        assert result.platform == "mastodon"
        assert result.status == "success"
        assert result.posted_url == "https://mastodon.social/@alice/1122334455"
        assert result.public_access is True
        assert result.date == "2026-11-15"
        assert result.time == "08:15:30"
        assert result.error is None

    @pytest.mark.asyncio
    @respx.mock
    async def test_server_error(self, mock_settings):
        respx.post("https://mastodon.social/api/v1/statuses").mock(
            return_value=httpx.Response(500, text="Internal server crash")
        )

        adapter = MastodonAdapter(mock_settings)
        result = await adapter.publish("Test message https://example.com")

        assert result.status == "failed"
        assert "HTTP 500" in result.error
        assert mock_settings.mastodon_access_token not in result.error


class TestDevtoAdapter:
    """Tests for Dev.to Forem API adapter."""

    def test_unconfigured(self):
        adapter = DevtoAdapter(Settings())
        assert not adapter.is_configured()
        assert "DEVTO_API_KEY is missing" in adapter.get_configuration_error()

    @pytest.mark.asyncio
    @respx.mock
    async def test_successful_article_creation(self, mock_settings):
        respx.post("https://dev.to/api/articles").mock(
            return_value=httpx.Response(
                201,
                json={
                    "id": 987654,
                    "url": "https://dev.to/alice/custom-launch-title-xyz",
                    "published_at": "2026-11-15T09:30:00Z",
                },
            )
        )
        respx.get("https://dev.to/alice/custom-launch-title-xyz").mock(
            return_value=httpx.Response(200, text="Article markdown body")
        )

        adapter = DevtoAdapter(mock_settings)
        result = await adapter.publish("Tech article update https://example.com")

        assert result.platform == "devto"
        assert result.status == "success"
        assert result.posted_url == "https://dev.to/alice/custom-launch-title-xyz"
        assert result.public_access is True
        assert result.date == "2026-11-15"
        assert result.time == "09:30:00"

    @pytest.mark.asyncio
    @respx.mock
    async def test_unauthorized_key(self, mock_settings):
        respx.post("https://dev.to/api/articles").mock(
            return_value=httpx.Response(401, text="Unauthorized: invalid api-key")
        )

        adapter = DevtoAdapter(mock_settings)
        result = await adapter.publish("Article https://example.com")

        assert result.status == "failed"
        assert "HTTP 401" in result.error


class TestTelegramAdapter:
    """Tests for Telegram Bot API adapter."""

    def test_unconfigured(self):
        adapter = TelegramAdapter(Settings())
        assert not adapter.is_configured()
        assert "TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is missing" in adapter.get_configuration_error()

    @pytest.mark.asyncio
    @respx.mock
    async def test_successful_public_channel_post(self, mock_settings):
        respx.post(f"https://api.telegram.org/bot{mock_settings.telegram_bot_token}/sendMessage").mock(
            return_value=httpx.Response(
                200,
                json={
                    "ok": True,
                    "result": {
                        "message_id": 4455,
                        "date": 1763200000,
                        "chat": {
                            "id": -1001234567890,
                            "type": "channel",
                            "username": "tech_announcements",
                        },
                    },
                },
            )
        )
        respx.get("https://t.me/tech_announcements/4455").mock(
            return_value=httpx.Response(200, text="Telegram message view")
        )

        adapter = TelegramAdapter(mock_settings)
        result = await adapter.publish("Telegram broadcast https://example.com")

        assert result.platform == "telegram"
        assert result.status == "success"
        assert result.posted_url == "https://t.me/tech_announcements/4455"
        assert result.public_access is True
        assert result.date is not None
        assert result.time is not None

    @pytest.mark.asyncio
    @respx.mock
    async def test_private_channel_yields_null_url(self, mock_settings):
        """Private chats/channels without a username must yield null posted_url."""
        # Unset channel username in settings for this test
        mock_settings.telegram_channel_username = None

        respx.post(f"https://api.telegram.org/bot{mock_settings.telegram_bot_token}/sendMessage").mock(
            return_value=httpx.Response(
                200,
                json={
                    "ok": True,
                    "result": {
                        "message_id": 9999,
                        "date": 1763200000,
                        "chat": {
                            "id": -100987654321,
                            "type": "group",
                            "title": "Private Team Group",
                            # No username field in private group
                        },
                    },
                },
            )
        )

        adapter = TelegramAdapter(mock_settings)
        result = await adapter.publish("Private message https://example.com")

        assert result.status == "success"
        assert result.posted_url is None
        assert result.public_access is None


class TestDiscordAdapter:
    """Tests for Discord Webhook adapter."""

    def test_unconfigured(self):
        adapter = DiscordAdapter(Settings())
        assert not adapter.is_configured()
        assert "DISCORD_WEBHOOK_URL is missing" in adapter.get_configuration_error()

    @pytest.mark.asyncio
    @respx.mock
    async def test_successful_webhook_execution_with_guild(self, mock_settings):
        # Mock Discord webhook execution with wait=true
        respx.post(
            "https://discord.com/api/webhooks/11223344/abcdef_secret_token?wait=true"
        ).mock(
            return_value=httpx.Response(
                200,
                json={
                    "id": "112233445566",
                    "channel_id": "7788990011",
                    "timestamp": "2026-11-15T10:00:00.000000+00:00",
                },
            )
        )
        # Mock verification check on Discord link (returns 401 because Discord is login-gated)
        discord_url = "https://discord.com/channels/9988776655/7788990011/112233445566"
        respx.get(discord_url).mock(return_value=httpx.Response(401, text="Unauthorized"))

        adapter = DiscordAdapter(mock_settings)
        result = await adapter.publish("Discord ping https://example.com")

        assert result.platform == "discord"
        assert result.status == "success"
        assert result.posted_url == discord_url
        # Correctly verified as False because Discord requires authentication
        assert result.public_access is False
        assert result.date == "2026-11-15"
        assert result.time == "10:00:00"

    @pytest.mark.asyncio
    @respx.mock
    async def test_webhook_without_guild_yields_null_url(self, mock_settings):
        mock_settings.discord_guild_id = None
        respx.post(
            "https://discord.com/api/webhooks/11223344/abcdef_secret_token?wait=true"
        ).mock(
            return_value=httpx.Response(
                200,
                json={
                    "id": "112233445566",
                    "channel_id": "7788990011",
                    "timestamp": "2026-11-15T10:00:00.000000+00:00",
                },
            )
        )

        adapter = DiscordAdapter(mock_settings)
        result = await adapter.publish("Discord ping https://example.com")

        assert result.status == "success"
        assert result.posted_url is None
        assert result.public_access is None


class TestVerificationAndSanitization:
    """Tests for public URL verification and credential error sanitization."""

    @pytest.mark.asyncio
    @respx.mock
    async def test_verification_failure_does_not_fail_publication(self, mock_settings):
        """A 404 or network error during public URL verification must not change status='success'."""
        respx.post("https://mastodon.social/api/v1/statuses").mock(
            return_value=httpx.Response(
                200,
                json={
                    "id": "111",
                    "url": "https://mastodon.social/@alice/111",
                    "created_at": "2026-11-15T11:00:00Z",
                },
            )
        )
        # Verification check returns 404 Not Found
        respx.get("https://mastodon.social/@alice/111").mock(
            return_value=httpx.Response(404, text="Not Found")
        )

        adapter = MastodonAdapter(mock_settings)
        result = await adapter.publish("Post https://example.com")

        assert result.status == "success"  # Publication succeeded!
        assert result.posted_url == "https://mastodon.social/@alice/111"
        assert result.public_access is False  # Verification reflected 404

    @pytest.mark.asyncio
    @respx.mock
    async def test_verification_timeout_sets_public_access_false(self, mock_settings):
        respx.post("https://mastodon.social/api/v1/statuses").mock(
            return_value=httpx.Response(
                200,
                json={
                    "id": "222",
                    "url": "https://mastodon.social/@alice/222",
                    "created_at": "2026-11-15T11:00:00Z",
                },
            )
        )
        # Verification times out
        respx.get("https://mastodon.social/@alice/222").mock(
            side_effect=httpx.TimeoutException("Verification timeout")
        )

        adapter = MastodonAdapter(mock_settings)
        result = await adapter.publish("Post https://example.com")

        assert result.status == "success"
        assert result.public_access is False

    def test_credential_sanitization(self, mock_settings):
        adapter = MastodonAdapter(mock_settings)

        leaked_msg = (
            f"Failed with token {mock_settings.mastodon_access_token} "
            f"and bot123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11 "
            f"and Bearer eyJhbGciOiJIUzI1NiJ9.test and {mock_settings.discord_webhook_url}"
        )
        sanitized = adapter.sanitize_error(leaked_msg)

        assert mock_settings.mastodon_access_token not in sanitized
        assert "ABC-DEF1234ghIkl-zyx57W2v1u123ew11" not in sanitized
        assert "eyJhbGciOiJIUzI1NiJ9.test" not in sanitized
        assert "abcdef_secret_token" not in sanitized
        assert "bot***:***" in sanitized
        assert "Bearer ***" in sanitized
