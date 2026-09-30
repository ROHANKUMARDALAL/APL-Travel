"use client";

import Link from "next/link";
import { BOOKING_EXTRAS, getHotelRooms, nightsFromSearch } from "@/lib/booking";
import { formatShortDate, travellerLabel } from "@/lib/resultsHelpers";
import { getActiveMarketId } from "@/data/markets";

export default function BookingSummaryCard({
  service,
  item,
  draft,
  detailsHref,
  resultsHref,
}) {
  const marketId = getActiveMarketId();
  const query = draft.searchQuery || {};
  const extrasCatalog = BOOKING_EXTRAS[service] || [];
  const selectedExtras = extrasCatalog.filter((extra) =>
    (draft.extras || []).includes(extra.id),
  );
  const room =
    service === "hotel"
      ? getHotelRooms(item.id).find((r) => r.id === draft.selectedRoomId)
      : null;

  let title = "";
  let rows = [];

  if (service === "flight") {
    title = `${item.from.city} (${item.from.code}) → ${item.to.city} (${item.to.code})`;
    rows = [
      ["Dates", [formatShortDate(query.depart, marketId), query.return ? `Return ${formatShortDate(query.return, marketId)}` : null].filter(Boolean).join(" · ")],
      ["Travellers", travellerLabel(query)],
      ["Airline", item.airline],
      ["Cabin", item.cabin],
      ["Baggage", item.baggage],
    ];
  } else if (service === "hotel") {
    const nights = nightsFromSearch(query);
    title = item.name;
    rows = [
      ["Property", item.location],
      ["Room", room?.name || item.roomType],
      [
        "Check-in / out",
        `${formatShortDate(query.checkIn, marketId)} → ${formatShortDate(query.checkOut, marketId)}`,
      ],
      ["Nights", String(nights)],
      ["Guests / rooms", `${query.guests || 2} guests · ${query.rooms || 1} room`],
    ];
  } else {
    title = `${item.from.city} → ${item.to.city}`;
    rows = [
      ["Date", formatShortDate(query.date, marketId)],
      ["Operator", item.operator],
      ["Seat", draft.selectedSeat || "Not selected"],
      ["Bus type", item.busType],
      ["Passengers", String(query.passengers || query.adults || 1)],
    ];
  }

  return (
    <section className="checkout-section">
      <div className="checkout-section-head">
        <h2 className="checkout-section-title">Booking summary</h2>
        <div className="checkout-change-links">
          <Link href={detailsHref}>Change details</Link>
          <Link href={resultsHref}>Change selection</Link>
        </div>
      </div>
      <p className="result-card-kicker">{service}</p>
      <h3 className="checkout-booking-title">{title}</h3>
      <dl className="checkout-fact-list">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {selectedExtras.length ? (
        <div className="checkout-extras-chip-row">
          {selectedExtras.map((extra) => (
            <span key={extra.id} className="checkout-chip">
              {extra.label}
            </span>
          ))}
        </div>
      ) : (
        <p className="result-card-meta">No extras selected</p>
      )}
    </section>
  );
}

export function TravellerReview({
  service,
  draft,
  detailsHref,
  onChangeContact,
  onChooseTraveller,
}) {
  let lines = [];

  if (service === "flight") {
    lines = (draft.travellers || []).map((person, index) => {
      const name = [person.title, person.firstName, person.lastName]
        .filter(Boolean)
        .join(" ");
      return `Traveller ${index + 1}: ${name || "Incomplete"}`;
    });
  } else if (service === "hotel") {
    const lead = draft.travellers?.lead;
    lines = [
      `Lead guest: ${[lead?.firstName, lead?.lastName].filter(Boolean).join(" ") || "Incomplete"}`,
    ];
    (draft.travellers?.additional || []).forEach((guest, index) => {
      const name = [guest.firstName, guest.lastName].filter(Boolean).join(" ");
      if (name) lines.push(`Guest ${index + 2}: ${name}`);
    });
  } else {
    const p = draft.travellers || {};
    lines = [
      `Passenger: ${[p.firstName, p.lastName].filter(Boolean).join(" ") || "Incomplete"}`,
    ];
  }

  return (
    <section className="checkout-section">
      <div className="checkout-section-head">
        <h2 className="checkout-section-title">
          {service === "hotel" ? "Guest review" : "Traveller review"}
        </h2>
        <Link href={`${detailsHref}#traveller`}>Change</Link>
      </div>
      <div className="checkout-traveller-actions">
        {service === "flight"
          ? (draft.travellers || []).map((person, index) => (
              <button
                key={person.id || index}
                type="button"
                className="traveller-list-btn"
                onClick={() =>
                  onChooseTraveller?.({ kind: "flight", index, type: person.type || "adult" })
                }
              >
                Choose traveller {index + 1}
                {person.type ? ` · ${person.type}` : ""} from list
              </button>
            ))
          : (
              <button
                type="button"
                className="traveller-list-btn"
                onClick={() => onChooseTraveller?.({ kind: service === "hotel" ? "hotel" : "bus" })}
              >
                Choose from traveller list
              </button>
            )}
      </div>
      <ul className="checkout-review-list">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <div className="checkout-contact-box">
        <h3 className="booking-subsection-title">Contact information</h3>
        <p className="booking-section-copy">
          Filled from your profile when you are signed in. Change the email or phone for this booking if you need to.
        </p>
        <div className="booking-form-grid">
          <div className="search-field">
            <label className="field-label" htmlFor="checkout-email">
              Email
            </label>
            <input
              id="checkout-email"
              className="field-input"
              type="email"
              autoComplete="email"
              value={draft.contact?.email || ""}
              onChange={(event) =>
                onChangeContact?.({
                  ...(draft.contact || {}),
                  email: event.target.value,
                })
              }
            />
          </div>
          <div className="search-field">
            <label className="field-label" htmlFor="checkout-phone">
              Phone
            </label>
            <input
              id="checkout-phone"
              className="field-input"
              type="tel"
              autoComplete="tel"
              value={draft.contact?.phone || ""}
              onChange={(event) =>
                onChangeContact?.({
                  ...(draft.contact || {}),
                  phone: event.target.value,
                })
              }
            />
          </div>
        </div>
      </div>
    </section>
  );
}
