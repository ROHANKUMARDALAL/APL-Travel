"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api/client";

function money(amount, currency = "INR") {
  const value = Number(amount);
  if (!Number.isFinite(value)) return "";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
}

function destinationOf(pkg) {
  return [pkg.destinationCity, pkg.destinationCountry].filter(Boolean).join(", ");
}

export default function TrendingDestinations({ enabled }) {
  const [packages, setPackages] = useState(null);

  useEffect(() => {
    if (!enabled) return undefined;
    let ignore = false;
    apiGet("/holidays")
      .then((data) => {
        if (!ignore) setPackages(Array.isArray(data.packages) ? data.packages.slice(0, 6) : []);
      })
      .catch(() => {
        if (!ignore) setPackages([]);
      });
    return () => {
      ignore = true;
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <section className="home-trending" aria-labelledby="trending-destinations">
      <div className="container-page">
        <div className="home-trending-head home-rise">
          <div>
            <p className="home-trending-kicker">Holiday packages</p>
            <h2 id="trending-destinations">Trending Holiday Destinations</h2>
            <p>Published packages from this travel desk</p>
          </div>
          <Link className="home-view-all" href="/holidays">View All Holidays</Link>
        </div>
        {packages === null ? <p className="home-trending-status">Loading destinations…</p> : null}
        {packages && !packages.length ? (
          <p className="home-trending-empty">This travel desk has not published holiday packages yet.</p>
        ) : null}
        {packages?.length ? (
          <ul className="home-package-grid">
            {packages.map((pkg, index) => {
              const destination = destinationOf(pkg);
              const price = money(pkg.startingPrice, pkg.currency);
              return (
                <li key={pkg.slug || pkg.title} className="home-rise" style={{ animationDelay: `${index * 70}ms` }}>
                  <article className="home-package">
                    <Link className="home-package-media" href={`/holidays/${pkg.slug}`}>
                      {pkg.coverImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={pkg.coverImage} alt="" loading="lazy" />
                      ) : <span className="home-destination-fallback" />}
                      <span className="home-package-shade" />
                    </Link>
                    <div className="home-package-body">
                      <p className="home-package-kicker">{pkg.isInternational ? "International" : "Domestic"}</p>
                      <h3>{pkg.title}</h3>
                      {destination ? <p className="home-package-place">{destination}</p> : null}
                      {pkg.durationDays ? <p>{pkg.durationDays} days{pkg.durationNights ? ` / ${pkg.durationNights} nights` : ""}</p> : null}
                      {price ? <p className="home-package-price">{pkg.priceLabel || "Starting price"}: {price}</p> : null}
                      <div className="home-package-actions">
                        <Link className="home-package-primary" href={`/holidays/${pkg.slug}`}>View details</Link>
                        {pkg.enquiryEnabled !== false ? (
                          <Link className="home-package-secondary" href={`/holidays/${pkg.slug}/enquire`}>Enquire now</Link>
                        ) : null}
                      </div>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
