import { formatMoney, getLocale, getActiveCurrencyCode } from "@/data/markets";
import { fromDateParam } from "@/lib/searchQuery";

export function getPriceParts(item, marketId) {
  const currency = getActiveCurrencyCode(marketId);
  const price = item.prices?.[currency] || item.prices?.USD || item.prices?.GBP;
  if (!price) {
    return { base: 0, taxes: 0, total: 0, currency };
  }
  const usedCurrency =
    item.prices?.[currency] != null
      ? currency
      : item.prices?.USD != null
        ? "USD"
        : "GBP";
  return { ...price, currency: usedCurrency };
}

export function formatPriceParts(item, marketId) {
  const parts = getPriceParts(item, marketId);
  return {
    ...parts,
    baseLabel: formatMoney(parts.base, marketId),
    taxesLabel: formatMoney(parts.taxes, marketId),
    totalLabel: formatMoney(parts.total, marketId),
  };
}

export function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h <= 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatShortDate(dateOrParam, marketId) {
  const date =
    dateOrParam instanceof Date ? dateOrParam : fromDateParam(dateOrParam);
  if (!date) return "";
  return date.toLocaleDateString(getLocale(marketId), {
    day: "numeric",
    month: "short",
  });
}

export function nightsBetween(checkIn, checkOut) {
  const a = checkIn instanceof Date ? checkIn : fromDateParam(checkIn);
  const b = checkOut instanceof Date ? checkOut : fromDateParam(checkOut);
  if (!a || !b) return 0;
  const ms = b.getTime() - a.getTime();
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}

export function travellerLabel({ adults = 1, children = 0, infants = 0 }) {
  const parts = [];
  parts.push(`${adults} Adult${adults === 1 ? "" : "s"}`);
  if (children) parts.push(`${children} Child${children === 1 ? "" : "ren"}`);
  if (infants) parts.push(`${infants} Infant${infants === 1 ? "" : "s"}`);
  return parts.join(" · ");
}

export function buildFlightSummary(query, marketId) {
  const travellers = travellerLabel(query);
  const fare =
    {
      normal: "Standard",
      seniorcitizen: "Senior",
      armedforces: "Military",
      student: "Student",
      doctor_nurses: "Healthcare",
    }[query.fareType] || "Standard";

  return {
    title: "Flights",
    primary: `${query.from || "From"} → ${query.to || "To"}`,
    secondary: [
      formatShortDate(query.depart, marketId),
      query.return ? `Return ${formatShortDate(query.return, marketId)}` : null,
      travellers,
      fare,
    ]
      .filter(Boolean)
      .join(" · "),
  };
}

export function buildHotelSummary(query, marketId) {
  const nights = nightsBetween(query.checkIn, query.checkOut);
  return {
    title: "Hotels",
    primary: query.destination || "Destination",
    secondary: [
      `${formatShortDate(query.checkIn, marketId)} → ${formatShortDate(query.checkOut, marketId)}`,
      nights ? `${nights} night${nights === 1 ? "" : "s"}` : null,
      `${query.guests || 2} Guest${Number(query.guests) === 1 ? "" : "s"}`,
      `${query.rooms || 1} Room${Number(query.rooms) === 1 ? "" : "s"}`,
    ]
      .filter(Boolean)
      .join(" · "),
  };
}

export function buildBusSummary(query, marketId) {
  return {
    title: "Buses",
    primary: `${query.from || "From"} → ${query.to || "To"}`,
    secondary: [formatShortDate(query.date, marketId), "Tickets selected later"]
      .filter(Boolean)
      .join(" · "),
  };
}

export function buildHomeSearchHref(service, query) {
  const params = new URLSearchParams();
  params.set("service", service);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (key === "service" || value == null || value === "") return;
      params.set(key, String(value));
    });
  }
  return `/?${params.toString()}#search`;
}

export function buildDetailsHref(service, resultId, searchQuery) {
  const base =
    service === "flight"
      ? "/flights/details"
      : service === "hotel"
        ? "/hotels/details"
        : "/buses/details";
  const params = new URLSearchParams();
  params.set("id", resultId);
  if (searchQuery) {
    Object.entries(searchQuery).forEach(([key, value]) => {
      if (key === "service" || value == null || value === "") return;
      params.set(key, String(value));
    });
  }
  return `${base}?${params.toString()}`;
}

/** Filter + sort helpers — use display currency, never destination. */

