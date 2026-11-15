"""Pydantic schemas and request/response validation logic."""

import re
from typing import Literal, Optional
from urllib.parse import urlsplit

from pydantic import BaseModel, ConfigDict, Field, field_validator


# Regular expression capturing URLs with scheme, explicit special URI schemes (mailto, javascript),
# or raw 'www.' domain prefixes. Bare email addresses (e.g. user@domain.com) are excluded
# so natural prose containing an email alongside a link does not trigger a false multiple-URL error.
URL_PATTERN = re.compile(
    r"(?:[a-zA-Z][a-zA-Z0-9+.-]*://[^\s<>\"\']*|javascript:[^\s<>\"\']+|mailto:[^\s<>\"\']+|www\.[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s<>\"\']*)"
)

# Common sentence-ending and formatting punctuation characters attached to URLs in prose
LEADING_PUNCTUATION = "([<\"'\\`"


def clean_candidate_token(token: str) -> str:
    """Strip extraneous leading/trailing punctuation from candidate URL tokens.

    Preserves balanced closing parentheses (such as Wikipedia article URLs e.g.
    'https://en.wikipedia.org/wiki/Python_(programming_language)') while stripping
    unmatched trailing parentheses from prose wrappers like '(https://example.com)'.
    Also preserves IPv6 closing brackets ('http://[::1]:8080/').
    """
    cleaned = token.strip(LEADING_PUNCTUATION)
    while cleaned:
        last_char = cleaned[-1]
        if last_char in ".,;:!?\"'\\`":
            cleaned = cleaned[:-1]
        elif last_char == ")":
            if cleaned.count(")") > cleaned.count("("):
                cleaned = cleaned[:-1]
            else:
                break
        elif last_char == "]":
            if cleaned.count("]") > cleaned.count("["):
                cleaned = cleaned[:-1]
            else:
                break
        elif last_char in ">}":
            cleaned = cleaned[:-1]
        else:
            break
    return cleaned


import ipaddress


def _validate_hostname_syntax(hostname: str, url: str) -> None:
    """Validate hostname syntax against RFC 1123, RFC 3986, and IP address specifications."""
    # Check for valid IPv4 or IPv6 address literal
    try:
        ipaddress.ip_address(hostname)
        return
    except ValueError:
        pass

    # Localhost is valid for local testing/development
    if hostname.lower() == "localhost":
        return

    # Enforce domain length bounds (RFC 1035)
    if len(hostname) > 253:
        raise ValueError(f"Malformed URL '{url}': hostname exceeds 253 characters.")

    if hostname.startswith(".") or hostname.endswith(".") or ".." in hostname:
        raise ValueError(
            f"Malformed URL '{url}': invalid hostname '{hostname}' with leading, trailing, or consecutive dots."
        )

    labels = hostname.split(".")
    # Top-level domain cannot be all-numeric (RFC 1123 / RFC 3696)
    if len(labels) > 1 and labels[-1].isdigit():
        raise ValueError(
            f"Malformed URL '{url}': top-level domain label '{labels[-1]}' cannot be all-numeric."
        )

    if len(labels) == 1 and hostname.isdigit():
        raise ValueError(
            f"Malformed URL '{url}': hostname '{hostname}' cannot be all-numeric."
        )

    for label in labels:
        if not label:
            raise ValueError(f"Malformed URL '{url}': empty label in hostname '{hostname}'.")
        if len(label) > 63:
            raise ValueError(f"Malformed URL '{url}': hostname label '{label}' exceeds 63 characters.")
        if label.startswith("-") or label.endswith("-"):
            raise ValueError(
                f"Malformed URL '{url}': hostname label '{label}' cannot start or end with a hyphen."
            )
        if not re.match(r"^[a-zA-Z0-9-]+$", label):
            raise ValueError(
                f"Malformed URL '{url}': hostname label '{label}' contains invalid characters."
            )


