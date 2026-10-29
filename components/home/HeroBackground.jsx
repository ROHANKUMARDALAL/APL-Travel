"use client";

import { useEffect, useRef, useState } from "react";
import { wrapSlide } from "@/lib/heroSlides.mjs";

const INTERVAL_MS = 3000;
const SWIPE_PX = 48;

export default function HeroBackground({ slides = [] }) {
  const list = slides.length ? slides : [{ src: "/images/hero-tropical.jpg", label: "Tropical beach" }];
  const [index, setIndex] = useState(0);
  const rootRef = useRef(null);
  const hoverRef = useRef(false);
  const slidesRef = useRef(list);
  const count = list.length;

  useEffect(() => {
    slidesRef.current = list;
  });

  useEffect(() => {
    if (slidesRef.current.length < 2) return undefined;
    const next = slidesRef.current[wrapSlide(index, 1, slidesRef.current.length)];
    if (!next) return undefined;
    const image = new Image();
    image.src = next.src;
    return undefined;
  }, [index]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const length = slidesRef.current.length;
      if (length < 2 || hoverRef.current || document.hidden) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      setIndex((current) => wrapSlide(current, 1, length));
    }, INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const section = rootRef.current?.closest(".home-hero");
    if (!section) return undefined;
    const enter = () => {
      hoverRef.current = true;
    };
    const leave = () => {
      hoverRef.current = false;
    };
    let startX = 0;
    const touchStart = (event) => {
      startX = event.changedTouches[0]?.clientX || 0;
    };
    const touchEnd = (event) => {
      const endX = event.changedTouches[0]?.clientX || 0;
      const delta = endX - startX;
      if (Math.abs(delta) < SWIPE_PX) return;
      setIndex((current) => wrapSlide(current, delta < 0 ? 1 : -1, slidesRef.current.length));
    };
    section.addEventListener("mouseenter", enter);
    section.addEventListener("mouseleave", leave);
    section.addEventListener("touchstart", touchStart, { passive: true });
    section.addEventListener("touchend", touchEnd, { passive: true });
    return () => {
      section.removeEventListener("mouseenter", enter);
      section.removeEventListener("mouseleave", leave);
      section.removeEventListener("touchstart", touchStart);
      section.removeEventListener("touchend", touchEnd);
    };
  }, []);

  return (
    <div ref={rootRef} className="home-hero-slides" aria-roledescription="carousel" aria-label="Travel destinations">
      {list.map((slide, slideIndex) => (
        <img
          key={slide.src}
          className={`home-hero-image ${slide.src.endsWith("hero-tropical.jpg") ? "is-beach" : ""} ${slideIndex === index % count ? "is-active" : ""}`}
          src={slide.src}
          alt={slide.label}
          fetchPriority={slideIndex === 0 ? "high" : "low"}
          loading={slideIndex === 0 ? "eager" : "lazy"}
          decoding="async"
        />
      ))}
      {count > 1 ? (
      <div className="home-hero-controls">
        <button type="button" className="home-hero-arrow is-prev" aria-label="Previous destination" onClick={() => setIndex((current) => wrapSlide(current, -1, count))}>
          ‹
        </button>
        <div className="home-hero-dots" role="tablist" aria-label="Hero images">
          {list.map((slide, slideIndex) => (
            <button
              key={slide.src}
              type="button"
              role="tab"
              aria-label={slide.label}
              aria-selected={slideIndex === index % count}
              className={slideIndex === index % count ? "is-active" : ""}
              onClick={() => setIndex(slideIndex)}
            />
          ))}
        </div>
        <button type="button" className="home-hero-arrow is-next" aria-label="Next destination" onClick={() => setIndex((current) => wrapSlide(current, 1, count))}>
          ›
        </button>
      </div>
      ) : null}
    </div>
  );
}
