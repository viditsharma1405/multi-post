"""Bluesky (AT Protocol) platform adapter."""

from datetime import datetime, timezone
import httpx

from app.platforms.base import BasePlatformAdapter
from app.schemas import PlatformResult


class BlueskyAdapter(BasePlatformAdapter):
    """Adapter for posting to Bluesky using the official AT Protocol XRPC endpoints."""

    BLUESKY_HOST = "https://bsky.social"

    @property
    def platform_name(self) -> str:
        return "bluesky"

    def is_configured(self) -> bool:
        return bool(self.settings.bluesky_handle and self.settings.bluesky_app_password)

    def get_configuration_error(self) -> str:
        return (
            "Bluesky is not configured: BLUESKY_HANDLE or BLUESKY_APP_PASSWORD is missing."
        )

    async def _publish_impl(self, message: str, client: httpx.AsyncClient) -> PlatformResult:
        """Authenticate via com.atproto.server.createSession and post to app.bsky.feed.post."""
        session_url = f"{self.BLUESKY_HOST}/xrpc/com.atproto.server.createSession"
        session_payload = {
            "identifier": self.settings.bluesky_handle,
            "password": self.settings.bluesky_app_password,
        }

        # Step 1: Create session / authenticate
        session_resp = await client.post(session_url, json=session_payload)
        session_resp.raise_for_status()
        session_data = session_resp.json()

        access_jwt = session_data.get("accessJwt")
        did = session_data.get("did")
        raw_handle = session_data.get("handle") or self.settings.bluesky_handle
        clean_handle = raw_handle.lstrip("@") if raw_handle else did

        if not access_jwt or not did:
            return PlatformResult(
                platform=self.platform_name,
                status="failed",
                error="Bluesky authentication failed: missing accessJwt or did in response.",
            )

        # Step 2: Build post record with AT Protocol rich-text link facets
        create_record_url = f"{self.BLUESKY_HOST}/xrpc/com.atproto.repo.createRecord"
        now_utc = datetime.now(timezone.utc)
        created_at_iso = now_utc.strftime("%Y-%m-%dT%H:%M:%SZ")

        record: dict = {
            "$type": "app.bsky.feed.post",
            "text": message,
            "createdAt": created_at_iso,
        }

        # In AT Protocol, URLs require explicit facet annotations with UTF-8 byte offsets
        # to render as clickable links in Bluesky clients
        try:
            from app.schemas import extract_and_validate_single_url
            cta_url = extract_and_validate_single_url(message)
            msg_bytes = message.encode("utf-8")
            url_bytes = cta_url.encode("utf-8")
            byte_start = msg_bytes.find(url_bytes)
            if byte_start != -1:
                byte_end = byte_start + len(url_bytes)
                record["facets"] = [
                    {
                        "index": {"byteStart": byte_start, "byteEnd": byte_end},
                        "features": [
                            {
                                "$type": "app.bsky.richtext.facet#link",
                                "uri": cta_url,
                            }
                        ],
                    }
                ]
        except Exception:
            pass

        record_payload = {
            "repo": did,
            "collection": "app.bsky.feed.post",
            "record": record,
        }

        headers = {
            "Authorization": f"Bearer {access_jwt}",
            "Content-Type": "application/json",
        }

        post_resp = await client.post(create_record_url, json=record_payload, headers=headers)
        post_resp.raise_for_status()
        post_data = post_resp.json()

        # Step 3: Extract post URI & CID, and resolve public URL
        # Format of uri: at://<did>/app.bsky.feed.post/<rkey>
        post_uri = post_data.get("uri")
        posted_url = None
        if post_uri:
            rkey = post_uri.rstrip("/").split("/")[-1]
            posted_url = f"https://bsky.app/profile/{clean_handle}/post/{rkey}"

        # Derive publication date and time strictly from confirmed record creation timestamp
        dt = datetime.fromisoformat(created_at_iso.replace("Z", "+00:00")).astimezone(timezone.utc)

        return PlatformResult(
            platform=self.platform_name,
            status="success",
            posted_url=posted_url,
            public_access=None,  # Will be evaluated by BasePlatformAdapter.verify_public_url
            date=dt.strftime("%Y-%m-%d"),
            time=dt.strftime("%H:%M:%S"),
            error=None,
        )
