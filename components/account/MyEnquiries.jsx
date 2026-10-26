"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { apiGet } from "@/lib/api/client";
import { getSession } from "@/lib/auth";
import { useAuth } from "@/components/auth/useAuth";
import { SERVICE_TABS, formatWhen, matchesTab, serviceLabel, statusClass } from "./enquiry-view";

const PAGE_SIZE = 6;

export default function MyEnquiries() {
  const { ready, authenticated } = useAuth();
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [visible, setVisible] = useState(PAGE_SIZE);

  useEffect(() => {
    if (!ready || !authenticated) return;
    const session = getSession();
    apiGet("/enquiries/mine", { token: session?.loginToken })
      .then((data) => setRows(data.enquiries || []))
      .catch((err) => setError(err.message || "Could not load enquiries"));
  }, [ready, authenticated]);

  const summary = useMemo(() => {
    const list = rows || [];
    return {
      total: list.length,
      fresh: list.filter((row) => row.status === "NEW").length,
      progress: list.filter((row) => row.status === "CONTACTED" || row.status === "IN_PROGRESS").length,
      done: list.filter((row) => row.status === "CONFIRMED" || row.status === "CLOSED").length,
    };
  }, [rows]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = (rows || []).filter((row) => matchesTab(row, tab)).filter((row) => {
      if (!needle) return true;
      return [row.enquiryReference, row.package?.title, row.package?.destinationCity, row.serviceCode]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
    list.sort((a, b) => {
      const left = new Date(a.createdAt || 0).getTime();
      const right = new Date(b.createdAt || 0).getTime();
      return sort === "oldest" ? left - right : right - left;
    });
    return list;
  }, [rows, tab, query, sort]);

  return (
    <div className="site-shell min-h-screen bg-[var(--bg)]">
      <Header variant="portal" showServiceTabs={false} />
      <main className="container-page enquiry-dash py-8">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--brand-deep)]">Your travel desk</p>
          <h1 className="mt-1 text-3xl font-semibold">My enquiries</h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--ink-muted)]">
            Track holiday, visa and group departure requests submitted on this website.
          </p>
        </header>
        {!ready || (authenticated && !rows && !error) ? <p className="enquiry-panel">Loading your enquiries…</p> : null}
        {ready && !authenticated ? (
          <p className="enquiry-panel">
            <Link className="btn-primary inline-flex" href="/login?next=/account/enquiries">Sign in</Link>
          </p>
        ) : null}
        {error ? <p className="enquiry-panel text-red-700">{error}</p> : null}
        {rows ? (
          <>
            <section className="enquiry-kpis">
              <article className="enquiry-kpi"><span>Total</span><strong>{summary.total}</strong></article>
              <article className="enquiry-kpi"><span>New</span><strong>{summary.fresh}</strong></article>
              <article className="enquiry-kpi"><span>In progress</span><strong>{summary.progress}</strong></article>
              <article className="enquiry-kpi"><span>Completed / closed</span><strong>{summary.done}</strong></article>
            </section>
            <div className="enquiry-tabs">
              {SERVICE_TABS.map((item) => (
                <button key={item.id} className={`enquiry-tab${tab === item.id ? " is-on" : ""}`} type="button" onClick={() => { setTab(item.id); setVisible(PAGE_SIZE); }}>
                  {item.label}
                </button>
              ))}
            </div>
            <div className="enquiry-toolbar">
              <input className="enquiry-search" value={query} onChange={(event) => { setQuery(event.target.value); setVisible(PAGE_SIZE); }} placeholder="Search reference, package or destination" />
              <select className="enquiry-sort px-3" value={sort} onChange={(event) => setSort(event.target.value)}>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </div>
            {!filtered.length ? <p className="enquiry-panel">No enquiries match this view.</p> : null}
            <div className="enquiry-grid">
              {filtered.slice(0, visible).map((row) => (
                <article key={row.enquiryReference} className="enquiry-card">
                  <div className="enquiry-card-top">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink-muted)]">{serviceLabel(row)}</p>
                      <h2 className="text-lg font-semibold">{row.enquiryReference}</h2>
                    </div>
                    <span className={`enquiry-badge ${statusClass(row.status)}`}>{String(row.status || "").replaceAll("_", " ")}</span>
                  </div>
                  <p className="font-medium">{row.package?.title || serviceLabel(row)}</p>
                  <p className="text-sm text-[var(--ink-muted)]">{row.package?.destinationCity || "Destination not set"}</p>
                  <div className="enquiry-meta text-sm">
                    <span>Departs {formatWhen(row.preferredDepartureDate)}</span>
                    <span>Submitted {formatWhen(row.createdAt)}</span>
                    <span>{row.totalPassengers || 0} travellers</span>
                  </div>
                  <Link className="btn-primary inline-flex w-fit" href={`/account/enquiries/${encodeURIComponent(row.enquiryReference)}`}>View details</Link>
                </article>
              ))}
            </div>
            {visible < filtered.length ? (
              <button className="enquiry-tab" type="button" onClick={() => setVisible((count) => count + PAGE_SIZE)}>Load more</button>
            ) : null}
          </>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
