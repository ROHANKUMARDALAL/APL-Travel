import { Suspense } from "react";
import BookingDetailsPage from "@/components/booking/BookingDetailsPage";

export const metadata = {
  title: "Flight details | APL Travel",
  description: "Review your flight, travellers, and optional extras.",
};

function Fallback() {
  return <div className="site-shell min-h-screen bg-[var(--bg)]" />;
}

export default function FlightDetailsRoute() {
  return (
    <Suspense fallback={<Fallback />}>
      <BookingDetailsPage service="flight" />
    </Suspense>
  );
}
