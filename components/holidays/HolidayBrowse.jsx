"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { apiGet } from "@/lib/api/client";
import { useAuth } from "@/components/auth/useAuth";
import HolidayHomeSearch from "@/components/home/HolidayHomeSearch";

function money(amount, currency) {
  const value = Number(amount || 0);
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: currency || "INR", maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${currency || "INR"} ${value}`;
  }
}

function destinationOf(pkg) {
  return [pkg.destinationCity, pkg.destinationState, pkg.destinationCountry].filter(Boolean).join(", ");
}

function queryFilters() {
  const params = typeof window === "undefined" ? new URLSearchParams() : new URLSearchParams(window.location.search);
  return {
    destination: params.get("destination") || "",
    destinationLabel: params.get("destinationLabel") || params.get("destination") || "",
    from: params.get("from") || "",
    departure: params.get("departure") || params.get("month") || "",
    travelType: params.get("travelType") || "",
    minDays: params.get("minDays") || "",
    maxDays: params.get("maxDays") || "",
    minPrice: params.get("minPrice") || "",
    maxPrice: params.get("maxPrice") || "",
    adults: params.get("adults") || "",
    children: params.get("children") || "",
    rooms: params.get("rooms") || "",
    childAges: params.get("childAges") || "",
  };
}

export function HolidayListPage() {
  const [packages, setPackages] = useState(null);
  const [error, setError] = useState("");
  const [sort, setSort] = useState("price-asc");
  const search = useSearchParams();
  const query = search.toString();
  const [filters, setFilters] = useState(queryFilters);

  useEffect(() => {
    setFilters(queryFilters());
  }, [query]);

  useEffect(() => {
    const params = new URLSearchParams();
    ["destination", "travelType", "minDays", "maxDays", "minPrice", "maxPrice"].forEach((key) => {
      if (filters[key]) params.set(key, filters[key]);
    });
    let ignore = false;
    apiGet(`/holidays?${params.toString()}`)
      .then((data) => {
        if (!ignore) {
          setPackages(data.packages || []);
          setError("");
        }
      })
      .catch((err) => {
        if (!ignore) {
          setPackages([]);
          setError(err.message || "Holidays are not available on this website");
        }
      });
    return () => {
      ignore = true;
    };
  }, [filters]);

  const month = filters.departure.length >= 7 ? filters.departure.slice(0, 7) : "";
  const visible = (packages || []).filter((pkg) => {
    if (!month) return true;
    const dates = pkg.availableTravelDates || [];
    if (!dates.length) return true;
    return dates.some((date) => String(date).startsWith(month));
  }).slice().sort((left, right) => {
    if (sort === "price-desc") return right.startingPrice - left.startingPrice;
    if (sort === "duration") return left.durationDays - right.durationDays;
    return left.startingPrice - right.startingPrice;
  });
  const enquireQuery = new URLSearchParams();
  ["from", "departure", "adults", "children", "rooms", "childAges", "minDays"].forEach((key) => {
    if (filters[key]) enquireQuery.set(key === "minDays" ? "minDays" : key, filters[key]);
  });
  const enquireSuffix = enquireQuery.toString() ? `?${enquireQuery.toString()}` : "";

  return (
    <div className="site-shell min-h-screen bg-[var(--bg)]">
      <Header variant="portal" showServiceTabs />
      <main className="container-page py-8">
        <h1 className="text-3xl font-semibold">Holiday packages</h1>
        <p className="mt-2 max-w-2xl text-[var(--ink-muted)]">
          Published packages for this travel desk. Prices are indicative unless the package says otherwise. An enquiry does not reserve seats or take payment.
        </p>
        <div className="mt-6">
          <HolidayHomeSearch initial={{ ...filters, destination: filters.destinationLabel || filters.destination }} variant="results" />
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[var(--ink-muted)]">
            {packages === null ? "Loading packages…" : `${visible.length} package${visible.length === 1 ? "" : "s"}`}
            {filters.from ? ` from ${filters.from}` : ""}
          </p>
          <label className="text-sm font-semibold">
            Sort
            <select className="ml-2 rounded-lg border px-2 py-1" value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="price-asc">Price, low to high</option>
              <option value="price-desc">Price, high to low</option>
              <option value="duration">Duration</option>
            </select>
          </label>
        </div>
        {error ? <p className="mt-6 text-red-700">{error}</p> : null}
        {packages && !visible.length && !error ? <p className="holiday-empty">No published packages match these filters.</p> : null}
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((pkg) => (
            <article key={pkg.slug} className="holiday-card">
              {pkg.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={pkg.coverImage} alt="" />
              ) : (
                <div className="holiday-card-fallback">{destinationOf(pkg) || "Holiday"}</div>
              )}
              <div className="space-y-2 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
                  {pkg.isInternational ? "International" : "Domestic"}
                </p>
                <h2 className="text-xl font-semibold">{pkg.title}</h2>
                <p>{destinationOf(pkg)}</p>
                <p>{pkg.durationDays} days / {pkg.durationNights} nights</p>
                <p className="font-medium">{pkg.priceLabel}: {money(pkg.startingPrice, pkg.currency)}</p>
                {pkg.inclusions?.length ? <p className="text-sm text-[var(--ink-muted)]">Includes {pkg.inclusions.slice(0, 3).join(" · ")}</p> : null}
                {pkg.highlights?.length ? <p className="text-sm text-[var(--ink-muted)]">{pkg.highlights.slice(0, 3).join(" · ")}</p> : null}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Link className="btn-primary inline-flex" href={`/holidays/${pkg.slug}`}>Package details</Link>
                  {pkg.enquiryEnabled !== false ? (
                    <Link className="btn-ghost inline-flex" href={`/holidays/${pkg.slug}/enquire${enquireSuffix}`}>Enquire now</Link>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export function HolidayDetailPage() {
  const params = useParams();
  const slug = params?.slug;
  const [pkg, setPkg] = useState(null);
  const [error, setError] = useState("");
  const { authenticated } = useAuth();

  useEffect(() => {
    if (!slug) return;
    let ignore = false;
    apiGet(`/holidays/${slug}`)
      .then((data) => {
        if (!ignore) setPkg(data.package);
      })
      .catch((err) => {
        if (!ignore) setError(err.message || "This package is not available");
      });
    return () => {
      ignore = true;
    };
  }, [slug]);

  const enquireHref = `/holidays/${slug}/enquire`;

  return (
    <div className="site-shell min-h-screen bg-[var(--bg)]">
      <Header variant="portal" showServiceTabs />
      <main className="container-page py-8">
        {!pkg && !error ? <p>Loading package…</p> : null}
        {error ? <p className="text-red-700">{error}</p> : null}
        {pkg ? (
          <article className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-6">
            {pkg.coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={pkg.coverImage} alt="" className="h-72 w-full rounded-2xl object-cover" />
            ) : (
              <div className="grid h-72 place-items-center rounded-2xl bg-gradient-to-br from-slate-800 to-teal-700 text-2xl font-semibold text-white">{pkg.destinationCity || "Holiday"}</div>
            )}
            <div className="holiday-hero-copy">
              <p className="text-sm font-semibold uppercase tracking-wide text-[var(--brand-deep)]">{pkg.packageCategory === "GROUP_DEPARTURE" ? "Group departure" : pkg.isInternational ? "International holiday" : "Domestic holiday"}</p>
              <h1 className="text-3xl font-semibold">{pkg.title}</h1>
              <div className="holiday-facts">
                <span>{destinationOf(pkg)}</span>
                <span>{pkg.durationDays} days / {pkg.durationNights} nights</span>
                <span>{money(pkg.startingPrice, pkg.currency)}</span>
              </div>
            </div>
            <p className="holiday-lead">{pkg.fullDescription || pkg.shortDescription}</p>
            {(pkg.highlights || []).length ? (
              <section className="holiday-panel">
                <h2>Highlights</h2>
                <ul className="holiday-chips">{pkg.highlights.map((item) => <li key={item}>{item}</li>)}</ul>
              </section>
            ) : null}
            <section>
              <h2 className="text-xl font-semibold">Itinerary</h2>
              <ol className="holiday-days">
                {(pkg.itinerary || []).map((day) => (
                  <li key={day.dayNumber} className="holiday-day">
                    <h3>Day {day.dayNumber}: {day.title}</h3>
                    <p>{day.description}</p>
                    {day.activities?.length ? <p className="text-sm text-[var(--ink-muted)]">{day.activities.join(" · ")}</p> : null}
                  </li>
                ))}
              </ol>
            </section>
            <div className="grid gap-4 md:grid-cols-2">
              <section className="holiday-panel is-include"><h2>Inclusions</h2><ul>{(pkg.inclusions || []).map((item) => <li key={item}>{item}</li>)}</ul></section>
              <section className="holiday-panel is-exclude"><h2>Exclusions</h2><ul>{(pkg.exclusions || []).map((item) => <li key={item}>{item}</li>)}</ul></section>
            </div>
            {pkg.hotelInformation ? <section><h2 className="font-semibold">Hotel</h2><p>{pkg.hotelInformation}</p></section> : null}
            {pkg.transportationInformation ? <section><h2 className="font-semibold">Transport</h2><p>{pkg.transportationInformation}</p></section> : null}
            {pkg.termsAndConditions ? <section><h2 className="font-semibold">Terms</h2><p>{pkg.termsAndConditions}</p></section> : null}
            {pkg.cancellationPolicy ? <section><h2 className="font-semibold">Cancellation</h2><p>{pkg.cancellationPolicy}</p></section> : null}
            </div>
            <aside className="holiday-summary sticky top-4">
              <h2 className="text-xl font-semibold">{pkg.title}</h2>
              <p className="mt-2 text-sm text-[var(--ink-muted)]">{destinationOf(pkg)}</p>
              <p className="mt-1 text-sm">{pkg.durationDays} days / {pkg.durationNights} nights</p>
              <p className="mt-3 text-2xl font-semibold">{money(pkg.startingPrice, pkg.currency)}</p>
              <p className="text-sm text-[var(--ink-muted)]">{pkg.priceLabel || "Starting price"} · enquiry only</p>
              {pkg.enquiryEnabled ? (
                <Link className="btn-primary mt-4 inline-flex w-full justify-center" href={authenticated ? enquireHref : `/login?next=${encodeURIComponent(enquireHref)}`}>
                  Enquire now
                </Link>
              ) : (
                <p className="mt-4 text-sm">Enquiries are closed for this package.</p>
              )}
            </aside>
          </article>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}

