"use client";

import Header from "@/components/Header";

const STEPS = [
  { id: "trip", label: "Trip" },
  { id: "traveller", label: "Traveller" },
  { id: "extras", label: "Extras" },
  { id: "payment", label: "Payment" },
];

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

export function CheckoutProgress({ current = "payment" }) {
  const currentIndex = STEPS.findIndex((step) => step.id === current);
  return (
    <nav className="checkout-progress" aria-label="Checkout progress">
      <ol className="booking-progress-list">
        {STEPS.map((step, index) => {
          const state =
            index < currentIndex ? "done" : index === currentIndex ? "current" : "todo";
          return (
            <li key={step.id} className={`booking-progress-item is-${state}`}>
              <span className="booking-progress-dot" aria-hidden="true">
                {index + 1}
              </span>
              <span className="booking-progress-label">{step.label}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
