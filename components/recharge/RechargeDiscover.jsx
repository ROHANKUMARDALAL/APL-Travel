"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Reveal from "@/components/motion/Reveal";
import { useSite } from "@/components/site/SiteProvider";
import { apiGet } from "@/lib/api/client";
import { SERVICE_CATALOGUE } from "@/data/static";

function money(amount, currency = "INR") {
  const value = Number(amount);
  if (!Number.isFinite(value)) return "";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
}

function discountLabel(offer) {
  if (offer.adjustmentType === "PERCENTAGE") {
    const cap = offer.maxAmount ? `, up to ${money(offer.maxAmount, offer.currency)}` : "";
    return `${offer.value}%${cap}`;
  }
  return money(offer.value, offer.currency);
}

function expiryLabel(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function serviceOf(code) {
  return SERVICE_CATALOGUE.find((service) => service.id === String(code || "").toLowerCase()) || null;
}

function initials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "C";
}

function destinationOf(pkg) {
  return [pkg.destinationCity, pkg.destinationCountry].filter(Boolean).join(", ");
}

const loads = new Map();

function loadOnce(path) {
  if (!loads.has(path)) {
    loads.set(path, apiGet(path).catch((error) => {
      loads.delete(path);
      throw error;
    }));
  }
  return loads.get(path);
}

