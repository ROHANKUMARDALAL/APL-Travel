"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { genderLabel } from "@/lib/travellerIdentity";

function typeLabel(type) {
  if (type === "child") return "Child";
  if (type === "infant") return "Infant";
  return "Adult";
}

function ageFromDob(value) {
  if (!value) return "";
  const born = new Date(value);
  if (Number.isNaN(born.getTime())) return "";
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const month = now.getMonth() - born.getMonth();
  if (month < 0 || (month === 0 && now.getDate() < born.getDate())) age -= 1;
  return age >= 0 && age <= 120 ? `${age} yrs` : "";
}

export default function TravellerPickerModal({
  open,
  typeFilter,
  travellers,
  takenIds,
  maxSelection = 1,
  onClose,
  onSelect,
}) {
  const titleId = useId();
  const closeRef = useRef(null);
  const dialogRef = useRef(null);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    if (!open) {
      setSelectedIds([]);
      return undefined;
    }
    function focusables() {
      if (!dialogRef.current) return [];
      return Array.from(
        dialogRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute("disabled"));
    }
    function onKey(event) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusables();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    const timer = window.setTimeout(() => closeRef.current?.focus(), 0);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(timer);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const rows = (travellers || []).filter((person) => {
    if (!typeFilter) return true;
    return String(person.travellerType || "adult") === typeFilter;
  });

  const taken = new Set(takenIds || []);
  const limit = Math.max(1, Number(maxSelection) || 1);
  const atLimit = selectedIds.length >= limit;

  function togglePerson(person) {
    if (taken.has(person.id)) return;
    setSelectedIds((current) => {
      if (current.includes(person.id)) {
        return current.filter((id) => id !== person.id);
      }
      if (limit === 1) return [person.id];
      if (current.length >= limit) return current;
      return [...current, person.id];
    });
  }

  function confirmSelection() {
    const chosen = rows.filter((person) => selectedIds.includes(person.id));
    if (!chosen.length) return;
    if (limit === 1) {
      onSelect(chosen[0]);
    } else {
      onSelect(chosen);
    }
    onClose();
  }

  const slotHint = typeFilter
    ? `Choose a saved ${typeLabel(typeFilter).toLowerCase()} for this passenger slot.`
    : "Choose from your saved travellers for this booking.";

  return createPortal(
    <div className="auth-modal-backdrop traveller-picker-backdrop" role="presentation" onClick={onClose}>
      <div
        ref={dialogRef}
        className="traveller-picker-modal traveller-picker-modal-rich"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="traveller-picker-head">
          <div>
            <h2 id={titleId} className="traveller-picker-title">
              Select Saved Travellers
            </h2>
            <p className="traveller-picker-lede">
              {slotHint}
              {limit > 1 ? ` You can select up to ${limit}.` : ""}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="traveller-picker-close"
            aria-label="Close traveller picker"
            onClick={onClose}
          >
            ✕
          </button>
        </header>

        <div className="traveller-picker-body">
          {rows.length === 0 ? (
            <div className="traveller-picker-empty">
              <p className="traveller-picker-empty-title">No saved travellers yet</p>
              <p className="traveller-picker-empty-copy">
                {typeFilter
                  ? `Add a ${typeLabel(typeFilter).toLowerCase()} from My traveller list, then return here to fill this slot.`
                  : "Add passengers from My traveller list to reuse them at checkout."}
              </p>
            </div>
          ) : (
            <ul className="traveller-picker-list traveller-picker-list-rich" role="listbox" aria-multiselectable={limit > 1}>
              {rows.map((person) => {
                const isTaken = taken.has(person.id);
                const isSelected = selectedIds.includes(person.id);
                const disabled = isTaken || (!isSelected && atLimit && limit > 1);
                const name = [person.title, person.firstName, person.lastName]
                  .filter(Boolean)
                  .join(" ");
                const age = ageFromDob(person.dateOfBirth);
                return (
                  <li key={person.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      className={`traveller-picker-card ${isSelected ? "is-selected" : ""} ${isTaken ? "is-taken" : ""}`}
                      disabled={disabled}
                      onClick={() => togglePerson(person)}
                    >
                      <span className="traveller-picker-check" aria-hidden="true">
                        <span className={`traveller-picker-radio ${isSelected ? "is-on" : ""}`} />
                      </span>
                      <span className="traveller-picker-card-accent" aria-hidden="true">
                        <span className="traveller-picker-avatar">
                          {(person.firstName || "T").slice(0, 1).toUpperCase()}
                        </span>
                        <span className={`traveller-picker-type is-${person.travellerType || "adult"}`}>
                          {typeLabel(person.travellerType)}
                        </span>
                      </span>
                      <span className="traveller-picker-card-body">
                        <span className="traveller-picker-name">{name || "Traveller"}</span>
                        <span className="traveller-picker-facts">
                          <span>{genderLabel(person.gender)}</span>
                          <span>{age || "Age not added"}</span>
                          <span>
                            {person.dateOfBirth ? `DOB ${person.dateOfBirth}` : "DOB not added"}
                          </span>
                        </span>
                        <span className="traveller-picker-passport">
                          {person.passportNumber
                            ? `Passport ${person.passportNumber}${
                                person.passportExpiry ? ` · Exp ${person.passportExpiry}` : ""
                              }${
                                person.passportIssueCountry || person.nationality
                                  ? ` · ${person.passportIssueCountry || person.nationality}`
                                  : ""
                              }`
                            : "No passport details saved"}
                        </span>
                        {isTaken ? (
                          <span className="traveller-picker-taken">
                            Already selected on this booking
                          </span>
                        ) : null}
                        {disabled && !isTaken && !isSelected ? (
                          <span className="traveller-picker-taken">
                            Maximum {limit} selected
                          </span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <footer className="traveller-picker-footer">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={!selectedIds.length}
            onClick={confirmSelection}
          >
            Confirm Selection ({selectedIds.length} Selected)
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
