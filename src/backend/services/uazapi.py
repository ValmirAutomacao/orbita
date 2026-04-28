"""
Uazapi HTTP client — centralised integration layer.

All outbound calls to uazapi.dev pass through this module.
Callers receive typed dataclasses; raw HTTP details stay here.
"""

import os
from dataclasses import dataclass
from typing import Any

import httpx

UAZAPI_BASE      = os.environ.get("UAZAPI_BASE_URL", "https://uazapi.dev")
UAZAPI_ADMINTOKEN = os.environ.get("UAZAPI_ADMINTOKEN", "")
SYSTEM_NAME      = os.environ.get("UAZAPI_SYSTEM_NAME", "Pulseo")
_TIMEOUT         = 20


@dataclass
class InstanceInfo:
    token:         str
    instance_id:   str
    instance_name: str


@dataclass
class ConnectionStatus:
    state:        str           # connected | connecting | disconnected | banned | error
    phone_number: str | None
    profile_name: str | None
    owner_jid:    str | None
    is_business:  bool | None
    qrcode:       str | None    # base64 image when state == connecting


class UazapiError(Exception):
    def __init__(self, msg: str, status_code: int = 0):
        super().__init__(msg)
        self.status_code = status_code


class UazapiClient:
    """
    Thin async wrapper around the Uazapi REST API.

    Usage:
        client = UazapiClient()                    # admintoken from env
        client = UazapiClient(instance_token=tok)  # instance-scoped calls
    """

    def __init__(self, instance_token: str | None = None):
        self._instance_token = instance_token

    # ── Internal helpers ──────────────────────────────────────────────────────

    def _admin_headers(self) -> dict[str, str]:
        return {"admintoken": UAZAPI_ADMINTOKEN, "Content-Type": "application/json"}

    def _inst_headers(self) -> dict[str, str]:
        if not self._instance_token:
            raise UazapiError("instance_token required for this operation")
        return {"token": self._instance_token, "Content-Type": "application/json"}

    @staticmethod
    def _check(resp: httpx.Response, context: str) -> dict[str, Any]:
        if resp.status_code not in (200, 201):
            raise UazapiError(
                f"Uazapi {context} failed [{resp.status_code}]: {resp.text[:300]}",
                status_code=resp.status_code,
            )
        return resp.json()

    # ── Admin operations (require admintoken) ─────────────────────────────────

    async def create_instance(self, name: str) -> InstanceInfo:
        """Create a new Uazapi instance. Returns token + ids."""
        async with httpx.AsyncClient(timeout=_TIMEOUT) as http:
            resp = await http.post(
                f"{UAZAPI_BASE}/instance/create",
                headers=self._admin_headers(),
                json={"name": name, "systemName": SYSTEM_NAME},
            )
        data = self._check(resp, "create_instance")
        inst = data.get("instance", {})
        token = inst.get("token", "")
        if not token:
            raise UazapiError("Uazapi did not return instance token")
        return InstanceInfo(
            token=token,
            instance_id=inst.get("id") or inst.get("instanceId", ""),
            instance_name=inst.get("name") or name,
        )

    # ── Instance operations (require instance_token) ──────────────────────────

    async def connect(self) -> ConnectionStatus:
        """
        Request connection / generate QR Code.
        Returns status with base64 qrcode when state == 'connecting'.
        """
        async with httpx.AsyncClient(timeout=_TIMEOUT) as http:
            resp = await http.post(
                f"{UAZAPI_BASE}/instance/connect",
                headers=self._inst_headers(),
                json={},
            )
        data = self._check(resp, "connect")
        inst = data.get("instance", {})
        return ConnectionStatus(
            state=inst.get("status", "connecting"),
            phone_number=inst.get("phone"),
            profile_name=inst.get("profileName"),
            owner_jid=inst.get("ownerJid"),
            is_business=inst.get("isBusiness"),
            qrcode=inst.get("qrcode"),
        )

    async def get_status(self) -> ConnectionStatus:
        """Poll current connection status for this instance."""
        async with httpx.AsyncClient(timeout=_TIMEOUT) as http:
            resp = await http.get(
                f"{UAZAPI_BASE}/instance/status",
                headers=self._inst_headers(),
            )
        data = self._check(resp, "get_status")
        inst = data.get("instance", {})
        return ConnectionStatus(
            state=inst.get("status", "disconnected"),
            phone_number=inst.get("phone"),
            profile_name=inst.get("profileName"),
            owner_jid=inst.get("ownerJid"),
            is_business=inst.get("isBusiness"),
            qrcode=inst.get("qrcode"),
        )

    async def send_text(self, phone: str, message: str) -> dict[str, Any]:
        """Send a plain-text WhatsApp message."""
        async with httpx.AsyncClient(timeout=_TIMEOUT) as http:
            resp = await http.post(
                f"{UAZAPI_BASE}/message/sendText",
                headers=self._inst_headers(),
                json={"phone": phone, "message": message},
            )
        return self._check(resp, "send_text")

    async def configure_webhook(self, url: str, events: list[str]) -> None:
        """Register the webhook URL and subscribed event types."""
        async with httpx.AsyncClient(timeout=_TIMEOUT) as http:
            resp = await http.post(
                f"{UAZAPI_BASE}/webhook",
                headers=self._inst_headers(),
                json={"url": url, "events": events},
            )
        self._check(resp, "configure_webhook")

    async def configure_delay(self, min_s: int, max_s: int) -> None:
        """Set anti-ban message delay (seconds)."""
        async with httpx.AsyncClient(timeout=_TIMEOUT) as http:
            resp = await http.post(
                f"{UAZAPI_BASE}/instance/updateDelaySettings",
                headers=self._inst_headers(),
                json={"msg_delay_min": min_s, "msg_delay_max": max_s},
            )
        self._check(resp, "configure_delay")

    async def configure_privacy(self, settings: dict[str, str]) -> None:
        """Apply WhatsApp privacy settings to the instance."""
        async with httpx.AsyncClient(timeout=_TIMEOUT) as http:
            resp = await http.post(
                f"{UAZAPI_BASE}/instance/privacy",
                headers=self._inst_headers(),
                json=settings,
            )
        self._check(resp, "configure_privacy")

    async def configure_warmup_delay(self, min_s: int, max_s: int) -> None:
        """
        Apply warm-up-aware message delay to the instance.

        Delegates to configure_delay — exists as a named method so callers
        can express intent (warm-up schedule) instead of raw seconds.
        """
        await self.configure_delay(min_s=min_s, max_s=max_s)
