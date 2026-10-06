import { startOfDay } from "@/lib/dateUtils";

export const SERVICE_IDS = ["flight", "hotel", "bus", "transfer"];

export const RESULTS_PATHS = {
  flight: "/flights",
  hotel: "/hotels",
  bus: "/buses",
  transfer: "/transfers",
};

export function isValidService(serviceId) {
  return SERVICE_IDS.includes(serviceId);
}

export function normalizeService(serviceId) {
  return isValidService(serviceId) ? serviceId : "flight";
}

/** Serialize a Date to YYYY-MM-DD for URL query params. */
export function toDateParam(date) {
  if (!date) return "";
  const d = startOfDay(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Parse YYYY-MM-DD into a local Date at start of day. */
export function fromDateParam(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  return startOfDay(new Date(year, month - 1, day));
}

/**
 * Canonical search objects — forms emit these shapes.
 * Serialize to URLSearchParams for future results navigation.
 */

export function buildFlightSearchQuery({
  tripType = "oneway",
  from,
  to,
  originCityCode,
  destinationCityCode,
  departDate,
  returnDate,
  legs,
  adults,
  children,
  infants,
  fareType,
  error,
}) {
  const trip = tripType === "return" || tripType === "multi" ? tripType : "oneway";
  const query = {
    service: "flight",
    trip,
    from: from || "",
    to: to || "",
    originCityCode: originCityCode || "",
    destinationCityCode: destinationCityCode || "",
    depart: toDateParam(departDate),
    adults: String(adults ?? 1),
    children: String(children ?? 0),
    infants: String(infants ?? 0),
    fareType: fareType || "normal",
    error: error || "",
  };

  if (trip === "return" && returnDate) {
    query.return = toDateParam(returnDate);
  }
  if (trip === "multi" && Array.isArray(legs) && legs.length) {
    query.legs = JSON.stringify(
      legs.map((leg) => ({
        from: leg.from || "",
        to: leg.to || "",
        originCityCode: leg.originCityCode || "",
        destinationCityCode: leg.destinationCityCode || "",
        depart: leg.depart instanceof Date ? toDateParam(leg.depart) : leg.depart || "",
      })),
    );
  }
  return query;
}

export function buildHotelSearchQuery({
  destination,
  cityCode,
  checkInDate,
  checkOutDate,
  guests,
  rooms,
}) {
  return {
    service: "hotel",
    destination: destination || "",
    cityCode: cityCode || "",
    checkIn: toDateParam(checkInDate),
    checkOut: toDateParam(checkOutDate),
    guests: String(guests ?? 2),
    rooms: String(rooms ?? 1),
  };
}

export function buildBusSearchQuery({ from, to, travelDate }) {
  return {
    service: "bus",
    from: from || "",
    to: to || "",
    date: toDateParam(travelDate),
  };
}

export function buildTransferSearchQuery({
  pickup,
  dropoff,
  pickupKind,
  dropoffKind,
  travelDate,
  pickupTime,
  passengers,
}) {
  return {
    service: "transfer",
    pickup: pickup || "",
    dropoff: dropoff || "",
    pickupKind: pickupKind || "AIRPORT",
    dropoffKind: dropoffKind || "HOTEL",
    date: toDateParam(travelDate),
    time: pickupTime || "10:00",
    passengers: String(passengers ?? 1),
  };
}

export function searchQueryToParams(query) {
  const params = new URLSearchParams();
  if (!query) return params;
  Object.entries(query).forEach(([key, value]) => {
    if (key === "service" || key === "error") return;
    if (value == null || value === "") return;
    params.set(key, String(value));
  });
  return params;
}

/**
 * Future results navigation helper — Phase 0 prepares the href only.
 * Example: /flights?from=JFK&to=LHR&depart=2026-09-22&...
 */
export function buildResultsHref(service, query) {
  const path = RESULTS_PATHS[normalizeService(service)];
  const params = searchQueryToParams(query);
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export function parseFlightSearchParams(searchParams) {
  const get = (key) =>
    typeof searchParams?.get === "function"
      ? searchParams.get(key)
      : searchParams?.[key];

  const rawTrip = get("trip");
  const tripType =
    rawTrip === "return" || rawTrip === "multi" || rawTrip === "oneway"
      ? rawTrip
      : get("return")
        ? "return"
        : "oneway";
  let legs = [];
  if (tripType === "multi" && get("legs")) {
    try {
      const parsed = JSON.parse(get("legs"));
      if (Array.isArray(parsed)) legs = parsed;
    } catch {
      legs = [];
    }
  }

  return {
    from: get("from") || "",
    to: get("to") || "",
    departDate: fromDateParam(get("depart")),
    returnDate: tripType === "return" ? fromDateParam(get("return")) : null,
    adults: Number(get("adults") || 1),
    children: Number(get("children") || 0),
    infants: Number(get("infants") || 0),
    fareType: get("fareType") || "normal",
    originCityCode: get("originCityCode") || "",
    destinationCityCode: get("destinationCityCode") || "",
    tripType,
    legs,
  };
}

export function parseHotelSearchParams(searchParams) {
  const get = (key) =>
    typeof searchParams?.get === "function"
      ? searchParams.get(key)
      : searchParams?.[key];

  return {
    destination: get("destination") || "",
    checkInDate: fromDateParam(get("checkIn")),
    checkOutDate: fromDateParam(get("checkOut")),
    guests: Number(get("guests") || 2),
    rooms: Number(get("rooms") || 1),
    cityCode: get("cityCode") || "",
  };
}

export function parseBusSearchParams(searchParams) {
  const get = (key) =>
    typeof searchParams?.get === "function"
      ? searchParams.get(key)
      : searchParams?.[key];

  return {
    from: get("from") || "",
    to: get("to") || "",
    travelDate: fromDateParam(get("date")),
  };
}

export function parseTransferSearchParams(searchParams) {
  const get = (key) =>
    typeof searchParams?.get === "function"
      ? searchParams.get(key)
      : searchParams?.[key];

  return {
    pickup: get("pickup") || "",
    dropoff: get("dropoff") || "",
    pickupKind: get("pickupKind") || "AIRPORT",
    dropoffKind: get("dropoffKind") || "HOTEL",
    travelDate: fromDateParam(get("date")),
    pickupTime: get("time") || "10:00",
    passengers: Number(get("passengers") || 1),
  };
}
