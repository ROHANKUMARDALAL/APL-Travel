"use client";

import { useEffect, useState } from "react";
import AccountShell from "@/components/account/AccountShell";
import { apiGet } from "@/lib/api/client";
import { getLoginToken } from "@/lib/auth";
import { formatMoney, getActiveMarketId } from "@/data/markets";

const EMPTY = { summary: null, transactions: [], total: 0, page: 1 };

export default function TransactionsClient() {
  const marketId = getActiveMarketId();
  const [query, setQuery] = useState({ q: "", service: "", status: "", from: "", to: "", page: 1 });
  const [data, setData] = useState(EMPTY);
  const [openId, setOpenId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getLoginToken();
    if (!token) return undefined;
    let ignore = false;
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value) params.set(key, String(value));
    });
    setLoading(true);
    apiGet(`/account/transactions?${params.toString()}`, { token })
      .then((payload) => {
        if (!ignore) setData(payload || EMPTY);
      })
      .catch((err) => {
        if (!ignore) setError(err.message || "Transactions could not be loaded");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [query]);

  const summary = data.summary || {};
  const money = (amount) => formatMoney(Number(amount || 0), marketId, summary.currency || "INR");
  const pages = Math.max(1, Math.ceil(Number(data.total || 0) / 8));

  return (
    <AccountShell title="All Transactions">
      <p className="section-copy account-lede">Payments, wallet movements and refunds for this account.</p>
      {error ? <p className="field-error">{error}</p> : null}
      <div className="tx-summary">
        {[
          ["Total paid", money(summary.totalPaid)],
          ["Total credits", money(summary.totalCredits)],
          ["Total debits", money(summary.totalDebits)],
          ["Pending", String(summary.pending || 0)],
          ["Failed", String(summary.failed || 0)],
          ["Wallet balance", money(summary.walletBalance)],
        ].map(([label, value]) => (
          <section key={label} className="tx-stat">
            <p className="field-label">{label}</p>
            <strong>{loading ? "…" : value}</strong>
          </section>
        ))}
      </div>
      <div className="tx-filters">
        <input aria-label="Search transactions" placeholder="Search reference" value={query.q} onChange={(event) => setQuery((current) => ({ ...current, q: event.target.value, page: 1 }))} />
        <select aria-label="Service" value={query.service} onChange={(event) => setQuery((current) => ({ ...current, service: event.target.value, page: 1 }))}>
          <option value="">All services</option>
          {["FLIGHT", "HOTEL", "BUS", "TRANSFER", "INSURANCE", "WALLET"].map((service) => <option key={service}>{service}</option>)}
        </select>
        <select aria-label="Status" value={query.status} onChange={(event) => setQuery((current) => ({ ...current, status: event.target.value, page: 1 }))}>
          <option value="">All statuses</option>
          {["success", "pending", "failed", "refunded", "credit", "debit"].map((status) => <option key={status}>{status}</option>)}
        </select>
        <input aria-label="From date" type="date" value={query.from} onChange={(event) => setQuery((current) => ({ ...current, from: event.target.value, page: 1 }))} />
        <input aria-label="To date" type="date" value={query.to} onChange={(event) => setQuery((current) => ({ ...current, to: event.target.value, page: 1 }))} />
      </div>
      {loading ? <div className="account-loading" /> : null}
      {!loading && (data.transactions || []).length === 0 ? <p className="section-copy">No transactions match these filters.</p> : null}
      {(data.transactions || []).map((row) => (
        <article key={row.id} className="tx-card">
          <header>
            <strong>{row.reference}</strong>
            <span className={`tx-pill is-${row.status}`}>{row.status}</span>
          </header>
          <p>{row.service} · {row.type} · {row.direction === "CREDIT" ? "Credit" : row.direction === "DEBIT" ? "Debit" : "No movement"} · {money(row.amount)}</p>
          <p className="result-card-meta">{row.method} · {row.createdAt ? new Date(row.createdAt).toLocaleString() : ""}</p>
          <button type="button" className="btn-secondary" onClick={() => setOpenId(openId === row.id ? "" : row.id)}>View details</button>
          {openId === row.id ? (
            <div className="tx-detail">
              <p>Booking: {row.bookingReference || "—"}</p>
              <p>Method: {row.method}</p>
              <p>Amount: {money(row.amount)} {row.currency}</p>
            </div>
          ) : null}
        </article>
      ))}
      <div className="tx-filters">
        <button type="button" className="btn-secondary" disabled={query.page <= 1} onClick={() => setQuery((current) => ({ ...current, page: current.page - 1 }))}>Previous</button>
        <span>Page {query.page} of {pages}</span>
        <button type="button" className="btn-secondary" disabled={query.page >= pages} onClick={() => setQuery((current) => ({ ...current, page: current.page + 1 }))}>Next</button>
      </div>
    </AccountShell>
  );
}