def extract_and_validate_single_url(text: str) -> str:
    """Extract and strictly validate that natural text contains exactly one valid HTTP/HTTPS URL.

    Requirements:
    - Exactly one URL must be present in the text.
    - The URL scheme must be 'http' or 'https'.
    - The URL must have a valid, non-empty hostname.
    - Malformed ports, unsupported schemes, and missing schemes are rejected with
      informative error messages.

    Limitations of URL parsing:
    - Complex URIs containing balanced parentheses (e.g. Wikipedia article titles)
      are handled, but highly nested ambiguous prose punctuation may require explicit separation.
    - Unicode/IDN domain names should be encoded or formatted according to standard RFC 3986.
    """
    raw_matches = URL_PATTERN.findall(text)
    candidates = []
    for match in raw_matches:
        cleaned = clean_candidate_token(match)
        if cleaned:
            candidates.append(cleaned)

    if len(candidates) == 0:
        raise ValueError("Message must contain exactly one HTTP or HTTPS URL, but none was found.")

    if len(candidates) > 1:
        raise ValueError(
            f"Message must contain exactly one URL, but {len(candidates)} were found: {candidates}"
        )

    candidate = candidates[0]

    if candidate.lower().startswith("www."):
        raise ValueError(
            f"Invalid URL '{candidate}': missing scheme. Only 'http' and 'https' schemes are supported."
        )

    try:
        parsed = urlsplit(candidate)
    except Exception as exc:
        raise ValueError(f"Malformed URL '{candidate}': {exc}")

    scheme = parsed.scheme.lower()
    if not scheme:
        raise ValueError(
            f"Invalid URL '{candidate}': missing scheme. Only 'http' and 'https' schemes are supported."
        )

    if scheme not in ("http", "https"):
        raise ValueError(
            f"Unsupported URL scheme '{scheme}'. Only 'http' and 'https' are supported."
        )

    if not parsed.netloc:
        raise ValueError(f"Invalid URL '{candidate}': missing hostname or network location.")

    try:
        hostname = parsed.hostname
    except ValueError as exc:
        raise ValueError(f"Malformed URL '{candidate}': invalid hostname ({exc}).")

    if not hostname:
        raise ValueError(f"Invalid URL '{candidate}': missing hostname.")

    # Strictly validate hostname syntax against RFC 1123 / IP address standards
    _validate_hostname_syntax(hostname, candidate)

    # Validate port if specified
    try:
        port = parsed.port
        if port is not None and not (1 <= port <= 65535):
            raise ValueError(f"Port {port} is out of valid range (1-65535).")
    except ValueError as exc:
        raise ValueError(f"Malformed URL '{candidate}': invalid port specification ({exc}).")

    return candidate


class PostingRequest(BaseModel):
    """Incoming request model for POST /posting.

    Strictly forbids client-side platform selection or extraneous keys.
    """

    message: str = Field(
        ...,
        description="The content to be published across platforms. Must contain exactly one HTTP/HTTPS URL and be <= 200 characters.",
        json_schema_extra={
            "example": "Check out our latest business platform and grow your online visibility. https://example.com"
        },
    )

    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=False,
    )

    @field_validator("message", mode="after")
    @classmethod
    def validate_message(cls, v: str) -> str:
        """Validate trimmed length, character limits, and exact single URL."""
        if not isinstance(v, str):
            raise ValueError("Message must be a string.")

        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Message must not be empty or whitespace only.")

        if len(trimmed) > 200:
            raise ValueError(
                f"Message contains {len(trimmed)} characters, exceeding the maximum allowed limit of 200."
            )

        # Enforce exactly one valid HTTP/HTTPS URL
        extract_and_validate_single_url(trimmed)

        return trimmed

    def get_extracted_url(self) -> str:
        """Return the single validated URL from the message."""
        return extract_and_validate_single_url(self.message)


class PlatformResult(BaseModel):
    """Normalized publication result for an individual platform."""

    platform: str = Field(..., description="Platform identifier (bluesky, mastodon, devto, telegram, discord).")
    status: Literal["success", "failed"] = Field(..., description="Execution status of the posting attempt.")
    posted_url: Optional[str] = Field(None, description="Actual public URL of the published post, or null.")
    public_access: Optional[bool] = Field(
        None,
        description="True if post was verified publicly accessible; False if verification failed; null if unknown or not verifiable.",
    )
    date: Optional[str] = Field(None, description="Publication date in ISO YYYY-MM-DD (UTC), or null on failure.")
    time: Optional[str] = Field(None, description="Publication time in ISO HH:MM:SS (UTC), or null on failure.")
    error: Optional[str] = Field(None, description="Sanitized error description on failure; null on success.")


class PostingSummary(BaseModel):
    """Summary statistics for multi-platform posting operations."""

    total: int = Field(..., description="Total number of platforms targeted.")
    successful: int = Field(..., description="Number of platforms where publication succeeded.")
    failed: int = Field(..., description="Number of platforms where publication failed.")


class PostingResponse(BaseModel):
    """Normalized response payload for POST /posting."""

    success: bool = Field(
        ...,
        description="True if at least one platform published successfully; False if all platforms failed.",
    )
    summary: PostingSummary = Field(..., description="High-level counts of publication results.")
    results: list[PlatformResult] = Field(
        ...,
        description="Detailed execution results for each configured platform adapter.",
    )


class HealthResponse(BaseModel):
    """Health check endpoint response model."""

    status: str = "ok"
    platforms_configured: dict[str, bool]
    version: str = "1.0.0"
