/**
 * Recent flight and cab searches.
 * Stored in the browser, namespaced by tenant and customer.
 * Payloads contain search criteria only — never names, emails, or phones.
 */

import { CAB_TIME_ZONE, isPickupAllowed } from "./cabPickupLead.js";

export const RECENT_LIMIT = 5;
export const RECENT_CHANGE_EVENT = "apl-recent-change";

const LOCATION_KINDS = new Set(["AIRPORT", "HOTEL", "CITY", "ADDRESS"]);
const CAB_TRIPS = {
  AIRPORT_TRANSFER: "Airport Transfer",
  OUTSTATION: "Outstation",
  LOCAL: "Local",
};
const FLIGHT_TRIPS = {
  oneway: "One-way",
  return: "Round-trip",
  multi: "Multi-city",
};
const CABINS = {
  ECONOMY: "Economy",
  PREMIUM_ECONOMY: "Premium Economy",
  BUSINESS: "Business",
  FIRST: "First Class",
};
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function token(value, fallback = "") {
  const clean = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return clean || fallback;
}

function hashToken(value) {
  let hash = 2166136261;
  const text = String(value || "");
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `h${(hash >>> 0).toString(36)}`;
}

function customerToken(id) {
  const raw = String(id || "").trim();
  if (!raw) return "";
  if (raw.includes("@")) return hashToken(raw);
  return token(raw, "");
}

export function recentStorageKey(service, scope = {}) {
  const tenant = token(scope.tenantCode) || token(scope.host, "unresolved");
  const actor = customerToken(scope.customerId);
  const who = actor ? `c-${actor}` : "guest";
  const kind = service === "transfer" ? "transfer" : "flight";
  return `apl-b2c-recent:v1:${kind}:${tenant}:${who}`;
}

function parseIso(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return null;
  const [year, month, day] = String(value).split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

function todayIso(now) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDay(iso, now) {
  const date = parseIso(iso);
  if (!date) return "";
  const label = `${date.getDate()} ${MONTHS[date.getMonth()]}`;
  return date.getFullYear() === now.getFullYear() ? label : `${label} ${date.getFullYear()}`;
}

function normalizeTime(value) {
  const match = String(value || "").trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return "";
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours > 23 || minutes > 59) return "";
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function integerInRange(value, min, max) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || number > max) return null;
  return number;
}

function clip(value, max) {
  return String(value || "").trim().slice(0, max);
}

function readRows(storage, key) {
  try {
    const raw = storage.getItem(key);
    const parsed = JSON.parse(raw || "[]");
    return { raw, rows: Array.isArray(parsed) ? parsed : [] };
  } catch {
    return { raw: null, rows: [] };
  }
}

function writeRows(storage, key, raw, rows) {
  const next = JSON.stringify(rows);
  if (raw === next) return rows;
  storage.setItem(key, next);
  return rows;
}

function flightLeg(raw) {
  const from = clip(raw?.from, 80);
  const to = clip(raw?.to, 80);
  const originCityCode = clip(raw?.originCityCode, 8).toUpperCase();
  const destinationCityCode = clip(raw?.destinationCityCode, 8).toUpperCase();
  const depart = parseIso(raw?.depart) ? String(raw.depart) : "";
  if (!from || !to || !originCityCode || !destinationCityCode || !depart) return null;
  if (originCityCode === destinationCityCode) return null;
  return { from, to, originCityCode, destinationCityCode, depart };
}

