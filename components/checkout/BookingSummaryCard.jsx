"use client";

import Link from "next/link";
import { BOOKING_EXTRAS, formatSelectedSeats, getHotelRooms, nightsFromSearch } from "@/lib/booking";
import { AgeField } from "@/components/booking/TravellerForms";
import { formatShortDate } from "@/lib/resultsHelpers";
import { getActiveMarketId } from "@/data/markets";
import FlightPaymentSummary from "@/components/checkout/FlightPaymentSummary";

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

  if (service === "flight") {
    return (
      <>
        <FlightPaymentSummary
          item={item}
          searchQuery={query}
          travellers={Array.isArray(draft.travellers) ? draft.travellers : []}
          fareLabel={draft.selectedFare?.label || item.selectedFareLabel || ""}
          detailsHref={detailsHref}
          resultsHref={resultsHref}
        />
        {selectedExtras.length ? (
          <div className="checkout-extras-chip-row pay-flight-extras">
            {selectedExtras.map((extra) => (
              <span key={extra.id} className="checkout-chip">
                {extra.label}
              </span>
            ))}
          </div>
        ) : null}
      </>
    );
  }

  let title = "";
  let rows = [];

  if (service === "hotel") {
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
      ["Seats", formatSelectedSeats(draft.selectedSeat) || "Not selected"],
      ["Bus type", item.busType],
      ["Passengers", String(Array.isArray(draft.travellers) ? draft.travellers.length : draft.selectedSeat ? 1 : 0)],
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

function GuestAgeCard({ title, name, id, age, error, onAge, onChoose }) {
  return (
    <article className="checkout-guest-card">
      <div className="checkout-guest-head">
        <div>
          <h3 className="guest-block-title">{title}</h3>
          <p className="checkout-guest-name">{name}</p>
        </div>
        {onChoose ? (
          <button type="button" className="traveller-list-btn" onClick={onChoose}>
            Choose from list
          </button>
        ) : null}
      </div>
      <AgeField id={id} value={age} error={error} onChange={onAge} />
    </article>
  );
}

export function TravellerReview({
  service,
  draft,
  detailsHref,
  onChangeContact,
  onChooseTraveller,
  onChangeAge,
  ageErrors = {},
}) {
  const hotelLead = draft.travellers?.lead || {};
  const hotelGuests = Array.isArray(draft.travellers?.additional) ? draft.travellers.additional : [];
  const busPeople = Array.isArray(draft.travellers) ? draft.travellers : [];

  return (
    <section className="checkout-section" id="checkout-guests">
      <div className="checkout-section-head">
        <h2 className="checkout-section-title">
          {service === "hotel" ? "Guest review" : "Traveller review"}
        </h2>
        <Link href={`${detailsHref}#traveller`}>Change</Link>
      </div>

      {service === "hotel" ? (
        <div className="checkout-guest-list">
          <GuestAgeCard
            title="Lead guest"
            name={[hotelLead.firstName, hotelLead.lastName].filter(Boolean).join(" ") || "Name not added"}
            id="checkout-lead-age"
            age={hotelLead.age}
            error={ageErrors.leadAge}
            onAge={(age) => onChangeAge?.({ kind: "hotel-lead", age })}
            onChoose={onChooseTraveller ? () => onChooseTraveller({ kind: "hotel" }) : null}
          />
          {hotelGuests.map((guest, index) => (
            <GuestAgeCard
              key={guest.id || index}
              title={`Guest ${index + 2}`}
              name={[guest.firstName, guest.lastName].filter(Boolean).join(" ") || "Name not added"}
              id={`checkout-age-${guest.id || index}`}
              age={guest.age}
              error={ageErrors[`addAge-${guest.id}`]}
              onAge={(age) => onChangeAge?.({ kind: "hotel-guest", id: guest.id, age })}
            />
          ))}
        </div>
      ) : service === "bus" ? (
        <div className="checkout-guest-list">
          {busPeople.map((person, index) => (
            <GuestAgeCard
              key={person.seat || person.id || index}
              title={`Seat ${person.seat || index + 1}`}
              name={[person.firstName, person.lastName].filter(Boolean).join(" ") || "Name not added"}
              id={`checkout-bus-age-${person.seat || index}`}
              age={person.age}
              error={ageErrors[`age-${person.seat || index}`]}
              onAge={(age) => onChangeAge?.({ kind: "bus", seat: person.seat, index, age })}
              onChoose={
                onChooseTraveller
                  ? () =>
                      onChooseTraveller({
                        kind: "bus",
                        index,
                        type: person.type || "adult",
                      })
                  : null
              }
            />
          ))}
        </div>
      ) : (
        <ul className="checkout-review-list">
          {(draft.travellers || []).map((person, index) => {
            const name = [person.title, person.firstName, person.lastName].filter(Boolean).join(" ");
            return <li key={person.id || index}>Traveller {index + 1}: {name || "Incomplete"}</li>;
          })}
        </ul>
      )}

      {service === "flight" && onChooseTraveller ? (
        <div className="checkout-traveller-actions">
          {(draft.travellers || []).map((person, index) => (
            <button
              key={person.id || index}
              type="button"
              className="traveller-list-btn"
              onClick={() =>
                onChooseTraveller?.({
                  kind: "flight",
                  index,
                  type: person.type || "adult",
                })
              }
            >
              Choose traveller {index + 1}
            </button>
          ))}
        </div>
      ) : null}

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
