"use client";

import { useState } from "react";
import { formatShortDate } from "@/lib/resultsHelpers";
import { getActiveMarketId } from "@/data/markets";
import PolicyModal from "@/components/ui/PolicyModal";

function PolicyLink({ policyId, children, onOpen }) {
  return (
    <button
      type="button"
      className="legal-policy-link"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onOpen(policyId);
      }}
    >
      {children}
    </button>
  );
}

export function FinalReview({
  service,
  item,
  draft,
  payableLabel,
  accepted,
  onAcceptedChange,
  errors,
}) {
  const marketId = getActiveMarketId();
  const [policyId, setPolicyId] = useState(null);
  const query = draft.searchQuery || {};
  let bookingLine = "";
  let dateLine = "";

  if (service === "flight") {
    bookingLine = `${item.airline} · ${item.from.code} → ${item.to.code}`;
    dateLine = formatShortDate(query.depart, marketId);
  } else if (service === "hotel") {
    bookingLine = item.name;
    dateLine = `${formatShortDate(query.checkIn, marketId)} → ${formatShortDate(query.checkOut, marketId)}`;
  } else {
    bookingLine = `${item.operator} · ${item.from.city} → ${item.to.city}`;
    dateLine = formatShortDate(query.date, marketId);
  }

  let travellerLine = "—";
  if (service === "flight") {
    const first = draft.travellers?.[0];
    travellerLine = first
      ? `${first.firstName} ${first.lastName}`.trim() || "Travellers on file"
      : "Travellers on file";
  } else if (service === "hotel") {
    const lead = draft.travellers?.lead;
    travellerLine = lead
      ? `${lead.firstName} ${lead.lastName}`.trim() || "Lead guest on file"
      : "Lead guest on file";
  } else if (Array.isArray(draft.travellers)) {
    travellerLine =
      draft.travellers
        .map((person) =>
          [person.firstName, person.lastName, person.age ? `(${person.age})` : ""]
            .filter(Boolean)
            .join(" "),
        )
        .filter(Boolean)
        .join(", ") || "Passengers on file";
  } else {
    const person = draft.travellers || {};
    travellerLine =
      `${person.firstName || ""} ${person.lastName || ""}`.trim() || "Passenger on file";
  }

  return (
    <section className="checkout-section">
      <h2 className="checkout-section-title">You are about to pay</h2>
      <dl className="checkout-fact-list">
        <div>
          <dt>Service</dt>
          <dd>{service}</dd>
        </div>
        <div>
          <dt>Booking</dt>
          <dd>{bookingLine}</dd>
        </div>
        <div>
          <dt>{service === "hotel" ? "Guest" : "Traveller"}</dt>
          <dd>{travellerLine}</dd>
        </div>
        <div>
          <dt>Date</dt>
          <dd>{dateLine}</dd>
        </div>
        <div className="is-emphasized">
          <dt>Total payable</dt>
          <dd>{payableLabel}</dd>
        </div>
      </dl>

      <div className="legal-checks">
        <label className="legal-check">
          <input
            type="checkbox"
            checked={accepted.terms}
            onChange={(e) =>
              onAcceptedChange({ ...accepted, terms: e.target.checked })
            }
          />
          <span>
            I agree to the{" "}
            <PolicyLink policyId="terms" onOpen={setPolicyId}>
              Terms &amp; Conditions
            </PolicyLink>
          </span>
        </label>
        <label className="legal-check">
          <input
            type="checkbox"
            checked={accepted.cancellation}
            onChange={(e) =>
              onAcceptedChange({ ...accepted, cancellation: e.target.checked })
            }
          />
          <span>
            I understand the{" "}
            <PolicyLink policyId="cancellation" onOpen={setPolicyId}>
              cancellation &amp; refund policy
            </PolicyLink>
          </span>
        </label>
        <label className="legal-check">
          <input
            type="checkbox"
            checked={accepted.privacy}
            onChange={(e) =>
              onAcceptedChange({ ...accepted, privacy: e.target.checked })
            }
          />
          <span>
            I agree to the{" "}
            <PolicyLink policyId="privacy" onOpen={setPolicyId}>
              Privacy policy
            </PolicyLink>
          </span>
        </label>
        <p className="legal-delivery-note">
          Ticket and voucher delivery follows our{" "}
          <PolicyLink policyId="delivery" onOpen={setPolicyId}>
            Delivery Policy
          </PolicyLink>
          .
        </p>
        {errors.legal ? <p className="field-error">{errors.legal}</p> : null}
      </div>

      <PolicyModal
        open={Boolean(policyId)}
        policyId={policyId}
        onClose={() => setPolicyId(null)}
      />
    </section>
  );
}

