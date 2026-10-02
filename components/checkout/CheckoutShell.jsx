"use client";

import Header from "@/components/Header";
import BookingProgress from "@/components/booking/BookingProgress";

export function CheckoutShell({ children }) {
  return (
    <div className="site-shell checkout-shell">
      <Header
        variant="portal"
        showServiceTabs
        secureLabel="Secure checkout"
      />
      <main className="flex-1">{children}</main>
    </div>
  );
}

export function CheckoutProgress({ current = "payment", backHref = "" }) {
  return <BookingProgress current={current} backHref={backHref} />;
}
