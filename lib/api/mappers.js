const HOTEL_IMAGE =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80";

function clock(iso) {
  const match = String(iso || "").match(/T(\d{2}:\d{2})/);
  return match ? match[1] : "";
}

function hourBucket(hhmm) {
  const hour = Number(String(hhmm).slice(0, 2));
  if (Number.isNaN(hour)) return "morning";
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 15) return "midday";
  if (hour >= 15 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

function moneyParts(amount, currency) {
  const total = Number(amount) || 0;
  return { base: total, taxes: 0, total };
}

function fareBrandLabel(fare, index) {
  const raw = String(fare?.fareType || fare?.fareName || fare?.brandName || fare?.productClass || "")
    .trim()
    .toLowerCase();
  if (raw.includes("corp")) return "Corporate";
  if (raw.includes("flex")) return "Flexi";
  if (raw.includes("saver") || raw.includes("lite") || raw.includes("basic")) return "Saver";
  if (raw.includes("publish") || raw.includes("regular") || raw.includes("standard")) return "Publish";
  if (raw.includes("refund")) return "Refundable";
  if (fare?.refundable) return "Flexi";
  if (fare?.fareType) return String(fare.fareType).replace(/_/g, " ");
  const fallback = ["Saver", "Publish", "Flexi", "Corporate"];
  return fallback[index % fallback.length];
}

function mapFareOption(fare, index, flight) {
  const currency = fare?.price?.currency || flight.lowestPrice?.currency || "INR";
  const amount = fare?.price?.amount ?? flight.lowestPrice?.amount ?? 0;
  const cabinKg = fare?.baggage?.cabinKg ?? (index === 0 ? 7 : index === 3 ? 10 : 7);
  const checkinKg = fare?.baggage?.checkinKg ?? (15 + index * 5);
  const label = fareBrandLabel(fare, index);
  const refundable = Boolean(fare?.refundable) || /flex|corp|refund/i.test(label);
  const meals = Boolean(fare?.mealsIncluded) || /flex|corp|publish/i.test(label);
  const seatSelection = Boolean(fare?.seatSelection) || /flex|corp/i.test(label);
  const baggage = `${cabinKg} kg cabin · ${checkinKg} kg check-in`;
  return {
    id: fare?.aplFareId || `${flight.aplFlightId}-fare-${index}`,
    aplFareId: fare?.aplFareId || null,
    label,
    cabin: String(fare?.cabinClass || flight.cabinClass || "Economy").replace(/_/g, " "),
    baggage,
    cabinKg,
    checkinKg,
    meals,
    seatSelection,
    refundable,
    changeFee: refundable ? "Paid change" : "Change fee applies",
    cancelFee: refundable ? "Partially refundable" : "Non-refundable",
    fareConditions: refundable
      ? "Refundable with airline rules"
      : `${label} fare · rules apply`,
    quote: { amount: Number(amount), currency },
    prices: { [currency]: moneyParts(amount, currency) },
  };
}

function ensureFareOptions(flight) {
  const rows = Array.isArray(flight.flightFareData) ? flight.flightFareData : [];
  const mapped = rows.map((fare, index) => mapFareOption(fare, index, flight));
  // Only use fares from the live API response. Do not invent Flexi/Publish
  // client-side — that caused confirmPrice mismatches against Render.
  if (mapped.length) return mapped;

  return [
    mapFareOption(
      {
        price: flight.lowestPrice,
        cabinClass: flight.cabinClass,
        refundable: false,
        fareType: "Saver",
        baggage: { cabinKg: 7, checkinKg: 15 },
      },
      0,
      flight,
    ),
  ];
}

export function mapFlightOffer(flight, index) {
  const fares = ensureFareOptions(flight);
  const fare = fares[0];
  const currency = fare?.quote?.currency || flight.lowestPrice?.currency || "INR";
  const amount = fare?.quote?.amount ?? flight.lowestPrice?.amount ?? 0;
  const fromTime = clock(flight.departure?.at);
  const toTime = clock(flight.arrival?.at);
  const stops = Math.max(0, (flight.segments?.length || 1) - 1);

  return {
    id: flight.aplFlightId,
    searchId: flight.searchId,
    aplFareId: fare?.aplFareId || null,
    selectedFareId: fare?.id || null,
    fares,
    quote: {
      amount: Number(amount),
      currency,
    },
    airline: flight.airline?.name || flight.airline?.code || "Airline",
    airlineCode: flight.airline?.code || "—",
    from: {
      code: flight.departure?.airport,
      city: flight.departure?.airportInfo?.cityName || flight.departure?.airport,
      time: fromTime,
      date: String(flight.departure?.at || "").slice(0, 10),
    },
    to: {
      code: flight.arrival?.airport,
      city: flight.arrival?.airportInfo?.cityName || flight.arrival?.airport,
      time: toTime,
      date: String(flight.arrival?.at || "").slice(0, 10),
    },
    durationMinutes: flight.durationMinutes || 0,
    stops,
    stopLabel: stops === 0 ? "Non-stop" : `${stops} stop`,
    cabin: fare?.cabin || String(flight.cabinClass || "Economy").replace(/_/g, " "),
    baggage: fare?.baggage || "Baggage as per fare",
    fareConditions: fare?.fareConditions || "Fare rules apply",
    departBucket: hourBucket(fromTime),
    arriveBucket: hourBucket(toTime),
    recommendedRank: index + 1,
    prices: fare?.prices || { [currency]: moneyParts(amount, currency) },
  };
}

export function mapHotelOffer(hotel, index, searchId) {
  const room = hotel.availableRooms?.[0];
  const currency = room?.price?.currency || hotel.lowestPrice?.currency || "INR";
  const amount = room?.price?.amount ?? hotel.lowestPrice?.amount ?? 0;
  const parts = moneyParts(amount, currency);
  const apiRooms = (hotel.availableRooms || []).map((entry, roomIndex) => ({
    id: entry.aplRoomId,
    quote: {
      amount: Number(entry.price?.amount ?? amount),
      currency: entry.price?.currency || currency,
    },
    name: entry.roomName,
    bedType: entry.bedType || "Bed type on request",
    sleeps: entry.occupancy?.maxAdults || 2,
    cancellation: entry.cancellation?.refundable
      ? "Refundable rate"
      : "Non-refundable rate",
    prices: {
      [entry.price?.currency || currency]: moneyParts(
        entry.price?.amount ?? amount,
        entry.price?.currency || currency,
      ),
    },
    selectedDefault: roomIndex === 0,
  }));

  return {
    id: hotel.aplHotelId,
    searchId: searchId || hotel.searchId || null,
    name: hotel.name,
    location: [hotel.location?.addressLine1, hotel.location?.city].filter(Boolean).join(", "),
    city: hotel.location?.city,
    stars: Number(hotel.starRating) || 0,
    rating: Number(hotel.starRating) ? Math.min(9.4, 6 + Number(hotel.starRating) * 0.6) : 8,
    reviewCount: 0,
    propertyType: "Hotel",
    amenities: [room?.mealPlan, room?.bedType].filter(Boolean),
    roomType: room?.roomName || "Room",
    cancellation: room?.cancellation?.refundable ? "Refundable rate" : "Non-refundable rate",
    distanceKm: 0,
    image: HOTEL_IMAGE,
    recommendedRank: index + 1,
    prices: { [currency]: parts },
    apiRooms,
  };
}
