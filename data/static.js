import { storyFor } from "@/data/catalogDetails";
import { formatOfferPrice } from "@/data/markets";

export const SERVICES = [
  { id: "flight", label: "Flight", icon: "plane" },
  { id: "hotel", label: "Hotel", icon: "hotel" },
  { id: "bus", label: "Bus", icon: "bus" },
  { id: "transfer", label: "Transfer", icon: "transfer" },
];

/** Raw offer amounts by currency — UI formats via market helpers (display currency ≠ destination). */
export const OFFERS_RAW = {
  flight: [
    {
      id: "f1",
      title: "Dubai → Tokyo",
      subtitle: "One-stop · Flexible dates",
      prices: { INR: 40832 },
      tag: "Hot deal",
      image:
        "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "f2",
      title: "Singapore → Bangkok",
      subtitle: "Non-stop · Weekend special",
      prices: { INR: 19038 },
      tag: "Popular",
      image:
        "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "f3",
      title: "New York → London",
      subtitle: "Economy · Instant confirm",
      prices: { INR: 8016 },
      tag: "Save 20%",
      image:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "f4",
      title: "Mumbai → Dubai",
      subtitle: "Non-stop · Evening departure",
      prices: { INR: 12480 },
      tag: "Direct",
      image:
        "https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "f5",
      title: "Delhi → Singapore",
      subtitle: "1 stop · Refundable fare",
      prices: { INR: 18640 },
      tag: "Flexible",
      image:
        "https://images.unsplash.com/photo-1542296332-2e4473faf563?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "f6",
      title: "London → Paris",
      subtitle: "Morning hop · Cabin bag",
      prices: { INR: 6420 },
      tag: "Short hop",
      image:
        "https://images.unsplash.com/photo-1431274172761-fca41d930114?auto=format&fit=crop&w=800&q=80",
    },
  ],
  hotel: [
    {
      id: "h1",
      title: "Marina Stay, Dubai",
      subtitle: "4★ · Breakfast included",
      prices: { INR: 18286 },
      priceSuffix: "/night",
      tag: "City stay",
      image:
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "h2",
      title: "Boutique Hotel, Paris",
      subtitle: "City centre · Free cancel",
      prices: { INR: 20708 },
      priceSuffix: "/night",
      tag: "City pick",
      image:
        "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "h3",
      title: "Harbour View, Sydney",
      subtitle: "Central · Business ready",
      prices: { INR: 24132 },
      priceSuffix: "/night",
      tag: "Business",
      image:
        "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "h4",
      title: "Garden Ryokan, Kyoto",
      subtitle: "Quiet rooms · Onsen nearby",
      prices: { INR: 26800 },
      priceSuffix: "/night",
      tag: "Quiet stay",
      image:
        "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "h5",
      title: "Riverside Inn, Jaipur",
      subtitle: "3★ · Courtyard breakfast",
      prices: { INR: 8900 },
      priceSuffix: "/night",
      tag: "Local pick",
      image:
        "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "h6",
      title: "Bay Suites, Singapore",
      subtitle: "Pool deck · Late checkout",
      prices: { INR: 15420 },
      priceSuffix: "/night",
      tag: "Weekend",
      image:
        "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80",
    },
  ],
  bus: [
    {
      id: "b1",
      title: "Delhi → Jaipur",
      subtitle: "Express coach · Wi‑Fi",
      prices: { INR: 3256 },
      tag: "Express",
      image:
        "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "b2",
      title: "London → Manchester",
      subtitle: "Direct · Comfort seats",
      prices: { INR: 2338 },
      tag: "Daily",
      image:
        "https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "b3",
      title: "Toronto → Ottawa",
      subtitle: "Same-day · Onboard power",
      prices: { INR: 2672 },
      tag: "Comfort",
      image:
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "b4",
      title: "Mumbai → Pune",
      subtitle: "Every hour · Recliner coach",
      prices: { INR: 420 },
      tag: "Frequent",
      image:
        "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "b5",
      title: "Delhi → Chandigarh",
      subtitle: "Morning AC · Charging ports",
      prices: { INR: 980 },
      tag: "AC coach",
      image:
        "https://images.unsplash.com/photo-1544620341-11cb2cd7c626?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "b6",
      title: "Paris → Lyon",
      subtitle: "Day coach · City centre stops",
      prices: { INR: 2150 },
      tag: "Scenic",
      image:
        "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=800&q=80",
    },
  ],
};

