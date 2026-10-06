import { Suspense } from "react";
import ResultsPage from "@/components/results/ResultsPage";

export const metadata = {
  title: "Transfer results | APL Travel",
  description: "Compare private transfer options for your trip.",
};

function Fallback() {
  return <div className="site-shell min-h-screen bg-[var(--bg)]" />;
}

export default function TransfersPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <ResultsPage service="transfer" />
    </Suspense>
  );
}
