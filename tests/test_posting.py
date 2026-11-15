"""Integration tests for POST /posting and GET /health endpoints using mocked external APIs."""

import httpx
import pytest
import respx
from httpx import ASGITransport, AsyncClient

from app.config import Settings, get_settings
from app.main import app
from app.schemas import PostingResponse


@pytest.fixture
def mock_all_settings() -> Settings:
    """Fixture providing populated configuration settings for all 5 platforms."""
    return Settings(
        bluesky_handle="alice.bsky.social",
        bluesky_app_password="secret-bsky-password",
        mastodon_instance_url="https://mastodon.social",
        mastodon_access_token="secret-mastodon-token",
        devto_api_key="secret-devto-key",
        devto_article_title="Automated Launch Article",
        telegram_bot_token="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11",
        telegram_chat_id="-1001234567890",
        telegram_channel_username="tech_news",
        discord_webhook_url="https://discord.com/api/webhooks/11223344/abcdef_secret_token",
        discord_guild_id="9988776655",
        request_timeout_seconds=5.0,
        verification_timeout_seconds=2.0,
    )


def mock_successful_external_apis():
    """Helper to mock successful external HTTP responses for all five platform APIs."""
    # 1. Bluesky
    respx.post("https://bsky.social/xrpc/com.atproto.server.createSession").mock(
        return_value=httpx.Response(
            200,
            json={
                "accessJwt": "jwt.mock.token",
                "did": "did:plc:abcdef123456",
                "handle": "alice.bsky.social",
            },
        )
    )
    respx.post("https://bsky.social/xrpc/com.atproto.repo.createRecord").mock(
        return_value=httpx.Response(
            200,
            json={
                "uri": "at://did:plc:abcdef123456/app.bsky.feed.post/3kxyz123",
                "cid": "bafyreih3kxyz",
            },
        )
    )
    respx.get("https://bsky.app/profile/alice.bsky.social/post/3kxyz123").mock(
        return_value=httpx.Response(200, text="Bluesky post page")
    )

    # 2. Mastodon
    respx.post("https://mastodon.social/api/v1/statuses").mock(
        return_value=httpx.Response(
            200,
            json={
                "id": "112233",
                "url": "https://mastodon.social/@alice/112233",
                "created_at": "2026-11-15T12:00:00.000Z",
            },
        )
    )
    respx.get("https://mastodon.social/@alice/112233").mock(
        return_value=httpx.Response(200, text="Mastodon status page")
    )

    # 3. Dev.to
    respx.post("https://dev.to/api/articles").mock(
        return_value=httpx.Response(
            201,
            json={
                "id": 887766,
                "url": "https://dev.to/alice/automated-launch-article-xyz",
                "published_at": "2026-11-15T12:00:00Z",
            },
        )
    )
    respx.get("https://dev.to/alice/automated-launch-article-xyz").mock(
        return_value=httpx.Response(200, text="Dev.to article page")
    )

    # 4. Telegram
    respx.post(
        "https://api.telegram.org/bot123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11/sendMessage"
    ).mock(
        return_value=httpx.Response(
            200,
            json={
                "ok": True,
                "result": {
                    "message_id": 5050,
                    "date": 1763200000,
                    "chat": {
                        "id": -1001234567890,
                        "type": "channel",
                        "username": "tech_news",
                    },
                },
            },
        )
    )
    respx.get("https://t.me/tech_news/5050").mock(
        return_value=httpx.Response(200, text="Telegram message page")
    )

    # 5. Discord
    respx.post(
        "https://discord.com/api/webhooks/11223344/abcdef_secret_token?wait=true"
    ).mock(
        return_value=httpx.Response(
            200,
            json={
                "id": "998877112233",
                "channel_id": "5566778899",
                "timestamp": "2026-11-15T12:00:00.000000+00:00",
            },
        )
    )
    respx.get("https://discord.com/channels/9988776655/5566778899/998877112233").mock(
        return_value=httpx.Response(401, text="Discord requires login")
    )


