"use client";

import { useEffect, useRef } from "react";

const NATIVE = "input, textarea, select, option, [contenteditable='true'], [contenteditable=''], :disabled, [aria-disabled='true'], [draggable='true']";
const HOT = "a, button, [role='tab'], [role='button'], [role='radio'], [role='option'], summary, .holiday-card, .testimonial-card, .home-hero-arrow, .flight-result-block, .home-destination-grid a, .ssr-seat, .seat-btn";

function place(element, x, y) {
  element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
}

export default function PremiumCursor() {
  const rootRef = useRef(null);
  const ringRef = useRef(null);
  const dotRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    const ring = ringRef.current;
    const dot = dotRef.current;
    if (!root || !ring || !dot) return undefined;

    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let enabled = false;
    let visible = false;
    let primed = false;
    let x = 0;
    let y = 0;
    let ringX = 0;
    let ringY = 0;
    let frame = 0;

    function tick() {
      ringX += (x - ringX) * 0.18;
      ringY += (y - ringY) * 0.18;
      place(ring, ringX, ringY);
      if (Math.abs(x - ringX) > 0.4 || Math.abs(y - ringY) > 0.4) {
        frame = window.requestAnimationFrame(tick);
      } else {
        frame = 0;
      }
    }

    function show() {
      if (visible) return;
      visible = true;
      root.classList.add("is-on");
    }

    function hide() {
      visible = false;
      root.classList.remove("is-on");
    }

    function onMove(event) {
      if (!enabled) return;
      x = event.clientX;
      y = event.clientY;
      if (!primed) {
        primed = true;
        ringX = x;
        ringY = y;
        place(ring, ringX, ringY);
      }
      place(dot, x, y);
      show();
      if (!frame) frame = window.requestAnimationFrame(tick);
    }

    function onOver(event) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest(NATIVE)) {
        root.classList.add("is-native");
        root.classList.remove("is-hot");
        return;
      }
      root.classList.remove("is-native");
      const hot = target.closest(HOT);
      const blocked = hot && (hot.matches(":disabled") || hot.getAttribute("aria-disabled") === "true");
      root.classList.toggle("is-hot", Boolean(hot) && !blocked);
    }

    function onDown() {
      if (!enabled || root.classList.contains("is-native")) return;
      root.classList.add("is-down");
    }

    function onUp() {
      root.classList.remove("is-down");
    }

    function stopFrame() {
      if (!frame) return;
      window.cancelAnimationFrame(frame);
      frame = 0;
    }

    function applyMode() {
      enabled = fine.matches && !reduce.matches;
      document.documentElement.classList.toggle("has-premium-cursor", enabled);
      if (!enabled) {
        hide();
        primed = false;
        root.classList.remove("is-hot", "is-down", "is-native");
        stopFrame();
      }
    }

    applyMode();
    fine.addEventListener("change", applyMode);
    reduce.addEventListener("change", applyMode);
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseover", onOver);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    document.documentElement.addEventListener("mouseleave", hide);
    window.addEventListener("blur", hide);

    return () => {
      document.documentElement.classList.remove("has-premium-cursor");
      fine.removeEventListener("change", applyMode);
      reduce.removeEventListener("change", applyMode);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      document.documentElement.removeEventListener("mouseleave", hide);
      window.removeEventListener("blur", hide);
      stopFrame();
    };
  }, []);

  return (
    <div className="premium-cursor" ref={rootRef} aria-hidden="true">
      <span className="premium-cursor-ring" ref={ringRef}>
        <span />
      </span>
      <span className="premium-cursor-dot" ref={dotRef} />
    </div>
  );
}
