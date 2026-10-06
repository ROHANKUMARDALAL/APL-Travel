/**
 * Browser calls same-origin /api/v1, rewritten to the APL backend.
 * Never call supplier APIs from the frontend.
 *
 * Phase 9: send correlation id; public host is injected by proxy.js from
 * the trusted inbound Host (not from client-chosen dsaId).
 */

function createRequestId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `b2c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function apiPost(path, body, options = {}) {
  return apiRequest(path, { method: "POST", body, token: options.token });
}

export async function apiGet(path, options = {}) {
  return apiRequest(path, { method: "GET", token: options.token });
}

export async function apiPatch(path, body, options = {}) {
  return apiRequest(path, { method: "PATCH", body, token: options.token });
}

export async function apiDelete(path, options = {}) {
  return apiRequest(path, { method: "DELETE", token: options.token });
}

async function apiRequest(path, { method, body, token }) {
  const headers = {
    "Content-Type": "application/json",
    "x-request-id": createRequestId(),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  // Host forwarding is owned by proxy.js (trusted B2C edge). Do not send
  // client-chosen dsaId — backend strips/ignores it.

  const response = await fetch(`/api/v1${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || payload?.success === false) {
    const message = payload?.error?.ErrorMessage || `Request failed (${response.status})`;
    const details = Array.isArray(payload?.error?.details) ? payload.error.details : [];
    const detailText = details
      .map((entry) => {
        if (typeof entry === "string") return entry;
        if (entry && typeof entry === "object") {
          if (entry.requiredAmount != null && entry.providedAmount != null) {
            return `required ${entry.requiredAmount} ${entry.currency || ""}, provided ${entry.providedAmount}`.trim();
          }
          try {
            return JSON.stringify(entry);
          } catch {
            return String(entry);
          }
        }
        return String(entry);
      })
      .filter(Boolean)
      .join("; ");
    const error = new Error(detailText ? `${message}: ${detailText}` : message);
    error.status = response.status;
    error.code = payload?.error?.code || null;
    error.errorCode = payload?.error?.errorCode || null;
    error.details = details;
    error.requestId = payload?.meta?.requestId || response.headers.get("x-request-id") || null;
    throw error;
  }

  return payload?.data;
}

export function isUnauthorizedError(error) {
  if (!error) return false;
  if (error.status === 401 || error.code === "UNAUTHORIZED") return true;
  return /login token|unauthorized|sign in|expired/i.test(String(error.message || ""));
}
