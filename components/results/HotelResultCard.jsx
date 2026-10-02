"use client";

import Image from "next/image";
import Link from "next/link";
import { formatMoney, getActiveMarketId } from "@/data/markets";
import { formatPriceParts } from "@/lib/resultsHelpers";

export default function HotelResultCard({ item, detailsHref, nights = 1 }) {
  const marketId = getActiveMarketId();
  const price = formatPriceParts(item, marketId);
  const stayNights = Math.max(1, nights);
  const stayTotal = price.total * stayNights;
  const stayTaxes = price.taxes * stayNights;

  return (
    <article className="result-card hotel-card">
      <div className="hotel-card-media">
        <Image
          src={item.image}
          alt={item.name}
          fill
          sizes="(max-width: 900px) 100vw, 200px"
          className="hotel-card-image"
        />
      </div>

      <div className="hotel-card-info">
        <span className="hotel-type">{item.propertyType}</span>
        <span className="hotel-stars" aria-label={`${item.stars} star hotel`}>
          {Array.from({ length: 5 }, (_, index) => (
            <span key={index} className={index < item.stars ? "is-on" : ""}>
              ★
            </span>
          ))}
        </span>
        <h2 className="hotel-card-name">{item.name}</h2>
        <p className="result-card-meta hotel-card-location">{item.location}</p>
        <p className="hotel-rating">
          <strong>{Number(item.rating || 0).toFixed(1)}</strong>
          {item.reviewCount > 0 ? (
            <span>{item.reviewCount.toLocaleString()} reviews</span>
          ) : null}
        </p>
        <ul className="hotel-amenities">
          {item.amenities.slice(0, 4).map((amenity) => (
            <li key={amenity}>{amenity}</li>
          ))}
        </ul>
        <p className="hotel-card-room">{item.roomType}</p>
        <p className="result-card-policy">{item.cancellation}</p>
      </div>

      <div className="result-card-price hotel-card-price">
        <p className="price-total">{formatMoney(stayTotal, marketId, price.currency)}</p>
        <p className="price-per-night">
          {price.totalLabel} / night
          {price.pax > 1 ? ` · ${price.pax} guests` : ""} · incl. taxes
        </p>
        <p className="price-breakdown">
          {stayNights} night{stayNights === 1 ? "" : "s"} ·{" "}
          {formatMoney(stayTaxes, marketId, price.currency)} taxes
        </p>
        <p className="price-fee-note">Booking fees may apply at checkout</p>
        <Link className="btn-primary result-card-cta" href={detailsHref}>
          View rooms
        </Link>
      </div>
    </article>
  );
}
