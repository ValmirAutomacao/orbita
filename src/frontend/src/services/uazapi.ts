/**
 * Uazapi v2 — frontend service (instance-scoped operations only).
 *
 * All calls that touch the Uazapi API directly require an instance `token`
 * obtained from the backend after POST /api/v1/whatsapp/provision
 * (admintoken — server-side only, never exposed here).
 *
 * Response envelope: { instance: { ... } } — see instancia_uazapi.md §3 and §4.
 */

const UAZAPI_BASE = (import.meta.env.VITE_UAZAPI_URL as string | undefined) ?? '';
const API_BASE    = (import.meta.env.VITE_API_URL    as string | undefined) ?? '/api/v1';

function instanceHeaders(token: string): HeadersInit {
  return { 'Content-Type': 'application/json', token };
}

// ── Shared types ─────────────────────────────────────────────────────────────

export type InstanceStatus =
  | 'connecting'   // waiting for QR scan
  | 'connected'    // paired successfully
  | 'disconnected' // logged out or banned
  | 'qrExpired';   // QR timed out — must call connectInstance again

// ── Backend provision response ────────────────────────────────────────────────

export interface ProvisionResponse {
  /** Uazapi instance token — use for all subsequent calls */
  token: string;
  /** Uazapi internal instance ID */
  instanceId: string;
  /** Sanitised instance name stored on Uazapi (e.g. "optus-clinica") */
  instanceName: string;
}

/**
 * Step 1 (frontend side) — calls the Pulseo backend which creates the Uazapi
 * instance server-side using the admintoken. Returns the instance token for use
 * in connectInstance() and getInstanceStatus().
 *
 * Requires a valid Supabase JWT in the Authorization header so the backend can
 * identify the tenant automatically.
 *
 * Throws if the backend returns a non-2xx response.
 */
export async function provisionInstance(supabaseJwt: string): Promise<ProvisionResponse> {
  const res = await fetch(`${API_BASE}/whatsapp/provision`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${supabaseJwt}`,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { detail?: string }).detail ??
      `Provision failed: ${res.status}`
    );
  }
  return res.json() as Promise<ProvisionResponse>;
}

// ── Connect — generates QR Code (Step 2, instancia_uazapi.md §4) ─────────────

/**
 * Shape returned by POST /instance/connect (instancia_uazapi.md §4):
 * {
 *   "instance": {
 *     "status": "connecting",
 *     "qrcode": "data:image/png;base64,..."
 *   }
 * }
 */
export interface ConnectResponse {
  /** Data URI ready for <img src>: "data:image/png;base64,..." */
  qrcode: string;
  status: 'connecting';
}

/**
 * Requests a QR Code for the given instance (instancia_uazapi.md §4).
 * Body is intentionally empty — omitting "phone" triggers QR mode (not SMS).
 * Throws if the instance does not exist or the token is invalid.
 */
export async function connectInstance(token: string): Promise<ConnectResponse> {
  const res = await fetch(`${UAZAPI_BASE}/instance/connect`, {
    method: 'POST',
    headers: instanceHeaders(token),
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    throw new Error(`Uazapi connect failed: ${res.status}`);
  }
  const body = await res.json() as {
    instance: { status: string; qrcode: string };
  };
  // Strict shape: { instance: { status: "connecting", qrcode: "data:image/png;base64,..." } }
  return {
    status: 'connecting',
    qrcode: body.instance.qrcode,
  };
}

// ── Status polling (instancia_uazapi.md §4 — Dica de Ouro — poll every 5 s) ──

/**
 * Shape returned by GET /instance/status (instancia_uazapi.md §4):
 * {
 *   "instance": {
 *     "status": "connected" | "connecting" | "disconnected"
 *   }
 * }
 */
export interface StatusResponse {
  status: InstanceStatus;
  /** Present only when status === "connected" */
  profileName?: string;
  isBusiness?: boolean;
  owner?: string;
}

/**
 * Returns current instance status (instancia_uazapi.md §4 — GET /instance/status).
 * When status reaches "connected", profileName / isBusiness / owner are populated.
 * When the QR Code window (~60 s) elapses without a scan, Uazapi returns a
 * non-2xx response — this function normalises that to status "qrExpired" so the
 * UI can show the "Gerar novo QR Code" button.
 */
export async function getInstanceStatus(token: string): Promise<StatusResponse> {
  let res: Response;
  try {
    res = await fetch(`${UAZAPI_BASE}/instance/status`, {
      headers: instanceHeaders(token),
    });
  } catch {
    // Network error — treat as transient, not expired
    throw new Error('Uazapi unreachable');
  }

  if (!res.ok) {
    // Non-2xx from Uazapi during QR window → QR has expired
    return { status: 'qrExpired' };
  }

  const body = await res.json() as {
    instance: {
      status: string;
      profileName?: string;
      isBusiness?: boolean;
      owner?: string;
    };
  };

  // Strict shape: { instance: { status: "connecting" | "connected" | ... } }
  const raw = body.instance;
  const status: InstanceStatus =
    raw.status === 'connected'    ? 'connected'    :
    raw.status === 'connecting'   ? 'connecting'   :
    raw.status === 'disconnected' ? 'disconnected' :
                                    'qrExpired';

  return {
    status,
    profileName: raw.profileName,
    isBusiness:  raw.isBusiness,
    owner:       raw.owner,
  };
}

// ── Anti-ban: delay settings ─────────────────────────────────────────────────

/**
 * Apply message delay to reduce ban risk.
 * "new"    → number < 30 days old: longer delays (5–12 s)
 * "warmed" → established number:   shorter delays (3–8 s)
 */
export async function applyDelaySettings(
  token: string,
  mode: 'new' | 'warmed'
): Promise<void> {
  const body =
    mode === 'new'
      ? { msg_delay_min: 5, msg_delay_max: 12 }
      : { msg_delay_min: 3, msg_delay_max: 8 };
  const res = await fetch(`${UAZAPI_BASE}/instance/updateDelaySettings`, {
    method: 'POST',
    headers: instanceHeaders(token),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Uazapi delay settings failed: ${res.status}`);
}

// ── Anti-ban: privacy defaults ───────────────────────────────────────────────

export async function applyPrivacyDefaults(token: string): Promise<void> {
  const res = await fetch(`${UAZAPI_BASE}/instance/privacy`, {
    method: 'POST',
    headers: instanceHeaders(token),
    body: JSON.stringify({
      groupadd:     'contacts',
      last:         'contacts',
      online:       'contacts',
      profile:      'contacts',
      readreceipts: 'all',
      calladd:      'known',
    }),
  });
  if (!res.ok) throw new Error(`Uazapi privacy failed: ${res.status}`);
}

// ── Presence (simulate business hours) ──────────────────────────────────────

export async function setPresence(
  token: string,
  presence: 'available' | 'unavailable'
): Promise<void> {
  const res = await fetch(`${UAZAPI_BASE}/instance/presence`, {
    method: 'POST',
    headers: instanceHeaders(token),
    body: JSON.stringify({ presence }),
  });
  if (!res.ok) throw new Error(`Uazapi presence failed: ${res.status}`);
}

// ── Send text message ────────────────────────────────────────────────────────

export interface SendMessagePayload {
  /** Destination in E.164 format, e.g. "5511999999999" */
  number: string;
  text: string;
}

export async function sendTextMessage(
  token: string,
  payload: SendMessagePayload
): Promise<void> {
  const res = await fetch(`${UAZAPI_BASE}/message/text`, {
    method: 'POST',
    headers: instanceHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Uazapi send failed: ${res.status}`);
}
