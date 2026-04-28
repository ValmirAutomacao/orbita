"""
POST /api/v1/whatsapp/provision

Creates a Uazapi instance for the authenticated tenant using the admintoken
(server-side only — never exposed to the frontend).

Naming rule: {niche}_{business_name_slug}   (PRD-v3 §4.2.2)
  e.g. "barbearia_barber_club"  (lowercase, underscores, ASCII-only)
"""

import os
import re
import unicodedata

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from supabase import Client, create_client

router = APIRouter()
bearer_scheme = HTTPBearer()

# ── Env vars ──────────────────────────────────────────────────────────────────

SUPABASE_URL        = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
UAZAPI_BASE         = os.environ.get("UAZAPI_BASE_URL", "https://uazapi.dev")
UAZAPI_ADMINTOKEN   = os.environ["UAZAPI_ADMINTOKEN"]
SYSTEM_NAME         = os.environ.get("UAZAPI_SYSTEM_NAME", "Pulseo")

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
    token:        str
    instanceId:   str
    instanceName: str


# ── Endpoint ──────────────────────────────────────────────────────────────────

@router.post("/provision", response_model=ProvisionResponse, status_code=status.HTTP_200_OK)
async def provision(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> ProvisionResponse:
    jwt = credentials.credentials
    db  = _supabase()

    # 1. Validate JWT and resolve user ─────────────────────────────────────────
    user_resp = db.auth.get_user(jwt)
    if not user_resp or not user_resp.user:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado.")
    auth_user = user_resp.user

    # 2. Resolve tenant_id from public.users ──────────────────────────────────
    user_row = (
        db.table("users")
        .select("tenant_id")
        .eq("id", str(auth_user.id))
        .single()
        .execute()
    )
    if not user_row.data or not user_row.data.get("tenant_id"):
        raise HTTPException(status_code=400, detail="Tenant não encontrado para este usuário.")
    tenant_id: str = user_row.data["tenant_id"]

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
            token=existing["whatsapp_token"],
            instanceId=existing["whatsapp_instance_id"],
            instanceName=existing["whatsapp_instance_name"],
        )

    # 6. Create instance on Uazapi (admintoken — server-side only) ─────────────
    api_base_url = os.environ.get("API_PUBLIC_URL", "https://api.pulseo.pt")
    inst_token: str
    inst_id: str

    async with httpx.AsyncClient(timeout=20) as client:
        # 6a. Create instance
        create_resp = await client.post(
            f"{UAZAPI_BASE}/instance/create",
            headers={"admintoken": UAZAPI_ADMINTOKEN, "Content-Type": "application/json"},
            json={"name": instance_name, "systemName": SYSTEM_NAME},
        )
        if create_resp.status_code not in (200, 201):
            raise HTTPException(
                status_code=502,
                detail=f"Uazapi recusou a criação da instância: {create_resp.text[:200]}",
            )
        uazapi_data = create_resp.json()
        instance    = uazapi_data.get("instance", {})
        # Support both response shapes (instancia_uazapi.md §3 vs §4)
        inst_id    = instance.get("id") or instance.get("instanceId", "")
        inst_token = instance.get("token", "")

        if not inst_token:
            raise HTTPException(status_code=502, detail="Uazapi não retornou token.")

        inst_headers = {"token": inst_token, "Content-Type": "application/json"}

        # 6b. Configure webhook (PRD-v3 §4.2.1 passo 2) ──────────────────────
        await client.post(
            f"{UAZAPI_BASE}/webhook",
            headers=inst_headers,
            json={
                "url": f"{api_base_url}/webhook/whatsapp/{tenant_id}",
                "events": ["connection", "messages", "messages_update", "chats", "call"],
            },
        )

        # 6c. Configure anti-ban delay (PRD-v3 §4.2.1 passo 3) ───────────────
        # Default: assume number is new (conservative). Frontend updates later
        # if is_new_number == False via PATCH /api/v1/whatsapp/delay-settings.
        await client.post(
            f"{UAZAPI_BASE}/instance/updateDelaySettings",
            headers=inst_headers,
            json={"msg_delay_min": 5, "msg_delay_max": 12},
        )

        # 6d. Configure privacy (PRD-v3 §4.2.1 passo 4) ──────────────────────
        await client.post(
            f"{UAZAPI_BASE}/instance/privacy",
            headers=inst_headers,
            json={
                "groupadd":     "contacts",
                "last":         "contacts",
                "online":       "contacts",
                "profile":      "contacts",
                "readreceipts": "all",
                "calladd":      "known",
            },
        )

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
        token=inst_token,
        instanceId=inst_id,
        instanceName=instance_name,
    )
