"""Tests for request input validation, character limits, and URL extraction."""

import pytest
from httpx import ASGITransport, AsyncClient
from pydantic import ValidationError

from app.main import app
from app.schemas import PostingRequest, extract_and_validate_single_url


class TestUrlExtractionAndValidation:
    """Unit tests for the dedicated URL extraction and validation function."""

    def test_valid_http_url(self):
        text = "Check out our services at http://example.com/services"
        url = extract_and_validate_single_url(text)
        assert url == "http://example.com/services"

    def test_valid_https_url_with_query_params(self):
        text = "Visit https://app.example.com/dashboard?tab=overview&ref=promo for updates."
        url = extract_and_validate_single_url(text)
        assert url == "https://app.example.com/dashboard?tab=overview&ref=promo"

    def test_trailing_punctuation_dot(self):
        text = "Discover our latest business platform. Visit https://example.com/home."
        url = extract_and_validate_single_url(text)
        assert url == "https://example.com/home"

    def test_trailing_punctuation_comma_and_exclamation(self):
        text = "Join us at https://example.com, it is amazing!"
        url = extract_and_validate_single_url(text)
        assert url == "https://example.com"

    def test_url_enclosed_in_parentheses(self):
        text = "Get started today (https://example.com/start) now!"
        url = extract_and_validate_single_url(text)
        assert url == "https://example.com/start"

    def test_missing_url(self):
        text = "There is no link provided in this message at all."
        with pytest.raises(ValueError, match="Message must contain exactly one HTTP or HTTPS URL"):
            extract_and_validate_single_url(text)

    def test_multiple_urls(self):
        text = "Compare https://example.com/a and https://example.com/b right now."
        with pytest.raises(ValueError, match="Message must contain exactly one URL, but 2 were found"):
            extract_and_validate_single_url(text)

    def test_unsupported_ftp_scheme(self):
        text = "Download files from ftp://files.example.com/archive"
        with pytest.raises(ValueError, match="Unsupported URL scheme 'ftp'"):
            extract_and_validate_single_url(text)

    def test_unsupported_mailto_scheme(self):
        text = "Contact support at mailto:support@example.com for help."
        with pytest.raises(ValueError, match="Unsupported URL scheme 'mailto'"):
            extract_and_validate_single_url(text)

    def test_unsupported_javascript_scheme(self):
        text = "Click javascript:alert(1) for test."
        with pytest.raises(ValueError, match="Unsupported URL scheme 'javascript'"):
            extract_and_validate_single_url(text)

    def test_url_without_scheme_www(self):
        text = "Visit www.example.com for our catalog."
        with pytest.raises(ValueError, match="missing scheme"):
            extract_and_validate_single_url(text)

    def test_malformed_url_missing_hostname(self):
        text = "Visit https:// for more details."
        with pytest.raises(ValueError, match="missing hostname"):
            extract_and_validate_single_url(text)

    def test_malformed_url_invalid_port(self):
        text = "Check http://example.com:invalid/path for info."
        with pytest.raises(ValueError, match="invalid port specification"):
            extract_and_validate_single_url(text)


class TestPostingRequestSchema:
    """Unit tests for the PostingRequest Pydantic model."""

    def test_valid_request(self):
        msg = "Check out our latest platform and grow your visibility. https://example.com"
        req = PostingRequest(message=msg)
        assert req.message == msg
        assert req.get_extracted_url() == "https://example.com"

    def test_empty_message(self):
        with pytest.raises(ValidationError) as exc_info:
            PostingRequest(message="")
        assert "Message must not be empty" in str(exc_info.value)

    def test_whitespace_only_message(self):
        with pytest.raises(ValidationError) as exc_info:
            PostingRequest(message="     \t \n  ")
        assert "Message must not be empty" in str(exc_info.value)

    def test_message_exceeding_200_characters(self):
        long_text = "A" * 190 + " https://example.com"
        assert len(long_text) > 200
        with pytest.raises(ValidationError) as exc_info:
            PostingRequest(message=long_text)
        assert "exceeding the maximum allowed limit of 200" in str(exc_info.value)

    def test_message_exactly_200_characters(self):
        prefix = "A" * (200 - len(" https://example.com"))
        valid_200 = f"{prefix} https://example.com"
        assert len(valid_200) == 200
        req = PostingRequest(message=valid_200)
        assert len(req.message) == 200

    def test_client_side_platform_selection_forbidden(self):
        """Verifies that client-side platform selection keys are strictly rejected."""
        with pytest.raises(ValidationError) as exc_info:
            PostingRequest(
                message="Valid text https://example.com",
                platforms=["bluesky", "discord"],  # Extra forbidden field
            )
        assert "Extra inputs are not permitted" in str(exc_info.value)


@pytest.mark.asyncio
class TestValidationApiEndpoints:
    """Integration tests verifying HTTP 422 responses on the /posting endpoint."""

    async def test_api_valid_request(self):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                "/posting",
                json={
                    "message": "Launch update https://example.com/launch"
                },
            )
            # Should not be a 422 validation error
            assert resp.status_code == 200
            data = resp.json()
            assert "success" in data
            assert "results" in data

    async def test_api_empty_message_returns_422(self):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post("/posting", json={"message": ""})
            assert resp.status_code == 422
            data = resp.json()
            assert "errors" in data
            assert any("Message must not be empty" in err for err in data["errors"])

    async def test_api_missing_url_returns_422(self):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                "/posting",
                json={"message": "Great news about our company today."},
            )
            assert resp.status_code == 422
            data = resp.json()
            assert any("Message must contain exactly one HTTP or HTTPS URL" in err for err in data["errors"])

    async def test_api_multiple_urls_returns_422(self):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                "/posting",
                json={
                    "message": "Visit https://first.com and also https://second.com"
                },
            )
            assert resp.status_code == 422
            data = resp.json()
            assert any("Message must contain exactly one URL" in err for err in data["errors"])

    async def test_api_unsupported_scheme_returns_422(self):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                "/posting",
                json={"message": "Download from ftp://mirror.example.com/pkg"},
            )
            assert resp.status_code == 422
            data = resp.json()
            assert any("Unsupported URL scheme 'ftp'" in err for err in data["errors"])

    async def test_api_message_exceeding_200_chars_returns_422(self):
        transport = ASGITransport(app=app)
        long_message = "Super long message announcement " * 7 + "https://example.com"
        assert len(long_message) > 200
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post("/posting", json={"message": long_message})
            assert resp.status_code == 422
            data = resp.json()
            assert any("exceeding the maximum allowed limit of 200" in err for err in data["errors"])

    async def test_api_reject_client_platform_selection(self):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                "/posting",
                json={
                    "message": "Valid post https://example.com",
                    "platforms": ["mastodon"],
                },
            )
            assert resp.status_code == 422
            data = resp.json()
            assert any("Extra inputs are not permitted" in err for err in data["errors"])

    async def test_api_malformed_body_not_json(self):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                "/posting",
                content="This is not valid json",
                headers={"Content-Type": "application/json"},
            )
            assert resp.status_code == 422
