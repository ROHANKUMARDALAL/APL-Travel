"use client";

import Link from "next/link";
import AccountShell from "@/components/account/AccountShell";

export default function AccountPlaceholder({
  title,
  description,
  ctaLabel = "Back to My Trips",
  ctaHref = "/my-trips",
}) {
  return (
    <AccountShell title={title}>
      <section className="checkout-section account-panel">
        <p className="section-eyebrow">Coming soon</p>
        <p className="section-copy">{description}</p>
        <div className="account-inline-actions">
          <Link className="btn-primary" href={ctaHref}>
            {ctaLabel}
          </Link>
          <Link className="btn-ghost" href="/support">
            Contact support
          </Link>
        </div>
      </section>
    </AccountShell>
  );
}
