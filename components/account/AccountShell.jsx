"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import AuthGuard from "@/components/auth/AuthGuard";
import { useAuth } from "@/components/auth/useAuth";
import { logout } from "@/lib/auth";
import Header from "@/components/Header";

const NAV_ITEMS = [
  { id: "profile", label: "Profile", href: "/account" },
  { id: "trips", label: "My Bookings", href: "/my-trips" },
  { id: "wallet", label: "My Wallet", href: "/account/wallet" },
  { id: "transactions", label: "All Transactions", href: "/account/transactions" },
  { id: "referral", label: "Referral Code", href: "/account/referral" },
  { id: "travellers", label: "My traveller list", href: "/account/travellers" },
  { id: "support", label: "Support", href: "/support" },
  { id: "contact", label: "Contact Us", href: "/account/contact", icon: "mail" },
  { id: "review", label: "Add Review", href: "/account/add-review", icon: "star" },
];

function NavIcon({ name }) {
  if (name === "mail") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="account-nav-icon">
        <path d="M4 7h16v10H4z" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <path d="M4 8l8 6 8-6" fill="none" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    );
  }
  if (name === "star") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="account-nav-icon">
        <path d="M12 4l2.2 4.6 5 .7-3.6 3.5.9 5.1L12 15.8 7.5 18l.9-5.1L4.8 9.3l5-.7z" fill="currentColor" />
      </svg>
    );
  }
  return null;
}

function isNavActive(pathname, href) {
  if (href === "/account") return pathname === "/account";
  if (href === "/my-trips") {
    return pathname === "/my-trips" || pathname.startsWith("/my-trips/");
  }
  if (href === "/support") {
    return pathname === "/support" || pathname.startsWith("/support/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function UserAvatar({ user }) {
  return (
    <div className="account-avatar" aria-hidden="true">
      {user?.initials || "?"}
    </div>
  );
}

function AccountNav({ user, pathname, onNavigate, onLogout }) {
  return (
    <div className="account-nav-panel">
      <div className="account-user-card">
        <UserAvatar user={user} />
        <div className="account-user-meta">
          <p className="account-user-name">{user?.name}</p>
          <p className="account-user-email">{user?.email}</p>
        </div>
      </div>

      <nav className="account-nav" aria-label="Account">
        {NAV_ITEMS.map((item) => {
          const active = isNavActive(pathname, item.href);
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`account-nav-link ${active ? "is-active" : ""}`}
              onClick={onNavigate}
            >
              <NavIcon name={item.icon} />
              {item.label}
            </Link>
          );
        })}
        <button
          type="button"
          className="account-nav-link account-nav-logout"
          onClick={onLogout}
        >
          Logout
        </button>
      </nav>
    </div>
  );
}

export default function AccountShell({ children, title }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <AuthGuard>
      <div className="site-shell account-shell">
        <Header variant="portal" showServiceTabs />

        <div className="container-page account-mobile-bar">
          <button
            type="button"
            className="account-menu-btn"
            aria-expanded={drawerOpen}
            aria-controls="account-drawer"
            onClick={() => setDrawerOpen((open) => !open)}
          >
            Account menu
          </button>
          <Link className="header-util-link account-topbar-link" href="/find-booking">
            Find booking
          </Link>
        </div>

        {drawerOpen ? (
          <button
            type="button"
            className="account-drawer-backdrop"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
          />
        ) : null}

        <div className="container-page account-layout">
          <aside
            id="account-drawer"
            className={`account-sidebar ${drawerOpen ? "is-open" : ""}`}
          >
            <AccountNav
              user={user}
              pathname={pathname}
              onNavigate={() => setDrawerOpen(false)}
              onLogout={handleLogout}
            />
          </aside>

          <div className="account-content">
            {title ? <h1 className="section-title account-page-title">{title}</h1> : null}
            {children}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
