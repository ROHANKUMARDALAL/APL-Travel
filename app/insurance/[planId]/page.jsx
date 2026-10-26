"use client";

import { Suspense } from "react";
import { InsurancePlanDetails } from "@/components/insurance/InsuranceJourney";

export default function InsurancePlanPage() {
  return (
    <Suspense fallback={<div className="site-shell min-h-screen bg-[var(--bg)]" />}>
      <InsurancePlanDetails />
    </Suspense>
  );
}
