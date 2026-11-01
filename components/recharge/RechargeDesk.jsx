"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PremiumSelect from "@/components/ui/PremiumSelect";
import RechargeServiceCard from "@/components/recharge/RechargeServiceCard";
import SegmentedToggle from "@/components/recharge/SegmentedToggle";
import RechargeDiscover from "@/components/recharge/RechargeDiscover";
import CountrySelect from "@/components/recharge/CountrySelect";
import CircleSelect from "@/components/recharge/CircleSelect";
import PlanBrowser from "@/components/recharge/PlanBrowser";
import { phoneMessage } from "@/components/recharge/phone";
import { apiGet, apiPost } from "@/lib/api/client";
import { getLoginToken } from "@/lib/auth";
import { quotePaymentFee } from "@/lib/paymentFee";
import { loadWallet } from "@/lib/wallet";
import { useAuth } from "@/components/auth/useAuth";

const CATEGORIES = [
  { id: "MOBILE", label: "Mobile Recharge", description: "Prepaid plans and postpaid test bills.", tone: "teal", mark: "☎" },
  { id: "BROADBAND", label: "Broadband", description: "Fiber and internet test bills.", tone: "sky", mark: "⌁" },
  { id: "ELECTRICITY", label: "Electricity", description: "Indian distribution companies.", tone: "amber", mark: "⚡" },
  { id: "WATER", label: "Water Bills", description: "Demo form. Billing is not connected.", tone: "cyan", mark: "💧" },
  { id: "GAS", label: "Piped Gas / LPG", description: "Demonstration gas bills.", tone: "rose", mark: "🔥" },
  { id: "DTH", label: "DTH", description: "Demo only. No operator catalogue.", tone: "violet", mark: "📺" },
  { id: "METRO", label: "Metro Card Recharge", description: "Existing demonstration recharge.", tone: "indigo", mark: "🚇" },
];

const WATER_PROVIDERS = [
  { state: "Delhi", city: "New Delhi", code: "DJB", name: "Delhi Jal Board" },
  { state: "Maharashtra", city: "Mumbai", code: "MCGM-WATER", name: "Brihanmumbai Municipal Corporation" },
  { state: "Karnataka", city: "Bengaluru", code: "BWSSB", name: "Bangalore Water Supply and Sewerage Board" },
  { state: "Tamil Nadu", city: "Chennai", code: "CMWSSB", name: "Chennai Metro Water" },
  { state: "Telangana", city: "Hyderabad", code: "HMWSSB", name: "Hyderabad Metropolitan Water Supply" },
];

const emptyForm = {
  lineType: "PREPAID",
  country: "IN",
  dialCode: "+91",
  mobile: "",
  operator: "",
  circle: "",
  planId: "",
  provider: "",
  state: "",
  account: "",
  amount: "",
};

function money(amount, currency = "INR") {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(amount) || 0);
}

