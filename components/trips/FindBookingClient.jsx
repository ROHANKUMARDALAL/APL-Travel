"use client";

import { useState } from "react";
import Link from "next/link";
import SiteChrome from "@/components/layout/SiteChrome";
import { findResultById } from "@/lib/booking";
import {
  findGuestBooking,
  getBookingDateLabel,
  getBookingHeadline,
  getTravellerDisplayName,
  bookingStatusLabel,
  paymentStatusLabel,
} from "@/lib/userBookings";
import { formatShortDate } from "@/lib/resultsHelpers";
import { getActiveMarketId } from "@/data/markets";

export default function FindBookingClient() {
  const [reference, setReference] = useState("");
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [booking, setBooking] = useState(null);
  const marketId = getActiveMarketId();

  function handleSubmit(event) {
    event.preventDefault();
    const result = findGuestBooking(reference, email);
    setFeedback(result);
    setBooking(result.ok ? result.booking : null);
  }

  const item = booking ? findResultById(booking.service, booking.id) : null;

  return (
    <SiteChrome>
      <section className="container-page find-booking-page">
        <p className="section-eyebrow">Guest access</p>
        <h1 className="section-title">Find your booking</h1>
        <p className="section-copy">
          Look up a trip with your booking reference and email — no account
          required.
        </p>

        <form className="checkout-section find-booking-form" onSubmit={handleSubmit}>
          <label className="search-field">
            <span className="field-label">Booking reference</span>
            <input
              className="field-input"
              placeholder="e.g. TRV-482731"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              autoComplete="off"
            />
          </label>
          <label className="search-field">
            <span className="field-label">Email</span>
            <input
              className="field-input"
              type="email"
              placeholder="Email used at checkout"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>
          <button type="submit" className="btn-primary">
            Find booking
          </button>
          {feedback && !feedback.ok ? (
            <p className="field-error" role="alert">
              {feedback.message}
            </p>
          ) : null}
          <p className="dev-note">
            Sample lookup: TRV-482731 with abc@gmail.com
          </p>
        </form>

        {booking ? (
          <article className="trip-card find-booking-result">
            <div className="trip-card-top">
              <p className="result-card-kicker">{booking.service}</p>
              <div className="confirmation-status-row trip-card-status">
                <span className="status-pill is-confirmed">
                  {bookingStatusLabel(booking)}
                </span>
                <span className="status-pill is-paid">
                  {paymentStatusLabel(booking)}
                </span>
              </div>
            </div>
            <h2 className="checkout-booking-title">
              {getBookingHeadline(booking, item)}
            </h2>
            <dl className="checkout-fact-list">
              <div>
                <dt>Reference</dt>
                <dd className="trip-ref">{booking.reference}</dd>
              </div>
              <div>
                <dt>Date</dt>
                <dd>
                  {getBookingDateLabel(booking, marketId, formatShortDate)}
                </dd>
              </div>
              <div>
                <dt>Traveller / guest</dt>
                <dd>{getTravellerDisplayName(booking)}</dd>
              </div>
              <div>
                <dt>Amount</dt>
                <dd>{booking.payable?.totalPayableLabel}</dd>
              </div>
            </dl>
            <div className="trip-card-actions">
              <Link className="btn-primary" href="/login?next=/my-trips">
                Sign in to manage
              </Link>
              <Link className="btn-ghost" href="/support">
                Contact support
              </Link>
            </div>
          </article>
        ) : null}
      </section>
    </SiteChrome>
  );
}
