"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import AccountShell from "@/components/account/AccountShell";
import { findResultById, BOOKING_EXTRAS, getHotelRooms } from "@/lib/booking";
import { saveConfirmation } from "@/lib/confirmation";
import {
  bookingStatusLabel,
  getBookingByReference,
  getBookingDateLabel,
  getBookingHeadline,
  getTravellerDisplayName,
  paymentStatusLabel,
} from "@/lib/userBookings";
import { formatShortDate } from "@/lib/resultsHelpers";
import { getActiveMarketId } from "@/data/markets";
import { useAuth } from "@/components/auth/useAuth";

function statusClass(booking) {
  if (booking.tripPhase === "cancelled") return "is-cancelled";
  if (booking.tripPhase === "completed") return "is-completed";
  return "is-confirmed";
}

export default function TripDetailsClient({ reference }) {
  const router = useRouter();
  const { user } = useAuth();
  const booking = getBookingByReference(reference);
  const marketId = getActiveMarketId();

  if (!booking) {
    return (
      <AccountShell title="Booking not found">
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
    user?.email &&
    booking.contact?.email &&
    user.email.toLowerCase() !== booking.contact.email.toLowerCase()
  ) {
    return (
      <AccountShell title="Booking unavailable">
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

  const item = findResultById(booking.service, booking.id);
  const headline = getBookingHeadline(booking, item);
  const dateLabel = getBookingDateLabel(booking, marketId, formatShortDate);
  const extras = (BOOKING_EXTRAS[booking.service] || []).filter((extra) =>
    (booking.extras || []).includes(extra.id),
  );
  const room =
    booking.service === "hotel"
      ? getHotelRooms(booking.id).find((r) => r.id === booking.selectedRoomId)
      : null;
  const payable = booking.payable || {};

  function handleViewConfirmation() {
    // Reuse Phase 3 confirmation page without changing its implementation.
    saveConfirmation(booking);
    router.push(
      `/booking-confirmation?ref=${encodeURIComponent(booking.reference)}`,
    );
  }

  return (
    <AccountShell title="Booking details">
      <div className="confirmation-hero">
        <p className="confirmation-kicker">{booking.service} booking</p>
        <h2 className="checkout-booking-title">{headline}</h2>
        <div className="confirmation-status-row">
          <span className={`status-pill ${statusClass(booking)}`}>
            Booking status: {bookingStatusLabel(booking)}
          </span>
          <span
            className={`status-pill ${
              booking.payment?.status === "refunded" ? "is-refunded" : "is-paid"
            }`}
          >
            Payment status: {paymentStatusLabel(booking)}
          </span>
        </div>
        <div className="confirmation-ref">
          <div>
            <p className="field-label">Booking reference</p>
            <p className="confirmation-ref-value">{booking.reference}</p>
          </div>
        </div>
      </div>

      <div className="confirmation-grid">
        <section className="checkout-section">
          <h2 className="checkout-section-title">Trip information</h2>
          <dl className="checkout-fact-list">
            <div>
              <dt>Date</dt>
              <dd>{dateLabel}</dd>
            </div>
            <div>
              <dt>{booking.service === "hotel" ? "Guest" : "Traveller"}</dt>
              <dd>{getTravellerDisplayName(booking)}</dd>
            </div>
            <div>
              <dt>Contact</dt>
              <dd>{booking.contact?.email}</dd>
            </div>
            {booking.service === "flight" && item ? (
              <>
                <div>
                  <dt>Airline</dt>
                  <dd>{item.airline}</dd>
                </div>
                <div>
                  <dt>Cabin</dt>
                  <dd>{item.cabin}</dd>
                </div>
                <div>
                  <dt>Baggage</dt>
                  <dd>{item.baggage}</dd>
                </div>
              </>
            ) : null}
            {booking.service === "hotel" ? (
              <>
                <div>
                  <dt>Property</dt>
                  <dd>{item?.location || "—"}</dd>
                </div>
                <div>
                  <dt>Room</dt>
                  <dd>{room?.name || item?.roomType || "—"}</dd>
                </div>
              </>
            ) : null}
            {booking.service === "bus" ? (
              <>
                <div>
                  <dt>Operator</dt>
                  <dd>{item?.operator || "—"}</dd>
                </div>
                <div>
                  <dt>Seat</dt>
                  <dd>{booking.selectedSeat || "—"}</dd>
                </div>
              </>
            ) : null}
          </dl>

          {extras.length ? (
            <div className="checkout-extras-chip-row">
              {extras.map((extra) => (
                <span key={extra.id} className="checkout-chip">
                  {extra.label}
                </span>
              ))}
            </div>
          ) : (
            <p className="result-card-meta">No extras selected</p>
          )}
        </section>

        <section className="checkout-section">
          <h2 className="checkout-section-title">Price breakdown</h2>
          <dl className="price-summary-rows">
            <div>
              <dt>Base price</dt>
              <dd>{payable.baseLabel || "—"}</dd>
            </div>
            <div>
              <dt>Taxes</dt>
              <dd>{payable.taxesLabel || "—"}</dd>
            </div>
            <div>
              <dt>Service fees</dt>
              <dd>{payable.serviceFeeLabel || "—"}</dd>
            </div>
            {payable.extras > 0 ? (
              <div>
                <dt>Extras</dt>
                <dd>{payable.extrasLabel}</dd>
              </div>
            ) : null}
            {payable.discount > 0 ? (
              <div className="is-discount">
                <dt>Discounts</dt>
                <dd>−{payable.discountLabel}</dd>
              </div>
            ) : null}
            <div className="is-total">
              <dt>Total</dt>
              <dd>{payable.totalPayableLabel || "—"}</dd>
            </div>
          </dl>
          <p className="result-card-meta">
            Payment: {booking.payment?.method || "—"}
            {booking.payment?.last4 ? ` · •••• ${booking.payment.last4}` : ""}
          </p>
        </section>
      </div>

      {booking.policy ? (
        <section className="checkout-section account-panel">
          <h2 className="checkout-section-title">Cancellation / change policy</h2>
          <p className="section-copy">{booking.policy}</p>
        </section>
      ) : null}

      <div className="confirmation-actions">
        <button type="button" className="btn-primary" onClick={handleViewConfirmation}>
          View confirmation
        </button>
        <button type="button" className="btn-ghost" onClick={() => window.print()}>
          Download confirmation
        </button>
        <Link className="btn-ghost" href="/support#booking-help">
          Need help?
        </Link>
        <Link className="btn-ghost" href="/support">
          Contact support
        </Link>
        <Link className="btn-ghost" href="/my-trips">
          Manage booking
        </Link>
      </div>
    </AccountShell>
  );
}
