"""
POST /webhook/whatsapp/{tenant_id}

Receives events from Uazapi and updates tenant_whatsapp_config in real-time.

Event types handled:
  connection  → updates status, phone_number, profile_name, owner_jid
  messages    → (future: trigger opt-out detection, AI reply, etc.)
  call        → (future: missed-call follow-up)
"""

import logging
import os
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, HTTPException, Request, status
from supabase import Client, create_client

logger = logging.getLogger(__name__)

router = APIRouter()

SUPABASE_URL         = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]

# Valid status values constrained by DB CHECK
_VALID_STATUSES = {"disconnected", "connecting", "connected", "banned", "error"}

# Map Uazapi state strings → DB status enum
_STATE_MAP: dict[str, str] = {
    "connected":    "connected",
    "connecting":   "connecting",
    "open":         "connected",
    "close":        "disconnected",
    "disconnected": "disconnected",
    "banned":       "banned",
    "replaced":     "disconnected",
    "conflict":     "disconnected",
    "unknown":      "error",
}


def _db() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _normalise_status(raw: str | None) -> str:
    if not raw:
        return "disconnected"
    mapped = _STATE_MAP.get(raw.lower())
    if mapped:
        return mapped
    return raw.lower() if raw.lower() in _VALID_STATUSES else "error"


# ── Webhook endpoint ──────────────────────────────────────────────────────────

@router.post(
    "/whatsapp/{tenant_id}",
    status_code=status.HTTP_200_OK,
)
async def receive_whatsapp_event(tenant_id: str, request: Request) -> dict[str, str]:
    try:
        payload: dict[str, Any] = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    event_type: str = payload.get("event", "")
    data: dict[str, Any] = payload.get("data", payload)  # some events nest under "data"

    logger.info("webhook tenant=%s event=%s", tenant_id, event_type)

    if event_type == "connection":
        await _handle_connection(tenant_id, data)
    elif event_type in ("messages", "messages_update"):
        # Placeholder — message processing handled in a future story
        pass
    elif event_type == "call":
        # Placeholder — missed-call follow-up handled in a future story
        pass
    else:
        logger.debug("webhook: unhandled event type '%s' for tenant %s", event_type, tenant_id)

    return {"status": "ok"}


# ── Connection event handler ──────────────────────────────────────────────────

async def _handle_connection(tenant_id: str, data: dict[str, Any]) -> None:
    raw_state: str | None = data.get("state") or data.get("status")
    db_status = _normalise_status(raw_state)

    update: dict[str, Any] = {
        "status":     db_status,
        "updated_at": _now(),
    }

    if db_status == "connected":
        update["connected_at"]      = _now()
        update["last_disconnect_at"] = None
        update["last_disconnect_reason"] = None

        instance = data.get("instance", data)
        if phone := (instance.get("phone") or data.get("phone")):
            update["phone_number"] = phone
        if name := (instance.get("profileName") or data.get("profileName")):
            update["profile_name"] = name
        if jid := (instance.get("ownerJid") or data.get("ownerJid")):
            update["owner_jid"] = jid
        if (is_biz := instance.get("isBusiness")) is not None:
            update["is_business"] = is_biz

    elif db_status in ("disconnected", "banned", "error"):
        update["last_disconnect_at"]     = _now()
        update["last_disconnect_reason"] = (
            data.get("reason") or data.get("lastDisconnect", {}).get("error", "")
        )

    try:
        db = _db()
        db.table("tenant_whatsapp_config").upsert(
            {"tenant_id": tenant_id, **update},
            on_conflict="tenant_id",
        ).execute()
    except Exception as exc:
        logger.error("webhook DB update failed tenant=%s: %s", tenant_id, exc)
        raise HTTPException(status_code=500, detail="DB update failed")
