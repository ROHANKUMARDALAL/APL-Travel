import { Suspense } from "react";
import BookingDetailsPage from "@/components/booking/BookingDetailsPage";

export const metadata = {
  title: "Hotel details | APL Travel",
  description: "Review your hotel stay, guests, and optional extras.",
};

function Fallback() {
  return <div className="site-shell min-h-screen bg-[var(--bg)]" />;
}

export default function HotelDetailsRoute() {
  return (
    <Suspense fallback={<Fallback />}>
      <BookingDetailsPage service="hotel" />
    </Suspense>
  );
}
