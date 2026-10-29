"use client";

import { useLayoutEffect } from "react";

const SELECTOR = [
  ".popular-routes > .reveal",
  ".route-card",
  ".home-trending-head",
  ".home-package-grid > .reveal",
  ".home-journal .container-page > .reveal",
  ".home-post-grid > .reveal",
  ".home-promos .container-page > .reveal",
  ".home-promo-grid > .reveal",
  ".home-story-head",
  ".home-story-grid > .reveal",
  ".home-quick-grid > button",
  ".premium-service-list > li",
].join(", ");

function syncNode(node, observer) {
  const state = node.getAttribute("data-mx");
  if (state === "play" || state === "shown") return;
  const rect = node.getBoundingClientRect();
  const visible = rect.bottom > 24 && rect.top < window.innerHeight * 0.78;
  const aboveTheFold = rect.top < window.innerHeight * 0.28 && rect.bottom > 24;
  if (visible && aboveTheFold) {
    node.setAttribute("data-mx", "shown");
    observer.unobserve(node);
    return;
  }
  if (visible) {
    node.setAttribute("data-mx", "play");
    observer.unobserve(node);
    return;
  }
  node.setAttribute("data-mx", "arm");
  observer.observe(node);
}

export function ModernScrollMotion() {
  useLayoutEffect(() => {
    const root = document.querySelector(".theme-modern-home");
    if (!root) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.setAttribute("data-mx", "play");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -4% 0px" },
    );

    const scan = () => {
      root.querySelectorAll(SELECTOR).forEach((node) => syncNode(node, observer));
    };

    scan();
    const mutations = new MutationObserver(scan);
    mutations.observe(root, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutations.disconnect();
    };
  }, []);

  return null;
}
