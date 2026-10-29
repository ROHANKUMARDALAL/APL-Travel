"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ServiceIcon from "@/components/ServiceIcon";
import FlightSearchForm from "@/components/forms/FlightSearchForm";
import HotelSearchForm from "@/components/forms/HotelSearchForm";
import BusSearchForm from "@/components/forms/BusSearchForm";
import TransferSearchForm from "@/components/forms/TransferSearchForm";
import HolidayHomeSearch from "@/components/home/HolidayHomeSearch";
import RecentSearches from "@/components/search/RecentSearches";
import { buildResultsHref } from "@/lib/searchQuery";
import { RECENT_CHANGE_EVENT, saveRecentSearch } from "@/lib/recentSearches";
import { getCurrentUser } from "@/lib/auth";
import { useSite } from "@/components/site/SiteProvider";
import { CAB_TIME_ZONE, isPickupAllowed } from "@/lib/cabPickupLead";

const PILL_LABELS = {
  flight: "Flights",
  hotel: "Hotels",
  bus: "Bus",
  transfer: "Transfer (Cab)",
};

const SEARCH_BUTTON = {
  flight: "Search Flights",
  hotel: "Search Hotels",
  bus: "Search Buses",
  transfer: "Search Cabs",
};

const ENQUIRY_COPY = {
  visa: "Tell us where you are travelling. This is a request for assistance, not a visa approval.",
  recharge: "Send a recharge request to this travel desk. This does not complete a payment.",
  insurance: "Compare mock travel plans. These are not real policies and nothing is purchased here.",
};

const QUICK = ["visa", "recharge", "holiday", "insurance"];
const QUICK_TONE = {
  visa: "#ec4899",
  recharge: "#16a34a",
  holiday: "#f59e0b",
  insurance: "#7c3aed",
};
const QUICK_HINT = {
  visa: "Enquiry",
  recharge: "Request",
  holiday: "Enquiry",
  insurance: "Compare",
};

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="home-search-icon" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6.25" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16 16.5 20 20.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function ServiceSearch({ activeService, onServiceChange, initialValues }) {
  const router = useRouter();
  const searchQueryRef = useRef(null);
  const submitLock = useRef(false);
  const [formError, setFormError] = useState("");
  const [searching, setSearching] = useState(false);
  const [restore, setRestore] = useState(null);
  const { services, tenant } = useSite();
  const active = services.find((service) => service.id === activeService) || services[0];
  const isSearch = active && active.kind !== "page";

  const handleSearchChange = useCallback((query) => {
    searchQueryRef.current = query;
  }, []);

  useEffect(() => {
    submitLock.current = false;
    setSearching(false);
  }, [activeService]);

  function restoreSearch(values) {
    setFormError("");
    setRestore({ service: activeService, values, token: Date.now() });
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (activeService === "transfer" && submitLock.current) return;
    const query = searchQueryRef.current;
    if (activeService === "transfer" && query) {
      if (!isPickupAllowed(query.date, query.time, new Date(), query.timeZone || CAB_TIME_ZONE)) {
        window.dispatchEvent(new Event("apl-cab-clock"));
        return;
      }
    }
    if (query?.error) {
      setFormError(query.error);
      return;
    }
    setFormError("");
    if ((activeService === "flight" || activeService === "transfer") && query && typeof window !== "undefined") {
      const saved = saveRecentSearch(window.localStorage, activeService, {
        tenantCode: tenant?.code || "",
        customerId: getCurrentUser()?.id || "",
        host: window.location.host,
      }, query, new Date());
      if (saved) window.dispatchEvent(new Event(RECENT_CHANGE_EVENT));
    }
    if (activeService === "transfer") {
      submitLock.current = true;
      setSearching(true);
    }
    router.push(buildResultsHref(activeService, query));
  }

  const restored = restore?.service === activeService ? restore : null;
  const formValues = restored?.values || initialValues;
  const formKey = `${activeService}-${restored ? restored.token : initialValues ? "prefill" : "default"}`;
  const cabSearch = activeService === "transfer";
  const quick = services.filter((service) => QUICK.includes(service.id));

  return (
    <section id="search" className="home-search-wrap">
      <div className="container-page">
        <div className="home-search-panel">
          <div className="home-service-pills" role="tablist" aria-label="Travel services">
            {services.map((service) => {
              const selected = service.id === active?.id;
              return (
                <button
                  key={service.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  className={selected ? "is-active" : ""}
                  onClick={() => onServiceChange(service.id)}
                >
                  <ServiceIcon name={service.icon} className="h-4 w-4" />
                  {PILL_LABELS[service.id] || service.label}
                </button>
              );
            })}
          </div>

          {isSearch ? (
            <form onSubmit={handleSubmit} className={activeService === "flight" ? "home-flight-stack" : "home-other-search"}>
              {activeService === "flight" ? (
                <FlightSearchForm key={formKey} heading="" initialValues={formValues} onSearchChange={handleSearchChange} />
              ) : null}
              {activeService === "hotel" ? (
                <HotelSearchForm key={formKey} initialValues={formValues} onSearchChange={handleSearchChange} />
              ) : null}
              {activeService === "bus" ? (
                <BusSearchForm key={formKey} initialValues={formValues} onSearchChange={handleSearchChange} />
              ) : null}
              {activeService === "transfer" ? (
                <TransferSearchForm
                  key={formKey}
                  initialValues={formValues}
                  onSearchChange={handleSearchChange}
                  submit={(
                    <button
                      type="submit"
                      className="home-search-btn is-cab cab-inline-search"
                      disabled={searching}
                      aria-busy={searching}
                    >
                      {searching ? <span className="home-search-spinner" aria-hidden="true" /> : <SearchIcon />}
                      {searching ? "Searching…" : "Search Cabs"}
                    </button>
                  )}
                />
              ) : null}
              {cabSearch ? null : (
                <div className="home-search-submit">
                  {formError ? <p className="field-error">{formError}</p> : null}
                  <button
                    type="submit"
                    className="home-search-btn"
                    disabled={searching}
                    aria-busy={searching}
                  >
                    {SEARCH_BUTTON[activeService] || "Search"}
                  </button>
                </div>
              )}
              {activeService === "flight" || activeService === "transfer" ? (
                <RecentSearches service={activeService} onRestore={restoreSearch} />
              ) : null}
            </form>
          ) : null}

          {active?.id === "holiday" ? <HolidayHomeSearch /> : null}

          {active && ENQUIRY_COPY[active.id] ? (
            <div className="home-enquiry-panel">
              <h2>{active.label}</h2>
              <p>{ENQUIRY_COPY[active.id]}</p>
              <Link className="home-search-btn" href={active.href || `/${active.id}`}>{`Continue ${active.label}`}</Link>
            </div>
          ) : null}

          {quick.length ? (
            <div className="home-quick-grid">
              {quick.map((service) => (
                <button key={service.id} type="button" onClick={() => onServiceChange(service.id)}>
                  <span className="home-quick-icon" style={{ background: QUICK_TONE[service.id] }}>
                    <ServiceIcon name={service.icon} className="h-4 w-4" />
                  </span>
                  <span>
                    <strong>{service.label}</strong>
                    <small>{QUICK_HINT[service.id]}</small>
                  </span>
                  <span className="home-quick-chevron" aria-hidden="true">›</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
