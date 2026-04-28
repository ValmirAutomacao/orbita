/**
 * @file supabase.ts
 * @description Cliente Supabase configurado para multi-tenancy via RLS (ADR-002).
 *
 * IMPORTANTE (ADR-002):
 * - Toda query filtra `tenant_id` implicitamente via RLS policy no PostgreSQL.
 * - NUNCA fazer queries cross-tenant sem usar `service_role` explicitamente.
 * - `audit_log` não possui RLS — acesso exclusivo via `service_role`.
 * - Dados de saúde (P2) ficam no schema `health_data` com o mesmo padrão RLS.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Validação de variáveis de ambiente
// ---------------------------------------------------------------------------

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[Pulseo] Variáveis de ambiente ausentes: VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias. ' +
    'Copie .env.example para .env.local e preencha os valores.'
  );
}

// ---------------------------------------------------------------------------
// Tipos — Database (referência: docs/architecture/database-schema.md)
// ---------------------------------------------------------------------------

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          name: string;
          slug: string;
          plan_id: string | null;
          nicho: string | null;
          status: 'active' | 'suspended' | 'trial';
          country: 'PT' | 'BR';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['tenants']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['tenants']['Insert']>;
      };
      users: {
        Row: {
          id: string;
          tenant_id: string;
          role: 'admin' | 'gestor' | 'profissional' | 'superadmin';
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: 'admin' | 'gestor' | 'profissional' | 'superadmin';
      tenant_status: 'active' | 'suspended' | 'trial';
      country_code: 'PT' | 'BR';
    };
  };
}

// ---------------------------------------------------------------------------
// Cliente Supabase — singleton
// ---------------------------------------------------------------------------

export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      /**
       * Persiste a sessão no localStorage para que o `tenant_id` do JWT
       * esteja disponível mesmo após refresh da página.
       */
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: {
        'x-app-name': 'pulseo-frontend',
      },
    },
  }
);

// ---------------------------------------------------------------------------
// Utilitários de tenant_id (ADR-002)
// ---------------------------------------------------------------------------

/**
 * Extrai o `tenant_id` do JWT claim do usuário autenticado.
 *
 * O Supabase injeta claims customizados via `auth.jwt()` no PostgreSQL,
 * o que permite que as RLS policies filtrem por `tenant_id` automaticamente.
 *
 * Prioridade de leitura:
 * 1. `app_metadata.tenant_id` — definido pelo backend/trigger no signup.
 * 2. `user_metadata.tenant_id` — fallback se o app_metadata ainda não foi propagado.
 */
export function getTenantId(
  user: { app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> } | null
): string | null {
  if (!user) return null;
  return (
    (user.app_metadata?.tenant_id as string | undefined) ??
    (user.user_metadata?.tenant_id as string | undefined) ??
    null
  );
}

/**
 * Cria um cliente Supabase com `service_role` para operações administrativas
 * (Superadmin / Edge Functions). NÃO usar no frontend de produção — apenas
 * em edge functions ou backend com variáveis de ambiente seguras (ADR-002).
 *
 * @throws {Error} Se VITE_SUPABASE_SERVICE_ROLE_KEY não estiver definida.
 */
export function createServiceRoleClient(): SupabaseClient<Database> {
  const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      '[Pulseo] VITE_SUPABASE_SERVICE_ROLE_KEY não definida. ' +
      'Esta função é exclusiva para operações de Superadmin em ambiente seguro.'
    );
  }
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