function flightEntry(query, now) {
  if (!query || query.error) return null;
  const trip = FLIGHT_TRIPS[query.trip] ? query.trip : "";
  if (!trip) return null;
  const adults = integerInRange(query.adults, 1, 9);
  const children = integerInRange(query.children, 0, 8);
  const infants = integerInRange(query.infants, 0, 8);
  if (adults == null || children == null || infants == null) return null;
  if (adults + children > 9 || infants > adults) return null;

  let legs = [];
  if (trip === "multi") {
    let parsed = query.legs;
    if (typeof parsed === "string") {
      try {
        parsed = JSON.parse(parsed || "[]");
      } catch {
        return null;
      }
    }
    if (!Array.isArray(parsed) || parsed.length < 2 || parsed.length > 5) return null;
    legs = parsed.map(flightLeg);
    if (legs.some((leg) => !leg)) return null;
  }

  const entry = {
    trip,
    from: clip(query.from, 80),
    to: clip(query.to, 80),
    originCityCode: clip(query.originCityCode, 8).toUpperCase(),
    destinationCityCode: clip(query.destinationCityCode, 8).toUpperCase(),
    depart: parseIso(query.depart) ? String(query.depart) : "",
    return: trip === "return" && parseIso(query.return) ? String(query.return) : "",
    legs: trip === "multi" ? legs : [],
    adults,
    children,
    infants,
    fareType: clip(query.fareType, 40) || "normal",
    cabinClass: clip(query.cabinClass, 40) || "ECONOMY",
    searchedAt: now.toISOString(),
  };

  if (trip === "multi") {
    entry.from = legs[0].from;
    entry.to = legs[legs.length - 1].to;
    entry.originCityCode = legs[0].originCityCode;
    entry.destinationCityCode = legs[legs.length - 1].destinationCityCode;
    entry.depart = legs[0].depart;
  }

  if (!isFlightCurrent(entry, now)) return null;
  entry.id = hashToken(flightIdentity(entry));
  return entry;
}

function flightIdentity(entry) {
  return JSON.stringify([
    entry.trip,
    entry.from,
    entry.to,
    entry.originCityCode,
    entry.destinationCityCode,
    entry.depart,
    entry.return,
    entry.legs,
    entry.adults,
    entry.children,
    entry.infants,
    entry.fareType,
    entry.cabinClass,
  ]);
}

export function isFlightCurrent(entry, now = new Date()) {
  const today = todayIso(now);
  if (!entry || !FLIGHT_TRIPS[entry.trip]) return false;
  if (entry.trip === "multi") {
    if (!Array.isArray(entry.legs) || entry.legs.length < 2) return false;
    let previous = "";
    for (const leg of entry.legs) {
      if (!leg?.depart || leg.depart < today) return false;
      if (previous && leg.depart < previous) return false;
      if (!leg.originCityCode || !leg.destinationCityCode || leg.originCityCode === leg.destinationCityCode) return false;
      previous = leg.depart;
    }
    return true;
  }
  if (!entry.depart || entry.depart < today) return false;
  if (!entry.originCityCode || !entry.destinationCityCode || entry.originCityCode === entry.destinationCityCode) return false;
  if (entry.trip === "return") {
    if (!entry.return || entry.return < entry.depart || entry.return < today) return false;
  }
  return true;
}

function transferEntry(query, now) {
  if (!query || query.error) return null;
  const tripType = CAB_TRIPS[query.tripType] ? query.tripType : "";
  const pickupKind = LOCATION_KINDS.has(query.pickupKind) ? query.pickupKind : "";
  const dropoffKind = LOCATION_KINDS.has(query.dropoffKind) ? query.dropoffKind : "";
  const passengers = integerInRange(query.passengers, 1, 8);
  const entry = {
    tripType,
    pickup: clip(query.pickup, 120),
    dropoff: clip(query.dropoff, 120),
    pickupKind,
    dropoffKind,
    date: parseIso(query.date) ? String(query.date) : "",
    time: normalizeTime(query.time),
    passengers,
    searchedAt: now.toISOString(),
  };
  if (!tripType || !entry.pickup || !entry.dropoff || !pickupKind || !dropoffKind || passengers == null) return null;
  if (!isTransferCurrent(entry, now)) return null;
  entry.id = hashToken(transferIdentity(entry));
  return entry;
}

function transferIdentity(entry) {
  return JSON.stringify([
    entry.tripType,
    entry.pickup,
    entry.dropoff,
    entry.pickupKind,
    entry.dropoffKind,
    entry.date,
    entry.time,
    entry.passengers,
  ]);
}

export function isTransferCurrent(entry, now = new Date()) {
  if (!entry?.date || !entry.time || !parseIso(entry.date) || !normalizeTime(entry.time)) return false;
  return isPickupAllowed(entry.date, entry.time, now, CAB_TIME_ZONE);
}

function isCurrent(service, entry, now) {
  return service === "transfer" ? isTransferCurrent(entry, now) : isFlightCurrent(entry, now);
}

function entryFromQuery(service, query, now) {
  return service === "transfer" ? transferEntry(query, now) : flightEntry(query, now);
}

