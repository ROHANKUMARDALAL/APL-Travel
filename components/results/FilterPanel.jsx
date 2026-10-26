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
          <fieldset className="filter-group fr-stops">
            <legend className="filter-group-title">Stops</legend>
            {(meta.stopStats || []).map((option) => {
              const checked = option.id === "any"
                ? !filters.stops?.length
                : option.id === "0"
                  ? filters.stops?.length === 1 && filters.stops[0] === "0"
                  : filters.stops?.includes("0") && filters.stops?.includes("1");
              return (
                <label key={option.id} className={`fr-stop ${checked ? "is-on" : ""}`}>
                  <input
                    type="radio"
                    name="flight-stops"
                    checked={checked}
                    onChange={() => onChange({
                      ...filters,
                      stops: option.id === "any" ? [] : option.id === "0" ? ["0"] : ["0", "1"],
                    })}
                  />
                  <span>
                    <strong>{option.label}</strong>
                    {option.from != null ? <small>From {meta.formatPrice(option.from)}</small> : null}
                  </span>
                  <em>{option.count}</em>
                </label>
              );
            })}
          </fieldset>
          {meta.showCheckedBag ? (
            <label className={`filter-check fr-bag ${filters.checkedBag ? "is-on" : ""}`}>
              <input
                type="checkbox"
                checked={Boolean(filters.checkedBag)}
                onChange={() => onChange({ ...filters, checkedBag: !filters.checkedBag })}
              />
              <span>
                <strong>Checked bag included</strong>
                <small>Shows fares that include check-in baggage.</small>
              </span>
            </label>
          ) : null}
          <fieldset className="filter-group">
            <legend className="filter-group-title">Airlines</legend>
            <div className="filter-options">
              {(meta.airlineStats || meta.airlines.map((name) => ({ id: name, label: name, count: null }))).map((option) => {
                const checked = filters.airlines.includes(option.id);
                return (
                  <label key={option.id} className={`filter-check ${checked ? "is-on" : ""}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onChange({ ...filters, airlines: toggleId(filters.airlines, option.id, checked) })}
                    />
                    <span>{option.label}</span>
                    {option.count != null ? <em className="fr-count">{option.count}</em> : null}
                  </label>
                );
              })}
            </div>
          </fieldset>
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
          <CheckboxGroup
            title="Cab type"
            options={(meta.vehicleCategories || []).map((t) => ({ id: t, label: t }))}
            selected={filters.vehicleCategories}
            onChange={(vehicleCategories) => onChange({ ...filters, vehicleCategories })}
          />
          <CheckboxGroup
            title="Car model"
            options={(meta.models || []).map((t) => ({ id: t, label: t }))}
            selected={filters.models}
            onChange={(models) => onChange({ ...filters, models })}
          />
          {meta.fuelTypes?.length ? (
            <CheckboxGroup
              title="Fuel type"
              options={meta.fuelTypes.map((t) => ({ id: t, label: t }))}
              selected={filters.fuelTypes}
              onChange={(fuelTypes) => onChange({ ...filters, fuelTypes })}
            />
          ) : null}
          {meta.acOptions?.length ? (
            <CheckboxGroup
              title="Air conditioning"
              options={meta.acOptions.map((t) => ({ id: t, label: t }))}
              selected={filters.ac}
              onChange={(ac) => onChange({ ...filters, ac })}
            />
          ) : null}
          <CheckboxGroup
            title="Seating capacity"
            options={(meta.seats || []).map((t) => ({ id: String(t), label: `${t} seats` }))}
            selected={(filters.seats || []).map(String)}
            onChange={(seats) => onChange({ ...filters, seats })}
          />
          <label className="filter-range">
            <span className="filter-group-title">Price range ({meta.currency})</span>
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