export default function RechargeDesk() {
  const { ready, authenticated } = useAuth();
  const [meta, setMeta] = useState(null);
  const [metaError, setMetaError] = useState("");
  const [category, setCategory] = useState("MOBILE");
  const [drafts, setDrafts] = useState({});
  const [form, setForm] = useState(emptyForm);
  const [fieldError, setFieldError] = useState("");
  const [waterReady, setWaterReady] = useState(false);
  const [dthReady, setDthReady] = useState(false);
  const [gasCategory, setGasCategory] = useState("");
  const payLock = useRef(false);
  const [operatorQuery, setOperatorQuery] = useState("");
  const [broadbandQuery, setBroadbandQuery] = useState("");
  const [providerQuery, setProviderQuery] = useState("");
  const [plans, setPlans] = useState([]);
  const [browse, setBrowse] = useState(false);
  const [planNotice, setPlanNotice] = useState("");
  const planReq = useRef(0);
  const planKey = useRef("");
  const planInflight = useRef(false);
  const [bill, setBill] = useState(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState("details");
  const [lock, setLock] = useState(null);
  const [cardLast4, setCardLast4] = useState("");
  const [payMethod, setPayMethod] = useState("UPI");
  const [receipt, setReceipt] = useState(null);
  const [walletBalance, setWalletBalance] = useState(null);
  const [history, setHistory] = useState([]);
  const [idempotencyKey, setIdempotencyKey] = useState("");

  useEffect(() => {
    if (!authenticated || (step !== "pay" && step !== "review")) return undefined;
    let ignore = false;
    loadWallet()
      .then((wallet) => {
        if (!ignore) setWalletBalance(Number(wallet.balance) || 0);
      })
      .catch(() => {
        if (!ignore) setWalletBalance(null);
      });
    return () => {
      ignore = true;
    };
  }, [authenticated, step, receipt]);

  useEffect(() => {
    let ignore = false;
    apiGet("/recharge/meta")
      .then((data) => {
        if (!ignore) setMeta(data);
      })
      .catch((err) => {
        if (!ignore) setMetaError(err instanceof Error ? err.message : "Recharge is unavailable");
      });
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!ready || !authenticated) return undefined;
    const token = getLoginToken();
    if (!token) return undefined;
    let ignore = false;
    apiGet("/recharge/history", { token })
      .then((data) => {
        if (!ignore) setHistory(data.items || []);
      })
      .catch(() => {
        if (!ignore) setHistory([]);
      });
    return () => {
      ignore = true;
    };
  }, [ready, authenticated, receipt]);

  const countries = meta?.countries || [];
  const operators = (meta?.mobileOperators?.[form.country] || [])
    .filter((row) => !row.lineTypes || row.lineTypes.includes(form.lineType))
    .filter((row) => row.name.toLowerCase().includes(operatorQuery.trim().toLowerCase()));
  const electricity = (meta?.electricity || []).filter((row) => !form.state || row.state === form.state);
  const filteredProviders = electricity.filter((row) => row.name.toLowerCase().includes(providerQuery.trim().toLowerCase()));
  const broadband = (meta?.broadband || []).filter((row) => `${row.name} ${row.code}`.toLowerCase().includes(broadbandQuery.trim().toLowerCase()));
  const gasProviders = (meta?.gas || []).filter((row) => !gasCategory || row.category === gasCategory);
  const gasCategories = [...new Set((meta?.gas || []).map((row) => row.category).filter(Boolean))];
  const selectedGas = gasProviders.find((row) => row.code === form.provider) || (meta?.gas || []).find((row) => row.code === form.provider);
  const waterStates = [...new Set(WATER_PROVIDERS.map((row) => `${row.state} · ${row.city}`))];
  const waterProviders = WATER_PROVIDERS.filter((row) => !form.state || `${row.state} · ${row.city}` === form.state);
  const selectedCountry = countries.find((row) => row.iso === form.country);

  function circlesFor(iso, operatorCode) {
    return (meta?.circles?.[iso] || []).filter((row) => !operatorCode || (row.operators || []).includes(operatorCode));
  }

  function chooseCountry(iso) {
    const next = countries.find((row) => row.iso === iso);
    const allowed = meta?.mobileOperators?.[iso] || [];
    const operator = allowed.some((row) => row.code === form.operator) ? form.operator : "";
    const circle = circlesFor(iso, operator).some((row) => row.code === form.circle) ? form.circle : "";
    update({ country: iso, dialCode: next?.dialCode || "", operator, circle });
    if (form.mobile) {
      const message = phoneMessage(iso, form.mobile);
      if (message) setFieldError(message);
    }
  }

  function update(patch, keepResults = false) {
    const next = { ...form, ...patch };
    const identityChanged = ["country", "operator", "lineType", "mobile", "circle"].some((key) => key in patch && patch[key] !== form[key]);
    if (identityChanged && !("planId" in patch)) {
      next.planId = "";
      next.amount = "";
    }
    setForm(next);
    const catalogueChanged = ["country", "operator", "lineType", "circle"].some((key) => key in patch && patch[key] !== form[key]);
    if (catalogueChanged) {
      setPlans([]);
      setBill(null);
      if (browse && next.operator && (!circlesFor(next.country, next.operator).length || next.circle)) loadPlans(next);
      else setBrowse(false);
    } else if (!keepResults) {
      setBill(null);
      setPlans([]);
      setBrowse(false);
    }
    setWaterReady(false);
    setDthReady(false);
    setFieldError("");
    setError("");
    setStep("details");
    setLock(null);
  }

  function openCategory(next) {
    setDrafts((current) => ({ ...current, [category]: form }));
    setCategory(next);
    setForm(drafts[next] || { ...emptyForm, country: "IN" });
    setPlans([]);
    setBrowse(false);
    setBill(null);
    setWaterReady(false);
    setDthReady(false);
    setGasCategory("");
    setFieldError("");
    setError("");
    setStep("details");
    setLock(null);
    setReceipt(null);
    setIdempotencyKey("");
  }

  function continueCategory() {
    setFieldError("");
    if (category === "MOBILE") {
      const message = phoneMessage(form.country, form.mobile);
      if (message) return setFieldError(message);
      if (!form.operator) {
        const available = meta?.mobileOperators?.[form.country] || [];
        return setFieldError(available.length ? "Choose an operator." : "No verified operators are configured for this country.");
      }
      if (circlesFor(form.country, form.operator).length && !form.circle) return setFieldError("Choose a region or circle.");
      return loadPlans();
    }
    if (category === "BROADBAND") {
      if (!form.provider) return setFieldError("Choose a broadband provider.");
      if (String(form.account).trim().length < 4) return setFieldError("Enter the customer ID or registered mobile.");
      return fetchBill();
    }
    if (category === "ELECTRICITY") {
      if (!form.state) return setFieldError("Choose a state.");
      if (!form.provider) return setFieldError("Choose an electricity board.");
      if (String(form.account).trim().length < 4) return setFieldError("Enter the consumer number.");
      return fetchBill();
    }
    if (category === "WATER") {
      if (!form.state) return setFieldError("Choose a state or city.");
      if (!form.provider) return setFieldError("Choose a water board.");
      if (String(form.account).trim().length < 4) return setFieldError("Enter the consumer or connection number.");
      setWaterReady(true);
      return;
    }
    if (category === "GAS") {
      if (!form.provider) return setFieldError("Choose a gas provider.");
      if (String(form.account).trim().length < 4) return setFieldError("Enter the consumer or account number.");
      return fetchBill();
    }
    if (category === "DTH") {
      if (String(form.account).trim().length < 4) return setFieldError("Enter the subscriber or customer ID.");
      setDthReady(true);
      return;
    }
    if (category === "METRO") {
      if (!form.provider) return setFieldError("Choose a metro operator.");
      if (String(form.account).trim().length < 4) return setFieldError("Enter the card number.");
      if (!Number.isFinite(Number(form.amount)) || Number(form.amount) <= 0) return setFieldError("Enter a recharge amount.");
      return review();
    }
  }

  async function loadPlans(source = form) {
    const key = `${source.country}|${source.operator}|${source.lineType}|${source.circle || ""}`;
    if (planInflight.current && planKey.current === key) return;
    planKey.current = key;
    planInflight.current = true;
    const requestId = planReq.current + 1;
    planReq.current = requestId;
    setError("");
    setBusy("plans");
    try {
      const data = await apiPost("/recharge/plans", {
        country: source.country,
        operator: source.operator,
        lineType: source.lineType,
        circle: source.circle || undefined,
      });
      if (requestId !== planReq.current) return;
      setPlans(data.plans || []);
      setPlanNotice(data.notice || "");
      setBrowse(true);
    } catch (err) {
      if (requestId !== planReq.current) return;
      setBrowse(false);
      setError(err instanceof Error ? err.message : "Plans could not be loaded");
    } finally {
      if (requestId === planReq.current) {
        planInflight.current = false;
        setBusy("");
      }
    }
  }

  async function fetchBill() {
    setError("");
    setBusy("bill");
    try {
      const data = await apiPost("/recharge/bill", {
        category,
        country: form.country,
        mobile: form.mobile,
        operator: form.operator,
        lineType: form.lineType,
        provider: form.provider,
        state: form.state,
        account: form.account,
      });
      setBill(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The test bill could not be fetched");
    } finally {
      setBusy("");
    }
  }

  async function review() {
    setError("");
    const key = idempotencyKey || (crypto.randomUUID ? crypto.randomUUID() : `rch-${Date.now()}`);
    setIdempotencyKey(key);
    setBusy("review");
    try {
      const data = await apiPost("/recharge/validate", {
        ...form,
        category,
        amount: category === "METRO" || category === "MOBILE" ? Number(form.amount) : bill?.amount,
        planId: form.planId,
        idempotencyKey: key,
      });
      setLock(data);
      setStep("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "The amount could not be locked");
    } finally {
      setBusy("");
    }
  }

  async function pay() {
    if (payLock.current || busy === "pay") return;
    const token = getLoginToken();
    if (!token) {
      setError("Sign in to complete this demonstration payment.");
      return;
    }
    payLock.current = true;
    setBusy("pay");
    setError("");
    try {
      const quoted = quotePaymentFee(lock.amount, payMethod);
      const data = await apiPost("/recharge/pay", {
        idempotencyKey,
        amount: quoted.totalAmount,
        paymentMethod: payMethod,
        feeAmount: quoted.feeAmount,
        cardLast4,
      }, { token });
      setReceipt(data);
      setStep("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment was not completed");
    } finally {
      payLock.current = false;
      setBusy("");
    }
  }

  const selectedPlan = plans.find((plan) => plan.id === form.planId);

  return (
    <>
      <Header />
      <main className="rch-page">
        <section className="rch-wrap">
          <header className="rch-hero">
            <div>
              <p className="rch-kicker">Bill payments</p>
              <h1>Recharge &amp; Bill Payments</h1>
              <p className="rch-lead">Manage your recharges and utility payments in one place.</p>
              <p className="rch-note">Demonstration only. No operator, utility, or metro balance is updated.</p>
            </div>
            <div className="rch-hero-art" aria-hidden="true">
              <span className="rch-tone-1">₹</span>
              <span className="rch-tone-2">☎</span>
              <span className="rch-tone-3">⚡</span>
              <span className="rch-tone-5">🚇</span>
            </div>
          </header>
          {metaError ? (
            <div className="rch-alert">{metaError}</div>
          ) : null}
          {!meta && !metaError ? (
            <div className="rch-grid">
              {CATEGORIES.map((item) => <div key={item.id} className="rch-skeleton" />)}
            </div>
          ) : null}
          {meta ? (
            <>
              <div className="rch-grid" role="tablist" aria-label="Recharge categories">
                {CATEGORIES.map((item, index) => (
                  <RechargeServiceCard
                    key={item.id}
                    item={item}
                    tone={(index % 5) + 1}
                    selected={category === item.id}
                    onSelect={() => openCategory(item.id)}
                  />
                ))}
              </div>

              {step === "details" ? (
                <div className="rch-panel" key={category}>
                  {category === "MOBILE" ? (
                    browse ? (
                      <PlanBrowser
                        form={form}
                        countries={countries}
                        operator={(meta?.mobileOperators?.[form.country] || []).find((row) => row.code === form.operator)}
                        circles={circlesFor(form.country, form.operator)}
                        plans={plans}
                        history={history}
                        busy={busy}
                        notice={planNotice}
                        onLineType={(lineType) => {
                          const allowed = (meta?.mobileOperators?.[form.country] || []).filter((row) => !row.lineTypes || row.lineTypes.includes(lineType));
                          update({ lineType, operator: allowed.some((row) => row.code === form.operator) ? form.operator : "" });
                        }}
                        onCountry={chooseCountry}
                        onMobile={(mobile) => update({ mobile }, true)}
                        onChangeOperator={() => update({ operator: "", circle: "" })}
                        onCircle={(circle) => update({ circle })}
                        onSelectPlan={(plan) => update({ planId: plan.id, amount: String(plan.amount) }, true)}
                        onClearPlan={() => update({ planId: "", amount: "" }, true)}
                        onReview={review}
                      />
                    ) : (
                    <div className="rch-form">
                      <SegmentedToggle
                        label="Prepaid or postpaid"
                        value={form.lineType}
                        onChange={(lineType) => {
                          const allowed = (meta?.mobileOperators?.[form.country] || []).filter((row) => !row.lineTypes || row.lineTypes.includes(lineType));
                          update({ lineType, operator: allowed.some((row) => row.code === form.operator) ? form.operator : "" });
                        }}
                        options={[{ value: "PREPAID", label: "Prepaid" }, { value: "POSTPAID", label: "Postpaid" }]}
                      />
                      <div className="rch-phone-line">
                        <CountrySelect countries={countries} value={form.country} onChange={chooseCountry} />
                        <label className="rch-label">
                          Mobile number
                          <span className="rch-dial-field">
                            <span className="rch-dial">{selectedCountry?.dialCode || form.dialCode || "+91"}</span>
                            <input
                              className="rch-input"
                              type="tel"
                              inputMode="numeric"
                              autoComplete="tel-national"
                              aria-label="Mobile number"
                              value={form.mobile}
                              onChange={(event) => update({ mobile: event.target.value.replace(/[^\d\s]/g, "") }, true)}
                            />
                          </span>
                        </label>
                      </div>
                      {form.operator ? (
                        <article className="rch-op-card rch-span">
                          <span className="rch-op-mark" aria-hidden="true">{operators.find((row) => row.code === form.operator)?.mark || (meta?.mobileOperators?.[form.country] || []).find((row) => row.code === form.operator)?.mark || "•"}</span>
                          <div>
                            <p className="rch-op-name">{(meta?.mobileOperators?.[form.country] || []).find((row) => row.code === form.operator)?.name}</p>
                            <p className="rch-hint">{(meta?.mobileOperators?.[form.country] || []).find((row) => row.code === form.operator)?.note || "Demonstration operator. No live recharge connection."}</p>
                          </div>
                          <button type="button" className="rch-link" onClick={() => update({ operator: "", circle: "" })}>Change Operator</button>
                        </article>
                      ) : (
                        <>
                          <label className="rch-label">
                            Operator
                            <input className="rch-input" placeholder="Search operator" value={operatorQuery} onChange={(event) => setOperatorQuery(event.target.value)} />
                          </label>
                          <PremiumSelect
                            label="Operator"
                            value={form.operator}
                            placeholder={operators.length ? "Choose an operator" : "No verified operators for this country"}
                            onChange={(operator) => update({ operator, circle: circlesFor(form.country, operator).some((row) => row.code === form.circle) ? form.circle : "" })}
                            options={operators.map((row) => ({ value: row.code, label: row.name }))}
                          />
                        </>
                      )}
                      {form.operator && circlesFor(form.country, form.operator).length ? (
                        <div className="rch-span">
                          <CircleSelect
                            circles={circlesFor(form.country, form.operator)}
                            value={form.circle}
                            disabled={!form.operator}
                            onChange={(circle) => update({ circle })}
                          />
                        </div>
                      ) : form.country && form.operator ? <p className="rch-hint">No demonstration circles are configured for this operator.</p> : null}
                      {form.country === "IN" && !form.operator ? <p className="rch-hint">Choose an operator, then a region. The circle is not detected from the mobile number.</p> : null}
                      <ContinueButton busy={busy === "plans"} label={busy === "plans" ? "Please wait…" : "Continue"} onClick={continueCategory} />
                    </div>
                    )
                  ) : null}

                  {category === "BROADBAND" ? (
                    <div className="rch-form">
                      <SearchSelect label="Provider" query={broadbandQuery} onQuery={setBroadbandQuery} value={form.provider} onChange={(provider) => update({ provider })} options={broadband} placeholder="Choose a provider" empty="No providers match that search." />
                      <Field label="Customer ID / registered mobile" value={form.account} onChange={(account) => update({ account })} />
                      <ContinueButton busy={busy === "bill"} label={busy === "bill" ? "Please wait…" : "Continue"} onClick={continueCategory} />
                    </div>
                  ) : null}

                  {category === "GAS" ? (
                    <div className="rch-form">
                      <PremiumSelect
                        label="Connection category"
                        value={gasCategory}
                        placeholder="All categories"
                        onChange={(value) => { setGasCategory(value); update({ provider: "" }); }}
                        options={[{ value: "", label: "All categories" }, ...gasCategories.map((name) => ({ value: name, label: name }))]}
                      />
                      <PremiumSelect
                        label="Provider"
                        value={form.provider}
                        placeholder="Choose a provider"
                        onChange={(provider) => update({ provider })}
                        options={gasProviders.map((row) => ({ value: row.code, label: `${row.name} · ${row.category}` }))}
                      />
                      {selectedGas ? <p className="rch-hint">Connection category: {selectedGas.category}</p> : null}
                      <Field label={selectedGas?.accountLabel || "Consumer or account number"} value={form.account} onChange={(account) => update({ account })} />
                      <ContinueButton busy={busy === "bill"} label={busy === "bill" ? "Fetching test bill…" : "Fetch test bill"} onClick={continueCategory} />
                    </div>
                  ) : null}

                  {category === "ELECTRICITY" ? (
                    <div className="rch-form">
                      <p className="rch-hint rch-span">India only.</p>
                      <label className="block text-sm font-medium text-slate-700">
                        State
                        <select className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={form.state} onChange={(event) => update({ state: event.target.value, provider: "" })}>
                          <option value="">Choose a state</option>
                          {(meta.electricityStates || []).map((state) => <option key={state}>{state}</option>)}
                        </select>
                      </label>
                      <label className="block text-sm font-medium text-slate-700">
                        Electricity board / provider
                        <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" placeholder="Search provider" value={providerQuery} onChange={(event) => setProviderQuery(event.target.value)} />
                      </label>
                      <select className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={form.provider} onChange={(event) => update({ provider: event.target.value })}>
                        <option value="">Choose a provider</option>
                        {filteredProviders.map((row) => <option key={row.code} value={row.code}>{row.name}</option>)}
                      </select>
                      <Field label="Consumer / account number" value={form.account} onChange={(account) => update({ account })} />
                      <ContinueButton busy={busy === "bill"} label={busy === "bill" ? "Please wait…" : "Continue"} onClick={continueCategory} />
                    </div>
                  ) : null}

                  {category === "WATER" ? (
                    <div className="rch-form">
                      <p className="rch-demo-note rch-span">Demonstration form only. Continuing checks these fields and does not fetch a bill or start a payment.</p>
                      <label className="block text-sm font-medium text-slate-700">
                        State / city
                        <select className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={form.state} onChange={(event) => update({ state: event.target.value, provider: "" })}>
                          <option value="">Choose a state or city</option>
                          {waterStates.map((state) => <option key={state}>{state}</option>)}
                        </select>
                      </label>
                      <label className="block text-sm font-medium text-slate-700">
                        Water board / provider
                        <select className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={form.provider} onChange={(event) => update({ provider: event.target.value })}>
                          <option value="">Choose a provider</option>
                          {waterProviders.map((row) => <option key={row.code} value={row.code}>{row.name}</option>)}
                        </select>
                      </label>
                      <Field label="Consumer / connection number" value={form.account} onChange={(account) => update({ account })} />
                      <ContinueButton busy={false} label="Continue" onClick={continueCategory} />
                      {waterReady ? (
                        <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-950">
                          <p className="font-semibold">Water details are ready</p>
                          <p className="mt-1">No bill was fetched and no payment was started. A provider connection is not available yet.</p>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {category === "DTH" ? (
                    <div className="rch-form">
                      <p className="rch-demo-note rch-span">Demonstration only. No DTH operator catalogue is configured, so this form does not fetch a bill or start a payment.</p>
                      <PremiumSelect label="Operator" value="" placeholder="No operators configured" disabled options={[]} onChange={() => {}} />
                      <Field label="Subscriber / customer ID" value={form.account} onChange={(account) => update({ account })} />
                      <ContinueButton busy={false} label="Continue" onClick={continueCategory} />
                      {dthReady ? (
                        <div className="rch-demo-note">
                          <p className="font-semibold">DTH details are ready</p>
                          <p>No bill was fetched and no payment was started.</p>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {category === "METRO" ? (
                    <div className="rch-form">
                      <label className="rch-label">
                        Metro system
                        <select className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={form.provider} onChange={(event) => update({ provider: event.target.value })}>
                          <option value="">Choose a metro</option>
                          {(meta.metros || []).map((row) => <option key={row.code} value={row.code}>{row.name}</option>)}
                        </select>
                      </label>
                      {meta.metros?.find((row) => row.code === form.provider) ? (
                        <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">{meta.metros.find((row) => row.code === form.provider).note}</p>
                      ) : null}
                      <Field label="Card or account identifier" value={form.account} onChange={(account) => update({ account })} />
                      <Field label="Recharge amount" value={form.amount} onChange={(amount) => update({ amount })} inputMode="decimal" />
                      <ContinueButton busy={busy === "review"} label={busy === "review" ? "Checking amount…" : "Continue"} onClick={continueCategory} />
                    </div>
                  ) : null}

                  {bill ? <BillCard bill={bill} /> : null}
                  {fieldError ? <p className="mt-4 text-sm text-red-700">{fieldError}</p> : null}
                  {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
                  {category === "WATER" || category === "DTH" || category === "METRO" || category === "MOBILE" ? null : (
                  <div className="rch-actions">
                    <button
                      type="button"
                      className="rch-btn rch-btn-ghost"
                      disabled={busy === "review" || (category === "MOBILE" && form.lineType === "PREPAID" && !selectedPlan) || (category !== "MOBILE" && category !== "METRO" && !bill) || (category === "MOBILE" && form.lineType === "POSTPAID" && !bill)}
                      onClick={review}
                    >
                      {busy === "review" ? "Checking amount…" : "Review"}
                    </button>
                  </div>
                  )}
                </div>
              ) : null}

              {step === "review" && lock ? (
                <ReviewCard
                  order={lock}
                  onBack={() => setStep("details")}
                  onChangePlan={() => { setStep("details"); setBrowse(true); }}
                  onPay={() => setStep("pay")}
                  error={error}
                />
              ) : null}

              {step === "pay" && lock ? (
                <PaymentCard
                  order={lock}
                  method={payMethod}
                  onMethod={setPayMethod}
                  cardLast4={cardLast4}
                  onCard={setCardLast4}
                  authenticated={authenticated}
                  walletBalance={walletBalance}
                  busy={busy === "pay"}
                  error={error}
                  onPay={pay}
                />
              ) : null}

              {step === "result" && receipt ? (
                <ResultCard
                  order={receipt}
                  onAgain={() => { setStep("details"); setReceipt(null); setLock(null); setIdempotencyKey(""); }}
                />
              ) : null}

              {history.length ? (
                <section className="mt-8">
                  <h2 className="text-lg font-semibold text-slate-900">Your demonstration transactions</h2>
                  <ul className="mt-3 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    {history.map((row) => (
                      <li key={row.reference} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                        <span>{row.providerName} · {row.accountMasked}</span>
                        <span className="text-slate-500">{row.reference} · {row.status} · {money(row.amount, row.currency)}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </>
          ) : null}
          <RechargeDiscover />
        </section>
      </main>
      <Footer />
    </>
  );
}

const PAY_METHODS = [
  { id: "WALLET", label: "Wallet", hint: "Customer wallet" },
  { id: "UPI", label: "UPI", hint: "No convenience fee" },
  { id: "CARD", label: "Card", hint: "Mock card" },
  { id: "NETBANKING", label: "Net Banking", hint: "Mock bank" },
];

function ReviewCard({ order, onBack, onChangePlan, onPay, error }) {
  const plan = order.summary?.plan;
  const region = order.summary?.circle?.name;
  return (
    <section className="rch-stage">
      <article className="rch-op-card">
        <span className="rch-op-mark" aria-hidden="true">{(order.providerName || "R").slice(0, 1)}</span>
        <div>
          <p className="rch-op-name">{order.providerName}</p>
          <p className="rch-hint">{order.summary?.lineType || order.category} · {region || order.summary?.country || "Region not required"} · {order.accountMasked}</p>
        </div>
      </article>
      <h2>Review recharge</h2>
      <p className="rch-lead">The amount is locked for this demonstration. No telecom operator is holding this recharge.</p>
      <dl className="rch-breakdown">
        <div><dt>Plan</dt><dd>{plan ? `${plan.id} · ${plan.validity}` : order.category}</dd></div>
        <div><dt>Benefits</dt><dd>{plan ? `${plan.data}. ${plan.calls}. ${plan.sms}` : "Demonstration amount"}</dd></div>
        <div><dt>Recharge amount</dt><dd>{money(order.amount, order.currency)}</dd></div>
      </dl>
      {error ? <p className="rch-alert">{error}</p> : null}
      <div className="rch-actions">
        <button type="button" className="rch-btn rch-btn-ghost" onClick={onBack}>Back</button>
        {plan ? <button type="button" className="rch-btn rch-btn-ghost" onClick={onChangePlan}>Change Plan</button> : null}
        <button type="button" className="rch-btn" onClick={onPay}>Continue to payment</button>
      </div>
    </section>
  );
}

function PaymentCard({ order, method, onMethod, cardLast4, onCard, authenticated, walletBalance, busy, error, onPay }) {
  const quote = quotePaymentFee(order.amount, method);
  const short = method === "WALLET" && walletBalance != null && walletBalance < quote.totalAmount;
  return (
    <section className="rch-stage">
      <h2>Payment</h2>
      <p className="rch-lead">Simulated APL_MOCK_PAY. A card ending 0002 is declined. No telecom balance is updated.</p>
      <div className="rch-pay-grid">
        {PAY_METHODS.map((item) => (
          <button key={item.id} type="button" className={`rch-pay-card ${method === item.id ? "is-selected" : ""}`} onClick={() => onMethod(item.id)}>
            <strong>{item.label}</strong>
            <span>{item.hint}</span>
          </button>
        ))}
      </div>
      {method === "WALLET" ? (
        <p className="rch-hint">Available balance {walletBalance == null ? "…" : money(walletBalance, order.currency)}</p>
      ) : null}
      {short ? <p className="rch-alert" role="alert">Your recharge amount exceeds the available wallet balance. Add money or choose another method.</p> : null}
      <dl className="rch-breakdown">
        <div><dt>Recharge amount</dt><dd>{money(quote.baseAmount, order.currency)}</dd></div>
        <div><dt>Payment fee</dt><dd>{money(quote.feeAmount, order.currency)}</dd></div>
        <div><dt>Total</dt><dd>{money(quote.totalAmount, order.currency)}</dd></div>
      </dl>
      {method === "CARD" ? (
        <label className="rch-label">
          Card last 4
          <input className="rch-input" inputMode="numeric" maxLength={4} value={cardLast4} onChange={(event) => onCard(event.target.value.replace(/\D/g, "").slice(0, 4))} />
        </label>
      ) : null}
      {!authenticated ? <p className="rch-hint"><Link href="/login">Sign in</Link> to pay.</p> : null}
      {error ? <p className="rch-alert">{error}</p> : null}
      <button type="button" className="rch-btn" disabled={busy || short || !authenticated || (method === "CARD" && cardLast4.length !== 4)} onClick={onPay}>
        {busy ? "Processing…" : `Pay ${money(quote.totalAmount, order.currency)}`}
      </button>
    </section>
  );
}

function ResultCard({ order, onAgain }) {
  const ok = order.status === "SUCCESS";
  const failed = order.status === "FAILED";
  return (
    <section className={`rch-stage rch-result ${ok ? "is-ok" : failed ? "is-bad" : "is-wait"}`}>
      <p className="rch-result-mark" aria-hidden="true">{ok ? "✓" : failed ? "!" : "…"}</p>
      <p className="rch-kicker">DEMO / MOCK RECHARGE</p>
      <h2>{ok ? "Demonstration recharge recorded" : failed ? "Recharge was not completed" : "Recharge is pending"}</h2>
      <p className="rch-lead">{order.fulfillment || "No telecom operator was contacted."}</p>
      <ReceiptBody order={order} />
      <div className="rch-actions">
        {order.bookingReference ? <Link className="rch-btn" href={`/my-trips/${order.bookingReference}`}>View Booking</Link> : null}
        <Link className="rch-btn rch-btn-ghost" href="/account/transactions">View Transactions</Link>
        <button type="button" className="rch-btn rch-btn-ghost" onClick={() => window.print()}>Print receipt</button>
        <button type="button" className="rch-btn rch-btn-ghost" onClick={onAgain}>Start another</button>
      </div>
    </section>
  );
}

function Field({ label, value, onChange, inputMode }) {
  return (
    <label className="rch-label">
      {label}
      <input className="rch-input" inputMode={inputMode} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function ContinueButton({ busy, label, onClick }) {
  return (
    <button type="button" className="rch-btn" disabled={busy} onClick={onClick}>
      {label}
    </button>
  );
}

function SearchSelect({ label, query, onQuery, value, onChange, options, placeholder, empty }) {
  return (
    <div className="rch-fields">
      <label className="rch-label">
        {label}
        <input className="rch-input" placeholder={`Search ${label.toLowerCase()}`} value={query} onChange={(event) => onQuery(event.target.value)} />
      </label>
      <PremiumSelect
        label={label}
        labelHidden
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        options={options.map((row) => ({ value: row.code, label: row.name }))}
      />
      {options.length ? null : <span className="rch-hint">{empty}</span>}
    </div>
  );
}

function BillCard({ bill }) {
  return (
    <article className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">MOCK / TEST bill</p>
      <h3 className="mt-1 text-lg font-semibold text-slate-900">{bill.provider}</h3>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <div><dt className="text-slate-500">Account</dt><dd>{bill.accountMasked}</dd></div>
        <div><dt className="text-slate-500">Amount due</dt><dd className="font-semibold">{money(bill.amount, bill.currency)}</dd></div>
        <div><dt className="text-slate-500">Billing period</dt><dd>{bill.billingPeriod}</dd></div>
        <div><dt className="text-slate-500">Due date</dt><dd>{bill.dueDate}</dd></div>
        <div><dt className="text-slate-500">Status</dt><dd>{bill.status}</dd></div>
      </dl>
      <p className="mt-3 text-xs text-amber-900">{bill.notice}</p>
    </article>
  );
}

function ReceiptBody({ order }) {
  const plan = order.summary?.plan;
  return (
    <>
      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <div><dt className="text-slate-500">Recharge reference</dt><dd className="font-mono">{order.reference}</dd></div>
        {order.bookingReference ? <div><dt className="text-slate-500">Booking</dt><dd className="font-mono">{order.bookingReference}</dd></div> : null}
        {order.paymentReference ? <div><dt className="text-slate-500">Payment</dt><dd className="font-mono">{order.paymentReference}</dd></div> : null}
        <div><dt className="text-slate-500">Status</dt><dd>{order.status} · DEMO / MOCK</dd></div>
        <div><dt className="text-slate-500">Provider</dt><dd>{order.providerName}</dd></div>
        <div><dt className="text-slate-500">Account</dt><dd>{order.accountMasked}</dd></div>
        {plan ? <div><dt className="text-slate-500">Plan</dt><dd>{plan.id} · {plan.validity}</dd></div> : null}
        {plan ? <div><dt className="text-slate-500">Benefits</dt><dd>{plan.data}. {plan.calls}. {plan.sms}</dd></div> : null}
        {order.summary?.country ? <div><dt className="text-slate-500">Country</dt><dd>{order.summary.country}</dd></div> : null}
        <div><dt className="text-slate-500">Amount</dt><dd className="font-semibold">{money(order.amount, order.currency)}</dd></div>
      </dl>
      <p className="mt-3 text-xs text-slate-500">{order.notice || plan?.notice}</p>
    </>
  );
}
