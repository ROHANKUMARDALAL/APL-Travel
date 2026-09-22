import { Suspense } from "react";
import CheckoutPageClient from "@/components/checkout/CheckoutPageClient";

export const metadata = {
  title: "Secure checkout | APL Travel",
  description: "Review and pay for your trip (demo payment).",
};

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="site-shell min-h-screen bg-[var(--bg)]" />}>
      <CheckoutPageClient />
    </Suspense>
  );
}
