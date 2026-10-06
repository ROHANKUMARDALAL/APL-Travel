import { apiGet, apiPost } from "@/lib/api/client";
import { getLoginToken } from "@/lib/auth";
import { mapFlightAddOns } from "@/lib/booking";
import { computeFlightConfirmPrice } from "@/lib/fareSelection";

function requireToken() {
  const token = getLoginToken();
  if (!token) {
    const error = new Error("Sign in before you pay. The booking is saved on your account.");
    error.code = "AUTH";
    throw error;
  }
  return token;
}

/**
 * Confirms a hotel that came back from POST /hotels/search.
 * The amount must be the room quote from that search, with no extras.
 */
/**
 * Confirms a transfer from POST /transfers/search.
 */
export async function bookTransferStay({
  searchId,
  aplTransferId,
  aplOfferId,
  quote,
  travellers,
  contact,
  payment,
  flightNumber,
  pickupInstructions,
}) {
  const token = requireToken();
  const confirmPrice = {
    amount: Number(quote?.amount),
    currency: String(quote?.currency || "INR").toUpperCase(),
  };
  if (!Number.isFinite(confirmPrice.amount)) {
    const error = new Error("Selected transfer price is missing. Search again.");
    error.code = "FARE_PRICE";
    throw error;
  }

  const checkout = await apiPost("/transfers/checkout", {
    searchId,
    aplTransferId,
    aplOfferId: aplOfferId || undefined,
    confirmPrice,
    contact: {
      email: contact.email,
      phone: contact.phone,
      countryCode: "+91",
    },
    travellers: (travellers || []).map((person) => ({
      type: String(person.type || "ADULT").toUpperCase(),
      title: person.title || "Mr",
      firstName: person.firstName?.trim() || "Guest",
      lastName: person.lastName?.trim() || "Traveller",
      age: person.age != null ? Number(person.age) : undefined,
    })),
    flightNumber: flightNumber || undefined,
    pickupInstructions: pickupInstructions || undefined,
  });

  return apiPost(
    "/transfers/book",
    {
      checkoutToken: checkout.checkoutToken,
      confirmPrice,
      payment,
    },
    { token },
  );
}

export async function bookHotelStay({
  searchId,
  aplHotelId,
  aplRoomId,
  quote,
  contact,
  guests,
  guestCount,
  payment,
}) {
  const token = requireToken();
  const payingGuests = Math.max(1, Number(guestCount) || guests?.length || 1);
  const confirmPrice = {
    amount: Number(quote.amount) * payingGuests,
    currency: String(quote.currency || "INR").toUpperCase(),
  };

  const checkout = await apiPost("/hotels/checkout", {
    searchId,
    aplHotelId,
    aplRoomId,
    addOns: { extraServices: [] },
    confirmPrice,
    contact: {
      email: contact.email,
      phone: contact.phone,
      countryCode: "+91",
    },
    guests,
    guestCount: payingGuests,
  });

  return apiPost(
    "/hotels/book",
    {
      checkoutToken: checkout.checkoutToken,
      confirmPrice,
      payment,
    },
    { token },
  );
}

/**
 * Confirms a flight from POST /flights/search.
 * confirmPrice = (fareQuote.unit × paying pax) + selected add-ons.
 * That exact total is what the backend recomputes — mismatch only if these drift.
 */
/**
 * Confirms a bus from POST /buses/search.
 * confirmPrice = unit seat quote × selected seat count (server recomputes).
 */
