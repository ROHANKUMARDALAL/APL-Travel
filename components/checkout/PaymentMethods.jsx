"use client";

import { formatCardNumber, formatExpiry } from "@/lib/mockPayment";

const METHODS = [
  { id: "card", label: "Card" },
  { id: "paypal", label: "PayPal" },
  { id: "apple", label: "Apple Pay" },
  { id: "google", label: "Google Pay" },
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
    <section className="checkout-section" id="payment">
      <h2 className="checkout-section-title">Payment</h2>
      <p className="booking-section-copy">
        Choose a payment method. Card details are never stored.
      </p>
      <p className="dev-note">Payment is simulated for this experience.</p>

      <div className="payment-methods" role="radiogroup" aria-label="Payment method">
        {METHODS.map((item) => (
          <label
            key={item.id}
            className={`payment-method ${method === item.id ? "is-selected" : ""}`}
          >
            <input
              type="radio"
              name="pay-method"
              checked={method === item.id}
              onChange={() => onMethodChange(item.id)}
            />
            <span>{item.label}</span>
          </label>
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
          <div className="search-field">
            <label className="field-label" htmlFor="card-country">
              Billing country
            </label>
            <select
              id="card-country"
              className={`field-select ${errors.country ? "is-invalid" : ""}`}
              value={card.country}
              onChange={(e) => onCardChange({ ...card, country: e.target.value })}
            >
              <option value="">Select</option>
              <option value="US">United States</option>
              <option value="GB">United Kingdom</option>
              <option value="CA">Canada</option>
              <option value="IE">Ireland</option>
            </select>
            {errors.country ? <p className="field-error">{errors.country}</p> : null}
          </div>
        </div>
      ) : (
        <p className="wallet-alt-note">
          {METHODS.find((m) => m.id === method)?.label} will open a mock approval
          flow — no external provider is contacted.
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
