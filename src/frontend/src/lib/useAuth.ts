import { useEffect, useState, useCallback } from 'react';
import type { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase, getTenantId } from './supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type UserRole = 'superadmin' | 'admin' | 'gestor' | 'profissional';

export interface AuthState {
  session: Session | null;
  user: User | null;
  tenantId: string | null;
  role: UserRole | null;
  loading: boolean;
  error: AuthError | null;
}

// ---------------------------------------------------------------------------
// useAuth
// ---------------------------------------------------------------------------

/**
 * Hook central de autenticação do Pulseo.
 *
 * Expõe sessão, usuário, tenant_id (via JWT claim — ADR-002) e role.
 * Escuta mudanças de sessão em tempo real via `onAuthStateChange`.
 *
 * Uso:
 *   const { user, tenantId, role, loading, signIn, signOut } = useAuth();
 */
export function useAuth() {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    tenantId: null,
    role: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Carrega sessão existente ao montar
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState(prev => ({
        ...prev,
        session,
        user: session?.user ?? null,
        tenantId: getTenantId(session?.user ?? null),
        role: (session?.user?.app_metadata?.role as UserRole) ?? null,
        loading: false,
      }));
    });

    // Escuta mudanças de sessão (login, logout, refresh de token)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null,
          tenantId: getTenantId(session?.user ?? null),
          role: (session?.user?.app_metadata?.role as UserRole) ?? null,
          loading: false,
          error: null,
        }));
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const signIn = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setState(prev => ({ ...prev, loading: false, error }));
    // em caso de sucesso, onAuthStateChange atualiza o estado automaticamente
  }, []);

  const signUp = useCallback(async (
    email: string,
    password: string,
    metadata: { full_name: string; business_name: string; nicho: string; country: 'PT' | 'BR' }
  ) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) setState(prev => ({ ...prev, loading: false, error }));
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
  }, []);

  // ---------------------------------------------------------------------------
  // Guards (ADR-002 — nunca expor dados de outro tenant)
  // ---------------------------------------------------------------------------

  /** Retorna true se o usuário está autenticado e tem tenant_id no JWT. */
  const isAuthenticated = state.user !== null && state.tenantId !== null;

  /** Retorna true se o usuário tem role igual ou superior ao exigido. */
  const hasRole = useCallback((required: UserRole): boolean => {
    const hierarchy: Record<UserRole, number> = {
      superadmin: 4,
      admin: 3,
      gestor: 2,
      profissional: 1,
    };
    if (!state.role) return false;
    return (hierarchy[state.role] ?? 0) >= (hierarchy[required] ?? 0);
  }, [state.role]);

  return {
    ...state,
    isAuthenticated,
    signIn,
    signUp,
    signOut,
    resetPassword,
    hasRole,
  };
}
