"use client";

import { useLayoutEffect, useRef, useState } from "react";

const VARIANTS = ["up", "left", "zoom", "right", "drift"];

export function revealVariant(index) {
  return VARIANTS[index % VARIANTS.length];
}

export default function Reveal({
  as: Tag = "div",
  variant = "up",
  step = 0,
  delay = 0,
  className = "",
  style,
  children,
  ...rest
}) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShown(true);
        observer.disconnect();
      },
      { threshold: 0.16, rootMargin: "0px 0px -4% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`reveal reveal-${variant} reveal-step-${step % 4} ${
        shown ? "reveal-in" : "reveal-wait"
      } ${className}`.trim()}
      style={{ ...style, animationDelay: delay ? `${delay}ms` : style?.animationDelay }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
