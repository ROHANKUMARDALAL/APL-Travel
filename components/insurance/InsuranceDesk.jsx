"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCountries, getCountryCallingCode } from "libphonenumber-js";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CountrySelect from "@/components/recharge/CountrySelect";
import { apiPost } from "@/lib/api/client";
import { formatMoney, getActiveMarketId } from "@/data/markets";
import IsoDateField, { dateToIso } from "@/components/ui/IsoDateField";
import { today } from "@/lib/dateUtils";
import "@/app/recharge.css";

function flag(iso) {
  return iso.replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

const DISCLAIMER = "Mock comparison only. These plans do not provide real coverage and no policy is issued.";

function emptyTraveller() {
  return { type: "ADULT", age: "30" };
}

export function InsuranceSearch({ initial }) {
  const router = useRouter();
  const countries = useMemo(() => {
    const names = new Intl.DisplayNames(["en"], { type: "region" });
    return getCountries().map((iso) => ({
      iso,
      name: names.of(iso) || iso,
      dialCode: `+${getCountryCallingCode(iso)}`,
      flag: flag(iso),
    }));
  }, []);
  const [form, setForm] = useState({
    destination: initial?.destination || "",
    departureDate: initial?.departureDate || "",
    returnDate: initial?.returnDate || "",
    tripType: initial?.tripType || "SINGLE",
    travellers: initial?.travellers?.length ? initial.travellers : [emptyTraveller()],
  });
  const [error, setError] = useState("");
  const countryIso = countries.find((country) => country.name === form.destination)?.iso || "";

  function setTravellerCount(count) {
    const next = Math.max(1, Math.min(6, count));
    setForm((current) => {
      const travellers = current.travellers.slice(0, next);
      while (travellers.length < next) travellers.push(emptyTraveller());
      return { ...current, travellers };
    });
  }

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
    <form className="insurance-search-card" onSubmit={submit}>
      <div className="insurance-card-head">
        <h2>Travel Insurance Search</h2>
        <p>Compare mock plans for this trip. Nothing is purchased here.</p>
      </div>
      <div className="insurance-form-grid">
        <CountrySelect
          countries={countries}
          label="Destination Country"
          value={countryIso}
          onChange={(iso) => setForm({ ...form, destination: countries.find((country) => country.iso === iso)?.name || "" })}
        />
        <div className="insurance-segment" role="group" aria-label="Trip Type">
          <button type="button" className={form.tripType !== "ANNUAL" ? "is-on" : ""} onClick={() => setForm({ ...form, tripType: "SINGLE" })}>Single Trip</button>
          <button type="button" className={form.tripType === "ANNUAL" ? "is-on" : ""} onClick={() => setForm({ ...form, tripType: "ANNUAL" })}>Multi Trip</button>
        </div>
        <IsoDateField
          id="insurance-depart"
          label="Departure Date"
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
          label="Return Date"
          value={form.returnDate}
          min={form.departureDate || dateToIso(today())}
          rangeStart={form.departureDate}
          rangeEnd={form.returnDate}
          onChange={(returnDate) => setForm({ ...form, returnDate })}
        />
        <div className="insurance-stepper-field">
          <span className="rch-label">Number of Travellers</span>
          <div className="insurance-stepper">
            <button type="button" aria-label="Remove traveller" onClick={() => setTravellerCount(form.travellers.length - 1)} disabled={form.travellers.length <= 1}>−</button>
            <strong>{form.travellers.length}</strong>
            <button type="button" aria-label="Add traveller" onClick={() => setTravellerCount(form.travellers.length + 1)} disabled={form.travellers.length >= 6}>+</button>
          </div>
        </div>
      </div>
      <div className="insurance-people">
        {form.travellers.map((person, index) => (
          <div key={`traveller-${index}`} className="insurance-person">
            <p>Traveller {index + 1}</p>
            <div className="insurance-segment" role="group" aria-label={`Traveller ${index + 1} type`}>
              <button type="button" className={person.type === "ADULT" ? "is-on" : ""} onClick={() => updateTraveller(index, { type: "ADULT" })}>Adult</button>
              <button type="button" className={person.type === "CHILD" ? "is-on" : ""} onClick={() => updateTraveller(index, { type: "CHILD" })}>Child</button>
            </div>
            <label>
              Age
              <input className="field-input" inputMode="numeric" value={person.age} onChange={(event) => updateTraveller(index, { age: event.target.value.replace(/[^\d]/g, "") })} />
            </label>
          </div>
        ))}
      </div>
      {error ? <p className="field-error">{error}</p> : null}
      <button type="submit" className="home-search-btn insurance-submit">Compare Insurance Plans</button>
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
    <div className="insurance-plan-list">
      <p className="insurance-disclaimer">DEMO / MOCK INSURANCE. These cards are illustrations, not policies or coverage guarantees.</p>
      {plans.map((plan) => (
        <article key={plan.id} className="insurance-plan-card">
          <div>
            <p className="result-card-kicker">{plan.provider}</p>
            <h2>{plan.name}</h2>
            <p className="insurance-coverage">Coverage {plan.coverageAmount.amount.toLocaleString()} {plan.coverageAmount.currency}</p>
            <p>{plan.medicalCoverage}</p>
            {plan.benefits?.length ? <ul>{plan.benefits.map((item) => <li key={item}>{item}</li>)}</ul> : null}
            {plan.exclusions?.length ? <p className="result-card-meta">Exclusions: {plan.exclusions.join("; ")}</p> : null}
          </div>
          <div className="result-card-price">
            <p className="price-total">{formatMoney(plan.premium.amount, marketId, plan.premium.currency)}</p>
            <p className="price-fee-note">Illustrated premium. Demo only.</p>
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
              Select plan
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
    <div className="site-shell bg-[var(--bg)]">
      <Header />
      <main className="container-page insurance-page">
        <header className="insurance-intro">
          <span className="insurance-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none"><path d="M12 3 5 6v6c0 4.2 2.8 7.4 7 9 4.2-1.6 7-4.8 7-9V6l-7-3Z" stroke="currentColor" strokeWidth="1.7" /><path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
          </span>
          <div>
            <p className="insurance-kicker">Travel protection</p>
            <h1>{title}</h1>
            <p>{DISCLAIMER}</p>
          </div>
        </header>
        {children}
      </main>
      <Footer />
    </div>
  );
}
