"use client";

import Image from "next/image";
import { formatDuration, formatPriceParts, formatShortDate } from "@/lib/resultsHelpers";
import { formatMoney, getActiveMarketId, getActiveCurrencyCode, convertAmount } from "@/data/markets";
import { BUS_SEAT_MAP, BUS_TAKEN_SEATS, MAX_BUS_SEATS, formatSelectedSeats } from "@/lib/booking";

export function FlightMainDetails({ item, searchQuery, selectedFareId, onSelectFare }) {
  const marketId = getActiveMarketId();
  const fares = Array.isArray(item.fares) ? item.fares : [];
  const selectedFare =
    fares.find((fare) => fare.aplFareId === selectedFareId || fare.id === selectedFareId) ||
    fares[0] ||
    null;
  const pricedItem = selectedFare
    ? { ...item, prices: selectedFare.prices, baggage: selectedFare.baggage, fareConditions: selectedFare.fareConditions, cabin: selectedFare.cabin }
    : item;
  const price = formatPriceParts(pricedItem, marketId);

  return (
    <section className="booking-section flight-detail-rich" id="details">
      <div className="booking-header-row">
        <div>
          <p className="result-card-kicker">{item.airline}</p>
          <h1 className="booking-title">
            {item.from.city} ({item.from.code}) → {item.to.city} ({item.to.code})
          </h1>
          <p className="booking-meta">
            Depart {formatShortDate(searchQuery.depart, marketId)}
            {item.from.time ? ` · ${item.from.time}` : ""}
            {searchQuery.return
              ? ` · Return ${formatShortDate(searchQuery.return, marketId)}`
              : ""}{" "}
            · {pricedItem.cabin} · {formatDuration(item.durationMinutes)}
          </p>
        </div>
        <div className="airline-badge airline-badge-lg" aria-hidden="true">
          {item.airlineCode}
        </div>
      </div>

      <div className="itinerary-card itinerary-card-rich">
        <p className="flight-leg-label">{item.returnLeg ? "Depart" : "Flight"}</p>
        <div className="flight-timeline">
          <div>
            <p className="flight-time">{item.from.time}</p>
            <p className="flight-code">
              {item.from.code} · {item.from.city}
            </p>
            <p className="flight-date-chip">
              {formatShortDate(searchQuery.depart || item.from.date, marketId)}
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
            <p className="flight-date-chip">
              {formatShortDate(item.to.date || searchQuery.depart, marketId)}
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

      {fares.length ? (
        <div className="flight-fare-row flight-fare-row-detail">
          {fares.map((fare) => {
            const active = selectedFare && fare.id === selectedFare.id;
            const farePrice = formatPriceParts(
              { prices: fare.prices, paxCount: item.paxCount },
              marketId,
            );
            const tone = String(fare.label || "saver").toLowerCase().includes("corp")
              ? "corporate"
              : String(fare.label || "").toLowerCase().includes("flex")
                ? "flexi"
                : String(fare.label || "").toLowerCase().includes("publish")
                  ? "publish"
                  : "saver";
            return (
              <button
                key={fare.id}
                type="button"
                className={`flight-fare-card is-${tone} ${active ? "is-selected" : ""}`}
                aria-pressed={active}
                onClick={() => onSelectFare?.(fare.id)}
              >
                <span className={`flight-fare-badge is-${tone}`}>{fare.label}</span>
                <span className="flight-fare-price">{farePrice.totalLabel}</span>
                <ul className="flight-fare-inclusions">
                  <li className="flight-fare-inclusion is-yes">
                    <span aria-hidden="true">✓</span>
                    <span>Cabin {fare.cabinKg ?? 7} kg</span>
                  </li>
                  <li className="flight-fare-inclusion is-yes">
                    <span aria-hidden="true">✓</span>
                    <span>Check-in {fare.checkinKg ?? 15} kg</span>
                  </li>
                  <li className={`flight-fare-inclusion ${fare.meals ? "is-yes" : "is-no"}`}>
                    <span aria-hidden="true">{fare.meals ? "✓" : "✕"}</span>
                    <span>{fare.meals ? "Meal included" : "No meal"}</span>
                  </li>
                  <li className={`flight-fare-inclusion ${fare.refundable ? "is-yes" : "is-no"}`}>
                    <span aria-hidden="true">{fare.refundable ? "✓" : "✕"}</span>
                    <span>{fare.cancelFee || (fare.refundable ? "Refundable" : "Non-refundable")}</span>
                  </li>
                </ul>
              </button>
            );
          })}
        </div>
      ) : null}

      <dl className="detail-facts">
        <div>
          <dt>Travel duration</dt>
          <dd>{formatDuration(item.durationMinutes)}</dd>
        </div>
        <div>
          <dt>Baggage</dt>
          <dd>{pricedItem.baggage}</dd>
        </div>
        <div>
          <dt>Selected fare</dt>
          <dd>
            {selectedFare?.label || "Standard"} · {price.totalLabel}
          </dd>
        </div>
      </dl>

      <div className="fare-policy-panel">
        <h2 className="booking-subsection-title">Fare & cancellation</h2>
        <p className="result-card-policy">{pricedItem.fareConditions}</p>
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

export function BusMainDetails({ item, searchQuery, selectedSeats = [], onToggleSeat, seatMessage }) {
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

      <h2 className="booking-subsection-title">Select seats</h2>
      <p className="booking-section-copy">
        Click a free seat to add it. Click a selected seat again to remove it. You can choose up to {MAX_BUS_SEATS} seats.
      </p>
      <div className="seat-map" role="group" aria-label="Seat map">
        {BUS_SEAT_MAP.map((row, rowIndex) => (
          <div key={`row-${rowIndex}`} className="seat-row">
            {row.map((seat, seatIndex) => {
              if (!seat) return <span key={`aisle-${rowIndex}-${seatIndex}`} className="seat-aisle" />;
              const taken = BUS_TAKEN_SEATS.includes(seat);
              const selected = selectedSeats.includes(seat);
              const full = !selected && selectedSeats.length >= MAX_BUS_SEATS;
              return (
                <button
                  key={seat}
                  type="button"
                  className={`seat-btn ${taken ? "is-taken" : ""} ${selected ? "is-selected" : ""} ${full ? "is-full" : ""}`}
                  disabled={taken}
                  aria-pressed={selected}
                  onClick={() => onToggleSeat(seat)}
                >
                  {seat}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <p className="booking-meta">
        Selected seats ({selectedSeats.length}/{MAX_BUS_SEATS}):{" "}
        <strong>{formatSelectedSeats(selectedSeats) || "None"}</strong>
      </p>
      {seatMessage ? <p className="field-error">{seatMessage}</p> : null}
    </section>
  );
}

export function TransferMainDetails({ item, searchQuery }) {
  const marketId = getActiveMarketId();
  const pickupName = item.pickup?.name || searchQuery.pickup || "Pickup";
  const dropoffName = item.dropoff?.name || searchQuery.dropoff || "Drop-off";
  const timeLabel = searchQuery.time || item.pickupDateTime?.slice(11, 16) || "";

  return (
    <section className="booking-section" id="details">
      <p className="result-card-kicker">{item.vehicleCategory}</p>
      <h1 className="booking-title">
        {pickupName} → {dropoffName}
      </h1>
      <p className="booking-meta">
        {formatShortDate(searchQuery.date, marketId)}
        {timeLabel ? ` · ${timeLabel}` : ""}
        {item.estimatedDurationMinutes
          ? ` · ~${formatDuration(item.estimatedDurationMinutes)}`
          : ""}
      </p>

      <div className="itinerary-card">
        <div className="flight-timeline">
          <div>
            <p className="flight-time">{timeLabel || "—"}</p>
            <p className="flight-code">{item.pickup?.kind || searchQuery.pickupKind || "PICKUP"}</p>
            <p className="result-card-meta">{pickupName}</p>
          </div>
          <div className="flight-duration-wrap">
            <p className="flight-duration">
              {item.estimatedDurationMinutes
                ? formatDuration(item.estimatedDurationMinutes)
                : "Transfer"}
            </p>
            <div className="flight-line" aria-hidden="true" />
            <p className="flight-stops">{item.vehicleName}</p>
          </div>
          <div>
            <p className="flight-time">—</p>
            <p className="flight-code">{item.dropoff?.kind || searchQuery.dropoffKind || "DROPOFF"}</p>
            <p className="result-card-meta">{dropoffName}</p>
          </div>
        </div>
      </div>

      <dl className="detail-facts">
        <div>
          <dt>Vehicle</dt>
          <dd>{item.vehicleName}</dd>
        </div>
        <div>
          <dt>Passengers</dt>
          <dd>Up to {item.maxPassengers}</dd>
        </div>
        <div>
          <dt>Luggage</dt>
          <dd>Up to {item.maxLuggage} bags</dd>
        </div>
        <div>
          <dt>Inclusions</dt>
          <dd>{(item.inclusions || []).join(" · ") || "Private vehicle"}</dd>
        </div>
      </dl>

      <div className="fare-policy-panel">
        <h2 className="booking-subsection-title">Cancellation policy</h2>
        <p className="result-card-policy">{item.cancellation}</p>
        <p className="price-fee-note">
          Final customer price is confirmed at checkout. Optional flight number and pickup notes can be added for the driver.
        </p>
      </div>
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
