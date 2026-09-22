import { Suspense } from "react";
import MyTripsClient from "@/components/trips/MyTripsClient";

export const metadata = {
  title: "My Trips | APL Travel",
  description: "View and manage your APL Travel bookings.",
};

export default function MyTripsPage() {
  return (
    <Suspense fallback={<div className="account-loading" />}>
      <MyTripsClient />
    </Suspense>
  );
}
