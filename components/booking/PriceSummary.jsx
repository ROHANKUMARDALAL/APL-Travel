"use client";

import { formatMoney, getActiveMarketId } from "@/data/markets";

export default function PriceSummary({
  totals,
  extras = [],
  nights = 1,
  onContinue,
  continueLabel = "Continue to checkout",
  continueDisabled = false,
  stickyMobile = true,
}) {
  const marketId = getActiveMarketId();

  return (
    <>
      <aside className="price-summary">
        <h2 className="price-summary-title">Price summary</h2>
        <dl className="price-summary-rows">
          <div>
            <dt>Base price{nights > 1 ? ` · ${nights} nights` : ""}</dt>
            <dd>{totals.baseLabel}</dd>
          </div>
          {extras.length ? (
            <div>
              <dt>Extras</dt>
              <dd>{totals.extrasLabel}</dd>
            </div>
          ) : null}
          <div>
            <dt>Taxes & fees</dt>
            <dd>{totals.taxesLabel}</dd>
          </div>
          {totals.discount > 0 ? (
            <div className="is-discount">
              <dt>Discount</dt>
              <dd>−{totals.discountLabel}</dd>
            </div>
          ) : null}
          <div className="is-total">
            <dt>Total</dt>
            <dd>{totals.totalLabel}</dd>
          </div>
        </dl>

        {extras.length ? (
          <ul className="price-summary-extras">
            {extras.map((extra) => (
              <li key={extra.id}>
                <span>{extra.label}</span>
                <span>
                  {formatMoney(
                    extra.amount ?? 0,
                    marketId,
                  )}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="price-summary-note">No paid extras selected</p>
        )}

        <p className="price-summary-note">
          Taxes shown here are included. Additional booking fees may appear at
          checkout.
        </p>

        <button
          type="button"
          className="btn-primary price-summary-cta"
          disabled={continueDisabled}
          onClick={onContinue}
        >
          {continueLabel}
        </button>
      </aside>

      {stickyMobile ? (
        <div className="price-summary-mobile-bar">
          <div>
            <p className="price-summary-mobile-total">{totals.totalLabel}</p>
            <p className="price-summary-mobile-meta">Incl. taxes & fees</p>
          </div>
          <button
            type="button"
            className="btn-primary"
            disabled={continueDisabled}
            onClick={onContinue}
          >
            Continue
          </button>
        </div>
      ) : null}
    </>
  );
}

export function BookingNotFound({ resultsHref }) {
  return (
    <div className="booking-not-found">
      <h1 className="section-title">Booking option not found</h1>
      <p className="section-copy">
        This selection is no longer available or the link is incomplete. Return to
        results and choose another option.
      </p>
      <a className="btn-primary" href={resultsHref || "/"}>
        Back to results
      </a>
    </div>
  );
}
