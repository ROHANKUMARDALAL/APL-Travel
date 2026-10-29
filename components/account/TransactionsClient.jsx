"use client";

import { useEffect, useState } from "react";
import AccountShell from "@/components/account/AccountShell";
import DatePicker from "@/components/ui/DatePicker";
import PremiumSelect from "@/components/ui/PremiumSelect";
import { apiGet } from "@/lib/api/client";
import { getLoginToken } from "@/lib/auth";
import { formatMoney, getActiveMarketId } from "@/data/markets";
import { displayTransactionType } from "@/lib/wallet";

const SERVICES = [
  { value: "", label: "All services" },
  { value: "FLIGHT", label: "Flight" },
  { value: "HOTEL", label: "Hotel" },
  { value: "BUS", label: "Bus" },
  { value: "TRANSFER", label: "Cab" },
  { value: "INSURANCE", label: "Insurance" },
  { value: "WALLET", label: "Wallet" },
];
const STATUSES = [
  { value: "", label: "All statuses" },
  { value: "success", label: "Success" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
  { value: "credit", label: "Credits" },
  { value: "debit", label: "Debits" },
];

function parseIso(value) {
  if (!value) return null;
  const [year, month, day] = String(value).split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function toIso(date) {
  if (!date) return "";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

const EMPTY = { summary: null, transactions: [], total: 0, page: 1 };

export default function TransactionsClient() {
  const marketId = getActiveMarketId();
  const [query, setQuery] = useState({ q: "", service: "", status: "", from: "", to: "", page: 1 });
  const [data, setData] = useState(EMPTY);
  const [openId, setOpenId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    const token = getLoginToken();
    if (!token) return undefined;
    let ignore = false;
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value) params.set(key, String(value));
    });
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
      <div className="tx-tabs" role="tablist" aria-label="Transaction type">
        {[
          ["", "All"],
          ["credit", "Credits"],
          ["debit", "Debits"],
          ["pending", "Pending"],
          ["failed", "Failed"],
        ].map(([id, label]) => (
          <button key={label} type="button" role="tab" aria-selected={query.status === id} className={query.status === id ? "is-active" : ""} onClick={() => setQuery((current) => ({ ...current, status: id, page: 1 }))}>{label}</button>
        ))}
      </div>
      <button type="button" className="tx-filter-toggle" aria-expanded={filtersOpen} onClick={() => setFiltersOpen((open) => !open)}>
        {filtersOpen ? "Hide filters" : "Filters"}
      </button>
      <div className={`tx-toolbar ${filtersOpen ? "is-open" : ""}`}>
        <label>
          <span className="field-label">Search reference</span>
          <input className="field-input" aria-label="Search transactions" placeholder="Reference" value={query.q} onChange={(event) => setQuery((current) => ({ ...current, q: event.target.value, page: 1 }))} />
        </label>
        <PremiumSelect label="Service" value={query.service} options={SERVICES} onChange={(service) => setQuery((current) => ({ ...current, service, page: 1 }))} />
        <PremiumSelect label="Status" value={query.status} options={STATUSES} onChange={(status) => setQuery((current) => ({ ...current, status, page: 1 }))} />
        <DatePicker
          id="tx-from"
          label="From date"
          value={parseIso(query.from)}
          maxDate={parseIso(query.to)}
          clearable
          compact
          onChange={(date) => setQuery((current) => {
            const from = toIso(date);
            const to = current.to && from && from > current.to ? from : current.to;
            return { ...current, from, to, page: 1 };
          })}
        />
        <DatePicker
          id="tx-to"
          label="To date"
          value={parseIso(query.to)}
          minDate={parseIso(query.from)}
          clearable
          compact
          onChange={(date) => setQuery((current) => {
            const to = toIso(date);
            const from = current.from && to && to < current.from ? to : current.from;
            return { ...current, from, to, page: 1 };
          })}
        />
        <button type="button" className="btn-secondary tx-clear" onClick={() => setQuery({ q: "", service: "", status: "", from: "", to: "", page: 1 })}>Clear filters</button>
      </div>
      {loading ? <div className="account-loading" /> : null}
      {!loading && (data.transactions || []).length === 0 ? <p className="section-copy">No transactions match these filters.</p> : null}
      {(data.transactions || []).map((row) => (
        <article key={row.id} className="tx-card">
          <header>
            <strong>{row.reference}</strong>
            <span className={`tx-pill is-${row.status}`}>{row.status}</span>
          </header>
          <p>{row.service} · {displayTransactionType(row)} · {row.direction === "CREDIT" ? "Credit" : row.direction === "DEBIT" ? "Debit" : "No movement"} · {money(row.amount)}</p>
          <p className="result-card-meta">{row.method}{Number(row.feeAmount) > 0 ? ` · Fee ${money(row.feeAmount)}` : ""} · {row.createdAt ? new Date(row.createdAt).toLocaleString() : ""}</p>
          <button type="button" className="btn-secondary" onClick={() => setOpenId(row.id)}>View details</button>
        </article>
      ))}
      {openId ? (
        <TransactionDetail
          row={(data.transactions || []).find((item) => item.id === openId)}
          money={money}
          onClose={() => setOpenId("")}
        />
      ) : null}
      <div className="tx-filters">
        <button type="button" className="btn-secondary" disabled={query.page <= 1} onClick={() => setQuery((current) => ({ ...current, page: current.page - 1 }))}>Previous</button>
        <span>Page {query.page} of {pages}</span>
        <button type="button" className="btn-secondary" disabled={query.page >= pages} onClick={() => setQuery((current) => ({ ...current, page: current.page + 1 }))}>Next</button>
      </div>
    </AccountShell>
  );
}

function TransactionDetail({ row, money, onClose }) {
  if (!row) return null;
  function download() {
    const lines = [
      "Harbor Holidays wallet receipt",
      `Reference: ${row.reference}`,
      `Type: ${displayTransactionType(row)}`,
      `Status: ${row.status}`,
      `Direction: ${row.direction || "none"}`,
      `Amount: ${row.amount} ${row.currency || "INR"}`,
      `Fee: ${row.feeAmount || 0}`,
      `Method: ${row.method || ""}`,
      `Booking: ${row.bookingReference || ""}`,
      `Date: ${row.createdAt || ""}`,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${row.reference || "transaction"}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="wallet-modal-backdrop" onMouseDown={onClose}>
      <div className="wallet-modal" role="dialog" aria-modal="true" aria-label="Transaction details" onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <h2>{row.reference}</h2>
          <button type="button" onClick={onClose} aria-label="Close">×</button>
        </header>
        <dl className="wallet-breakdown">
          <div><dt>Type</dt><dd>{displayTransactionType(row)}</dd></div>
          <div><dt>Status</dt><dd>{row.status}</dd></div>
          <div><dt>Amount</dt><dd>{money(row.amount)}</dd></div>
          <div><dt>Direction</dt><dd>{row.direction === "CREDIT" ? "Credit" : row.direction === "DEBIT" ? "Debit" : "No movement"}</dd></div>
          <div><dt>Method</dt><dd>{row.method || "—"}</dd></div>
          <div><dt>Processing fee</dt><dd>{money(row.feeAmount || 0)}</dd></div>
          <div><dt>Booking</dt><dd>{row.bookingReference || "—"}</dd></div>
          <div><dt>Date</dt><dd>{row.createdAt ? new Date(row.createdAt).toLocaleString() : "—"}</dd></div>
        </dl>
        {row.status === "success" || row.status === "refunded" ? <button type="button" className="btn-secondary" onClick={download}>Download receipt</button> : null}
      </div>
    </div>
  );
}
