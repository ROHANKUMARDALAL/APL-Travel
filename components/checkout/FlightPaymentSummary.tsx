"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDuration, formatShortDate } from "@/lib/resultsHelpers";
import { getActiveMarketId } from "@/data/markets";

type FlightEndpoint = {
  city?: string;
  code?: string;
  time?: string;
  date?: string;
};

type FlightItem = {
  airline?: string;
  airlineCode?: string;
  flightNumber?: string;
  cabin?: string;
  baggage?: string;
  cabinKg?: number | null;
  checkinKg?: number | null;
  durationMinutes?: number;
  stops?: number;
  stopLabel?: string;
  from?: FlightEndpoint;
  to?: FlightEndpoint;
  selectedFareLabel?: string;
  selectedFare?: {
    label?: string;
    baggage?: string;
    cabinKg?: number | null;
    checkinKg?: number | null;
    cabin?: string;
  } | null;
};

type Traveller = {
  id?: string;
  type?: string;
  title?: string;
  firstName?: string;
  lastName?: string;
};

type SearchQuery = {
  depart?: string;
  return?: string;
  adults?: string | number;
  children?: string | number;
  infants?: string | number;
};

type FlightPaymentSummaryProps = {
  item: FlightItem;
  searchQuery?: SearchQuery;
  travellers?: Traveller[];
  fareLabel?: string;
  detailsHref: string;
  resultsHref: string;
};

function typeLabel(type?: string) {
  if (type === "child") return "Child";
  if (type === "infant") return "Infant";
  return "Adult";
}

function EndpointBlock({
  endpoint,
  fallbackDate,
  align = "start",
}: {
  endpoint: FlightEndpoint;
  fallbackDate?: string;
  align?: "start" | "end";
}) {
  const marketId = getActiveMarketId();
  return (
    <div className={`pay-flight-endpoint is-${align}`}>
      <p className="pay-flight-city">{endpoint.city || "—"}</p>
      <span className="pay-flight-code">{endpoint.code || "—"}</span>
      <p className="pay-flight-time">
        <span className="pay-flight-ico" aria-hidden="true">
          ◷
        </span>
        {endpoint.time || "—"}
      </p>
      <p className="pay-flight-date">
        <span className="pay-flight-ico" aria-hidden="true">
          ▤
        </span>
        {formatShortDate(endpoint.date || fallbackDate, marketId) || "—"}
      </p>
    </div>
  );
}

export default function FlightPaymentSummary({
  item,
  searchQuery = {},
  travellers = [],
  fareLabel = "",
  detailsHref,
  resultsHref,
}: FlightPaymentSummaryProps) {
  const [passengersOpen, setPassengersOpen] = useState(false);
  const marketId = getActiveMarketId();
  const fare =
    fareLabel ||
    item.selectedFare?.label ||
    item.selectedFareLabel ||
    "Standard";
  const cabin = item.selectedFare?.cabin || item.cabin || "Economy";
  const cabinKg = item.selectedFare?.cabinKg ?? item.cabinKg ?? 7;
  const checkinKg = item.selectedFare?.checkinKg ?? item.checkinKg ?? 15;
  const baggage =
    item.selectedFare?.baggage ||
    item.baggage ||
    `${cabinKg} kg cabin · ${checkinKg} kg check-in`;
  const stopsLabel =
    item.stops === 0 ? "Non-stop" : item.stopLabel || `${item.stops || 0} stop`;
  const adultCount = Number(searchQuery.adults ?? 1) || 1;
  const childCount = Number(searchQuery.children ?? 0) || 0;
  const infantCount = Number(searchQuery.infants ?? 0) || 0;
  const paxSummary = [
    `${adultCount} Adult${adultCount === 1 ? "" : "s"}`,
    `${childCount} Child${childCount === 1 ? "" : "ren"}`,
    infantCount ? `${infantCount} Infant${infantCount === 1 ? "" : "s"}` : null,
  ]
    .filter(Boolean)
    .join(", ");
  const namedTravellers = (travellers || []).filter(
    (person) => person.firstName || person.lastName,
  );

  return (
    <section className="pay-flight-summary">
      <div className="pay-flight-summary-head">
        <div>
          <p className="pay-flight-kicker">Flight payment</p>
          <h2 className="pay-flight-title">Review your itinerary</h2>
        </div>
        <div className="checkout-change-links">
          <Link href={detailsHref}>Change details</Link>
          <Link href={resultsHref}>Change flight</Link>
        </div>
      </div>

      <article className="pay-flight-card">
        <div className="pay-flight-trip-bar">
          <EndpointBlock
            endpoint={item.from || {}}
            fallbackDate={searchQuery.depart}
            align="start"
          />

          <div className="pay-flight-path">
            <div className="pay-flight-airline">
              <span className="pay-flight-airline-badge" aria-hidden="true">
                {item.airlineCode || "FL"}
              </span>
              <div>
                <p className="pay-flight-airline-name">{item.airline || "Airline"}</p>
                <p className="pay-flight-number">
                  {item.flightNumber || `${item.airlineCode || "APL"} · ${cabin}`}
                </p>
              </div>
            </div>

            <div className="pay-flight-line-wrap" aria-hidden="true">
              <span className="pay-flight-dot" />
              <span className="pay-flight-line" />
              <span className="pay-flight-plane">✈</span>
              <span className="pay-flight-line" />
              <span className="pay-flight-dot is-end" />
            </div>

            <div className="pay-flight-meta-row">
              <span className="pay-flight-duration">
                {formatDuration(item.durationMinutes || 0)}
              </span>
              <span className="pay-flight-stops">{stopsLabel}</span>
            </div>
          </div>

          <EndpointBlock
            endpoint={item.to || {}}
            fallbackDate={item.to?.date || searchQuery.depart}
            align="end"
          />
        </div>

        {searchQuery.return ? (
          <p className="pay-flight-return-note">
            Return {formatShortDate(searchQuery.return, marketId)}
          </p>
        ) : null}

        <div className="pay-flight-badges">
          <span className="pay-badge is-cabin">{cabin}</span>
          <span className="pay-badge is-fare">{fare}</span>
          <span className="pay-badge is-bag">
            Cabin {cabinKg} kg · Check-in {checkinKg} kg
          </span>
        </div>

        <div className="pay-flight-pax">
          <button
            type="button"
            className={`pay-pax-toggle ${passengersOpen ? "is-open" : ""}`}
            aria-expanded={passengersOpen}
            onClick={() => setPassengersOpen((prev) => !prev)}
          >
            <span className="pay-badge is-pax">{paxSummary}</span>
            <span className="pay-pax-hint">
              {passengersOpen ? "Hide passengers" : "Preview passengers"}
            </span>
          </button>

          {passengersOpen ? (
            <ul className="pay-pax-chips">
              {(namedTravellers.length ? namedTravellers : travellers).map(
                (person, index) => {
                  const name = [person.title, person.firstName, person.lastName]
                    .filter(Boolean)
                    .join(" ");
                  return (
                    <li key={person.id || `${person.type}-${index}`} className="pay-pax-chip">
                      <span className="pay-pax-type">{typeLabel(person.type)}</span>
                      <span>{name || `Traveller ${index + 1}`}</span>
                    </li>
                  );
                },
              )}
              {!travellers.length ? (
                <li className="pay-pax-chip is-empty">Passenger details on file</li>
              ) : null}
            </ul>
          ) : null}
        </div>

        <p className="pay-flight-baggage-note">{baggage}</p>
      </article>
    </section>
  );
}
