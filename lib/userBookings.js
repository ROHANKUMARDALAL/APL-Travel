/**
 * User bookings repository — swap MOCK_USER_BOOKINGS for API calls later.
 * UI should only import from this module, not from mock data directly.
 */

import { MOCK_USER_BOOKINGS } from "@/data/mock/bookings";
import { loadConfirmation } from "@/lib/confirmation";
import { fetchMyBooking, fetchMyBookings } from "@/lib/api/booking";
import { formatMoney, getActiveMarketId } from "@/data/markets";

export const TRIP_PHASES = [
  { id: "upcoming", label: "Upcoming" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

export const BOOKING_SERVICES = [
  { id: "all", label: "All" },
  { id: "flight", label: "Flights" },
  { id: "hotel", label: "Hotels" },
  { id: "bus", label: "Buses" },
];

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function normalizeRef(reference) {
  return String(reference || "")
    .trim()
    .toUpperCase();
}

function deriveTripPhase(booking) {
  if (booking.tripPhase) return booking.tripPhase;
  if (booking.bookingStatus === "cancelled") return "cancelled";
  if (booking.bookingStatus === "completed") return "completed";
  return "upcoming";
}

/**
 * Map a Phase 3 confirmation record into the account booking model.
 */
export function confirmationToBooking(confirmation) {
  if (!confirmation?.reference) return null;
  return {
    ...confirmation,
    tripPhase: deriveTripPhase(confirmation),
    bookingStatus: confirmation.bookingStatus || "confirmed",
  };
}

export function mapAccountBooking(row) {
  if (!row) return null;
  const service = String(row.service || row.productType || "").toLowerCase();
  const status = String(row.bookingStatus || row.status || "confirmed").toLowerCase();
  const pay = String(row.paymentStatus || row.payment?.status || "").toUpperCase();
  const paymentStatus =
    pay === "REFUNDED" ? "refunded" : pay === "FAILED" ? "failed" : "paid";
  const currency = row.currency || "INR";
  const amount = Number(row.totalAmount);
  return {
    reference: row.bookingId || row.aplBookingRef,
    service,
    id: row.aplEntityId || row.aplBookingRef,
    title: row.title || "",
    searchQuery: row.searchQuery || {},
    travellers: row.travellers || [],
    contact: {
      email: row.guestEmail || "",
      phone: row.guestPhone || "",
    },
    bookingStatus: status === "confirmed" ? "confirmed" : status,
    tripPhase: row.tripPhase || deriveTripPhase({ bookingStatus: status }),
    payment: {
      status: paymentStatus,
      method: row.payment?.method || "",
      last4: row.payment?.last4 || "",
    },
    payable: {
      totalPayableLabel: Number.isFinite(amount)
        ? formatMoney(amount, getActiveMarketId(), currency)
        : "—",
    },
    fareLabel:
      row.itinerary?.fareLabel ||
      row.fareLabel ||
      row.itinerary?.price?.fareLabel ||
      null,
    itinerary: row.itinerary || null,
    createdAt: row.bookedAtUtc || row.createdAt,
    bookedAtLocal: row.bookedAtLocal || "",
    customerId: row.customerId || null,
  };
}

export async function loadAccountBookings() {
  const data = await fetchMyBookings();
  return (data?.bookings || [])
    .map(mapAccountBooking)
    .filter(Boolean)
    .sort((a, b) => Date.parse(b.createdAt || 0) - Date.parse(a.createdAt || 0));
}

export async function loadAccountBooking(reference) {
  try {
    const row = await fetchMyBooking(reference);
    return mapAccountBooking(row);
  } catch {
    return null;
  }
}

export function listBookings(options = {}) {
  const email = normalizeEmail(options.email);
  const phase = options.phase || "all";

  let items = MOCK_USER_BOOKINGS.map((booking) => ({
    ...booking,
    tripPhase: deriveTripPhase(booking),
  }));

  if (email) {
    items = items.filter(
      (booking) => normalizeEmail(booking.contact?.email) === email,
    );
  }

  // Optionally surface the latest guest/demo confirmation for the same email.
  if (typeof window !== "undefined" && email) {
    const live = confirmationToBooking(loadConfirmation());
    if (
      live &&
      normalizeEmail(live.contact?.email) === email &&
      !items.some((item) => item.reference === live.reference)
    ) {
      items = [live, ...items];
    }
  }

  if (phase && phase !== "all") {
    items = items.filter((booking) => booking.tripPhase === phase);
  }

  return items.sort((a, b) => {
    const aTime = Date.parse(a.createdAt || 0);
    const bTime = Date.parse(b.createdAt || 0);
    return bTime - aTime;
  });
}

export function getBookingByReference(reference) {
  const ref = normalizeRef(reference);
  if (!ref) return null;

  const fromMock = MOCK_USER_BOOKINGS.find(
    (booking) => normalizeRef(booking.reference) === ref,
  );
  if (fromMock) {
    return { ...fromMock, tripPhase: deriveTripPhase(fromMock) };
  }

  if (typeof window !== "undefined") {
    const live = confirmationToBooking(loadConfirmation());
    if (live && normalizeRef(live.reference) === ref) return live;
  }

  return null;
}

/**
 * Guest booking lookup — reference + email, no login required.
 */
export function findGuestBooking(reference, email) {
  const ref = normalizeRef(reference);
  const mail = normalizeEmail(email);

  if (!ref || !mail) {
    return {
      ok: false,
      status: "empty",
      message: "Enter both booking reference and email",
    };
  }

  const booking = getBookingByReference(ref);
  if (!booking) {
    return {
      ok: false,
      status: "not_found",
      message: "No booking found for that reference",
    };
  }

  if (normalizeEmail(booking.contact?.email) !== mail) {
    return {
      ok: false,
      status: "mismatch",
      message: "Reference and email do not match our records",
    };
  }

  return { ok: true, status: "found", booking };
}

export function getTravellerDisplayName(booking) {
  const people = Array.isArray(booking?.travellers) ? booking.travellers : [];
  const person = booking?.travellers?.lead || people[0] || booking?.travellers || {};
  const name = [person.title, person.firstName, person.lastName].filter(Boolean).join(" ");
  if (name) return name;
  return booking?.service === "hotel" ? "Guest" : "Traveller";
}

export function getBookingHeadline(booking, item) {
  if (!booking) return "";
  if (booking.title) return booking.title;
  if (booking.service === "hotel") {
    return item?.name || booking.searchQuery?.destination || "Hotel stay";
  }
  if (booking.service === "flight") {
    if (item?.from && item?.to) {
      return `${item.from.city} (${item.from.code}) → ${item.to.city} (${item.to.code})`;
    }
    return `${booking.searchQuery?.from || "—"} → ${booking.searchQuery?.to || "—"}`;
  }
  if (item?.from && item?.to) {
    return `${item.from.city} → ${item.to.city}`;
  }
  return `${booking.searchQuery?.from || "—"} → ${booking.searchQuery?.to || "—"}`;
}

export function getBookingDateLabel(booking, marketId, formatShortDate) {
  const query = booking?.searchQuery || {};
  if (booking?.bookedAtLocal && !query.depart && !query.checkIn && !query.date) {
    return booking.bookedAtLocal;
  }
  if (booking.service === "flight") {
    return formatShortDate(query.depart, marketId) || booking.bookedAtLocal || "";
  }
  if (booking.service === "hotel") {
    return `${formatShortDate(query.checkIn, marketId)} → ${formatShortDate(query.checkOut, marketId)}`;
  }
  return formatShortDate(query.date, marketId);
}

export function bookingStatusLabel(booking) {
  const phase = deriveTripPhase(booking);
  if (phase === "cancelled") return "Cancelled";
  if (phase === "completed") return "Completed";
  if (booking.bookingStatus === "confirmed") return "Confirmed";
  return booking.bookingStatus || "Confirmed";
}

export function paymentStatusLabel(booking) {
  const status = booking?.payment?.status || "paid";
  if (status === "refunded") return "Refunded";
  if (status === "paid") return "Paid";
  return status;
}
