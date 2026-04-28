/**
 * Uazapi v2 — frontend service.
 *
 * All Uazapi calls are proxied through the Pulseo backend (JWT auth).
 * The Uazapi instance token and admintoken never leave the server.
 */

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api/v1';

function authHeaders(jwt: string): HeadersInit {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` };
}

async function checkOk(res: Response, context: string): Promise<Response> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { detail?: string }).detail ?? `${context}: ${res.status}`);
  }
  return res;
}

// ── Shared types ─────────────────────────────────────────────────────────────

// ── Types ─────────────────────────────────────────────────────────────────────

export type InstanceStatus =
  | 'connecting'   // waiting for QR scan
  | 'connected'    // paired successfully
  | 'disconnected' // logged out or banned
  | 'qrExpired';   // QR timed out — must call connectInstance again

export interface ProvisionResponse {
  instanceId:   string;
  instanceName: string;
}

export interface ConnectResponse {
  /** Data URI ready for <img src>: "data:image/png;base64,..." */
  qrcode: string;
}

export interface StatusResponse {
  status:      InstanceStatus;
  profileName?: string;
  isBusiness?:  boolean;
  ownerJid?:    string;
}

// ── API calls (all go to Pulseo backend — Uazapi token stays server-side) ────

/** Provision (or retrieve existing) Uazapi instance for the authenticated tenant. */
export async function provisionInstance(jwt: string): Promise<ProvisionResponse> {
  const res = await fetch(`${API_BASE}/whatsapp/provision`, {
    method: 'POST',
    headers: authHeaders(jwt),
  });
  await checkOk(res, 'provision');
  return res.json() as Promise<ProvisionResponse>;
}

/** Request QR Code from Uazapi via backend proxy. */
export async function connectInstance(jwt: string): Promise<ConnectResponse> {
  const res = await fetch(`${API_BASE}/whatsapp/connect`, {
    method: 'POST',
    headers: authHeaders(jwt),
  });
  await checkOk(res, 'connect');
  return res.json() as Promise<ConnectResponse>;
}

/** Poll Uazapi connection status via backend proxy. */
export async function getInstanceStatus(jwt: string): Promise<StatusResponse> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/whatsapp/status`, { headers: authHeaders(jwt) });
  } catch {
    throw new Error('Backend unreachable');
  }
  if (!res.ok) return { status: 'qrExpired' };
  return res.json() as Promise<StatusResponse>;
}
