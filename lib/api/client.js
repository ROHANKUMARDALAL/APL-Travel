/**
 * Browser calls same-origin /api/v1, rewritten to the APL backend.
 * Never call supplier APIs from the frontend.
 */

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
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

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
    throw new Error(details.length ? `${message}: ${details.join("; ")}` : message);
  }

  return payload?.data;
}
