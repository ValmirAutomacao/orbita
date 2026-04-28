-- ============================================================
-- PULSEO — WhatsApp / Uazapi Config columns
-- EPIC-08 STORY-01.2 — provision endpoint
-- ============================================================

ALTER TABLE public.tenant_settings
  ADD COLUMN IF NOT EXISTS whatsapp_instance_id   TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_instance_name TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_token         TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_connected_at  TIMESTAMPTZ;

-- Index for quick lookup by backend
CREATE INDEX IF NOT EXISTS idx_tenant_settings_waid
  ON public.tenant_settings(tenant_id)
  WHERE whatsapp_token IS NOT NULL;
