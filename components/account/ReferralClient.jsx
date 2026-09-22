"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import AccountShell from "@/components/account/AccountShell";
import { getActiveMarketId } from "@/data/markets";
import { getReferralProfile, listReferrals } from "@/lib/referral";

export default function ReferralClient() {
  const marketId = getActiveMarketId();
  const profile = useMemo(() => getReferralProfile({ marketId }), [marketId]);
  const referrals = useMemo(() => listReferrals({ marketId }), [marketId]);
  const [copyState, setCopyState] = useState("");

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(profile.code);
      setCopyState("Code copied");
    } catch {
      setCopyState("Copy unavailable — select the code manually");
    }
    setTimeout(() => setCopyState(""), 1800);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(profile.shareUrl);
      setCopyState("Link copied");
    } catch {
      setCopyState("Copy unavailable — select the link manually");
    }
    setTimeout(() => setCopyState(""), 1800);
  }

  function shareReferral() {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator
        .share({
          title: "APL Travel referral",
          text: `Use my referral code ${profile.code} when you book with APL Travel.`,
          url: profile.shareUrl,
        })
        .catch(() => {
          copyLink();
        });
      return;
    }
    copyLink();
  }

  return (
    <AccountShell title="Referral Code">
      <p className="section-copy account-lede">{profile.explanation}</p>

      <section className="checkout-section account-panel">
        <p className="field-label">Your referral code</p>
        <div className="referral-code-row">
          <p className="confirmation-ref-value">{profile.code}</p>
          <div className="account-inline-actions">
            <button type="button" className="btn-primary" onClick={copyCode}>
              Copy
            </button>
            <button
              type="button"
              className="btn-secondary promo-apply-btn"
              onClick={shareReferral}
            >
              Share
            </button>
          </div>
        </div>
        {copyState ? (
          <p className="promo-feedback is-applied" role="status">
            {copyState}
          </p>
        ) : null}

        <p className="field-label">Referral link</p>
        <p className="referral-link">{profile.shareUrl}</p>
        <button type="button" className="btn-ghost" onClick={copyLink}>
          Copy link
        </button>
      </section>

      <div className="wallet-summary-grid">
        <section className="checkout-section wallet-stat">
          <p className="field-label">Successful referrals</p>
          <p className="wallet-stat-value">{profile.successful}</p>
        </section>
        <section className="checkout-section wallet-stat">
          <p className="field-label">Pending rewards</p>
          <p className="wallet-stat-value">{profile.pendingRewardsLabel}</p>
        </section>
        <section className="checkout-section wallet-stat">
          <p className="field-label">Earned rewards</p>
          <p className="wallet-stat-value">{profile.earnedRewardsLabel}</p>
          <p className="dev-note">Illustrative totals for this experience</p>
        </section>
      </div>

      <section className="checkout-section account-panel">
        <h2 className="checkout-section-title">Referral activity</h2>
        {referrals.length === 0 ? (
          <div className="support-empty">
            <p className="section-copy">You haven&apos;t referred anyone yet.</p>
            <div className="account-inline-actions">
              <button type="button" className="btn-primary" onClick={shareReferral}>
                Share your code
              </button>
              <Link className="btn-ghost" href="/account/wallet">
                View wallet
              </Link>
            </div>
          </div>
        ) : (
          <ul className="wallet-tx-list">
            {referrals.map((item) => (
              <li key={item.id} className="wallet-tx-item">
                <div className="wallet-tx-main">
                  <p className="wallet-tx-desc">{item.name}</p>
                  <p className="result-card-meta">
                    {item.bookedAt} · {item.statusLabel}
                  </p>
                </div>
                <p className="wallet-tx-amount is-credit">
                  <span className="wallet-tx-type-tag">{item.statusLabel}</span>
                  {item.rewardLabel}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AccountShell>
  );
}
