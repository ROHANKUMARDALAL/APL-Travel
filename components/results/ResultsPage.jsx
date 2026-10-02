"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SiteChrome from "@/components/layout/SiteChrome";
import BookingProgress from "@/components/booking/BookingProgress";
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
  getPriceParts,
  nightsBetween,
  sortBuses,
  sortFlights,
  sortHotels,
  TIME_BUCKETS,
} from "@/lib/resultsHelpers";
import { searchFlights, searchHotels } from "@/lib/api/search";
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
      minPrice: null,
    };
  }
  if (service === "hotel") {
    return {
      minPrice: null,
      maxPrice: null,
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
      trip: parsed.tripType,
      from: parsed.from,
      to: parsed.to,
      depart: searchParams.get("depart") || "",
      return: parsed.tripType === "return" ? searchParams.get("return") || "" : "",
      adults: String(parsed.adults),
      children: String(parsed.children),
      infants: String(parsed.infants),
      fareType: parsed.fareType,
      originCityCode: parsed.originCityCode,
      destinationCityCode: parsed.destinationCityCode,
      legs: parsed.tripType === "multi" ? searchParams.get("legs") || "" : "",
    };
  }
  if (service === "hotel") {
    const parsed = parseHotelSearchParams(searchParams);
    return {
      service: "hotel",
      destination: parsed.destination,
      cityCode: parsed.cityCode,
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
        tripType: parsed.tripType,
        from: parsed.from,
        to: parsed.to,
        departDate: parsed.departDate,
        returnDate: parsed.returnDate,
        legs: parsed.legs,
        travellers: {
          adults: parsed.adults,
          children: parsed.children,
          infants: parsed.infants,
        },
        fareType: parsed.fareType,
        originCityCode: parsed.originCityCode,
        destinationCityCode: parsed.destinationCityCode,
      };
    }
    if (service === "hotel") {
      const parsed = parseHotelSearchParams(searchParams);
      return {
        destination: parsed.destination,
        checkInDate: parsed.checkInDate,
        checkOutDate: parsed.checkOutDate,
        occupancy: { guests: parsed.guests, rooms: parsed.rooms },
        cityCode: parsed.cityCode,
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

  const [rawItems, setRawItems] = useState([]);
  const [retryToken, setRetryToken] = useState(0);
  const [loadError, setLoadError] = useState("");

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
    let cancelled = false;
    setStatus("loading");
    setLoadError("");
    setFilters(defaultFilters(service));
    setSort("recommended");

    async function load() {
      try {
        if (searchParams.get("simulate") === "error") {
          throw new Error("Search could not be completed");
        }
        let items = [];
        if (service === "flight") {
          const parsed = parseFlightSearchParams(searchParams);
          if (!parsed.originCityCode || !parsed.destinationCityCode) {
            throw new Error("Choose departure and arrival cities from the suggestions.");
          }
          items = await searchFlights({
            tripType: parsed.tripType,
            originCityCode: parsed.originCityCode,
            destinationCityCode: parsed.destinationCityCode,
            depart: searchParams.get("depart"),
            return: parsed.tripType === "return" ? searchParams.get("return") : "",
            legs: parsed.legs,
            adults: parsed.adults,
            children: parsed.children,
            infants: parsed.infants,
          });
        } else if (service === "hotel") {
          const parsed = parseHotelSearchParams(searchParams);
          if (!parsed.cityCode) {
            throw new Error("Choose a destination city from the suggestions.");
          }
          items = await searchHotels({
            cityCode: parsed.cityCode,
            checkIn: searchParams.get("checkIn"),
            checkOut: searchParams.get("checkOut"),
            rooms: parsed.rooms,
            adults: parsed.guests,
          });
        } else {
          items = MOCK_BUSES;
        }
        if (!cancelled) {
          setRawItems(items);
          setStatus("ready");
        }
      } catch (error) {
        if (!cancelled) {
          setRawItems([]);
          setLoadError(error.message || "Search failed");
          setStatus("error");
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [service, searchParams, retryToken]);

  const meta = useMemo(() => {
    const totals = rawItems
      .map((item) => {
        const parts = getPriceParts(item, marketId);
        return parts.total;
      })
      .filter((value) => Number.isFinite(value));
    const priceMin = totals.length ? Math.min(...totals) : 0;
    const priceMax = totals.length ? Math.max(...totals) : 0;

    if (service === "flight") {
      const durations = rawItems.map((item) => item.durationMinutes).filter((n) => Number.isFinite(n));
      return {
        currency: displayCurrency,
        priceMin,
        priceMax,
        durationMin: durations.length ? Math.min(...durations) : 0,
        durationMax: durations.length ? Math.max(...durations) : 0,
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
      const legIndexes = [...new Set(rawItems.map((item) => item.legIndex).filter((value) => value != null))];
      if (legIndexes.length) {
        list = legIndexes.flatMap((legIndex) => {
          const group = rawItems.filter((item) => item.legIndex === legIndex);
          return sortFlights(filterFlights(group, filters, marketId), sort, marketId);
        });
      } else {
        list = sortFlights(filterFlights(rawItems, filters, marketId), sort, marketId);
      }
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
    if (!modifyPayload || modifyPayload.error) return;
    router.push(buildResultsHref(service, modifyPayload));
    setModifyOpen(false);
  }

  function retryLoad() {
    setRetryToken((value) => value + 1);
  }

  return (
    <SiteChrome activeService={service}>
      <div className="results-page">
        <div className="container-page results-page-inner">
          <BookingProgress current="results" backHref={homeHref} />
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
                  message={loadError || "We couldn’t load results right now. Please try again."}
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
                  {visibleItems.map((item, index) => {
                    const detailsHref = buildDetailsHref(service, item.id, searchQuery);
                    if (service === "flight") {
                      const showLeg =
                        item.legLabel &&
                        (index === 0 || visibleItems[index - 1]?.legIndex !== item.legIndex);
                      return (
                        <div key={item.id} className="flight-result-block">
                          {showLeg ? <h3 className="flight-leg-section">{item.legLabel}</h3> : null}
                          <FlightResultCard item={item} detailsHref={detailsHref} />
                        </div>
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