class TestPostingApi:
    """End-to-end integration tests for multi-platform posting API."""

    @pytest.mark.asyncio
    async def test_health_check_endpoint(self, mock_all_settings):
        app.dependency_overrides[get_settings] = lambda: mock_all_settings
        try:
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                resp = await client.get("/health")
                assert resp.status_code == 200
                data = resp.json()
                assert data["status"] == "ok"
                assert data["platforms_configured"]["bluesky"] is True
                assert data["platforms_configured"]["discord"] is True
        finally:
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    @respx.mock
    async def test_all_platforms_succeeding(self, mock_all_settings):
        """Test POST /posting when all 5 platforms successfully publish."""
        app.dependency_overrides[get_settings] = lambda: mock_all_settings
        mock_successful_external_apis()

        try:
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                req_body = {
                    "message": "Launch day announcement! Check our platform: https://example.com/launch"
                }
                resp = await client.post("/posting", json=req_body)

                assert resp.status_code == 200
                data = resp.json()

                # Validate against normalized response schema
                parsed_response = PostingResponse.model_validate(data)
                assert parsed_response.success is True
                assert parsed_response.summary.total == 5
                assert parsed_response.summary.successful == 5
                assert parsed_response.summary.failed == 0

                # Validate that all 5 platforms have results
                platform_names = [r.platform for r in parsed_response.results]
                assert set(platform_names) == {
                    "bluesky",
                    "mastodon",
                    "devto",
                    "telegram",
                    "discord",
                }

                for res in parsed_response.results:
                    assert res.status == "success"
                    assert res.date is not None
                    assert res.time is not None
                    assert res.error is None
        finally:
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    @respx.mock
    async def test_one_platform_fails_while_four_succeed(self, mock_all_settings):
        """Test that failure in one platform (Mastodon 500) does not block others.

        Proves that all five integrations are attempted even when one fails.
        """
        app.dependency_overrides[get_settings] = lambda: mock_all_settings
        mock_successful_external_apis()

        # Override Mastodon to return 500 Internal Server Error
        respx.post("https://mastodon.social/api/v1/statuses").mock(
            return_value=httpx.Response(500, text="Mastodon server crashed")
        )

        try:
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                resp = await client.post(
                    "/posting",
                    json={
                        "message": "Update with one platform down: https://example.com"
                    },
                )
                assert resp.status_code == 200
                data = resp.json()

                assert data["success"] is True  # Overall success because 4 succeeded
                assert data["summary"]["total"] == 5
                assert data["summary"]["successful"] == 4
                assert data["summary"]["failed"] == 1

                # Exactly one result per platform
                results_map = {r["platform"]: r for r in data["results"]}
                assert len(results_map) == 5

                # Mastodon failed
                assert results_map["mastodon"]["status"] == "failed"
                assert "HTTP 500" in results_map["mastodon"]["error"]
                assert results_map["mastodon"]["posted_url"] is None

                # The other four succeeded
                assert results_map["bluesky"]["status"] == "success"
                assert results_map["devto"]["status"] == "success"
                assert results_map["telegram"]["status"] == "success"
                assert results_map["discord"]["status"] == "success"
        finally:
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    @respx.mock
    async def test_all_platforms_failing(self, mock_all_settings):
        """Test POST /posting when all five platforms fail.

        Overall success must be False.
        """
        app.dependency_overrides[get_settings] = lambda: mock_all_settings

        # Mock failures across all 5 platforms
        respx.post("https://bsky.social/xrpc/com.atproto.server.createSession").mock(
            return_value=httpx.Response(401, text="Unauthorized")
        )
        respx.post("https://mastodon.social/api/v1/statuses").mock(
            return_value=httpx.Response(500, text="Server Error")
        )
        respx.post("https://dev.to/api/articles").mock(
            return_value=httpx.Response(403, text="Forbidden")
        )
        respx.post(
            "https://api.telegram.org/bot123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11/sendMessage"
        ).mock(return_value=httpx.Response(400, text="Bad Request"))
        respx.post(
            "https://discord.com/api/webhooks/11223344/abcdef_secret_token?wait=true"
        ).mock(return_value=httpx.Response(404, text="Not Found"))

        try:
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                resp = await client.post(
                    "/posting",
                    json={"message": "All platforms will fail https://example.com"},
                )
                assert resp.status_code == 200
                data = resp.json()

                assert data["success"] is False
                assert data["summary"]["total"] == 5
                assert data["summary"]["successful"] == 0
                assert data["summary"]["failed"] == 5

                for result in data["results"]:
                    assert result["status"] == "failed"
                    assert result["error"] is not None
        finally:
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    @respx.mock
    async def test_missing_credentials_for_one_platform(self, mock_all_settings):
        """Test missing credentials for Bluesky does not prevent the other 4 from running."""
        # Unset Bluesky credentials
        mock_all_settings.bluesky_handle = None
        mock_all_settings.bluesky_app_password = None

        app.dependency_overrides[get_settings] = lambda: mock_all_settings
        mock_successful_external_apis()

        try:
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                resp = await client.post(
                    "/posting",
                    json={"message": "Notice with Bluesky unconfigured https://example.com"},
                )
                assert resp.status_code == 200
                data = resp.json()

                assert data["success"] is True
                assert data["summary"]["successful"] == 4
                assert data["summary"]["failed"] == 1

                results_map = {r["platform"]: r for r in data["results"]}
                assert results_map["bluesky"]["status"] == "failed"
                assert "BLUESKY_HANDLE or BLUESKY_APP_PASSWORD is missing" in results_map["bluesky"]["error"]

                # Other platforms succeeded
                assert results_map["mastodon"]["status"] == "success"
                assert results_map["devto"]["status"] == "success"
                assert results_map["telegram"]["status"] == "success"
                assert results_map["discord"]["status"] == "success"
        finally:
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    @respx.mock
    async def test_api_timeout_isolation(self, mock_all_settings):
        """Test that an external API timeout on Dev.to is isolated and handled gracefully."""
        app.dependency_overrides[get_settings] = lambda: mock_all_settings
        mock_successful_external_apis()

        # Simulate timeout on Dev.to API
        respx.post("https://dev.to/api/articles").mock(
            side_effect=httpx.TimeoutException("Connection timed out after 5.0 seconds")
        )

        try:
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                resp = await client.post(
                    "/posting",
                    json={"message": "Timeout test announcement https://example.com"},
                )
                assert resp.status_code == 200
                data = resp.json()

                assert data["success"] is True
                assert data["summary"]["successful"] == 4
                assert data["summary"]["failed"] == 1

                results_map = {r["platform"]: r for r in data["results"]}
                assert results_map["devto"]["status"] == "failed"
                assert "timed out" in results_map["devto"]["error"]
        finally:
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    @respx.mock
    async def test_verification_failure_does_not_change_publication_success(
        self, mock_all_settings
    ):
        """Test that if Mastodon post succeeds, but its public URL returns 404, status remains 'success'."""
        app.dependency_overrides[get_settings] = lambda: mock_all_settings
        mock_successful_external_apis()

        # Mastodon post succeeds, but verification returns 404
        respx.get("https://mastodon.social/@alice/112233").mock(
            return_value=httpx.Response(404, text="Not Found")
        )

        try:
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                resp = await client.post(
                    "/posting",
                    json={"message": "Verification test message https://example.com"},
                )
                assert resp.status_code == 200
                data = resp.json()

                results_map = {r["platform"]: r for r in data["results"]}
                mastodon_result = results_map["mastodon"]

                # Publication MUST remain successful
                assert mastodon_result["status"] == "success"
                assert mastodon_result["posted_url"] == "https://mastodon.social/@alice/112233"
                # Public access reflects verification failure
                assert mastodon_result["public_access"] is False
                assert mastodon_result["error"] is None
        finally:
            app.dependency_overrides.clear()
