"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import AccountShell from "@/components/account/AccountShell";
import { useAuth } from "@/components/auth/useAuth";
import { findResultById } from "@/lib/booking";
import {
  TRIP_PHASES,
  bookingStatusLabel,
  getBookingDateLabel,
  getBookingHeadline,
  getTravellerDisplayName,
  listBookings,
  paymentStatusLabel,
} from "@/lib/userBookings";
import { formatShortDate } from "@/lib/resultsHelpers";
import { getActiveMarketId } from "@/data/markets";

function statusClass(booking) {
  if (booking.tripPhase === "cancelled") return "is-cancelled";
  if (booking.tripPhase === "completed") return "is-completed";
  return "is-confirmed";
}

function TripCard({ booking }) {
  const marketId = getActiveMarketId();
  const item = findResultById(booking.service, booking.id);
  const headline = getBookingHeadline(booking, item);
  const dateLabel = getBookingDateLabel(booking, marketId, formatShortDate);

  return (
    <article className="trip-card">
      <div className="trip-card-top">
        <p className="result-card-kicker">{booking.service}</p>
        <div className="confirmation-status-row trip-card-status">
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
        </div>
      </div>

      <h2 className="checkout-booking-title">{headline}</h2>

      <dl className="checkout-fact-list">
        <div>
          <dt>Booking reference</dt>
          <dd className="trip-ref">{booking.reference}</dd>
        </div>
        <div>
          <dt>Date</dt>
          <dd>{dateLabel}</dd>
        </div>
        <div>
          <dt>{booking.service === "hotel" ? "Guest" : "Traveller"}</dt>
          <dd>{getTravellerDisplayName(booking)}</dd>
        </div>
        <div>
          <dt>Amount</dt>
          <dd>{booking.payable?.totalPayableLabel || "—"}</dd>
        </div>
      </dl>

      <div className="trip-card-actions">
        <Link className="btn-primary" href={`/my-trips/${booking.reference}`}>
          View details
        </Link>
        <Link className="btn-ghost" href="/support#booking-help">
          Need help?
        </Link>
      </div>
    </article>
  );
}

export default function MyTripsClient() {
  const { user } = useAuth();
  const [phase, setPhase] = useState("upcoming");

  const bookings = useMemo(
    () => listBookings({ email: user?.email, phase }),
    [user?.email, phase],
  );

  return (
    <AccountShell title="My Trips">
      <p className="section-copy account-lede">
        Your bookings in one place. Guest checkouts stay available via Find
        booking if you prefer not to sign in.
      </p>

      <div className="account-inline-actions account-lede-actions">
        <Link className="btn-ghost" href="/support#booking-help">
          Need help with a booking?
        </Link>
        <Link className="btn-ghost" href="/support">
          Support Center
        </Link>
      </div>

      <div className="trip-tabs" role="tablist" aria-label="Trip filters">
        {TRIP_PHASES.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={phase === item.id}
            className={`trip-tab ${phase === item.id ? "is-active" : ""}`}
            onClick={() => setPhase(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {bookings.length === 0 ? (
        <section className="checkout-section account-panel">
          <h2 className="checkout-section-title">No {phase} trips</h2>
          <p className="section-copy">
            When you book a {phase === "upcoming" ? "new trip" : "trip in this state"}, it
            will appear here.
          </p>
          <div className="account-inline-actions">
            <Link className="btn-primary" href="/#search">
              Plan a trip
            </Link>
            <Link className="btn-ghost" href="/find-booking">
              Find your booking
            </Link>
          </div>
        </section>
      ) : (
        <div className="trip-card-grid">
          {bookings.map((booking) => (
            <TripCard key={booking.reference} booking={booking} />
          ))}
        </div>
      )}
    </AccountShell>
  );
}
