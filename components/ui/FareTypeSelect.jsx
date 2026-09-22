"use client";

import { useEffect, useRef, useState } from "react";

export const FARE_TYPES = [
  { id: "normal", label: "Standard" },
  { id: "seniorcitizen", label: "Senior" },
  { id: "armedforces", label: "Military" },
  { id: "student", label: "Student" },
  { id: "doctor_nurses", label: "Healthcare" },
];

export default function FareTypeSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const selected = FARE_TYPES.find((item) => item.id === value) || FARE_TYPES[0];

  useEffect(() => {
    function onPointerDown(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  return (
    <div className="picker-field" ref={rootRef}>
      <label className="field-label">Fare type</label>
      <button
        type="button"
        className={`picker-trigger ${open ? "is-open" : ""}`}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>{selected.label}</span>
        <span className="picker-caret">▾</span>
      </button>

      {open ? (
        <div className="picker-popover fare-popover">
          {FARE_TYPES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`fare-option ${item.id === value ? "is-active" : ""}`}
              onClick={() => {
                onChange(item.id);
                setOpen(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
