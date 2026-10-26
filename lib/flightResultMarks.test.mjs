import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { flightBadges, hasCheckedBag } from "./flightResultMarks.mjs";

describe("flight result marks", () => {
  const rows = [
    { id: "a", total: 7000, duration: 95, stops: 0, rank: 1 },
    { id: "b", total: 8200, duration: 140, stops: 1, rank: 2 },
    { id: "c", total: 7600, duration: 95, stops: 0, rank: 3 },
  ];

  it("marks only distinctive cheapest, fastest and direct fares", () => {
    const marks = flightBadges(rows);
    assert.deepEqual(marks.get("a"), ["Recommended", "Cheapest", "Fastest"]);
    assert.deepEqual(marks.get("b"), []);
    assert.deepEqual(marks.get("c"), ["Fastest"]);
  });

  it("does not badge a single result", () => {
    const marks = flightBadges([rows[0]]);
    assert.deepEqual(marks.get("a"), []);
  });

  it("reads checked baggage only from a positive check-in allowance", () => {
    assert.equal(hasCheckedBag({ fares: [{ checkinKg: 15 }] }), true);
    assert.equal(hasCheckedBag({ fares: [{ checkinKg: 0 }] }), false);
    assert.equal(hasCheckedBag({ checkinKg: 20 }), true);
  });
});