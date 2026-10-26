"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { apiPost } from "@/lib/api/client";
import { formatMoney, getActiveMarketId } from "@/data/markets";
import IsoDateField, { dateToIso } from "@/components/ui/IsoDateField";
import { today } from "@/lib/dateUtils";

const DISCLAIMER = "Mock comparison only. These plans do not provide real coverage and no policy is issued.";

function emptyTraveller() {
  return { type: "ADULT", age: "30" };
}

export function InsuranceSearch({ initial }) {
  const router = useRouter();
  const [form, setForm] = useState({
    destination: initial?.destination || "",
    departureDate: initial?.departureDate || "",
    returnDate: initial?.returnDate || "",
    tripType: initial?.tripType || "SINGLE",
    travellers: initial?.travellers?.length ? initial.travellers : [emptyTraveller()],
  });
  const [error, setError] = useState("");

  function updateTraveller(index, patch) {
    setForm((current) => ({
      ...current,
      travellers: current.travellers.map((person, personIndex) => (
        personIndex === index ? { ...person, ...patch } : person
      )),
    }));
  }

  function submit(event) {
    event.preventDefault();
    if (!form.destination.trim() || !form.departureDate || !form.returnDate) {
      setError("Enter a destination, departure date and return date.");
      return;
    }
    if (form.travellers.some((person) => person.age === "" || Number(person.age) < 0)) {
      setError("Enter an age for every traveller.");
      return;
    }
    const params = new URLSearchParams({
      destination: form.destination.trim(),
      departureDate: form.departureDate,
      returnDate: form.returnDate,
      tripType: form.tripType,
      travellers: form.travellers.map((person) => `${person.type}:${person.age}`).join(","),
    });
    router.push(`/insurance?${params.toString()}`);
  }

  return (
    <form className="home-other-search" onSubmit={submit}>
      <label>
        Destination
        <input className="field-input" value={form.destination} onChange={(event) => setForm({ ...form, destination: event.target.value })} placeholder="Travel country" />
      </label>
      <IsoDateField
        id="insurance-depart"
        label="Departure"
        value={form.departureDate}
        min={dateToIso(today())}
        rangeStart={form.departureDate}
        rangeEnd={form.returnDate}
        onChange={(departureDate) => setForm({
          ...form,
          departureDate,
          returnDate: form.returnDate && departureDate && form.returnDate < departureDate ? "" : form.returnDate,
        })}
      />
      <IsoDateField
        id="insurance-return"
        label="Return"
        value={form.returnDate}
        min={form.departureDate || dateToIso(today())}
        rangeStart={form.departureDate}
        rangeEnd={form.returnDate}
        onChange={(returnDate) => setForm({ ...form, returnDate })}
      />
      <label>
        Trip type
        <select className="field-input" value={form.tripType} onChange={(event) => setForm({ ...form, tripType: event.target.value })}>
          <option value="SINGLE">Single trip</option>
          <option value="RETURN">Return</option>
        </select>
      </label>
      {form.travellers.map((person, index) => (
        <div key={`traveller-${index}`} className="insurance-traveller">
          <label>
            Traveller {index + 1}
            <select className="field-input" value={person.type} onChange={(event) => updateTraveller(index, { type: event.target.value })}>
              <option value="ADULT">Adult</option>
              <option value="CHILD">Child</option>
            </select>
          </label>
          <label>
            Age
            <input className="field-input" inputMode="numeric" value={person.age} onChange={(event) => updateTraveller(index, { age: event.target.value })} />
          </label>
        </div>
      ))}
      <button
        type="button"
        className="btn-ghost"
        onClick={() => setForm((current) => ({ ...current, travellers: [...current.travellers, { type: "CHILD", age: "8" }] }))}
      >
        Add traveller
      </button>
      {error ? <p className="field-error">{error}</p> : null}
      <button type="submit" className="home-search-btn">Compare plans</button>
    </form>
  );
}

export function InsuranceResults({ plans, searchId, trip }) {
  const marketId = getActiveMarketId();
  const [compared, setCompared] = useState([]);
  const selected = useMemo(
    () => plans.filter((plan) => compared.includes(plan.id)),
    [plans, compared],
  );

  function toggle(id) {
    setCompared((current) => {
      if (current.includes(id)) return current.filter((value) => value !== id);
      return current.length >= 3 ? current : [...current, id];
    });
  }

  if (!plans.length) {
    return <p className="booking-section-copy">No mock plan matches these travellers and dates.</p>;
  }

  return (
    <div className="results-list">
      {plans.map((plan) => (
        <article key={plan.id} className="result-card">
          <div>
            <p className="result-card-kicker">{plan.provider}</p>
            <h2>{plan.name}</h2>
            <p className="result-card-meta">Coverage {plan.coverageAmount.amount.toLocaleString()} {plan.coverageAmount.currency}</p>
            <p>{plan.medicalCoverage}</p>
            <p className="result-card-meta">Baggage: {plan.baggageProtection}</p>
            <p className="result-card-meta">Trip: {plan.tripProtection}</p>
          </div>
          <div className="result-card-price">
            <p className="price-total">{formatMoney(plan.premium.amount, marketId, plan.premium.currency)}</p>
            <p className="price-fee-note">Illustrated premium. Demo purchase only.</p>
            <label className="booking-meta">
              <input type="checkbox" checked={compared.includes(plan.id)} onChange={() => toggle(plan.id)} /> Compare
            </label>
            <Link className="btn-primary result-card-cta" href={`/insurance/${plan.id}?${new URLSearchParams({
              searchId: searchId || "",
              destination: trip?.destination || "",
              departureDate: trip?.departureDate || "",
              returnDate: trip?.returnDate || "",
              travellers: (trip?.travellers || []).map((person) => `${person.type}:${person.age}`).join(","),
            }).toString()}`}>
              View plan
            </Link>
          </div>
        </article>
      ))}
      {selected.length > 1 ? (
        <table className="insurance-compare">
          <thead>
            <tr>
              <th>Plan</th>
              {selected.map((plan) => <th key={plan.id}>{plan.name}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>Premium</th>
              {selected.map((plan) => <td key={plan.id}>{formatMoney(plan.premium.amount, marketId, plan.premium.currency)}</td>)}
            </tr>
            <tr>
              <th>Medical</th>
              {selected.map((plan) => <td key={plan.id}>{plan.medicalCoverage}</td>)}
            </tr>
            <tr>
              <th>Exclusions</th>
              {selected.map((plan) => <td key={plan.id}>{plan.exclusions.join("; ")}</td>)}
            </tr>
          </tbody>
        </table>
      ) : null}
    </div>
  );
}

export async function loadInsurancePlans(params) {
  const travellers = String(params.travellers || "ADULT:30").split(",").filter(Boolean).map((row) => {
    const [type, age] = row.split(":");
    return { type: type || "ADULT", age: Number(age) };
  });
  return apiPost("/insurance/search", {
    destination: params.destination,
    departureDate: params.departureDate,
    returnDate: params.returnDate,
    tripType: params.tripType || "SINGLE",
    travellers,
  });
}

export function InsurancePageFrame({ title, children }) {
  return (
    <div className="site-shell min-h-screen bg-[var(--bg)]">
      <Header />
      <main className="container-page booking-page-inner">
        <p className="result-card-kicker">Mock insurance</p>
        <h1 className="booking-title">{title}</h1>
        <p className="booking-section-copy">{DISCLAIMER}</p>
        {children}
      </main>
      <Footer />
    </div>
  );
}
