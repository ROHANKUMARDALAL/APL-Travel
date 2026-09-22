import { Suspense } from "react";
import TripDetailsClient from "@/components/trips/TripDetailsClient";

export const metadata = {
  title: "Booking details | APL Travel",
  description: "Full details for your APL Travel booking.",
};

export default async function TripDetailsPage({ params }) {
  const resolved = await params;
  const reference = decodeURIComponent(resolved.reference || "");

  return (
    <Suspense fallback={<div className="account-loading" />}>
      <TripDetailsClient reference={reference} />
    </Suspense>
  );
}
