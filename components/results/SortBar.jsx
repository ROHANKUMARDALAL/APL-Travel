"use client";

export default function SortBar({
  count,
  countLabel = "result",
  sort,
  options,
  onSortChange,
  onOpenFilters,
  extra,
  pills = false,
}) {
  const noun = count === 1 ? countLabel : `${countLabel}s`;
  return (
    <div className={`sort-bar ${pills ? "sort-bar-pills" : ""}`}>
      <p className="sort-bar-count">
        We found <strong>{count}</strong> {noun}
      </p>
      <div className="sort-bar-controls">
        {extra}
        <button type="button" className="sort-bar-mobile-btn" onClick={onOpenFilters}>
          Filters
        </button>
        {pills ? (
          <div className="sort-pills" role="radiogroup" aria-label="Sort flights">
            {options.map((option) => (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={sort === option.id}
                className={sort === option.id ? "is-active" : ""}
                onClick={() => onSortChange(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}
