"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ServiceIcon from "@/components/ServiceIcon";
import FlightSearchForm from "@/components/forms/FlightSearchForm";
import HotelSearchForm from "@/components/forms/HotelSearchForm";
import BusSearchForm from "@/components/forms/BusSearchForm";
import TransferSearchForm from "@/components/forms/TransferSearchForm";
import { buildResultsHref } from "@/lib/searchQuery";
import { useSite } from "@/components/site/SiteProvider";

const SERVICE_TITLES = {
  flight: "Search flights",
  hotel: "Search hotels",
  bus: "Search buses",
  transfer: "Search transfers",
};

export default function ServiceSearch({
  activeService,
  onServiceChange,
  initialValues,
}) {
  const router = useRouter();
  const searchQueryRef = useRef(null);
  const [formError, setFormError] = useState("");
  const { services } = useSite();

  const handleSearchChange = useCallback((query) => {
    searchQueryRef.current = query;
  }, []);

  function handleSubmit(event) {
    event.preventDefault();
    const query = searchQueryRef.current;
    if (query?.error) {
      setFormError(query.error);
      return;
    }
    setFormError("");
    const href = buildResultsHref(activeService, query);
    router.push(href);
  }

  const formKey = `${activeService}-${initialValues ? "prefill" : "default"}`;

  return (
    <section id="search" className="relative z-10 -mt-16 scroll-mt-24 sm:-mt-20">
      <div className="container-page">
        <div className="search-panel-shell fade-up-delay-2">
          <div className="search-panel-glow" aria-hidden="true" />
          <div className="search-panel-glow search-panel-glow-alt" aria-hidden="true" />

          <div className="search-panel">
            <div
              className="mb-4 flex flex-wrap gap-2"
              role="tablist"
              aria-label="Travel services"
            >
              {services.map((service) => {
                const isActive = service.id === activeService;
                return (
                  <button
                    key={service.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={`service-tab ${isActive ? "service-tab-active" : ""}`}
                    onClick={() => onServiceChange(service.id)}
                  >
                    <ServiceIcon name={service.icon} />
                    {service.label}
                  </button>
                );
              })}
            </div>

            {activeService === "flight" ? null : (
              <h2 className="search-service-title">
                {SERVICE_TITLES[activeService]}{" "}
                <span>· {activeService}</span>
              </h2>
            )}

            <form onSubmit={handleSubmit}>
              {activeService === "flight" && (
                <FlightSearchForm
                  key={formKey}
                  heading="Search flights"
                  initialValues={initialValues}
                  onSearchChange={handleSearchChange}
                />
              )}
              {activeService === "hotel" && (
                <HotelSearchForm
                  key={formKey}
                  initialValues={initialValues}
                  onSearchChange={handleSearchChange}
                />
              )}
              {activeService === "bus" && (
                <BusSearchForm
                  key={formKey}
                  initialValues={initialValues}
                  onSearchChange={handleSearchChange}
                />
              )}
              {activeService === "transfer" && (
                <TransferSearchForm
                  key={formKey}
                  initialValues={initialValues}
                  onSearchChange={handleSearchChange}
                />
              )}

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className={`text-sm ${formError ? "field-error" : "text-[var(--ink-muted)]"}`}>
                  {formError || "Results update with your filters and travel dates."}
                </p>
                <button type="submit" className="btn-primary min-w-[160px]">
                  Search {activeService}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
