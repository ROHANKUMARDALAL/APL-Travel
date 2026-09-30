"use client";

import Link from "next/link";
import { formatDuration, formatPriceParts } from "@/lib/resultsHelpers";
import { getActiveMarketId } from "@/data/markets";

function FlightLeg({ label, from, to, durationMinutes, stops, stopLabel }) {
  return (
    <div className="flight-leg">
      {label ? <p className="flight-leg-label">{label}</p> : null}
      <div className="flight-timeline">
        <div>
          <p className="flight-time">{from.time}</p>
          <p className="flight-code">
            {from.city} · {from.code}
          </p>
        </div>
        <div className="flight-duration-wrap">
          <p className="flight-duration">{formatDuration(durationMinutes)}</p>
          <div className="flight-line" aria-hidden="true" />
          <p className="flight-stops">{stops === 0 ? "Non-stop" : stopLabel || `${stops} stop`}</p>
        </div>
        <div className="flight-time-end">
          <p className="flight-time">{to.time}</p>
          <p className="flight-code">
            {to.city} · {to.code}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function FlightResultCard({ item, detailsHref }) {
  const price = formatPriceParts(item, getActiveMarketId());
  const returning = item.returnLeg;

  return (
    <article className={`result-card flight-card ${returning ? "flight-card-return" : ""}`}>
      <div className="flight-card-main">
        <div className="airline-badge" aria-hidden="true">
          {item.airlineCode}
        </div>
        <div className="flight-card-body">
          <h2 className="result-card-route">
            {returning
              ? `${item.from.city} ⇄ ${item.to.city}`
              : `${item.from.city} → ${item.to.city}`}
          </h2>
          <p className="result-card-kicker">
            {returning && returning.airline && returning.airline !== item.airline
              ? `${item.airline} · ${returning.airline}`
              : item.airline}
          </p>
          <FlightLeg
            label={returning ? "Depart" : ""}
            from={item.from}
            to={item.to}
            durationMinutes={item.durationMinutes}
            stops={item.stops}
            stopLabel={item.stopLabel}
          />
          {returning ? (
            <FlightLeg
              label="Return"
              from={returning.from}
              to={returning.to}
              durationMinutes={returning.durationMinutes}
              stops={returning.stops}
              stopLabel={returning.stopLabel}
            />
          ) : null}
          <p className="result-card-meta">
            {item.cabin} · {item.baggage}
          </p>
          <p className="result-card-policy">{item.fareConditions}</p>
        </div>
      </div>
      <div className="result-card-price">
        <p className="price-total">{price.totalLabel}</p>
        <p className="price-breakdown">
          {price.pax > 1 ? `${price.pax} travellers · ` : ""}
          {returning ? "Outbound + return" : `${price.baseLabel} + ${price.taxesLabel} taxes`}
        </p>
        <p className="price-fee-note">Booking fees may apply at checkout</p>
        <Link className="btn-primary result-card-cta" href={detailsHref}>
          Select
        </Link>
      </div>
    </article>
  );
}
