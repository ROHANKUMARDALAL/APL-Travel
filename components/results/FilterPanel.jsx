"use client";

function toggleId(selected, id, checked) {
  return checked ? selected.filter((value) => value !== id) : [...selected, id];
}

const CHIP_TONES = new Set(["0", "1", "morning", "midday", "afternoon", "evening", "night"]);

function chipClass(id, checked) {
  const tone = CHIP_TONES.has(String(id)) ? `tone-${id}` : "";
  return `filter-chip ${tone} ${checked ? "is-on" : ""}`.trim();
}

function CheckboxGroup({ title, options, selected, onChange }) {
  return (
    <fieldset className="filter-group">
      <legend className="filter-group-title">{title}</legend>
      <div className="filter-options">
        {options.map((option) => {
          const checked = selected.includes(option.id);
          return (
            <label key={option.id} className={`filter-check ${checked ? "is-on" : ""}`}>
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onChange(toggleId(selected, option.id, checked))}
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function ChipGroup({ title, options, selected, onChange }) {
  return (
    <fieldset className="filter-group">
      <legend className="filter-group-title">{title}</legend>
      <div className="filter-chips">
        {options.map((option) => {
          const checked = selected.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              className={chipClass(option.id, checked)}
              aria-pressed={checked}
              onClick={() => onChange(toggleId(selected, option.id, checked))}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function DualRange({ min, max, low, high, onChange, formatValue }) {
  const span = Math.max(1, Number(max) - Number(min));
  const safeLow = Math.min(Math.max(low, min), high);
  const safeHigh = Math.max(Math.min(high, max), safeLow);
  const left = ((safeLow - min) / span) * 100;
  const width = ((safeHigh - safeLow) / span) * 100;

  function setLow(value) {
    const next = Math.min(Number(value), safeHigh);
    onChange(next, safeHigh);
  }

  function setHigh(value) {
    const next = Math.max(Number(value), safeLow);
    onChange(safeLow, next);
  }

  if (Number(max) <= Number(min)) {
    return <p className="filter-range-value">{formatValue(min)}</p>;
  }

  return (
    <div className="dual-range">
      <div className="dual-range-labels">
        <span>{formatValue(safeLow)}</span>
        <span>{formatValue(safeHigh)}</span>
      </div>
      <div className="dual-range-control">
        <div className="dual-range-track" />
        <div className="dual-range-fill" style={{ left: `${left}%`, width: `${width}%` }} />
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={safeLow}
          aria-label="Minimum price"
          onChange={(event) => setLow(event.target.value)}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={safeHigh}
          aria-label="Maximum price"
          onChange={(event) => setHigh(event.target.value)}
        />
      </div>
    </div>
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
        <button type="button" className="filter-clear" onClick={onClear}>
          Clear
        </button>
      </div>

      {service === "flight" ? (
        <>
          <div className="filter-card">
            <span className="filter-group-title">Price ({meta.currency})</span>
            <DualRange
              min={meta.priceMin}
              max={meta.priceMax}
              low={filters.minPrice ?? meta.priceMin}
              high={filters.maxPrice ?? meta.priceMax}
              formatValue={meta.formatPrice}
              onChange={(minPrice, maxPrice) => onChange({ ...filters, minPrice, maxPrice })}
            />
          </div>
          <ChipGroup
            title="Stops"
            options={[
              { id: "0", label: "Non-stop" },
              { id: "1", label: "1 stop" },
            ]}
            selected={filters.stops}
            onChange={(stops) => onChange({ ...filters, stops })}
          />
          <ChipGroup
            title="Airlines"
            options={meta.airlines.map((name) => ({ id: name, label: name }))}
            selected={filters.airlines}
            onChange={(airlines) => onChange({ ...filters, airlines })}
          />
          <ChipGroup
            title="Departure time"
            options={meta.departBuckets}
            selected={filters.departBuckets}
            onChange={(departBuckets) => onChange({ ...filters, departBuckets })}
          />
          <ChipGroup
            title="Arrival time"
            options={meta.arriveBuckets}
            selected={filters.arriveBuckets}
            onChange={(arriveBuckets) => onChange({ ...filters, arriveBuckets })}
          />
        </>
      ) : null}

      {service === "hotel" ? (
        <>
          <div className="filter-card">
            <span className="filter-group-title">Price / night ({meta.currency})</span>
            <DualRange
              min={meta.priceMin}
              max={meta.priceMax}
              low={filters.minPrice ?? meta.priceMin}
              high={filters.maxPrice ?? meta.priceMax}
              formatValue={meta.formatPrice}
              onChange={(minPrice, maxPrice) => onChange({ ...filters, minPrice, maxPrice })}
            />
          </div>
          <ChipGroup
            title="Star rating"
            options={[2, 3, 4, 5].map((n) => ({ id: String(n), label: `${n} star` }))}
            selected={filters.stars}
            onChange={(stars) => onChange({ ...filters, stars })}
          />
          <ChipGroup
            title="Property type"
            options={meta.propertyTypes.map((type) => ({ id: type, label: type }))}
            selected={filters.propertyTypes}
            onChange={(propertyTypes) => onChange({ ...filters, propertyTypes })}
          />
          <ChipGroup
            title="Amenities"
            options={meta.amenities.map((amenity) => ({ id: amenity, label: amenity }))}
            selected={filters.amenities}
            onChange={(amenities) => onChange({ ...filters, amenities })}
          />
          <ChipGroup
            title="Location"
            options={meta.locations.map((location) => ({ id: location, label: location }))}
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

      {service === "transfer" ? (
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
            title="Vehicle category"
            options={(meta.vehicleCategories || []).map((t) => ({ id: t, label: t }))}
            selected={filters.vehicleCategories}
            onChange={(vehicleCategories) => onChange({ ...filters, vehicleCategories })}
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
