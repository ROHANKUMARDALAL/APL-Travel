"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AuthForms from "@/components/auth/AuthForms";
import { useAuth } from "@/components/auth/useAuth";
import { FOOTER } from "@/data/static";

export default function LoginPageClient({ initialMode = "login" }) {
  const { ready, authenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/my-trips";

  useEffect(() => {
    if (!ready) return;
    if (authenticated) {
      const safe =
        next.startsWith("/") && !next.startsWith("//") ? next : "/my-trips";
      router.replace(safe);
    }
  }, [ready, authenticated, router, next]);

  if (!ready || authenticated) {
    return (
      <div className="auth-page">
        <div className="auth-page-inner">
          <p className="section-copy">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-page-inner">
        <Link href="/" className="brand-mark-dark auth-brand">
          {FOOTER.brand}
        </Link>
        <AuthForms initialMode={initialMode} />
      </div>
    </div>
  );
}
