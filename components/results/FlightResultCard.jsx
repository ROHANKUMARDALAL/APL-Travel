"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatDuration, formatPriceParts, getPriceParts } from "@/lib/resultsHelpers";
import { formatMoney, getActiveMarketId } from "@/data/markets";

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
          {from.date ? <p className="flight-date-chip">{from.date}</p> : null}
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
          {to.date ? <p className="flight-date-chip">{to.date}</p> : null}
        </div>
      </div>
    </div>
  );
}

function fareTone(label) {
  const key = String(label || "").toLowerCase();
  if (key.includes("corp")) return "corporate";
  if (key.includes("flex") || key.includes("refund")) return "flexi";
  if (key.includes("publish") || key.includes("regular")) return "publish";
  return "saver";
}

function Inclusion({ ok, children }) {
  return (
    <li className={`flight-fare-inclusion ${ok ? "is-yes" : "is-no"}`}>
      <span aria-hidden="true">{ok ? "✓" : "✕"}</span>
      <span>{children}</span>
    </li>
  );
}

export default function FlightResultCard({ item, detailsHref }) {
  const marketId = getActiveMarketId();
  const fares = Array.isArray(item.fares) && item.fares.length ? item.fares : null;
  const [expanded, setExpanded] = useState(false);
  const [selectedFareId, setSelectedFareId] = useState(
    item.selectedFareId || fares?.[0]?.id || null,
  );

  const selectedFare = useMemo(() => {
    if (!fares) return null;
    return fares.find((fare) => fare.id === selectedFareId) || fares[0];
  }, [fares, selectedFareId]);

  const pricedItem = selectedFare
    ? { ...item, prices: selectedFare.prices, paxCount: item.paxCount }
    : item;
  const price = formatPriceParts(pricedItem, marketId);
  const returning = item.returnLeg;

  function fareHref(fare) {
    if (!fare?.aplFareId && !fare?.id) return detailsHref;
    const params = new URLSearchParams();
    if (fare.aplFareId) params.set("fareId", fare.aplFareId);
    else if (fare.id) params.set("fareId", fare.id);
    const joiner = detailsHref.includes("?") ? "&" : "?";
    return `${detailsHref}${joiner}${params.toString()}`;
  }

  return (
    <article
      className={`result-card flight-card flight-card-rich ${returning ? "flight-card-return" : ""} ${expanded ? "is-expanded" : ""}`}
    >
      <div
        className="flight-card-main"
        role={fares ? "button" : undefined}
        tabIndex={fares ? 0 : undefined}
        aria-expanded={fares ? expanded : undefined}
        onClick={fares ? () => setExpanded((prev) => !prev) : undefined}
        onKeyDown={
          fares
            ? (event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setExpanded((prev) => !prev);
                }
              }
            : undefined
        }
      >
        <div className="airline-badge" aria-hidden="true">
          {item.airlineCode}
        </div>
        <div className="flight-card-body">
          <div className="flight-card-heading">
            <div>
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
            </div>
            <span className="flight-card-chip">
              {selectedFare?.cabin || item.cabin} · {formatDuration(item.durationMinutes)}
            </span>
          </div>

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
            From {price.totalLabel}
            {selectedFare ? ` · ${selectedFare.label}` : ""}
            {` · ${item.baggage || selectedFare?.baggage || "Baggage as per fare"}`}
          </p>
        </div>
      </div>

      <div className="result-card-price">
        <p className="price-total">{price.totalLabel}</p>
        <p className="price-breakdown">
          {selectedFare ? `${selectedFare.label} · ` : ""}
          {price.pax > 1 ? `${price.pax} travellers · ` : ""}
          {returning ? "Outbound + return" : `${price.baseLabel} + ${price.taxesLabel} taxes`}
        </p>
        {fares ? (
          <button
            type="button"
            className={`flight-fare-toggle ${expanded ? "is-open" : ""}`}
            aria-expanded={expanded}
            onClick={(event) => {
              event.stopPropagation();
              setExpanded((prev) => !prev);
            }}
          >
            {expanded ? "Hide fares" : `View fares (${fares.length})`}
          </button>
        ) : (
          <Link className="btn-primary result-card-cta" href={detailsHref}>
            Select
          </Link>
        )}
      </div>

      {fares && expanded ? (
        <div className="flight-fare-drawer">
          <div className="flight-fare-row" role="listbox" aria-label="Available fares">
            {fares.map((fare) => {
              const active = fare.id === selectedFare?.id;
              const farePrice = getPriceParts(
                { prices: fare.prices, paxCount: item.paxCount },
                marketId,
              );
              return (
                <div
                  key={fare.id}
                  role="option"
                  aria-selected={active}
                  className={`flight-fare-card is-${fareTone(fare.label)} ${active ? "is-selected" : ""}`}
                  onClick={() => setSelectedFareId(fare.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedFareId(fare.id);
                    }
                  }}
                  tabIndex={0}
                >
                  <span className={`flight-fare-badge is-${fareTone(fare.label)}`}>
                    {fare.label}
                  </span>
                  <span className="flight-fare-price">
                    {formatMoney(farePrice.total, marketId, farePrice.currency)}
                  </span>
                  <ul className="flight-fare-inclusions">
                    <Inclusion ok>
                      Cabin {fare.cabinKg ?? 7} kg
                    </Inclusion>
                    <Inclusion ok>
                      Check-in {fare.checkinKg ?? 15} kg
                    </Inclusion>
                    <Inclusion ok={Boolean(fare.meals)}>
                      {fare.meals ? "Meal included" : "No meal"}
                    </Inclusion>
                    <Inclusion ok={Boolean(fare.seatSelection)}>
                      {fare.seatSelection ? "Seat selection" : "Seat at check-in"}
                    </Inclusion>
                    <Inclusion ok={Boolean(fare.refundable)}>
                      {fare.cancelFee || (fare.refundable ? "Refundable" : "Non-refundable")}
                    </Inclusion>
                  </ul>
                  <Link
                    className="btn-primary flight-fare-cta"
                    href={fareHref(fare)}
                    onClick={(event) => event.stopPropagation()}
                  >
                    Select fare
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </article>
  );
}
