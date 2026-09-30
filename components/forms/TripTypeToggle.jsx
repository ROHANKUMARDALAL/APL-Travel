"use client";

const OPTIONS = [
  { id: "oneway", label: "One way" },
  { id: "return", label: "Return" },
  { id: "multi", label: "Multi-city" },
];

export default function TripTypeToggle({ value, onChange }) {
  return (
    <div className="trip-type-toggle" role="radiogroup" aria-label="Trip type">
      {OPTIONS.map((option) => {
        const selected = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={selected}
            className={selected ? "is-active" : ""}
            onClick={() => onChange(option.id)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
