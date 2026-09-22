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
        <p className="result-card-kicker">
          {item.stars}★ · {item.propertyType}
        </p>
        <h2 className="hotel-card-name">{item.name}</h2>
        <p className="result-card-meta hotel-card-location">{item.location}</p>
        <p className="hotel-rating">
          <strong>{item.rating.toFixed(1)}</strong>
          <span>
            /10 · {item.reviewCount.toLocaleString()} reviews
          </span>
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
        <p className="price-total">{formatMoney(stayTotal, marketId)}</p>
        <p className="price-per-night">
          {price.totalLabel} / night · incl. taxes
        </p>
        <p className="price-breakdown">
          {stayNights} night{stayNights === 1 ? "" : "s"} ·{" "}
          {formatMoney(stayTaxes, marketId)} taxes
        </p>
        <p className="price-fee-note">Booking fees may apply at checkout</p>
        <Link className="btn-primary result-card-cta" href={detailsHref}>
          View rooms
        </Link>
      </div>
    </article>
  );
}
