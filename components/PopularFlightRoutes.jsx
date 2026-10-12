"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSite } from "@/components/site/SiteProvider";
import {
  buildPopularBusSearch,
  buildPopularFlightSearch,
  buildPopularHotelSearch,
  buildPopularTransferSearch,
} from "@/lib/searchQuery";

const SECTIONS = {
  flight: {
    kicker: "Flights",
    icon: "✈",
    title: "Popular Flight Routes",
    copy: "Discover popular destinations and find your next flight in one click.",
    action: "Explore Flights",
    search: buildPopularFlightSearch,
  },
  hotel: {
    kicker: "Hotels",
    icon: "⌂",
    title: "Popular Hotel Destinations",
    copy: "Open a saved destination and search hotels in one click.",
    action: "Explore Hotels",
    search: buildPopularHotelSearch,
  },
  bus: {
    kicker: "Buses",
    icon: "🚌",
    title: "Popular Bus Routes",
    copy: "Choose a saved bus route and see departures in one click.",
    action: "Explore Buses",
    search: buildPopularBusSearch,
  },
  transfer: {
    kicker: "Transfers",
    icon: "⇄",
    title: "Popular Transfer Routes",
    copy: "Start from a saved pickup and drop-off in one click.",
    action: "Explore Transfers",
    search: buildPopularTransferSearch,
  },
};

const SECTION_ORDER = ["flight", "hotel", "bus", "transfer"];

function brandAccent(color) {
  const value = String(color || "").trim();
  return /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value) ? value : undefined;
}

