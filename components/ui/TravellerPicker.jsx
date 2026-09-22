"use client";

import { useEffect, useRef, useState } from "react";
import CounterRow from "@/components/ui/CounterRow";

const MAX_TRAVELLERS = 9;

export default function TravellerPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const { adults, children, infants } = value;
  const total = adults + children + infants;

  useEffect(() => {
    function onPointerDown(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function update(next) {
    let adultsNext = Math.max(1, next.adults);
    let childrenNext = Math.max(0, next.children);
    let infantsNext = Math.max(0, next.infants);

    if (infantsNext > adultsNext) infantsNext = adultsNext;

    let sum = adultsNext + childrenNext + infantsNext;
    while (sum > MAX_TRAVELLERS && childrenNext > 0) {
      childrenNext -= 1;
      sum -= 1;
    }
    while (sum > MAX_TRAVELLERS && infantsNext > 0) {
      infantsNext -= 1;
      sum -= 1;
    }
    while (sum > MAX_TRAVELLERS && adultsNext > 1) {
      adultsNext -= 1;
      if (infantsNext > adultsNext) infantsNext = adultsNext;
      sum = adultsNext + childrenNext + infantsNext;
    }

    onChange({ adults: adultsNext, children: childrenNext, infants: infantsNext });
  }

  const summary = [
    `${adults} Adult${adults > 1 ? "s" : ""}`,
    children ? `${children} Child${children > 1 ? "ren" : ""}` : null,
    infants ? `${infants} Infant${infants > 1 ? "s" : ""}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="picker-field" ref={rootRef}>
      <label className="field-label">Travellers</label>
      <button
        type="button"
        className={`picker-trigger ${open ? "is-open" : ""}`}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>{summary}</span>
        <span className="picker-caret">▾</span>
      </button>

      {open ? (
        <div className="picker-popover">
          <CounterRow
            label="Adults"
            hint="12+ years · min 1"
            value={adults}
            decreaseDisabled={adults <= 1}
            increaseDisabled={total >= MAX_TRAVELLERS}
            onDecrease={() => update({ adults: adults - 1, children, infants })}
            onIncrease={() => update({ adults: adults + 1, children, infants })}
          />
          <CounterRow
            label="Children"
            hint="2–12 years"
            value={children}
            decreaseDisabled={children <= 0}
            increaseDisabled={total >= MAX_TRAVELLERS}
            onDecrease={() => update({ adults, children: children - 1, infants })}
            onIncrease={() => update({ adults, children: children + 1, infants })}
          />
          <CounterRow
            label="Infants"
            hint="Under 2 · max = adults"
            value={infants}
            decreaseDisabled={infants <= 0}
            increaseDisabled={total >= MAX_TRAVELLERS || infants >= adults}
            onDecrease={() => update({ adults, children, infants: infants - 1 })}
            onIncrease={() => update({ adults, children, infants: infants + 1 })}
          />
          <p className="picker-note">Max {MAX_TRAVELLERS} travellers in one booking.</p>
        </div>
      ) : null}
    </div>
  );
}
