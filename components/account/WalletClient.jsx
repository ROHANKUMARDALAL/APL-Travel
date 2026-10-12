"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AccountShell from "@/components/account/AccountShell";
import { getActiveMarketId } from "@/data/markets";
import { loadWallet } from "@/lib/wallet";

export default function WalletClient() {
  const marketId = getActiveMarketId();
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    loadWallet(marketId)
      .then((data) => {
        if (!ignore) setSummary(data);
      })
      .catch((err) => {
        if (!ignore) setError(err instanceof Error ? err.message : "Wallet could not be loaded");
      });
    return () => {
      ignore = true;
    };
  }, [marketId]);

  const transactions = summary?.transactions || [];

  return (
    <AccountShell title="My Wallet">
      <p className="section-copy account-lede">
        This balance belongs to your account on this travel website.
      </p>
      {error ? <p className="field-error">{error}</p> : null}
      <div className="wallet-summary-grid">
        <section className="checkout-section wallet-stat">
          <p className="field-label">Available balance</p>
          <p className="wallet-stat-value">{summary?.availableLabel || "—"}</p>
        </section>
      </div>
      <section className="checkout-section account-panel">
        <h2 className="checkout-section-title">Recent transactions</h2>
        {transactions.length === 0 ? (
          <div className="support-empty">
            <p className="section-copy">No wallet activity yet.</p>
            <Link className="btn-primary" href="/#search">Plan a trip</Link>
          </div>
        ) : (
          <ul className="wallet-tx-list">
            {transactions.map((tx) => (
              <li key={tx.id} className="wallet-tx-item">
                <div className="wallet-tx-main">
                  <p className="wallet-tx-desc">{tx.reason}</p>
                  <p className="result-card-meta">{tx.date ? new Date(tx.date).toLocaleString() : ""}</p>
                </div>
                <p className="wallet-tx-amount">{tx.signedLabel}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AccountShell>
  );
}