export const AIRLINE_BRANDS = [
  { name: "IndiGo", mark: "6E" },
  { name: "Air India", mark: "AI" },
  { name: "Emirates", mark: "EK" },
  { name: "Qatar Airways", mark: "QR" },
  { name: "Singapore Airlines", mark: "SQ" },
  { name: "British Airways", mark: "BA" },
  { name: "AirAsia", mark: "AK" },
  { name: "SpiceJet", mark: "SG" },
  { name: "Lufthansa", mark: "LH" },
  { name: "Etihad", mark: "EY" },
  { name: "Japan Airlines", mark: "JL" },
  { name: "Vistara", mark: "UK" },
];

export const PARTNER_BRANDS = [
  {
    name: "M2HSEE",
    mark: "M2",
    note: "Keeps flight routes tidy so the fare on APL Travel is easy to trust at a glance.",
  },
  {
    name: "APLTech",
    mark: "AT",
    note: "Shapes the booking path so search, checkout, and your trips stay in one calm place.",
  },
  {
    name: "SRDV",
    mark: "SR",
    note: "Lines up the inventory so the deal you see is the trip you actually book.",
  },
  {
    name: "Deectra",
    mark: "DE",
    note: "Brings hotels and coaches beside flights, so one search covers the journey.",
  },
  {
    name: "APL",
    mark: "AP",
    note: "The travel home — prices stay in the currency you picked, from offers to payment.",
  },
  {
    name: "Nimbus Pay",
    mark: "NP",
    note: "Keeps checkout light, with the same currency on the offer and the final fare.",
  },
  {
    name: "Atlas Stay",
    mark: "AS",
    note: "Places restful hotel nights next to the flight that gets you there.",
  },
  {
    name: "Coral Route",
    mark: "CR",
    note: "Maps the longer routes so weekend offers stay simple to compare.",
  },
  {
    name: "Harbor Desk",
    mark: "HD",
    note: "Stays with you after booking, for changes, questions, and a calm reply.",
  },
  {
    name: "SkyMint",
    mark: "SM",
    note: "Keeps airline names and fares easy to scan while you choose a carrier.",
  },
  {
    name: "Lumen Trip",
    mark: "LT",
    note: "Lights up the notes and deals so the homepage reads like a useful guide.",
  },
];

