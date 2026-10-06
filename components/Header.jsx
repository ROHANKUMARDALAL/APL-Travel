"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ServiceIcon from "@/components/ServiceIcon";
import { normalizeService } from "@/lib/searchQuery";
import { useAuth } from "@/components/auth/useAuth";
import AuthModal from "@/components/auth/AuthModal";
import CurrencyMenu from "@/components/header/CurrencyMenu";
import { useSite } from "@/components/site/SiteProvider";

/**
 * Global site header — shared across homepage, results, details, checkout, account.
 * variant="portal" keeps the light surface (non-hero pages / checkout / account).
 */
export default function Header({
  activeService,
  onServiceChange,
  showServiceTabs = true,
  variant = "auto",
  secureLabel = null,
}) {
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isHome = pathname === "/";
  const { ready, authenticated, user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const forceLight = variant === "portal";
  const pinned = !forceLight && scrolled;
  const { branding, services } = useSite();
  const brandName = branding.websiteName || "APL Travel";

  useEffect(() => {
    if (forceLight) return undefined;

    function onScroll() {
      setScrolled(window.scrollY > 24);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [forceLight]);

  function selectService(serviceId) {
    const next = normalizeService(serviceId);

    if (typeof onServiceChange === "function") {
      onServiceChange(next);
    } else {
      router.push(`/?service=${next}`);
      return;
    }

    if (isHome) {
      const search = document.getElementById("search");
      if (search && scrolled) {
        search.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }

  const serviceActive = (serviceId) => {
    if (activeService) return serviceId === activeService;
    if (pathname.startsWith("/flights") && serviceId === "flight") return true;
    if (pathname.startsWith("/hotels") && serviceId === "hotel") return true;
    if (pathname.startsWith("/buses") && serviceId === "bus") return true;
    return false;
  };

  return (
    <header
      className={`site-header ${pinned ? "site-header-pinned" : ""} ${
        forceLight ? "site-header-portal site-header-scrolled" : ""
      }`}
    >
      <div className="container-page site-header-inner">
        <Link href="/" className="brand-mark inline-flex items-center gap-2">
          {branding.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={branding.logoUrl}
              alt={brandName}
              className="h-8 w-auto max-w-[140px] object-contain"
            />
          ) : null}
          <span>{brandName}</span>
        </Link>

        {showServiceTabs ? (
          <nav className="header-services" aria-label="Travel services">
            {services.map((service) => {
              const isActive = serviceActive(service.id);
              return (
                <button
                  key={service.id}
                  type="button"
                  aria-pressed={isActive}
                  className={`header-service-tab ${isActive ? "header-service-tab-active" : ""}`}
                  onClick={() => selectService(service.id)}
                >
                  <ServiceIcon name={service.icon} className="h-4 w-4" />
                  {service.label}
                </button>
              );
            })}
          </nav>
        ) : (
          <div className="header-services" />
        )}

        <div className="header-actions">
          {secureLabel ? <p className="header-secure-label">{secureLabel}</p> : null}
          <CurrencyMenu />
          {ready && authenticated ? (
            <Link className="header-profile" href="/account" aria-label="View profile">
              <span className="header-avatar" aria-hidden="true">
                {user?.initials}
              </span>
            </Link>
          ) : (
            <button type="button" className="header-signin" onClick={() => setAuthOpen(true)}>
              Sign in
            </button>
          )}
          <Link className="header-bookings" href="/my-trips">
            My bookings
          </Link>
        </div>
      </div>
      {authOpen ? <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} /> : null}
    </header>
  );
}
