/** Layout helpers for supplier SSR. They never invent seats, meals, or prices. */

export function parseSeatCode(code) {
  const match = String(code || "").match(/^(\d+)([A-Z])$/i);
  if (!match) return null;
  return { row: Number(match[1]), letter: match[2].toUpperCase() };
}

export function buildCabin(seats) {
  const placed = [];
  const unplaced = [];
  (seats || []).forEach((seat) => {
    const parsed = parseSeatCode(seat?.code);
    if (!parsed) {
      unplaced.push(seat);
      return;
    }
    placed.push({ ...seat, ...parsed });
  });
  const letters = [...new Set(placed.map((seat) => seat.letter))].sort();
  const left = letters.filter((letter) => letter < "D");
  const right = letters.filter((letter) => letter >= "D");
  const rows = new Map();
  placed.forEach((seat) => {
    if (!rows.has(seat.row)) rows.set(seat.row, new Map());
    rows.get(seat.row).set(seat.letter, seat);
  });
  const rowNumbers = [...rows.keys()].sort((a, b) => a - b);
  const partial = rowNumbers.some((row) => letters.some((letter) => !rows.get(row).has(letter)));
  const prices = [...new Set(placed.concat(unplaced).map((seat) => Number(seat.price?.amount) || 0))].sort((a, b) => a - b);
  return { letters, left, right, rows, rowNumbers, unplaced, partial, prices, aisle: left.length > 0 && right.length > 0 };
}

export function isExitSeat(seat) {
  if (seat?.exitRow === true || seat?.exit === true) return true;
  const text = `${seat?.category || ""} ${seat?.characteristics || ""} ${seat?.seatType || ""}`;
  return /exit/i.test(text);
}

export function seatCategory(seat) {
  const text = `${seat?.category || ""} ${seat?.characteristics || ""} ${seat?.seatType || ""}`;
  if (seat?.extraLegroom === true || /legroom|extra[-\s]?space/i.test(text)) return "legroom";
  if ((Number(seat?.price?.amount) || 0) <= 0) return "free";
  return "paid";
}

export function seatAvailability(seat, takenCodes) {
  const status = String(seat?.status || "AVAILABLE").toUpperCase();
  if (takenCodes?.has?.(seat?.code)) return "taken";
  if (status === "OCCUPIED") return "occupied";
  if (status !== "AVAILABLE") return "unavailable";
  return "available";
}

export function mealDiet(meal) {
  if (meal?.diet) return String(meal.diet);
  if (meal?.veg === true) return "Veg";
  if (meal?.veg === false) return "Non-veg";
  const text = `${meal?.label || ""} ${meal?.code || ""}`;
  if (/non[-\s]?veg|nvml/i.test(text)) return "Non-veg";
  if (/veg/i.test(text)) return "Veg";
  return "";
}

export function baggageWeight(bag) {
  if (Number.isFinite(Number(bag?.weightKg))) return Number(bag.weightKg);
  const match = String(bag?.label || bag?.code || "").match(/(\d+)\s*kg/i);
  return match ? Number(match[1]) : null;
}

export function selectionStillOffered(choice, segment) {
  if (!choice) return true;
  const seatOk = !choice.seat?.code || (segment?.seats || []).some(
    (seat) => seat.code === choice.seat.code && String(seat.status || "AVAILABLE").toUpperCase() === "AVAILABLE",
  );
  const mealOk = !choice.meal?.code || (segment?.meals || []).some((meal) => meal.code === choice.meal.code);
  const bagOk = !choice.baggage?.code || (segment?.baggage || []).some((bag) => bag.code === choice.baggage.code);
  return seatOk && mealOk && bagOk;
}
