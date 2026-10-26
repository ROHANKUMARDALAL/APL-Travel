"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ServiceIcon from "@/components/ServiceIcon";
import { useAuth } from "@/components/auth/useAuth";
import AuthModal from "@/components/auth/AuthModal";
import CurrencyMenu from "@/components/header/CurrencyMenu";
import { useSite } from "@/components/site/SiteProvider";

const TILE_LABELS = {
  flight: "Flights",
  hotel: "Hotels",
  bus: "Bus",
  transfer: "Transfer",
  visa: "Visa",
  recharge: "Recharge",
  holiday: "Holidays",
  insurance: "Insurance",
};

export default function Header({
  activeService,
  onServiceChange,
  showServiceTabs = true,
  secureLabel = null,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { ready, authenticated, user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const { branding, services, tenant } = useSite();
  const brandName = branding.websiteName || tenant?.displayName || tenant?.companyName || "";

  function selectService(service) {
    if (typeof onServiceChange === "function") {
      onServiceChange(service.id);
      return;
    }
    if (service.kind === "page" && service.href) {
      router.push(service.href);
      return;
    }
    router.push(`/?service=${service.id}`);
  }

  function serviceActive(service) {
    if (activeService) return service.id === activeService;
    if (service.href && pathname.startsWith(service.href) && service.href !== "/") return true;
    if (pathname.startsWith("/flights") && service.id === "flight") return true;
    if (pathname.startsWith("/hotels") && service.id === "hotel") return true;
    if (pathname.startsWith("/buses") && service.id === "bus") return true;
    if (pathname.startsWith("/transfers") && service.id === "transfer") return true;
    if (pathname.startsWith("/holidays") && service.id === "holiday") return true;
    return false;
  }

  return (
    <header className="site-header premium-header">
      <div className="utility-bar">
        <div className="container-page utility-bar-inner">
          <p>{secureLabel || (brandName ? `Welcome to ${brandName}` : "Welcome")}</p>
          <div className="utility-links">
            <Link href="/support">Support</Link>
            <Link href="/find-booking">Manage Booking</Link>
            <Link href="/account/enquiries">My Enquiries</Link>
            {ready && authenticated ? (
              <Link href="/account">{user?.name || "Account"}</Link>
            ) : (
              <button type="button" onClick={() => setAuthOpen(true)}>Login / Sign up</button>
            )}
          </div>
        </div>
      </div>
      <div className="container-page main-nav">
        <Link href="/" className="main-nav-logo" aria-label={brandName || "Home"}>
          {branding.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={branding.logoUrl} alt={brandName} />
          ) : (
            <span>{brandName}</span>
          )}
        </Link>
        {showServiceTabs ? (
          <nav className="service-tiles" aria-label="Travel services">
            {services.map((service) => {
              const active = serviceActive(service);
              return (
                <button
                  key={service.id}
                  type="button"
                  className={active ? "is-active" : ""}
                  aria-pressed={active}
                  onClick={() => selectService(service)}
                >
                  <ServiceIcon name={service.icon} className="h-4 w-4" />
                  <span>{TILE_LABELS[service.id] || service.label}</span>
                </button>
              );
            })}
          </nav>
        ) : <span />}
        <div className="main-nav-actions">
          <CurrencyMenu />
          {ready && authenticated ? (
            <Link className="account-orb" href="/account" aria-label="Account">
              {user?.initials || "A"}
            </Link>
          ) : (
            <button type="button" className="account-orb" aria-label="Login or sign up" onClick={() => setAuthOpen(true)}>
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8" />
                <path d="M5 19.2c1.4-3 3.8-4.4 7-4.4s5.6 1.4 7 4.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
      </div>
      {authOpen ? <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} /> : null}
    </header>
  );
}
