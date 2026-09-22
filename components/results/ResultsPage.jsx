"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SiteChrome from "@/components/layout/SiteChrome";
import SearchSummary from "@/components/results/SearchSummary";
import FilterPanel from "@/components/results/FilterPanel";
import SortBar from "@/components/results/SortBar";
import FlightResultCard from "@/components/results/FlightResultCard";
import HotelResultCard from "@/components/results/HotelResultCard";
import BusResultCard from "@/components/results/BusResultCard";
import {
  ResultsEmpty,
  ResultsError,
  ResultsLoading,
} from "@/components/results/ResultsStates";
import FlightSearchForm from "@/components/forms/FlightSearchForm";
import HotelSearchForm from "@/components/forms/HotelSearchForm";
import BusSearchForm from "@/components/forms/BusSearchForm";
import { MOCK_FLIGHTS } from "@/data/mock/flights";
import { MOCK_HOTELS } from "@/data/mock/hotels";
import { MOCK_BUSES } from "@/data/mock/buses";
import { formatMoney, getActiveMarketId, getActiveCurrencyCode } from "@/data/markets";
import {
  buildBusSummary,
  buildDetailsHref,
  buildFlightSummary,
  buildHomeSearchHref,
  buildHotelSummary,
  filterBuses,
  filterFlights,
  filterHotels,
  formatDuration,
  nightsBetween,
  sortBuses,
  sortFlights,
  sortHotels,
  TIME_BUCKETS,
} from "@/lib/resultsHelpers";
import {
  buildResultsHref,
  parseBusSearchParams,
  parseFlightSearchParams,
  parseHotelSearchParams,
} from "@/lib/searchQuery";

const SORT_OPTIONS = {
  flight: [
    { id: "recommended", label: "Recommended" },
    { id: "cheapest", label: "Cheapest" },
    { id: "fastest", label: "Fastest" },
    { id: "departure", label: "Departure time" },
  ],
  hotel: [
    { id: "recommended", label: "Recommended" },
    { id: "price", label: "Price" },
    { id: "rating", label: "Guest rating" },
    { id: "distance", label: "Distance" },
  ],
  bus: [
    { id: "recommended", label: "Recommended" },
    { id: "cheapest", label: "Cheapest" },
    { id: "fastest", label: "Fastest" },
    { id: "departure", label: "Departure time" },
  ],
};

function defaultFilters(service) {
  if (service === "flight") {
    return {
      stops: [],
      airlines: [],
      departBuckets: [],
      arriveBuckets: [],
      maxPrice: null,
      maxDuration: null,
    };
  }
  if (service === "hotel") {
    return {
      maxPrice: null,
      minRating: 7,
      stars: [],
      propertyTypes: [],
      amenities: [],
      locations: [],
    };
  }
  return {
    maxPrice: null,
    departBuckets: [],
    arriveBuckets: [],
    operators: [],
    busTypes: [],
  };
}

function queryObjectFromParams(service, searchParams) {
  if (service === "flight") {
    const parsed = parseFlightSearchParams(searchParams);
    return {
      service: "flight",
      from: parsed.from,
      to: parsed.to,
      depart: searchParams.get("depart") || "",
      return: searchParams.get("return") || "",
      adults: String(parsed.adults),
      children: String(parsed.children),
      infants: String(parsed.infants),
      fareType: parsed.fareType,
    };
  }
  if (service === "hotel") {
    const parsed = parseHotelSearchParams(searchParams);
    return {
      service: "hotel",
      destination: parsed.destination,
      checkIn: searchParams.get("checkIn") || "",
      checkOut: searchParams.get("checkOut") || "",
      guests: String(parsed.guests),
      rooms: String(parsed.rooms),
    };
  }
  const parsed = parseBusSearchParams(searchParams);
  return {
    service: "bus",
    from: parsed.from,
    to: parsed.to,
    date: searchParams.get("date") || "",
  };
}

