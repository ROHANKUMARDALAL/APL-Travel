import { Suspense } from "react";
import ResultsPage from "@/components/results/ResultsPage";

export const metadata = {
  title: "Flight results | APL Travel",
  description: "Compare flight options for your trip.",
};

function Fallback() {
  return <div className="site-shell min-h-screen bg-[var(--bg)]" />;
}

export default function FlightsPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <ResultsPage service="flight" />
    </Suspense>
  );
}
