"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { InsurancePageFrame } from "@/components/insurance/InsuranceDesk";
import { apiPost } from "@/lib/api/client";
import { bookInsuranceDemo } from "@/lib/api/booking";
import { quotePaymentFee } from "@/lib/paymentFee";
import { getLoginToken } from "@/lib/auth";
import { saveConfirmation } from "@/lib/confirmation";
import { formatMoney, getActiveMarketId } from "@/data/markets";
import IsoDateField, { dateToIso } from "@/components/ui/IsoDateField";
import { today } from "@/lib/dateUtils";

const DRAFT_KEY = "apl-insurance-draft";
const dobMax = dateToIso(today());
const dobMin = `${today().getFullYear() - 120}-01-01`;

export function readInsuranceDraft() {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(window.sessionStorage.getItem(DRAFT_KEY) || "null");
  } catch {
    return null;
  }
}

export function writeInsuranceDraft(draft) {
  window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

function ageFromDob(dob) {
  if (!dob) return "";
  const birth = new Date(`${dob}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return "";
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const month = now.getMonth() - birth.getMonth();
  if (month < 0 || (month === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age;
}

function blankTraveller() {
  return {
    firstName: "",
    lastName: "",
    dob: "",
    gender: "",
    mobile: "",
    email: "",
    address: "",
    nationality: "Indian",
    passportNumber: "",
    beneficiary: blankBeneficiary(),
  };
}

function blankBeneficiary() {
  return {
    firstName: "",
    lastName: "",
    relationship: "",
    dob: "",
    mobile: "",
    email: "",
    address: "",
  };
}

function tripFromParams(searchParams) {
  const travellers = String(searchParams.get("travellers") || "")
    .split(",")
    .filter(Boolean)
    .map((row) => {
      const [type, age] = row.split(":");
      return { type: type || "ADULT", age: Number(age) };
    });
  return {
    searchId: searchParams.get("searchId") || "",
    destination: searchParams.get("destination") || "",
    departureDate: searchParams.get("departureDate") || "",
    returnDate: searchParams.get("returnDate") || "",
    travellers,
  };
}

function queryString(trip, planId) {
  return new URLSearchParams({
    searchId: trip.searchId || "",
    destination: trip.destination || "",
    departureDate: trip.departureDate || "",
    returnDate: trip.returnDate || "",
    travellers: (trip.travellers || []).map((person) => `${person.type}:${person.age}`).join(","),
    planId: planId || "",
  }).toString();
}

export function InsurancePlanDetails() {
  const params = useParams();
  const searchParams = useSearchParams();
  const planId = String(params.planId || "");
  const trip = tripFromParams(searchParams);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState("");
  const marketId = getActiveMarketId();

  useEffect(() => {
    let cancelled = false;
    apiPost("/insurance/details", { planId, searchId: trip.searchId || undefined })
      .then((data) => {
        if (!cancelled) setPlan(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Plan details are unavailable");
      });
    return () => {
      cancelled = true;
    };
  }, [planId, trip.searchId]);

  const cards = [
    plan?.medicalCoverage ? ["Medical", plan.medicalCoverage] : null,
    plan?.tripCancellation ? ["Trip cancellation", plan.tripCancellation] : null,
    plan?.tripProtection ? ["Trip interruption", plan.tripProtection] : null,
    plan?.baggageProtection ? ["Baggage", plan.baggageProtection] : null,
    plan?.emergencyAssistance ? ["Emergency assistance", plan.emergencyAssistance] : null,
  ].filter(Boolean);

  return (
    <InsurancePageFrame title={plan ? plan.name : "Plan details"}>
      <Link className="btn-ghost" href="/insurance">Back to plans</Link>
      {error ? <p className="field-error">{error}</p> : null}
      {!plan && !error ? <p className="booking-section-copy">Loading plan details…</p> : null}
      {plan ? (
        <div className="insurance-layout">
          <div className="insurance-main">
            <article className="insurance-hero-card">
              <div>
                <p className="insurance-logo">{plan.provider.slice(0, 1)}</p>
                <p className="result-card-kicker">{plan.provider}</p>
                <h2>{plan.name}</h2>
                <p className="price-fee-note">DEMO / MOCK plan. Not a real policy.</p>
              </div>
              <div>
                <p className="price-total">{formatMoney(plan.premium.amount, marketId, plan.premium.currency)}</p>
                <p>Coverage {plan.coverageAmount.amount.toLocaleString()} {plan.coverageAmount.currency}</p>
              </div>
            </article>
            <section className="insurance-trip-card">
              <h2>Trip</h2>
              <p>{trip.destination || "Destination from your search"}</p>
              <p>{trip.departureDate || "—"} to {trip.returnDate || "—"}</p>
              <p>{trip.travellers.length || plan.travellerCount || 1} traveller{(trip.travellers.length || 1) === 1 ? "" : "s"}</p>
            </section>
            <div className="insurance-card-grid">
              {cards.map(([label, text]) => (
                <article key={label} className="insurance-benefit-card">
                  <h3>{label}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
            {plan.benefits?.length ? (
              <section className="insurance-benefit-card">
                <h3>Benefits on this plan</h3>
                <ul>{plan.benefits.map((item) => <li key={item}>{item}</li>)}</ul>
              </section>
            ) : null}
            {plan.exclusions?.length ? (
              <section className="insurance-benefit-card is-muted">
                <h3>Exclusions</h3>
                <ul>{plan.exclusions.map((item) => <li key={item}>{item}</li>)}</ul>
              </section>
            ) : null}
            {plan.policyConditions?.length ? (
              <section className="insurance-benefit-card">
                <h3>Policy conditions</h3>
                <ul>{plan.policyConditions.map((item) => <li key={item}>{item}</li>)}</ul>
              </section>
            ) : null}
            {plan.comparison?.length ? (
              <section className="insurance-benefit-card">
                <h3>Coverage comparison</h3>
                <table className="insurance-compare">
                  <thead>
                    <tr><th>Plan</th><th>Premium</th><th>Coverage</th></tr>
                  </thead>
                  <tbody>
                    {plan.comparison.map((row) => (
                      <tr key={row.id}>
                        <td>{row.name}{row.selected ? " (selected)" : ""}</td>
                        <td>{formatMoney(row.premium.amount, marketId, row.premium.currency)}</td>
                        <td>{row.coverageAmount.amount.toLocaleString()} {row.coverageAmount.currency}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            ) : null}
          </div>
          <aside className="insurance-price-card">
            <p className="result-card-kicker">Premium</p>
            <p className="price-total">{formatMoney(plan.premium.amount, marketId, plan.premium.currency)}</p>
            <p className="price-fee-note">{plan.disclaimer}</p>
            <Link className="btn-primary" href={`/insurance/${plan.id}/travellers?${queryString(trip, plan.id)}`}>
              Continue to Traveller Details
            </Link>
          </aside>
        </div>
      ) : null}
    </InsurancePageFrame>
  );
}

export function InsuranceTravellers() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = String(params.planId || "");
  const trip = tripFromParams(searchParams);
  const [plan, setPlan] = useState(null);
  const [sameBeneficiary, setSameBeneficiary] = useState(false);
  const [travellers, setTravellers] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = readInsuranceDraft();
    const count = Math.max(trip.travellers.length, 1);
    if (saved?.planId === planId && Array.isArray(saved.travellers) && saved.travellers.length === count) {
      setTravellers(saved.travellers);
      setSameBeneficiary(Boolean(saved.sameBeneficiary));
    } else {
      setTravellers(Array.from({ length: count }, () => blankTraveller()));
    }
    apiPost("/insurance/details", { planId, searchId: trip.searchId || undefined })
      .then(setPlan)
      .catch(() => setPlan(null));
  }, [planId, trip.searchId, trip.travellers.length]);

  function persist(nextTravellers, same = sameBeneficiary) {
    writeInsuranceDraft({
      planId,
      plan,
      trip,
      sameBeneficiary: same,
      travellers: nextTravellers,
    });
  }

  function updateTraveller(index, patch) {
    setTravellers((current) => {
      const next = current.map((person, personIndex) => (
        personIndex === index ? { ...person, ...patch } : person
      ));
      persist(next);
      return next;
    });
  }

  function updateBeneficiary(index, patch) {
    setTravellers((current) => {
      const next = current.map((person, personIndex) => {
        if (personIndex !== index) return person;
        return { ...person, beneficiary: { ...person.beneficiary, ...patch } };
      });
      const same = index === 0 ? sameBeneficiary : false;
      if (index !== 0) setSameBeneficiary(false);
      const copied = same ? copyBeneficiary(next) : next;
      persist(copied, same);
      return copied;
    });
  }

  function copyBeneficiary(rows) {
    const shared = rows[0]?.beneficiary || blankBeneficiary();
    return rows.map((person, index) => (
      index === 0 ? person : { ...person, beneficiary: { ...shared } }
    ));
  }

  function toggleSame(checked) {
    setSameBeneficiary(checked);
    setTravellers((current) => {
      const next = checked ? copyBeneficiary(current) : current;
      persist(next, checked);
      return next;
    });
  }

  function localErrors() {
    const problems = [];
    travellers.forEach((person, index) => {
      const age = ageFromDob(person.dob);
      if (!person.firstName.trim() || !person.lastName.trim()) problems.push(`Traveller ${index + 1} name`);
      if (age === "" || age < 0) problems.push(`Traveller ${index + 1} date of birth`);
      if (!person.mobile.trim() || !person.email.trim() || !person.address.trim() || !person.nationality.trim()) {
        problems.push(`Traveller ${index + 1} contact`);
      }
      if (plan?.requiresGender && !person.gender) problems.push(`Traveller ${index + 1} gender`);
      if (plan?.passportRequired && !person.passportNumber.trim()) problems.push(`Traveller ${index + 1} passport`);
      const beneficiary = person.beneficiary || {};
      const beneficiaryAge = ageFromDob(beneficiary.dob);
      if (!beneficiary.firstName?.trim() || !beneficiary.relationship?.trim()) problems.push(`Traveller ${index + 1} beneficiary`);
      if (beneficiaryAge === "") problems.push(`Traveller ${index + 1} beneficiary date of birth`);
      if (Number.isInteger(age) && age < 18 && Number.isInteger(beneficiaryAge) && beneficiaryAge < 18) {
        problems.push(`Traveller ${index + 1} needs an adult beneficiary`);
      }
    });
    return problems;
  }

  async function continueToReview(event) {
    event.preventDefault();
    const problems = localErrors();
    if (problems.length) {
      setError(problems[0]);
      return;
    }
    const payload = travellers.map((person) => ({
      ...person,
      age: ageFromDob(person.dob),
      beneficiary: { ...person.beneficiary, age: ageFromDob(person.beneficiary.dob) },
    }));
    try {
      await apiPost("/insurance/travellers", {
        searchId: trip.searchId,
        planId,
        sameBeneficiary,
        travellers: payload,
      });
      persist(payload);
      router.push(`/insurance/${planId}/review?${queryString(trip, planId)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Check the traveller details");
    }
  }

  return (
    <InsurancePageFrame title="Traveller and beneficiary details">
      <Link className="btn-ghost" href={`/insurance/${planId}?${queryString(trip, planId)}`}>Back to plan</Link>
      <form className="insurance-form" onSubmit={continueToReview}>
        <label className="booking-meta">
          <input type="checkbox" checked={sameBeneficiary} onChange={(event) => toggleSame(event.target.checked)} />
          Same beneficiary for all
        </label>
        {travellers.map((person, index) => {
          const age = ageFromDob(person.dob);
          const beneficiaryAge = ageFromDob(person.beneficiary?.dob);
          return (
            <section key={index} className="insurance-person-card">
              <h2>Traveller {index + 1}{trip.travellers[index] ? ` · ${trip.travellers[index].type}` : ""}</h2>
              <div className="insurance-fields">
                <input className="field-input" placeholder="First name" value={person.firstName} onChange={(event) => updateTraveller(index, { firstName: event.target.value })} />
                <input className="field-input" placeholder="Last name" value={person.lastName} onChange={(event) => updateTraveller(index, { lastName: event.target.value })} />
                <IsoDateField id={`traveller-dob-${index}`} label="Date of birth" value={person.dob} min={dobMin} max={dobMax} clearable onChange={(dob) => updateTraveller(index, { dob })} />
                <p className="booking-meta">Age {age === "" ? "—" : age}</p>
                {plan?.requiresGender ? (
                  <select className="field-input" aria-label="Gender" value={person.gender} onChange={(event) => updateTraveller(index, { gender: event.target.value })}>
                    <option value="">Gender</option>
                    <option>Female</option>
                    <option>Male</option>
                    <option>Other</option>
                  </select>
                ) : null}
                <input className="field-input" placeholder="Mobile" value={person.mobile} onChange={(event) => updateTraveller(index, { mobile: event.target.value })} />
                <input className="field-input" placeholder="Email" value={person.email} onChange={(event) => updateTraveller(index, { email: event.target.value })} />
                <input className="field-input" placeholder="Address" value={person.address} onChange={(event) => updateTraveller(index, { address: event.target.value })} />
                <input className="field-input" placeholder="Nationality" value={person.nationality} onChange={(event) => updateTraveller(index, { nationality: event.target.value })} />
                {plan?.passportRequired ? (
                  <input className="field-input" placeholder="Passport number" value={person.passportNumber} onChange={(event) => updateTraveller(index, { passportNumber: event.target.value })} />
                ) : null}
              </div>
              <h3>Beneficiary</h3>
              {Number.isInteger(age) && age < 18 ? <p className="booking-meta">A minor needs an adult beneficiary.</p> : null}
              <div className="insurance-fields">
                <input className="field-input" placeholder="Beneficiary first name" value={person.beneficiary.firstName} onChange={(event) => updateBeneficiary(index, { firstName: event.target.value })} />
                <input className="field-input" placeholder="Beneficiary last name" value={person.beneficiary.lastName} onChange={(event) => updateBeneficiary(index, { lastName: event.target.value })} />
                <input className="field-input" placeholder="Relationship" value={person.beneficiary.relationship} onChange={(event) => updateBeneficiary(index, { relationship: event.target.value })} />
                <IsoDateField id={`beneficiary-dob-${index}`} label="Beneficiary date of birth" value={person.beneficiary.dob} min={dobMin} max={dobMax} clearable onChange={(dob) => updateBeneficiary(index, { dob })} />
                <p className="booking-meta">Age {beneficiaryAge === "" ? "—" : beneficiaryAge}</p>
                <input className="field-input" placeholder="Beneficiary mobile" value={person.beneficiary.mobile} onChange={(event) => updateBeneficiary(index, { mobile: event.target.value })} />
                <input className="field-input" placeholder="Beneficiary email" value={person.beneficiary.email} onChange={(event) => updateBeneficiary(index, { email: event.target.value })} />
                <input className="field-input" placeholder="Beneficiary address" value={person.beneficiary.address} onChange={(event) => updateBeneficiary(index, { address: event.target.value })} />
              </div>
            </section>
          );
        })}
        {error ? <p className="field-error">{error}</p> : null}
        <button className="btn-primary" type="submit">Continue to review</button>
      </form>
    </InsurancePageFrame>
  );
}

export function InsuranceReview() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = String(params.planId || "");
  const trip = tripFromParams(searchParams);
  const marketId = getActiveMarketId();
  const [draft, setDraft] = useState(null);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);
  const premium = draft?.plan?.premium;

  useEffect(() => {
    const saved = readInsuranceDraft();
    if (saved?.planId === planId) setDraft(saved);
  }, [planId]);

  const [payMethod, setPayMethod] = useState("UPI");
  const payable = useMemo(() => premium?.amount || 0, [premium]);
  const paymentQuote = useMemo(() => quotePaymentFee(payable, payMethod), [payable, payMethod]);

  async function pay(event) {
    event.preventDefault();
    if (!draft?.travellers?.length || !premium) {
      setError("Traveller details are missing. Go back and complete them.");
      return;
    }
    if (!accepted) {
      setError("Accept the demo terms before continuing.");
      return;
    }
    if (!getLoginToken()) {
      router.push(`/login?next=${encodeURIComponent(`/insurance/${planId}/review?${queryString(trip, planId)}`)}`);
      return;
    }
    setPaying(true);
    setError("");
    try {
      const booked = await bookInsuranceDemo({
        searchId: draft.trip?.searchId || trip.searchId,
        planId,
        quote: premium,
        travellers: draft.travellers,
        sameBeneficiary: draft.sameBeneficiary,
        destination: draft.trip?.destination || trip.destination,
        departureDate: draft.trip?.departureDate || trip.departureDate,
        returnDate: draft.trip?.returnDate || trip.returnDate,
        contact: {
          email: draft.travellers[0].email,
          phone: draft.travellers[0].mobile,
        },
        payment: {
          method: payMethod,
          amount: paymentQuote.totalAmount,
          feeAmount: paymentQuote.feeAmount,
          ...(payMethod === "CARD"
            ? { cardNumber: "4111111111114242", expiry: "12/30", cvv: "123", name: "Demo Traveller" }
            : {}),
          ...(payMethod === "UPI" ? { upiId: "traveller@aplmock" } : {}),
        },
      });
      saveConfirmation({
        reference: booked.aplBookingRef,
        service: "insurance",
        demo: true,
        id: planId,
        searchQuery: draft.trip || trip,
        travellers: draft.travellers,
        payable: { totalPayableLabel: formatMoney(paymentQuote.totalAmount, marketId, premium.currency) },
        bookingStatus: "confirmed",
        createdAt: new Date().toISOString(),
      });
      router.push(`/booking-confirmation?ref=${encodeURIComponent(booked.aplBookingRef)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo payment could not be completed");
      setPaying(false);
    }
  }

  if (!draft) {
    return (
      <InsurancePageFrame title="Review">
        <p className="booking-section-copy">Traveller details were not found. Start from the plan again.</p>
      </InsurancePageFrame>
    );
  }

  return (
    <InsurancePageFrame title="Review demo insurance">
      <Link className="btn-ghost" href={`/insurance/${planId}/travellers?${queryString(draft.trip || trip, planId)}`}>Back to travellers</Link>
      <div className="insurance-layout">
        <div className="insurance-main">
          <article className="insurance-benefit-card">
            <p className="result-card-kicker">DEMO / MOCK</p>
            <h2>{draft.plan?.provider} · {draft.plan?.name}</h2>
            <p>This purchase does not issue a policy, certificate, or real coverage.</p>
          </article>
          {draft.travellers.map((person, index) => (
            <article key={index} className="insurance-person-card">
              <h2>{person.firstName} {person.lastName}</h2>
              <p>Age {person.age || ageFromDob(person.dob)} · {person.nationality}</p>
              <p>Beneficiary: {person.beneficiary?.firstName} {person.beneficiary?.lastName} ({person.beneficiary?.relationship}), age {person.beneficiary?.age || ageFromDob(person.beneficiary?.dob)}</p>
            </article>
          ))}
        </div>
        <aside className="insurance-price-card">
          <p>Premium {premium ? formatMoney(premium.amount, marketId, premium.currency) : "—"}</p>
          <div className="pay-method-grid" role="radiogroup" aria-label="Payment method">
            {[
              ["UPI", "UPI · 0%"],
              ["CARD", "Card · 2.5%"],
              ["NETBANKING", "Net banking · 3%"],
              ["WALLET", "Wallet · 0%"],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`pay-method-card ${payMethod === id ? "is-selected" : ""}`}
                onClick={() => setPayMethod(id)}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="price-total">
            Payable {premium ? formatMoney(paymentQuote.totalAmount, marketId, premium.currency) : "—"}
            {" "}· payment fee {premium ? formatMoney(paymentQuote.feeAmount, marketId, premium.currency) : "—"}
            {" "}· simulated APL_MOCK_PAY
          </p>
          <p className="price-fee-note">Mock card payment through APL_MOCK_PAY. No real charge.</p>
          <form onSubmit={pay}>
            <label className="booking-meta">
              <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} />
              I accept these demo terms and policy conditions.
            </label>
            {error ? <p className="field-error">{error}</p> : null}
            <button className="btn-primary" type="submit" disabled={paying}>
              {paying ? "Processing demo payment…" : "Continue to mock payment"}
            </button>
          </form>
        </aside>
      </div>
    </InsurancePageFrame>
  );
}
