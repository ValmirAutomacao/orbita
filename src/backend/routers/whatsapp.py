"""
WhatsApp endpoints — all Uazapi calls are server-side only.

POST /provision  — create instance + configure webhook/anti-ban (idempotent)
POST /connect    — request QR Code from Uazapi, return base64 to frontend
GET  /status     — poll Uazapi connection status; update tenant_whatsapp_config
"""

import os
import re
import unicodedata

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from supabase import Client, create_client

from services.uazapi import UazapiClient, UazapiError

router = APIRouter()
bearer_scheme = HTTPBearer()

# ── Env vars ──────────────────────────────────────────────────────────────────

SUPABASE_URL        = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]

# ── Supabase service-role client (bypasses RLS) ───────────────────────────────

def _supabase() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _slugify(text: str) -> str:
    """Lowercase, ASCII-only, spaces/special chars → underscores, collapse runs."""
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", "_", text)
    return text.strip("_")


# ── Response schema ───────────────────────────────────────────────────────────

class ProvisionResponse(BaseModel):
    instanceId:   str
    instanceName: str


class ConnectResponse(BaseModel):
    qrcode: str          # data:image/png;base64,…


class StatusResponse(BaseModel):
    status:      str             # connected | connecting | disconnected | qrExpired
    profileName: str | None = None
    isBusiness:  bool | None = None
    ownerJid:    str | None = None


# ── Shared auth helper ────────────────────────────────────────────────────────

async def _resolve_tenant(jwt: str, db: Client) -> str:
    """Validate JWT and return tenant_id. Raises 401/400 on failure."""
    user_resp = db.auth.get_user(jwt)
    if not user_resp or not user_resp.user:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado.")
    user_row = (
        db.table("users")
        .select("tenant_id")
        .eq("id", str(user_resp.user.id))
        .single()
        .execute()
    )
    if not user_row.data or not user_row.data.get("tenant_id"):
        raise HTTPException(status_code=400, detail="Tenant não encontrado para este usuário.")
    return user_row.data["tenant_id"]


async def _get_instance_token(tenant_id: str, db: Client) -> str:
    """Retrieve stored Uazapi instance token from tenant_settings. Raises 404 if not provisioned."""
    row = (
        db.table("tenant_settings")
        .select("whatsapp_token")
        .eq("tenant_id", tenant_id)
        .single()
        .execute()
    )
    token = (row.data or {}).get("whatsapp_token")
    if not token:
        raise HTTPException(status_code=404, detail="Instância WhatsApp não provisionada. Chame /provision primeiro.")
    return token


# ── Endpoint ──────────────────────────────────────────────────────────────────

