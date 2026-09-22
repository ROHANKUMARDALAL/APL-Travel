import { Suspense } from "react";
import Dashboard from "@/components/Dashboard";

function HomeFallback() {
  return <div className="site-shell min-h-screen bg-[var(--bg)]" aria-hidden="true" />;
}

export default function Home() {
  return (
    <Suspense fallback={<HomeFallback />}>
      <Dashboard />
    </Suspense>
  );
}
