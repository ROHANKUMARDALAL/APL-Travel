"use client";

import Link from "next/link";
import { getActiveMarketId, formatMoney } from "@/data/markets";
import { formatPriceParts } from "@/lib/resultsHelpers";

function CabMark({ category }) {
  const kind = String(category || "SEDAN").toUpperCase();
  return (
    <svg className="cab-mark" viewBox="0 0 120 72" aria-hidden="true">
      <rect x="8" y="28" width="104" height="28" rx="10" />
      <path d={kind === "SUV" || kind === "VAN" ? "M22 28 34 12h48l16 16" : "M28 28 40 16h36l14 12"} />
      <circle cx="34" cy="56" r="7" />
      <circle cx="86" cy="56" r="7" />
    </svg>
  );
}

export default function TransferResultCard({ item, detailsHref }) {
  const marketId = getActiveMarketId();
  const price = formatPriceParts(item, marketId);
  const currency = Object.keys(item.prices || {})[0] || "INR";
  const parts = item.prices?.[currency] || { base: price.total, taxes: 0, total: price.total };
  const ac = item.airConditioned == null ? null : item.airConditioned ? "AC" : "Non-AC";

  return (
    <article className="cab-card">
      <div className="cab-card-art" aria-hidden="true">
        <CabMark category={item.vehicleCategory} />
        <span>{item.vehicleCategory}</span>
      </div>
      <div className="cab-card-body">
        <p className="cab-kicker">{item.vehicleCategory}{item.supplier ? ` · ${item.supplier}` : ""}</p>
        <h2>{item.vehicleName}</h2>
        <ul className="cab-facts">
          <li>{item.maxPassengers} seats</li>
          <li>{item.maxLuggage} bags</li>
          {ac ? <li>{ac}</li> : null}
          {item.fuelType ? <li>{item.fuelType}</li> : null}
        </ul>
        {(item.inclusions || []).length ? (
          <ul className="cab-features">
            {item.inclusions.map((row) => <li key={row}>{row}</li>)}
          </ul>
        ) : null}
      </div>
      <div className="cab-card-price">
        <p><span>Base fare</span><strong>{formatMoney(parts.base, marketId)}</strong></p>
        <p><span>Taxes and fees</span><strong>{parts.taxes ? formatMoney(parts.taxes, marketId) : "Included"}</strong></p>
        <p className="cab-final"><span>Final price</span><strong>{price.totalLabel}</strong></p>
        <Link className="btn-primary result-card-cta" href={detailsHref}>Select Cab</Link>
      </div>
    </article>
  );
}
