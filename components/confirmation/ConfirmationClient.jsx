"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckoutShell } from "@/components/checkout/CheckoutShell";
import BookingProgress from "@/components/booking/BookingProgress";
import { BOOKING_EXTRAS, findResultById, formatSelectedSeats, getHotelRooms } from "@/lib/booking";
import { useAuth } from "@/components/auth/useAuth";
import { claimSavedTrip } from "@/lib/api/booking";
import { getCurrentUser } from "@/lib/auth";
import { loadConfirmation, saveConfirmation, whatHappensNext } from "@/lib/confirmation";
import { formatShortDate, travellerLabel } from "@/lib/resultsHelpers";
import { getActiveMarketId } from "@/data/markets";
import { downloadTicketPdf, ticketFromBooking } from "@/lib/ticketPdf";
import { withSelectedFare } from "@/lib/fareSelection";
import ETicketPreview from "@/components/confirmation/ETicketPreview";

function toCalendarStamp(dateStr) {
  if (!dateStr) return null;
  const cleaned = String(dateStr).replace(/-/g, "");
  if (cleaned.length !== 8) return null;
  return `${cleaned}T120000Z`;
}

function buildCalendarHref(confirmation, item) {
  const service = confirmation.service;
  const query = confirmation.searchQuery || {};
  let start = null;
  let end = null;
  let title = `Trip ${confirmation.reference}`;

  if (service === "flight") {
    start = toCalendarStamp(query.depart);
    end = toCalendarStamp(query.return || query.depart);
    title = item
      ? `Flight ${item.from.code} → ${item.to.code}`
      : title;
  } else if (service === "hotel") {
    start = toCalendarStamp(query.checkIn);
    end = toCalendarStamp(query.checkOut || query.checkIn);
    title = item ? `Stay · ${item.name}` : title;
  }

  if (!start) return "#";
  const endStamp = end || start;
  const details = encodeURIComponent(
    `Booking ${confirmation.reference} · ${confirmation.payable?.totalPayableLabel || ""}`,
  );
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${start}/${endStamp}&details=${details}`;
}

export default function ConfirmationClient() {
  const searchParams = useSearchParams();
  const { authenticated, user } = useAuth();
  const [confirmation, setConfirmation] = useState(null);
  const [accountUser, setAccountUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const current = loadConfirmation();
    const account = getCurrentUser();
    setAccountUser(account);
    setConfirmation(current);
    setReady(true);
    if (!authenticated || !current?.reference || String(current.reference).startsWith("APL-BK-")) {
      return undefined;
    }
    let ignore = false;
    claimSavedTrip(current)
      .then((saved) => {
        const reference = saved?.bookingId || saved?.aplBookingRef;
        if (ignore || !reference) return;
        const next = { ...current, reference, previousReference: current.reference, accountSaved: true };
        saveConfirmation(next);
        setConfirmation(next);
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, [authenticated]);

  if (!ready) {
    return (
      <CheckoutShell>
        <div className="container-page checkout-page">
          <p className="section-copy">Loading confirmation…</p>
        </div>
      </CheckoutShell>
    );
  }

  const refParam = searchParams.get("ref");
  const referenceMatches =
    !refParam ||
    confirmation.reference === refParam ||
    confirmation.previousReference === refParam;
  if (!confirmation || !referenceMatches) {
    return (
      <CheckoutShell>
        <div className="container-page checkout-page">
          <div className="booking-not-found">
            <h1 className="section-title">Confirmation not found</h1>
            <p className="section-copy">
              We couldn’t find this booking confirmation. It may have expired
              after closing the browser tab.
            </p>
            <div className="checkout-actions">
              <Link className="btn-primary" href="/my-trips">
                Go to My Trips
              </Link>
              <Link className="btn-ghost" href="/">
                Back to search
              </Link>
            </div>
          </div>
        </div>
      </CheckoutShell>
    );
  }

  const service = confirmation.service;
  const catalogItem = findResultById(service, confirmation.id);
  const pricedCatalog =
    service === "flight" && catalogItem
      ? withSelectedFare(
          catalogItem,
          confirmation.selectedFareId || confirmation.selectedFare?.id || "",
        ) || catalogItem
      : catalogItem;
  const item = pricedCatalog
    ? {
        ...pricedCatalog,
        selectedFare: confirmation.selectedFare || pricedCatalog.selectedFare,
        selectedFareLabel:
          confirmation.selectedFare?.label || pricedCatalog.selectedFareLabel,
      }
    : null;
  const marketId = getActiveMarketId();
  const query = confirmation.searchQuery || {};
  const extras = (BOOKING_EXTRAS[service] || []).filter((extra) =>
    (confirmation.extras || []).includes(extra.id),
  );
  const signedIn = Boolean(
    authenticated || user || accountUser || confirmation.bookedForUserId || getCurrentUser(),
  );
  const room =
    service === "hotel"
      ? getHotelRooms(confirmation.id).find(
          (r) => r.id === confirmation.selectedRoomId,
        )
      : null;

  async function copyRef() {
    try {
      await navigator.clipboard.writeText(confirmation.reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <CheckoutShell>
      <div className="container-page confirmation-page">
        <BookingProgress current="confirm" backHref="/my-trips" />
        <div className="confirmation-hero">
          <p className="confirmation-kicker">Booking confirmed</p>
          <h1 className="section-title">You’re all set</h1>
          <div className="confirmation-status-row">
            <span className="status-pill is-confirmed">Booking status: Confirmed</span>
            <span className="status-pill is-paid">Payment status: Paid</span>
          </div>
          <div className="confirmation-ref">
            <div>
              <p className="field-label">Booking reference</p>
              <p className="confirmation-ref-value">{confirmation.reference}</p>
            </div>
            <button type="button" className="btn-secondary promo-apply-btn" onClick={copyRef}>
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        <div className="confirmation-grid">
          <section className="checkout-section">
            <h2 className="checkout-section-title">Booking details</h2>
            {!item ? (
              <p className="result-card-meta">Reference {confirmation.id}</p>
            ) : (
              <>
                <p className="result-card-kicker">{service}</p>
                <h3 className="checkout-booking-title">
                  {service === "hotel"
                    ? item.name
                    : service === "flight"
                      ? `${item.from.code} → ${item.to.code}`
                      : `${item.from.city} → ${item.to.city}`}
                </h3>
                <dl className="checkout-fact-list">
                  {service === "flight" ? (
                    <>
                      <div>
                        <dt>Airline</dt>
                        <dd>{item.airline}</dd>
                      </div>
                      <div>
                        <dt>Date</dt>
                        <dd>{formatShortDate(query.depart, marketId)}</dd>
                      </div>
                      <div>
                        <dt>Travellers</dt>
                        <dd>{travellerLabel(query)}</dd>
                      </div>
                    </>
                  ) : null}
                  {service === "hotel" ? (
                    <>
                      <div>
                        <dt>Room</dt>
                        <dd>{room?.name || item.roomType}</dd>
                      </div>
                      <div>
                        <dt>Stay</dt>
                        <dd>
                          {formatShortDate(query.checkIn, marketId)} →{" "}
                          {formatShortDate(query.checkOut, marketId)}
                        </dd>
                      </div>
                    </>
                  ) : null}
                  {service === "bus" ? (
                    <>
                      <div>
                        <dt>Operator</dt>
                        <dd>{item.operator}</dd>
                      </div>
                      <div>
                        <dt>Date</dt>
                        <dd>{formatShortDate(query.date, marketId)}</dd>
                      </div>
                      <div>
                        <dt>Seat</dt>
                        <dd>{formatSelectedSeats(confirmation.selectedSeat) || "—"}</dd>
                      </div>
                    </>
                  ) : null}
                  <div>
                    <dt>Amount paid</dt>
                    <dd>{confirmation.payable?.totalPayableLabel}</dd>
                  </div>
                  <div>
                    <dt>Payment</dt>
                    <dd>
                      {confirmation.payment?.method}
                      {confirmation.payment?.last4
                        ? ` · •••• ${confirmation.payment.last4}`
                        : ""}{" "}
                      · Paid
                    </dd>
                  </div>
                </dl>
                {extras.length ? (
                  <p className="result-card-meta">
                    Extras: {extras.map((e) => e.label).join(", ")}
                  </p>
                ) : null}
              </>
            )}
          </section>

          <section className="checkout-section">
            <h2 className="checkout-section-title">What happens next?</h2>
            <p className="section-copy">
              {signedIn
                ? "This trip is saved on the account you are signed in with. Open My Trips to see it."
                : whatHappensNext(service)}
            </p>
            <p className="result-card-meta">
              {signedIn
                ? `The confirmation is linked to ${user?.email || confirmation.contact?.email || "your account"}.`
                : `Confirmation email would be sent to ${confirmation.contact?.email || "your inbox"} in a live system.`}
            </p>
          </section>
        </div>

        <ETicketPreview confirmation={confirmation} item={item} />

        <div className="confirmation-actions no-print">
          <Link className="btn-primary" href="/my-trips">
            View booking / My Trips
          </Link>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => downloadTicketPdf(ticketFromBooking(confirmation, item))}
          >
            Download e-ticket PDF
          </button>
          <button type="button" className="btn-ghost" onClick={() => window.print()}>
            Print e-ticket
          </button>
          <a
            className="btn-ghost"
            href={`mailto:${confirmation.contact?.email || ""}?subject=Booking ${confirmation.reference}`}
          >
            Email confirmation
          </a>
          {service === "flight" || service === "hotel" ? (
            <a
              className="btn-ghost"
              href={buildCalendarHref(confirmation, item)}
              target="_blank"
              rel="noreferrer"
            >
              Add to calendar
            </a>
          ) : null}
          <Link className="btn-ghost" href="/my-trips">
            Manage booking
          </Link>
          <Link className="btn-ghost" href="/support#booking-help">
            Need help?
          </Link>
          <Link className="btn-ghost" href="/support">
            Contact support
          </Link>
        </div>

        {!signedIn ? (
        <section className="checkout-section confirmation-account-cta">
          <h2 className="checkout-section-title">Create an account to manage this trip</h2>
          <p className="section-copy">
            Optional — you completed this booking as a guest. Account creation is
            not required and is not enabled yet.
          </p>
          <Link className="btn-secondary promo-apply-btn" href="/account">
            Create account (coming soon)
          </Link>
        </section>
        ) : null}
      </div>
    </CheckoutShell>
  );
}
