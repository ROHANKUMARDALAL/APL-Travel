"use client";

import { getActiveMarketId } from "@/data/markets";
import { formatDuration, formatPriceParts } from "@/lib/resultsHelpers";

function realNote(value) {
  const text = String(value || "").trim();
  if (!text || /^mock\b/i.test(text)) return "";
  return text;
}

export default function BusResultCard({ item, onSelect }) {
  const price = formatPriceParts(item, getActiveMarketId());
  const amenities = Array.isArray(item.amenities) ? item.amenities.filter(Boolean) : [];
  const cancellation = realNote(item.cancellation);
  const seats = Number(item.seatsLeft);
  const showSeats = Number.isFinite(seats);

  return (
    <article className="result-card bus-card">
      <div className="bus-card-main">
        <div className="bus-card-body">
          <p className="bus-card-operator">{item.operator}</p>
          {item.busType ? <p className="bus-card-type">{item.busType}</p> : null}
          <div className="flight-timeline bus-timeline">
            <div>
              <p className="flight-time">{item.from.time}</p>
              {item.from.station ? <p className="flight-code">{item.from.station}</p> : null}
              {item.from.city ? <p className="result-card-meta">{item.from.city}</p> : null}
            </div>
            <div className="flight-duration-wrap">
              {Number(item.durationMinutes) > 0 ? <p className="flight-duration">{formatDuration(item.durationMinutes)}</p> : null}
              <div className="flight-line" aria-hidden="true" />
            </div>
            <div className="bus-timeline-end">
              <p className="flight-time">{item.to.time}</p>
              {item.to.station ? <p className="flight-code">{item.to.station}</p> : null}
              {item.to.city ? <p className="result-card-meta">{item.to.city}</p> : null}
            </div>
          </div>
          {amenities.length ? (
            <ul className="hotel-amenities bus-amenities">
              {amenities.map((amenity) => (
                <li key={amenity}>{amenity}</li>
              ))}
            </ul>
          ) : null}
          <div className="bus-card-facts">
            {showSeats ? <p className="result-card-meta">{seats} seats left</p> : null}
            {cancellation ? <p className="result-card-policy">{cancellation}</p> : null}
          </div>
        </div>
      </div>
      <div className="result-card-price">
        <p className="price-total">{price.totalLabel}</p>
        {price.taxes > 0 ? (
          <p className="price-breakdown">
            {price.baseLabel} + {price.taxesLabel} taxes
          </p>
        ) : null}
        <button type="button" className="btn-primary result-card-cta" onClick={() => onSelect?.(item)}>
          Select Bus
        </button>
      </div>
    </article>
  );
}
