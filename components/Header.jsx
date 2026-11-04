"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ServiceIcon from "@/components/ServiceIcon";
import { useAuth } from "@/components/auth/useAuth";
import AuthModal from "@/components/auth/AuthModal";
import CurrencyMenu from "@/components/header/CurrencyMenu";
import { useSite } from "@/components/site/SiteProvider";
import { logout } from "@/lib/auth";

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef(null);
  const { branding, services, tenant } = useSite();
  const brandName = branding.websiteName || tenant?.displayName || tenant?.companyName || "";

  useEffect(() => {
    setMenuOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    function close(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
    }
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  function signOut() {
    logout();
    setMenuOpen(false);
    router.push("/");
  }

  function selectService(service) {
    if (service.id === "recharge" && service.href) {
      router.push(service.href);
      return;
    }
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

  const accountLinks = [
    { href: "/account", label: "My Profile" },
    { href: "/my-trips", label: "My Bookings" },
    { href: "/find-booking", label: "Manage Booking" },
    { href: "/account/wallet", label: "My Wallet" },
    { href: "/account/transactions", label: "My Transactions" },
    { href: "/account/enquiries", label: "My Enquiries" },
    { href: "/account/contact", label: "Contact Support" },
  ];

  return (
    <header className="site-header premium-header">
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
          {secureLabel ? <span className="secure-chip">{secureLabel}</span> : null}
          <CurrencyMenu />
          <div className="account-menu" ref={menuRef}>
            <button
              type="button"
              className="account-orb"
              aria-label={ready && authenticated ? "Account menu" : "Login or sign up"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {ready && authenticated ? user?.initials || "A" : (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                  <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M5 19.2c1.4-3 3.8-4.4 7-4.4s5.6 1.4 7 4.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              )}
            </button>
            {menuOpen ? (
              <div className="account-dropdown" role="menu">
                {ready && authenticated ? (
                  <>
                    <p className="account-dropdown-name">{user?.name || "Account"}</p>
                    {accountLinks.map((item) => (
                      <Link key={item.href} href={item.href} role="menuitem" onClick={() => setMenuOpen(false)}>{item.label}</Link>
                    ))}
                    <button type="button" role="menuitem" onClick={signOut}>Logout</button>
                  </>
                ) : (
                  <>
                    <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); setAuthOpen(true); }}>Login / Sign Up</button>
                    <Link href="/find-booking" role="menuitem">Manage Booking</Link>
                    <Link href="/support" role="menuitem">Support</Link>
                  </>
                )}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            className="nav-menu-toggle"
            aria-label="Open menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
      {mobileOpen ? (
        <div className="mobile-nav">
          <nav aria-label="Travel services">
            {services.map((service) => (
              <button key={service.id} type="button" className={serviceActive(service) ? "is-active" : ""} onClick={() => { selectService(service); setMobileOpen(false); }}>
                {TILE_LABELS[service.id] || service.label}
              </button>
            ))}
          </nav>
          <div className="mobile-nav-account">
            {ready && authenticated ? accountLinks.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>{item.label}</Link>
            )) : (
              <>
                <button type="button" onClick={() => { setMobileOpen(false); setAuthOpen(true); }}>Login / Sign Up</button>
                <Link href="/find-booking">Manage Booking</Link>
                <Link href="/support">Support</Link>
              </>
            )}
            {ready && authenticated ? <button type="button" onClick={signOut}>Logout</button> : null}
          </div>
        </div>
      ) : null}
      {authOpen ? <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} /> : null}
    </header>
  );
}
