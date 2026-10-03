"use client";

import { formatCardNumber, formatExpiry } from "@/lib/mockPayment";

const METHODS = [
  { id: "upi", label: "UPI", hint: "Pay via any UPI app" },
  { id: "card", label: "Cards", hint: "Debit / credit cards" },
  { id: "netbanking", label: "Net Banking", hint: "All major banks" },
  { id: "paypal", label: "PayPal", hint: "Wallet checkout" },
];

export default function PaymentMethods({
  method,
  onMethodChange,
  card,
  onCardChange,
  errors,
  forceFail,
  onForceFailChange,
}) {
  return (
    <section className="checkout-section pay-methods-section" id="payment">
      <h2 className="checkout-section-title">Payment method</h2>
      <p className="booking-section-copy">
        Choose how you want to pay. Card details are never stored on APL Travel.
      </p>

      <div className="pay-method-grid" role="radiogroup" aria-label="Payment method">
        {METHODS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="radio"
            aria-checked={method === item.id}
            className={`pay-method-card ${method === item.id ? "is-selected" : ""}`}
            onClick={() => onMethodChange(item.id)}
          >
            <span className="pay-method-label">{item.label}</span>
            <span className="pay-method-hint">{item.hint}</span>
          </button>
        ))}
      </div>

      {method === "card" ? (
        <div className="booking-form-grid payment-card-grid">
          <div className="search-field payment-card-number">
            <label className="field-label" htmlFor="card-number">
              Card number
            </label>
            <input
              id="card-number"
              className={`field-input ${errors.number ? "is-invalid" : ""}`}
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="4242 4242 4242 4242"
              value={card.number}
              onChange={(e) =>
                onCardChange({ ...card, number: formatCardNumber(e.target.value) })
              }
            />
            {errors.number ? <p className="field-error">{errors.number}</p> : null}
            <p className="result-card-meta">Tip: ending in 0000 simulates a decline.</p>
          </div>
          <div className="search-field">
            <label className="field-label" htmlFor="card-expiry">
              Expiry
            </label>
            <input
              id="card-expiry"
              className={`field-input ${errors.expiry ? "is-invalid" : ""}`}
              inputMode="numeric"
              autoComplete="cc-exp"
              placeholder="MM/YY"
              value={card.expiry}
              onChange={(e) =>
                onCardChange({ ...card, expiry: formatExpiry(e.target.value) })
              }
            />
            {errors.expiry ? <p className="field-error">{errors.expiry}</p> : null}
          </div>
          <div className="search-field">
            <label className="field-label" htmlFor="card-cvv">
              CVV
            </label>
            <input
              id="card-cvv"
              className={`field-input ${errors.cvv ? "is-invalid" : ""}`}
              inputMode="numeric"
              autoComplete="cc-csc"
              placeholder="123"
              value={card.cvv}
              onChange={(e) =>
                onCardChange({
                  ...card,
                  cvv: e.target.value.replace(/\D/g, "").slice(0, 4),
                })
              }
            />
            {errors.cvv ? <p className="field-error">{errors.cvv}</p> : null}
          </div>
          <div className="search-field">
            <label className="field-label" htmlFor="card-name">
              Name on card
            </label>
            <input
              id="card-name"
              className={`field-input ${errors.name ? "is-invalid" : ""}`}
              autoComplete="cc-name"
              value={card.name}
              onChange={(e) => onCardChange({ ...card, name: e.target.value })}
            />
            {errors.name ? <p className="field-error">{errors.name}</p> : null}
          </div>
        </div>
      ) : (
        <p className="pay-method-alt-note">
          {METHODS.find((m) => m.id === method)?.label} opens a secure mock approval
          flow — no external provider is contacted in this demo.
        </p>
      )}

      <label className="wallet-toggle">
        <input
          type="checkbox"
          checked={forceFail}
          onChange={(e) => onForceFailChange(e.target.checked)}
        />
        <span>Simulate payment failure (dev)</span>
      </label>
    </section>
  );
}
