"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DatePicker from "@/components/ui/DatePicker";
import { apiGet, apiPost } from "@/lib/api/client";
import { getSession } from "@/lib/auth";
import { useAuth } from "@/components/auth/useAuth";
import { addDays, today } from "@/lib/dateUtils";

const STEPS = ["Trip details", "Travellers", "Contact", "Review"];

function isoToDate(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function dateToIso(date) {
  if (!date) return "";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function ageOn(dob, onDate) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob || "") || !/^\d{4}-\d{2}-\d{2}$/.test(onDate || "")) return null;
  const [year, month, day] = dob.split("-").map(Number);
  const [travelYear, travelMonth, travelDay] = onDate.split("-").map(Number);
  let age = travelYear - year;
  if (travelMonth < month || (travelMonth === month && travelDay < day)) age -= 1;
  return age;
}

function money(amount, currency) {
  const value = Number(amount || 0);
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency || "INR"} ${value}`;
  }
}

function emptyPassenger(international) {
  return {
    fullName: "",
    dateOfBirth: "",
    gender: "",
    nationality: "",
    documentType: international ? "PASSPORT" : "AADHAAR",
    documentNumber: "",
    holderName: "",
    expiryDate: "",
    issuingCountry: "",
  };
}

function passengerHasData(row) {
  return Boolean(row.fullName || row.dateOfBirth || row.documentNumber || row.nationality || row.holderName);
}

export default function HolidayEnquiryPage() {
  const params = useParams();
  const slug = params?.slug;
  const { ready, authenticated, user } = useAuth();
  const [pkg, setPkg] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reference, setReference] = useState("");
  const [submittedAt, setSubmittedAt] = useState("");
  const [step, setStep] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const [pendingCut, setPendingCut] = useState(null);
  const [idempotencyKey] = useState(() =>
    typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `enq-${Date.now()}`,
  );
  const [form, setForm] = useState(() => {
    const params = typeof window === "undefined" ? new URLSearchParams() : new URLSearchParams(window.location.search);
    const adults = Math.min(9, Math.max(1, Number(params.get("adults")) || 1));
    const children = Math.min(6, Math.max(0, Number(params.get("children")) || 0));
    return {
    preferredDepartureDate: params.get("departure") || "",
    durationDays: params.get("minDays") || "",
    adults,
    children,
    contactName: "",
    mobile: "",
    email: "",
    specialRequirements: "",
    passengers: [emptyPassenger(false)],
    };
  });

  useEffect(() => {
    if (!slug) return undefined;
    let ignore = false;
    apiGet(`/holidays/${slug}`)
      .then((data) => {
        if (!ignore) setPkg(data.package);
      })
      .catch((err) => {
        if (!ignore) setLoadError(err.message || "This package is not available");
      });
    return () => {
      ignore = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!user && !pkg) return;
    setForm((current) => ({
      ...current,
      contactName: current.contactName || user?.name || "",
      mobile: current.mobile || user?.phone || "",
      email: current.email || user?.email || "",
      durationDays: current.durationDays || (pkg ? String(pkg.durationDays) : ""),
      passengers: current.passengers.map((row, index) =>
        index === 0 && !row.documentType
          ? { ...row, documentType: pkg?.isInternational ? "PASSPORT" : "AADHAAR" }
          : row,
      ),
    }));
  }, [user, pkg]);

  const total = Number(form.adults || 0) + Number(form.children || 0);
  const leadAge = ageOn(form.passengers[0]?.dateOfBirth, form.preferredDepartureDate);
  const leadError = !form.passengers[0]?.dateOfBirth
    ? "Lead traveller date of birth is required"
    : form.preferredDepartureDate && leadAge !== null && leadAge < 18
      ? "The lead traveller must be at least 18 on the departure date"
      : "";

  const dobMin = useMemo(() => addDays(today(), -365 * 120), []);
  const leadMax = form.preferredDepartureDate
    ? isoToDate(shiftYears(form.preferredDepartureDate, -18))
    : addDays(today(), -1);

  function applyCounts(nextAdults, nextChildren, force) {
    const adults = Math.max(1, nextAdults);
    const children = Math.max(0, nextChildren);
    const nextTotal = adults + children;
    const removed = form.passengers.slice(nextTotal);
    if (!force && removed.some(passengerHasData)) {
      setPendingCut({ adults, children });
      return;
    }
    setPendingCut(null);
    setForm((current) => {
      const passengers = current.passengers.slice(0, nextTotal);
      while (passengers.length < nextTotal) {
        passengers.push(emptyPassenger(pkg?.isInternational));
      }
      return { ...current, adults, children, passengers };
    });
  }

  function updatePassenger(index, patch) {
    setForm((current) => ({
      ...current,
      passengers: current.passengers.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)),
    }));
  }

  function roleLabel(index) {
    if (index === 0) return "Lead Traveller";
    if (index < Number(form.adults)) return "Adult";
    return "Child";
  }

  async function submit(event) {
    event.preventDefault();
    if (leadError || !confirmed || submitting) return;
    const session = getSession();
    if (!session?.loginToken) return;
    setSubmitting(true);
    setError("");
    try {
      const data = await apiPost(
        `/holidays/${slug}/enquiries`,
        {
          preferredDepartureDate: form.preferredDepartureDate,
          durationDays: Number(form.durationDays),
          adults: Number(form.adults),
          children: Number(form.children),
          totalPassengers: total,
          contactDetails: { name: form.contactName, mobile: form.mobile, email: form.email },
          specialRequirements: form.specialRequirements,
          idempotencyKey,
          passengers: form.passengers.map((row) => ({
            fullName: row.fullName,
            dateOfBirth: row.dateOfBirth,
            gender: row.gender,
            nationality: row.nationality,
            document: {
              type: pkg?.isInternational ? "PASSPORT" : row.documentType,
              number: row.documentNumber,
              holderName: row.holderName || row.fullName,
              nationality: row.nationality,
              dateOfBirth: row.dateOfBirth,
              expiryDate: row.expiryDate,
              issuingCountry: row.issuingCountry,
            },
          })),
        },
        { token: session.loginToken },
      );
      setReference(data.enquiryReference);
      setSubmittedAt(new Date().toLocaleString());
    } catch (err) {
      setError(err.message || "Could not submit the enquiry");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="site-shell min-h-screen bg-[var(--bg)]">
      <Header variant="portal" showServiceTabs />
      <main className="container-page scroll-mt-24 pb-16 pt-8">
        <Link href={slug ? `/holidays/${slug}` : "/holidays"} className="text-sm font-medium text-[var(--brand)]">
          Back to holiday details
        </Link>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Holiday enquiry</h1>
        <p className="mt-1 text-lg text-[var(--ink)]">{pkg?.title || "Selected package"}</p>
        <p className="mt-1 max-w-2xl text-sm text-[var(--ink-muted)]">
          Tell us who is travelling. The contact person and the lead traveller can be different people. This request does not reserve the package.
        </p>
        {loadError ? <p className="mt-6 text-red-700">{loadError}</p> : null}
        {!ready ? <p className="mt-8">Loading…</p> : null}
        {ready && !authenticated ? (
          <div className="mt-8 max-w-xl rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Sign in to continue</h2>
            <p className="mt-2 text-sm text-[var(--ink-muted)]">
              An enquiry is created only after you review and submit the form.
            </p>
            <Link className="btn-primary mt-4 inline-flex" href={`/login?next=${encodeURIComponent(`/holidays/${slug}/enquire`)}`}>
              Sign in
            </Link>
          </div>
        ) : null}
        {reference ? (
          <section className="mt-8 max-w-2xl rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm" role="status">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Enquiry received</p>
            <h2 className="mt-2 text-2xl font-semibold">{reference}</h2>
            <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              <div><dt className="text-[var(--ink-muted)]">Package</dt><dd>{pkg?.title}</dd></div>
              <div><dt className="text-[var(--ink-muted)]">Status</dt><dd>NEW</dd></div>
              <div><dt className="text-[var(--ink-muted)]">Submitted</dt><dd>{submittedAt}</dd></div>
              <div><dt className="text-[var(--ink-muted)]">Departure</dt><dd>{form.preferredDepartureDate}</dd></div>
            </dl>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link className="btn-primary inline-flex" href="/account/enquiries">View my enquiries</Link>
              <Link className="inline-flex rounded-lg border px-4 py-2" href="/holidays">Back to holidays</Link>
            </div>
          </section>
        ) : null}
        {ready && authenticated && !reference ? (
          <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <form onSubmit={submit} className="space-y-4">
              <ol className="flex flex-wrap gap-2" aria-label="Enquiry steps">
                {STEPS.map((label, index) => (
                  <li key={label}>
                    <button
                      type="button"
                      className={`rounded-full px-3 py-1 text-sm ${index === step ? "bg-[var(--brand)] text-white" : "border bg-white"}`}
                      aria-current={index === step ? "step" : undefined}
                      onClick={() => setStep(index)}
                    >
                      {index + 1}. {label}
                    </button>
                  </li>
                ))}
              </ol>

              {step === 0 ? (
                <section className="rounded-2xl border bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-semibold">Trip details</h2>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <DatePicker
                      id="holiday-departure"
                      label="Preferred departure date"
                      clearable
                      value={isoToDate(form.preferredDepartureDate)}
                      minDate={today()}
                      placeholder="Select departure date"
                      onChange={(date) => setForm({ ...form, preferredDepartureDate: dateToIso(date) })}
                    />
                    <label className="search-field">
                      <span className="field-label">Travel duration in days</span>
                      <input className="field-input" type="number" min="1" value={form.durationDays} onChange={(event) => setForm({ ...form, durationDays: event.target.value })} />
                    </label>
                    <label className="search-field">
                      <span className="field-label">Adults</span>
                      <input className="field-input" type="number" min="1" value={form.adults} onChange={(event) => applyCounts(Number(event.target.value), Number(form.children))} />
                    </label>
                    <label className="search-field">
                      <span className="field-label">Children</span>
                      <input className="field-input" type="number" min="0" value={form.children} onChange={(event) => applyCounts(Number(form.adults), Number(event.target.value))} />
                    </label>
                  </div>
                  <p className="mt-3 text-sm text-[var(--ink-muted)]">Total passengers: {total}. This is calculated from adults and children.</p>
                  {pendingCut ? (
                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4" role="alertdialog" aria-label="Confirm traveller removal">
                      <p>Some traveller details will be removed if you lower the passenger count.</p>
                      <div className="mt-3 flex gap-2">
                        <button type="button" className="btn-primary" onClick={() => applyCounts(pendingCut.adults, pendingCut.children, true)}>Remove those travellers</button>
                        <button type="button" className="rounded-lg border bg-white px-3 py-2" onClick={() => setPendingCut(null)}>Keep them</button>
                      </div>
                    </div>
                  ) : null}
                  <div className="mt-5 flex justify-end">
                    <button type="button" className="btn-primary" onClick={() => setStep(1)}>Continue</button>
                  </div>
                </section>
              ) : null}

              {step === 1 ? (
                <section className="space-y-4">
                  <h2 className="text-lg font-semibold">Traveller details</h2>
                  {form.passengers.map((row, index) => (
                    <article key={index} className="rounded-2xl border bg-white p-5 shadow-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">Passenger {index + 1}</h3>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium">{roleLabel(index)}</span>
                        {index === 0 ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">18+</span> : null}
                      </div>
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <label className="search-field">
                          <span className="field-label">Full name</span>
                          <input className="field-input" value={row.fullName} onChange={(event) => updatePassenger(index, { fullName: event.target.value })} />
                        </label>
                        <div>
                          <DatePicker
                            id={`dob-${index}`}
                            label="Date of birth"
                            clearable
                            value={isoToDate(row.dateOfBirth)}
                            minDate={dobMin}
                            maxDate={index === 0 ? leadMax : today()}
                            placeholder="Select date of birth"
                            onChange={(date) => updatePassenger(index, { dateOfBirth: dateToIso(date) })}
                          />
                          {index === 0 && leadError ? <p className="mt-1 text-sm text-red-700">{leadError}</p> : null}
                          {index === 0 && leadAge !== null && !leadError ? <p className="mt-1 text-sm text-[var(--ink-muted)]">{leadAge} years on departure</p> : null}
                        </div>
                        <label className="search-field">
                          <span className="field-label">Nationality</span>
                          <input className="field-input" value={row.nationality} onChange={(event) => updatePassenger(index, { nationality: event.target.value })} />
                        </label>
                        <label className="search-field">
                          <span className="field-label">Gender</span>
                          <select className="field-input" value={row.gender} onChange={(event) => updatePassenger(index, { gender: event.target.value })}>
                            <option value="">Optional</option>
                            <option>Female</option>
                            <option>Male</option>
                            <option>Other</option>
                          </select>
                        </label>
                        {pkg?.isInternational ? (
                          <>
                            <label className="search-field"><span className="field-label">Passport number</span><input className="field-input" value={row.documentNumber} onChange={(event) => updatePassenger(index, { documentNumber: event.target.value })} /></label>
                            <label className="search-field"><span className="field-label">Name on passport</span><input className="field-input" value={row.holderName} onChange={(event) => updatePassenger(index, { holderName: event.target.value })} /></label>
                            <DatePicker id={`expiry-${index}`} label="Passport expiry" clearable value={isoToDate(row.expiryDate)} minDate={addDays(today(), 1)} placeholder="Select expiry" onChange={(date) => updatePassenger(index, { expiryDate: dateToIso(date) })} />
                            <label className="search-field"><span className="field-label">Issuing country</span><input className="field-input" value={row.issuingCountry} onChange={(event) => updatePassenger(index, { issuingCountry: event.target.value })} /></label>
                          </>
                        ) : (
                          <>
                            <label className="search-field">
                              <span className="field-label">Identity document</span>
                              <select className="field-input" value={row.documentType} onChange={(event) => updatePassenger(index, { documentType: event.target.value })}>
                                <option value="AADHAAR">Aadhaar</option>
                                <option value="PAN">PAN</option>
                                <option value="DRIVING_LICENCE">Driving licence</option>
                                <option value="VOTER_ID">Voter ID</option>
                                <option value="PASSPORT">Passport</option>
                              </select>
                            </label>
                            <label className="search-field"><span className="field-label">Document number</span><input className="field-input" value={row.documentNumber} onChange={(event) => updatePassenger(index, { documentNumber: event.target.value })} /></label>
                          </>
                        )}
                      </div>
                    </article>
                  ))}
                  <div className="flex justify-between">
                    <button type="button" className="rounded-lg border bg-white px-4 py-2" onClick={() => setStep(0)}>Back</button>
                    <button type="button" className="btn-primary" disabled={Boolean(leadError)} onClick={() => setStep(2)}>Continue</button>
                  </div>
                </section>
              ) : null}

              {step === 2 ? (
                <section className="space-y-4">
                  <article className="rounded-2xl border bg-white p-5 shadow-sm">
                    <h2 className="text-lg font-semibold">Contact details</h2>
                    <p className="mt-1 text-sm text-[var(--ink-muted)]">Prefilled from your account. This does not change the lead traveller.</p>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <label className="search-field md:col-span-2"><span className="field-label">Contact name</span><input className="field-input" value={form.contactName} onChange={(event) => setForm({ ...form, contactName: event.target.value })} /></label>
                      <label className="search-field"><span className="field-label">Mobile number</span><input className="field-input" value={form.mobile} onChange={(event) => setForm({ ...form, mobile: event.target.value })} /></label>
                      <label className="search-field"><span className="field-label">Email address</span><input className="field-input" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
                    </div>
                  </article>
                  <article className="rounded-2xl border bg-white p-5 shadow-sm">
                    <h2 className="text-lg font-semibold">Special requirements</h2>
                    <textarea className="field-input mt-3 w-full" style={{ height: "7rem" }} value={form.specialRequirements} onChange={(event) => setForm({ ...form, specialRequirements: event.target.value })} />
                  </article>
                  <div className="flex justify-between">
                    <button type="button" className="rounded-lg border bg-white px-4 py-2" onClick={() => setStep(1)}>Back</button>
                    <button type="button" className="btn-primary" onClick={() => setStep(3)}>Review</button>
                  </div>
                </section>
              ) : null}

              {step === 3 ? (
                <section className="rounded-2xl border bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-semibold">Review and submit</h2>
                  <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                    <div><dt className="text-[var(--ink-muted)]">Package</dt><dd>{pkg?.title}</dd></div>
                    <div><dt className="text-[var(--ink-muted)]">Departure</dt><dd>{form.preferredDepartureDate || "Not selected"}</dd></div>
                    <div><dt className="text-[var(--ink-muted)]">Duration</dt><dd>{form.durationDays} days</dd></div>
                    <div><dt className="text-[var(--ink-muted)]">Travellers</dt><dd>{form.adults} adults, {form.children} children</dd></div>
                    <div><dt className="text-[var(--ink-muted)]">Lead traveller</dt><dd>{form.passengers[0]?.fullName || "Not entered"}</dd></div>
                    <div><dt className="text-[var(--ink-muted)]">Contact</dt><dd>{form.contactName} · {form.mobile} · {form.email}</dd></div>
                  </dl>
                  <ul className="mt-3 list-disc pl-5 text-sm">
                    {form.passengers.slice(1).map((row, index) => (
                      <li key={index}>{row.fullName || `Passenger ${index + 2}`} · {roleLabel(index + 1)}</li>
                    ))}
                  </ul>
                  {form.specialRequirements ? <p className="mt-3 text-sm">Notes: {form.specialRequirements}</p> : null}
                  <label className="mt-4 flex items-start gap-2 text-sm">
                    <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
                    <span>The traveller details are accurate and I accept the package terms.</span>
                  </label>
                  {leadError ? <p className="mt-3 text-sm text-red-700">{leadError}</p> : null}
                  {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
                  <div className="mt-5 flex justify-between">
                    <button type="button" className="rounded-lg border px-4 py-2" onClick={() => setStep(2)}>Back</button>
                    <button className="btn-primary" type="submit" disabled={!confirmed || Boolean(leadError) || submitting}>
                      {submitting ? "Submitting…" : "Submit enquiry"}
                    </button>
                  </div>
                </section>
              ) : null}
            </form>
            <aside className="rounded-2xl border bg-white p-4 shadow-sm lg:sticky lg:top-24">
              {pkg?.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={pkg.coverImage} alt="" className="h-36 w-full rounded-xl object-cover" />
              ) : <div className="h-36 rounded-xl bg-slate-100" />}
              <h2 className="mt-3 text-lg font-semibold">{pkg?.title || "Package"}</h2>
              <p className="text-sm text-[var(--ink-muted)]">{[pkg?.destinationCity, pkg?.destinationCountry].filter(Boolean).join(", ")}</p>
              <p className="mt-2 text-xs font-semibold uppercase">{pkg?.isInternational ? "International" : "Domestic"}</p>
              <p className="mt-2 text-sm">{pkg?.durationDays} days / {pkg?.durationNights} nights</p>
              {pkg ? <p className="mt-1 text-sm">{pkg.priceLabel}: {money(pkg.startingPrice, pkg.currency)}</p> : null}
              <p className="mt-3 text-sm">Departure: {form.preferredDepartureDate || "Not selected"}</p>
              <p className="text-sm">Passengers: {total}</p>
              <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm">Submitting this enquiry does not create a booking or charge your account.</p>
            </aside>
          </div>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}

function shiftYears(iso, years) {
  const date = isoToDate(iso);
  if (!date) return "";
  const next = new Date(date.getFullYear() + years, date.getMonth(), date.getDate());
  return dateToIso(next);
}
