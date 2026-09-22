"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import SiteChrome from "@/components/layout/SiteChrome";
import { useAuth } from "@/components/auth/useAuth";
import {
  getSupportContact,
  getSupportHours,
  listBookingIssueTypes,
  listSupportFaqs,
  listSupportRequests,
  listSupportTopics,
  submitBookingSupportRequest,
  submitContactRequest,
} from "@/lib/support";
import { listBookings, getBookingHeadline } from "@/lib/userBookings";
import { findResultById } from "@/lib/booking";
import { FOOTER } from "@/data/static";

const POPULAR_TOPICS = [
  { label: "Change a flight", href: "#help-center", topic: "flight" },
  { label: "Hotel check-in", href: "#help-center", topic: "hotel" },
  { label: "Cancel a booking", href: "#help-center", topic: "changes" },
  { label: "Refunds & wallet", href: "#help-center", topic: "wallet" },
  { label: "Find a booking", href: "/find-booking" },
];

function FaqSection({ searchQuery, topicId, onTopicChange }) {
  const topics = listSupportTopics();
  const faqs = useMemo(() => {
    const all = listSupportFaqs(topicId);
    const q = searchQuery.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (item) =>
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q),
    );
  }, [topicId, searchQuery]);

  return (
    <section className="checkout-section support-block" id="help-center">
      <h2 className="checkout-section-title">Popular topics</h2>
      <p className="section-copy">
        Browse common questions for flights, hotels, buses, and your account.
      </p>

      <div className="support-topic-chips" role="list">
        <button
          type="button"
          className={`trip-tab ${topicId === "all" ? "is-active" : ""}`}
          onClick={() => onTopicChange("all")}
        >
          All topics
        </button>
        {topics.map((topic) => (
          <button
            key={topic.id}
            type="button"
            className={`trip-tab ${topicId === topic.id ? "is-active" : ""}`}
            onClick={() => onTopicChange(topic.id)}
          >
            {topic.label}
          </button>
        ))}
      </div>

      <div className="support-faq-list">
        {faqs.length === 0 ? (
          <p className="section-copy">No matching articles. Try another search.</p>
        ) : (
          faqs.map((item) => (
            <details key={item.question} className="support-faq-item">
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))
        )}
      </div>
    </section>
  );
}

function ContactSection() {
  const contact = getSupportContact();
  const hours = getSupportHours();
  const topics = listSupportTopics();
  const [form, setForm] = useState({
    name: "",
    email: "",
    topic: "other",
    message: "",
  });
  const [result, setResult] = useState(null);
  const [chatNote, setChatNote] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    const response = submitContactRequest(form);
    setResult(response);
    if (response.ok) {
      setForm({ name: "", email: "", topic: "other", message: "" });
    }
  }

  return (
    <section className="checkout-section support-block" id="contact">
      <h2 className="checkout-section-title">Contact support</h2>
      <p className="section-copy">
        Reach our support team using the channels below.
      </p>

      <dl className="checkout-fact-list support-contact-facts">
        <div>
          <dt>Email support</dt>
          <dd>
            <a href={`mailto:${contact.email}`}>{contact.email}</a>
          </dd>
        </div>
        <div>
          <dt>Phone support</dt>
          <dd>
            <a href={`tel:${contact.phone.replace(/\s/g, "")}`}>{contact.phone}</a>
          </dd>
        </div>
        <div>
          <dt>{hours.label}</dt>
          <dd>
            {hours.weekday}
            <br />
            {hours.weekend}
          </dd>
        </div>
        <div>
          <dt>Office</dt>
          <dd>{contact.address}</dd>
        </div>
      </dl>
      <p className="dev-note">{hours.note}</p>

      <div className="account-inline-actions">
        <button
          type="button"
          className="btn-secondary promo-apply-btn"
          onClick={() => setChatNote(contact.liveChatNote)}
        >
          {contact.liveChatLabel}
        </button>
        <Link className="btn-ghost" href="/find-booking">
          Find your booking
        </Link>
      </div>
      {chatNote ? (
        <p className="dev-note" role="status">
          {chatNote}
        </p>
      ) : null}

      <h3 className="booking-subsection-title">Contact form</h3>
      <form className="support-form" onSubmit={handleSubmit} noValidate>
        <label className="search-field">
          <span className="field-label">Name</span>
          <input
            className="field-input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Aisha Meridian"
            autoComplete="name"
          />
        </label>
        <label className="search-field">
          <span className="field-label">Email</span>
          <input
            className="field-input"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </label>
        <label className="search-field">
          <span className="field-label">Topic</span>
          <select
            className="field-select"
            value={form.topic}
            onChange={(e) => setForm({ ...form, topic: e.target.value })}
          >
            {topics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.label}
              </option>
            ))}
          </select>
        </label>
        <label className="search-field support-form-full">
          <span className="field-label">Message</span>
          <textarea
            className="field-input support-textarea"
            rows={4}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />
        </label>
        <button type="submit" className="btn-primary">
          Send message
        </button>
      </form>
      {result ? (
        <p
          className={result.ok ? "promo-feedback is-applied" : "field-error"}
          role="status"
        >
          {result.ok
            ? `${result.message} Ticket ${result.ticket.id}.`
            : result.message}
        </p>
      ) : null}
    </section>
  );
}

