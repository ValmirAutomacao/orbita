-- ============================================================
-- PULSEO — Auth Foundation v1
-- PRD-v2 §3.2 (Multi-Tenant) + §3.3 (DB Schema) + §13 (Segurança)
-- ============================================================

-- ── 1. PLANS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.plans (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL UNIQUE,
  max_professionals INT  NOT NULL DEFAULT 1,   -- -1 = ilimitado
  max_appointments  INT  NOT NULL DEFAULT 200,  -- -1 = ilimitado
  price_eur         NUMERIC(10,2),
  price_brl         NUMERIC(10,2),
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.plans (name, max_professionals, max_appointments, price_eur, price_brl) VALUES
  ('starter',        1,    200,  9.90,  29.90),
  ('business',      10,  10000, 29.90,  79.90),
  ('professional',  -1,     -1, 69.90, 179.90),
  ('enterprise',    -1,     -1,  NULL,   NULL)
ON CONFLICT (name) DO NOTHING;

-- ── 2. TENANTS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tenants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT NOT NULL UNIQUE,
  business_name TEXT NOT NULL,
  niche         TEXT NOT NULL DEFAULT 'other'
                  CHECK (niche IN (
                    'barbershop','salon','clinic','aesthetic',
                    'nutrition','physiotherapy','psychology','training','other'
                  )),
  plan_id       UUID REFERENCES public.plans(id),
  country       TEXT NOT NULL DEFAULT 'PT' CHECK (country IN ('PT','BR')),
  phone         TEXT,
  logo_url      TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  trial_ends_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 3. TENANT_SETTINGS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tenant_settings (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID NOT NULL UNIQUE REFERENCES public.tenants(id) ON DELETE CASCADE,
  business_hours            JSONB NOT NULL DEFAULT '{}',
  payment_methods           JSONB NOT NULL DEFAULT '{"cash":true,"pix":false,"card":false,"mbway":false,"multibanco":false}',
  whatsapp_number           TEXT,
  whatsapp_msg_template     TEXT DEFAULT 'Agendamento confirmado!
Cliente: {name}
Serviço: {service}
Data: {date}
Horário: {time}',
  whatsapp_notify_on_status BOOLEAN NOT NULL DEFAULT FALSE,
  -- Tutorial — gerenciado pelo Superadmin (PRD §9.4)
  tutorial_completed        BOOLEAN NOT NULL DEFAULT FALSE,
  tutorial_step             INT     NOT NULL DEFAULT 0,
  tutorial_video_barbershop TEXT,
  tutorial_video_salon      TEXT,
  tutorial_video_clinic     TEXT,
  tutorial_video_aesthetic  TEXT,
  address                   JSONB NOT NULL DEFAULT '{}',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 4. ROLES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.roles (
  id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE
);

INSERT INTO public.roles (name) VALUES
  ('superadmin'), ('admin'), ('manager'),
  ('professional'), ('professional_clinic'), ('lead')
ON CONFLICT (name) DO NOTHING;

-- ── 5. USERS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id  UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  role_id    UUID REFERENCES public.roles(id),
  full_name  TEXT,
  phone      TEXT,
  avatar_url TEXT,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 6. AUDIT LOG (append-only — PRD §13) ──────────────────
CREATE TABLE IF NOT EXISTS public.audit_log (
  id         BIGSERIAL PRIMARY KEY,
  tenant_id  UUID,
  user_id    UUID,
  action     TEXT NOT NULL,
  resource   TEXT,
  metadata   JSONB DEFAULT '{}',
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 7. ÍNDICES ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_tenant    ON public.users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_role      ON public.users(role_id);
CREATE INDEX IF NOT EXISTS idx_tenants_slug    ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_active  ON public.tenants(is_active);
CREATE INDEX IF NOT EXISTS idx_audit_tenant    ON public.audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_created   ON public.audit_log(created_at DESC);

-- ── 8. RLS ─────────────────────────────────────────────────
ALTER TABLE public.tenants         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles           ENABLE ROW LEVEL SECURITY;

-- Helpers: leem JWT claims injetados pelo backend (tenant_id, user_role)
CREATE OR REPLACE FUNCTION public.jwt_tenant_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT NULLIF((current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id'), '')::UUID;
$$;

CREATE OR REPLACE FUNCTION public.jwt_user_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT NULLIF((current_setting('request.jwt.claims', true)::jsonb ->> 'user_role'), '')::TEXT;
$$;

-- PLANS: leitura pública para autenticados
CREATE POLICY "plans_select" ON public.plans FOR SELECT TO authenticated USING (true);

-- ROLES: leitura pública para autenticados
CREATE POLICY "roles_select" ON public.roles FOR SELECT TO authenticated USING (true);

-- TENANTS: isolamento por tenant + superadmin override
CREATE POLICY "tenants_own"        ON public.tenants FOR ALL TO authenticated
  USING (id = public.jwt_tenant_id()) WITH CHECK (id = public.jwt_tenant_id());
CREATE POLICY "tenants_superadmin" ON public.tenants FOR ALL TO authenticated
  USING (public.jwt_user_role() = 'superadmin');

-- TENANT_SETTINGS: isolamento por tenant
CREATE POLICY "settings_own" ON public.tenant_settings FOR ALL TO authenticated
  USING (tenant_id = public.jwt_tenant_id()) WITH CHECK (tenant_id = public.jwt_tenant_id());

-- USERS: ver usuários do mesmo tenant
CREATE POLICY "users_tenant_select" ON public.users FOR SELECT TO authenticated
  USING (tenant_id = public.jwt_tenant_id());
-- Usuário edita próprio perfil
CREATE POLICY "users_self_update" ON public.users FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
-- Admin gerencia usuários do tenant
CREATE POLICY "users_admin_all" ON public.users FOR ALL TO authenticated
  USING (tenant_id = public.jwt_tenant_id() AND public.jwt_user_role() IN ('admin','superadmin'))
  WITH CHECK (tenant_id = public.jwt_tenant_id());

-- AUDIT LOG: admin lê, service_role insere
CREATE POLICY "audit_admin_read" ON public.audit_log FOR SELECT TO authenticated
  USING (tenant_id = public.jwt_tenant_id() AND public.jwt_user_role() IN ('admin','superadmin'));
CREATE POLICY "audit_service_insert" ON public.audit_log FOR INSERT TO service_role WITH CHECK (true);

-- ── 9. TRIGGERS ────────────────────────────────────────────

-- Sincronizar auth.users → public.users (novo cadastro)
CREATE OR REPLACE FUNCTION public.on_auth_user_created()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_role UUID;
BEGIN
  SELECT id INTO v_role FROM public.roles WHERE name = 'admin' LIMIT 1;
  INSERT INTO public.users (id, full_name, role_id)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)), v_role)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_new_auth_user
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.on_auth_user_created();

-- Auto updated_at
CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_tenants_updated_at
  BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE TRIGGER trg_settings_updated_at
  BEFORE UPDATE ON public.tenant_settings FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
