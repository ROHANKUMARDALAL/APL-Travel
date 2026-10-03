"use client";

import { useEffect, useState } from "react";
import {
  AUTH_EVENT,
  ensureValidSession,
  getCurrentUser,
  getSession,
  isAuthenticated,
} from "@/lib/auth";

/**
 * Subscribe to auth session changes and validate the login token once on boot
 * so stale localStorage sessions cannot keep account pages half-logged-in.
 */
export function useAuth() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let ignore = false;

    function syncFromStorage() {
      if (ignore) return;
      setUser(getCurrentUser());
      setAuthenticated(isAuthenticated());
    }

    async function boot() {
      syncFromStorage();
      if (!isAuthenticated()) {
        if (!ignore) setReady(true);
        return;
      }

      await ensureValidSession();
      if (ignore) return;
      syncFromStorage();
      setReady(true);
    }

    boot();
    window.addEventListener(AUTH_EVENT, syncFromStorage);
    window.addEventListener("storage", syncFromStorage);
    return () => {
      ignore = true;
      window.removeEventListener(AUTH_EVENT, syncFromStorage);
      window.removeEventListener("storage", syncFromStorage);
    };
  }, []);

  return {
    ready,
    user,
    authenticated,
    session: ready ? getSession() : null,
  };
}
