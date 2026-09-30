"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

function typeLabel(type) {
  if (type === "child") return "Child";
  if (type === "infant") return "Infant";
  return "Adult";
}

export default function TravellerPickerModal({
  open,
  typeFilter,
  travellers,
  takenIds,
  onClose,
  onSelect,
}) {
  useEffect(() => {
    if (!open) return undefined;
    function onKey(event) {
      if (event.key === "Escape") onClose();
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const rows = (travellers || []).filter((person) => {
    if (!typeFilter) return true;
    return String(person.travellerType || "adult") === typeFilter;
  });

  return createPortal(
    <div className="auth-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="traveller-picker-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Traveller list"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="traveller-picker-head">
          <h2 className="checkout-section-title">
            {typeFilter ? `${typeLabel(typeFilter)} travellers` : "Your travellers"}
          </h2>
          <button type="button" className="btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
        <p className="section-copy">
          {typeFilter
            ? `Choose one ${typeLabel(typeFilter).toLowerCase()} for this seat.`
            : "Choose a saved passenger."}
        </p>
        {rows.length === 0 ? (
          <p className="section-copy">
            No saved {typeFilter ? typeLabel(typeFilter).toLowerCase() : "traveller"} matches this booking yet.
            Add one from My traveller list.
          </p>
        ) : (
          <ul className="traveller-picker-list">
            {rows.map((person) => {
              const taken = (takenIds || []).includes(person.id);
              return (
                <li key={person.id}>
                  <button
                    type="button"
                    className="traveller-picker-row"
                    disabled={taken}
                    onClick={() => onSelect(person)}
                  >
                    <span>
                      {person.firstName} {person.lastName}
                    </span>
                    <span className="result-card-meta">
                      {typeLabel(person.travellerType)}
                      {person.dateOfBirth ? ` · ${person.dateOfBirth}` : ""}
                      {taken ? " · Already selected" : ""}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>,
    document.body,
  );
}
