"use client";

import { useLayoutEffect, useRef, useState } from "react";

const VARIANTS = ["up", "left", "zoom", "right", "drift"];

export function revealVariant(index) {
  return VARIANTS[index % VARIANTS.length];
}

export default function Reveal({ variant = "up", step = 0, className = "", children }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShown(entry.isIntersecting);
      },
      { threshold: 0.22, rootMargin: "0px 0px -6% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal reveal-${variant} reveal-step-${step % 4} ${
        shown ? "reveal-in" : "reveal-wait"
      } ${className}`.trim()}
    >
      {children}
    </div>
  );
}
