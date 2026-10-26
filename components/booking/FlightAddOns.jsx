"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { formatMoney, getActiveMarketId } from "@/data/markets";
import { baggageWeight, buildCabin, isExitSeat, mealDiet, seatAvailability, seatCategory } from "@/lib/ssrLayout.mjs";

function money(amount, currency) {
  return formatMoney(amount, getActiveMarketId(), currency || "INR");
}

function emptyChoice() {
  return { seat: null, meal: null, baggage: null };
}

function itemPayload(item) {
  return {
    code: item.code,
    label: item.label || item.code,
    price: Number(item.price?.amount) || 0,
    currency: item.price?.currency || "INR",
  };
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
        const row = { code: item.code, label: item.label || item.code, passengerKey, segmentKey };
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

function moveSeatFocus(event) {
  const key = event.key;
  if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(key)) return;
  const buttons = [...event.currentTarget.querySelectorAll("button.ssr-seat:not(:disabled)")];
  const index = buttons.indexOf(document.activeElement);
  if (index < 0) return;
  const columns = Number(event.currentTarget.dataset.columns) || 1;
  const step = key === "ArrowLeft" ? -1 : key === "ArrowRight" ? 1 : key === "ArrowUp" ? -columns : columns;
  const next = buttons[index + step];
  if (!next) return;
  event.preventDefault();
  next.focus();
}

