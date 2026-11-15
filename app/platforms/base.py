"""Abstract base class and shared utilities for platform adapters."""

import abc
import logging
import re
from typing import Optional

import httpx

from app.config import Settings, get_settings
from app.schemas import PlatformResult

logger = logging.getLogger("app.platforms")

# Default headers used when verifying public URLs to avoid anti-bot rejections
VERIFICATION_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}


class BasePlatformAdapter(abc.ABC):
    """Abstract base class for all social and content platform posting adapters."""

    def __init__(self, settings: Optional[Settings] = None) -> None:
        self.settings = settings or get_settings()

    @property
    @abc.abstractmethod
    def platform_name(self) -> str:
        """The canonical string identifier of the platform."""
        pass

    @abc.abstractmethod
    def is_configured(self) -> bool:
        """Return True if all necessary credentials for this platform are present."""
        pass

    @abc.abstractmethod
    def get_configuration_error(self) -> str:
        """Return a helpful message explaining what credentials are missing."""
        pass

    @abc.abstractmethod
    async def _publish_impl(self, message: str, client: httpx.AsyncClient) -> PlatformResult:
        """Internal platform-specific publication implementation."""
        pass

    def sanitize_error(self, message: str) -> str:
        """Sanitize error messages to eliminate leaked tokens, passwords, and webhook URLs.

        Strips:
        - Telegram bot tokens: e.g. bot123456:ABC-DEF -> bot***:***
        - Discord webhook URLs: e.g. webhooks/123/xyz -> webhooks/123/***
        - Bearer auth tokens: e.g. Bearer eyJ... -> Bearer ***
        - Query string and header API keys/tokens: e.g. api_key=xyz -> api_key=***
        - Configured secret values: matches of actual passwords or keys in settings.
        """
        if not message:
            return message

        sanitized = str(message)

        # Sanitize Telegram bot token in URLs/messages
        sanitized = re.sub(r"bot\d+:[A-Za-z0-9_-]+", "bot***:***", sanitized)

        # Sanitize Discord webhook tokens in URLs
        sanitized = re.sub(
            r"webhooks/(\d+)/[A-Za-z0-9_-]+", r"webhooks/\1/***", sanitized
        )

        # Sanitize Bearer tokens
        sanitized = re.sub(
            r"(Bearer\s+)[A-Za-z0-9._-]+", r"\1***", sanitized, flags=re.IGNORECASE
        )

        # Sanitize API keys and passwords in query params or error payloads
        sanitized = re.sub(
            r"(api[-_]?key[=:\s]+)[A-Za-z0-9._-]+", r"\1***", sanitized, flags=re.IGNORECASE
        )
        sanitized = re.sub(
            r"(password[=:\s]+)[^\s&\"']+", r"\1***", sanitized, flags=re.IGNORECASE
        )

        # Sanitize specific configured secrets
        secrets_to_mask = [
            self.settings.bluesky_app_password,
            self.settings.mastodon_access_token,
            self.settings.devto_api_key,
            self.settings.telegram_bot_token,
        ]
        if self.settings.discord_webhook_url:
            secrets_to_mask.append(self.settings.discord_webhook_url)

        for secret in secrets_to_mask:
            if secret and len(secret) > 4 and secret in sanitized:
                sanitized = sanitized.replace(secret, "***")

        return sanitized

    async def verify_public_url(self, url: str, client: httpx.AsyncClient) -> Optional[bool]:
        """Verify if a published post URL is publicly accessible without authentication.

        Distinguishes between:
        - True: URL responded with HTTP 200-299 and is not redirected to a login/auth page.
        - False: URL responded with confirmed inaccessible status codes (401, 403, 404, 410) or redirected to a login/auth page.
        - None: Indeterminate visibility (timeouts, network errors, anti-bot challenge like Cloudflare, 429 rate limit, 503, or non-authoritative server responses).
        """
        if not url:
            return None

        try:
            resp = await client.get(
                url,
                headers=VERIFICATION_HEADERS,
                follow_redirects=True,
                timeout=self.settings.verification_timeout_seconds,
            )

            # Check if redirect landed on an authentication or login portal
            if resp.history:
                final_path = resp.url.path.lower()
                final_url_str = str(resp.url).lower()
                auth_indicators = ("/login", "/signin", "/sign_in", "/auth", "/session/new")
                if any(ind in final_path or ind in final_url_str for ind in auth_indicators):
                    logger.info("Verification for %s redirected to auth/login page: %s", self.platform_name, resp.url)
                    return False

            # Check for Cloudflare / anti-bot challenge interstitial pages
            body_sample = resp.text[:1000].lower() if hasattr(resp, "text") else ""
            is_bot_challenge = (
                "cf-mitigated" in resp.headers
                or "just a moment..." in body_sample
                or "challenge-platform" in body_sample
                or "attention required!" in body_sample
            )
            if is_bot_challenge:
                logger.info("Anti-bot challenge encountered during verification of %s: %s", self.platform_name, url)
                return None

            if 200 <= resp.status_code < 300:
                return True
            if resp.status_code in (401, 403, 404, 410):
                return False
            if resp.status_code in (429, 503):
                # Rate limit or temporary service issue - indeterminate visibility
                return None
            return None
        except httpx.TimeoutException:
            logger.warning("Timeout during public URL verification for %s: %s", self.platform_name, url)
            # Timeouts indicate an indeterminate state, not confirmed inaccessibility
            return None
        except httpx.RequestError as exc:
            logger.warning(
                "Network error during public URL verification for %s (%s): %s",
                self.platform_name,
                url,
                self.sanitize_error(str(exc)),
            )
            # Network connection issues do not establish that content is private
            return None
        except Exception as exc:
            logger.warning(
                "Unexpected error during public URL verification for %s: %s",
                self.platform_name,
                self.sanitize_error(str(exc)),
            )
            return None

    async def publish(
        self,
        message: str,
        client: Optional[httpx.AsyncClient] = None,
    ) -> PlatformResult:
        """Publish message to the platform with isolated error handling and verification.

        Guarantees that exceptions are caught, sanitized, and transformed into a
        normalized PlatformResult object without breaking other concurrent adapters.
        """
        if not self.is_configured():
            return PlatformResult(
                platform=self.platform_name,
                status="failed",
                error=self.get_configuration_error(),
            )

        owns_client = client is None
        http_client = client or httpx.AsyncClient(timeout=self.settings.request_timeout_seconds)

        try:
            result = await self._publish_impl(message, http_client)

            # Perform post-publication public access check if a public URL was resolved
            if result.status == "success" and result.posted_url:
                result.public_access = await self.verify_public_url(
                    result.posted_url, http_client
                )

            return result
        except httpx.TimeoutException as exc:
            error_msg = f"Request timed out while communicating with {self.platform_name} API."
            logger.error("%s: %s", self.platform_name, error_msg)
            return PlatformResult(
                platform=self.platform_name,
                status="failed",
                error=self.sanitize_error(error_msg),
            )
        except httpx.HTTPStatusError as exc:
            status_code = exc.response.status_code
            try:
                resp_detail = exc.response.text
            except Exception:
                resp_detail = "Unable to read response body"
            error_msg = (
                f"{self.platform_name} API returned HTTP {status_code}: {resp_detail[:200]}"
            )
            logger.error("%s: %s", self.platform_name, self.sanitize_error(error_msg))
            return PlatformResult(
                platform=self.platform_name,
                status="failed",
                error=self.sanitize_error(error_msg),
            )
        except httpx.RequestError as exc:
            error_msg = f"Network connection error contacting {self.platform_name} API: {str(exc)}"
            logger.error("%s: %s", self.platform_name, self.sanitize_error(error_msg))
            return PlatformResult(
                platform=self.platform_name,
                status="failed",
                error=self.sanitize_error(error_msg),
            )
        except Exception as exc:
            error_msg = f"Unexpected error during {self.platform_name} publication: {str(exc)}"
            logger.error("%s: %s", self.platform_name, self.sanitize_error(error_msg))
            return PlatformResult(
                platform=self.platform_name,
                status="failed",
                error=self.sanitize_error(error_msg),
            )
        finally:
            if owns_client:
                await http_client.aclose()
