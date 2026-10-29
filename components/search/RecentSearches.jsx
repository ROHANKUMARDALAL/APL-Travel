"use client";

import { useEffect, useState } from "react";
import { useSite } from "@/components/site/SiteProvider";
import { AUTH_EVENT, getCurrentUser } from "@/lib/auth";
import { useAuth } from "@/components/auth/useAuth";
import {
  RECENT_CHANGE_EVENT,
  describeRecentSearch,
  loadRecentSearches,
  recentToFormValues,
  removeRecentSearch,
} from "@/lib/recentSearches";

function scopeFor(tenantCode, customerId) {
  return {
    tenantCode: tenantCode || "",
    customerId: customerId ? String(customerId) : "",
    host: typeof window === "undefined" ? "" : window.location.host,
  };
}

function RouteIcon({ service }) {
  if (service === "transfer") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 15h16M6 15l1.2-4.2A2 2 0 0 1 9.1 9h5.8a2 2 0 0 1 1.9 1.8L18 15" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <circle cx="7.5" cy="16.5" r="1.4" fill="currentColor" />
        <circle cx="16.5" cy="16.5" r="1.4" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 12h14M13 7l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function RecentSearches({ service, onRestore }) {
  const { tenant } = useSite();
  const { ready, user } = useAuth();
  const [items, setItems] = useState([]);
  const customerId = user?.id || "";
  const tenantCode = tenant?.code || "";

  useEffect(() => {
    if (!ready) return undefined;
    const scope = scopeFor(tenantCode, customerId || getCurrentUser()?.id || "");
    function refresh() {
      setItems(loadRecentSearches(window.localStorage, service, scope, new Date()));
    }
    refresh();
    window.addEventListener(RECENT_CHANGE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener(AUTH_EVENT, refresh);
    const timer = service === "transfer" ? window.setInterval(refresh, 30000) : 0;
    return () => {
      window.removeEventListener(RECENT_CHANGE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener(AUTH_EVENT, refresh);
      if (timer) window.clearInterval(timer);
    };
  }, [ready, service, tenantCode, customerId]);

  if (!items.length) return null;

  function remove(id) {
    const scope = scopeFor(tenantCode, customerId);
    setItems(removeRecentSearch(window.localStorage, service, scope, id, new Date()));
  }

  return (
    <section className="recent-searches" aria-label={service === "transfer" ? "Recent cab searches" : "Recent flight searches"}>
      <p>Recent searches</p>
      <div className="recent-searches-row">
        {items.map((entry) => {
          const card = describeRecentSearch(service, entry);
          return (
            <article className="recent-search-chip" key={entry.id}>
              <button
                type="button"
                className="recent-search-main"
                onClick={() => onRestore?.(recentToFormValues(service, entry))}
              >
                <span className={`recent-search-icon is-${service}`}>
                  <RouteIcon service={service} />
                </span>
                <span className="recent-search-copy">
                  <strong>{card.title}</strong>
                  <small>{card.detail}</small>
                </span>
              </button>
              <button
                type="button"
                className="recent-search-remove"
                aria-label={`Remove ${card.title}`}
                onClick={() => remove(entry.id)}
              >
                <span aria-hidden="true">×</span>
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
