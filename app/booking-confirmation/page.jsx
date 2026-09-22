import { Suspense } from "react";
import ConfirmationClient from "@/components/confirmation/ConfirmationClient";

export const metadata = {
  title: "Booking confirmed | APL Travel",
  description: "Your booking confirmation and reference.",
};

export default function BookingConfirmationPage() {
  return (
    <Suspense fallback={<div className="site-shell min-h-screen bg-[var(--bg)]" />}>
      <ConfirmationClient />
    </Suspense>
  );
}
