/**
 * Customer session backed by POST /api/v1/auth/login and /signup.
 * Passwords are never stored in the browser.
 */

import { apiGet, apiPost } from "@/lib/api/client";
import { registerAccountCurrencyReader, setActiveCurrency } from "@/data/markets";

export const AUTH_SESSION_KEY = "apl-auth-session";
export const AUTH_EVENT = "apl-auth-change";

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
function saveSession(user, loginToken) {
  if (typeof window === "undefined") return;
  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    initials: user.initials || initialsFromName(user.name),
    marketId: user.marketId || "in",
    currency: String(user.currency || "INR").trim().toUpperCase(),
  };
  window.localStorage.setItem(
    AUTH_SESSION_KEY,
    JSON.stringify({
      user: safeUser,
      loginToken: loginToken || null,
      loggedInAt: new Date().toISOString(),
    }),
  );
  notifyAuthChange();
}

export function getLoginToken() {
  return getSession()?.loginToken || null;
}

function mapApiUser(user) {
  return {
    id: user.userId,
    name: user.name,
    email: user.email,
    phone: user.phoneNumber || "",
    currency: user.currency || "INR",
    initials: initialsFromName(user.name),
    marketId: "in",
  };
}

function captchaPayload(captchaId, captchaAnswer) {
  return {
    captchaId: String(captchaId || "").trim(),
    captchaAnswer: String(captchaAnswer || "").trim(),
  };
}

export async function login({ email, password, captchaId, captchaAnswer }) {
  const normalized = normalizeEmail(email);
  const pass = String(password || "");
  const captcha = captchaPayload(captchaId, captchaAnswer);

  if (!normalized || !pass) {
    return {
      ok: false,
      message: "Enter your email and password",
    };
  }
  if (!captcha.captchaId || !captcha.captchaAnswer) {
    return { ok: false, message: "Enter the characters shown in the security image" };
  }

  try {
    const data = await apiPost("/auth/login", {
      email: normalized,
      password: pass,
      ...captcha,
    });
    const user = mapApiUser(data.user);
    saveSession(user, data.loginToken);
    if (user.currency) setActiveCurrency(user.currency);
    return { ok: true, user };
  } catch (error) {
    return {
      ok: false,
      message: error.message || "Incorrect email or password.",
    };
  }
}

export async function signUp({ name, email, phone, password, currency, captchaId, captchaAnswer }) {
  const normalized = normalizeEmail(email);
  const trimmedName = String(name || "").trim();
  const pass = String(password || "");
  const phoneNumber = String(phone || "").trim();
  const captcha = captchaPayload(captchaId, captchaAnswer);

  if (!trimmedName || trimmedName.length < 2) {
    return { ok: false, message: "Enter your full name" };
  }
  if (!normalized || !normalized.includes("@")) {
    return { ok: false, message: "Enter a valid email address" };
  }
  if (!/^\+?[0-9]{8,15}$/.test(phoneNumber)) {
    return { ok: false, message: "Enter a phone number with 8 to 15 digits" };
  }
  if (pass.length < 8) {
    return { ok: false, message: "Password must be at least 8 characters" };
  }
  if (!captcha.captchaId || !captcha.captchaAnswer) {
    return { ok: false, message: "Enter the characters shown in the security image" };
  }

  try {
    const data = await apiPost("/auth/signup", {
      name: trimmedName,
      email: normalized,
      phoneNumber,
      password: pass,
      currency: String(currency || "INR").trim().toUpperCase(),
      ...captcha,
    });
    const user = mapApiUser(data.user);
    saveSession(user, data.loginToken);
    if (user.currency) setActiveCurrency(user.currency);
    return { ok: true, user };
  } catch (error) {
    return { ok: false, message: error.message || "Could not create the account" };
  }
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

let refreshPromise = null;

/**
 * Re-read the account from the database. The currency chosen at signup
 * lives on the user document and replaces any guest header choice.
 */
export function refreshAccountFromServer() {
  if (typeof window === "undefined") return Promise.resolve(null);
  const token = getLoginToken();
  if (!token) return Promise.resolve(null);
  if (refreshPromise) return refreshPromise;

  refreshPromise = apiGet("/auth/me", { token })
    .then((data) => {
      const user = mapApiUser(data?.user || {});
      const current = getSession()?.user;
      const changed =
        !current ||
        current.currency !== user.currency ||
        current.name !== user.name ||
        current.email !== user.email ||
        current.phone !== user.phone;
      if (changed && user.email) saveSession(user, token);
      if (user.currency) setActiveCurrency(user.currency);
      return user;
    })
    .catch(() => {
      const accountCurrency = getCurrentUser()?.currency;
      if (accountCurrency) setActiveCurrency(accountCurrency);
      return null;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

registerAccountCurrencyReader(() => getCurrentUser()?.currency || null);

export function logout() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(AUTH_SESSION_KEY);
  } catch {
    // ignore
  }
  notifyAuthChange();
}