export default function RechargeDiscover() {
  const router = useRouter();
  const { services, testimonials, source } = useSite();
  const holidayOffered = (services || []).some((service) => service.id === "holiday");
  const [offers, setOffers] = useState(null);
  const [packages, setPackages] = useState(holidayOffered ? null : []);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    let ignore = false;
    loadOnce("/public/offers")
      .then((data) => {
        if (!ignore) setOffers(Array.isArray(data?.offers) ? data.offers : []);
      })
      .catch(() => {
        if (!ignore) setOffers([]);
      });
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!holidayOffered) return undefined;
    let ignore = false;
    loadOnce("/holidays")
      .then((data) => {
        if (!ignore) setPackages(Array.isArray(data?.packages) ? data.packages.slice(0, 8) : []);
      })
      .catch(() => {
        if (!ignore) setPackages([]);
      });
    return () => {
      ignore = true;
    };
  }, [holidayOffered]);

  const stories = source === "api"
    ? (testimonials || []).filter((item) => item.customerName && item.message).slice(0, 6)
    : [];

  function markCopied(text) {
    setCopied(text);
    window.setTimeout(() => setCopied((current) => (current === text ? "" : current)), 1600);
  }

  function copyCode(code) {
    const text = String(code || "");
    if (!text) return;
    const fallback = () => {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.left = "-999px";
      document.body.appendChild(area);
      area.select();
      let ok = false;
      try { ok = document.execCommand("copy"); } catch { ok = false; }
      area.remove();
      if (ok) markCopied(text);
    };
    if (!navigator.clipboard?.writeText) {
      fallback();
      return;
    }
    navigator.clipboard.writeText(text).then(() => markCopied(text)).catch(fallback);
  }

  function viewOffer(offer) {
    const service = serviceOf(offer.serviceCode);
    window.sessionStorage.setItem("apl-coupon-code", offer.code);
    window.sessionStorage.setItem("apl-coupon-service", offer.serviceCode || "");
    window.sessionStorage.setItem("apl-coupon-type", offer.adjustmentType || "");
    window.sessionStorage.setItem("apl-coupon-value", offer.value == null ? "" : String(offer.value));
    window.sessionStorage.setItem("apl-coupon-currency", offer.currency || "INR");
    if (offer.maxAmount != null) window.sessionStorage.setItem("apl-coupon-max", String(offer.maxAmount));
    else window.sessionStorage.removeItem("apl-coupon-max");
    window.sessionStorage.removeItem("apl-coupon-savings");
    router.push(service?.href || "/");
  }

  return (
    <div className="rch-discover">
      {offers === null ? <p className="rch-discover-status">Loading offers…</p> : null}
      {offers?.length ? (
        <section className="rch-block" aria-labelledby="recharge-offers">
          <Reveal variant="up">
            <p className="rch-kicker">This travel desk</p>
            <h2 id="recharge-offers">Exclusive Offers &amp; Deals</h2>
          </Reveal>
          <ul className="rch-offer-grid">
            {offers.map((offer, index) => {
              const service = serviceOf(offer.serviceCode);
              const until = expiryLabel(offer.endsAt);
              return (
                <Reveal as="li" key={`${offer.serviceCode}-${offer.code}`} variant="up" delay={index * 120}>
                  <article className="rch-offer">
                    <span className="rch-offer-mark" aria-hidden="true">{service?.label?.slice(0, 1) || "%"}</span>
                    <p className="rch-offer-value">{discountLabel(offer)}</p>
                    <h3>{offer.name}</h3>
                    {offer.description ? <p>{offer.description}</p> : null}
                    <p className="rch-offer-meta">{service?.label || offer.serviceCode}{until ? ` · Until ${until}` : ""}</p>
                    {offer.minAmount ? <p className="rch-offer-meta">Minimum fare {money(offer.minAmount, offer.currency)}.</p> : null}
                    {offer.routeLimited ? <p className="rch-offer-meta">Limited to selected routes.</p> : null}
                    {offer.firstBookingOnly ? <p className="rch-offer-meta">First booking only.</p> : null}
                    <p className="rch-offer-code">{offer.code}</p>
                    <div className="rch-offer-actions">
                      <button type="button" className="rch-offer-copy" onClick={() => copyCode(offer.code)}>
                        {copied === offer.code ? "Copied" : "Copy coupon"}
                      </button>
                      <button type="button" className="rch-offer-go" onClick={() => viewOffer(offer)}>View offer</button>
                    </div>
                    <p className="rch-offer-fine">The coupon is checked again when the booking is priced.</p>
                  </article>
                </Reveal>
              );
            })}
          </ul>
        </section>
      ) : null}

      {holidayOffered && packages === null ? <p className="rch-discover-status">Loading holiday packages…</p> : null}
      {packages?.length ? (
        <section className="rch-block" aria-labelledby="recharge-holidays">
          <Reveal variant="up" className="rch-block-head">
            <div>
              <p className="rch-kicker">Published packages</p>
              <h2 id="recharge-holidays">Trending Holiday Packages</h2>
            </div>
            <Link className="rch-text-link" href="/holidays">View all</Link>
          </Reveal>
          <ul className="rch-pack-grid">
            {packages.map((pkg, index) => {
              const price = money(pkg.startingPrice, pkg.currency);
              const destination = destinationOf(pkg);
              return (
                <Reveal as="li" key={pkg.slug || pkg.title} variant="up" delay={index * 120}>
                  <article className="rch-pack">
                    <Link className="rch-pack-media" href={`/holidays/${pkg.slug}`}>
                      {pkg.coverImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={pkg.coverImage} alt="" loading="lazy" />
                      ) : <span className="rch-pack-fallback" />}
                      {pkg.durationDays ? (
                        <span className="rch-pack-days">{pkg.durationDays} days{pkg.durationNights ? ` · ${pkg.durationNights} nights` : ""}</span>
                      ) : null}
                    </Link>
                    <div className="rch-pack-body">
                      <p className="rch-pack-kicker">{pkg.isInternational ? "International" : "Domestic"}</p>
                      <h3>{pkg.title}</h3>
                      {destination ? <p>{destination}</p> : null}
                    </div>
                    <div className="rch-pack-foot">
                      {price ? <strong>{price}</strong> : <span />}
                      <div>
                        <Link className="rch-pack-primary" href={`/holidays/${pkg.slug}`}>View details</Link>
                        {pkg.enquiryEnabled !== false ? (
                          <Link className="rch-pack-secondary" href={`/holidays/${pkg.slug}/enquire`}>Enquire now</Link>
                        ) : null}
                      </div>
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </ul>
        </section>
      ) : null}

      {stories.length ? (
        <section className="rch-block" aria-labelledby="recharge-stories">
          <Reveal variant="up" className="rch-block-head">
            <div>
              <p className="rch-kicker">Testimonials</p>
              <h2 id="recharge-stories">What Our Customers Say</h2>
            </div>
            <Link className="rch-text-link" href="/testimonials">View all</Link>
          </Reveal>
          <ul className="rch-story-grid">
            {stories.map((item, index) => {
              const stars = Number.isInteger(Number(item.rating)) ? Number(item.rating) : 0;
              return (
                <Reveal as="li" key={`${item.customerName}-${index}`} variant="up" delay={index * 120}>
                  <blockquote className="rch-story">
                    <span className="rch-story-quote" aria-hidden="true">“</span>
                    {stars >= 1 && stars <= 5 ? (
                      <div className="rch-story-stars" aria-label={`${stars} out of 5 stars`}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span key={star} className={star <= stars ? "is-on" : ""}>★</span>
                        ))}
                      </div>
                    ) : null}
                    <p>{item.message}</p>
                    <footer>
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.imageUrl} alt="" />
                      ) : (
                        <span className="rch-story-initials" aria-hidden="true">{initials(item.customerName)}</span>
                      )}
                      <strong>{item.customerName}</strong>
                    </footer>
                  </blockquote>
                </Reveal>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
