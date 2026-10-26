import { apiGet, apiPost } from "@/lib/api/client";
import { quotePaymentFee } from "@/lib/paymentFee";
import { getLoginToken } from "@/lib/auth";
import { mapFlightAddOns } from "@/lib/booking";
import { computeFlightConfirmPrice } from "@/lib/fareSelection";

function withServerFee(payment, confirmPrice) {
  if (!payment?.method || payment.method === "FORCE_FAIL" || payment.method === "FORCE_PENDING") {
    return payment;
  }
  const quote = quotePaymentFee(confirmPrice.amount, payment.method);
  return { ...payment, amount: quote.totalAmount, feeAmount: quote.feeAmount };
}

function couponAdjustedQuote(quote) {
  if (typeof window === "undefined" || !quote) return quote;
  const code = window.sessionStorage.getItem("apl-coupon-code");
  const amount = Number(window.sessionStorage.getItem("apl-coupon-unit"));
  const currency = window.sessionStorage.getItem("apl-coupon-currency");
  if (!code || !Number.isFinite(amount)) return quote;
  return { ...quote, amount, currency: currency || quote.currency };
}

function appliedCouponSavings() {
  if (typeof window === "undefined") return 0;
  if (!window.sessionStorage.getItem("apl-coupon-code")) return 0;
  const savings = Number(window.sessionStorage.getItem("apl-coupon-savings"));
  return Number.isFinite(savings) && savings > 0 ? savings : 0;
}

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
  pickupInstructions,
  pickupPoint,
}) {
  const token = requireToken();
  const pricedQuote = couponAdjustedQuote(quote);
  const confirmPrice = {
    amount: Number(pricedQuote?.amount),
    currency: String(pricedQuote?.currency || "INR").toUpperCase(),
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
    couponCode: typeof window !== "undefined" ? window.sessionStorage.getItem("apl-coupon-code") || undefined : undefined,
    contact: {
      email: contact.email,
      phone: contact.phone,
      countryCode: contact.countryCode || "+91",
    },
    travellers: (travellers || []).map((person) => ({
      type: String(person.type || "ADULT").toUpperCase(),
      title: person.title || "Mr",
      firstName: person.firstName?.trim() || "Guest",
      lastName: person.lastName?.trim() || "Traveller",
      age: person.age != null ? Number(person.age) : undefined,
    })),
    pickupInstructions: pickupInstructions || undefined,
    pickupContact: contact.pickupContact || undefined,
    pickupPoint: pickupPoint || undefined,
  });

  return apiPost(
    "/transfers/book",
    {
      checkoutToken: checkout.checkoutToken,
      confirmPrice,
      payment: withServerFee(payment, confirmPrice),
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
  const pricedQuote = couponAdjustedQuote(quote);
  const confirmPrice = {
    amount: Number(pricedQuote.amount) * payingGuests,
    currency: String(pricedQuote.currency || "INR").toUpperCase(),
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
    couponCode: typeof window !== "undefined" ? window.sessionStorage.getItem("apl-coupon-code") || undefined : undefined,
  });

  return apiPost(
    "/hotels/book",
    {
      checkoutToken: checkout.checkoutToken,
      confirmPrice,
      payment: withServerFee(payment, confirmPrice),
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
  const unit = Number(couponAdjustedQuote(quote)?.amount);
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
    couponCode: typeof window !== "undefined" ? window.sessionStorage.getItem("apl-coupon-code") || undefined : undefined,
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
      payment: withServerFee(payment, confirmPrice),
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
  acceptPriceChange = false,
  returnOffer = null,
  journeyId = null,
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
    selectedFareQuote: selectedFareQuote || quote,
    travellers,
    paxCount: passengerCount,
    addOnAmount: mapped.amount,
  });
  if (!priced.ok) {
    const error = new Error("Selected fare price is missing. Go back and choose a fare again.");
    error.code = "FARE_PRICE";
    throw error;
  }
  const returnUnit = Number(returnOffer?.quote?.amount) || 0;
  const confirmPrice = {
    amount: Math.max(0, priced.amount + returnUnit * (priced.paying || 1) - appliedCouponSavings()),
    currency: priced.currency,
  };
  const fareQuote = {
    amount: priced.unitAmount,
    currency: priced.currency,
    label: fareLabel || selectedFareQuote?.label || undefined,
  };

  const quoted = await apiPost("/flights/fare-quote", {
    searchId,
    aplFlightId,
    aplFareId,
    journeyId: journeyId || undefined,
    acceptPriceChange: acceptPriceChange === true,
  });
  if (quoted?.requiresAcceptance) {
    const error = new Error(
      `The fare changed from ${quoted.previousPrice?.amount} to ${quoted.price?.amount} ${quoted.price?.currency || ""}. Review the new amount before paying.`,
    );
    error.code = "PRICE_CHANGED";
    throw error;
  }
  if (returnOffer?.aplFlightId) {
    const returnQuoted = await apiPost("/flights/fare-quote", {
      searchId: returnOffer.searchId,
      aplFlightId: returnOffer.aplFlightId,
      aplFareId: returnOffer.aplFareId,
      journeyId: quoted?.journeyId,
      asReturn: true,
      acceptPriceChange: acceptPriceChange === true,
    });
    if (returnQuoted?.requiresAcceptance) {
      const error = new Error("The return fare changed. Review the new amount before paying.");
      error.code = "PRICE_CHANGED";
      throw error;
    }
  }

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
    journeyId: quoted?.journeyId,
    acceptPriceChange: acceptPriceChange === true,
    couponCode: typeof window !== "undefined" ? window.sessionStorage.getItem("apl-coupon-code") || undefined : undefined,
    returnOffer: returnOffer?.aplFlightId
      ? {
          searchId: returnOffer.searchId,
          aplFlightId: returnOffer.aplFlightId,
          aplFareId: returnOffer.aplFareId,
        }
      : undefined,
  });

  const blocked = await apiPost(
    "/flights/block",
    {
      checkoutToken: checkout.checkoutToken,
      journeyId: checkout.journeyId || quoted?.journeyId,
    },
    { token },
  );
  if (blocked?.requiresAcceptance) {
    const error = new Error("The blocked fare changed. Review the new amount before paying.");
    error.code = "PRICE_CHANGED";
    throw error;
  }

  return apiPost(
    "/flights/book",
    {
      checkoutToken: checkout.checkoutToken,
      confirmPrice: {
        amount: Number(blocked?.amount ?? confirmPrice.amount),
        currency: blocked?.currency || confirmPrice.currency,
      },
      payment: withServerFee(payment, confirmPrice),
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
export async function bookInsuranceDemo({
  searchId,
  planId,
  quote,
  travellers,
  sameBeneficiary,
  destination,
  departureDate,
  returnDate,
  contact,
  payment,
}) {
  const token = requireToken();
  const confirmPrice = {
    amount: Number(quote?.amount),
    currency: String(quote?.currency || "INR").toUpperCase(),
  };
  const checkout = await apiPost("/insurance/checkout", {
    searchId,
    planId,
    confirmPrice,
    destination,
    departureDate,
    returnDate,
    sameBeneficiary,
    contact,
    travellers,
  });
  return apiPost(
    "/insurance/book",
    {
      checkoutToken: checkout.checkoutToken,
      confirmPrice,
      payment: withServerFee(payment, confirmPrice),
      idempotencyKey: `pay:${checkout.checkoutToken}`,
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


export async function changeBusPoints(bookingId, { boardingPointCode, droppingPointCode }) {
  const token = requireToken();
  return apiPost(
    "/buses/bookings/points",
    {
      bookingId,
      boardingPointCode,
      droppingPointCode,
      idempotencyKey: `b2c-points:${bookingId}:${boardingPointCode}:${droppingPointCode}:${Date.now()}`,
    },
    { token },
  );
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
