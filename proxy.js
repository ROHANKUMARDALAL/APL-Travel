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
const PREVIEW_THEMES = new Set(["CLASSIC_TRAVEL", "MODERN_EXPLORER", "LUXURY_ESCAPE"]);

export function proxy(request) {
  const requestHeaders = new Headers(request.headers);
  const preview = String(request.nextUrl.searchParams.get("previewTheme") || "").toUpperCase();
  if (PREVIEW_THEMES.has(preview)) requestHeaders.set("x-apl-preview-theme", preview);
  const previewColors = String(request.nextUrl.searchParams.get("previewColors") || "");
  if (/^#[0-9A-Fa-f]{6}(?:,#[0-9A-Fa-f]{6}){4}$/.test(previewColors)) {
    requestHeaders.set("x-apl-preview-colors", previewColors);
  }

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
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
