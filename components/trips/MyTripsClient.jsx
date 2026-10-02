"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AccountShell from "@/components/account/AccountShell";
import { useAuth } from "@/components/auth/useAuth";
import { findResultById } from "@/lib/booking";
import {
  BOOKING_SERVICES,
  TRIP_PHASES,
  bookingStatusLabel,
  getBookingDateLabel,
  getBookingHeadline,
  getTravellerDisplayName,
  loadAccountBookings,
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceFromUrl = BOOKING_SERVICES.some((item) => item.id === searchParams.get("service"))
    ? searchParams.get("service")
    : "all";
  const [phase, setPhase] = useState("upcoming");
  const [serviceFilter, setServiceFilter] = useState(serviceFromUrl);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    loadAccountBookings()
      .then((rows) => {
        if (!ignore) {
          setBookings(
            rows.filter(
              (row) =>
                row.tripPhase === phase &&
                (serviceFilter === "all" || row.service === serviceFilter),
            ),
          );
        }
      })
      .catch(() => {
        if (!ignore) setBookings([]);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [phase, serviceFilter, user?.id]);

  useEffect(() => {
    setServiceFilter(serviceFromUrl);
  }, [serviceFromUrl]);

  function selectService(id) {
    const params = new URLSearchParams(searchParams.toString());
    if (id === "all") params.delete("service");
    else params.set("service", id);
    const next = params.toString();
    router.replace(next ? `/my-trips?${next}` : "/my-trips", { scroll: false });
  }

  return (
    <AccountShell title="My Trips">
      <p className="section-copy account-lede">
        Your bookings for this signed-in account. Each trip is loaded with your login and stays with that customer.
      </p>

      <div className="account-inline-actions account-lede-actions">
        <Link className="btn-ghost" href="/support#booking-help">
          Need help with a booking?
        </Link>
        <Link className="btn-ghost" href="/support">
          Support Center
        </Link>
      </div>

      <div className="trip-tabs" role="tablist" aria-label="Booking service">
        {BOOKING_SERVICES.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={serviceFilter === item.id}
            className={`trip-tab ${serviceFilter === item.id ? "is-active" : ""}`}
            onClick={() => selectService(item.id)}
          >
            {item.label}
          </button>
        ))}
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

      {loading ? (
        <section className="checkout-section account-panel">
          <p className="section-copy">Loading your bookings…</p>
        </section>
      ) : bookings.length === 0 ? (
        <section className="checkout-section account-panel">
          <h2 className="checkout-section-title">
            No {phase}{" "}
            {serviceFilter === "all" ? "trips" : BOOKING_SERVICES.find((item) => item.id === serviceFilter)?.label.toLowerCase()}
          </h2>
          <p className="section-copy">
            {serviceFilter === "all"
              ? `When you book a ${phase === "upcoming" ? "new trip" : "trip in this state"}, it will appear here.`
              : `Your ${phase} ${BOOKING_SERVICES.find((item) => item.id === serviceFilter)?.label.toLowerCase()} will appear here.`}
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
