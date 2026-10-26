"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import ServiceSearch from "@/components/ServiceSearch";
import TravelHero from "@/components/home/TravelHero";
import TrendingDestinations from "@/components/home/TrendingDestinations";
import Testimonials from "@/components/Testimonials";
import HomeFromCms from "@/components/HomeFromCms";
import { PopularFlightRoutes } from "@/components/PopularFlightRoutes";
import Footer from "@/components/Footer";
import {
  parseBusSearchParams,
  parseFlightSearchParams,
  parseHotelSearchParams,
} from "@/lib/searchQuery";
import { useSite } from "@/components/site/SiteProvider";

function offeredService(value, offeredIds) {
  const id = String(value || "").toLowerCase();
  const normalized = id === "holidays" ? "holiday" : id === "flights" ? "flight" : id === "hotels" ? "hotel" : id === "buses" ? "bus" : id;
  if (offeredIds.includes(normalized)) return normalized;
  return offeredIds[0] || "flight";
}

export default function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { services } = useSite();
  const offeredIds = services.map((s) => s.id);
  const serviceFromUrl = offeredService(searchParams.get("service"), offeredIds);
  const [activeService, setActiveService] = useState(serviceFromUrl);

  useEffect(() => {
    setActiveService(offeredService(searchParams.get("service"), offeredIds));
  }, [serviceFromUrl, offeredIds.join("|")]);

  const onServiceChange = useCallback(
    (serviceId) => {
      const next = offeredService(serviceId, offeredIds);
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

      <TravelHero />

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
      <TrendingDestinations enabled={services.some((service) => service.id === "holiday")} />
      <PopularFlightRoutes enabled={services.some((service) => service.id === "flight")} service="flight" />
      <HomeFromCms activeService={activeService} />
      <Testimonials />
      <Footer />
    </div>
  );
}
