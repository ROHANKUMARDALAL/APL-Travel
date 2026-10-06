import { Suspense } from "react";
import BookingDetailsPage from "@/components/booking/BookingDetailsPage";

export const metadata = {
  title: "Transfer details | APL Travel",
  description: "Review your transfer and passenger details.",
};

function Fallback() {
  return <div className="site-shell min-h-screen bg-[var(--bg)]" />;
}

export default function TransferDetailsRoute() {
  return (
    <Suspense fallback={<Fallback />}>
      <BookingDetailsPage service="transfer" />
    </Suspense>
  );
}
