-- ============================================================
-- PULSEO — WhatsApp Tables (Uazapi Multi-Tenant)
-- PRD-v3 §4.5 | EPIC-08 | BLOCO 1 [DB-01]
-- ============================================================

-- ── 1. TENANT_WHATSAPP_CONFIG ──────────────────────────────
-- Substitui as colunas whatsapp_* adicionadas em tenant_settings (002).
-- Uma linha por tenant; token e instance_id vêm do /provision backend.

CREATE TABLE IF NOT EXISTS public.tenant_whatsapp_config (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id              UUID NOT NULL UNIQUE REFERENCES public.tenants(id) ON DELETE CASCADE,

  -- Uazapi instance identifiers
  instance_id            TEXT,
  instance_name          TEXT,
  instance_token         TEXT,          -- secret — nunca expor no frontend

  -- Connection state
  status                 TEXT NOT NULL DEFAULT 'disconnected'
                           CHECK (status IN ('disconnected','connecting','connected','banned','error')),
  phone_number           TEXT,          -- E.164 format (+351912345678)
  is_business            BOOLEAN,
  profile_name           TEXT,
  owner_jid              TEXT,          -- WA JID retornado pelo /instance/status

  -- Number metadata
  confirmed_business     BOOLEAN NOT NULL DEFAULT FALSE,  -- checkbox obrigatório do wizard
  is_new_number          BOOLEAN NOT NULL DEFAULT FALSE,  -- número < 30 dias

  -- Warmup protocol (PRD-v3 §4.3.2)
  warmup_started_at      TIMESTAMPTZ,
  warmup_week            SMALLINT NOT NULL DEFAULT 0,     -- 0 = sem aquecimento
  warmup_msgs_today      INT      NOT NULL DEFAULT 0,

  -- Anti-ban settings (PRD-v3 §4.3.1)
  delay_min_s            SMALLINT NOT NULL DEFAULT 5,
  delay_max_s            SMALLINT NOT NULL DEFAULT 12,

  -- Proxy
  proxy_enabled          BOOLEAN NOT NULL DEFAULT FALSE,
  proxy_url              TEXT,

  -- Webhook
  webhook_url            TEXT,
  webhook_configured_at  TIMESTAMPTZ,

  -- Lifecycle
  connected_at           TIMESTAMPTZ,
  last_disconnect_at     TIMESTAMPTZ,
  last_disconnect_reason TEXT,

  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_twc_tenant     ON public.tenant_whatsapp_config(tenant_id);
CREATE INDEX IF NOT EXISTS idx_twc_status     ON public.tenant_whatsapp_config(status);
CREATE INDEX IF NOT EXISTS idx_twc_instance   ON public.tenant_whatsapp_config(instance_id);

-- ── 2. WHATSAPP_MESSAGES_LOG ───────────────────────────────
-- Append-only log de todas as mensagens enviadas e recebidas.

CREATE TABLE IF NOT EXISTS public.whatsapp_messages_log (
  id               BIGSERIAL PRIMARY KEY,
  tenant_id        UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  client_id        UUID,                -- FK para clients — pode ser NULL (número desconhecido)

  -- Message identity
  message_id       TEXT NOT NULL,       -- ID retornado pela Uazapi
  direction        TEXT NOT NULL CHECK (direction IN ('inbound','outbound')),

  -- Parties
  from_phone       TEXT NOT NULL,       -- E.164
  to_phone         TEXT NOT NULL,       -- E.164

  -- Content
  type             TEXT NOT NULL DEFAULT 'text'
                     CHECK (type IN ('text','image','video','audio','document','sticker','location','interactive','other')),
  content          TEXT,
  media_url        TEXT,

  -- Delivery tracking
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','sent','delivered','read','failed','blocked')),

  -- Source tracing (PRD-v3 §4.4 — campanha, agendamento, lembrete, etc.)
  track_source     TEXT,                -- 'appointment_confirm' | 'reminder_24h' | 'campaign' | ...
  track_id         UUID,               -- ID do agendamento, campanha, etc.

  -- Opt-out flag (processado pelo webhook handler)
  triggered_optout BOOLEAN NOT NULL DEFAULT FALSE,

  timestamp        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_wml_tenant_msgid UNIQUE (tenant_id, message_id)
);

CREATE INDEX IF NOT EXISTS idx_wml_tenant        ON public.whatsapp_messages_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_wml_client        ON public.whatsapp_messages_log(client_id);
CREATE INDEX IF NOT EXISTS idx_wml_timestamp     ON public.whatsapp_messages_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_wml_direction     ON public.whatsapp_messages_log(tenant_id, direction);
CREATE INDEX IF NOT EXISTS idx_wml_track         ON public.whatsapp_messages_log(track_source, track_id);

-- ── 3. WHATSAPP_OPTOUT ─────────────────────────────────────
-- Números que pediram para não receber mensagens (GDPR/LGPD).

CREATE TABLE IF NOT EXISTS public.whatsapp_optout (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  phone          TEXT NOT NULL,          -- E.164
  opted_out_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  keyword_used   TEXT,                   -- palavra-chave que disparou o opt-out
  reactivated_at TIMESTAMPTZ,            -- se o número voltou a optar-in

  CONSTRAINT uq_optout_tenant_phone UNIQUE (tenant_id, phone)
);

CREATE INDEX IF NOT EXISTS idx_optout_tenant ON public.whatsapp_optout(tenant_id);
CREATE INDEX IF NOT EXISTS idx_optout_phone  ON public.whatsapp_optout(tenant_id, phone);

-- ── 4. WHATSAPP_HEALTH_METRICS ─────────────────────────────
-- Snapshot diário de saúde por instância (gravado pelo Celery Beat).

CREATE TABLE IF NOT EXISTS public.whatsapp_health_metrics (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  date              DATE NOT NULL,

  msgs_sent         INT NOT NULL DEFAULT 0,
  msgs_received     INT NOT NULL DEFAULT 0,
  unique_recipients INT NOT NULL DEFAULT 0,
  block_count       INT NOT NULL DEFAULT 0,
  response_rate     NUMERIC(5,2),        -- % de mensagens que tiveram resposta
  delivery_rate     NUMERIC(5,2),        -- % de mensagens entregues
  health_score      NUMERIC(5,2),        -- 0–100 calculado pelo backend

  warmup_week       SMALLINT NOT NULL DEFAULT 0,
  msgs_limit_hit    BOOLEAN NOT NULL DEFAULT FALSE,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_whm_tenant_date UNIQUE (tenant_id, date)
);

CREATE INDEX IF NOT EXISTS idx_whm_tenant ON public.whatsapp_health_metrics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_whm_date   ON public.whatsapp_health_metrics(date DESC);

-- ── 5. RLS ─────────────────────────────────────────────────

ALTER TABLE public.tenant_whatsapp_config  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages_log   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_optout         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_health_metrics ENABLE ROW LEVEL SECURITY;

-- tenant_whatsapp_config: isolamento por tenant
CREATE POLICY "twc_tenant_all" ON public.tenant_whatsapp_config
  FOR ALL TO authenticated
  USING  (tenant_id = public.jwt_tenant_id())
  WITH CHECK (tenant_id = public.jwt_tenant_id());

CREATE POLICY "twc_superadmin" ON public.tenant_whatsapp_config
  FOR ALL TO authenticated
  USING (public.jwt_user_role() = 'superadmin');

-- service_role não tem restrição (backend usa service_role)
CREATE POLICY "twc_service_all" ON public.tenant_whatsapp_config
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- whatsapp_messages_log: tenant lê, service_role insere
CREATE POLICY "wml_tenant_select" ON public.whatsapp_messages_log
  FOR SELECT TO authenticated
  USING (tenant_id = public.jwt_tenant_id());

CREATE POLICY "wml_service_all" ON public.whatsapp_messages_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- whatsapp_optout: tenant gerencia os seus
CREATE POLICY "optout_tenant_all" ON public.whatsapp_optout
  FOR ALL TO authenticated
  USING  (tenant_id = public.jwt_tenant_id())
  WITH CHECK (tenant_id = public.jwt_tenant_id());

CREATE POLICY "optout_service_all" ON public.whatsapp_optout
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- whatsapp_health_metrics: tenant lê, service_role escreve
CREATE POLICY "whm_tenant_select" ON public.whatsapp_health_metrics
  FOR SELECT TO authenticated
  USING (tenant_id = public.jwt_tenant_id());

CREATE POLICY "whm_service_all" ON public.whatsapp_health_metrics
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── 6. TRIGGERS — updated_at ───────────────────────────────

CREATE TRIGGER trg_twc_updated_at
  BEFORE UPDATE ON public.tenant_whatsapp_config
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- ── 7. MIGRAR dados existentes de tenant_settings ──────────
-- Move token e instance_id já gravados pela migration 002 para a nova tabela.
-- Executa apenas se as colunas ainda existirem (idempotente).

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'tenant_settings'
      AND column_name  = 'whatsapp_token'
  ) THEN
    INSERT INTO public.tenant_whatsapp_config
      (tenant_id, instance_id, instance_name, instance_token, status, connected_at)
    SELECT
      tenant_id,
      whatsapp_instance_id,
      whatsapp_instance_name,
      whatsapp_token,
      CASE WHEN whatsapp_token IS NOT NULL THEN 'connected' ELSE 'disconnected' END,
      whatsapp_connected_at
    FROM public.tenant_settings
    WHERE whatsapp_token IS NOT NULL
    ON CONFLICT (tenant_id) DO NOTHING;

    ALTER TABLE public.tenant_settings
      DROP COLUMN IF EXISTS whatsapp_instance_id,
      DROP COLUMN IF EXISTS whatsapp_instance_name,
      DROP COLUMN IF EXISTS whatsapp_token,
      DROP COLUMN IF EXISTS whatsapp_connected_at;
  END IF;
END;
$$;
