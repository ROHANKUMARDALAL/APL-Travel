"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FOOTER, NAV_LINKS, SERVICES } from "@/data/static";
import ServiceIcon from "@/components/ServiceIcon";
import { normalizeService } from "@/lib/searchQuery";
import { useAuth } from "@/components/auth/useAuth";
import { logout } from "@/lib/auth";
import {
  getActiveCurrencyCode,
  getLanguage,
} from "@/data/markets";

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
  const forceLight = variant === "portal";
  const light = forceLight || scrolled;
  const localeHint = `${String(getLanguage() || "en").toUpperCase()} · ${getActiveCurrencyCode()}`;

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

  function handleLogout() {
    logout();
    router.push("/");
  }

  const serviceActive = (serviceId) => {
    if (isHome) return serviceId === activeService;
    if (pathname.startsWith("/flights") && serviceId === "flight") return true;
    if (pathname.startsWith("/hotels") && serviceId === "hotel") return true;
    if (pathname.startsWith("/buses") && serviceId === "bus") return true;
    return false;
  };

  return (
    <header
      className={`site-header ${light ? "site-header-scrolled" : ""} ${
        forceLight ? "site-header-portal" : ""
      }`}
    >
      <div className="container-page site-header-inner">
        <Link href="/" className="brand-mark">
          {FOOTER.brand}
        </Link>

        {showServiceTabs ? (
          <nav className="header-services" aria-label="Travel services">
            {SERVICES.map((service) => {
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
          {secureLabel ? (
            <p className="header-secure-label">{secureLabel}</p>
          ) : null}
          <span
            className="header-locale-hint"
            title="Language and currency selectors coming soon"
          >
            {localeHint}
          </span>
          <Link
            className="header-util-link hidden md:inline-flex"
            href={NAV_LINKS.findBooking.href}
          >
            {NAV_LINKS.findBooking.label}
          </Link>
          <Link
            className="header-util-link hidden md:inline-flex"
            href={NAV_LINKS.myTrips.href}
          >
            {NAV_LINKS.myTrips.label}
          </Link>
          <Link
            className="header-util-link hidden md:inline-flex"
            href={NAV_LINKS.support.href}
          >
            {NAV_LINKS.support.label}
          </Link>
          {ready && authenticated ? (
            <Link
              className="header-util-link hidden sm:inline-flex header-account-link"
              href="/account"
            >
              <span className="header-avatar" aria-hidden="true">
                {user?.initials}
              </span>
              {user?.name?.split(" ")[0] || "Account"}
            </Link>
          ) : (
            <Link
              className="header-util-link hidden sm:inline-flex"
              href={NAV_LINKS.signIn.href}
            >
              {NAV_LINKS.signIn.label}
            </Link>
          )}
          {!secureLabel ? (
            <Link
              className="btn-secondary hidden lg:inline-flex"
              href={isHome ? "#search" : "/#search"}
            >
              {NAV_LINKS.planTrip.label}
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
