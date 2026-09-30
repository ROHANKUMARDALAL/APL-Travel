import { apiPost } from "@/lib/api/client";
import { rememberCatalog } from "@/lib/api/catalogCache";
import { mapFlightOffer, mapHotelOffer } from "@/lib/api/mappers";

export async function searchAirports(query) {
  const data = await apiPost("/flights/airports/search", { query });
  return data?.cities || [];
}

export async function searchHotelCities(query) {
  const data = await apiPost("/hotels/cities/search", { query });
  return data?.cities || [];
}

async function searchOneWay(params) {
  const data = await apiPost("/flights/search", {
    originCityCode: params.originCityCode,
    destinationCityCode: params.destinationCityCode,
    departDate: params.depart,
    tripType: "ONEWAY",
    adults: Number(params.adults || 1),
    children: Number(params.children || 0),
    infants: Number(params.infants || 0),
    cabinClass: "ECONOMY",
    currency: "INR",
  });
  return (data?.flights || []).map((flight, index) =>
    mapFlightOffer({ ...flight, searchId: data.searchId }, index),
  );
}

function fareAmount(item) {
  const currency = Object.keys(item?.prices || {})[0];
  return Number(item?.prices?.[currency]?.total) || 0;
}

function searchedPax(params) {
  const adults = Number(params.adults || 0);
  const children = Number(params.children || 0);
  const infants = Number(params.infants || 0);
  return Math.max(1, adults + children + infants);
}

function withPaxCount(items, paxCount) {
  return items.map((item) => ({ ...item, paxCount }));
}

function combineRoundTrip(outbound, inbound) {
  const currency = Object.keys(outbound.prices || {})[0] || "INR";
  const returnCurrency = Object.keys(inbound.prices || {})[0] || currency;
  const outboundTotal = fareAmount(outbound);
  const inboundTotal = fareAmount(inbound);
  return {
    ...outbound,
    id: `${outbound.id}::${inbound.id}`,
    tripType: "return",
    returnLeg: {
      ...inbound,
      airline: inbound.airline,
      airlineCode: inbound.airlineCode,
    },
    totalDurationMinutes: (outbound.durationMinutes || 0) + (inbound.durationMinutes || 0),
    prices: {
      [currency]: {
        base: outboundTotal + inboundTotal,
        taxes: 0,
        total: outboundTotal + (returnCurrency === currency ? inboundTotal : inboundTotal),
      },
    },
  };
}

function pairRoundTrips(outbound, inbound) {
  if (!inbound.length) return [];
  return outbound.map((flight, index) => {
    const sameAirline = inbound.filter((item) => item.airlineCode === flight.airlineCode);
    const pool = sameAirline.length ? sameAirline : inbound;
    const ranked = pool.slice().sort((a, b) => fareAmount(a) - fareAmount(b));
    const match = ranked[index % ranked.length];
    return combineRoundTrip(flight, match);
  });
}

export async function searchFlights(params) {
  const passengers = {
    adults: params.adults,
    children: params.children,
    infants: params.infants,
  };

  if (params.tripType === "multi") {
    const legs = Array.isArray(params.legs) ? params.legs : [];
    const items = [];
    for (let index = 0; index < legs.length; index += 1) {
      const leg = legs[index];
      if (!leg?.originCityCode || !leg?.destinationCityCode || !leg?.depart) {
        throw new Error(`Choose both cities and a date for flight ${index + 1}.`);
      }
      if (index > 0 && String(leg.depart) < String(legs[index - 1].depart)) {
        throw new Error(`Flight ${index + 1} must depart on or after flight ${index}.`);
      }
      const offers = await searchOneWay({ ...passengers, ...leg });
      offers.forEach((offer) => {
        items.push({
          ...offer,
          id: `leg${index + 1}-${offer.id}`,
          legIndex: index,
          legLabel: `Flight ${index + 1} · ${leg.from || leg.originCityCode} → ${leg.to || leg.destinationCityCode}`,
        });
      });
    }
    const priced = withPaxCount(items, searchedPax(params));
    rememberCatalog("flight", priced);
    return priced;
  }

  const outbound = await searchOneWay(params);
  if (params.tripType === "return" && params.return) {
    const inbound = await searchOneWay({
      ...passengers,
      originCityCode: params.destinationCityCode,
      destinationCityCode: params.originCityCode,
      depart: params.return,
    });
    const paired = pairRoundTrips(outbound, inbound);
    if (!paired.length) {
      throw new Error("No return flights were found for those dates.");
    }
    const priced = withPaxCount(paired, searchedPax(params));
    rememberCatalog("flight", priced);
    return priced;
  }

  const priced = withPaxCount(outbound, searchedPax(params));
  rememberCatalog("flight", priced);
  return priced;
}

export async function searchHotels(params) {
  const data = await apiPost("/hotels/search", {
    cityCode: params.cityCode,
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    rooms: Number(params.rooms || 1),
    adults: Number(params.adults || params.guests || 2),
    children: 0,
    childAges: [],
    currency: "INR",
  });
  const guests = Math.max(1, Number(params.adults || params.guests || 1));
  const items = (data?.hotels || []).map((hotel, index) => ({
    ...mapHotelOffer(hotel, index, data?.searchId),
    paxCount: guests,
  }));
  rememberCatalog("hotel", items);
  return items;
}