function deepen(hex) {
  const raw = hex.slice(1);
  const full = raw.length === 3 ? raw.replace(/./g, (char) => char + char) : raw;
  const tone = (channel) => Math.max(0, Math.round(channel * 0.62));
  const red = tone(parseInt(full.slice(0, 2), 16));
  const green = tone(parseInt(full.slice(2, 4), 16));
  const blue = tone(parseInt(full.slice(4, 6), 16));
  return `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

function routeHeading(serviceCode, route) {
  if (serviceCode === "hotel") return route.originName || route.displayTitle || "Hotel destination";
  const origin = route.originName || route.originCode;
  const destination = route.destinationName || route.destinationCode;
  return { origin, destination };
}

export function PopularFlightRoutes({ enabled, service = "flight" }) {
  const router = useRouter();
  const { branding, services } = useSite();
  const [groups, setGroups] = useState([]);
  const [pendingId, setPendingId] = useState("");
  const [brokenImages, setBrokenImages] = useState({});
  const [error, setError] = useState("");
  const accent = brandAccent(branding?.primaryColor);
  const offered = new Set(services.map((service) => service.id));

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    fetch("/api/v1/public/popular-routes", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => {
        if (cancelled) return;
        const next = Array.isArray(payload?.data?.groups) ? payload.data.groups : [];
        setGroups(next);
      })
      .catch(() => {
        if (!cancelled) setGroups([]);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const visible = SECTION_ORDER
    .map((serviceCode) => {
      const section = SECTIONS[serviceCode];
      const group = groups.find((item) => item.serviceCode === serviceCode);
      const routes = Array.isArray(group?.routes) ? group.routes : [];
      return { serviceCode, section, routes };
    })
    .filter((item) => item.serviceCode === service && offered.has(item.serviceCode) && item.routes.length > 0);

  const scrollerRef = useRef(null);
  const pausedRef = useRef(false);
  const dragRef = useRef(null);
  const section = visible[0];
  const loop = Boolean(section && section.routes.length >= 4);

  useEffect(() => {
    const node = scrollerRef.current;
    if (!node || !loop) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    let frame = 0;
    const step = () => {
      if (!pausedRef.current && !dragRef.current) {
        const half = node.scrollWidth / 2;
        if (half > node.clientWidth + 8) {
          node.scrollLeft += 0.7;
          if (node.scrollLeft >= half) node.scrollLeft -= half;
        }
      }
      frame = window.requestAnimationFrame(step);
    };
    frame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frame);
  }, [loop, service, section?.routes.length]);

  if (!enabled || !section) return null;

  function scrollByCard(direction) {
    const node = scrollerRef.current;
    if (!node) return;
    node.scrollBy({ left: direction * 300, behavior: "smooth" });
  }

  function openRoute(serviceCode, route) {
    if (pendingId) return;
    const built = SECTIONS[serviceCode].search(route);
    if (built.error) {
      setError(built.error);
      return;
    }
    setError("");
    setPendingId(route.id);
    router.push(built.href);
  }

  const cards = loop ? [...section.routes, ...section.routes] : section.routes;

  return (
    <section
      className="popular-routes container-page"
      style={accent ? { "--route-accent": accent, "--route-deep": deepen(accent) } : undefined}
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
      onFocus={() => { pausedRef.current = true; }}
      onBlur={() => { pausedRef.current = false; }}
    >
      <p className="popular-routes-kicker">
        <span aria-hidden="true">{section.section.icon}</span>
        {section.section.kicker}
      </p>
      <h2 className="popular-routes-title">{section.section.title}</h2>
      <p className="popular-routes-copy">{section.section.copy}</p>
      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      <div
        ref={scrollerRef}
        className={loop ? "popular-routes-carousel" : "popular-routes-grid"}
        onPointerDown={(event) => {
          if (!loop) return;
          dragRef.current = { x: event.clientX, left: event.currentTarget.scrollLeft };
        }}
        onPointerMove={(event) => {
          if (!dragRef.current) return;
          event.currentTarget.scrollLeft = dragRef.current.left - (event.clientX - dragRef.current.x);
        }}
        onPointerUp={() => { dragRef.current = null; }}
        onPointerLeave={() => { dragRef.current = null; }}
      >
        {cards.map((route, index) => {
          const pending = pendingId === route.id;
          const heading = routeHeading(section.serviceCode, route);
          const title = typeof heading === "string" ? heading : `${heading.origin} → ${heading.destination}`;
          const showImage = Boolean(route.imageUrl) && !brokenImages[route.id];
          const duplicate = loop && index >= section.routes.length;
          return (
            <button
              key={`${route.id}-${index}`}
              type="button"
              className="route-card"
              disabled={Boolean(pendingId)}
              aria-hidden={duplicate || undefined}
              tabIndex={duplicate ? -1 : undefined}
              aria-busy={pending}
              onClick={() => openRoute(section.serviceCode, route)}
            >
              <span className="route-card-media">
                {showImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={route.imageUrl}
                    alt=""
                    className="route-card-image"
                    onError={() => setBrokenImages((current) => ({ ...current, [route.id]: true }))}
                  />
                ) : (
                  <span className="route-card-fallback">
                    <span>{section.serviceCode === "hotel" ? route.originName : title}</span>
                    <span className="route-card-fallback-mark" aria-hidden="true">{section.section.icon}</span>
                  </span>
                )}
                <span className="route-card-shade" />
                {pending ? <span className="route-card-busy" aria-hidden="true" /> : null}
              </span>
              <span className="route-card-body">
                <span className="route-card-title">{route.displayTitle || title}</span>
                {section.serviceCode === "flight" ? (
                  <span className="route-card-codes">
                    <span>{route.originCode}</span>
                    <span className="route-card-line" />
                    <span className="route-card-plane" aria-hidden="true">✈</span>
                    <span className="route-card-line" />
                    <span>{route.destinationCode}</span>
                  </span>
                ) : (
                  <span className="route-card-codes">
                    <span>{section.serviceCode === "hotel" ? "Destination" : section.section.kicker}</span>
                    <span className="route-card-line" />
                    <span className="route-card-plane" aria-hidden="true">{section.section.icon}</span>
                  </span>
                )}
                {section.serviceCode === "flight" && route.airlineName ? (
                  <span className="route-card-airline">{route.airlineName}</span>
                ) : null}
                {section.serviceCode === "transfer" ? (
                  <span className="route-card-airline">{route.pickupKind || "Pickup"} → {route.dropoffKind || "Drop-off"}</span>
                ) : null}
                <span className="route-card-action">
                  {pending ? `Searching ${title}` : section.section.action}
                  <span className="route-card-arrow" aria-hidden="true">→</span>
                </span>
              </span>
            </button>
          );
        })}
      </div>
      {loop ? (
        <div className="popular-routes-nav">
          <button type="button" className="rounded-md border border-[var(--line)] bg-white px-3 py-1 text-sm" onClick={() => scrollByCard(-1)}>Previous</button>
          <button type="button" className="rounded-md border border-[var(--line)] bg-white px-3 py-1 text-sm" onClick={() => scrollByCard(1)}>Next</button>
        </div>
      ) : null}
    </section>
  );
}