export default function FlightAddOnsModal({
  open,
  passenger,
  segments,
  catalog,
  includedBaggage,
  selections,
  loading = false,
  error = "",
  airline = "",
  passengers = null,
  onSelectPassenger,
  basePayable = null,
  payableCurrency = "INR",
  onClose,
  onChange,
}) {
  const titleId = useId();
  const dialogRef = useRef(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);
  const [tab, setTab] = useState("seat");
  const [segmentKey, setSegmentKey] = useState(segments[0]?.id || "");
  const openKey = open ? `${passenger?.id || ""}:${segments[0]?.id || ""}` : "";
  const [seenKey, setSeenKey] = useState(openKey);
  if (openKey !== seenKey) {
    const first = segments[0];
    const firstTab = (first?.seats || catalog?.seats || []).length
      ? "seat"
      : (first?.meals || catalog?.meals || []).length
        ? "meal"
        : "baggage";
    setSeenKey(openKey);
    setTab(firstTab);
    setSegmentKey(first?.id || "");
  }
  const activeSegment = segments.find((segment) => segment.id === segmentKey) || segments[0];
  const segmentCatalog = {
    seats: activeSegment?.seats || catalog?.seats || [],
    meals: activeSegment?.meals || catalog?.meals || [],
    baggage: activeSegment?.baggage || catalog?.baggage || [],
  };
  const availableTabs = [
    segmentCatalog.seats.length ? { id: "seat", label: "Seats" } : null,
    segmentCatalog.meals.length ? { id: "meal", label: "Meals" } : null,
    segmentCatalog.baggage.length ? { id: "baggage", label: "Extra Baggage" } : null,
  ].filter(Boolean);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => dialogRef.current?.focus(), 30);
    function onKey(event) {
      if (event.key === "Escape") closeRef.current();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

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
  const cabin = buildCabin(segmentCatalog.seats);
  const addonQuote = selectionsToAddOns(selections);
  const payable = Number.isFinite(Number(basePayable)) ? Number(basePayable) + addonQuote.amount : null;
  const seatCurrency = segmentCatalog.seats[0]?.price?.currency || "INR";
  const legend = [];
  if (segmentCatalog.seats.some((seat) => seatCategory(seat) === "free")) {
    legend.push({ id: "free", label: "Free", detail: "Included in your fare", klass: "is-free" });
  }
  cabin.prices.forEach((price, index) => {
    const priced = segmentCatalog.seats.filter((seat) => seatCategory(seat) === "paid" && Number(seat.price?.amount) === price);
    if (!priced.length) return;
    legend.push({ id: `paid-${price}`, label: "Paid", detail: money(price, seatCurrency), klass: `is-paid is-band-${Math.min(index, 2)}` });
  });
  const legroomPrices = cabin.prices.filter((price) => segmentCatalog.seats.some((seat) => seatCategory(seat) === "legroom" && Number(seat.price?.amount) === price));
  if (legroomPrices.length) {
    legend.push({
      id: "legroom",
      label: "Extra legroom",
      detail: legroomPrices.map((price) => money(price, seatCurrency)).join(" – "),
      klass: "is-legroom",
    });
  }
  if (segmentCatalog.seats.some((seat) => seatAvailability(seat, new Set()) !== "available")) {
    legend.push({ id: "unavailable", label: "Unavailable", detail: "Occupied or blocked", klass: "is-unavailable" });
  }
  legend.push({ id: "selected", label: "Selected", detail: choice.seat?.label || "Your seat", klass: "is-selected" });

  if (!open || !passenger) return null;

  function update(kind, item) {
    onChange({
      ...(selections || {}),
      [passenger.id]: {
        ...(selections?.[passenger.id] || {}),
        [segmentKey]: {
          ...choice,
          [kind]: item,
        },
      },
    });
  }

  const infant = String(passenger.type || "").toLowerCase() === "infant";
  const displayName = passenger.firstName || passenger.lastName
    ? `${passenger.firstName || ""} ${passenger.lastName || ""}`.trim()
    : passenger.label;
  const segmentTotal = (Number(choice.seat?.price) || 0) + (Number(choice.meal?.price) || 0) + (Number(choice.baggage?.price) || 0);
  const currency = choice.seat?.currency || choice.meal?.currency || choice.baggage?.currency || segmentCatalog.seats[0]?.price?.currency || "INR";
  const route = activeSegment ? `${activeSegment.from} → ${activeSegment.to}` : "";
  const flightLabel = [airline || activeSegment?.airline, activeSegment?.flightNumber].filter(Boolean).join(" · ");

  function selectSeat(seat) {
    const state = seatAvailability(seat, takenSeats);
    if (state !== "available" && choice.seat?.code !== seat.code) return;
    const selected = choice.seat?.code === seat.code;
    update("seat", selected ? null : itemPayload(seat));
  }

  return (
    <div className="ssr-backdrop" role="presentation" onClick={onClose}>
      <div
        ref={dialogRef}
        className={`ssr-modal ${tab === "seat" ? "is-wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="ssr-header">
          <div>
            <p className="ssr-kicker">Add-ons</p>
            <h2 id={titleId}>
              {displayName}
              <span> · {passenger.typeLabel}</span>
            </h2>
            <p>{[flightLabel, route].filter(Boolean).join(" · ") || "Flight"}</p>
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
                onClick={() => {
                  setSegmentKey(segment.id);
                }}
              >
                {`Segment ${index + 1}`}
                <span>{segment.from}–{segment.to}</span>
              </button>
            ))}
          </div>
        ) : null}

        <div className="ssr-tabs" role="tablist" aria-label="Add-on type">
          {availableTabs.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`ssr-tab-${item.id}`}
              aria-selected={tab === item.id}
              aria-controls={`ssr-panel-${item.id}`}
              className={tab === item.id ? "is-active" : ""}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="ssr-stage">
        <div className="ssr-body">
          {passengers?.length > 1 ? (
            <div className="ssr-pax" role="listbox" aria-label="Passengers">
              {passengers.map((person) => {
                const active = person.id === passenger.id;
                const seatLabel = selections?.[person.id]?.[segmentKey]?.seat?.label;
                return (
                  <button
                    key={person.id}
                    type="button"
                    role="option"
                    aria-selected={active}
                    className={active ? "is-active" : ""}
                    onClick={() => onSelectPassenger?.(person.id)}
                  >
                    <strong>{person.firstName || person.lastName ? `${person.firstName || ""} ${person.lastName || ""}`.trim() : person.label}</strong>
                    <span>{person.typeLabel}{seatLabel ? ` · ${seatLabel}` : " · Select seat"}</span>
                  </button>
                );
              })}
            </div>
          ) : null}
          {loading ? (
            <div className="ssr-skeleton" aria-busy="true" aria-live="polite">
              <span />
              <span />
              <span />
              <p>Loading seats, meals and baggage from the supplier.</p>
            </div>
          ) : null}
          {error ? <p className="ssr-error" role="alert">{error}</p> : null}
          {!loading && !availableTabs.length ? (
            <p className="ssr-empty">Add-ons are not available from the supplier for this fare.</p>
          ) : null}

          {!loading && tab === "seat" && segmentCatalog.seats.length ? (
            infant ? (
              <p className="ssr-empty">Seat selection is not available for infants.</p>
            ) : (
              <div className="ssr-panel" id="ssr-panel-seat" role="tabpanel" aria-labelledby="ssr-tab-seat">
                <div className="ssr-legend">
                  {legend.map((item) => (
                    <span key={item.id} className={item.klass}>
                      <strong>{item.label}</strong>
                      <small>{item.detail}</small>
                    </span>
                  ))}
                </div>
                {cabin.partial ? (
                  <p className="ssr-note">Only the seats returned by the supplier are shown.</p>
                ) : null}
                <div className="ssr-aircraft">
                  <div className="ssr-nose" aria-hidden="true">
                    <span>Front</span>
                  </div>
                  <div
                    className="ssr-cabin"
                    role="grid"
                    aria-label="Aircraft seat map"
                    data-columns={Math.max(1, cabin.left.length + cabin.right.length)}
                    onKeyDown={moveSeatFocus}
                  >
                    <div className="ssr-row ssr-row-labels" aria-hidden="true">
                      <span className="ssr-row-no" />
                      {cabin.left.map((letter, index) => (
                        <span key={letter} className="ssr-col-label">
                          {index === 0 ? "Window" : index === cabin.left.length - 1 && cabin.aisle ? "Aisle" : letter}
                        </span>
                      ))}
                      {cabin.aisle ? <span className="ssr-aisle">Aisle</span> : null}
                      {cabin.right.map((letter, index) => (
                        <span key={letter} className="ssr-col-label">
                          {index === 0 && cabin.aisle ? "Aisle" : index === cabin.right.length - 1 ? "Window" : letter}
                        </span>
                      ))}
                    </div>
                    {cabin.rowNumbers.map((row) => {
                      const exit = [...(cabin.rows.get(row)?.values() || [])].some(isExitSeat);
                      return (
                      <div key={row} className={`ssr-row ${exit ? "is-exit" : ""}`} role="row">
                        <span className="ssr-row-no">{row}{exit ? <i>Exit</i> : null}</span>
                        {cabin.left.map((letter) => (
                          <SeatCell
                            key={`${row}${letter}`}
                            seat={cabin.rows.get(row)?.get(letter) || null}
                            letter={letter}
                            prices={cabin.prices}
                            selectedCode={choice.seat?.code}
                            takenSeats={takenSeats}
                            onSelect={selectSeat}
                          />
                        ))}
                        {cabin.aisle ? <span className="ssr-aisle" aria-hidden="true" /> : null}
                        {cabin.right.map((letter) => (
                          <SeatCell
                            key={`${row}${letter}`}
                            seat={cabin.rows.get(row)?.get(letter) || null}
                            letter={letter}
                            prices={cabin.prices}
                            selectedCode={choice.seat?.code}
                            takenSeats={takenSeats}
                            onSelect={selectSeat}
                          />
                        ))}
                      </div>
                      );
                    })}
                  </div>
                </div>
                {cabin.unplaced.map((seat) => {
                  const state = seatAvailability(seat, takenSeats);
                  const selected = choice.seat?.code === seat.code;
                  return (
                    <button
                      key={seat.code}
                      type="button"
                      className={`ssr-seat-list ${selected ? "is-selected" : ""}`}
                      disabled={state !== "available" && !selected}
                      aria-pressed={selected}
                      onClick={() => selectSeat(seat)}
                    >
                      {seat.label || seat.code} · {money(seat.price?.amount, seat.price?.currency)}
                    </button>
                  );
                })}
                <p className="ssr-selected-price">
                  {choice.seat
                    ? `${choice.seat.label} · ${money(choice.seat.price, choice.seat.currency)}`
                    : "No seat selected"}
                </p>
              </div>
            )
          ) : null}

          {!loading && tab === "meal" ? (
            <div className="ssr-panel ssr-cards" id="ssr-panel-meal" role="tabpanel" aria-labelledby="ssr-tab-meal">
              {segmentCatalog.meals.length ? segmentCatalog.meals.map((meal) => {
                const selected = choice.meal?.code === meal.code;
                const diet = mealDiet(meal);
                const image = meal.imageUrl || meal.image || "";
                return (
                  <article key={meal.code} className={`ssr-card ${selected ? "is-selected" : ""}`}>
                    {image ? <img src={image} alt="" className="ssr-card-image" /> : <span className={`ssr-meal-mark ${diet === "Veg" ? "is-veg" : diet === "Non-veg" ? "is-nonveg" : ""}`} aria-hidden="true" />}
                    <p className="ssr-card-title">{meal.label || meal.code}</p>
                    <p className="ssr-card-copy">{meal.description || diet || "Supplier meal"}</p>
                    {diet ? <p className="ssr-diet">{diet}</p> : null}
                    <p className="ssr-card-price">{money(meal.price?.amount, meal.price?.currency)}</p>
                    <button
                      type="button"
                      aria-pressed={selected}
                      onClick={() => update("meal", selected ? null : itemPayload(meal))}
                    >
                      {selected ? "Remove" : "Select"}
                    </button>
                  </article>
                );
              }) : <p className="ssr-empty">No meals were returned for this flight.</p>}
            </div>
          ) : null}

          {!loading && tab === "baggage" ? (
            <div className="ssr-panel ssr-cards" id="ssr-panel-baggage" role="tabpanel" aria-labelledby="ssr-tab-baggage">
              {includedBaggage ? (
                <article className="ssr-card is-included">
                  <p className="ssr-card-title">Included allowance</p>
                  <p className="ssr-card-copy">
                    {includedBaggage.cabinKg != null ? `${includedBaggage.cabinKg} kg cabin` : "Cabin allowance included"}
                    {includedBaggage.checkinKg != null ? ` · ${includedBaggage.checkinKg} kg check-in` : ""}
                  </p>
                  <p className="ssr-card-price">Included</p>
                </article>
              ) : null}
              {segmentCatalog.baggage.length ? segmentCatalog.baggage.map((bag) => {
                const selected = choice.baggage?.code === bag.code;
                const weight = baggageWeight(bag);
                return (
                  <article key={bag.code} className={`ssr-card ${selected ? "is-selected" : ""}`}>
                    <p className="ssr-card-kicker">{weight != null ? `+${weight} kg` : "Extra baggage"}</p>
                    <p className="ssr-card-title">{bag.label || bag.code}</p>
                    <p className="ssr-card-copy">{bag.description || (route ? `For ${route}` : "Supplier baggage option")}</p>
                    <p className="ssr-card-price">{money(bag.price?.amount, bag.price?.currency)}</p>
                    <button
                      type="button"
                      aria-pressed={selected}
                      onClick={() => update("baggage", selected ? null : itemPayload(bag))}
                    >
                      {selected ? "Remove extra baggage" : "Add baggage"}
                    </button>
                  </article>
                );
              }) : <p className="ssr-empty">No extra baggage was returned for this flight.</p>}
            </div>
          ) : null}
        </div>
        <aside className="ssr-summary" aria-label="Seat price summary">
          <p className="ssr-kicker">Price details</p>
          <h3>{route || "Flight"}</h3>
          <p>{flightLabel || airline || "Selected flight"}</p>
          <p className="ssr-summary-pax">{displayName} · {passenger.typeLabel}</p>
          <dl>
            <div className="ssr-summary-seat" key={choice.seat?.code || "none"}>
              <dt>{choice.seat?.label || "No seat selected"}</dt>
              <dd>{choice.seat ? money(choice.seat.price, choice.seat.currency) : "—"}</dd>
            </div>
            {choice.meal ? <div><dt>{choice.meal.label}</dt><dd>{money(choice.meal.price, choice.meal.currency)}</dd></div> : null}
            {choice.baggage ? <div><dt>{choice.baggage.label}</dt><dd>{money(choice.baggage.price, choice.baggage.currency)}</dd></div> : null}
            <div><dt>Selected add-ons</dt><dd>{money(addonQuote.amount, currency)}</dd></div>
            {payable != null ? <div className="is-total"><dt>Payable</dt><dd>{money(payable, payableCurrency || currency)}</dd></div> : null}
          </dl>
          <div className="ssr-summary-actions">
            <button type="button" onClick={onClose}>Back</button>
            <button type="button" onClick={() => { if (choice.seat) update("seat", null); onClose(); }}>Skip seats</button>
            <button type="button" className="ssr-confirm" onClick={onClose}>Continue</button>
          </div>
        </aside>
        </div>

        <footer className="ssr-footer">
          <p>
            {choice.seat?.label || "No seat"}
            {choice.meal ? ` · ${choice.meal.label}` : ""}
            {choice.baggage ? ` · ${choice.baggage.label}` : ""}
            <strong> {money(segmentTotal, currency)}</strong>
          </p>
          <div className="ssr-summary-actions">
            <button type="button" onClick={onClose}>Back</button>
            <button type="button" onClick={() => { if (choice.seat) update("seat", null); onClose(); }}>Skip</button>
            <button type="button" className="ssr-confirm" onClick={onClose}>Continue</button>
          </div>
        </footer>
      </div>
    </div>
  );
}

function SeatCell({ seat, letter, prices, selectedCode, takenSeats, onSelect }) {
  if (!seat) {
    return <span className="ssr-seat-gap" aria-hidden="true" />;
  }
  const state = seatAvailability(seat, takenSeats);
  const selected = selectedCode === seat.code;
  const band = Math.min(Math.max(prices.indexOf(Number(seat.price?.amount) || 0), 0), 2);
  const category = seatCategory(seat);
  const blocked = state !== "available";
  const reason = state === "occupied"
    ? "occupied"
    : state === "taken"
      ? "already assigned on this flight"
      : state === "unavailable"
        ? "unavailable"
        : money(seat.price?.amount, seat.price?.currency);
  return (
    <button
      type="button"
      className={`ssr-seat is-${category} is-band-${band} ${selected ? "is-selected" : ""} is-${state}`}
      disabled={blocked && !selected}
      aria-pressed={selected}
      aria-label={`Seat ${seat.code}, ${reason}`}
      onClick={() => onSelect(seat)}
    >
      {letter}
    </button>
  );
}
