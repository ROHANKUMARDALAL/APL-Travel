"use client";

import Link from "next/link";
import { getActiveMarketId } from "@/data/markets";
import { formatDuration, formatPriceParts } from "@/lib/resultsHelpers";

export default function BusResultCard({ item, detailsHref }) {
  const price = formatPriceParts(item, getActiveMarketId());

  return (
    <article className="result-card bus-card">
      <div className="bus-card-main">
        <div className="bus-card-body">
          <h2 className="result-card-route">
            {item.from.city} → {item.to.city}
          </h2>
          <p className="result-card-kicker">{item.operator}</p>
          <div className="flight-timeline">
            <div>
              <p className="flight-time">{item.from.time}</p>
              <p className="flight-code">{item.from.station}</p>
              <p className="result-card-meta">{item.from.city}</p>
            </div>
            <div className="flight-duration-wrap">
              <p className="flight-duration">{formatDuration(item.durationMinutes)}</p>
              <div className="flight-line" aria-hidden="true" />
              <p className="flight-stops">{item.busType}</p>
            </div>
            <div>
              <p className="flight-time">{item.to.time}</p>
              <p className="flight-code">{item.to.station}</p>
              <p className="result-card-meta">{item.to.city}</p>
            </div>
          </div>
          <ul className="hotel-amenities bus-amenities">
            {item.amenities.slice(0, 3).map((amenity) => (
              <li key={amenity}>{amenity}</li>
            ))}
          </ul>
          <p className="result-card-meta">
            {item.seatsLeft} seats left
          </p>
          <p className="result-card-policy">{item.cancellation}</p>
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
