"use client";

import { useState } from "react";
import { applyPromoCode } from "@/lib/checkoutPricing";
import { formatMoney, getActiveMarketId } from "@/data/markets";

export function PromoCodeField({ promo, usedCodes, onApply, onRemove }) {
  const [code, setCode] = useState("");
  const [feedback, setFeedback] = useState(null);

  function handleApply(event) {
    event.preventDefault();
    const result = applyPromoCode(code, usedCodes);
    setFeedback(result);
    if (result.ok) {
      onApply(result.promo);
      setCode("");
    }
  }

  return (
    <section className="checkout-section">
      <h2 className="checkout-section-title">Promo or referral code</h2>
      {promo ? (
        <div className="promo-applied">
          <p>
            <strong>{promo.code}</strong> — {promo.label}
          </p>
          <button type="button" className="btn-ghost" onClick={onRemove}>
            Remove
          </button>
        </div>
      ) : (
        <form className="promo-form" onSubmit={handleApply}>
          <input
            className="field-input"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. SAVE10"
            aria-label="Promo or referral code"
          />
          <button type="submit" className="btn-secondary promo-apply-btn">
            Apply
          </button>
        </form>
      )}
      {feedback ? (
        <p
          className={`promo-feedback is-${feedback.status}`}
          role="status"
        >
          {feedback.message}
        </p>
      ) : (
        <p className="result-card-meta">Try SAVE10 or WELCOME20</p>
      )}
    </section>
  );
}

export function WalletCredit({
  balance,
  applied,
  maxApplicable,
  onChangeApplied,
}) {
  const marketId = getActiveMarketId();
  const enabled = applied > 0;

  return (
    <section className="checkout-section">
      <h2 className="checkout-section-title">Travel Wallet</h2>
      <p className="result-card-meta">
        Available credit: <strong>{formatMoney(balance, marketId)}</strong>{" "}
        (mock balance)
      </p>
      <label className="wallet-toggle">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => {
            if (e.target.checked) {
              onChangeApplied(Math.min(balance, maxApplicable));
            } else {
              onChangeApplied(0);
            }
          }}
        />
        <span>Apply wallet credit to this booking</span>
      </label>
      {enabled ? (
        <label className="filter-range wallet-range">
          <span className="field-label">Amount to apply</span>
          <input
            type="range"
            min={0}
            max={Math.min(balance, maxApplicable) || 0}
            value={Math.min(applied, maxApplicable)}
            onChange={(e) => onChangeApplied(Number(e.target.value))}
          />
          <span className="filter-range-value">
            {formatMoney(Math.min(applied, maxApplicable), marketId)}
          </span>
        </label>
      ) : null}
    </section>
  );
}
