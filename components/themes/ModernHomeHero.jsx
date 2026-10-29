"use client";

import { useEffect, useState } from "react";

const FALLBACK_SRC = "/images/hero-tropical.jpg";

export function ModernHomeHero({ branding, slides }) {
  const frames = Array.isArray(slides) && slides.length ? slides : [];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (frames.length < 2) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % frames.length);
    }, 5600);
    return () => window.clearInterval(timer);
  }, [frames.length]);

  const active = frames[index] || frames[0];
  const realLabel = active && active.src !== FALLBACK_SRC && active.label && active.label !== "Destination"
    ? active.label
    : "";
  const name = branding?.websiteName || "Travel";
  const description = branding?.tagline || "Compare fares from this travel desk and confirm the price before you pay.";

  return (
    <section className="mx-hero" aria-label="Featured journey">
      <div className="mx-copy">
        <p className="mx-kicker">{name}</p>
        <h1 className="mx-title">
          Find the right <span>flight</span> for the way you travel.
        </h1>
        <p className="mx-lead">{description}</p>
        <ul className="mx-benefits">
          <li>Live fare search</li>
          <li>Price checked before booking</li>
          <li>Support from this travel desk</li>
        </ul>
      </div>
      <div className="mx-visual">
        {active?.src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={active.src + index} src={active.src} alt={realLabel || ""} />
        ) : null}
        <div className="mx-float mx-float-brand">
          <span>Travel desk</span>
          <strong>{name}</strong>
        </div>
        {realLabel ? (
          <div className="mx-float mx-float-place">
            <span>Featured</span>
            <strong>{realLabel}</strong>
          </div>
        ) : null}
      </div>
    </section>
  );
}
