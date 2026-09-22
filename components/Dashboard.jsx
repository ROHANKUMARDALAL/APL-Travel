"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import ServiceSearch from "@/components/ServiceSearch";
import ServiceOffers from "@/components/ServiceOffers";
import Testimonials from "@/components/Testimonials";
import Footer from "@/components/Footer";
import { FOOTER } from "@/data/static";
import {
  normalizeService,
  parseBusSearchParams,
  parseFlightSearchParams,
  parseHotelSearchParams,
} from "@/lib/searchQuery";

export default function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceFromUrl = normalizeService(searchParams.get("service"));
  const [activeService, setActiveService] = useState(serviceFromUrl);

  useEffect(() => {
    setActiveService(serviceFromUrl);
  }, [serviceFromUrl]);

  const onServiceChange = useCallback(
    (serviceId) => {
      const next = normalizeService(serviceId);
      setActiveService(next);
      const params = new URLSearchParams(searchParams.toString());
      params.set("service", next);
      router.replace(`/?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const searchInitialValues = (() => {
    if (activeService === "flight" && searchParams.get("from")) {
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
            {FOOTER.brand}
          </p>
          <h1 className="fade-up font-display mt-4 max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Book flights, hotels, and buses in one calm place.
          </h1>
          <p className="fade-up-delay-1 mt-5 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
            A fast global travel platform with beautiful search, curated deals, and zero
            extra API noise while you explore.
          </p>
        </div>
      </section>

      <ServiceSearch
        activeService={activeService}
        onServiceChange={onServiceChange}
        initialValues={searchInitialValues}
      />
      <ServiceOffers activeService={activeService} />
      <Testimonials />
      <Footer />
    </div>
  );
}
