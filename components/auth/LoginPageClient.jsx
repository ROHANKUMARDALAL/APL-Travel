"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AuthForms from "@/components/auth/AuthForms";
import { useAuth } from "@/components/auth/useAuth";
import { useSite } from "@/components/site/SiteProvider";

export default function LoginPageClient({ initialMode = "login" }) {
  const { ready, authenticated } = useAuth();
  const { branding, tenant } = useSite();
  const brandName = branding.websiteName || tenant?.displayName || tenant?.companyName || "";
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
        <Link href="/" className="brand-mark-dark auth-brand inline-flex items-center gap-2">
          {branding.logoUrl ? (
            <img src={branding.logoUrl} alt="" className="h-8 w-auto max-w-[140px] object-contain" />
          ) : null}
          {brandName}
        </Link>
        <AuthForms initialMode={initialMode} />
      </div>
    </div>
  );
}
