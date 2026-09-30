"use client";

import Image from "next/image";
import { formatDuration, formatPriceParts, formatShortDate } from "@/lib/resultsHelpers";
import { formatMoney, getActiveMarketId, getActiveCurrencyCode, convertAmount } from "@/data/markets";
import { BUS_SEAT_MAP, BUS_TAKEN_SEATS } from "@/lib/booking";

export function FlightMainDetails({ item, searchQuery }) {
  const marketId = getActiveMarketId();
  const price = formatPriceParts(item, marketId);

  return (
    <section className="booking-section" id="details">
      <div className="booking-header-row">
        <div>
          <p className="result-card-kicker">{item.airline}</p>
          <h1 className="booking-title">
            {item.from.city} ({item.from.code}) → {item.to.city} ({item.to.code})
          </h1>
          <p className="booking-meta">
            {formatShortDate(searchQuery.depart, marketId)}
            {searchQuery.return
              ? ` · Return ${formatShortDate(searchQuery.return, marketId)}`
              : ""}{" "}
            · {item.cabin}
          </p>
        </div>
        <div className="airline-badge airline-badge-lg" aria-hidden="true">
          {item.airlineCode}
        </div>
      </div>

      <div className="itinerary-card">
        <p className="flight-leg-label">{item.returnLeg ? "Depart" : "Flight"}</p>
        <div className="flight-timeline">
          <div>
            <p className="flight-time">{item.from.time}</p>
            <p className="flight-code">
              {item.from.code} · {item.from.city}
            </p>
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
            <p className="flight-code">
              {item.to.code} · {item.to.city}
            </p>
          </div>
        </div>
        {item.returnLeg ? (
          <div className="flight-leg flight-leg-details">
            <p className="flight-leg-label">Return · {item.returnLeg.airline}</p>
            <div className="flight-timeline">
              <div>
                <p className="flight-time">{item.returnLeg.from.time}</p>
                <p className="flight-code">
                  {item.returnLeg.from.code} · {item.returnLeg.from.city}
                </p>
              </div>
              <div className="flight-duration-wrap">
                <p className="flight-duration">{formatDuration(item.returnLeg.durationMinutes)}</p>
                <div className="flight-line" aria-hidden="true" />
                <p className="flight-stops">
                  {item.returnLeg.stops === 0
                    ? "Non-stop"
                    : item.returnLeg.stopLabel || `${item.returnLeg.stops} stop`}
                </p>
              </div>
              <div>
                <p className="flight-time">{item.returnLeg.to.time}</p>
                <p className="flight-code">
                  {item.returnLeg.to.code} · {item.returnLeg.to.city}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <dl className="detail-facts">
        <div>
          <dt>Baggage</dt>
          <dd>{item.baggage}</dd>
        </div>
        <div>
          <dt>Selected fare</dt>
          <dd>{price.baseLabel}</dd>
        </div>
        <div>
          <dt>Taxes</dt>
          <dd>{price.taxesLabel}</dd>
        </div>
      </dl>

      <div className="fare-policy-panel">
        <h2 className="booking-subsection-title">Fare & cancellation</h2>
        <p className="result-card-policy">{item.fareConditions}</p>
        <p className="price-fee-note">
          Booking fees may apply at checkout and will be itemised before payment.
        </p>
      </div>
    </section>
  );
}

export function HotelMainDetails({
  item,
  searchQuery,
  rooms,
  selectedRoomId,
  onSelectRoom,
  nights,
}) {
  const marketId = getActiveMarketId();

  return (
    <section className="booking-section" id="details">
      <div className="hotel-detail-hero">
        <Image
          src={item.image}
          alt={item.name}
          fill
          sizes="(max-width: 900px) 100vw, 720px"
          className="hotel-detail-image"
          priority
        />
      </div>
      <p className="result-card-kicker">
        {item.stars}★ · {item.propertyType}
      </p>
      <h1 className="booking-title">{item.name}</h1>
      <p className="booking-meta">
        {item.location} · {item.rating.toFixed(1)}/10 ({item.reviewCount} reviews)
      </p>
      <p className="booking-meta">
        Check-in {formatShortDate(searchQuery.checkIn, marketId)} · Check-out{" "}
        {formatShortDate(searchQuery.checkOut, marketId)} · {nights} night
        {nights === 1 ? "" : "s"}
      </p>

      <ul className="hotel-amenities booking-amenities">
        {item.amenities.map((amenity) => (
          <li key={amenity}>{amenity}</li>
        ))}
      </ul>

      <div className="fare-policy-panel">
        <h2 className="booking-subsection-title">Cancellation policy</h2>
        <p className="result-card-policy">{item.cancellation}</p>
        <p className="price-fee-note">
          Booking fees may apply at checkout and will be itemised before payment.
        </p>
      </div>

      <h2 className="booking-subsection-title">Choose your room</h2>
      <div className="room-options">
        {rooms.map((room) => {
          const display = getActiveCurrencyCode(marketId);
          const sourceCurrency =
            (room.prices?.INR && "INR") ||
            (room.prices?.USD && "USD") ||
            (room.prices?.GBP && "GBP") ||
            Object.keys(room.prices || {})[0] ||
            "INR";
          const roomPrice = room.prices?.[sourceCurrency];
          const guests = Math.max(1, Number(item.paxCount) || 1);
          const nightly = convertAmount(roomPrice?.total || 0, sourceCurrency, display) * guests;
          const selected = room.id === selectedRoomId;
          return (
            <label
              key={room.id}
              className={`room-option ${selected ? "is-selected" : ""}`}
            >
              <input
                type="radio"
                name="hotel-room"
                checked={selected}
                onChange={() => onSelectRoom(room.id)}
              />
              <div>
                <p className="room-option-name">{room.name}</p>
                <p className="result-card-meta">
                  {room.bedType} · Sleeps {room.sleeps}
                </p>
                <p className="result-card-policy">{room.cancellation}</p>
              </div>
              <div className="room-option-price">
                <p className="price-total">
                  {formatMoney(nightly * nights, marketId, display)}
                </p>
                <p className="price-breakdown">
                  {formatMoney(nightly, marketId, display)} / night
                  {guests > 1 ? ` · ${guests} guests` : ""} incl. taxes
                </p>
              </div>
            </label>
          );
        })}
      </div>
    </section>
  );
}

export function BusMainDetails({ item, searchQuery, selectedSeat, onSelectSeat }) {
  const marketId = getActiveMarketId();

  return (
    <section className="booking-section" id="details">
      <p className="result-card-kicker">{item.operator}</p>
      <h1 className="booking-title">
        {item.from.city} → {item.to.city}
      </h1>
      <p className="booking-meta">
        {formatShortDate(searchQuery.date, marketId)} · {item.busType} ·{" "}
        {formatDuration(item.durationMinutes)}
      </p>

      <div className="itinerary-card">
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
      </div>

      <dl className="detail-facts">
        <div>
          <dt>Boarding</dt>
          <dd>{item.boarding}</dd>
        </div>
        <div>
          <dt>Drop-off</dt>
          <dd>{item.dropOff}</dd>
        </div>
        <div>
          <dt>Amenities</dt>
          <dd>{item.amenities.join(" · ")}</dd>
        </div>
        <div>
          <dt>Seats left</dt>
          <dd>{item.seatsLeft}</dd>
        </div>
      </dl>

      <div className="fare-policy-panel">
        <h2 className="booking-subsection-title">Cancellation policy</h2>
        <p className="result-card-policy">{item.cancellation}</p>
        <p className="price-fee-note">
          Booking fees may apply at checkout and will be itemised before payment.
        </p>
      </div>

      <h2 className="booking-subsection-title">Select a seat</h2>
      <p className="booking-section-copy">
        Choose an available seat for this coach.
      </p>
      <div className="seat-map" role="group" aria-label="Seat map">
        {BUS_SEAT_MAP.map((row, rowIndex) => (
          <div key={`row-${rowIndex}`} className="seat-row">
            {row.map((seat, seatIndex) => {
              if (!seat) return <span key={`aisle-${rowIndex}-${seatIndex}`} className="seat-aisle" />;
              const taken = BUS_TAKEN_SEATS.includes(seat);
              const selected = selectedSeat === seat;
              return (
                <button
                  key={seat}
                  type="button"
                  className={`seat-btn ${taken ? "is-taken" : ""} ${selected ? "is-selected" : ""}`}
                  disabled={taken}
                  aria-pressed={selected}
                  onClick={() => onSelectSeat(seat)}
                >
                  {seat}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <p className="booking-meta">
        Selected seat: <strong>{selectedSeat || "None"}</strong>
      </p>
    </section>
  );
}

export function PoliciesBlock({ title = "Policies", items }) {
  return (
    <section className="booking-section">
      <h2 className="booking-section-title">{title}</h2>
      <ul className="policy-list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
