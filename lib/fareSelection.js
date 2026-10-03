/**
 * Resolve and apply a selected fare family onto a flight offer.
 * Keeps catalog items immutable; callers pass fareId from URL/draft.
 */

export function resolveSelectedFare(item, fareId) {
  const fares = Array.isArray(item?.fares) ? item.fares : [];
  if (!fares.length) return null;
  const key = String(fareId || "").trim();
  if (!key) return fares[0];
  return (
    fares.find((fare) => fare.id === key || fare.aplFareId === key) ||
    fares[0] ||
    null
  );
}

function supplierFareId(fare, item) {
  return (
    fare?.aplFareId ||
    fare?.supplierAplFareId ||
    item?.aplFareId ||
    null
  );
}

export function withSelectedFare(item, fareId) {
  if (!item) return null;
  const fare = resolveSelectedFare(item, fareId);
  if (!fare) return { ...item, selectedFareId: item.selectedFareId || null };

  const quote = fare.quote || item.quote || null;
  return {
    ...item,
    selectedFareId: fare.id,
    selectedFareLabel: fare.label || item.selectedFareLabel || "Standard",
    // Prefer the selected family's real supplier fare id; never silently keep a
    // different family's quote while pointing at another aplFareId.
    aplFareId: supplierFareId(fare, item),
    prices: fare.prices || item.prices,
    quote,
    baggage: fare.baggage || item.baggage,
    fareConditions: fare.fareConditions || item.fareConditions,
    cabin: fare.cabin || item.cabin,
    cabinKg: fare.cabinKg ?? item.cabinKg,
    checkinKg: fare.checkinKg ?? item.checkinKg,
    meals: fare.meals,
    seatSelection: fare.seatSelection,
    refundable: fare.refundable,
    selectedFare: fare,
  };
}

export function selectedFareSnapshot(item, fareId) {
  const priced = withSelectedFare(item, fareId);
  const fare = priced?.selectedFare || resolveSelectedFare(item, fareId);
  if (!fare) return null;
  return {
    id: fare.id,
    aplFareId: supplierFareId(fare, item),
    supplierAplFareId: fare.supplierAplFareId || fare.aplFareId || item?.aplFareId || null,
    label: fare.label || "Standard",
    cabin: fare.cabin || priced?.cabin || "Economy",
    baggage: fare.baggage || priced?.baggage || "",
    cabinKg: fare.cabinKg ?? null,
    checkinKg: fare.checkinKg ?? null,
    meals: Boolean(fare.meals),
    seatSelection: Boolean(fare.seatSelection),
    refundable: Boolean(fare.refundable),
    fareConditions: fare.fareConditions || "",
    quote: fare.quote || priced?.quote || null,
    prices: fare.prices || priced?.prices || null,
  };
}

/** Paying travellers exclude infants (matches backend checkout math). */
export function payingPassengerCount({ travellers, searchQuery, paxCount } = {}) {
  if (Array.isArray(travellers) && travellers.length) {
    const paying = travellers.filter((person) => {
      const type = String(person?.type || "adult").toUpperCase();
      return type !== "INFANT" && type !== "INF";
    }).length;
    if (paying > 0) return paying;
  }
  const adults = Number(searchQuery?.adults ?? 0);
  const children = Number(searchQuery?.children ?? 0);
  if (adults || children) return Math.max(1, adults + children);
  const total = Number(paxCount) || 0;
  return Math.max(1, total);
}

/**
 * Single source of truth for flight payable:
 * (selected family unit fare × paying pax) + add-on total.
 * Infants are excluded from the fare multiplier.
 */
export function computeFlightConfirmPrice({
  quote,
  selectedFareQuote,
  travellers,
  searchQuery,
  paxCount,
  addOnAmount = 0,
} = {}) {
  const paying = payingPassengerCount({ travellers, searchQuery, paxCount });
  const unitAmount = Number(selectedFareQuote?.amount ?? quote?.amount);
  const currency = String(
    selectedFareQuote?.currency || quote?.currency || "INR",
  ).toUpperCase();
  const extras = Math.max(0, Number(addOnAmount) || 0);
  if (!Number.isFinite(unitAmount) || unitAmount <= 0) {
    return {
      paying,
      unitAmount: null,
      fareAmount: null,
      addOnAmount: extras,
      amount: null,
      currency,
      ok: false,
    };
  }
  const fareAmount = unitAmount * paying;
  return {
    paying,
    unitAmount,
    fareAmount,
    addOnAmount: extras,
    amount: fareAmount + extras,
    currency,
    ok: true,
    selectedFareQuote: {
      amount: unitAmount,
      currency,
      label: selectedFareQuote?.label || quote?.label || undefined,
    },
  };
}
