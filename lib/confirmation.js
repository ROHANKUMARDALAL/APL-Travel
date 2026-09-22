import { BOOKING_DRAFT_KEY } from "@/lib/booking";

export const CONFIRMATION_KEY = "apl-booking-confirmation";

export function generateBookingReference() {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `TRV-${n}`;
}

export function saveConfirmation(confirmation) {
  if (typeof window === "undefined") return;
  try {
    // Never store payment card details.
    const safe = {
      ...confirmation,
      payment: {
        status: confirmation.payment?.status || "paid",
        method: confirmation.payment?.method || "card",
        last4: confirmation.payment?.last4 || null,
        paidAt: confirmation.payment?.paidAt || new Date().toISOString(),
      },
    };
    window.sessionStorage.setItem(CONFIRMATION_KEY, JSON.stringify(safe));
  } catch {
    // ignore
  }
}

export function loadConfirmation() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(CONFIRMATION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearBookingDraft() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(BOOKING_DRAFT_KEY);
  } catch {
    // ignore
  }
}

export function whatHappensNext(service) {
  if (service === "flight") {
    return "Your itinerary will be available under My Trips. Check your email for the booking reference.";
  }
  if (service === "hotel") {
    return "Your reservation details are available under My Trips. Bring photo ID at check-in.";
  }
  return "Your ticket is available under My Trips. Arrive early at the boarding point.";
}
