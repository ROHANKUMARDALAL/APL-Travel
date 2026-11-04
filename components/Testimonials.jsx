"use client";

import { useEffect, useRef, useState } from "react";
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

function usePerView() {
  const [perView, setPerView] = useState(3);
  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 767px)");
    const tablet = window.matchMedia("(max-width: 1023px)");
    function update() {
      setPerView(mobile.matches ? 1 : tablet.matches ? 2 : 3);
    }
    update();
    mobile.addEventListener("change", update);
    tablet.addEventListener("change", update);
    return () => {
      mobile.removeEventListener("change", update);
      tablet.removeEventListener("change", update);
    };
  }, []);
  return perView;
}

function TestimonialCard({ item }) {
  const stars = starCount(item.rating);
  return (
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
  );
}

export function TestimonialCarousel({ items }) {
  const perView = usePerView();
  const count = items.length;
  const canSlide = count > perView;
  const offset = canSlide ? perView : 0;
  const slides = canSlide ? [...items.slice(-perView), ...items, ...items.slice(0, perView)] : items;
  const [index, setIndex] = useState(offset);
  const [animate, setAnimate] = useState(true);
  const pausedRef = useRef(false);
  const reducedRef = useRef(false);
  const trackRef = useRef(null);
  const rootRef = useRef(null);
  const viewportRef = useRef(null);
  const stepRef = useRef(() => {});

  useEffect(() => {
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setIndex(canSlide ? perView : 0);
    setAnimate(!reducedRef.current);
  }, [perView, canSlide]);

  useEffect(() => {
    if (!canSlide || reducedRef.current) return undefined;
    const timer = window.setInterval(() => {
      if (pausedRef.current) return;
      setAnimate(true);
      setIndex((current) => current + 1);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [canSlide, perView]);

  function settle(next) {
    if (!canSlide) return next;
    if (next >= offset + count) return offset;
    if (next < offset) return offset + count - 1;
    return next;
  }

  function onTransitionEnd(event) {
    if (event.target !== trackRef.current || !canSlide) return;
    if (index >= offset + count || index < offset) {
      setAnimate(false);
      setIndex(settle(index));
    }
  }

  function step(delta) {
    if (!canSlide) return;
    pausedRef.current = true;
    window.setTimeout(() => {
      if (!rootRef.current?.matches(":hover") && !rootRef.current?.contains(document.activeElement)) {
        pausedRef.current = false;
      }
    }, 3200);
    if (reducedRef.current) {
      setAnimate(false);
      setIndex((current) => settle(current + delta));
      return;
    }
    setAnimate(true);
    setIndex((current) => current + delta);
  }

  stepRef.current = step;

  function bindViewport(node) {
    if (viewportRef.current && viewportRef.current !== node && viewportRef.current.__off) {
      viewportRef.current.__off();
    }
    viewportRef.current = node;
    if (!node) return;
    let start = null;
    function down(event) {
      if (event.target.closest("button, a")) return;
      start = { x: event.clientX, y: event.clientY };
    }
    function up(event) {
      if (!start) return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      start = null;
      if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return;
      stepRef.current(dx < 0 ? 1 : -1);
    }
    node.addEventListener("pointerdown", down);
    node.addEventListener("pointerup", up);
    node.__off = () => {
      node.removeEventListener("pointerdown", down);
      node.removeEventListener("pointerup", up);
    };
  }

  const active = canSlide ? (index - offset + count) % count : 0;

  return (
    <div
      className="story-carousel"
      ref={rootRef}
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
      onFocusCapture={() => { pausedRef.current = true; }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) pausedRef.current = false;
      }}
    >
      <div
        className="story-viewport"
        ref={bindViewport}
      >
        <div
          ref={trackRef}
          className={`story-track ${animate ? "is-animated" : ""}`}
          style={{ "--per": perView, "--index": index }}
          onTransitionEnd={onTransitionEnd}
        >
          {slides.map((item, slideIndex) => {
            const clone = canSlide && (slideIndex < offset || slideIndex >= offset + count);
            return (
              <div className="story-slide" key={`${item.customerName}-${slideIndex}`} aria-hidden={clone ? "true" : undefined}>
                <TestimonialCard item={item} />
              </div>
            );
          })}
        </div>
      </div>
      <div className="story-controls">
        <button type="button" className="story-arrow" aria-label="Previous testimonials" disabled={!canSlide} onClick={() => step(-1)}>‹</button>
        <div className="story-dots" role="tablist" aria-label="Testimonial pages">
          {items.map((item, dot) => (
            <button
              key={`${item.customerName}-${dot}`}
              type="button"
              className={`story-dot ${dot === active ? "is-on" : ""}`}
              aria-label={`Show testimonial ${dot + 1}`}
              aria-current={dot === active ? "true" : undefined}
              disabled={!canSlide}
              onClick={() => {
                if (!canSlide) return;
                pausedRef.current = true;
                setAnimate(!reducedRef.current);
                setIndex(offset + dot);
              }}
            />
          ))}
        </div>
        <button type="button" className="story-arrow" aria-label="Next testimonials" disabled={!canSlide} onClick={() => step(1)}>›</button>
      </div>
    </div>
  );
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
    : (testimonials || []).filter((item) => item.customerName && item.message);
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
        <TestimonialCarousel items={items} />
      </div>
    </section>
  );
}
