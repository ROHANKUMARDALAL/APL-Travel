"use client";

export default function CounterRow({
  label,
  hint,
  value,
  onDecrease,
  onIncrease,
  decreaseDisabled,
  increaseDisabled,
}) {
  return (
    <div className="counter-row">
      <div>
        <p className="counter-label">{label}</p>
        {hint ? <p className="counter-hint">{hint}</p> : null}
      </div>
      <div className="counter-controls">
        <button
          type="button"
          className="counter-btn"
          aria-label={`Decrease ${label}`}
          disabled={decreaseDisabled}
          onClick={onDecrease}
        >
          −
        </button>
        <span className="counter-value">{value}</span>
        <button
          type="button"
          className="counter-btn"
          aria-label={`Increase ${label}`}
          disabled={increaseDisabled}
          onClick={onIncrease}
        >
          +
        </button>
      </div>
    </div>
  );
}
