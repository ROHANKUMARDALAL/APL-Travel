"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AccountShell from "@/components/account/AccountShell";
import TicketDetailHeader from "@/components/trips/TicketDetailHeader";
import { findResultById, formatSelectedSeats } from "@/lib/booking";
import { saveConfirmation } from "@/lib/confirmation";
import {
  bookingStatusLabel,
  getBookingHeadline,
  getTravellerDisplayName,
  loadAccountBooking,
  paymentStatusLabel,
} from "@/lib/userBookings";
import { formatShortDate } from "@/lib/resultsHelpers";
import { formatMoney, getActiveMarketId } from "@/data/markets";
import { downloadTicketPdf, ticketFromBooking } from "@/lib/ticketPdf";
import { useAuth } from "@/components/auth/useAuth";

function statusClass(booking) {
  if (booking.tripPhase === "cancelled") return "is-cancelled";
  if (booking.tripPhase === "completed") return "is-completed";
  return "is-confirmed";
}

export default function TripDetailsClient({ reference }) {
  const router = useRouter();
  const { user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [ready, setReady] = useState(false);
  const marketId = getActiveMarketId();

  useEffect(() => {
    let ignore = false;
    setReady(false);
    loadAccountBooking(reference)
      .then((row) => {
        if (!ignore) setBooking(row);
      })
      .finally(() => {
        if (!ignore) setReady(true);
      });
    return () => {
      ignore = true;
    };
  }, [reference, user?.id]);

  if (!ready) {
    return (
      <AccountShell>
        <TicketDetailHeader />
        <p className="section-copy">Loading this booking…</p>
      </AccountShell>
    );
  }

  if (!booking) {
    return (
      <AccountShell>
        <TicketDetailHeader />
        <section className="checkout-section account-panel">
          <p className="section-copy">
            We couldn’t find booking {reference}. It may belong to another
            account, or the reference is incorrect.
          </p>
          <div className="account-inline-actions">
            <Link className="btn-primary" href="/my-trips">
              Back to My Trips
            </Link>
            <Link className="btn-ghost" href="/find-booking">
              Find your booking
            </Link>
          </div>
        </section>
      </AccountShell>
    );
  }

  if (
    !booking.customerId &&
    user?.email &&
    booking.contact?.email &&
    user.email.toLowerCase() !== booking.contact.email.toLowerCase()
  ) {
    return (
      <AccountShell>
        <TicketDetailHeader />
        <section className="checkout-section account-panel">
          <p className="section-copy">
            This booking is not linked to your signed-in account. Use Find
            booking with the confirmation email if you booked as a guest.
          </p>
          <div className="account-inline-actions">
            <Link className="btn-primary" href="/find-booking">
              Find your booking
            </Link>
            <Link className="btn-ghost" href="/my-trips">
              Back to My Trips
            </Link>
          </div>
        </section>
      </AccountShell>
    );
  }

  const trip = booking.itinerary || {};
  const price = trip.price || {};
  const currency = price.currency || booking.currency || "INR";
  const headline = booking.title || getBookingHeadline(booking, null);
  const money = (amount) =>
    formatMoney(Number(amount) || 0, marketId, currency);
  const people = Array.isArray(booking.travellers) ? booking.travellers : [];

  function handleViewConfirmation() {
    // Reuse Phase 3 confirmation page without changing its implementation.
    saveConfirmation(booking);
    router.push(
      `/booking-confirmation?ref=${encodeURIComponent(booking.reference)}`,
    );
  }

  return (
    <AccountShell>
      <TicketDetailHeader service={booking.service} />
      <div className={`trip-hero is-${booking.service || "flight"}`}>
        <p className="trip-kicker">{serviceLabel(booking.service)} booking</p>
        <h2 className="trip-headline">{headline}</h2>
        <div className="confirmation-status-row">
          <span className={`status-pill ${statusClass(booking)}`}>
            {bookingStatusLabel(booking)}
          </span>
          <span
            className={`status-pill ${
              booking.payment?.status === "refunded" ? "is-refunded" : "is-paid"
            }`}
          >
            {paymentStatusLabel(booking)}
          </span>
          <span className="status-pill trip-ref-pill">{booking.reference}</span>
        </div>
      </div>

      <div className="trip-detail-grid">
        <section className="trip-journey">
          {booking.service === "hotel" ? (
            <HotelStay trip={trip} marketId={marketId} />
          ) : booking.service === "bus" ? (
            <BusRide trip={trip} marketId={marketId} />
          ) : (
            <FlightRoute trip={trip} marketId={marketId} />
          )}
          {people.length ? (
            <div className="trip-people">
              <p className="trip-card-label">
                {booking.service === "hotel" ? "Guests" : "Travellers"}
              </p>
              <div className="trip-chip-row">
                {people.map((person, index) => (
                  <span key={`${person.firstName}-${index}`} className="trip-person-chip">
                    {[person.title, person.firstName, person.lastName].filter(Boolean).join(" ") ||
                      getTravellerDisplayName(booking)}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <section className="trip-receipt">
          <h2 className="trip-card-title">Payment</h2>
          <div className="trip-meta-row">
            <span>Booked on</span>
            <strong>{booking.bookedAtLocal || "—"}</strong>
          </div>
          <div className="trip-meta-row">
            <span>Payment via</span>
            <strong>{paymentVia(booking.payment)}</strong>
          </div>
          <dl className="trip-fare">
            {trip.fareLabel || booking.fareLabel ? (
              <div>
                <dt>Selected fare</dt>
                <dd>{trip.fareLabel || booking.fareLabel}</dd>
              </div>
            ) : null}
            <div>
              <dt>Base fare</dt>
              <dd>{money(price.base)}</dd>
            </div>
            {Array.isArray(price.addOnItems) && price.addOnItems.length
              ? price.addOnItems.map((extra) => (
                  <div key={extra.label}>
                    <dt>{extra.label}</dt>
                    <dd>{money(extra.amount)}</dd>
                  </div>
                ))
              : null}
            <div>
              <dt>Taxes</dt>
              <dd>{money(price.taxes)}</dd>
            </div>
            <div className="is-total">
              <dt>Total</dt>
              <dd>
                {price.total != null
                  ? money(price.total)
                  : booking.payable?.totalPayableLabel || "—"}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <div className="confirmation-actions">
        <button type="button" className="btn-primary" onClick={handleViewConfirmation}>
          View confirmation
        </button>
        <button
          type="button"
          className="btn-ghost"
          onClick={() =>
            downloadTicketPdf(ticketFromBooking(booking, findResultById(booking.service, booking.id)))
          }
        >
          Download ticket
        </button>
        <Link className="btn-ghost" href="/support#booking-help">
          Need help?
        </Link>
        <Link className="btn-ghost" href="/my-trips">
          Back to My Bookings
        </Link>
      </div>
    </AccountShell>
  );
}

function prettyDay(value, marketId) {
  const raw = String(value || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return value || "—";
  return `${formatShortDate(raw, marketId)} ${raw.slice(0, 4)}`;
}

function serviceLabel(service) {
  if (service === "hotel") return "Hotel";
  if (service === "bus") return "Bus";
  return "Flight";
}

function paymentVia(payment) {
  const method = String(payment?.method || "").toUpperCase();
  const names = {
    CARD: "Card",
    UPI: "UPI",
    NETBANKING: "Net banking",
    WALLET: "Wallet",
  };
  const label = names[method] || (method ? method : "—");
  return payment?.last4 ? `${label} · •••• ${payment.last4}` : label;
}

function titleCase(value) {
  const text = String(value || "").replace(/_/g, " ").toLowerCase();
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function FlightRoute({ trip, marketId }) {
  const from = trip.from || {};
  const to = trip.to || {};
  return (
    <div className="trip-route is-flight">
      <div className="trip-route-head">
        <p className="trip-card-label">Flight</p>
        <div className="trip-chip-row">
          {trip.flightNumber ? <span className="trip-tag">{trip.flightNumber}</span> : null}
          {trip.airline ? <span className="trip-tag is-soft">{trip.airline}</span> : null}
          {trip.cabin ? <span className="trip-tag is-soft">{titleCase(trip.cabin)}</span> : null}
        </div>
      </div>
      <div className="trip-legs">
        <Place
          label="Departure"
          time={from.time}
          place={[from.city, from.code].filter(Boolean).join(" · ")}
          detail={from.airport}
          when={prettyDay(from.date, marketId)}
        />
        <span className="trip-arrow" aria-hidden="true">→</span>
        <Place
          label="Arrival"
          time={to.time}
          place={[to.city, to.code].filter(Boolean).join(" · ")}
          detail={to.airport}
          when={prettyDay(to.date, marketId)}
        />
      </div>
    </div>
  );
}

function HotelStay({ trip, marketId }) {
  return (
    <div className="trip-route is-hotel">
      <div className="trip-route-head">
        <p className="trip-card-label">Hotel stay</p>
        <div className="trip-chip-row">
          {trip.room ? <span className="trip-tag">{trip.room}</span> : null}
          {trip.city ? <span className="trip-tag is-soft">{trip.city}</span> : null}
        </div>
      </div>
      {trip.name ? <p className="trip-place-name">{trip.name}</p> : null}
      {trip.address ? <p className="trip-muted">{trip.address}</p> : null}
      <div className="trip-legs">
        <Place label="Check-in" place={prettyDay(trip.checkIn, marketId)} />
        <span className="trip-arrow" aria-hidden="true">→</span>
        <Place label="Check-out" place={prettyDay(trip.checkOut, marketId)} />
      </div>
    </div>
  );
}

function BusRide({ trip, marketId }) {
  const seats = formatSelectedSeats(trip.seats);
  return (
    <div className="trip-route is-bus">
      <div className="trip-route-head">
        <p className="trip-card-label">Bus</p>
        <div className="trip-chip-row">
          {trip.operator ? <span className="trip-tag">{trip.operator}</span> : null}
          {seats ? <span className="trip-tag is-soft">Seats {seats}</span> : null}
        </div>
      </div>
      <div className="trip-legs">
        <Place label="From" place={trip.from || "—"} when={prettyDay(trip.date, marketId)} />
        <span className="trip-arrow" aria-hidden="true">→</span>
        <Place label="To" place={trip.to || "—"} when={prettyDay(trip.date, marketId)} />
      </div>
    </div>
  );
}

function Place({ label, time, place, detail, when }) {
  return (
    <div className="trip-place">
      <p className="trip-card-label">{label}</p>
      {time ? <p className="trip-time">{time}</p> : null}
      {place ? <p className="trip-place-name">{place}</p> : null}
      {detail ? <p className="trip-muted">{detail}</p> : null}
      {when ? <p className="trip-when">{when}</p> : null}
    </div>
  );
}
