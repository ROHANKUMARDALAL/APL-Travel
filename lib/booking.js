import { MOCK_FLIGHTS } from "@/data/mock/flights";
import { MOCK_HOTELS } from "@/data/mock/hotels";
import { MOCK_BUSES } from "@/data/mock/buses";
import { getActiveCurrencyCode, getActiveMarketId, formatMoney, convertAmount } from "@/data/markets";
import { nightsBetween } from "@/lib/resultsHelpers";
import { searchQueryToParams } from "@/lib/searchQuery";
import { readCatalogItem } from "@/lib/api/catalogCache";

export const BOOKING_DRAFT_KEY = "apl-booking-draft";

export function findFlightById(id) {
  return MOCK_FLIGHTS.find((item) => item.id === id) || null;
}

export function findHotelById(id) {
  return MOCK_HOTELS.find((item) => item.id === id) || null;
}

export function findBusById(id) {
  return MOCK_BUSES.find((item) => item.id === id) || null;
}

export function findResultById(service, id) {
  const cached = readCatalogItem(service, id);
  if (cached) return cached;
  if (service === "flight") return findFlightById(id);
  if (service === "hotel") return findHotelById(id);
  if (service === "bus") return findBusById(id);
  return null;
}

/** Optional add-ons — never preselected. Prices are multi-currency maps. */
export const BOOKING_EXTRAS = {
  flight: [
    {
      id: "seat-standard",
      label: "Standard seat selection",
      description: "Choose your preferred seat in advance",
      prices: { USD: 18, GBP: 14 },
    },
    {
      id: "seat-extra-leg",
      label: "Extra-legroom seat",
      description: "More space in exit-row or bulkhead",
      prices: { USD: 45, GBP: 35 },
    },
    {
      id: "bag-23",
      label: "Checked bag (23 kg)",
      description: "One additional checked bag",
      prices: { USD: 55, GBP: 42 },
    },
  ],
  hotel: [
    {
      id: "breakfast",
      label: "Breakfast for all guests",
      description: "Daily buffet breakfast",
      prices: { USD: 28, GBP: 22 },
      perNight: true,
    },
    {
      id: "late-checkout",
      label: "Late checkout (2 pm)",
      description: "Subject to availability on the day",
      prices: { USD: 35, GBP: 28 },
    },
    {
      id: "parking",
      label: "On-site parking",
      description: "Secure parking for your stay",
      prices: { USD: 25, GBP: 20 },
      perNight: true,
    },
  ],
  bus: [
    {
      id: "priority-board",
      label: "Priority boarding",
      description: "Board early and pick your preferred row",
      prices: { USD: 6, GBP: 5 },
    },
    {
      id: "extra-bag",
      label: "Extra cabin bag",
      description: "One additional small bag",
      prices: { USD: 10, GBP: 8 },
    },
  ],
};

/** Mock room inventory per hotel — selectable on details. */
export function getHotelRooms(hotelId) {
  const cached = readCatalogItem("hotel", hotelId);
  if (cached?.apiRooms?.length) return cached.apiRooms;

  const hotel = findHotelById(hotelId);
  if (!hotel) return [];

  const base = hotel.prices;
  return [
    {
      id: `${hotelId}-room-std`,
      name: hotel.roomType || "Standard Room",
      bedType: "1 Queen bed",
      sleeps: 2,
      cancellation: hotel.cancellation,
      prices: base,
      selectedDefault: true,
    },
    {
      id: `${hotelId}-room-deluxe`,
      name: "Deluxe Room",
      bedType: "1 King bed",
      sleeps: 2,
      cancellation: "Free cancellation until 24h before check-in",
      prices: {
        USD: {
          base: Math.round(base.USD.base * 1.22),
          taxes: Math.round(base.USD.taxes * 1.22),
          total: Math.round(base.USD.total * 1.22),
        },
        GBP: {
          base: Math.round(base.GBP.base * 1.22),
          taxes: Math.round(base.GBP.taxes * 1.22),
          total: Math.round(base.GBP.total * 1.22),
        },
      },
    },
    {
      id: `${hotelId}-room-suite`,
      name: "Junior Suite",
      bedType: "1 King + sofa",
      sleeps: 3,
      cancellation: hotel.cancellation,
      prices: {
        USD: {
          base: Math.round(base.USD.base * 1.55),
          taxes: Math.round(base.USD.taxes * 1.55),
          total: Math.round(base.USD.total * 1.55),
        },
        GBP: {
          base: Math.round(base.GBP.base * 1.55),
          taxes: Math.round(base.GBP.taxes * 1.55),
          total: Math.round(base.GBP.total * 1.55),
        },
      },
    },
  ];
}

