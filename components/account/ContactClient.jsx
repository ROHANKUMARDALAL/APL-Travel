"use client";

import { useEffect, useState } from "react";
import AccountShell from "@/components/account/AccountShell";
import PremiumSelect from "@/components/ui/PremiumSelect";
import { useAuth } from "@/components/auth/useAuth";
import { getLoginToken } from "@/lib/auth";
import { apiGet, apiPost } from "@/lib/api/client";
import { loadAccountBookings } from "@/lib/userBookings";
import "@/app/account-support.css";

const TYPES = [
  ["GENERAL", "General Enquiry"],
  ["BOOKING", "Booking Assistance"],
  ["PAYMENT", "Payment Issue"],
  ["WALLET", "Wallet Issue"],
  ["REFUND", "Refund / Cancellation"],
  ["RECHARGE", "Recharge Issue"],
  ["TECHNICAL", "Technical Support"],
  ["OTHER", "Other"],
];

const SERVICES = [
  ["general", "General"],
  ["flight", "Flight"],
  ["hotel", "Hotel"],
  ["bus", "Bus"],
  ["transfer", "Cab"],
  ["recharge", "Recharge"],
  ["insurance", "Insurance"],
  ["holiday", "Holidays"],
  ["visa", "Visa"],
];

export default function ContactClient() {
  const { user } = useAuth();
  const [tab, setTab] = useState("form");
  const [category, setCategory] = useState("GENERAL");
  const [service, setService] = useState("general");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [bookingReference, setBookingReference] = useState("");
  const [bookings, setBookings] = useState([]);
  const [requests, setRequests] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);

  useEffect(() => {
    const token = getLoginToken();
    if (!token) return;
    apiGet("/account/support-requests", { token }).then((data) => setRequests(data?.requests || [])).catch(() => {});
    loadAccountBookings().then((rows) => setBookings(rows.filter((row) => row.reference))).catch(() => {});
  }, [done]);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await apiPost("/account/support-requests", {
        category, service, subject, message, bookingReference,
      }, { token: getLoginToken() });
      setDone(data.request);
      setSubject("");
      setMessage("");
    } catch (err) {
      setError(err.message || "Could not send this request");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AccountShell title="Contact Us">
      <div className="care-page">
        <section className="care-hero">
          <div className="care-art" aria-hidden="true"><span /><span /><span /></div>
          <h2>How can we help?</h2>
          <p>Send a support request to your travel desk. You will get a reference and can follow the status here.</p>
        </section>
        <div className="care-cats">
          {TYPES.map(([id, label]) => (
            <button key={id} type="button" className={`care-cat ${category === id ? "is-on" : ""}`} onClick={() => setCategory(id)}>
              {label}
            </button>
          ))}
        </div>
        <div className="care-tabs">
          <button type="button" className={tab === "form" ? "is-on" : ""} onClick={() => setTab("form")}>New request</button>
          <button type="button" className={tab === "list" ? "is-on" : ""} onClick={() => setTab("list")}>My requests</button>
        </div>
        {tab === "form" ? (
          done ? (
            <section className="care-done">
              <h3>Request received</h3>
              <p>Your support reference is <strong>{done.reference}</strong>.</p>
              <button type="button" className="care-submit" onClick={() => { setDone(null); setTab("list"); }}>View my requests</button>
            </section>
          ) : (
            <form className="care-form" onSubmit={submit}>
              <div className="care-grid">
                <label className="care-field">Customer name<input value={user?.name || ""} readOnly /></label>
                <label className="care-field">Email<input value={user?.email || ""} readOnly /></label>
                <label className="care-field">Mobile number<input value={user?.phoneNumber || user?.phone || ""} readOnly /></label>
                <PremiumSelect
                  id="contact-type"
                  label="Enquiry type"
                  value={category}
                  options={TYPES.map(([value, label]) => ({ value, label }))}
                  onChange={setCategory}
                />
                <PremiumSelect
                  id="contact-service"
                  label="Related service"
                  value={service}
                  options={SERVICES.map(([value, label]) => ({ value, label }))}
                  onChange={setService}
                />
                <PremiumSelect
                  id="contact-booking"
                  label="Booking reference"
                  value={bookingReference}
                  placeholder="None"
                  options={[{ value: "", label: "None" }, ...bookings.map((row) => ({ value: row.reference, label: row.reference }))]}
                  onChange={setBookingReference}
                />
              </div>
              <label className="care-field care-span">Subject<input value={subject} maxLength={160} onChange={(event) => setSubject(event.target.value)} required /></label>
              <label className="care-field care-span">Message<textarea rows={5} value={message} maxLength={4000} onChange={(event) => setMessage(event.target.value)} required /></label>
              {error ? <p>{error}</p> : null}
              <button className="care-submit" type="submit" disabled={busy}>{busy ? "Sending…" : "Submit Request"}</button>
            </form>
          )
        ) : (
          <section className="care-list">
            {requests.length === 0 ? <p>No support requests yet.</p> : requests.map((row) => (
              <article key={row.reference} className="care-row">
                <div>
                  <strong>{row.subject}</strong>
                  <p>{row.reference}</p>
                  {(row.replies || []).map((reply) => <p key={reply.at}>{reply.message}</p>)}
                </div>
                <span className="care-status">{row.status}</span>
              </article>
            ))}
          </section>
        )}
      </div>
    </AccountShell>
  );
}
