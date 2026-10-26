"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import IsoDateField, { dateToIso } from "@/components/ui/IsoDateField";
import { today } from "@/lib/dateUtils";
import { apiPost } from "@/lib/api/client";
import { getSession } from "@/lib/auth";
import { useAuth } from "@/components/auth/useAuth";

const STEPS = ["Trip", "Passengers", "Review"];
const VEHICLES = ["Sedan", "SUV", "Traveller", "Luxury"];

export default function TransferEnquiry() {
  const params = useSearchParams();
  const { ready, authenticated, user } = useAuth();
  const idempotencyKey = useMemo(
    () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `tr-${Date.now()}`),
    [],
  );
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reference, setReference] = useState("");
  const [form, setForm] = useState({
    pickup: params.get("pickup") || "",
    dropoff: params.get("dropoff") || "",
    date: params.get("date") || "",
    time: params.get("time") || "10:00",
    vehicle: "Sedan",
    passengers: Math.min(12, Math.max(1, Number(params.get("passengers")) || 1)),
    name: "",
    mobile: "",
    email: "",
    notes: "",
  });

  function update(patch) {
    setForm((current) => ({ ...current, ...patch }));
  }

  function next() {
    setError("");
    if (!form.pickup.trim() || !form.dropoff.trim()) {
      setError("Enter pickup and drop locations.");
      return;
    }
    if (!form.date || form.date < dateToIso(today())) {
      setError("Choose a travel date today or later.");
      return;
    }
    if (step === 1 && (!form.name.trim() || !form.mobile.trim() || !form.email.trim())) {
      setError("Enter the contact name, mobile and email.");
      return;
    }
    setStep((value) => Math.min(STEPS.length - 1, value + 1));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    const session = getSession();
    if (!session?.loginToken) return;
    setSubmitting(true);
    try {
      const data = await apiPost("/enquiries", {
        serviceCode: "transfer",
        pickup: form.pickup.trim(),
        dropoff: form.dropoff.trim(),
        pickupTime: form.time,
        vehiclePreference: form.vehicle,
        passengers: form.passengers,
        preferredDepartureDate: form.date,
        contactDetails: { name: form.name.trim(), mobile: form.mobile.trim(), email: form.email.trim() },
        specialRequirements: form.notes.trim(),
        idempotencyKey,
      }, { token: session.loginToken });
      setReference(data.enquiryReference);
    } catch (err) {
      setError(err.message || "Could not submit the enquiry");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="site-shell min-h-screen bg-[var(--bg)]">
      <Header variant="portal" showServiceTabs />
      <main className="container-page py-8">
        <h1 className="text-3xl font-semibold">Transfer enquiry</h1>
        <p className="mt-2 max-w-2xl text-[var(--ink-muted)]">This request does not reserve a vehicle or take a payment.</p>
        {reference ? (
          <p className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4" role="status">
            Enquiry {reference} has been sent. Follow it in <Link href="/account/enquiries">My enquiries</Link>.
          </p>
        ) : !ready ? (
          <p className="mt-6">Loading…</p>
        ) : !authenticated ? (
          <p className="mt-6">
            <Link className="btn-primary inline-flex" href={`/login?next=${encodeURIComponent(`/transfer/enquire?${params.toString()}`)}`}>
              Sign in to continue
            </Link>
          </p>
        ) : (
          <form className="mt-6 grid max-w-xl gap-4" onSubmit={submit}>
            <p className="text-sm font-semibold">{STEPS[step]} · step {step + 1} of {STEPS.length}</p>
            {step === 0 ? (
              <>
                <label>Pickup<input className="mt-1 w-full rounded-xl border px-3 py-3" value={form.pickup} onChange={(event) => update({ pickup: event.target.value })} /></label>
                <label>Drop<input className="mt-1 w-full rounded-xl border px-3 py-3" value={form.dropoff} onChange={(event) => update({ dropoff: event.target.value })} /></label>
                <IsoDateField id="transfer-enquiry-date" label="Travel date" value={form.date} min={dateToIso(today())} onChange={(date) => update({ date })} />
                <label>Pickup time<input className="mt-1 w-full rounded-xl border px-3 py-3" type="time" value={form.time} onChange={(event) => update({ time: event.target.value })} /></label>
                <label>Vehicle
                  <select className="mt-1 w-full rounded-xl border px-3 py-3" value={form.vehicle} onChange={(event) => update({ vehicle: event.target.value })}>
                    {VEHICLES.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
              </>
            ) : null}
            {step === 1 ? (
              <>
                <label>Passengers<input className="mt-1 w-full rounded-xl border px-3 py-3" type="number" min={1} max={12} value={form.passengers} onChange={(event) => update({ passengers: Number(event.target.value) })} /></label>
                <label>Contact name<input className="mt-1 w-full rounded-xl border px-3 py-3" value={form.name || user?.name || ""} onChange={(event) => update({ name: event.target.value })} /></label>
                <label>Mobile<input className="mt-1 w-full rounded-xl border px-3 py-3" value={form.mobile || user?.phone || ""} onChange={(event) => update({ mobile: event.target.value })} /></label>
                <label>Email<input className="mt-1 w-full rounded-xl border px-3 py-3" value={form.email || user?.email || ""} onChange={(event) => update({ email: event.target.value })} /></label>
                <label>Special requests<textarea className="mt-1 w-full rounded-xl border px-3 py-3" rows={3} value={form.notes} onChange={(event) => update({ notes: event.target.value })} /></label>
              </>
            ) : null}
            {step === 2 ? (
              <div className="rounded-xl border bg-white p-4 text-sm">
                <p>{form.pickup} → {form.dropoff}</p>
                <p>{form.date} at {form.time}</p>
                <p>{form.vehicle} · {form.passengers} passengers</p>
                <p>{form.name} · {form.mobile} · {form.email}</p>
                {form.notes ? <p>{form.notes}</p> : null}
              </div>
            ) : null}
            {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}
            <div className="flex gap-2">
              {step > 0 ? <button className="rounded-full border px-4 py-2" type="button" onClick={() => setStep((value) => value - 1)}>Back</button> : null}
              {step < 2 ? <button className="btn-primary" type="button" onClick={next}>Continue</button> : (
                <button className="btn-primary" type="submit" disabled={submitting}>{submitting ? "Submitting…" : "Submit enquiry"}</button>
              )}
            </div>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
}
