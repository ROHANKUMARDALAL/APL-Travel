import { formatOfferPrice } from "@/data/markets";

export const SERVICES = [
  { id: "flight", label: "Flight", icon: "plane" },
  { id: "hotel", label: "Hotel", icon: "hotel" },
  { id: "bus", label: "Bus", icon: "bus" },
];

/** Raw offer amounts by currency — UI formats via market helpers (display currency ≠ destination). */
export const OFFERS_RAW = {
  flight: [
    {
      id: "f1",
      title: "Dubai → Tokyo",
      subtitle: "One-stop · Flexible dates",
      prices: { USD: 489, GBP: 379 },
      tag: "Hot deal",
      image:
        "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "f2",
      title: "Singapore → Bangkok",
      subtitle: "Non-stop · Weekend special",
      prices: { USD: 228, GBP: 179 },
      tag: "Popular",
      image:
        "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "f3",
      title: "New York → London",
      subtitle: "Economy · Instant confirm",
      prices: { USD: 96, GBP: 74 },
      tag: "Save 20%",
      image:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    },
  ],
  hotel: [
    {
      id: "h1",
      title: "Marina Stay, Dubai",
      subtitle: "4★ · Breakfast included",
      prices: { USD: 219, GBP: 169 },
      priceSuffix: "/night",
      tag: "City stay",
      image:
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "h2",
      title: "Boutique Hotel, Paris",
      subtitle: "City centre · Free cancel",
      prices: { USD: 248, GBP: 189 },
      priceSuffix: "/night",
      tag: "City pick",
      image:
        "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "h3",
      title: "Harbour View, Sydney",
      subtitle: "Central · Business ready",
      prices: { USD: 289, GBP: 225 },
      priceSuffix: "/night",
      tag: "Business",
      image:
        "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80",
    },
  ],
  bus: [
    {
      id: "b1",
      title: "Delhi → Jaipur",
      subtitle: "Express coach · Wi‑Fi",
      prices: { USD: 39, GBP: 32 },
      tag: "Express",
      image:
        "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "b2",
      title: "London → Manchester",
      subtitle: "Direct · Comfort seats",
      prices: { USD: 28, GBP: 22 },
      tag: "Daily",
      image:
        "https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "b3",
      title: "Toronto → Ottawa",
      subtitle: "Same-day · Onboard power",
      prices: { USD: 32, GBP: 26 },
      tag: "Comfort",
      image:
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80",
    },
  ],
};

/** Formatted offers for the active display currency (independent of destination). */
export function getOffers(marketId) {
  const result = {};
  for (const [service, items] of Object.entries(OFFERS_RAW)) {
    result[service] = items.map((item) => ({
      ...item,
      price: formatOfferPrice(item.prices, {
        marketId,
        suffix: item.priceSuffix || "",
      }),
    }));
  }
  return result;
}

export const OFFERS = getOffers();

export const TESTIMONIALS = [
  {
    id: "t1",
    name: "Emily Carter",
    role: "Frequent flyer · New York",
    quote:
      "Booking flights felt effortless. Clear fares, fast search, and I was confirmed in minutes.",
    rating: 5,
  },
  {
    id: "t2",
    name: "James Whitfield",
    role: "Weekend traveler · London",
    quote:
      "Found a great hotel deal for Dubai without jumping between tabs. The offers section is genuinely useful.",
    rating: 5,
  },
  {
    id: "t3",
    name: "Aisha Rahman",
    role: "Family trips · Dubai",
    quote:
      "We booked Singapore flights and a Bangkok stay in one place. Clean UI — exactly what we needed.",
    rating: 5,
  },
];

export const FOOTER = {
  brand: "APL Travel",
  tagline: "Flights, stays, and coaches — a global travel platform built for clarity.",
  company: [
    { label: "About us", href: "/support" },
    { label: "Careers", href: "/support" },
    { label: "Press", href: "/support" },
    { label: "Partner with us", href: "/support" },
  ],
  services: [
    { label: "Flight booking", href: "/?service=flight" },
    { label: "Hotel stays", href: "/?service=hotel" },
    { label: "Bus tickets", href: "/?service=bus" },
    { label: "My Trips", href: "/my-trips" },
  ],
  support: [
    { label: "Help center", href: "/support" },
    { label: "Cancellation policy", href: "/support" },
    { label: "Refunds", href: "/support" },
    { label: "Contact support", href: "/support" },
  ],
  legal: [
    { label: "Privacy", href: "/support" },
    { label: "Terms", href: "/support" },
    { label: "Cookie policy", href: "/support" },
  ],
  contact: {
    email: "hello@apltravel.com",
    phone: "+44 20 7946 0958",
    address: "Global customer support — available across markets",
  },
};

export const NAV_LINKS = {
  myTrips: { label: "My Trips", href: "/my-trips" },
  support: { label: "Support", href: "/support" },
  signIn: { label: "Sign in", href: "/login" },
  findBooking: { label: "Find booking", href: "/find-booking" },
  planTrip: { label: "Plan a trip", href: "/#search" },
};
