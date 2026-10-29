"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AccountShell from "@/components/account/AccountShell";
import { apiPost } from "@/lib/api/client";
import { getLoginToken } from "@/lib/auth";
import { formatMoney, getActiveMarketId } from "@/data/markets";
import { displayTransactionType, loadWallet } from "@/lib/wallet";

const QUICK = [500, 1000, 2000, 5000];
const METHODS = [
  { id: "UPI", label: "UPI" },
  { id: "CARD", label: "Card" },
  { id: "NETBANKING", label: "Net Banking" },
];

function money(amount, marketId, currency) {
  return formatMoney(Number(amount || 0), marketId, currency || "INR");
}

export default function WalletClient() {
  const marketId = getActiveMarketId();
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let ignore = false;
    loadWallet(marketId)
      .then((data) => {
        if (!ignore) {
          setSummary(data);
          setError("");
        }
      })
      .catch((err) => {
        if (!ignore) setError(err instanceof Error ? err.message : "Wallet could not be loaded");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [marketId, reload]);

  const currency = summary?.currency || "INR";

  return (
    <AccountShell title="My Wallet">
      <p className="section-copy account-lede">This balance belongs to your customer account on this travel website. It is separate from the agency wallet.</p>
      {error ? <p className="field-error">{error}</p> : null}
      <div className="wallet-dash">
        {loading ? (
          <>
            <div className="wallet-skeleton wallet-skeleton-hero" />
            <div className="wallet-skeleton" />
            <div className="wallet-skeleton" />
          </>
        ) : (
          <>
            <section className="wallet-hero">
              <p>Available wallet balance</p>
              <strong>{summary?.availableLabel || money(0, marketId, currency)}</strong>
              <button type="button" className="wallet-add" onClick={() => setOpen(true)}>Add Money</button>
            </section>
            <section className="wallet-mini is-credit">
              <p>Total credits</p>
              <strong>{money(summary?.totalCredits, marketId, currency)}</strong>
            </section>
            <section className="wallet-mini is-debit">
              <p>Total debits</p>
              <strong>{money(summary?.totalDebits, marketId, currency)}</strong>
            </section>
          </>
        )}
      </div>
      <section className="checkout-section account-panel">
        <div className="wallet-panel-head">
          <h2 className="checkout-section-title">Recent transactions</h2>
          <Link href="/account/transactions">All transactions</Link>
        </div>
        {!loading && (summary?.transactions || []).length === 0 ? <p className="section-copy">No wallet activity yet.</p> : null}
        <ul className="wallet-tx-list">
          {(summary?.transactions || []).map((tx) => (
            <li key={tx.id} className="wallet-tx-item">
              <div>
                <p className="wallet-tx-desc">{displayTransactionType(tx)}</p>
                <p className="result-card-meta">{tx.reference} · {tx.date ? new Date(tx.date).toLocaleString() : ""}</p>
              </div>
              <div className="wallet-tx-side">
                <span className={`tx-pill is-${tx.status || "success"}`}>{tx.status || "success"}</span>
                <p className="wallet-tx-amount">{tx.signedLabel}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
      {open ? (
        <AddMoneyModal
          marketId={marketId}
          currency={currency}
          onClose={() => setOpen(false)}
          onDone={() => {
            setOpen(false);
            setLoading(true);
            setReload((value) => value + 1);
          }}
        />
      ) : null}
    </AccountShell>
  );
}

function AddMoneyModal({ marketId, currency, onClose, onDone }) {
  const [amount, setAmount] = useState("2000");
  const [method, setMethod] = useState("UPI");
  const [quote, setQuote] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    const token = getLoginToken();
    if (!token || !amount) return undefined;
    let ignore = false;
    const timer = setTimeout(() => {
      apiPost("/account/wallet/topup/quote", { amount: Number(amount), method }, { token })
        .then((next) => {
          if (!ignore) {
            setQuote(next);
            setError("");
          }
        })
        .catch((err) => {
          if (!ignore) {
            setQuote(null);
            setError(err.message || "Quote failed");
          }
        });
    }, 250);
    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [amount, method]);

  async function pay() {
    const token = getLoginToken();
    if (!token || !quote || busy) return;
    setBusy(true);
    setError("");
    try {
      const created = await apiPost("/account/wallet/topup", {
        amount: quote.paymentAmount,
        method: quote.method,
        feeAmount: quote.feeAmount,
        netAmount: quote.netCredit,
        idempotencyKey: crypto.randomUUID(),
      }, { token });
      const confirmed = await apiPost(`/account/wallet/topup/${created.paymentRef}/confirm`, { demoOutcome: "SUCCESS" }, { token });
      setReceipt(confirmed);
    } catch (err) {
      setError(err.message || "Payment could not be completed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="wallet-modal-backdrop" onMouseDown={onClose}>
      <div className="wallet-modal" role="dialog" aria-modal="true" aria-label="Add money" onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <h2>Add money</h2>
          <button type="button" onClick={receipt ? onDone : onClose} aria-label="Close">×</button>
        </header>
        <p className="wallet-demo">DEMO top-up. A mock payment result is verified on the server. No live payment is taken.</p>
        {receipt ? (
          <div className="wallet-receipt">
            <p>Payment verified</p>
            <strong>{money(receipt.netCredit, marketId, currency)} credited</strong>
            <p>Reference {receipt.paymentRef}</p>
            <p>Fee {money(receipt.feeAmount, marketId, currency)} · Paid {money(receipt.paymentAmount, marketId, currency)}</p>
            <button type="button" className="home-search-btn" onClick={onDone}>Done</button>
          </div>
        ) : (
          <>
            <label className="field-label" htmlFor="wallet-amount">Amount</label>
            <input id="wallet-amount" className="field-input" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} />
            <div className="wallet-quick">
              {QUICK.map((value) => (
                <button key={value} type="button" className={Number(amount) === value ? "is-active" : ""} onClick={() => setAmount(String(value))}>{money(value, marketId, currency)}</button>
              ))}
            </div>
            <div className="wallet-methods" role="radiogroup" aria-label="Payment method">
              {METHODS.map((item) => (
                <button key={item.id} type="button" role="radio" aria-checked={method === item.id} className={method === item.id ? "is-active" : ""} onClick={() => setMethod(item.id)}>{item.label}</button>
              ))}
            </div>
            {quote ? (
              <dl className="wallet-breakdown">
                <div><dt>Payment amount</dt><dd>{money(quote.paymentAmount, marketId, currency)}</dd></div>
                <div><dt>{quote.method === "CARD" ? "Card processing fee" : "Processing fee"}</dt><dd>{money(quote.feeAmount, marketId, currency)}</dd></div>
                <div><dt>Net wallet credit</dt><dd>{money(quote.netCredit, marketId, currency)}</dd></div>
              </dl>
            ) : null}
            {error ? <p className="field-error">{error}</p> : null}
            <button type="button" className="home-search-btn" disabled={!quote || busy || quote.demoTopUp === false} onClick={pay}>
              {busy ? "Verifying payment…" : "Continue to payment"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