function BookingHelpSection({ user }) {
  const bookings = useMemo(
    () => (user?.email ? listBookings({ email: user.email }) : []),
    [user?.email],
  );
  const issues = listBookingIssueTypes();
  const [bookingReference, setBookingReference] = useState("");
  const [issueType, setIssueType] = useState("");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState(null);
  const requests = useMemo(
    () => (user?.email ? listSupportRequests(user.email) : []),
    [user?.email, result],
  );

  if (!user) {
    return (
      <section className="checkout-section support-block" id="booking-help">
        <h2 className="checkout-section-title">Booking help</h2>
        <p className="section-copy">
          Sign in to select one of your trips and submit a support request.
        </p>
        <div className="account-inline-actions">
          <Link className="btn-primary" href="/login?next=/support#booking-help">
            Sign in
          </Link>
          <Link className="btn-ghost" href="/find-booking">
            Find booking as guest
          </Link>
        </div>
      </section>
    );
  }

  function handleSubmit(event) {
    event.preventDefault();
    const response = submitBookingSupportRequest({
      email: user.email,
      name: user.name,
      bookingReference,
      issueType,
      message,
    });
    setResult(response);
    if (response.ok) {
      setMessage("");
      setIssueType("");
    }
  }

  return (
    <section className="checkout-section support-block" id="booking-help">
      <h2 className="checkout-section-title">Booking help</h2>
      <p className="section-copy">
        Choose a trip and tell us what you need help with.
      </p>

      {bookings.length === 0 ? (
        <div className="support-empty">
          <p className="section-copy">No bookings on this account yet.</p>
          <Link className="btn-primary" href="/#search">
            Plan a trip
          </Link>
        </div>
      ) : (
        <form className="support-form" onSubmit={handleSubmit}>
          <label className="search-field support-form-full">
            <span className="field-label">Booking</span>
            <select
              className="field-select"
              value={bookingReference}
              onChange={(e) => setBookingReference(e.target.value)}
            >
              <option value="">Select a booking</option>
              {bookings.map((booking) => {
                const item = findResultById(booking.service, booking.id);
                return (
                  <option key={booking.reference} value={booking.reference}>
                    {booking.reference} · {booking.service} ·{" "}
                    {getBookingHeadline(booking, item)}
                  </option>
                );
              })}
            </select>
          </label>
          <label className="search-field support-form-full">
            <span className="field-label">How can we help?</span>
            <select
              className="field-select"
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
            >
              <option value="">Select an option</option>
              {issues.map((issue) => (
                <option key={issue.id} value={issue.id}>
                  {issue.label}
                </option>
              ))}
            </select>
          </label>
          <label className="search-field support-form-full">
            <span className="field-label">Details (optional)</span>
            <textarea
              className="field-input support-textarea"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </label>
          <button type="submit" className="btn-primary">
            Submit request
          </button>
        </form>
      )}

      {result ? (
        <div className="support-ticket-result" role="status">
          <p className="promo-feedback is-applied">
            {result.ok ? "Request submitted" : result.message}
          </p>
          {result.ok ? (
            <>
              <p className="field-label">Ticket / reference</p>
              <p className="confirmation-ref-value">{result.ticket.id}</p>
              <p className="dev-note">{result.message}</p>
            </>
          ) : null}
        </div>
      ) : null}

      <h3 className="booking-subsection-title">Your recent requests</h3>
      {requests.length === 0 ? (
        <div className="support-empty">
          <p className="section-copy">No support requests yet.</p>
          <p className="dev-note">
            Submitted tickets for {FOOTER.brand} will appear here.
          </p>
        </div>
      ) : (
        <ul className="support-request-list">
          {requests.map((item) => (
            <li key={item.id}>
              <strong>{item.id}</strong>
              <span>
                {item.issueLabel || item.topic || item.type}
                {item.bookingReference ? ` · ${item.bookingReference}` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function SupportCenterClient() {
  const { ready, user, authenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [topicId, setTopicId] = useState("all");

  function handlePopularClick(topic) {
    if (topic) setTopicId(topic);
  }

  return (
    <SiteChrome>
      <section className="container-page support-page">
        <p className="section-eyebrow">Support Center</p>
        <h1 className="section-title">How can we help?</h1>
        <p className="section-copy">
          Search help articles, browse popular topics, or contact support about a
          booking.
        </p>

        <div className="support-search">
          <label className="search-field" htmlFor="support-help-search">
            <span className="field-label">Search help</span>
            <input
              id="support-help-search"
              className="field-input"
              type="search"
              placeholder="Search cancellation, refunds, check-in…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </label>
        </div>

        <div className="support-popular" aria-label="Popular topics">
          {POPULAR_TOPICS.map((item) =>
            item.href.startsWith("/") ? (
              <Link key={item.label} className="trip-tab" href={item.href}>
                {item.label}
              </Link>
            ) : (
              <a
                key={item.label}
                className="trip-tab"
                href={item.href}
                onClick={() => handlePopularClick(item.topic)}
              >
                {item.label}
              </a>
            ),
          )}
        </div>

        <div className="support-jump">
          <a href="#help-center">Popular topics</a>
          <a href="#booking-help">Booking help</a>
          <a href="#contact">Contact support</a>
          <Link href="/find-booking">Find booking</Link>
        </div>

        <div className="support-stack">
          <FaqSection
            searchQuery={searchQuery}
            topicId={topicId}
            onTopicChange={setTopicId}
          />
          {ready ? (
            <BookingHelpSection user={authenticated ? user : null} />
          ) : (
            <section className="checkout-section support-block" id="booking-help">
              <p className="section-copy">Loading booking help…</p>
            </section>
          )}
          <ContactSection />
        </div>
      </section>
    </SiteChrome>
  );
}