export default function ResultsPage({ service }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const marketId = getActiveMarketId();
  const displayCurrency = getActiveCurrencyCode(marketId);

  const searchQuery = useMemo(
    () => queryObjectFromParams(service, searchParams),
    [service, searchParams],
  );

  const formInitialValues = useMemo(() => {
    if (service === "flight") {
      const parsed = parseFlightSearchParams(searchParams);
      return {
        from: parsed.from,
        to: parsed.to,
        departDate: parsed.departDate,
        returnDate: parsed.returnDate,
        travellers: {
          adults: parsed.adults,
          children: parsed.children,
          infants: parsed.infants,
        },
        fareType: parsed.fareType,
      };
    }
    if (service === "hotel") {
      const parsed = parseHotelSearchParams(searchParams);
      return {
        destination: parsed.destination,
        checkInDate: parsed.checkInDate,
        checkOutDate: parsed.checkOutDate,
        occupancy: { guests: parsed.guests, rooms: parsed.rooms },
      };
    }
    const parsed = parseBusSearchParams(searchParams);
    return {
      from: parsed.from,
      to: parsed.to,
      travelDate: parsed.travelDate,
    };
  }, [service, searchParams]);

  const summary = useMemo(() => {
    if (service === "flight") return buildFlightSummary(searchQuery, marketId);
    if (service === "hotel") return buildHotelSummary(searchQuery, marketId);
    return buildBusSummary(searchQuery, marketId);
  }, [service, searchQuery, marketId]);

  const rawItems = useMemo(() => {
    if (service === "flight") return MOCK_FLIGHTS;
    if (service === "hotel") return MOCK_HOTELS;
    return MOCK_BUSES;
  }, [service]);

  const [status, setStatus] = useState("loading");
  const [sort, setSort] = useState("recommended");
  const [filters, setFilters] = useState(() => defaultFilters(service));
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [modifyOpen, setModifyOpen] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  const [modifyPayload, setModifyPayload] = useState(null);

  const handleModifyChange = useCallback((query) => {
    setModifyPayload(query);
  }, []);

  useEffect(() => {
    setStatus("loading");
    setFilters(defaultFilters(service));
    setSort("recommended");
    const timer = setTimeout(() => {
      if (searchParams.get("simulate") === "error") {
        setStatus("error");
        return;
      }
      setStatus("ready");
    }, 550);
    return () => clearTimeout(timer);
  }, [service, searchParams]);

  const meta = useMemo(() => {
    const totals = rawItems.map(
      (item) =>
        item.prices?.[displayCurrency]?.total ??
        item.prices?.USD?.total ??
        item.prices?.GBP?.total ??
        0,
    );
    const priceMin = Math.min(...totals);
    const priceMax = Math.max(...totals);

    if (service === "flight") {
      const durations = rawItems.map((item) => item.durationMinutes);
      return {
        currency: displayCurrency,
        priceMin,
        priceMax,
        durationMin: Math.min(...durations),
        durationMax: Math.max(...durations),
        airlines: [...new Set(rawItems.map((item) => item.airline))],
        departBuckets: TIME_BUCKETS.filter((b) =>
          rawItems.some((item) => item.departBucket === b.id),
        ),
        arriveBuckets: TIME_BUCKETS.filter((b) =>
          rawItems.some((item) => item.arriveBucket === b.id),
        ),
        formatPrice: (n) => formatMoney(n, marketId),
        formatDuration,
      };
    }

    if (service === "hotel") {
      return {
        currency: displayCurrency,
        priceMin,
        priceMax,
        propertyTypes: [...new Set(rawItems.map((item) => item.propertyType))],
        amenities: [...new Set(rawItems.flatMap((item) => item.amenities))].slice(
          0,
          8,
        ),
        locations: [...new Set(rawItems.map((item) => item.location))],
        formatPrice: (n) => formatMoney(n, marketId),
      };
    }

    return {
      currency: displayCurrency,
      priceMin,
      priceMax,
      operators: [...new Set(rawItems.map((item) => item.operator))],
      busTypes: [...new Set(rawItems.map((item) => item.busType))],
      departBuckets: TIME_BUCKETS.filter((b) =>
        rawItems.some((item) => item.departBucket === b.id),
      ),
      arriveBuckets: TIME_BUCKETS.filter((b) =>
        rawItems.some((item) => item.arriveBucket === b.id),
      ),
      formatPrice: (n) => formatMoney(n, marketId),
    };
  }, [rawItems, displayCurrency, marketId, service]);

  const visibleItems = useMemo(() => {
    let list = rawItems;
    if (service === "flight") {
      list = filterFlights(list, filters, marketId);
      list = sortFlights(list, sort, marketId);
    } else if (service === "hotel") {
      list = filterHotels(list, filters, marketId);
      list = sortHotels(list, sort, marketId);
    } else {
      list = filterBuses(list, filters, marketId);
      list = sortBuses(list, sort, marketId);
    }
    return list;
  }, [rawItems, filters, sort, service, marketId]);

  const nights = nightsBetween(searchQuery.checkIn, searchQuery.checkOut);
  const homeHref = buildHomeSearchHref(service, searchQuery);

  function clearFilters() {
    setFilters(defaultFilters(service));
  }

  function handleModifySubmit(event) {
    event.preventDefault();
    if (!modifyPayload) return;
    router.push(buildResultsHref(service, modifyPayload));
    setModifyOpen(false);
  }

  function retryLoad() {
    setStatus("loading");
    setTimeout(() => setStatus("ready"), 400);
  }

  return (
    <SiteChrome activeService={service}>
      <div className="results-page">
        <div className="container-page results-page-inner">
          <SearchSummary
            title={summary.title}
            primary={summary.primary}
            secondary={summary.secondary}
            modifyOpen={modifyOpen}
            onModify={() => setModifyOpen((open) => !open)}
          />

          {modifyOpen ? (
            <div className="modify-search-panel">
              <form onSubmit={handleModifySubmit}>
                {service === "flight" ? (
                  <FlightSearchForm
                    key={`flight-${searchParams.toString()}`}
                    initialValues={formInitialValues}
                    onSearchChange={handleModifyChange}
                  />
                ) : null}
                {service === "hotel" ? (
                  <HotelSearchForm
                    key={`hotel-${searchParams.toString()}`}
                    initialValues={formInitialValues}
                    onSearchChange={handleModifyChange}
                  />
                ) : null}
                {service === "bus" ? (
                  <BusSearchForm
                    key={`bus-${searchParams.toString()}`}
                    initialValues={formInitialValues}
                    onSearchChange={handleModifyChange}
                  />
                ) : null}
                <div className="modify-search-actions">
                  <button type="submit" className="btn-primary">
                    Update search
                  </button>
                  <a className="btn-ghost" href={homeHref}>
                    Open on homepage
                  </a>
                </div>
              </form>
            </div>
          ) : null}

          <div className="results-layout">
            <FilterPanel
              service={service}
              filters={filters}
              onChange={setFilters}
              onClear={clearFilters}
              meta={meta}
              open={filtersOpen}
              onClose={() => setFiltersOpen(false)}
            />

            <div className="results-main">
              <SortBar
                count={status === "ready" ? visibleItems.length : 0}
                sort={sort}
                options={SORT_OPTIONS[service]}
                onSortChange={setSort}
                onOpenFilters={() => setFiltersOpen(true)}
                extra={
                  service === "hotel" ? (
                    <div className="view-toggle" role="group" aria-label="Map or list">
                      <button
                        type="button"
                        className={viewMode === "list" ? "is-active" : ""}
                        onClick={() => setViewMode("list")}
                      >
                        List
                      </button>
                      <button
                        type="button"
                        className={viewMode === "map" ? "is-active" : ""}
                        onClick={() => setViewMode("map")}
                      >
                        Map
                      </button>
                    </div>
                  ) : null
                }
              />

              {status === "loading" ? <ResultsLoading /> : null}

              {status === "error" ? (
                <ResultsError
                  message="We couldn’t load results right now. Please try again."
                  onRetry={retryLoad}
                />
              ) : null}

              {status === "ready" && visibleItems.length === 0 ? (
                <ResultsEmpty
                  title="No results match your filters"
                  description="Try adjusting dates, clearing filters, or modifying your search."
                  actions={[
                    { label: "Clear filters", onClick: clearFilters, primary: true },
                    { label: "Modify search", onClick: () => setModifyOpen(true) },
                    { label: "Change on homepage", href: homeHref },
                  ]}
                />
              ) : null}

              {status === "ready" && visibleItems.length > 0 ? (
                <div className="results-list">
                  {service === "hotel" && viewMode === "map" ? (
                    <div className="map-placeholder" role="img" aria-label="Map placeholder">
                      Map view is a visual preview — interactive map arrives later.
                    </div>
                  ) : null}
                  {visibleItems.map((item) => {
                    const detailsHref = buildDetailsHref(service, item.id, searchQuery);
                    if (service === "flight") {
                      return (
                        <FlightResultCard
                          key={item.id}
                          item={item}
                          detailsHref={detailsHref}
                        />
                      );
                    }
                    if (service === "hotel") {
                      return (
                        <HotelResultCard
                          key={item.id}
                          item={item}
                          detailsHref={detailsHref}
                          nights={nights || 1}
                        />
                      );
                    }
                    return (
                      <BusResultCard
                        key={item.id}
                        item={item}
                        detailsHref={detailsHref}
                      />
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </SiteChrome>
  );
}
