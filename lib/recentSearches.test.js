const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

async function load() {
  return import("./recentSearches.js");
}

function memory() {
  const data = new Map();
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
  };
}

const now = new Date(2026, 9, 27, 15, 30, 45);

function flight(overrides = {}) {
  return {
    service: "flight",
    trip: "oneway",
    from: "Delhi (DEL)",
    to: "Mumbai (BOM)",
    originCityCode: "DEL",
    destinationCityCode: "BOM",
    depart: "2026-10-28",
    adults: 1,
    children: 0,
    infants: 0,
    fareType: "student",
    cabinClass: "BUSINESS",
    ...overrides,
  };
}

function cab(overrides = {}) {
  return {
    service: "transfer",
    tripType: "AIRPORT_TRANSFER",
    pickup: "Delhi Airport (DEL)",
    dropoff: "The Leela Palace Delhi",
    pickupKind: "AIRPORT",
    dropoffKind: "HOTEL",
    date: "2026-10-28",
    time: "10:00",
    passengers: 2,
    ...overrides,
  };
}

describe("recent searches", () => {
  it("keeps five newest searches and drops expired or duplicate ones", async () => {
    const { saveRecentSearch, loadRecentSearches } = await load();
    const storage = memory();
    const scope = { tenantCode: "HARBOR", customerId: "", host: "harbor.localhost:3001" };
    for (let day = 1; day <= 7; day += 1) {
      saveRecentSearch(
        storage,
        "flight",
        scope,
        flight({ depart: `2026-11-0${day}`, to: `City ${day}` }),
        new Date(2026, 9, 27, 15, day, 0),
      );
    }
    saveRecentSearch(storage, "flight", scope, flight({ depart: "2026-10-26" }), now);
    saveRecentSearch(storage, "flight", scope, flight({ depart: "2026-11-07", to: "City 7" }), new Date(2026, 9, 27, 16, 0, 0));
    const rows = loadRecentSearches(storage, "flight", scope, now);
    assert.equal(rows.length, 5);
    assert.equal(rows[0].to, "City 7");
    assert.equal(rows.some((row) => row.to === "City 1" || row.to === "City 2"), false);
    assert.equal(rows.some((row) => row.depart < "2026-10-27"), false);
    assert.equal(new Set(rows.map((row) => row.id)).size, 5);
  });

  it("filters cab searches by local date and today's pickup time", async () => {
    const { saveRecentSearch, isTransferCurrent } = await load();
    const storage = memory();
    const scope = { tenantCode: "HARBOR", host: "harbor.localhost:3001" };
    const leadNow = new Date("2026-10-27T10:00:00.000Z");
    assert.equal(saveRecentSearch(storage, "transfer", scope, cab({ date: "2026-10-26", time: "23:00" }), leadNow), null);
    assert.equal(saveRecentSearch(storage, "transfer", scope, cab({ date: "2026-10-27", time: "17:29" }), leadNow), null);
    const kept = saveRecentSearch(storage, "transfer", scope, cab({ date: "2026-10-27", time: "17:30" }), leadNow);
    const later = saveRecentSearch(storage, "transfer", scope, cab({ date: "2026-10-27", time: "18:05" }), leadNow);
    assert.ok(kept);
    assert.ok(later);
    assert.equal(isTransferCurrent({ date: "2026-10-27", time: "17:30" }, leadNow), true);
    assert.equal(isTransferCurrent({ date: "2026-10-27", time: "17:29" }, leadNow), false);
  });

  it("rejects invalid round-trip and multi-city dates", async () => {
    const { saveRecentSearch, recentToFormValues } = await load();
    const storage = memory();
    const scope = { tenantCode: "HARBOR", host: "harbor.localhost:3001" };
    assert.equal(saveRecentSearch(storage, "flight", scope, flight({ trip: "return", return: "2026-10-27", depart: "2026-10-28" }), now), null);
    assert.equal(saveRecentSearch(storage, "flight", scope, flight({ trip: "return", depart: "2026-10-26", return: "2026-10-30" }), now), null);
    const round = saveRecentSearch(storage, "flight", scope, flight({
      trip: "return",
      depart: "2026-10-28",
      return: "2026-11-02",
      adults: 2,
      children: 1,
      fareType: "armedforces",
      cabinClass: "PREMIUM_ECONOMY",
    }), now);
    const values = recentToFormValues("flight", round);
    assert.equal(values.tripType, "return");
    assert.equal(values.fareType, "armedforces");
    assert.equal(values.cabinClass, "PREMIUM_ECONOMY");
    assert.equal(values.travellers.adults, 2);
    assert.equal(values.travellers.children, 1);
    assert.equal(values.returnDate.getDate(), 2);

    const legs = [
      { from: "Delhi (DEL)", to: "Mumbai (BOM)", originCityCode: "DEL", destinationCityCode: "BOM", depart: "2026-10-28" },
      { from: "Mumbai (BOM)", to: "Goa (GOI)", originCityCode: "BOM", destinationCityCode: "GOI", depart: "2026-10-26" },
    ];
    assert.equal(saveRecentSearch(storage, "flight", scope, flight({ trip: "multi", legs: JSON.stringify(legs) }), now), null);
    legs[1].depart = "2026-10-30";
    const multi = saveRecentSearch(storage, "flight", scope, flight({ trip: "multi", legs: JSON.stringify(legs) }), now);
    const restored = recentToFormValues("flight", multi);
    assert.equal(restored.tripType, "multi");
    assert.equal(restored.legs.length, 2);
    assert.equal(restored.legs[1].destinationCityCode, "GOI");
    assert.equal(restored.fareType, "student");
  });

  it("does not mix tenants, customers, or personal details", async () => {
    const { saveRecentSearch, loadRecentSearches, recentStorageKey, describeRecentSearch } = await load();
    const storage = memory();
    const harborGuest = { tenantCode: "HARBOR", customerId: "", host: "harbor.localhost:3001" };
    const harborUser = { tenantCode: "HARBOR", customerId: "user-9", host: "harbor.localhost:3001" };
    const other = { tenantCode: "CORAL", customerId: "user-9", host: "coral.localhost:3001" };
    saveRecentSearch(storage, "transfer", harborGuest, cab(), now);
    saveRecentSearch(storage, "transfer", harborUser, cab({ dropoff: "Guest House" }), now);
    saveRecentSearch(storage, "transfer", other, cab({ pickup: "Coral Airport" }), now);
    assert.equal(loadRecentSearches(storage, "transfer", harborGuest, now).length, 1);
    assert.equal(loadRecentSearches(storage, "transfer", harborUser, now)[0].dropoff, "Guest House");
    assert.equal(loadRecentSearches(storage, "transfer", other, now)[0].pickup, "Coral Airport");
    assert.notEqual(recentStorageKey("transfer", harborGuest), recentStorageKey("transfer", harborUser));
    assert.notEqual(recentStorageKey("transfer", harborUser), recentStorageKey("transfer", other));
    const raw = storage.getItem(recentStorageKey("transfer", harborUser));
    const stored = JSON.parse(raw)[0];
    for (const field of ["email", "phone", "name", "customerId", "password"]) {
      assert.equal(Object.hasOwn(stored, field), false);
    }
    assert.match(describeRecentSearch("transfer", stored, now).detail, /28 Oct · 10:00 · Airport Transfer/);
  });

  it("removes one search and clears a pickup time that has passed", async () => {
    const { saveRecentSearch, loadRecentSearches, removeRecentSearch } = await load();
    const storage = memory();
    const scope = { tenantCode: "HARBOR", host: "harbor.localhost:3001" };
    const leadNow = new Date("2026-10-27T10:00:00.000Z");
    const first = saveRecentSearch(storage, "transfer", scope, cab({ time: "18:00", date: "2026-10-27" }), leadNow);
    saveRecentSearch(storage, "transfer", scope, cab({ time: "20:00", date: "2026-10-27", dropoff: "Hotel B" }), leadNow);
    const removed = removeRecentSearch(storage, "transfer", scope, first.id, leadNow);
    assert.equal(removed.length, 1);
    assert.equal(removed[0].dropoff, "Hotel B");
    const later = new Date("2026-10-27T11:30:00.000Z");
    const rows = loadRecentSearches(storage, "transfer", scope, later);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].dropoff, "Hotel B");
  });
});
