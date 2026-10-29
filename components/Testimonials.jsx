"use client";

import Link from "next/link";
import Reveal from "@/components/motion/Reveal";
import { useSite } from "@/components/site/SiteProvider";

function initials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "C";
}

function starCount(value) {
  const rating = Number(value);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return 0;
  return rating;
}

export function TestimonialCards({ items }) {
  return (
    <ul className="home-story-grid">
      {items.map((item, index) => {
        const stars = starCount(item.rating);
        return (
          <Reveal as="li" key={`${item.customerName}-${index}`} delay={index * 100}>
            <blockquote className="home-story">
              <span className="home-story-quote" aria-hidden="true">“</span>
              {stars ? (
                <div className="home-story-stars" aria-label={`${stars} out of 5 stars`}>
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
                  <span className="home-story-initials" aria-hidden="true">{initials(item.customerName)}</span>
                )}
                <strong>{item.customerName}</strong>
              </footer>
            </blockquote>
          </Reveal>
        );
      })}
    </ul>
  );
}

export default function Testimonials() {
  const { testimonials, source } = useSite();
  const items = source === "legacy"
    ? []
    : (testimonials || []).filter((item) => item.customerName && item.message).slice(0, 6);
  if (!items.length) return null;

  return (
    <section id="stories" className="home-stories" aria-labelledby="customer-stories">
      <div className="container-page">
        <Reveal className="home-story-head">
          <div>
            <p className="section-eyebrow">Testimonials</p>
            <h2 id="customer-stories" className="section-title">What Our Customers Say</h2>
          </div>
          <Link className="home-view-all" href="/testimonials">View All Testimonials</Link>
        </Reveal>
        <TestimonialCards items={items} />
      </div>
    </section>
  );
}
