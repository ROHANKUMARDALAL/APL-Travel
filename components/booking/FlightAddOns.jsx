"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { formatMoney, getActiveMarketId } from "@/data/markets";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

function money(amount, currency) {
  return formatMoney(amount, getActiveMarketId(), currency || "INR");
}

function rowOf(code) {
  const match = String(code || "").match(/^(\d+)([A-Z])$/i);
  if (!match) return null;
  return { row: Number(match[1]), letter: match[2].toUpperCase() };
}

function emptyChoice() {
  return { seat: null, meal: null, baggage: null };
}

export function selectionsToAddOns(selections) {
  const seats = [];
  const meals = [];
  const baggage = [];
  let amount = 0;
  Object.entries(selections || {}).forEach(([passengerKey, segments]) => {
    Object.entries(segments || {}).forEach(([segmentKey, choice]) => {
      ["seat", "meal", "baggage"].forEach((kind) => {
        const item = choice?.[kind];
        if (!item?.code) return;
        const row = { code: item.code, passengerKey, segmentKey };
        if (kind === "seat") seats.push(row);
        if (kind === "meal") meals.push(row);
        if (kind === "baggage") baggage.push(row);
        amount += Number(item.price) || 0;
      });
    });
  });
  return { seats, meals, baggage, amount };
}

export function passengerSummary(choice) {
  if (!choice) return "";
  const parts = [choice.seat?.label, choice.meal?.label, choice.baggage?.label].filter(Boolean);
  return parts.join(" · ");
}

export function passengerAddOnTotal(selections, passengerId) {
  return selectionsToAddOns({ [passengerId]: selections?.[passengerId] || {} }).amount;
}

