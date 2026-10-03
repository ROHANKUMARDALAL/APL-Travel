/**
 * Home dashboard FAQs — grouped by travel service.
 */

export const HOME_FAQ_TOPICS = [
  { id: "all", label: "All" },
  { id: "flight", label: "Flights" },
  { id: "hotel", label: "Hotels" },
  { id: "bus", label: "Buses" },
  { id: "payments", label: "Payments" },
  { id: "account", label: "Account" },
];

export const HOME_FAQS = [
  {
    id: "flight-search",
    topicId: "flight",
    question: "How do I search flights across Delhi’s airports?",
    answer:
      "Search with the city code DEL. APL expands that to Indira Gandhi (DEL), Hindon (HDO), and Noida International (DXN), so you see departures from every airport in the metro on your date.",
  },
  {
    id: "flight-fare",
    topicId: "flight",
    question: "What is the difference between fares on one flight?",
    answer:
      "One APL flight may list several supplier fares under flightFareData. Pick an aplFareId to lock baggage rules, refundability, and price before checkout.",
  },
  {
    id: "flight-addons",
    topicId: "flight",
    question: "Can I add seats, meals, or extra baggage?",
    answer:
      "Yes. On details and checkout you can select seat, meal, and baggage add-ons. The confirmPrice you send must match the fare total plus those extras.",
  },
  {
    id: "flight-ticket",
    topicId: "flight",
    question: "Where do I find my e-ticket after booking?",
    answer:
      "Open My Trips after you sign in, or use Find booking with your APL booking reference and email. The confirmation page also shows the itinerary right after payment.",
  },
  {
    id: "hotel-city",
    topicId: "hotel",
    question: "Why is the hotel city code a number?",
    answer:
      "Live hotel suppliers return numeric CityIds. Search cities first (for example New Delhi → 130443), then pass that cityCode into hotel search so inventory matches supplier data.",
  },
  {
    id: "hotel-children",
    topicId: "hotel",
    question: "Do I need to enter children’s ages?",
    answer:
      "If children is greater than zero, send childAges as a string array like [\"5\",\"8\"]. Length must match the number of children so room rates stay accurate.",
  },
  {
    id: "hotel-rooms",
    topicId: "hotel",
    question: "How do I choose a room from multiple suppliers?",
    answer:
      "Hotel details shows one APL hotel with availableRooms from every connected supplier. Select an aplRoomId, revalidate, then checkout with that room and any extras such as breakfast.",
  },
  {
    id: "hotel-cancel",
    topicId: "hotel",
    question: "Can I cancel a hotel booking?",
    answer:
      "Signed-in travellers can cancel from My Trips when the booking is confirmed. Refund timing follows the room policy; eligible amounts may return to wallet or the original payment method.",
  },
  {
    id: "bus-search",
    topicId: "bus",
    question: "How does bus search work on APL Travel?",
    answer:
      "Choose Buses on the home search, enter from and to cities plus travel date, then compare operators, timings, and seat types on the results page.",
  },
  {
    id: "bus-seat",
    topicId: "bus",
    question: "How do I pick a seat on a bus?",
    answer:
      "Open the bus details page after selecting a result. Available seats appear there; your chosen seat is saved on the booking confirmation and My Trips details.",
  },
  {
    id: "bus-delay",
    topicId: "bus",
    question: "What if my bus is delayed or cancelled?",
    answer:
      "Follow the operator note on your ticket and contact Support with your booking reference. We help with rebooking or refund options based on the operator policy.",
  },
  {
    id: "pay-methods",
    topicId: "payments",
    question: "Which payment methods can I use?",
    answer:
      "Checkout supports card, UPI, and Travel Wallet where available. Cards ending in 0000 are declined in the mock payment flow so you can test failures safely.",
  },
  {
    id: "pay-confirm",
    topicId: "payments",
    question: "Why must I send confirmPrice on checkout and book?",
    answer:
      "APL recalculates the fare or room plus add-ons and only proceeds when your confirmPrice matches exactly. That stops accidental bookings at a wrong total.",
  },
  {
    id: "pay-refund",
    topicId: "payments",
    question: "When does a refund show in my wallet?",
    answer:
      "After a successful cancellation, refunds are recorded on your account actions. Matching-currency refunds credit Travel Wallet; other methods follow the original payment path.",
  },
  {
    id: "account-signup",
    topicId: "account",
    question: "What do I need to create an account?",
    answer:
      "Signup needs name, email, phone number, password, optional profile photo URL, currency, and a captcha answer. After login you receive a loginToken for bookings and trips.",
  },
  {
    id: "account-trips",
    topicId: "account",
    question: "How do I see only my bookings?",
    answer:
      "Sign in and open My Trips. Lists and details require your login token, so each traveller only sees their own flights, hotels, buses, cancellations, and payment history.",
  },
  {
    id: "account-support",
    topicId: "account",
    question: "Where can I get more help?",
    answer:
      "Open Support for topic filters, contact forms, and booking-specific requests. You can also use Find booking if you have the reference but are not signed in.",
  },
];
