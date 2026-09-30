import { formatMoney, getLocale, getActiveCurrencyCode, convertAmount } from "@/data/markets";
import { fromDateParam } from "@/lib/searchQuery";

export function getPriceParts(item, marketId) {
  const prices = item.prices || {};
  const sourceCurrency = prices.INR
    ? "INR"
    : prices.USD
      ? "USD"
      : prices.GBP
        ? "GBP"
        : Object.keys(prices)[0];
  const price = sourceCurrency ? prices[sourceCurrency] : null;
  const display = getActiveCurrencyCode(marketId);
  const pax = Math.max(1, Number(item?.paxCount) || 1);
  if (!price) {
    return { base: 0, taxes: 0, total: 0, currency: display, pax };
  }
  return {
    base: convertAmount(price.base, sourceCurrency, display) * pax,
    taxes: convertAmount(price.taxes, sourceCurrency, display) * pax,
    total: convertAmount(price.total, sourceCurrency, display) * pax,
    currency: display,
    pax,
  };
}

export function formatPriceParts(item, marketId) {
  const parts = getPriceParts(item, marketId);
  return {
    ...parts,
    baseLabel: formatMoney(parts.base, marketId, parts.currency),
    taxesLabel: formatMoney(parts.taxes, marketId, parts.currency),
    totalLabel: formatMoney(parts.total, marketId, parts.currency),
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
  const adultCount = Number(adults) || 1;
  const childCount = Number(children) || 0;
  const infantCount = Number(infants) || 0;
  const parts = [`${adultCount} Adult${adultCount === 1 ? "" : "s"}`];
  if (childCount) parts.push(`${childCount} Child${childCount === 1 ? "" : "ren"}`);
  if (infantCount) parts.push(`${infantCount} Infant${infantCount === 1 ? "" : "s"}`);
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

  if (query.trip === "multi") {
    let legs = [];
    try {
      legs = JSON.parse(query.legs || "[]");
    } catch {
      legs = [];
    }
    const route = legs
      .map((leg) => `${leg.from || leg.originCityCode} → ${leg.to || leg.destinationCityCode}`)
      .filter(Boolean)
      .join(" · ");
    return {
      title: "Flights",
      primary: legs.length ? `${legs.length} flights` : "Multi-city",
      secondary: [route, travellers, fare].filter(Boolean).join(" · "),
    };
  }

  return {
    title: "Flights",
    primary: `${query.from || "From"} → ${query.to || "To"}`,
    secondary: [
      query.trip === "return" ? "Return" : "One way",
      formatShortDate(query.depart, marketId),
      query.trip === "return" && query.return
        ? `Back ${formatShortDate(query.return, marketId)}`
        : null,
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
  return getPriceParts(item, marketId).total;
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
    const duration = item.totalDurationMinutes || item.durationMinutes;
    if (filters.maxDuration != null && duration > filters.maxDuration) return false;
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
      return next.sort(
        (a, b) =>
          (a.totalDurationMinutes || a.durationMinutes) -
          (b.totalDurationMinutes || b.durationMinutes),
      );
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
