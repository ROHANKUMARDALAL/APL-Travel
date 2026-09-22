import { Suspense } from "react";
import BookingDetailsPage from "@/components/booking/BookingDetailsPage";

export const metadata = {
  title: "Bus details | APL Travel",
  description: "Review your bus trip, passenger details, and seat selection.",
};

function Fallback() {
  return <div className="site-shell min-h-screen bg-[var(--bg)]" />;
}

export default function BusDetailsRoute() {
  return (
    <Suspense fallback={<Fallback />}>
      <BookingDetailsPage service="bus" />
    </Suspense>
  );
}
