"use client";

import { Suspense } from "react";
import { InsuranceTravellers } from "@/components/insurance/InsuranceJourney";

export default function InsuranceTravellersPage() {
  return (
    <Suspense fallback={<div className="site-shell min-h-screen bg-[var(--bg)]" />}>
      <InsuranceTravellers />
    </Suspense>
  );
}
