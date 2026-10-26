/** Badges are derived from the flights actually returned. Ties are marked; a badge shared by every result is omitted. */

export function flightBadges(rows) {
  const marks = new Map((rows || []).map((row) => [row.id, []]));
  if (!rows || rows.length < 2) return marks;

  function distinctive(predicate) {
    const hits = rows.filter(predicate);
    return hits.length > 0 && hits.length < rows.length ? hits : [];
  }

  const cheapest = Math.min(...rows.map((row) => row.total));
  const fastest = Math.min(...rows.map((row) => row.duration));
  const best = Math.min(...rows.map((row) => row.rank));
  const directs = rows.filter((row) => row.stops === 0);
  const cheapestDirect = directs.length ? Math.min(...directs.map((row) => row.total)) : null;
  const hasConnection = rows.some((row) => row.stops > 0);

  distinctive((row) => row.rank === best).forEach((row) => marks.get(row.id).push("Recommended"));
  distinctive((row) => row.total === cheapest).forEach((row) => marks.get(row.id).push("Cheapest"));
  if (hasConnection && cheapestDirect != null) {
    distinctive((row) => row.stops === 0 && row.total === cheapestDirect).forEach((row) => {
      if (!marks.get(row.id).includes("Cheapest")) marks.get(row.id).push("Cheapest direct");
    });
  }
  distinctive((row) => row.duration === fastest).forEach((row) => marks.get(row.id).push("Fastest"));
  return marks;
}

export function hasCheckedBag(item) {
  const fares = Array.isArray(item?.fares) && item.fares.length ? item.fares : [item];
  return fares.some((fare) => Number(fare?.checkinKg) > 0);
}