export default function FlightAddOnsModal({
  open,
  passenger,
  segments,
  catalog,
  includedBaggage,
  selections,
  onClose,
  onChange,
}) {
  const titleId = useId();
  const [tab, setTab] = useState("seat");
  const [segmentKey, setSegmentKey] = useState(segments[0]?.id || "");
  const availableTabs = [
    catalog?.seats?.length ? { id: "seat", label: "Seat Selection", icon: "Seat" } : null,
    catalog?.meals?.length ? { id: "meal", label: "Meal Selection", icon: "Meal" } : null,
    catalog?.baggage?.length ? { id: "baggage", label: "Extra Baggage", icon: "Bag" } : null,
  ].filter(Boolean);

  useEffect(() => {
    if (!open) return undefined;
    setTab(availableTabs[0]?.id || "seat");
    setSegmentKey(segments[0]?.id || "");
    function onKey(event) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, passenger?.id]);

  const choice = selections?.[passenger?.id]?.[segmentKey] || emptyChoice();
  const takenSeats = useMemo(() => {
    const taken = new Set();
    Object.entries(selections || {}).forEach(([passengerId, bySegment]) => {
      if (passengerId === passenger?.id) return;
      const seat = bySegment?.[segmentKey]?.seat;
      if (seat?.code) taken.add(seat.code);
    });
    return taken;
  }, [selections, passenger?.id, segmentKey]);

  if (!open || !passenger) return null;

  function update(kind, item) {
    const next = {
      ...(selections || {}),
      [passenger.id]: {
        ...(selections?.[passenger.id] || {}),
        [segmentKey]: {
          ...choice,
          [kind]: item,
        },
      },
    };
    onChange(next);
  }

  const activeSegment = segments.find((segment) => segment.id === segmentKey) || segments[0];
  const infant = String(passenger.type || "").toLowerCase() === "infant";
  const rows = new Map();
  (catalog?.seats || []).forEach((seat) => {
    const parsed = rowOf(seat.code);
    if (!parsed) return;
    if (!rows.has(parsed.row)) rows.set(parsed.row, new Map());
    rows.get(parsed.row).set(parsed.letter, seat);
  });
  const rowNumbers = [...rows.keys()].sort((a, b) => a - b);
  const prices = [...new Set((catalog?.seats || []).map((seat) => Number(seat.price?.amount) || 0))].sort((a, b) => a - b);

  return (
    <div className="ssr-backdrop" role="presentation" onClick={onClose}>
      <div
        className="ssr-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="ssr-header">
          <div>
            <p className="ssr-kicker">Choose Your Add-ons</p>
            <h2 id={titleId}>
              {passenger.firstName || passenger.lastName
                ? `${passenger.firstName || ""} ${passenger.lastName || ""}`.trim()
                : passenger.label}
              <span> · {passenger.typeLabel}</span>
            </h2>
            <p>
              {activeSegment ? `${activeSegment.from} → ${activeSegment.to}` : "Flight"}
              {activeSegment?.flightNumber ? ` · ${activeSegment.flightNumber}` : ""}
            </p>
          </div>
          <button type="button" className="ssr-close" onClick={onClose} aria-label="Close add-ons">
            ×
          </button>
        </header>

        {segments.length > 1 ? (
          <div className="ssr-segments" role="tablist" aria-label="Flight segments">
            {segments.map((segment, index) => (
              <button
                key={segment.id}
                type="button"
                role="tab"
                aria-selected={segment.id === segmentKey}
                className={segment.id === segmentKey ? "is-active" : ""}
                onClick={() => setSegmentKey(segment.id)}
              >
                {segments.length === 2 && index === 0 ? "Outbound" : segments.length === 2 && index === 1 ? "Return" : `Leg ${index + 1}`}
                <span>{segment.from}–{segment.to}</span>
              </button>
            ))}
          </div>
        ) : null}

        <div className="ssr-tabs" role="tablist">
          {availableTabs.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              className={tab === item.id ? "is-active" : ""}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="ssr-body">
          {!availableTabs.length ? (
            <p className="ssr-empty">Add-ons are not available from the supplier for this fare.</p>
          ) : null}

          {tab === "seat" && catalog?.seats?.length ? (
            infant ? (
              <p className="ssr-empty">Seat selection is not available for infants.</p>
            ) : (
              <div className="ssr-seat-layout">
                <div className="ssr-legend">
                  {prices.map((price) => (
                    <span key={price}>{money(price, catalog.seats[0]?.price?.currency)} seat</span>
                  ))}
                  <span>Occupied</span>
                  <span>Not offered</span>
                </div>
                <div className="ssr-cabin" aria-label="Seat map">
                  {rowNumbers.map((row) => (
                    <div key={row} className="ssr-row">
                      <span className="ssr-row-no">{row}</span>
                      {LETTERS.flatMap((letter) => {
                        const seat = rows.get(row)?.get(letter) || null;
                        const aisle = letter === "D" ? <span key={`${row}-aisle`} className="ssr-aisle" /> : null;
                        if (!seat) {
                          return [aisle, <span key={`${row}${letter}`} className="ssr-seat is-missing" aria-hidden="true" />];
                        }
                        const occupied = takenSeats.has(seat.code);
                        const selected = choice.seat?.code === seat.code;
                        const band = prices.indexOf(Number(seat.price?.amount) || 0);
                        return [aisle, (
                          <button
                            key={seat.code}
                            type="button"
                            className={`ssr-seat is-band-${band} ${selected ? "is-selected" : ""} ${occupied ? "is-occupied" : ""}`}
                            disabled={occupied}
                            aria-pressed={selected}
                            onClick={() => update("seat", selected ? null : {
                              code: seat.code,
                              label: seat.label || `Seat ${seat.code}`,
                              price: Number(seat.price?.amount) || 0,
                              currency: seat.price?.currency || "INR",
                            })}
                          >
                            {letter}
                          </button>
                        )];
                      })}
                    </div>
                  ))}
                  {(catalog.seats || []).filter((seat) => !rowOf(seat.code)).map((seat) => (
                    <button
                      key={seat.code}
                      type="button"
                      className={`ssr-seat-list ${choice.seat?.code === seat.code ? "is-selected" : ""}`}
                      disabled={takenSeats.has(seat.code)}
                      onClick={() => update("seat", choice.seat?.code === seat.code ? null : {
                        code: seat.code,
                        label: seat.label || seat.code,
                        price: Number(seat.price?.amount) || 0,
                        currency: seat.price?.currency || "INR",
                      })}
                    >
                      {seat.label || seat.code} · {money(seat.price?.amount, seat.price?.currency)}
                    </button>
                  ))}
                </div>
              </div>
            )
          ) : null}

          {tab === "meal" ? (
            <div className="ssr-cards">
              {(catalog?.meals || []).map((meal) => {
                const selected = choice.meal?.code === meal.code;
                const veg = /veg/i.test(`${meal.label} ${meal.code}`) && !/non/i.test(`${meal.label} ${meal.code}`);
                return (
                  <article key={meal.code} className={`ssr-card ${selected ? "is-selected" : ""}`}>
                    <p className="ssr-card-title">{meal.label || meal.code}</p>
                    <p className="ssr-card-copy">{veg ? "Vegetarian" : /non|nvml/i.test(`${meal.label} ${meal.code}`) ? "Non-vegetarian" : "Supplier meal"}</p>
                    <p className="ssr-card-price">{money(meal.price?.amount, meal.price?.currency)}</p>
                    <button type="button" onClick={() => update("meal", selected ? null : {
                      code: meal.code,
                      label: meal.label || meal.code,
                      price: Number(meal.price?.amount) || 0,
                      currency: meal.price?.currency || "INR",
                    })}
                    >
                      {selected ? "Remove" : "Select"}
                    </button>
                  </article>
                );
              })}
            </div>
          ) : null}

          {tab === "baggage" ? (
            <div className="ssr-cards">
              {includedBaggage ? (
                <article className="ssr-card is-included">
                  <p className="ssr-card-title">Included baggage</p>
                  <p className="ssr-card-copy">
                    {includedBaggage.cabinKg != null ? `${includedBaggage.cabinKg} kg cabin` : "Cabin allowance included"}
                    {includedBaggage.checkinKg != null ? ` · ${includedBaggage.checkinKg} kg check-in` : ""}
                  </p>
                  <p className="ssr-card-price">Included</p>
                </article>
              ) : null}
              {(catalog?.baggage || []).map((bag) => {
                const selected = choice.baggage?.code === bag.code;
                return (
                  <article key={bag.code} className={`ssr-card ${selected ? "is-selected" : ""}`}>
                    <p className="ssr-card-title">{bag.label || bag.code}</p>
                    <p className="ssr-card-copy">{activeSegment ? `${activeSegment.from} → ${activeSegment.to}` : "Paid extra baggage"}</p>
                    <p className="ssr-card-price">{money(bag.price?.amount, bag.price?.currency)}</p>
                    <button type="button" onClick={() => update("baggage", selected ? null : {
                      code: bag.code,
                      label: bag.label || bag.code,
                      price: Number(bag.price?.amount) || 0,
                      currency: bag.price?.currency || "INR",
                    })}
                    >
                      {selected ? "Remove" : "Select"}
                    </button>
                  </article>
                );
              })}
            </div>
          ) : null}
        </div>

        <footer className="ssr-footer">
          <p>
            {choice.seat ? choice.seat.label : "No seat"}
            {choice.meal ? ` · ${choice.meal.label}` : ""}
            {choice.baggage ? ` · ${choice.baggage.label}` : ""}
            <strong>
              {" "}
              {money((Number(choice.seat?.price) || 0) + (Number(choice.meal?.price) || 0) + (Number(choice.baggage?.price) || 0), "INR")}
            </strong>
          </p>
          <button type="button" className="ssr-confirm" onClick={onClose}>Done</button>
        </footer>
      </div>
    </div>
  );
}
