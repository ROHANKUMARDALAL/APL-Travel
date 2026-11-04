"use client";

import { useEffect, useState } from "react";
import AccountShell from "@/components/account/AccountShell";
import PremiumSelect from "@/components/ui/PremiumSelect";
import { useAuth } from "@/components/auth/useAuth";
import { getLoginToken } from "@/lib/auth";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api/client";
import "@/app/account-support.css";

const SERVICES = [
  { value: "", label: "Optional" },
  { value: "flight", label: "Flight" },
  { value: "hotel", label: "Hotel" },
  { value: "bus", label: "Bus" },
  { value: "transfer", label: "Transfer" },
  { value: "recharge", label: "Recharge" },
  { value: "insurance", label: "Insurance" },
  { value: "holiday", label: "Holidays" },
  { value: "visa", label: "Visa" },
  { value: "general", label: "General" },
];

const MAX_MESSAGE = 2000;

export default function AddReviewClient() {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [relatedService, setRelatedService] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);
  const [mine, setMine] = useState([]);
  const [editingId, setEditingId] = useState("");
  const [deleteId, setDeleteId] = useState("");
  const shown = hoverRating || rating;
  const serviceLabel = SERVICES.find((item) => item.value === relatedService)?.label || "Optional";

  useEffect(() => {
    const token = getLoginToken();
    if (!token) return;
    apiGet("/account/reviews", { token }).then((data) => setMine(data?.reviews || [])).catch(() => {});
  }, [done]);

  async function submit(event) {
    event.preventDefault();
    if (message.trim().length < 10) {
      setError("Write at least 10 characters.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const body = { rating, title, message, relatedService };
      const data = editingId
        ? await apiPatch(`/account/reviews/${editingId}`, body, { token: getLoginToken() })
        : await apiPost("/account/reviews", body, { token: getLoginToken() });
      setDone(data.review);
      setEditingId("");
      setMessage("");
      setTitle("");
      setRelatedService("");
      setRating(5);
    } catch (err) {
      setError(err.message || "Could not submit this review");
    } finally {
      setBusy(false);
    }
  }

  const initials = user?.initials || (user?.name || "?").slice(0, 1);
  return (
    <AccountShell>
      <div className="rev-page">
        <header className="rev-hero">
          <p>Share your experience</p>
          <h1>Add a review</h1>
          <p>Your name comes from this account. A new review is published immediately. An inactive review stays hidden until the travel desk enables it.</p>
        </header>
        <div className="rev-layout">
          <form className="rev-form" onSubmit={submit}>
            <div className="rev-person">
              {user?.profilePhoto ? <img src={user.profilePhoto} alt="" /> : <span>{initials}</span>}
              <div>
                <label htmlFor="review-name">Customer name</label>
                <input id="review-name" value={user?.name || ""} readOnly />
              </div>
            </div>
            <div className="rev-stars" role="radiogroup" aria-label="Rating" onMouseLeave={() => setHoverRating(0)}>
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`rev-star ${value <= shown ? "is-on" : ""}`}
                  aria-checked={rating === value}
                  role="radio"
                  onMouseEnter={() => setHoverRating(value)}
                  onFocus={() => setHoverRating(value)}
                  onBlur={() => setHoverRating(0)}
                  onClick={() => setRating(value)}
                >
                  ★
                </button>
              ))}
            </div>
            <label className="rev-field">Review title
              <input value={title} maxLength={160} onChange={(event) => setTitle(event.target.value)} placeholder="Optional title" />
            </label>
            <label className="rev-field">Review message
              <textarea rows={5} value={message} maxLength={MAX_MESSAGE} onChange={(event) => setMessage(event.target.value)} required />
              <span className={message.length > 1900 ? "is-warn" : ""}>{message.length}/{MAX_MESSAGE}</span>
            </label>
            <PremiumSelect
              label="Related service"
              value={relatedService}
              options={SERVICES}
              onChange={setRelatedService}
              placeholder="Optional"
            />
            {error ? <p className="rev-error">{error}</p> : null}
            {done && done.status !== "DELETED" ? <p className="rev-success">{done.status === "ACTIVE" ? "Published. Status: ACTIVE." : "Saved. Status: INACTIVE."}</p> : null}
            <button className="rev-submit" type="submit" disabled={busy}>{busy ? "Saving…" : editingId ? "Save changes" : "Submit Review"}</button>
            {editingId ? <button type="button" className="rev-text" onClick={() => { setEditingId(""); setTitle(""); setMessage(""); setRating(5); setRelatedService(""); }}>Cancel edit</button> : null}
          </form>
          <section className="rev-mine-panel">
            <h2>My Reviews</h2>
            {mine.length ? mine.map((row) => (
              <article key={row.id}>
                <header>
                  <strong>{row.title || "Review"}</strong>
                  <span>{row.status === "ACTIVE" ? "ACTIVE" : "INACTIVE"}</span>
                </header>
                <p className="rev-gold">{"★".repeat(row.rating)}{"☆".repeat(5 - row.rating)}</p>
                <p>{row.message}</p>
                <p>{SERVICES.find((item) => item.value === row.relatedService)?.label || "General"} · {new Date(row.updatedAt || row.createdAt).toLocaleDateString()}</p>
                <div>
                  <button type="button" onClick={() => { setEditingId(row.id); setRating(row.rating); setTitle(row.title || ""); setMessage(row.message || ""); setRelatedService(row.relatedService || ""); setDone(null); }}>Edit</button>
                  <button type="button" onClick={() => setDeleteId(row.id)}>Delete</button>
                </div>
              </article>
            )) : <p>You have not added a review yet.</p>}
          </section>
          {deleteId ? (
            <div className="rev-confirm" role="presentation">
              <section role="dialog" aria-modal="true" aria-labelledby="delete-review-title">
                <h2 id="delete-review-title">Delete this review?</h2>
                <p>It will be removed from the website.</p>
                <div>
                  <button type="button" onClick={() => setDeleteId("")}>Cancel</button>
                  <button type="button" onClick={async () => {
                    const id = deleteId;
                    setDeleteId("");
                    try {
                      await apiDelete(`/account/reviews/${id}`, { token: getLoginToken() });
                      if (editingId === id) setEditingId("");
                      setDone({ status: "DELETED" });
                    } catch (err) {
                      setError(err.message || "Could not delete this review");
                    }
                  }}>Delete</button>
                </div>
              </section>
            </div>
          ) : null}
          <aside className="rev-preview" aria-live="polite">
            <p className="rev-kicker">Live preview</p>
            <blockquote>
              <span aria-hidden="true">“</span>
              <div className="rev-stars" aria-hidden="true">{"★".repeat(shown)}{"☆".repeat(5 - shown)}</div>
              <h2>{title || "Your review"}</h2>
              <p>{message || "Your message appears here as you type."}</p>
              <footer>
                {user?.profilePhoto ? <img src={user.profilePhoto} alt="" /> : <span>{initials}</span>}
                <strong>{user?.name || "You"}</strong>
                {relatedService ? <em>{serviceLabel}</em> : null}
              </footer>
            </blockquote>
          </aside>
        </div>
      </div>
    </AccountShell>
  );
}