export async function bookBusStay({
  searchId,
  aplBusId,
  aplOfferId,
  quote,
  selectedSeats = [],
  boardingPointCode,
  droppingPointCode,
  travellers,
  contact,
  payment,
}) {
  const token = requireToken();
  const seats = (selectedSeats || []).map((s) => String(s).trim()).filter(Boolean);
  if (!seats.length) {
    const error = new Error("Select at least one seat before paying.");
    error.code = "SEAT";
    throw error;
  }
  const unit = Number(quote?.amount);
  if (!Number.isFinite(unit)) {
    const error = new Error("Selected bus price is missing. Search again.");
    error.code = "FARE_PRICE";
    throw error;
  }
  const confirmPrice = {
    amount: unit * seats.length,
    currency: String(quote?.currency || "INR").toUpperCase(),
  };

  const checkout = await apiPost("/buses/checkout", {
    searchId,
    aplBusId,
    aplOfferId: aplOfferId || undefined,
    selectedSeats: seats,
    boardingPointCode,
    droppingPointCode,
    confirmPrice,
    contact: {
      email: contact.email,
      phone: contact.phone,
      countryCode: "+91",
    },
    travellers: (travellers || []).map((person, index) => ({
      type: String(person.type || "ADULT").toUpperCase(),
      title: person.title || "Mr",
      firstName: person.firstName?.trim() || "Passenger",
      lastName: person.lastName?.trim() || String(index + 1),
      age: person.age != null ? Number(person.age) : undefined,
      seat: person.seat || seats[index] || seats[0],
    })),
  });

  return apiPost(
    "/buses/book",
    {
      checkoutToken: checkout.checkoutToken,
      confirmPrice,
      payment,
    },
    { token },
  );
}

export async function bookFlightStay({
  searchId,
  aplFlightId,
  aplFareId,
  quote,
  passengerCount,
  travellers,
  contact,
  payment,
  fareLabel,
  selectedFareQuote,
  extras = [],
  addOns,
}) {
  const token = requireToken();
  const mapped = addOns
    ? {
        addOns: {
          seats: addOns.seats || [],
          baggage: addOns.baggage || [],
          meals: addOns.meals || [],
        },
        amount: Number(addOns.amount) || 0,
      }
    : mapFlightAddOns(extras);
  const priced = computeFlightConfirmPrice({
    quote,
    selectedFareQuote,
    travellers,
    paxCount: passengerCount,
    addOnAmount: mapped.amount,
  });
  if (!priced.ok) {
    const error = new Error("Selected fare price is missing. Go back and choose a fare again.");
    error.code = "FARE_PRICE";
    throw error;
  }
  const confirmPrice = {
    amount: priced.amount,
    currency: priced.currency,
  };
  const fareQuote = {
    amount: priced.unitAmount,
    currency: priced.currency,
    label: fareLabel || selectedFareQuote?.label || undefined,
  };

  const checkout = await apiPost("/flights/checkout", {
    searchId,
    aplFlightId,
    aplFareId,
    addOns: mapped.addOns,
    confirmPrice,
    selectedFareQuote: fareQuote,
    contact: {
      email: contact.email,
      phone: contact.phone,
      countryCode: "+91",
    },
    travellers,
  });

  return apiPost(
    "/flights/book",
    {
      checkoutToken: checkout.checkoutToken,
      confirmPrice,
      payment,
    },
    { token },
  );
}

export async function claimSavedTrip(confirmation) {
  const token = getLoginToken();
  if (!token) return null;
  const query = confirmation.searchQuery || {};
  const people = Array.isArray(confirmation.travellers)
    ? confirmation.travellers
    : confirmation.travellers?.lead
      ? [confirmation.travellers.lead]
      : [];
  return apiPost(
    "/bookings/claim",
    {
      clientReference: confirmation.reference,
      service: confirmation.service,
      amount: Number(confirmation.payable?.totalPayable || 0),
      currency: confirmation.payable?.currency || "INR",
      title:
        confirmation.service === "flight"
          ? `${query.from || ""} → ${query.to || ""}`.trim()
          : query.destination || "",
      airline: confirmation.airline || "",
      searchQuery: query,
      aplEntityId: confirmation.id,
      travellers: people,
      phone: confirmation.contact?.phone || "",
      paymentMethod: confirmation.payment?.method || "CARD",
      last4: confirmation.payment?.last4 || "",
    },
    { token },
  );
}
export async function fetchMyBookings() {
  const token = getLoginToken();
  if (!token) return { customerId: null, bookings: [], services: {} };
  return apiGet("/bookings", { token });
}

export async function fetchMyBooking(reference) {
  const token = getLoginToken();
  if (!token || !reference) return null;
  return apiGet(`/bookings/${encodeURIComponent(reference)}`, { token });
}


export async function cancelMyBooking(bookingId, { reason } = {}) {
  const token = requireToken();
  return apiPost(
    "/bookings/cancel",
    {
      bookingId,
      reason: reason || "Customer cancellation request",
      idempotencyKey: `b2c-cancel:${bookingId}`,
    },
    { token },
  );
}
