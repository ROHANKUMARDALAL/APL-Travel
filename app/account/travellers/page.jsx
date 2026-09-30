import { Suspense } from "react";
import TravellerListClient from "@/components/account/TravellerListClient";

export const metadata = {
  title: "My traveller list | APL Travel",
  description: "Passengers saved on your APL Travel account.",
};

export default function TravellersPage() {
  return (
    <Suspense fallback={<div className="account-loading" />}>
      <TravellerListClient />
    </Suspense>
  );
}