function priceTotal(item, marketId) {
  const currency = getActiveCurrencyCode(marketId);
  return (
    item.prices?.[currency]?.total ??
    item.prices?.USD?.total ??
    item.prices?.GBP?.total ??
    0
  );
}

export function filterFlights(items, filters, marketId) {
  return items.filter((item) => {
    const total = priceTotal(item, marketId);
    if (filters.stops?.length && !filters.stops.includes(String(item.stops))) {
      return false;
    }
    if (filters.airlines?.length && !filters.airlines.includes(item.airline)) {
      return false;
    }
    if (
      filters.departBuckets?.length &&
      !filters.departBuckets.includes(item.departBucket)
    ) {
      return false;
    }
    if (
      filters.arriveBuckets?.length &&
      !filters.arriveBuckets.includes(item.arriveBucket)
    ) {
      return false;
    }
    if (filters.maxPrice != null && total > filters.maxPrice) return false;
    if (filters.maxDuration != null && item.durationMinutes > filters.maxDuration) {
      return false;
    }
    return true;
  });
}

export function sortFlights(items, sort, marketId) {
  const next = [...items];
  switch (sort) {
    case "cheapest":
      return next.sort(
        (a, b) => priceTotal(a, marketId) - priceTotal(b, marketId),
      );
    case "fastest":
      return next.sort((a, b) => a.durationMinutes - b.durationMinutes);
    case "departure":
      return next.sort((a, b) => a.from.time.localeCompare(b.from.time));
    case "recommended":
    default:
      return next.sort((a, b) => a.recommendedRank - b.recommendedRank);
  }
}

export function filterHotels(items, filters, marketId) {
  return items.filter((item) => {
    const total = priceTotal(item, marketId);
    if (filters.maxPrice != null && total > filters.maxPrice) return false;
    if (filters.minRating != null && item.rating < filters.minRating) return false;
    if (filters.stars?.length && !filters.stars.includes(String(item.stars))) {
      return false;
    }
    if (
      filters.propertyTypes?.length &&
      !filters.propertyTypes.includes(item.propertyType)
    ) {
      return false;
    }
    if (filters.amenities?.length) {
      const hasAll = filters.amenities.every((a) => item.amenities.includes(a));
      if (!hasAll) return false;
    }
    if (filters.locations?.length && !filters.locations.includes(item.location)) {
      return false;
    }
    return true;
  });
}

export function sortHotels(items, sort, marketId) {
  const next = [...items];
  switch (sort) {
    case "price":
      return next.sort(
        (a, b) => priceTotal(a, marketId) - priceTotal(b, marketId),
      );
    case "rating":
      return next.sort((a, b) => b.rating - a.rating);
    case "distance":
      return next.sort((a, b) => a.distanceKm - b.distanceKm);
    case "recommended":
    default:
      return next.sort((a, b) => a.recommendedRank - b.recommendedRank);
  }
}

export function filterBuses(items, filters, marketId) {
  return items.filter((item) => {
    const total = priceTotal(item, marketId);
    if (filters.maxPrice != null && total > filters.maxPrice) return false;
    if (
      filters.departBuckets?.length &&
      !filters.departBuckets.includes(item.departBucket)
    ) {
      return false;
    }
    if (
      filters.arriveBuckets?.length &&
      !filters.arriveBuckets.includes(item.arriveBucket)
    ) {
      return false;
    }
    if (filters.operators?.length && !filters.operators.includes(item.operator)) {
      return false;
    }
    if (filters.busTypes?.length && !filters.busTypes.includes(item.busType)) {
      return false;
    }
    return true;
  });
}

export function sortBuses(items, sort, marketId) {
  const next = [...items];
  switch (sort) {
    case "cheapest":
      return next.sort(
        (a, b) => priceTotal(a, marketId) - priceTotal(b, marketId),
      );
    case "fastest":
      return next.sort((a, b) => a.durationMinutes - b.durationMinutes);
    case "departure":
      return next.sort((a, b) => a.from.time.localeCompare(b.from.time));
    case "recommended":
    default:
      return next.sort((a, b) => a.recommendedRank - b.recommendedRank);
  }
}

export const TIME_BUCKETS = [
  { id: "morning", label: "Morning (5–12)" },
  { id: "midday", label: "Midday (12–15)" },
  { id: "afternoon", label: "Afternoon (15–17)" },
  { id: "evening", label: "Evening (17–21)" },
  { id: "night", label: "Night (21–5)" },
];