function visibleRows(service, rows, now) {
  return rows
    .filter((row) => row && typeof row === "object" && isCurrent(service, row, now))
    .sort((a, b) => String(b.searchedAt || "").localeCompare(String(a.searchedAt || "")))
    .slice(0, RECENT_LIMIT);
}

export function loadRecentSearches(storage, service, scope, now = new Date()) {
  if (!storage) return [];
  const key = recentStorageKey(service, scope);
  try {
    const { raw, rows } = readRows(storage, key);
    const visible = visibleRows(service, rows, now);
    writeRows(storage, key, raw, visible);
    return visible;
  } catch {
    return [];
  }
}

export function saveRecentSearch(storage, service, scope, query, now = new Date()) {
  if (!storage) return null;
  const key = recentStorageKey(service, scope);
  try {
    const { raw, rows } = readRows(storage, key);
    const visible = visibleRows(service, rows, now);
    const entry = entryFromQuery(service, query, now);
    if (!entry) {
      writeRows(storage, key, raw, visible);
      return null;
    }
    const next = visibleRows(service, [entry, ...visible.filter((row) => row.id !== entry.id)], now);
    writeRows(storage, key, raw, next);
    return entry;
  } catch {
    return null;
  }
}

export function removeRecentSearch(storage, service, scope, id, now = new Date()) {
  if (!storage) return [];
  const key = recentStorageKey(service, scope);
  try {
    const { raw, rows } = readRows(storage, key);
    const visible = visibleRows(service, rows, now).filter((row) => row.id !== id);
    writeRows(storage, key, raw, visible);
    return visible;
  } catch {
    return [];
  }
}

function travellerLabel(entry) {
  const count = Number(entry.adults || 0) + Number(entry.children || 0) + Number(entry.infants || 0);
  return `${count} traveller${count === 1 ? "" : "s"}`;
}

function cabinLabel(value) {
  if (CABINS[value]) return CABINS[value];
  return String(value || "Economy").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function describeRecentSearch(service, entry, now = new Date()) {
  if (service === "transfer") {
    return {
      title: `${entry.pickup} → ${entry.dropoff}`,
      detail: `${formatDay(entry.date, now)} · ${entry.time} · ${CAB_TRIPS[entry.tripType] || "Cab"}`,
    };
  }
  const title = entry.trip === "multi" && entry.legs?.length
    ? entry.legs.flatMap((leg, index) => (index === 0 ? [leg.from, leg.to] : [leg.to])).join(" → ")
    : `${entry.from} → ${entry.to}`;
  const when = entry.trip === "return"
    ? `${formatDay(entry.depart, now)} – ${formatDay(entry.return, now)}`
    : entry.trip === "multi"
      ? `${formatDay(entry.legs[0].depart, now)} – ${formatDay(entry.legs[entry.legs.length - 1].depart, now)}`
      : formatDay(entry.depart, now);
  return {
    title,
    detail: `${when} · ${FLIGHT_TRIPS[entry.trip] || "One-way"} · ${travellerLabel(entry)} · ${cabinLabel(entry.cabinClass)}`,
  };
}

export function recentToFormValues(service, entry) {
  if (service === "transfer") {
    return {
      tripType: entry.tripType,
      pickup: entry.pickup,
      dropoff: entry.dropoff,
      pickupKind: entry.pickupKind,
      dropoffKind: entry.dropoffKind,
      travelDate: parseIso(entry.date),
      pickupTime: entry.time,
      passengers: entry.passengers,
    };
  }
  return {
    tripType: entry.trip,
    from: entry.from,
    to: entry.to,
    originCityCode: entry.originCityCode,
    destinationCityCode: entry.destinationCityCode,
    departDate: parseIso(entry.depart),
    returnDate: entry.trip === "return" ? parseIso(entry.return) : null,
    legs: entry.trip === "multi"
      ? entry.legs.map((leg) => ({
          from: leg.from,
          to: leg.to,
          originCityCode: leg.originCityCode,
          destinationCityCode: leg.destinationCityCode,
          depart: parseIso(leg.depart),
        }))
      : [],
    travellers: {
      adults: entry.adults,
      children: entry.children,
      infants: entry.infants,
    },
    fareType: entry.fareType,
    cabinClass: entry.cabinClass,
  };
}
