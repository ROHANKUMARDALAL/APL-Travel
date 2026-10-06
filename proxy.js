import { NextResponse } from "next/server";

/**
 * Phase 9 — forward the browser-facing public host on travel API rewrites.
 *
 * Browser → B2C (Host: localhost:3001) → rewrite → backend.
 * Without this, the backend would only see the backend Host and cannot resolve DSA.
 *
 * Authority is the inbound Host to this B2C app (not body/query dsaId).
 * Backend still ignores client dsaId and uses Phase 8 host resolution.
 */
export function proxy(request) {
  const requestHeaders = new Headers(request.headers);

  const forwarded = String(request.headers.get("x-forwarded-host") || "")
    .split(",")[0]
    .trim();
  const host = forwarded || String(request.headers.get("host") || "").trim();

  if (host) {
    // Dev: backend reads X-APL-Public-Host with PUBLIC_DEV_HOST_MAP.
    // Prod: backend prefers X-Forwarded-Host (proxy/CDN).
    requestHeaders.set("x-apl-public-host", host);
    requestHeaders.set("x-forwarded-host", host);
  }

  if (!requestHeaders.get("x-request-id")) {
    requestHeaders.set("x-request-id", crypto.randomUUID());
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/api/v1/:path*", "/media/:path*"],
};
