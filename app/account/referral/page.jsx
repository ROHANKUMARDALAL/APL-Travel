import { Suspense } from "react";
import ReferralClient from "@/components/account/ReferralClient";

export const metadata = {
  title: "Referral Code | APL Travel",
  description: "Share your demo referral code and track mock rewards.",
};

export default function ReferralPage() {
  return (
    <Suspense fallback={<div className="account-loading" />}>
      <ReferralClient />
    </Suspense>
  );
}
