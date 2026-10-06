"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import ServiceSearch from "@/components/ServiceSearch";
import ServiceOffers from "@/components/ServiceOffers";
import BrandStrip from "@/components/BrandStrip";
import TravelNotes from "@/components/TravelNotes";
import Testimonials from "@/components/Testimonials";
import HomeFaqs from "@/components/HomeFaqs";
import Footer from "@/components/Footer";
import { AIRLINE_BRANDS, PARTNER_BRANDS } from "@/data/static";
import {
  normalizeService,
  parseBusSearchParams,
  parseFlightSearchParams,
  parseHotelSearchParams,
} from "@/lib/searchQuery";
import { useSite } from "@/components/site/SiteProvider";

export default function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { branding, services, banners } = useSite();
  const offeredIds = services.map((s) => s.id);
  const serviceFromUrl = normalizeService(searchParams.get("service"));
  const initialService = offeredIds.includes(serviceFromUrl)
    ? serviceFromUrl
    : offeredIds[0] || "flight";
  const [activeService, setActiveService] = useState(initialService);
  const heroBanner = banners.find((b) => b.placement === "HOME_HERO");

  useEffect(() => {
    const next = offeredIds.includes(serviceFromUrl)
      ? serviceFromUrl
      : offeredIds[0] || serviceFromUrl;
    setActiveService(next);
  }, [serviceFromUrl, offeredIds.join("|")]);

  const onServiceChange = useCallback(
    (serviceId) => {
      const next = normalizeService(serviceId);
      if (offeredIds.length && !offeredIds.includes(next)) return;
      setActiveService(next);
      const params = new URLSearchParams(searchParams.toString());
      params.set("service", next);
      router.replace(`/?${params.toString()}`, { scroll: false });
    },
    [router, searchParams, offeredIds.join("|")],
  );

  const searchInitialValues = (() => {
    if (activeService === "flight" && searchParams.get("from")) {
      const parsed = parseFlightSearchParams(searchParams);
      return {
        tripType: parsed.tripType,
        from: parsed.from,
        to: parsed.to,
        originCityCode: parsed.originCityCode,
        destinationCityCode: parsed.destinationCityCode,
        departDate: parsed.departDate,
        returnDate: parsed.returnDate,
        legs: parsed.legs,
        travellers: {
          adults: parsed.adults,
          children: parsed.children,
          infants: parsed.infants,
        },
        fareType: parsed.fareType,
      };
    }
    if (activeService === "hotel" && searchParams.get("destination")) {
      const parsed = parseHotelSearchParams(searchParams);
      return {
        destination: parsed.destination,
        checkInDate: parsed.checkInDate,
        checkOutDate: parsed.checkOutDate,
        occupancy: { guests: parsed.guests, rooms: parsed.rooms },
      };
    }
    if (activeService === "bus" && searchParams.get("from") && !searchParams.get("depart")) {
      const parsed = parseBusSearchParams(searchParams);
      return {
        from: parsed.from,
        to: parsed.to,
        travelDate: parsed.travelDate,
      };
    }
    return null;
  })();

  return (
    <div className="site-shell">
      <Header
        activeService={activeService}
        onServiceChange={onServiceChange}
      />

      <section className="relative overflow-hidden bg-[linear-gradient(145deg,var(--hero-from),var(--hero-via)_45%,var(--hero-to))] pb-28 pt-10 sm:pb-32 sm:pt-14">
        <div
          className="hero-glow pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-[var(--brand-bright)]/30 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-[var(--accent)]/20 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="hero-dots pointer-events-none absolute inset-0 opacity-[0.12]"
          aria-hidden="true"
        />

        <div className="container-page relative z-10">
          <p className="fade-up text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand-bright)]">
            {branding.websiteName || "APL Travel"}
          </p>
          <h1 className="fade-up font-display mt-4 max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
            {heroBanner?.title || "Book flights, hotels, buses, and transfers in one calm place."}
          </h1>
          <p className="fade-up-delay-1 mt-5 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
            {branding.tagline ||
              "A fast global travel platform with beautiful search, curated deals, and a clear booking experience."}
          </p>
          {heroBanner?.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={heroBanner.imageUrl}
              alt={heroBanner.title || "Featured"}
              className="fade-up-delay-2 mt-8 max-h-48 w-full max-w-3xl rounded-xl object-cover opacity-95"
            />
          ) : null}
        </div>
      </section>

      {services.length ? (
        <ServiceSearch
          activeService={activeService}
          onServiceChange={onServiceChange}
          initialValues={searchInitialValues}
        />
      ) : (
        <section className="container-page relative z-10 -mt-10 pb-10">
          <div className="rounded-xl border border-[var(--line)] bg-white p-6 text-sm text-[var(--ink-muted)] shadow-sm">
            No travel services are currently offered on this website.
          </div>
        </section>
      )}
      {activeService === "flight" && offeredIds.includes("flight") ? (
        <BrandStrip
          eyebrow="Airlines"
          title="Carriers you can fly with"
          items={AIRLINE_BRANDS}
        />
      ) : null}
      <ServiceOffers activeService={activeService} />
      <TravelNotes />
      <BrandStrip
        eyebrow="Partners"
        title="Teams behind the journey"
        items={PARTNER_BRANDS}
        variant="cards"
      />
      <Testimonials />
      <HomeFaqs />
      <Footer />
    </div>
  );
}
