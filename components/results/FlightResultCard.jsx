"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatDuration, formatPriceParts, getPriceParts } from "@/lib/resultsHelpers";
import { formatMoney, getActiveMarketId } from "@/data/markets";

function savingsNote(savings, marketId) {
  if (!savings || !(Number(savings.amount) > 0)) return "";
  const saved = formatMoney(savings.amount, marketId, savings.currency);
  if (savings.adjustmentType !== "PERCENTAGE") return `${saved} off`;
  const cap = Number(savings.maxAmount);
  const capLabel = Number.isFinite(cap) && cap > 0
    ? `, up to ${formatMoney(cap, marketId, savings.currency)}`
    : "";
  return `${savings.value}% off${capLabel}`;
}

function FlightLeg({ label, from, to, durationMinutes, stops, stopLabel }) {
  const direct = stops === 0;
  return (
    <div className="fr-leg">
      {label ? <p className="fr-leg-label">{label}</p> : null}
      <div className="fr-times">
        <div>
          <p className="fr-clock">{from.time || "—"}</p>
          <p className="fr-place">{from.code}</p>
          {from.date ? <p className="fr-date">{from.date}</p> : null}
        </div>
        <div className="fr-path">
          <p>{formatDuration(durationMinutes)}</p>
          <span className="fr-path-line" aria-hidden="true" />
          <strong className={direct ? "is-direct" : ""}>{direct ? "Direct" : stopLabel || `${stops} stop`}</strong>
        </div>
        <div className="fr-times-end">
          <p className="fr-clock">{to.time || "—"}</p>
          <p className="fr-place">{to.code}</p>
          {to.date ? <p className="fr-date">{to.date}</p> : null}
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
    <li className={ok ? "is-yes" : "is-no"}>
      <span aria-hidden="true">{ok ? "✓" : "–"}</span>
      {children}
    </li>
  );
}

export default function FlightResultCard({ item, detailsHref, badges = [] }) {
  const marketId = getActiveMarketId();
  const fares = Array.isArray(item.fares) && item.fares.length ? item.fares : null;
  const [expanded, setExpanded] = useState(false);
  const [selectedFareId, setSelectedFareId] = useState(item.selectedFareId || fares?.[0]?.id || null);
  const selectedFare = useMemo(() => {
    if (!fares) return null;
    return fares.find((fare) => fare.id === selectedFareId) || fares[0];
  }, [fares, selectedFareId]);
  const pricedItem = selectedFare ? { ...item, prices: selectedFare.prices, paxCount: item.paxCount } : item;
  const price = formatPriceParts(pricedItem, marketId);
  const returning = item.returnLeg;

  function fareHref(fare) {
    if (!fare?.aplFareId && !fare?.id) return detailsHref;
    const params = new URLSearchParams();
    params.set("fareId", fare.aplFareId || fare.id);
    const joiner = detailsHref.includes("?") ? "&" : "?";
    return `${detailsHref}${joiner}${params.toString()}`;
  }

  const href = fareHref(selectedFare);

  return (
    <article className={`fr-card ${expanded ? "is-open" : ""}`}>
      <div className="fr-main">
        <div className="fr-airline">
          <span className="fr-logo" aria-hidden="true">{item.airlineCode}</span>
          <div>
            <p className="fr-airline-name">{item.airline}</p>
            {item.flightNumber ? <p className="fr-flight-no">{item.flightNumber}</p> : null}
            {badges.length ? (
              <p className="fr-badges">
                {badges.map((badge) => <span key={badge}>{badge}</span>)}
              </p>
            ) : null}
          </div>
        </div>

        <div className="fr-route">
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
              label={returning.flightNumber ? `Return · ${returning.flightNumber}` : "Return"}
              from={returning.from}
              to={returning.to}
              durationMinutes={returning.durationMinutes}
              stops={returning.stops}
              stopLabel={returning.stopLabel}
            />
          ) : null}
        </div>

        <div className="fr-buy">
          <p className="fr-fare-name">{selectedFare?.label || item.cabin || "Fare"}</p>
          <p className="fr-price">{price.totalLabel}</p>
          <p className="fr-price-note">
            {price.pax > 1 ? `${price.pax} travellers` : "Final fare"}
            {selectedFare?.baggage ? ` · ${selectedFare.baggage}` : ""}
          </p>
          {selectedFare?.savings?.amount > 0 ? <p className="fr-save">{savingsNote(selectedFare.savings, marketId)}</p> : null}
          <div className="fr-actions">
            {fares ? (
              <button
                type="button"
                className="fr-fare-btn"
                aria-expanded={expanded}
                onClick={() => setExpanded((open) => !open)}
              >
                Fare options
                <span aria-hidden="true">{expanded ? "▴" : "▾"}</span>
              </button>
            ) : null}
            <Link className="fr-details" href={href}>View details</Link>
          </div>
        </div>
      </div>

      {fares && expanded ? (
        <div className="fr-drawer">
          <div className="fr-fare-grid" role="listbox" aria-label="Available fares">
            {fares.map((fare) => {
              const active = fare.id === selectedFare?.id;
              const farePrice = getPriceParts({ prices: fare.prices, paxCount: item.paxCount }, marketId);
              return (
                <div
                  key={fare.id}
                  role="option"
                  aria-selected={active}
                  tabIndex={0}
                  className={`fr-fare is-${fareTone(fare.label)} ${active ? "is-selected" : ""}`}
                  onClick={() => setSelectedFareId(fare.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedFareId(fare.id);
                    }
                  }}
                >
                  <span className="fr-fare-label">{fare.label}</span>
                  <strong>{formatMoney(farePrice.total, marketId, farePrice.currency)}</strong>
                  <ul>
                    <Inclusion ok>Cabin {fare.cabinKg ?? "—"} kg</Inclusion>
                    <Inclusion ok>Check-in {fare.checkinKg ?? "—"} kg</Inclusion>
                    <Inclusion ok={Boolean(fare.refundable)}>{fare.cancelFee || (fare.refundable ? "Refundable" : "Non-refundable")}</Inclusion>
                    <Inclusion ok={Boolean(fare.meals)}>{fare.meals ? "Meal included" : "No meal"}</Inclusion>
                  </ul>
                  <Link href={fareHref(fare)} onClick={(event) => event.stopPropagation()}>Select flight</Link>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </article>
  );
}
