"""
WhatsApp endpoints — all Uazapi calls are server-side only.

POST /provision      — create instance + configure webhook/anti-ban (idempotent)
POST /connect        — request QR Code from Uazapi, return base64 to frontend
GET  /status         — poll Uazapi connection status; update tenant_whatsapp_config
POST /warmup/apply   — recalculate warmup week, apply delays, persist to DB
GET  /health/today   — compute health_score and upsert whatsapp_health_metrics
"""

import os
import re
import unicodedata
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from supabase import Client, create_client

from services.uazapi import UazapiClient, UazapiError
from services.warmup import WarmupConfig, compute_warmup_config, compute_health_score

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


class WarmupApplyResponse(BaseModel):
    warmup_week: int
    delay_min_s: int
    delay_max_s: int
    msg_limit:   int


class HealthResponse(BaseModel):
    date:          str
    health_score:  float
    warmup_week:   int
    msgs_sent:     int
    msgs_received: int
    block_count:   int
    msgs_limit_hit: bool


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


# ── POST /warmup/apply ────────────────────────────────────────────────────────

@router.post("/warmup/apply", response_model=WarmupApplyResponse, status_code=status.HTTP_200_OK)
async def warmup_apply(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> WarmupApplyResponse:
    """
    Recalculate the current warm-up week from connected_at / warmup_started_at,
    apply the correct delays to the Uazapi instance, and persist to
    tenant_whatsapp_config.

    Can be called on first connect and by a Celery beat job (future story).
    """
    jwt = credentials.credentials
    db  = _supabase()
    tenant_id = await _resolve_tenant(jwt, db)
    token     = await _get_instance_token(tenant_id, db)

    # Load current warm-up state from tenant_whatsapp_config
    row = (
        db.table("tenant_whatsapp_config")
        .select("is_new_number, connected_at, warmup_started_at, warmup_week")
        .eq("tenant_id", tenant_id)
        .single()
        .execute()
    )
    cfg_data = row.data or {}

    def _parse_dt(val: str | None) -> datetime | None:
        if not val:
            return None
        try:
            return datetime.fromisoformat(val.replace("Z", "+00:00"))
        except ValueError:
            return None

    warmup_cfg: WarmupConfig = compute_warmup_config(
        is_new_number=cfg_data.get("is_new_number", False),
        connected_at=_parse_dt(cfg_data.get("connected_at")),
        warmup_started_at=_parse_dt(cfg_data.get("warmup_started_at")),
    )

    # Apply delays to Uazapi
    try:
        await UazapiClient(instance_token=token).configure_warmup_delay(
            min_s=warmup_cfg.delay_min,
            max_s=warmup_cfg.delay_max,
        )
    except UazapiError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    # Persist warm-up state
    now_iso = datetime.now(timezone.utc).isoformat()
    update: dict = {
        "tenant_id":  tenant_id,
        "warmup_week": warmup_cfg.week,
        "delay_min_s": warmup_cfg.delay_min,
        "delay_max_s": warmup_cfg.delay_max,
        "updated_at":  now_iso,
    }
    # Set warmup_started_at only on first call for new numbers
    if cfg_data.get("is_new_number") and not cfg_data.get("warmup_started_at"):
        update["warmup_started_at"] = now_iso

    db.table("tenant_whatsapp_config").upsert(
        update, on_conflict="tenant_id"
    ).execute()

    return WarmupApplyResponse(
        warmup_week=warmup_cfg.week,
        delay_min_s=warmup_cfg.delay_min,
        delay_max_s=warmup_cfg.delay_max,
        msg_limit=warmup_cfg.msg_limit,
    )


# ── GET /health/today ─────────────────────────────────────────────────────────

@router.get("/health/today", response_model=HealthResponse, status_code=status.HTTP_200_OK)
async def health_today(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> HealthResponse:
    """
    Compute today's health metrics from whatsapp_messages_log and
    tenant_whatsapp_config, then upsert into whatsapp_health_metrics.
    Returns the computed metrics.
    """
    jwt = credentials.credentials
    db  = _supabase()
    tenant_id = await _resolve_tenant(jwt, db)

    today = datetime.now(timezone.utc).date()
    today_str = today.isoformat()

    # Load connection config (warmup, delays, status)
    cfg_row = (
        db.table("tenant_whatsapp_config")
        .select("status, is_new_number, connected_at, warmup_started_at, warmup_week, delay_min_s, delay_max_s")
        .eq("tenant_id", tenant_id)
        .single()
        .execute()
    )
    cfg = cfg_row.data or {}

    def _parse_dt(val: str | None) -> datetime | None:
        if not val:
            return None
        try:
            return datetime.fromisoformat(val.replace("Z", "+00:00"))
        except ValueError:
            return None

    warmup_cfg = compute_warmup_config(
        is_new_number=cfg.get("is_new_number", False),
        connected_at=_parse_dt(cfg.get("connected_at")),
        warmup_started_at=_parse_dt(cfg.get("warmup_started_at")),
    )

    # Query today's messages from whatsapp_messages_log
    start_of_day = f"{today_str}T00:00:00+00:00"
    end_of_day   = f"{today_str}T23:59:59+00:00"

    msgs_row = (
        db.table("whatsapp_messages_log")
        .select("direction, status")
        .eq("tenant_id", tenant_id)
        .gte("timestamp", start_of_day)
        .lte("timestamp", end_of_day)
        .execute()
    )
    messages = msgs_row.data or []

    msgs_sent     = sum(1 for m in messages if m.get("direction") == "outbound")
    msgs_received = sum(1 for m in messages if m.get("direction") == "inbound")
    block_count   = sum(1 for m in messages if m.get("status") == "blocked")

    # Delivery and response rates
    delivered   = sum(1 for m in messages if m.get("direction") == "outbound" and m.get("status") in ("delivered", "read"))
    delivery_rate = round(delivered / msgs_sent * 100, 1) if msgs_sent else None
    response_rate = round(msgs_received / msgs_sent * 100, 1) if msgs_sent else None

    msgs_limit_hit = (
        warmup_cfg.msg_limit != -1 and msgs_sent >= warmup_cfg.msg_limit
    )

    score = compute_health_score(
        status=cfg.get("status", "disconnected"),
        warmup_cfg=warmup_cfg,
        block_count=block_count,
        msgs_sent=msgs_sent,
        msg_limit=warmup_cfg.msg_limit,
    )

    # Upsert into whatsapp_health_metrics
    db.table("whatsapp_health_metrics").upsert(
        {
            "tenant_id":       tenant_id,
            "date":            today_str,
            "msgs_sent":       msgs_sent,
            "msgs_received":   msgs_received,
            "block_count":     block_count,
            "delivery_rate":   delivery_rate,
            "response_rate":   response_rate,
            "health_score":    score,
            "warmup_week":     warmup_cfg.week,
            "msgs_limit_hit":  msgs_limit_hit,
        },
        on_conflict="tenant_id,date",
    ).execute()

    return HealthResponse(
        date=today_str,
        health_score=score,
        warmup_week=warmup_cfg.week,
        msgs_sent=msgs_sent,
        msgs_received=msgs_received,
        block_count=block_count,
        msgs_limit_hit=msgs_limit_hit,
    )
