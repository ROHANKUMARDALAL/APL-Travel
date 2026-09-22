"use client";

export default function CitySwapFields({
  fromId,
  toId,
  fromLabel = "From",
  toLabel = "To",
  fromValue,
  toValue,
  onFromChange,
  onToChange,
  onSwap,
  fromPlaceholder,
  toPlaceholder,
}) {
  return (
    <div className="city-swap-group">
      <div className="search-field">
        <label className="field-label" htmlFor={fromId}>
          {fromLabel}
        </label>
        <input
          id={fromId}
          className="field-input"
          type="text"
          value={fromValue}
          placeholder={fromPlaceholder}
          onChange={(event) => onFromChange(event.target.value)}
        />
      </div>

      <button
        type="button"
        className="city-swap-btn"
        aria-label="Swap cities"
        onClick={onSwap}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
          <path
            d="M7 7h11l-2.5-2.5M17 17H6l2.5 2.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M18 7v3M6 14v3"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <div className="search-field">
        <label className="field-label" htmlFor={toId}>
          {toLabel}
        </label>
        <input
          id={toId}
          className="field-input"
          type="text"
          value={toValue}
          placeholder={toPlaceholder}
          onChange={(event) => onToChange(event.target.value)}
        />
      </div>
    </div>
  );
}
