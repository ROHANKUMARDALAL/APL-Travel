export default function SegmentedToggle({ label, value, options, onChange }) {
  const index = Math.max(0, options.findIndex((option) => option.value === value));

  return (
    <div className="rch-seg" role="radiogroup" aria-label={label}>
      <span className="rch-seg-thumb" style={{ transform: `translateX(${index * 100}%)` }} aria-hidden="true" />
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            className={active ? "rch-seg-btn is-active" : "rch-seg-btn"}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