@router.post("/provision", response_model=ProvisionResponse, status_code=status.HTTP_200_OK)
async def provision(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> ProvisionResponse:
    jwt = credentials.credentials
    db  = _supabase()
    tenant_id = await _resolve_tenant(jwt, db)

    # 3. Load tenant data (business_name + niche) ─────────────────────────────
    tenant_row = (
        db.table("tenants")
        .select("business_name, niche")
        .eq("id", tenant_id)
        .single()
        .execute()
    )
    if not tenant_row.data:
        raise HTTPException(status_code=400, detail="Dados do tenant não encontrados.")
    business_name: str = tenant_row.data["business_name"]
    niche:         str = tenant_row.data["niche"]

    # 4. Compose sanitised instance name (PRD-v3 §4.2.2: nicho_nome_empresa) ───
    instance_name = f"{_slugify(niche)}_{_slugify(business_name)}"

    # 5. Check if already provisioned (idempotent) ────────────────────────────
    settings_row = (
        db.table("tenant_settings")
        .select("whatsapp_token, whatsapp_instance_id, whatsapp_instance_name")
        .eq("tenant_id", tenant_id)
        .single()
        .execute()
    )
    existing = settings_row.data or {}
    if existing.get("whatsapp_token"):
        return ProvisionResponse(
            instanceId=existing["whatsapp_instance_id"],
            instanceName=existing["whatsapp_instance_name"],
        )

    # 6. Create instance on Uazapi (admintoken — server-side only) ─────────────
    api_base_url = os.environ.get("API_PUBLIC_URL", "https://api.pulseo.pt")

    try:
        uazapi = UazapiClient()
        info   = await uazapi.create_instance(instance_name)
        inst_token = info.token
        inst_id    = info.instance_id

        inst_client = UazapiClient(instance_token=inst_token)

        # 6b. Configure webhook (PRD-v3 §4.2.1 passo 2) ──────────────────────
        await inst_client.configure_webhook(
            url=f"{api_base_url}/webhook/whatsapp/{tenant_id}",
            events=["connection", "messages", "messages_update", "chats", "call"],
        )

        # 6c. Anti-ban delay — conservative default for new numbers ───────────
        await inst_client.configure_delay(min_s=5, max_s=12)

        # 6d. Privacy hardening (PRD-v3 §4.2.1 passo 4) ──────────────────────
        await inst_client.configure_privacy({
            "groupadd":     "contacts",
            "last":         "contacts",
            "online":       "contacts",
            "profile":      "contacts",
            "readreceipts": "all",
            "calladd":      "known",
        })

    except UazapiError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    # 7. Persist to tenant_settings ───────────────────────────────────────────
    db.table("tenant_settings").upsert(
        {
            "tenant_id":              tenant_id,
            "whatsapp_instance_id":   inst_id,
            "whatsapp_instance_name": instance_name,
            "whatsapp_token":         inst_token,
        },
        on_conflict="tenant_id",
    ).execute()

    return ProvisionResponse(
        instanceId=inst_id,
        instanceName=instance_name,
    )


# ── POST /connect ─────────────────────────────────────────────────────────────

@router.post("/connect", response_model=ConnectResponse, status_code=status.HTTP_200_OK)
async def connect(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> ConnectResponse:
    """Request a QR Code from Uazapi for the tenant's instance. Returns base64 image."""
    jwt = credentials.credentials
    db  = _supabase()
    tenant_id = await _resolve_tenant(jwt, db)
    token     = await _get_instance_token(tenant_id, db)

    try:
        status_obj = await UazapiClient(instance_token=token).connect()
    except UazapiError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    if not status_obj.qrcode:
        raise HTTPException(status_code=502, detail="Uazapi não retornou QR Code.")

    return ConnectResponse(qrcode=status_obj.qrcode)


# ── GET /status ───────────────────────────────────────────────────────────────

@router.get("/status", response_model=StatusResponse, status_code=status.HTTP_200_OK)
async def get_status(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> StatusResponse:
    """
    Poll Uazapi connection status. When 'connected', syncs phone_number /
    profile_name / owner_jid into tenant_whatsapp_config.
    """
    jwt = credentials.credentials
    db  = _supabase()
    tenant_id = await _resolve_tenant(jwt, db)
    token     = await _get_instance_token(tenant_id, db)

    try:
        conn = await UazapiClient(instance_token=token).get_status()
    except UazapiError:
        return StatusResponse(status="qrExpired")

    if conn.state == "connected":
        from datetime import datetime, timezone
        update: dict = {
            "tenant_id":  tenant_id,
            "status":     "connected",
            "connected_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        if conn.phone_number: update["phone_number"] = conn.phone_number
        if conn.profile_name: update["profile_name"] = conn.profile_name
        if conn.owner_jid:    update["owner_jid"]    = conn.owner_jid
        if conn.is_business is not None: update["is_business"] = conn.is_business

        db.table("tenant_whatsapp_config").upsert(
            update, on_conflict="tenant_id"
        ).execute()

    return StatusResponse(
        status=conn.state,
        profileName=conn.profile_name,
        isBusiness=conn.is_business,
        ownerJid=conn.owner_jid,
    )
