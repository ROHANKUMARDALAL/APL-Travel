/**
 * Mock authentication for development only.
 * Replace login/logout/signup with real API / JWT / auth-provider later.
 * Never stores passwords.
 */

import { DEMO_AUTH_EMAIL, DEMO_USER } from "@/data/mock/user";

export const AUTH_SESSION_KEY = "apl-auth-session";
export const AUTH_EVENT = "apl-auth-change";

/** Compared in memory only — never persisted. */
const DEMO_PASSWORD = "Test@123";

function notifyAuthChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_EVENT));
}

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

/**
 * @returns {{ user: typeof DEMO_USER, loggedInAt: string } | null}
 */
export function getSession() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.user?.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return Boolean(getSession()?.user);
}

export function getCurrentUser() {
  return getSession()?.user || null;
}

/**
 * Persist a session object without any password fields.
 */
function saveSession(user) {
  if (typeof window === "undefined") return;
  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    initials: user.initials || initialsFromName(user.name),
    marketId: user.marketId || "us",
  };
  window.localStorage.setItem(
    AUTH_SESSION_KEY,
    JSON.stringify({
      user: safeUser,
      loggedInAt: new Date().toISOString(),
    }),
  );
  notifyAuthChange();
}

export function initialsFromName(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function login(email, password) {
  const normalized = normalizeEmail(email);
  const pass = String(password || "");

  if (!normalized || !pass) {
    return {
      ok: false,
      message: "Enter your email and password",
    };
  }

  if (normalized === normalizeEmail(DEMO_AUTH_EMAIL) && pass === DEMO_PASSWORD) {
    saveSession(DEMO_USER);
    return { ok: true, user: DEMO_USER };
  }

  return {
    ok: false,
    message: "Incorrect email or password. Try the demo credentials shown below.",
  };
}

/**
 * Demo sign-up — creates a local session only (no password storage, no backend).
 */
export function signUp({ name, email, phone, password }) {
  const normalized = normalizeEmail(email);
  const trimmedName = String(name || "").trim();
  const pass = String(password || "");

  if (!trimmedName || trimmedName.length < 2) {
    return { ok: false, message: "Enter your full name" };
  }
  if (!normalized || !normalized.includes("@")) {
    return { ok: false, message: "Enter a valid email address" };
  }
  if (pass.length < 6) {
    return { ok: false, message: "Password must be at least 6 characters" };
  }
  if (normalized === normalizeEmail(DEMO_AUTH_EMAIL)) {
    return {
      ok: false,
      message: "An account with this email already exists. Please sign in.",
    };
  }

  const user = {
    id: `user-local-${Date.now()}`,
    name: trimmedName,
    email: normalized,
    phone: String(phone || "").trim(),
    initials: initialsFromName(trimmedName),
    marketId: "us",
  };

  // Password is intentionally discarded — demo sessions are identity-only.
  saveSession(user);
  return { ok: true, user };
}

export function logout() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(AUTH_SESSION_KEY);
  } catch {
    // ignore
  }
  notifyAuthChange();
}
