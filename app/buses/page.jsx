import { Suspense } from "react";
import ResultsPage from "@/components/results/ResultsPage";

export const metadata = {
  title: "Bus results | APL Travel",
  description: "Compare bus options for your trip.",
};

function Fallback() {
  return <div className="site-shell min-h-screen bg-[var(--bg)]" />;
}

export default function BusesPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <ResultsPage service="bus" />
    </Suspense>
  );
}
