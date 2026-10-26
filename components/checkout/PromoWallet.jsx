"use client";

import { useState } from "react";
import { formatMoney, getActiveMarketId } from "@/data/markets";

export function PromoCodeField({ promo, onApply, onRemove, service = "flight", searchId = "", offerId = "", passengers = 0 }) {
  const [code, setCode] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [pending, setPending] = useState(false);

  async function handleApply(event) {
    event.preventDefault();
    setPending(true);
    setFeedback(null);
    try {
      const response = await fetch("/api/v1/bookings/coupon-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          serviceCode: service,
          searchId: searchId || undefined,
          offerId: offerId || undefined,
          passengers: Number(passengers) > 0 ? Number(passengers) : undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok || payload?.success === false) {
        window.sessionStorage.removeItem("apl-coupon-code");
        window.sessionStorage.removeItem("apl-coupon-unit");
        window.sessionStorage.removeItem("apl-coupon-currency");
        window.sessionStorage.removeItem("apl-coupon-type");
        window.sessionStorage.removeItem("apl-coupon-value");
        window.sessionStorage.removeItem("apl-coupon-max");
        const message = payload?.error?.ErrorMessage || payload?.error?.message || "Invalid coupon";
        setFeedback({ status: "error", message });
        return;
      }
      const quote = payload.data.quote || null;
      window.sessionStorage.setItem("apl-coupon-code", payload.data.coupon.code);
      window.sessionStorage.setItem("apl-coupon-service", service);
      if (quote?.couponSavings != null) {
        window.sessionStorage.setItem("apl-coupon-savings", String(quote.couponSavings));
      }
      if (quote?.total != null) {
        window.sessionStorage.setItem("apl-coupon-unit", String(quote.total));
        window.sessionStorage.setItem("apl-coupon-currency", quote.currency || "INR");
      }
      const applied = {
        code: payload.data.coupon.code,
        label: payload.data.coupon.name,
        amount: quote?.couponSavings,
        payable: quote?.total,
        currency: quote?.currency,
        fare: quote?.fare,
        automaticDiscount: quote?.discount,
        adjustmentType: payload.data.coupon.adjustmentType || quote?.couponAdjustmentType || null,
        value: payload.data.coupon.value ?? quote?.couponValue ?? null,
        maxAmount: payload.data.coupon.maxAmount ?? quote?.couponMaxAmount ?? null,
      };
      window.sessionStorage.setItem("apl-coupon-type", applied.adjustmentType || "");
      window.sessionStorage.setItem("apl-coupon-value", applied.value == null ? "" : String(applied.value));
      window.sessionStorage.setItem("apl-coupon-max", applied.maxAmount == null ? "" : String(applied.maxAmount));
      onApply(applied);
      const saved = quote?.couponSavings;
      setFeedback({
        status: "ok",
        message: saved > 0
          ? `Coupon applied. Discount ${saved} ${quote.currency || "INR"}.`
          : "Coupon accepted. The payable amount is confirmed at checkout.",
      });
      setCode("");
    } catch {
      setFeedback({ status: "error", message: "Invalid coupon" });
    } finally {
      setPending(false);
    }
  }

  function clearCoupon() {
    window.sessionStorage.removeItem("apl-coupon-code");
    window.sessionStorage.removeItem("apl-coupon-service");
    window.sessionStorage.removeItem("apl-coupon-unit");
    window.sessionStorage.removeItem("apl-coupon-currency");
    window.sessionStorage.removeItem("apl-coupon-savings");
    window.sessionStorage.removeItem("apl-coupon-type");
    window.sessionStorage.removeItem("apl-coupon-value");
    window.sessionStorage.removeItem("apl-coupon-max");
    setFeedback(null);
    onRemove();
  }

  const marketId = getActiveMarketId();
  const savedAmount = Number(promo?.amount);
  const savedLabel = Number.isFinite(savedAmount)
    ? formatMoney(savedAmount, marketId, promo?.currency || "INR")
    : "";
  const maximum = Number(promo?.maxAmount);
  const maximumLabel = Number.isFinite(maximum) && maximum > 0
    ? formatMoney(maximum, marketId, promo?.currency || "INR")
    : "";
  const offerLabel = promo?.adjustmentType === "PERCENTAGE" && promo?.value != null
    ? `${promo.value}% OFF${maximumLabel ? ` · Maximum ${maximumLabel}` : ""}`
    : promo?.adjustmentType === "FIXED" && savedLabel
      ? `${savedLabel} OFF`
      : "";

  return (
    <section className="promo-card" aria-live="polite">
      {promo ? (
        <div className="promo-card-applied">
          <span className="promo-card-icon" aria-hidden="true">✓</span>
          <div>
            <p className="promo-card-kicker">Coupon {promo.code} applied</p>
            {offerLabel ? <p className="promo-card-code">{offerLabel}</p> : <p className="promo-card-code">{promo.code}</p>}
            {savedLabel ? <p className="promo-card-save">You saved {savedLabel}</p> : null}
          </div>
          <button type="button" className="promo-remove" onClick={clearCoupon}>
            Remove Coupon
          </button>
        </div>
      ) : (
        <form className="promo-card-entry" onSubmit={(event) => void handleApply(event)}>
          <span className="promo-card-icon" aria-hidden="true">%</span>
          <div className="promo-card-copy">
            <p className="promo-card-kicker">Have a promo code?</p>
            <input
              className={`field-input ${feedback?.status === "error" ? "is-invalid" : ""}`}
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Enter coupon code"
              aria-label="Enter coupon code"
              disabled={pending}
            />
            {feedback?.status === "error" ? <p className="field-error">{feedback.message}</p> : null}
          </div>
          <button type="submit" className="promo-apply" disabled={pending || !code.trim()}>
            {pending ? "Checking…" : "Apply Coupon"}
          </button>
        </form>
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
        (customer wallet)
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
