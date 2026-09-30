"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AccountShell from "@/components/account/AccountShell";
import { useAuth } from "@/components/auth/useAuth";
import { findResultById } from "@/lib/booking";
import {
  getBookingDateLabel,
  getBookingHeadline,
  loadAccountBookings,
} from "@/lib/userBookings";
import { formatShortDate } from "@/lib/resultsHelpers";
import { getActiveMarketId, listCurrencies } from "@/data/markets";
import { getWalletSummary } from "@/lib/wallet";
import { getReferralProfile } from "@/lib/referral";
export default function ProfileClient() {
  const { user } = useAuth();
  const marketId = getActiveMarketId();
  const currencyCode = user?.currency || "INR";
  const [upcoming, setUpcoming] = useState(null);

  useEffect(() => {
    let ignore = false;
    loadAccountBookings()
      .then((rows) => {
        if (!ignore) setUpcoming(rows.find((row) => row.tripPhase === "upcoming") || null);
      })
      .catch(() => {
        if (!ignore) setUpcoming(null);
      });
    return () => {
      ignore = true;
    };
  }, [user?.id]);
  const upcomingItem = upcoming
    ? findResultById(upcoming.service, upcoming.id)
    : null;
  const wallet = getWalletSummary(marketId);
  const referral = getReferralProfile({ marketId });

  return (
    <AccountShell title="Your travel hub">
      <section className="checkout-section account-panel account-welcome">
        <p className="section-eyebrow">Welcome back</p>
        <h2 className="checkout-booking-title">
          {user?.name ? `Hello, ${user.name.split(" ")[0]}` : "Hello"}
        </h2>
        <p className="section-copy">
          Manage trips, wallet credits, and referrals from one calm place.
        </p>
      </section>

      <div className="account-overview-grid">
        <section className="checkout-section account-panel">
          <h3 className="checkout-section-title">Next trip</h3>
          {upcoming ? (
            <>
              <p className="result-card-kicker">{upcoming.service}</p>
              <p className="hotel-card-name">
                {getBookingHeadline(upcoming, upcomingItem)}
              </p>
              <p className="result-card-meta">
                {upcoming.reference} ·{" "}
                {getBookingDateLabel(upcoming, marketId, formatShortDate)}
              </p>
              <div className="account-inline-actions">
                <Link
                  className="btn-primary"
                  href={`/my-trips/${upcoming.reference}`}
                >
                  View trip
                </Link>
                <Link className="btn-ghost" href="/my-trips">
                  All trips
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="section-copy">No upcoming trips yet.</p>
              <div className="account-inline-actions">
                <Link className="btn-primary" href="/#search">
                  Plan a trip
                </Link>
                <Link className="btn-ghost" href="/my-trips">
                  My Trips
                </Link>
              </div>
            </>
          )}
        </section>

        <section className="checkout-section account-panel">
          <h3 className="checkout-section-title">Travel Wallet</h3>
          <p className="wallet-stat-value">{wallet.availableLabel}</p>
          <p className="result-card-meta">Available balance</p>
          <Link className="btn-ghost" href="/account/wallet">
            View wallet
          </Link>
        </section>

        <section className="checkout-section account-panel">
          <h3 className="checkout-section-title">Referrals</h3>
          <p className="wallet-stat-value">{referral.code}</p>
          <p className="result-card-meta">
            {referral.successful} successful · {referral.earnedRewardsLabel} earned
          </p>
          <Link className="btn-ghost" href="/account/referral">
            Share your code
          </Link>
        </section>

        <section className="checkout-section account-panel">
          <h3 className="checkout-section-title">Need help?</h3>
          <p className="section-copy">
            Find answers or contact us about a booking.
          </p>
          <div className="account-inline-actions">
            <Link className="btn-primary" href="/support">
              Support Center
            </Link>
            <Link className="btn-ghost" href="/support#booking-help">
              Booking help
            </Link>
          </div>
        </section>
      </div>

      <section className="checkout-section account-panel">
        <div className="account-profile-head">
          <div className="account-avatar is-lg" aria-hidden="true">
            {user?.initials}
          </div>
          <div>
            <h2 className="checkout-section-title">Profile</h2>
            <p className="result-card-meta">{user?.email}</p>
          </div>
        </div>

        <dl className="checkout-fact-list">
          <div>
            <dt>Name</dt>
            <dd>{user?.name}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{user?.email}</dd>
          </div>
          <div>
            <dt>Phone</dt>
            <dd>{user?.phone || "—"}</dd>
          </div>
          <div>
            <dt>Currency</dt>
            <dd>
              <p className="profile-currency-fixed">
                {listCurrencies().find((currency) => currency.code === (user?.currency || currencyCode))?.flag}{" "}
                {user?.currency || currencyCode} ·{" "}
                {listCurrencies().find((currency) => currency.code === (user?.currency || currencyCode))?.label}
              </p>
              <p className="dev-note">
                Chosen when you signed up. Your profile, searches, and payment stay in this currency.
              </p>
            </dd>
          </div>
          <div>
            <dt>Account type</dt>
            <dd>Customer</dd>
          </div>
        </dl>
      </section>
    </AccountShell>
  );
}
