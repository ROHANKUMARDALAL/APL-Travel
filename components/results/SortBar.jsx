"use client";

export default function SortBar({
  count,
  sort,
  options,
  onSortChange,
  onOpenFilters,
  extra,
}) {
  return (
    <div className="sort-bar">
      <p className="sort-bar-count">
        <strong>{count}</strong> result{count === 1 ? "" : "s"}
      </p>
      <div className="sort-bar-controls">
        {extra}
        <button type="button" className="sort-bar-mobile-btn" onClick={onOpenFilters}>
          Filters
        </button>
        <label className="sort-bar-label">
          <span>Sort</span>
          <select
            className="sort-bar-select"
            value={sort}
            onChange={(event) => onSortChange(event.target.value)}
          >
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