/** Journal cards. Amounts are INR and convert to the active display currency. */
export const TRAVEL_NOTES = [
  {
    id: "n1",
    kicker: "Flight note",
    title: "A quieter way into Tokyo",
    excerpt: "One stop, a long layover, and a fare that stays easy to compare.",
    priceInr: 40832,
    relatedOffer: { service: "flight", id: "f1" },
    place: "Dubai to Tokyo",
    readTime: "4 min",
    bestFor: "A calmer long-haul day",
    paragraphs: [
      "The useful Tokyo arrival is not always the fastest one. A single stop with a long layover keeps the connection calm, and it gives you a fare you can set beside the non-stop without guessing what the extra hour costs.",
      "This note uses the same Dubai to Tokyo fare as the deal on the homepage. Change the header currency and both numbers move together.",
    ],
    sections: [
      {
        title: "Why the longer stop",
        body: "A tight connection saves a headline hour and spends it in a jog between gates. The long layover does the opposite: you sit, eat, and board the second flight without watching the clock. For Tokyo, that is usually the difference between arriving tired and arriving able to use the evening.",
      },
      {
        title: "What the fare is doing",
        body: "The number on this page is the Dubai → Tokyo deal, not a separate blog price. Flexible dates stay on the offer, so you can move the trip before checkout and still recognise the fare you read here.",
      },
      {
        title: "How to use the day",
        body: "Leave Dubai with the layover already counted as part of the journey. Keep a meal for the connection, not for the gate of the second flight. Once you land, the city can wait until the next morning if the arrival is late — the point was a quiet way in, not the earliest touchdown.",
      },
    ],
    tips: [
      "Compare this fare with a non-stop in search before you decide the extra hour is worth it.",
      "Keep the connection long enough for a meal, not only a corridor.",
      "The price follows the currency in the header, or the one locked to your account.",
    ],
  },
  {
    id: "n2",
    kicker: "Stay note",
    title: "Harbour mornings in Sydney",
    excerpt: "A business-ready room with the nightly rate shown in your currency.",
    priceInr: 24132,
    suffix: "/night",
    relatedOffer: { service: "hotel", id: "h3" },
    place: "Sydney",
    readTime: "3 min",
    bestFor: "A working morning by the harbour",
    paragraphs: [
      "A Sydney morning is better if the room is already in the centre. Harbour View is the business stay: a place to take the first call, then walk out toward the water.",
      "The nightly rate here is the Harbour View deal. It converts with your selected currency, including the “per night” label.",
    ],
    sections: [
      {
        title: "The morning, not the lobby",
        body: "The stay is written for the hour before the meeting. A central room means the harbour is a walk, not a rideshare, and the first call can happen before you have crossed the city.",
      },
      {
        title: "What you are paying for",
        body: "The rate is one night, not a package that hides breakfast and transfers. It matches the Harbour View offer, so the story and the deal card never show two different numbers.",
      },
      {
        title: "Who it suits",
        body: "A short working visit. If the trip is a week of beaches, this is the night you use at the start or the end, when you still need a quiet room and a central address.",
      },
    ],
    tips: [
      "Book the nights you will actually sleep, then add more from hotel search.",
      "The “per night” label stays attached when the currency changes.",
      "A louder resort stays cheaper only until the transfer is counted.",
    ],
  },
  {
    id: "n3",
    kicker: "Coach note",
    title: "Delhi to Jaipur before lunch",
    excerpt: "An express coach with Wi-Fi, priced the same way as checkout.",
    priceInr: 3256,
    relatedOffer: { service: "bus", id: "b1" },
    place: "Delhi to Jaipur",
    readTime: "3 min",
    bestFor: "A city arrival before lunch",
    paragraphs: [
      "Jaipur is close enough that the coach is the calm choice. The express leaves Delhi in the morning and is in the city before lunch, with Wi-Fi for the hours in between.",
      "The fare on this note is the Delhi → Jaipur offer. It follows the same currency as the rest of the page.",
    ],
    sections: [
      {
        title: "Why the coach",
        body: "The road is short enough that an airport does not earn its place. The express keeps a seat, Wi-Fi, and a morning clock so Jaipur is still a daytime city when you arrive.",
      },
      {
        title: "The hours on board",
        body: "About five hours. Use them for the inbox, not for a transfer queue. Charging and Wi-Fi are the reason this coach is listed the way it is, not only the lower fare.",
      },
      {
        title: "The fare",
        body: "It is the same Delhi → Jaipur deal. A return is a second search. The number you see here changes with the header currency, the same way checkout does.",
      },
    ],
    tips: [
      "Leave after breakfast in Delhi if you want Jaipur before lunch.",
      "A return seat is not included in this fare.",
      "The story price and the deal price are the same amount.",
    ],
  },
];

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

export function getOffer(service, id, marketId) {
  const item = (OFFERS_RAW[service] || []).find((entry) => entry.id === id);
  if (!item) return null;
  const story = storyFor(id);
  return {
    ...item,
    ...story,
    service,
    price: formatOfferPrice(item.prices, {
      marketId,
      suffix: item.priceSuffix || "",
    }),
  };
}

export function getTravelNote(id) {
  return TRAVEL_NOTES.find((note) => note.id === id) || null;
}

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
