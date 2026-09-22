"use client";

function CheckboxGroup({ title, options, selected, onChange }) {
  return (
    <fieldset className="filter-group">
      <legend className="filter-group-title">{title}</legend>
      <div className="filter-options">
        {options.map((option) => {
          const checked = selected.includes(option.id);
          return (
            <label key={option.id} className="filter-check">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => {
                  if (checked) {
                    onChange(selected.filter((id) => id !== option.id));
                  } else {
                    onChange([...selected, option.id]);
                  }
                }}
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export default function FilterPanel({
  service,
  filters,
  onChange,
  onClear,
  meta,
  open,
  onClose,
}) {
  const content = (
    <div className="filter-panel-inner">
      <div className="filter-panel-head">
        <h2 className="filter-panel-title">Filters</h2>
        <button type="button" className="btn-ghost" onClick={onClear}>
          Clear
        </button>
      </div>

      {service === "flight" ? (
        <>
          <CheckboxGroup
            title="Stops"
            options={[
              { id: "0", label: "Non-stop" },
              { id: "1", label: "1 stop" },
            ]}
            selected={filters.stops}
            onChange={(stops) => onChange({ ...filters, stops })}
          />
          <CheckboxGroup
            title="Airlines"
            options={meta.airlines.map((name) => ({ id: name, label: name }))}
            selected={filters.airlines}
            onChange={(airlines) => onChange({ ...filters, airlines })}
          />
          <CheckboxGroup
            title="Departure time"
            options={meta.departBuckets}
            selected={filters.departBuckets}
            onChange={(departBuckets) => onChange({ ...filters, departBuckets })}
          />
          <CheckboxGroup
            title="Arrival time"
            options={meta.arriveBuckets}
            selected={filters.arriveBuckets}
            onChange={(arriveBuckets) => onChange({ ...filters, arriveBuckets })}
          />
          <label className="filter-range">
            <span className="filter-group-title">Max price ({meta.currency})</span>
            <input
              type="range"
              min={meta.priceMin}
              max={meta.priceMax}
              value={filters.maxPrice ?? meta.priceMax}
              onChange={(event) =>
                onChange({ ...filters, maxPrice: Number(event.target.value) })
              }
            />
            <span className="filter-range-value">
              Up to {meta.formatPrice(filters.maxPrice ?? meta.priceMax)}
            </span>
          </label>
          <label className="filter-range">
            <span className="filter-group-title">Max duration</span>
            <input
              type="range"
              min={meta.durationMin}
              max={meta.durationMax}
              step={15}
              value={filters.maxDuration ?? meta.durationMax}
              onChange={(event) =>
                onChange({ ...filters, maxDuration: Number(event.target.value) })
              }
            />
            <span className="filter-range-value">
              Up to {meta.formatDuration(filters.maxDuration ?? meta.durationMax)}
            </span>
          </label>
        </>
      ) : null}

      {service === "hotel" ? (
        <>
          <label className="filter-range">
            <span className="filter-group-title">Max price / night ({meta.currency})</span>
            <input
              type="range"
              min={meta.priceMin}
              max={meta.priceMax}
              value={filters.maxPrice ?? meta.priceMax}
              onChange={(event) =>
                onChange({ ...filters, maxPrice: Number(event.target.value) })
              }
            />
            <span className="filter-range-value">
              Up to {meta.formatPrice(filters.maxPrice ?? meta.priceMax)}
            </span>
          </label>
          <label className="filter-range">
            <span className="filter-group-title">Min guest rating</span>
            <input
              type="range"
              min={7}
              max={10}
              step={0.1}
              value={filters.minRating ?? 7}
              onChange={(event) =>
                onChange({ ...filters, minRating: Number(event.target.value) })
              }
            />
            <span className="filter-range-value">{(filters.minRating ?? 7).toFixed(1)}+</span>
          </label>
          <CheckboxGroup
            title="Star / category"
            options={[2, 3, 4, 5].map((n) => ({ id: String(n), label: `${n}★` }))}
            selected={filters.stars}
            onChange={(stars) => onChange({ ...filters, stars })}
          />
          <CheckboxGroup
            title="Property type"
            options={meta.propertyTypes.map((t) => ({ id: t, label: t }))}
            selected={filters.propertyTypes}
            onChange={(propertyTypes) => onChange({ ...filters, propertyTypes })}
          />
          <CheckboxGroup
            title="Amenities"
            options={meta.amenities.map((a) => ({ id: a, label: a }))}
            selected={filters.amenities}
            onChange={(amenities) => onChange({ ...filters, amenities })}
          />
          <CheckboxGroup
            title="Location"
            options={meta.locations.map((l) => ({ id: l, label: l }))}
            selected={filters.locations}
            onChange={(locations) => onChange({ ...filters, locations })}
          />
        </>
      ) : null}

      {service === "bus" ? (
        <>
          <label className="filter-range">
            <span className="filter-group-title">Max price ({meta.currency})</span>
            <input
              type="range"
              min={meta.priceMin}
              max={meta.priceMax}
              value={filters.maxPrice ?? meta.priceMax}
              onChange={(event) =>
                onChange({ ...filters, maxPrice: Number(event.target.value) })
              }
            />
            <span className="filter-range-value">
              Up to {meta.formatPrice(filters.maxPrice ?? meta.priceMax)}
            </span>
          </label>
          <CheckboxGroup
            title="Departure time"
            options={meta.departBuckets}
            selected={filters.departBuckets}
            onChange={(departBuckets) => onChange({ ...filters, departBuckets })}
          />
          <CheckboxGroup
            title="Arrival time"
            options={meta.arriveBuckets}
            selected={filters.arriveBuckets}
            onChange={(arriveBuckets) => onChange({ ...filters, arriveBuckets })}
          />
          <CheckboxGroup
            title="Operator"
            options={meta.operators.map((o) => ({ id: o, label: o }))}
            selected={filters.operators}
            onChange={(operators) => onChange({ ...filters, operators })}
          />
          <CheckboxGroup
            title="Bus type"
            options={meta.busTypes.map((t) => ({ id: t, label: t }))}
            selected={filters.busTypes}
            onChange={(busTypes) => onChange({ ...filters, busTypes })}
          />
        </>
      ) : null}

      {onClose ? (
        <button type="button" className="btn-primary filter-apply-mobile" onClick={onClose}>
          Show results
        </button>
      ) : null}
    </div>
  );

  return (
    <>
      <aside className="filter-panel filter-panel-desktop">{content}</aside>
      {open ? (
        <div className="filter-sheet" role="dialog" aria-modal="true" aria-label="Filters">
          <button type="button" className="filter-sheet-backdrop" aria-label="Close filters" onClick={onClose} />
          <div className="filter-sheet-panel">{content}</div>
        </div>
      ) : null}
    </>
  );
}
