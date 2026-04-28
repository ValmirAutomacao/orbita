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
        token=inst_token,
        instanceId=inst_id,
        instanceName=instance_name,
    )
