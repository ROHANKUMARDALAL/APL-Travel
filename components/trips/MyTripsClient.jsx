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
          <dt>{booking.service === "hotel" || booking.service === "transfer" ? "PNR / Confirmation Reference" : "PNR"}</dt>
          <dd className="trip-ref">{booking.pnr || "Not stored"}</dd>
        </div>
        {booking.confirmationNotice ? (
          <div>
            <dt>Notice</dt>
            <dd>{booking.confirmationNotice}</dd>
          </div>
        ) : null}
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
        {booking.service === "recharge" && booking.recharge ? (
          <>
            <div>
              <dt>Operator</dt>
              <dd>{booking.recharge.operator || "—"}</dd>
            </div>
            <div>
              <dt>Mobile</dt>
              <dd>{booking.recharge.accountMasked || "—"}</dd>
            </div>
            <div>
              <dt>Type</dt>
              <dd>{booking.recharge.lineType || booking.recharge.category || "Recharge"}</dd>
            </div>
            <div>
              <dt>Plan</dt>
              <dd>{[booking.recharge.planId, booking.recharge.validity].filter(Boolean).join(" · ") || "—"}</dd>
            </div>
            <div>
              <dt>Payment</dt>
              <dd>{booking.recharge.paymentMethod || booking.paymentMethod || "—"}</dd>
            </div>
            <div>
              <dt>Recharge reference</dt>
              <dd>{booking.recharge.rechargeReference || "—"}</dd>
            </div>
          </>
        ) : null}
        {booking.service === "bus" && booking.itinerary?.boardingPoint?.name ? (
          <div>
            <dt>Boarding</dt>
            <dd>
              {[booking.itinerary.boardingPoint.name, booking.itinerary.boardingPoint.code, booking.itinerary.boardingPoint.time]
                .filter(Boolean)
                .join(" · ")}
            </dd>
          </div>
        ) : null}
        {booking.service === "bus" && booking.itinerary?.droppingPoint?.name ? (
          <div>
            <dt>Dropping</dt>
            <dd>
              {[booking.itinerary.droppingPoint.name, booking.itinerary.droppingPoint.code, booking.itinerary.droppingPoint.time]
                .filter(Boolean)
                .join(" · ")}
            </dd>
          </div>
        ) : null}
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
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    const service = serviceFilter === "all" ? "" : serviceFilter;
    loadAccountBookings({ q: submittedQuery, service, page, pageSize: 20 })
      .then((result) => {
        if (!ignore) {
          const rows = result.bookings || [];
          setTotal(result.total || rows.length);
          setBookings(rows.filter((row) => row.tripPhase === phase));
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
  }, [phase, serviceFilter, user?.id, submittedQuery, page]);

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
    <AccountShell title="My Bookings">
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

      <form
        className="account-inline-actions"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          setSubmittedQuery(query.trim());
        }}
      >
        <input
          className="field-input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by PNR or Booking Reference"
          aria-label="Search by PNR or Booking Reference"
        />
        <button className="btn-primary" type="submit" aria-label="Search bookings">Search</button>
        {submittedQuery ? (
          <button
            className="btn-ghost"
            type="button"
            onClick={() => {
              setQuery("");
              setSubmittedQuery("");
              setPage(1);
            }}
          >
            Clear Search
          </button>
        ) : null}
      </form>

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
            {submittedQuery
              ? "No booking matches that reference"
              : `No ${phase} ${serviceFilter === "all" ? "trips" : BOOKING_SERVICES.find((item) => item.id === serviceFilter)?.label.toLowerCase()}`}
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
      {total > 20 ? (
        <div className="account-inline-actions">
          <button className="btn-ghost" type="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button>
          <button className="btn-ghost" type="button" disabled={page * 20 >= total} onClick={() => setPage((value) => value + 1)}>Next</button>
        </div>
      ) : null}
    </AccountShell>
  );
}
