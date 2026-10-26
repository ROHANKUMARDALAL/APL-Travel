"use client";

import Link from "next/link";
import { useSite } from "@/components/site/SiteProvider";

function initials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "C";
}

export function TestimonialCards({ items }) {
  return (
    <ul className="home-story-grid">
      {items.map((item, index) => (
        <li key={`${item.customerName}-${index}`} className="home-rise" style={{ animationDelay: `${index * 70}ms` }}>
          <blockquote className="home-story">
            <span className="home-story-quote" aria-hidden="true">“</span>
            <div className="home-story-stars" aria-label={`${item.rating || 5} out of 5 stars`}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span key={star} className={star <= (item.rating || 5) ? "is-on" : ""}>★</span>
              ))}
            </div>
            <p>{item.message}</p>
            <footer>
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageUrl} alt="" />
              ) : (
                <span className="home-story-initials" aria-hidden="true">{initials(item.customerName)}</span>
              )}
              <strong>{item.customerName}</strong>
            </footer>
          </blockquote>
        </li>
      ))}
    </ul>
  );
}

export default function Testimonials() {
  const { testimonials, source } = useSite();
  const items = source === "legacy" ? [] : (testimonials || []).slice(0, 3);
  if (!items.length) return null;

  return (
    <section id="stories" className="home-stories border-t border-[var(--line)] bg-white" aria-labelledby="customer-stories">
      <div className="container-page">
        <div className="home-story-head home-rise">
          <div>
            <p className="section-eyebrow">Testimonials</p>
            <h2 id="customer-stories" className="section-title">What Our Customers Say</h2>
          </div>
          <Link className="home-view-all" href="/testimonials">View All Testimonials</Link>
        </div>
        <TestimonialCards items={items} />
      </div>
    </section>
  );
}