/** Static seat map for bus mock selection. */
export const BUS_SEAT_MAP = [
  ["1A", "1B", null, "1C", "1D"],
  ["2A", "2B", null, "2C", "2D"],
  ["3A", "3B", null, "3C", "3D"],
  ["4A", "4B", null, "4C", "4D"],
  ["5A", "5B", null, "5C", "5D"],
];

export const BUS_TAKEN_SEATS = ["1A", "2C", "3D", "4B"];

export function getExtraPrice(extra, nights = 1, marketId = getActiveMarketId()) {
  const display = getActiveCurrencyCode(marketId);
  const prices = extra.prices || {};
  const sourceCurrency = prices[display]
    ? display
    : prices.INR
      ? "INR"
      : prices.USD
        ? "USD"
        : prices.GBP
          ? "GBP"
          : Object.keys(prices)[0];
  const amount = sourceCurrency ? Number(prices[sourceCurrency]) || 0 : 0;
  const converted = convertAmount(amount, sourceCurrency || display, display);
  return extra.perNight ? converted * Math.max(1, nights) : converted;
}

export function calcBookingTotals({
  service,
  item,
  room,
  selectedExtras,
  nights = 1,
  marketId = getActiveMarketId(),
  discount = 0,
}) {
  const currency = getActiveCurrencyCode(marketId);
  const sourcePrices = room?.prices || item?.prices || {};
  const sourceCurrency = sourcePrices.INR
    ? "INR"
    : sourcePrices.USD
      ? "USD"
      : sourcePrices.GBP
        ? "GBP"
        : Object.keys(sourcePrices)[0];
  const price = sourceCurrency ? sourcePrices[sourceCurrency] : null;
  const pax = Math.max(1, Number(item?.paxCount) || 1);
  let base = convertAmount(price?.base || 0, sourceCurrency || "INR", currency) * pax;
  let taxes = convertAmount(price?.taxes || 0, sourceCurrency || "INR", currency) * pax;

  if (service === "hotel") {
    const n = Math.max(1, nights);
    base *= n;
    taxes *= n;
  }

  const extrasTotal = (selectedExtras || []).reduce(
    (sum, extra) => sum + getExtraPrice(extra, nights, marketId),
    0,
  );

  const subtotal = base + taxes + extrasTotal;
  const discountSafe = Math.min(discount, subtotal);
  const total = Math.max(0, subtotal - discountSafe);

  return {
    currency,
    base,
    taxes,
    extras: extrasTotal,
    discount: discountSafe,
    total,
    baseLabel: formatMoney(base, marketId, currency),
    taxesLabel: formatMoney(taxes, marketId, currency),
    extrasLabel: formatMoney(extrasTotal, marketId, currency),
    discountLabel: formatMoney(discountSafe, marketId, currency),
    totalLabel: formatMoney(total, marketId, currency),
  };
}

export function buildCheckoutHref(service, id, searchQuery, options = {}) {
  const params = searchQueryToParams({
    ...searchQuery,
    service,
  });
  params.set("service", service);
  params.set("id", id);
  if (options.roomId) params.set("room", options.roomId);
  if (options.seat) params.set("seat", options.seat);
  if (options.extras?.length) params.set("extras", options.extras.join(","));
  return `/checkout?${params.toString()}`;
}

export function buildResultsReturnHref(service, searchQuery) {
  const path =
    service === "flight" ? "/flights" : service === "hotel" ? "/hotels" : "/buses";
  const params = searchQueryToParams(searchQuery || {});
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export function saveBookingDraft(draft) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(BOOKING_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // ignore quota / private mode
  }
}

export function loadBookingDraft() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(BOOKING_DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function nightsFromSearch(searchQuery) {
  return nightsBetween(searchQuery?.checkIn, searchQuery?.checkOut) || 1;
}
