import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { baggageWeight, buildCabin, isExitSeat, mealDiet, seatAvailability, seatCategory, selectionStillOffered } from "./ssrLayout.mjs";

const supplierSeats = [
  { code: "12A", status: "AVAILABLE", price: { amount: 450, currency: "INR" } },
  { code: "12B", status: "OCCUPIED", price: { amount: 450, currency: "INR" } },
  { code: "12C", status: "AVAILABLE", price: { amount: 450, currency: "INR" } },
  { code: "14F", status: "AVAILABLE", price: { amount: 650, currency: "INR" } },
];

describe("supplier seat map", () => {
  it("places only the seats the supplier returned", () => {
    const cabin = buildCabin(supplierSeats);
    const codes = [];
    cabin.rowNumbers.forEach((row) => cabin.rows.get(row).forEach((seat) => codes.push(seat.code)));
    assert.deepEqual(codes.sort(), ["12A", "12B", "12C", "14F"]);
    assert.equal(cabin.rows.get(12).has("D"), false);
    assert.equal(cabin.rows.get(14).has("A"), false);
    assert.equal(cabin.partial, true);
    assert.deepEqual(cabin.prices, [450, 650]);
  });

  it("blocks occupied seats and seats already taken on the segment", () => {
    assert.equal(seatAvailability(supplierSeats[1], new Set()), "occupied");
    assert.equal(seatAvailability(supplierSeats[0], new Set(["12A"])), "taken");
    assert.equal(seatAvailability({ code: "12C", status: "BLOCKED" }, new Set()), "unavailable");
    assert.equal(seatAvailability(supplierSeats[2], new Set()), "available");
  });

  it("reads meal diet and baggage weight only from supplied fields", () => {
    assert.equal(mealDiet({ code: "VGML", label: "Veg meal" }), "Veg");
    assert.equal(mealDiet({ code: "NVML", label: "Non-veg meal" }), "Non-veg");
    assert.equal(mealDiet({ code: "SPML", label: "Special meal" }), "");
    assert.equal(baggageWeight({ code: "BG15", label: "Extra 15 kg" }), 15);
    assert.equal(baggageWeight({ code: "BAG", label: "Extra bag" }), null);
  });

  it("classifies a seat only from its supplier price and flags", () => {
    assert.equal(seatCategory(supplierSeats[0]), "paid");
    assert.equal(seatCategory({ code: "1A", price: { amount: 0 } }), "free");
    assert.equal(seatCategory({ code: "10A", extraLegroom: true, price: { amount: 900 } }), "legroom");
    assert.equal(isExitSeat({ code: "12A" }), false);
    assert.equal(isExitSeat({ code: "11A", exitRow: true }), true);
  });

  it("drops a selection that the new fare no longer offers", () => {
    const segment = { seats: supplierSeats, meals: [{ code: "VGML" }], baggage: [{ code: "BG15" }] };
    assert.equal(selectionStillOffered({ seat: { code: "12A" }, meal: { code: "VGML" }, baggage: null }, segment), true);
    assert.equal(selectionStillOffered({ seat: { code: "12B" }, meal: null, baggage: null }, segment), false);
    assert.equal(selectionStillOffered({ seat: { code: "1A" }, meal: null, baggage: null }, segment), false);
  });
});
