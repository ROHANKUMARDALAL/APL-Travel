"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { apiPost } from "@/lib/api/client";
import { getSession } from "@/lib/auth";
import { useAuth } from "@/components/auth/useAuth";
import IsoDateField, { dateToIso } from "@/components/ui/IsoDateField";
import { today } from "@/lib/dateUtils";

const COPY = {
  visa: {
    title: "Visa enquiry",
    body: "Tell us where you are travelling. This is a request for assistance, not a visa approval or a booking.",
  },
  recharge: {
    title: "Recharge request",
    body: "Send a recharge request to this travel desk. This does not complete a payment.",
  },
  insurance: {
    title: "Insurance enquiry",
    body: "Ask this travel desk about travel insurance. This is not a policy and no premium is charged here.",
  },
};

export default function ServiceEnquiryPage({ serviceCode }) {
  const copy = COPY[serviceCode];
  const pathname = usePathname();
  const { ready, authenticated, user } = useAuth();
  const idempotencyKey = useMemo(
    () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `enq-${Date.now()}`),
    [],
  );
  const [form, setForm] = useState({
    preferredDepartureDate: "",
    mobile: "",
    email: "",
    specialRequirements: "",
  });
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!ready || !authenticated || !user) return;
    setForm((current) => ({
      ...current,
      mobile: current.mobile || user.phone || "",
      email: current.email || user.email || "",
    }));
  }, [ready, authenticated, user]);

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    if (!form.preferredDepartureDate) {
      setError("Choose a preferred date");
      return;
    }
    const session = getSession();
    if (!session?.loginToken) return;
    setSubmitting(true);
    try {
      const data = await apiPost(
        "/enquiries",
        {
          serviceCode,
          preferredDepartureDate: form.preferredDepartureDate,
          contactDetails: { mobile: form.mobile, email: form.email },
          specialRequirements: form.specialRequirements,
          idempotencyKey,
        },
        { token: session.loginToken },
      );
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
        <h1 className="text-3xl font-semibold">{copy.title}</h1>
        <p className="mt-2 max-w-2xl text-[var(--ink-muted)]">{copy.body}</p>
        {reference ? (
          <p className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4" role="status">
            Enquiry {reference} has been sent. You can follow it in <Link href="/account/enquiries">My enquiries</Link>.
          </p>
        ) : !ready ? (
          <p className="mt-6">Loading…</p>
        ) : !authenticated ? (
          <p className="mt-6">
            <Link className="btn-primary inline-flex" href={`/login?next=${encodeURIComponent(pathname)}`}>
              Sign in to continue
            </Link>
          </p>
        ) : (
          <form className="mt-6 grid max-w-xl gap-3" onSubmit={onSubmit}>
            <IsoDateField
              id="enquiry-date"
              label="Preferred date"
              value={form.preferredDepartureDate}
              min={dateToIso(today())}
              onChange={(preferredDepartureDate) => setForm({ ...form, preferredDepartureDate })}
            />
            <label>
              Contact mobile
              <input className="mt-1 w-full rounded-lg border px-3 py-2" required value={form.mobile} onChange={(event) => setForm({ ...form, mobile: event.target.value })} />
            </label>
            <label>
              Contact email
              <input className="mt-1 w-full rounded-lg border px-3 py-2" type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            </label>
            <label>
              Notes
              <textarea className="mt-1 w-full rounded-lg border px-3 py-2" rows={4} value={form.specialRequirements} onChange={(event) => setForm({ ...form, specialRequirements: event.target.value })} />
            </label>
            {error ? <p className="text-sm text-red-700">{error}</p> : null}
            <button className="btn-primary" type="submit" disabled={submitting}>
              {submitting ? "Sending…" : "Submit enquiry"}
            </button>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
}
