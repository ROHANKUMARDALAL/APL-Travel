"use client";

import Link from "next/link";
import { getActiveMarketId } from "@/data/markets";
import { formatDuration, formatPriceParts } from "@/lib/resultsHelpers";

export default function TransferResultCard({ item, detailsHref }) {
  const price = formatPriceParts(item, getActiveMarketId());

  return (
    <article className="result-card bus-card">
      <div className="bus-card-main">
        <div className="bus-card-body">
          <h2 className="result-card-route">
            {item.pickup?.name} → {item.dropoff?.name}
          </h2>
          <p className="result-card-kicker">
            {item.vehicleName} · {item.vehicleCategory}
          </p>
          <p className="result-card-meta">
            Up to {item.maxPassengers} passengers · {item.maxLuggage} bags
            {item.estimatedDurationMinutes
              ? ` · ~${formatDuration(item.estimatedDurationMinutes)}`
              : ""}
          </p>
          <ul className="hotel-amenities bus-amenities">
            {(item.inclusions || []).slice(0, 3).map((row) => (
              <li key={row}>{row}</li>
            ))}
          </ul>
          <p className="result-card-policy">{item.cancellation}</p>
        </div>
      </div>
      <div className="result-card-price">
        <p className="price-total">{price.totalLabel}</p>
        <p className="price-breakdown">Private transfer · all-in customer price</p>
        <Link className="btn-primary result-card-cta" href={detailsHref}>
          Select
        </Link>
      </div>
    </article>
  );
}
