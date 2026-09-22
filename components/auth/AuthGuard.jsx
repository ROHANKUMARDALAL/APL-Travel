"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/useAuth";

/**
 * Client-side guard for protected account routes.
 * Replace with server/middleware auth when a real provider is wired.
 */
export default function AuthGuard({ children, redirectTo = "/login" }) {
  const { ready, authenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!ready) return;
    if (!authenticated) {
      const next = `${pathname}${searchParams?.toString() ? `?${searchParams}` : ""}`;
      router.replace(`${redirectTo}?next=${encodeURIComponent(next)}`);
    }
  }, [ready, authenticated, router, redirectTo, pathname, searchParams]);

  if (!ready) {
    return (
      <div className="account-loading">
        <p className="section-copy">Loading your account…</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="account-loading">
        <p className="section-copy">Redirecting to sign in…</p>
      </div>
    );
  }

  return children;
}
