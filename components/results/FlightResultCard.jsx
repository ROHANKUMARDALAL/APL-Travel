"use client";

import Link from "next/link";
import { formatDuration, formatPriceParts } from "@/lib/resultsHelpers";
import { getActiveMarketId } from "@/data/markets";

export default function FlightResultCard({ item, detailsHref }) {
  const price = formatPriceParts(item, getActiveMarketId());

  return (
    <article className="result-card flight-card">
      <div className="flight-card-main">
        <div className="airline-badge" aria-hidden="true">
          {item.airlineCode}
        </div>
        <div className="flight-card-body">
          <h2 className="result-card-route">
            {item.from.city} → {item.to.city}
          </h2>
          <p className="result-card-kicker">{item.airline}</p>
          <div className="flight-timeline">
            <div>
              <p className="flight-time">{item.from.time}</p>
              <p className="flight-code">{item.from.code}</p>
            </div>
            <div className="flight-duration-wrap">
              <p className="flight-duration">{formatDuration(item.durationMinutes)}</p>
              <div className="flight-line" aria-hidden="true" />
              <p className="flight-stops">
                {item.stops === 0 ? "Non-stop" : item.stopLabel || `${item.stops} stop`}
              </p>
            </div>
            <div>
              <p className="flight-time">{item.to.time}</p>
              <p className="flight-code">{item.to.code}</p>
            </div>
          </div>
          <p className="result-card-meta">
            {item.cabin} · {item.baggage}
          </p>
          <p className="result-card-policy">{item.fareConditions}</p>
        </div>
      </div>
      <div className="result-card-price">
        <p className="price-total">{price.totalLabel}</p>
        <p className="price-breakdown">
          {price.baseLabel} + {price.taxesLabel} taxes
        </p>
        <p className="price-fee-note">Booking fees may apply at checkout</p>
        <Link className="btn-primary result-card-cta" href={detailsHref}>
          Select
        </Link>
      </div>
    </article>
  );
}
