-- ============================================================
-- PULSEO — Core Business Tables
-- PRD-v3 §3.3 | EPIC-02 (Agenda) + EPIC-03 (Financeiro) | BLOCO 1 [DB-02]
-- ============================================================

-- ── 1. SERVICE_CATEGORIES ──────────────────────────────────
-- Categorias de serviços por nicho (algumas partilhadas, outras específicas).

CREATE TABLE IF NOT EXISTS public.service_categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  color      TEXT,             -- hex para diferenciação visual no calendário
  sort_order SMALLINT NOT NULL DEFAULT 0,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_svccat_tenant_name UNIQUE (tenant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_svccat_tenant ON public.service_categories(tenant_id);

-- ── 2. SERVICES ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.services (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  category_id  UUID REFERENCES public.service_categories(id) ON DELETE SET NULL,

  name         TEXT NOT NULL,
  description  TEXT,
  duration_min SMALLINT NOT NULL DEFAULT 30 CHECK (duration_min > 0),
  price        NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (price >= 0),
  currency     TEXT NOT NULL DEFAULT 'EUR' CHECK (currency IN ('EUR','BRL')),

  -- Plan gate: false = feature locked (shown as blurred in UI)
  requires_plan TEXT DEFAULT NULL,  -- 'business' | 'professional' | NULL (todos)

  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  is_template  BOOLEAN NOT NULL DEFAULT FALSE,  -- templates sugeridos por nicho
  color        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_services_tenant   ON public.services(tenant_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON public.services(category_id);
CREATE INDEX IF NOT EXISTS idx_services_active   ON public.services(tenant_id, is_active);

-- ── 3. PROFESSIONALS ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.professionals (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES public.users(id) ON DELETE SET NULL,  -- conta de acesso opcional

  full_name    TEXT NOT NULL,
  email        TEXT,
  phone        TEXT,
  avatar_url   TEXT,

  -- Clinic-specific fields (P2 — EPIC-11)
  specialty    TEXT,           -- CRM/CRO ou especialidade clínica
  license_no   TEXT,           -- número de cédula profissional

  -- Scheduling
  color        TEXT,           -- cor no calendário
  work_hours   JSONB NOT NULL DEFAULT '{}',  -- { "mon": {"start":"09:00","end":"18:00"}, ... }

  -- Plan gate
  commission_pct NUMERIC(5,2) DEFAULT NULL,  -- NULL = plano Starter (bloqueado)

  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prof_tenant  ON public.professionals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_prof_user    ON public.professionals(user_id);
CREATE INDEX IF NOT EXISTS idx_prof_active  ON public.professionals(tenant_id, is_active);

-- ── 4. PROFESSIONAL_SERVICES (junction N:M) ─────────────────

CREATE TABLE IF NOT EXISTS public.professional_services (
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  service_id      UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

  PRIMARY KEY (professional_id, service_id)
);

CREATE INDEX IF NOT EXISTS idx_profsvc_prof    ON public.professional_services(professional_id);
CREATE INDEX IF NOT EXISTS idx_profsvc_service ON public.professional_services(service_id);
CREATE INDEX IF NOT EXISTS idx_profsvc_tenant  ON public.professional_services(tenant_id);

-- ── 5. CLIENTS ─────────────────────────────────────────────
-- Clientes/leads vinculados ao tenant (não têm conta Supabase Auth por padrão).

CREATE TABLE IF NOT EXISTS public.clients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

  full_name       TEXT NOT NULL,
  email           TEXT,
  phone           TEXT,           -- E.164 (usado para WhatsApp)
  birth_date      DATE,
  gender          TEXT CHECK (gender IN ('M','F','NB','prefer_not')),
  notes           TEXT,           -- observações internas

  -- WhatsApp opt-in
  whatsapp_optin  BOOLEAN NOT NULL DEFAULT TRUE,

  -- Loyalty
  loyalty_points  INT NOT NULL DEFAULT 0,

  -- Acquisition
  source          TEXT,           -- 'wizard' | 'public_booking' | 'manual' | 'import'

  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_tenant  ON public.clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_clients_phone   ON public.clients(tenant_id, phone);
CREATE INDEX IF NOT EXISTS idx_clients_email   ON public.clients(tenant_id, email);
CREATE INDEX IF NOT EXISTS idx_clients_active  ON public.clients(tenant_id, is_active);

-- ── 6. APPOINTMENTS ────────────────────────────────────────
-- Tabela central do sistema (PRD-v3 §3.3).

CREATE TABLE IF NOT EXISTS public.appointments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  client_id        UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  professional_id  UUID NOT NULL REFERENCES public.professionals(id) ON DELETE RESTRICT,
  service_id       UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,

  -- Scheduling
  starts_at        TIMESTAMPTZ NOT NULL,
  ends_at          TIMESTAMPTZ NOT NULL,
  duration_min     SMALLINT NOT NULL,

  -- Status lifecycle
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','confirmed','in_progress','completed','cancelled','no_show')),
  cancelled_reason TEXT,
  cancelled_by     TEXT CHECK (cancelled_by IN ('client','admin','system')),

  -- Pricing snapshot (at booking time — services can change price later)
  price_snapshot   NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  currency         TEXT NOT NULL DEFAULT 'EUR',

  -- WhatsApp notifications
  wa_confirm_sent  BOOLEAN NOT NULL DEFAULT FALSE,
  wa_remind_24h    BOOLEAN NOT NULL DEFAULT FALSE,
  wa_remind_2h     BOOLEAN NOT NULL DEFAULT FALSE,
  wa_remind_30m    BOOLEAN NOT NULL DEFAULT FALSE,

  -- Source
  source           TEXT DEFAULT 'admin'
                     CHECK (source IN ('admin','public_booking','mobile','import')),

  notes            TEXT,

  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_appt_times CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_appt_tenant        ON public.appointments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_appt_client        ON public.appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appt_professional  ON public.appointments(professional_id);
CREATE INDEX IF NOT EXISTS idx_appt_starts        ON public.appointments(tenant_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_appt_status        ON public.appointments(tenant_id, status);
-- Para evitar double-booking: profissional sem sobreposição de horários
CREATE INDEX IF NOT EXISTS idx_appt_prof_time     ON public.appointments(professional_id, starts_at, ends_at);

-- ── 7. PAYMENTS ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  appointment_id  UUID NOT NULL REFERENCES public.appointments(id) ON DELETE RESTRICT,
  client_id       UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,

  amount          NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  currency        TEXT NOT NULL DEFAULT 'EUR',

  method          TEXT NOT NULL
                    CHECK (method IN ('cash','pix','card','mbway','multibanco','cielo','bank_transfer','other')),

  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','paid','refunded','failed','cancelled')),

  -- External payment references
  stripe_id       TEXT,
  pix_qr_code     TEXT,
  mb_ref          TEXT,         -- referência Multibanco

  paid_at         TIMESTAMPTZ,
  refunded_at     TIMESTAMPTZ,
  notes           TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pay_tenant      ON public.payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pay_appointment ON public.payments(appointment_id);
CREATE INDEX IF NOT EXISTS idx_pay_client      ON public.payments(client_id);
CREATE INDEX IF NOT EXISTS idx_pay_status      ON public.payments(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_pay_paid_at     ON public.payments(tenant_id, paid_at DESC);

-- ── 8. RLS ─────────────────────────────────────────────────

ALTER TABLE public.service_categories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments              ENABLE ROW LEVEL SECURITY;

-- Helper: verifica se o JWT pertence a um profissional do tenant
CREATE OR REPLACE FUNCTION public.jwt_professional_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT p.id
  FROM public.professionals p
  JOIN public.users u ON u.id = auth.uid()
  WHERE p.user_id = auth.uid()
    AND p.tenant_id = public.jwt_tenant_id()
  LIMIT 1;
$$;

-- SERVICE_CATEGORIES
CREATE POLICY "svccat_tenant_select" ON public.service_categories
  FOR SELECT TO authenticated USING (tenant_id = public.jwt_tenant_id());
CREATE POLICY "svccat_admin_write" ON public.service_categories
  FOR ALL TO authenticated
  USING  (tenant_id = public.jwt_tenant_id() AND public.jwt_user_role() IN ('admin','manager','superadmin'))
  WITH CHECK (tenant_id = public.jwt_tenant_id());
CREATE POLICY "svccat_service_all" ON public.service_categories
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- SERVICES
CREATE POLICY "svc_tenant_select" ON public.services
  FOR SELECT TO authenticated USING (tenant_id = public.jwt_tenant_id());
CREATE POLICY "svc_admin_write" ON public.services
  FOR ALL TO authenticated
  USING  (tenant_id = public.jwt_tenant_id() AND public.jwt_user_role() IN ('admin','manager','superadmin'))
  WITH CHECK (tenant_id = public.jwt_tenant_id());
CREATE POLICY "svc_service_all" ON public.services
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- PROFESSIONALS
CREATE POLICY "prof_tenant_select" ON public.professionals
  FOR SELECT TO authenticated USING (tenant_id = public.jwt_tenant_id());
CREATE POLICY "prof_admin_write" ON public.professionals
  FOR ALL TO authenticated
  USING  (tenant_id = public.jwt_tenant_id() AND public.jwt_user_role() IN ('admin','manager','superadmin'))
  WITH CHECK (tenant_id = public.jwt_tenant_id());
-- Profissional edita o próprio perfil
CREATE POLICY "prof_self_update" ON public.professionals
  FOR UPDATE TO authenticated
  USING  (user_id = auth.uid() AND tenant_id = public.jwt_tenant_id())
  WITH CHECK (user_id = auth.uid() AND tenant_id = public.jwt_tenant_id());
CREATE POLICY "prof_service_all" ON public.professionals
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- PROFESSIONAL_SERVICES
CREATE POLICY "profsvc_tenant_select" ON public.professional_services
  FOR SELECT TO authenticated USING (tenant_id = public.jwt_tenant_id());
CREATE POLICY "profsvc_admin_write" ON public.professional_services
  FOR ALL TO authenticated
  USING  (tenant_id = public.jwt_tenant_id() AND public.jwt_user_role() IN ('admin','manager','superadmin'))
  WITH CHECK (tenant_id = public.jwt_tenant_id());
CREATE POLICY "profsvc_service_all" ON public.professional_services
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- CLIENTS
CREATE POLICY "clients_tenant_select" ON public.clients
  FOR SELECT TO authenticated USING (tenant_id = public.jwt_tenant_id());
CREATE POLICY "clients_admin_write" ON public.clients
  FOR ALL TO authenticated
  USING  (tenant_id = public.jwt_tenant_id() AND public.jwt_user_role() IN ('admin','manager','superadmin'))
  WITH CHECK (tenant_id = public.jwt_tenant_id());
-- Profissional pode ver e criar clientes do tenant
CREATE POLICY "clients_prof_select" ON public.clients
  FOR SELECT TO authenticated
  USING (tenant_id = public.jwt_tenant_id() AND public.jwt_user_role() = 'professional');
CREATE POLICY "clients_prof_insert" ON public.clients
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.jwt_tenant_id() AND public.jwt_user_role() = 'professional');
CREATE POLICY "clients_service_all" ON public.clients
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- APPOINTMENTS
CREATE POLICY "appt_tenant_select" ON public.appointments
  FOR SELECT TO authenticated USING (tenant_id = public.jwt_tenant_id());
CREATE POLICY "appt_admin_write" ON public.appointments
  FOR ALL TO authenticated
  USING  (tenant_id = public.jwt_tenant_id() AND public.jwt_user_role() IN ('admin','manager','superadmin'))
  WITH CHECK (tenant_id = public.jwt_tenant_id());
-- Profissional vê e cria os próprios agendamentos
CREATE POLICY "appt_prof_own" ON public.appointments
  FOR SELECT TO authenticated
  USING (tenant_id = public.jwt_tenant_id() AND professional_id = public.jwt_professional_id());
CREATE POLICY "appt_prof_insert" ON public.appointments
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.jwt_tenant_id() AND public.jwt_user_role() = 'professional');
CREATE POLICY "appt_service_all" ON public.appointments
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- PAYMENTS
CREATE POLICY "pay_tenant_select" ON public.payments
  FOR SELECT TO authenticated USING (tenant_id = public.jwt_tenant_id());
CREATE POLICY "pay_admin_write" ON public.payments
  FOR ALL TO authenticated
  USING  (tenant_id = public.jwt_tenant_id() AND public.jwt_user_role() IN ('admin','manager','superadmin'))
  WITH CHECK (tenant_id = public.jwt_tenant_id());
CREATE POLICY "pay_service_all" ON public.payments
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── 9. TRIGGERS — updated_at ───────────────────────────────

CREATE TRIGGER trg_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE TRIGGER trg_professionals_updated_at
  BEFORE UPDATE ON public.professionals
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE TRIGGER trg_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE TRIGGER trg_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
