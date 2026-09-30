import { apiGet, apiPost } from "@/lib/api/client";
import { getLoginToken } from "@/lib/auth";

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
 * quote.amount is the fare for one paying passenger.
 */
export async function bookFlightStay({
  searchId,
  aplFlightId,
  aplFareId,
  quote,
  passengerCount,
  contact,
  travellers,
  payment,
}) {
  const token = requireToken();
  const paying = Math.max(1, Number(passengerCount) || 1);
  const confirmPrice = {
    amount: Number(quote.amount) * paying,
    currency: String(quote.currency || "INR").toUpperCase(),
  };

  const checkout = await apiPost("/flights/checkout", {
    searchId,
    aplFlightId,
    aplFareId,
    addOns: { seats: [], baggage: [], meals: [] },
    confirmPrice,
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
