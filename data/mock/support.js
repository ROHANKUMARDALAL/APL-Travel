/**
 * Static Support Center content — FAQ, contact, request topics.
 * Replace via lib/support.js later.
 */

export const SUPPORT_TOPICS = [
  { id: "flight", label: "Flight booking" },
  { id: "hotel", label: "Hotel booking" },
  { id: "bus", label: "Bus booking" },
  { id: "changes", label: "Changes & cancellations" },
  { id: "refunds", label: "Refunds" },
  { id: "payments", label: "Payments" },
  { id: "confirmation", label: "Booking confirmation" },
  { id: "account", label: "Account & login" },
  { id: "wallet", label: "Wallet" },
  { id: "other", label: "Other" },
];

export const SUPPORT_BOOKING_ISSUES = [
  { id: "change", label: "Change booking" },
  { id: "cancellation", label: "Cancellation" },
  { id: "refund", label: "Refund" },
  { id: "payment", label: "Payment issue" },
  { id: "other", label: "Other" },
];

export const SUPPORT_FAQ = [
  {
    topicId: "flight",
    question: "How do I change a flight date?",
    answer:
      "Open My Trips, select the flight booking, and use Manage booking. Change options depend on the fare rules shown on your booking.",
  },
  {
    topicId: "flight",
    question: "Where is my e-ticket?",
    answer:
      "After payment, your itinerary appears under My Trips and on the confirmation page. A copy is also sent to your contact email when available.",
  },
  {
    topicId: "hotel",
    question: "Can I request an early check-in?",
    answer:
      "Early check-in is subject to property availability. Contact support with your booking reference and preferred arrival time.",
  },
  {
    topicId: "hotel",
    question: "How do I see my room type?",
    answer:
      "Open the hotel booking in My Trips. Room name, stay dates, and extras are listed on the booking details page.",
  },
  {
    topicId: "bus",
    question: "How do I find my seat number?",
    answer:
      "Seat selection (when chosen at booking) is shown on the bus booking details page and confirmation summary.",
  },
  {
    topicId: "bus",
    question: "What if my bus is delayed?",
    answer:
      "Check the operator guidance on your ticket and contact support with your reference for the latest boarding advice.",
  },
  {
    topicId: "changes",
    question: "How do cancellations work?",
    answer:
      "Cancellation windows and fees follow the policy on each booking. Cancelled bookings appear under the Cancelled tab in My Trips.",
  },
  {
    topicId: "refunds",
    question: "When will I receive a refund?",
    answer:
      "Refund timing depends on the fare rules and payment method. Eligible amounts may be returned to the original payment method or Travel Wallet.",
  },
  {
    topicId: "payments",
    question: "Was I charged for my booking?",
    answer:
      "Checkout confirms payment status on the confirmation page. Card details are never stored in this experience.",
  },
  {
    topicId: "confirmation",
    question: "I closed the confirmation page — how do I find my booking?",
    answer:
      "Use Find booking with your reference and email, or sign in and open My Trips. Guest lookup does not require an account.",
  },
  {
    topicId: "account",
    question: "I forgot my password.",
    answer:
      "Use the sample credentials shown on the sign-in page for this experience. Password reset is not yet available.",
  },
  {
    topicId: "wallet",
    question: "How does Travel Wallet work at checkout?",
    answer:
      "You can apply available Travel Wallet credit on the checkout page. Available and pending balances are shown in My Wallet.",
  },
  {
    topicId: "other",
    question: "How do I contact support?",
    answer:
      "Use the Contact Us section on this page, or submit a booking-specific request if you are signed in.",
  },
];

export const SUPPORT_HOURS = {
  label: "Support hours",
  weekday: "Mon–Fri · 9:00–18:00 local market time",
  weekend: "Sat–Sun · Limited email response",
  note: "Response times vary by market and channel.",
};
