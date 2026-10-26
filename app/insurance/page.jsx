"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { InsurancePageFrame, InsuranceResults, InsuranceSearch, loadInsurancePlans } from "@/components/insurance/InsuranceDesk";

function InsuranceHome() {
  const searchParams = useSearchParams();
  const destination = searchParams.get("destination") || "";
  const departureDate = searchParams.get("departureDate") || "";
  const returnDate = searchParams.get("returnDate") || "";
  const tripType = searchParams.get("tripType") || "SINGLE";
  const travellers = (searchParams.get("travellers") || "").split(",").filter(Boolean).map((row) => {
    const [type, age] = row.split(":");
    return { type: type || "ADULT", age: age || "" };
  });
  const ready = Boolean(destination && departureDate && returnDate);
  const [status, setStatus] = useState(ready ? "loading" : "idle");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready) return undefined;
    let cancelled = false;
    setStatus("loading");
    loadInsurancePlans({
      destination,
      departureDate,
      returnDate,
      tripType,
      travellers: searchParams.get("travellers") || "ADULT:30",
    }).then((data) => {
      if (!cancelled) {
        setResult(data);
        setStatus("ready");
      }
    }).catch((err) => {
      if (!cancelled) {
        setError(err instanceof Error ? err.message : "Insurance search failed");
        setStatus("error");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [destination, departureDate, ready, returnDate, searchParams, tripType]);

  return (
    <InsurancePageFrame title="Compare travel insurance plans">
      <InsuranceSearch initial={{ destination, departureDate, returnDate, tripType, travellers }} />
      {status === "loading" ? <p className="booking-section-copy">Searching mock plans…</p> : null}
      {status === "error" ? <p className="field-error">{error}</p> : null}
      {status === "ready" && result ? <InsuranceResults plans={result.plans || []} searchId={result.searchId} trip={result} /> : null}
    </InsurancePageFrame>
  );
}

export default function InsurancePage() {
  return (
    <Suspense fallback={<div className="site-shell min-h-screen bg-[var(--bg)]" />}>
      <InsuranceHome />
    </Suspense>
  );
}
