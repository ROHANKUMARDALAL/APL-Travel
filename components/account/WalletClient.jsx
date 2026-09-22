"use client";

import Link from "next/link";
import AccountShell from "@/components/account/AccountShell";
import { getActiveMarketId } from "@/data/markets";
import { getWalletSummary, listWalletTransactions } from "@/lib/wallet";

export default function WalletClient() {
  const marketId = getActiveMarketId();
  const summary = getWalletSummary(marketId);
  const transactions = listWalletTransactions({ marketId });

  return (
    <AccountShell title="My Wallet">
      <p className="section-copy account-lede">
        Apply available Travel Wallet credit at checkout. Pending credits become
        available once they clear.
      </p>
      <p className="dev-note">Balances shown are illustrative for this experience.</p>

      <div className="wallet-summary-grid">
        <section className="checkout-section wallet-stat">
          <p className="field-label">Available balance</p>
          <p className="wallet-stat-value">{summary.availableLabel}</p>
          <p className="result-card-meta">Ready to apply at checkout</p>
        </section>
        <section className="checkout-section wallet-stat">
          <p className="field-label">Pending credits</p>
          <p className="wallet-stat-value">{summary.pendingLabel}</p>
          <p className="result-card-meta">Not yet available to spend</p>
        </section>
      </div>

      <section className="checkout-section account-panel">
        <h2 className="checkout-section-title">Recent transactions</h2>
        {transactions.length === 0 ? (
          <div className="support-empty">
            <p className="section-copy">No wallet activity yet.</p>
            <div className="account-inline-actions">
              <Link className="btn-primary" href="/#search">
                Book a trip
              </Link>
              <Link className="btn-ghost" href="/account/referral">
                Invite friends
              </Link>
            </div>
          </div>
        ) : (
          <ul className="wallet-tx-list">
            {transactions.map((tx) => (
              <li key={tx.id} className="wallet-tx-item">
                <div className="wallet-tx-main">
                  <p className="wallet-tx-desc">{tx.description}</p>
                  <p className="result-card-meta">
                    {tx.date} · {tx.typeLabel} · {tx.statusLabel}
                  </p>
                </div>
                <p
                  className={`wallet-tx-amount ${
                    tx.type === "debit" ? "is-debit" : "is-credit"
                  }`}
                >
                  <span className="wallet-tx-type-tag">{tx.typeLabel}</span>
                  {tx.signedLabel}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AccountShell>
  );
}
