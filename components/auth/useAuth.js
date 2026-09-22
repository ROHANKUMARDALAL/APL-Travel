"use client";

import { useEffect, useState } from "react";
import {
  AUTH_EVENT,
  getCurrentUser,
  getSession,
  isAuthenticated,
} from "@/lib/auth";

/**
 * Subscribe to mock auth session changes (login/logout/refresh).
 */
export function useAuth() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    function sync() {
      setUser(getCurrentUser());
      setAuthenticated(isAuthenticated());
      setReady(true);
    }

    sync();
    window.addEventListener(AUTH_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(AUTH_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return {
    ready,
    user,
    authenticated,
    session: ready ? getSession() : null,
  };
}