export function CheckoutPricePanel({
  payable,
  nights = 1,
  payLabel,
  onPay,
  disabled,
  processing,
  variant = "all",
  fareLabel = "",
  onQuickMethod,
}) {
  const rows = (
    <dl className="price-summary-rows pay-price-rows">
      <div>
        <dt>Base fare{nights > 1 ? ` · ${nights} nights` : ""}</dt>
        <dd>{payable.baseLabel}</dd>
      </div>
      <div>
        <dt>Taxes &amp; fees</dt>
        <dd>{payable.taxesLabel}</dd>
      </div>
      <div>
        <dt>Convenience fee</dt>
        <dd>{payable.serviceFeeLabel}</dd>
      </div>
      {payable.extras > 0 ? (
        <div>
          <dt>Extras</dt>
          <dd>{payable.extrasLabel}</dd>
        </div>
      ) : null}
      {payable.discount > 0 ? (
        <div className="is-discount">
          <dt>Discounts</dt>
          <dd>−{payable.discountLabel}</dd>
        </div>
      ) : null}
      {payable.wallet > 0 ? (
        <div className="is-discount">
          <dt>Wallet credit</dt>
          <dd>−{payable.walletLabel}</dd>
        </div>
      ) : null}
      <div className="is-total">
        <dt>Grand total</dt>
        <dd>{payable.totalPayableLabel}</dd>
      </div>
    </dl>
  );

  const showMobile = variant === "mobile" || variant === "all";
  const showDesktop = variant === "desktop" || variant === "all";

  return (
    <>
      {showMobile ? (
        <>
          <details className="checkout-price-mobile">
            <summary className="checkout-price-mobile-summary">
              <span>Price breakdown</span>
              <strong>{payable.totalPayableLabel}</strong>
            </summary>
            <div className="checkout-price-mobile-body">{rows}</div>
          </details>
          <div className="price-summary-mobile-bar">
            <div>
              <p className="price-summary-mobile-total">{payable.totalPayableLabel}</p>
              <p className="price-summary-mobile-meta">Grand total</p>
            </div>
            <button
              type="button"
              className="btn-primary"
              disabled={disabled || processing}
              onClick={onPay}
            >
              {processing ? "…" : "Pay now"}
            </button>
          </div>
        </>
      ) : null}

      {showDesktop ? (
        <aside className="price-summary checkout-price-panel pay-sidebar">
          <h2 className="price-summary-title">Payment summary</h2>
          {fareLabel ? (
            <p className="pay-sidebar-fare">Selected fare · {fareLabel}</p>
          ) : null}
          {rows}
          <div className="pay-quick-methods">
            <p className="pay-quick-label">Instant methods</p>
            <div className="pay-quick-row">
              {[
                { id: "upi", label: "UPI" },
                { id: "card", label: "Cards" },
                { id: "netbanking", label: "Net Banking" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="pay-quick-chip"
                  onClick={() => {
                    onQuickMethod?.(item.id);
                    document.getElementById("payment")?.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    });
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            className="btn-primary price-summary-cta pay-now-cta"
            disabled={disabled || processing}
            onClick={onPay}
          >
            {processing ? "Processing…" : payLabel || "Pay now"}
          </button>
          <div className="pay-secure-row" aria-label="Secure payment">
            <span className="pay-secure-badge">SSL secured</span>
            <span className="pay-secure-badge">PCI aware</span>
            <span className="pay-secure-badge">256-bit</span>
          </div>
          <p className="price-summary-note">
            Base fare, taxes, convenience fee, and credits are itemised above.
          </p>
          <p className="dev-note">Payment is simulated — no real charge.</p>
        </aside>
      ) : null}
    </>
  );
}
