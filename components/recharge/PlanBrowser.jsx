"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import SegmentedToggle from "@/components/recharge/SegmentedToggle";
import CountrySelect from "@/components/recharge/CountrySelect";
import CircleSelect from "@/components/recharge/CircleSelect";

const CHIPS = [
  { id: "ALL", label: "All Plans" },
  { id: "POPULAR", label: "Popular" },
  { id: "DATA", label: "Data Packs" },
  { id: "UNLIMITED", label: "Unlimited" },
  { id: "LONG", label: "Long Validity" },
  { id: "TALKTIME", label: "Talktime" },
];

function money(amount, currency = "INR") {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(amount) || 0);
}

export default function PlanBrowser({
  form,
  countries,
  operator,
  circles,
  plans,
  history,
  busy,
  notice,
  onLineType,
  onCountry,
  onMobile,
  onChangeOperator,
  onCircle,
  onSelectPlan,
  onClearPlan,
  onReview,
}) {
  const [tab, setTab] = useState("plans");
  const [query, setQuery] = useState("");
  const [chip, setChip] = useState("ALL");
  useEffect(() => {
    setChip("ALL");
    setQuery("");
  }, [form.operator, form.lineType, form.country, form.circle]);
  const selected = plans.find((plan) => plan.id === form.planId);
  const country = countries.find((row) => row.iso === form.country);
  const region = (circles || []).find((row) => row.code === form.circle);
  const listRef = useRef(null);
  const [moreBelow, setMoreBelow] = useState(false);
  const recent = (history || []).filter((row) => !row.category || row.category === "MOBILE");
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return plans.filter((plan) => {
      if (chip !== "ALL" && plan.category !== chip) return false;
      if (!needle) return true;
      return [plan.amount, plan.validity, plan.data, plan.calls, plan.sms, plan.description]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [plans, query, chip]);

  useEffect(() => {
    const node = listRef.current;
    if (!node) return undefined;
    function measure() {
      setMoreBelow(node.scrollHeight - node.scrollTop - node.clientHeight > 8);
    }
    measure();
    node.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      node.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [visible, busy, tab]);

  return (
    <div className="rch-desk">
      <aside className="rch-desk-side">
        <h2 className="rch-kicker">Recharge details</h2>
        <SegmentedToggle
          label="Prepaid or postpaid"
          value={form.lineType}
          onChange={onLineType}
          options={[{ value: "PREPAID", label: "Prepaid" }, { value: "POSTPAID", label: "Postpaid" }]}
        />
        <div className="rch-phone-line">
          <CountrySelect countries={countries} value={form.country} onChange={onCountry} />
          <label className="rch-label">
            Mobile number
            <span className="rch-dial-field">
              <span className="rch-dial">{country?.dialCode || form.dialCode || "+91"}</span>
              <input
                className="rch-input"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                aria-label="Mobile number"
                value={form.mobile}
                onChange={(event) => onMobile(event.target.value.replace(/[^\d\s]/g, ""))}
              />
            </span>
          </label>
        </div>
        {operator ? (
          <article className="rch-op-card">
            <span className="rch-op-mark" aria-hidden="true">{operator.mark || operator.name.slice(0, 1)}</span>
            <div>
              <p className="rch-op-name">{operator.name}</p>
              <p className="rch-hint">{operator.note || "Demonstration operator. No live recharge connection."}</p>
            </div>
            <button type="button" className="rch-link" onClick={onChangeOperator}>Change Operator</button>
          </article>
        ) : null}
        {circles?.length ? (
          <CircleSelect circles={circles} value={form.circle} onChange={onCircle} disabled={!operator} />
        ) : null}
        <article className="rch-selected">
          <p className="rch-kicker">Selected plan</p>
          {selected ? (
            <>
              <p className="rch-amount">{money(selected.amount, selected.currency)}</p>
              <p>{selected.validity} · {selected.data}</p>
              <p className="rch-hint">{selected.calls}. {selected.sms}. {selected.description}</p>
              <button type="button" className="rch-link" onClick={onClearPlan}>Change Plan</button>
            </>
          ) : (
            <p className="rch-hint">Choose a demonstration plan to continue.</p>
          )}
        </article>
        <p className="rch-label">Recharge amount <strong>{selected ? money(selected.amount, selected.currency) : "—"}</strong></p>
        <button type="button" className="rch-btn" disabled={!selected || busy === "review"} onClick={onReview}>
          {busy === "review" ? "Checking amount…" : "Continue to Review"}
        </button>
      </aside>
      <section className="rch-desk-main" aria-label="Recharge plans">
        <div className="rch-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tab === "plans"} className={tab === "plans" ? "is-on" : ""} onClick={() => setTab("plans")}>Browse Plans</button>
          <button type="button" role="tab" aria-selected={tab === "recent"} className={tab === "recent" ? "is-on" : ""} onClick={() => setTab("recent")}>Recent Recharges</button>
        </div>
        {tab === "recent" ? (
          recent.length ? (
            <ul className="rch-recent">
              {recent.map((row) => (
                <li key={row.reference}>
                  <span>{row.providerName} · {row.accountMasked}</span>
                  <span>{row.status} · {money(row.amount, row.currency)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rch-empty">No recharge history is available for this sign-in.</p>
          )
        ) : (
          <>
            <p className="rch-summary">
              {operator?.name || "Operator"} · {region?.name || country?.name || form.country} {country?.dialCode || ""} · {form.lineType === "POSTPAID" ? "Postpaid" : "Prepaid"}
            </p>
            <p className="rch-demo-note">{form.lineType === "POSTPAID" ? "Demonstration bill options. No real bill was fetched." : notice || "Fictional demonstration plans. Not current operator tariffs."}</p>
            <label className="rch-label">
              Search plans
              <input className="rch-input" value={query} placeholder="Search amount, data, or validity" onChange={(event) => setQuery(event.target.value)} />
            </label>
            <div className="rch-chips" role="tablist" aria-label="Plan categories">
              {CHIPS.map((item) => (
                <button key={item.id} type="button" className={chip === item.id ? "is-on" : ""} onClick={() => setChip(item.id)}>{item.label}</button>
              ))}
            </div>
            {busy === "plans" ? <p className="rch-empty">Loading demonstration plans…</p> : null}
            {busy !== "plans" && !visible.length ? <p className="rch-empty">{plans.length ? "No plans match that search." : "No demonstration plans are configured for this operator. This is not a live recharge connection."}</p> : null}
            <div className={`rch-plan-scroll${moreBelow ? " has-more" : ""}`}>
              <div className="rch-plan-list" ref={listRef}>
                {visible.map((plan) => (
                  <article key={plan.id} className={`rch-plan${form.planId === plan.id ? " is-selected" : ""}`}>
                    <div>
                      <p className="rch-amount">{money(plan.amount, plan.currency)}</p>
                      <p className="rch-plan-meta">{plan.category ? <span className="rch-badge">{plan.category}</span> : null}{plan.validity}</p>
                    </div>
                    <div>
                      <p>{plan.data}</p>
                      <p className="rch-hint">{plan.calls} · {plan.sms}</p>
                    </div>
                    <button type="button" className="rch-btn" onClick={() => onSelectPlan(plan)}>
                      {form.planId === plan.id ? "Selected" : "Select Plan"}
                    </button>
                  </article>
                ))}
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
