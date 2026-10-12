import { addDays, isBeforeDay, startOfDay, today } from "@/lib/dateUtils";

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
/**
 * Turn a saved popular route into the same flight query the search form submits.
 * Returns an error instead of a query when the saved configuration cannot be searched.
 */
export function buildPopularFlightSearch(route) {
  const origin = String(route?.originCode || "").trim().toUpperCase();
  const destination = String(route?.destinationCode || "").trim().toUpperCase();
  const airportCode = /^[A-Z0-9]{3}$/;
  if (!airportCode.test(origin) || !airportCode.test(destination)) {
    return { error: "This route is missing a valid airport code. Choose the cities again from search." };
  }
  if (origin === destination) {
    return { error: "Departure and arrival airports must be different." };
  }

  const tripRaw = String(route?.tripType || "ONEWAY").toUpperCase();
  if (tripRaw !== "ONEWAY" && tripRaw !== "ROUNDTRIP") {
    return { error: "This route uses a trip type that flight search does not support." };
  }
  const tripType = tripRaw === "ROUNDTRIP" ? "return" : "oneway";

  const offset = Number(route?.departOffsetDays ?? 7);
  if (!Number.isInteger(offset) || offset < 1 || offset > 365) {
    return { error: "This route does not have a valid future departure date." };
  }
  const departDate = addDays(today(), offset);
  if (isBeforeDay(departDate, today())) {
    return { error: "The departure date for this route is in the past." };
  }
  const returnDate = tripType === "return" ? addDays(departDate, 7) : null;
  if (tripType === "return" && (!returnDate || isBeforeDay(returnDate, departDate))) {
    return { error: "This round trip is missing a return date after departure." };
  }

  const adults = Number(route?.adults ?? 1);
  const children = Number(route?.children ?? 0);
  const infants = Number(route?.infants ?? 0);
  if (!Number.isInteger(adults) || adults < 1 || adults > 9) {
    return { error: "This route has an invalid adult count." };
  }
  if (!Number.isInteger(children) || children < 0 || adults + children > 9) {
    return { error: "This route has an invalid passenger count." };
  }
  if (!Number.isInteger(infants) || infants < 0 || infants > adults) {
    return { error: "Infant count cannot be higher than the number of adults." };
  }

  const originName = String(route?.originName || origin).trim();
  const destinationName = String(route?.destinationName || destination).trim();
  const query = buildFlightSearchQuery({
    tripType,
    from: `${originName} (${origin})`,
    to: `${destinationName} (${destination})`,
    originCityCode: origin,
    destinationCityCode: destination,
    departDate,
    returnDate,
    adults,
    children,
    infants,
    fareType: "normal",
  });
  return { query, href: buildResultsHref("flight", query) };
}

function popularDate(route) {
  const offset = Number(route?.departOffsetDays ?? 7);
  if (!Number.isInteger(offset) || offset < 1 || offset > 365) {
    return { error: "This route does not have a valid future travel date." };
  }
  const departDate = addDays(today(), offset);
  if (isBeforeDay(departDate, today())) {
    return { error: "The travel date for this route is in the past." };
  }
  return { departDate };
}

export function buildPopularHotelSearch(route) {
  const cityCode = String(route?.originCode || "").trim();
  const destination = String(route?.originName || "").trim();
  if (!/^\d+$/.test(cityCode) || !destination) {
    return { error: "This hotel destination is missing a catalogue city." };
  }
  const dated = popularDate(route);
  if (dated.error) return dated;
  const nights = Number(route?.stayNights ?? 1);
  if (!Number.isInteger(nights) || nights < 1 || nights > 30) {
    return { error: "This hotel stay does not have a valid length." };
  }
  const guests = Number(route?.guests ?? 2);
  const rooms = Number(route?.rooms ?? 1);
  const query = buildHotelSearchQuery({
    destination,
    cityCode,
    checkInDate: dated.departDate,
    checkOutDate: addDays(dated.departDate, nights),
    guests,
    rooms,
  });
  return { query, href: buildResultsHref("hotel", query) };
}

export function buildPopularBusSearch(route) {
  const from = String(route?.originName || "").trim();
  const to = String(route?.destinationName || "").trim();
  if (from.length < 2 || to.length < 2 || from.toLowerCase() === to.toLowerCase()) {
    return { error: "This bus route needs two different cities." };
  }
  const dated = popularDate(route);
  if (dated.error) return dated;
  const query = buildBusSearchQuery({ from, to, travelDate: dated.departDate });
  return { query, href: buildResultsHref("bus", query) };
}

export function buildPopularTransferSearch(route) {
  const pickup = String(route?.originName || "").trim();
  const dropoff = String(route?.destinationName || "").trim();
  if (pickup.length < 2 || dropoff.length < 2) {
    return { error: "This transfer needs a pickup and a drop-off." };
  }
  const dated = popularDate(route);
  if (dated.error) return dated;
  const query = buildTransferSearchQuery({
    pickup,
    dropoff,
    pickupKind: route?.pickupKind || "AIRPORT",
    dropoffKind: route?.dropoffKind || "HOTEL",
    travelDate: dated.departDate,
    pickupTime: route?.pickupTime || "10:00",
    passengers: Number(route?.passengers ?? 1),
  });
  return { query, href: buildResultsHref("transfer", query) };
}

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
