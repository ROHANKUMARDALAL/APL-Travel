"use client";

import { getExtraPrice } from "@/lib/booking";
import { formatMoney, getActiveMarketId } from "@/data/markets";

export default function ExtrasSelector({
  extrasCatalog,
  selectedIds,
  onToggle,
  nights = 1,
}) {
  const marketId = getActiveMarketId();

  return (
    <section className="booking-section" id="extras">
      <h2 className="booking-section-title">Optional extras</h2>
      <p className="booking-section-copy">
        Nothing is preselected. Add only what you need — you can remove any extra
        anytime.
      </p>
      <div className="extras-list">
        {extrasCatalog.map((extra) => {
          const selected = selectedIds.includes(extra.id);
          const amount = getExtraPrice(extra, nights, marketId);
          return (
            <label
              key={extra.id}
              className={`extra-card ${selected ? "is-selected" : ""}`}
            >
              <input
                type="checkbox"
                checked={selected}
                onChange={() => onToggle(extra.id)}
              />
              <div className="extra-card-body">
                <div className="extra-card-top">
                  <p className="extra-card-label">{extra.label}</p>
                  <p className="extra-card-price">
                    +{formatMoney(amount, marketId)}
                    {extra.perNight ? " total" : ""}
                  </p>
                </div>
                <p className="extra-card-desc">{extra.description}</p>
                {selected ? (
                  <button
                    type="button"
                    className="extra-remove"
                    onClick={(event) => {
                      event.preventDefault();
                      onToggle(extra.id);
                    }}
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            </label>
          );
        })}
      </div>
    </section>
  );
}
