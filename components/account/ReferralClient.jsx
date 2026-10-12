"use client";

import { useEffect, useState } from "react";
import AccountShell from "@/components/account/AccountShell";
import { loadReferralProfile } from "@/lib/referral";

export default function ReferralClient() {
  const [profile, setProfile] = useState({ code: "", shareUrl: "" });
  const [copyState, setCopyState] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    loadReferralProfile()
      .then((data) => {
        if (!ignore) setProfile(data);
      })
      .catch((err) => {
        if (!ignore) setError(err instanceof Error ? err.message : "Referral code could not be loaded");
      });
    return () => {
      ignore = true;
    };
  }, []);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(profile.code);
      setCopyState("Code copied");
    } catch {
      setCopyState("Copy unavailable — select the code manually");
    }
    setTimeout(() => setCopyState(""), 1800);
  }

  return (
    <AccountShell title="Referral Code">
      <p className="section-copy account-lede">
        This code belongs to your membership on this travel website. Reward attribution is a separate step.
      </p>
      {error ? <p className="field-error">{error}</p> : null}
      <section className="checkout-section account-panel">
        <p className="field-label">Your referral code</p>
        <div className="referral-code-row">
          <p className="confirmation-ref-value">{profile.code || "—"}</p>
          <button type="button" className="btn-primary" onClick={copyCode} disabled={!profile.code}>
            Copy Code
          </button>
        </div>
        {copyState ? <p className="promo-feedback is-applied" role="status">{copyState}</p> : null}
      </section>
    </AccountShell>
  );
}
