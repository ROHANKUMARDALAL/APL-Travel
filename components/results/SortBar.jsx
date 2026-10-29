"use client";

import PremiumSelect from "@/components/ui/PremiumSelect";

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
          <div className="sort-bar-label">
            <span>Sort</span>
            <PremiumSelect
              label="Sort"
              labelHidden
              ariaLabel="Sort results"
              className="sort-premium-select"
              value={sort}
              options={options.map((option) => ({ value: option.id, label: option.label }))}
              onChange={onSortChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}
