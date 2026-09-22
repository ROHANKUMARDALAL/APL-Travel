import { Suspense } from "react";
import ResultsPage from "@/components/results/ResultsPage";

export const metadata = {
  title: "Hotel results | APL Travel",
  description: "Compare hotel stays for your trip.",
};

function Fallback() {
  return <div className="site-shell min-h-screen bg-[var(--bg)]" />;
}

export default function HotelsPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <ResultsPage service="hotel" />
    </Suspense>
  );
}
