"use client";

import { Suspense } from "react";
import { InsuranceReview } from "@/components/insurance/InsuranceJourney";

export default function InsuranceReviewPage() {
  return (
    <Suspense fallback={<div className="site-shell min-h-screen bg-[var(--bg)]" />}>
      <InsuranceReview />
    </Suspense>
  );
}
