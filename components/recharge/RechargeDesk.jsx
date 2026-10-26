"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { apiGet, apiPost } from "@/lib/api/client";
import { getLoginToken } from "@/lib/auth";
import { quotePaymentFee } from "@/lib/paymentFee";
import { useAuth } from "@/components/auth/useAuth";

const PRIMARY = [
  { id: "MOBILE", label: "Mobile Recharge", description: "Prepaid plans and postpaid bills.", tone: "teal" },
  { id: "BROADBAND", label: "Broadband", description: "Fiber and internet accounts.", tone: "sky" },
  { id: "ELECTRICITY", label: "Electricity Bills", description: "Indian distribution companies.", tone: "amber" },
  { id: "WATER", label: "Water Bills", description: "Form ready. Billing is not connected.", tone: "cyan" },
];

const MORE = [
  { id: "GAS", label: "Gas Bill", description: "Existing demonstration bills." },
  { id: "METRO", label: "Metro Card", description: "Existing demonstration recharge." },
];

const WATER_PROVIDERS = [
  { state: "Delhi", city: "New Delhi", code: "DJB", name: "Delhi Jal Board" },
  { state: "Maharashtra", city: "Mumbai", code: "MCGM-WATER", name: "Brihanmumbai Municipal Corporation" },
  { state: "Karnataka", city: "Bengaluru", code: "BWSSB", name: "Bangalore Water Supply and Sewerage Board" },
  { state: "Tamil Nadu", city: "Chennai", code: "CMWSSB", name: "Chennai Metro Water" },
  { state: "Telangana", city: "Hyderabad", code: "HMWSSB", name: "Hyderabad Metropolitan Water Supply" },
];

const TONES = {
  teal: "bg-teal-50 text-teal-800",
  sky: "bg-sky-50 text-sky-800",
  amber: "bg-amber-50 text-amber-800",
  cyan: "bg-cyan-50 text-cyan-800",
};

const emptyForm = {
  lineType: "PREPAID",
  country: "IN",
  mobile: "",
  operator: "",
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
  const [operatorQuery, setOperatorQuery] = useState("");
  const [broadbandQuery, setBroadbandQuery] = useState("");
  const [countryQuery, setCountryQuery] = useState("");
  const [providerQuery, setProviderQuery] = useState("");
  const [plans, setPlans] = useState([]);
  const [bill, setBill] = useState(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState("details");
  const [lock, setLock] = useState(null);
  const [cardLast4, setCardLast4] = useState("");
  const [payMethod, setPayMethod] = useState("UPI");
  const [receipt, setReceipt] = useState(null);
  const [history, setHistory] = useState([]);
  const [idempotencyKey, setIdempotencyKey] = useState("");

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
  const filteredCountries = useMemo(() => {
    const query = countryQuery.trim().toLowerCase();
    if (!query) return countries;
    return countries.filter((row) => `${row.name} ${row.iso} ${row.dialCode}`.toLowerCase().includes(query));
  }, [countries, countryQuery]);
  const operators = (meta?.mobileOperators?.[form.country] || []).filter((row) => row.name.toLowerCase().includes(operatorQuery.trim().toLowerCase()));
  const electricity = (meta?.electricity || []).filter((row) => !form.state || row.state === form.state);
  const filteredProviders = electricity.filter((row) => row.name.toLowerCase().includes(providerQuery.trim().toLowerCase()));
  const broadband = (meta?.broadband || []).filter((row) => `${row.name} ${row.code}`.toLowerCase().includes(broadbandQuery.trim().toLowerCase()));
  const waterStates = [...new Set(WATER_PROVIDERS.map((row) => `${row.state} · ${row.city}`))];
  const waterProviders = WATER_PROVIDERS.filter((row) => !form.state || `${row.state} · ${row.city}` === form.state);
  const selectedCountry = countries.find((row) => row.iso === form.country);
  const countryOptions = filteredCountries.slice(0, 40);
  if (selectedCountry && !countryOptions.some((row) => row.iso === selectedCountry.iso)) countryOptions.unshift(selectedCountry);

  function update(patch, keepResults = false) {
    setForm((current) => ({ ...current, ...patch }));
    if (!keepResults) {
      setBill(null);
      setPlans([]);
    }
    setWaterReady(false);
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
    setBill(null);
    setWaterReady(false);
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
      if (!form.country) return setFieldError("Choose a country code.");
      if (!/^\d{8,15}$/.test(String(form.mobile).replace(/\s/g, ""))) return setFieldError("Enter a mobile number with 8 to 15 digits.");
      if (!form.operator) return setFieldError("Choose an operator.");
      if (form.lineType === "PREPAID") return loadPlans();
      return fetchBill();
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
    }
  }

  async function loadPlans() {
    setError("");
    setBusy("plans");
    try {
      const data = await apiPost("/recharge/plans", {
        country: form.country,
        operator: form.operator,
        lineType: "PREPAID",
      });
      setPlans(data.plans || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Plans could not be loaded");
    } finally {
      setBusy("");
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
        amount: category === "METRO" ? Number(form.amount) : bill?.amount,
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
    const token = getLoginToken();
    if (!token) {
      setError("Sign in to complete this demonstration payment.");
      return;
    }
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
      setBusy("");
    }
  }

  const selectedPlan = plans.find((plan) => plan.id === form.planId);

  return (
    <>
      <Header />
      <main className="min-h-[70vh] bg-slate-50">
        <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">TEST / DEMO</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Recharge</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Demonstration bills and recharges for this travel desk. No operator, utility, or metro balance is updated.
          </p>
          {metaError ? (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">{metaError}</div>
          ) : null}
          {!meta && !metaError ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {PRIMARY.map((item) => <div key={item.id} className="h-28 animate-pulse rounded-3xl bg-white" />)}
            </div>
          ) : null}
          {meta ? (
            <>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {PRIMARY.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openCategory(item.id)}
                    className={`group rounded-3xl border p-4 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${category === item.id ? "border-teal-700 ring-2 ring-teal-600" : "border-slate-200 bg-white"}`}
                  >
                    <span className={`grid h-11 w-11 place-items-center rounded-2xl text-lg ${TONES[item.tone]}`} aria-hidden="true">{item.id === "MOBILE" ? "☎" : item.id === "BROADBAND" ? "⌁" : item.id === "ELECTRICITY" ? "⚡" : "💧"}</span>
                    <span className="mt-3 block text-sm font-semibold text-slate-900">{item.label}</span>
                    <span className="mt-1 block text-xs leading-5 text-slate-500">{item.description}</span>
                  </button>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {MORE.map((item) => (
                  <button key={item.id} type="button" onClick={() => openCategory(item.id)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${category === item.id ? "border-teal-700 bg-teal-700 text-white" : "border-slate-200 bg-white text-slate-600"}`}>
                    {item.label}
                  </button>
                ))}
              </div>

              {step === "details" ? (
                <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                  {category === "MOBILE" ? (
                    <div className="space-y-4">
                      <div className="inline-flex rounded-full bg-slate-100 p-1">
                        {["PREPAID", "POSTPAID"].map((type) => (
                          <button key={type} type="button" className={`rounded-full px-4 py-1.5 text-sm ${form.lineType === type ? "bg-white font-semibold text-teal-800 shadow" : "text-slate-600"}`} onClick={() => update({ lineType: type, planId: "" })}>
                            {type === "PREPAID" ? "Prepaid" : "Postpaid"}
                          </button>
                        ))}
                      </div>
                      <label className="block text-sm font-medium text-slate-700">
                        Country code
                        <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" placeholder="Search country or code" value={countryQuery} onChange={(event) => setCountryQuery(event.target.value)} />
                        <select className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2" value={form.country} onChange={(event) => update({ country: event.target.value, operator: "" })}>
                          <option value="">Choose a country code</option>
                          {countryOptions.map((row) => (
                            <option key={row.iso} value={row.iso}>{row.flag} {row.name} {row.dialCode}</option>
                          ))}
                        </select>
                      </label>
                      <p className="text-xs text-slate-500">Selected {selectedCountry ? `${selectedCountry.flag} ${selectedCountry.name} ${selectedCountry.dialCode}` : "none"}</p>
                      <Field label="Mobile number" value={form.mobile} onChange={(mobile) => update({ mobile: mobile.replace(/[^\d\s]/g, "") })} inputMode="numeric" />
                      <label className="block text-sm font-medium text-slate-700">
                        Operator
                        <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" placeholder="Search operator" value={operatorQuery} onChange={(event) => setOperatorQuery(event.target.value)} />
                        <select className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2" value={form.operator} onChange={(event) => update({ operator: event.target.value })}>
                          <option value="">{operators.length ? "Choose an operator" : "No verified operators for this country"}</option>
                          {operators.map((row) => <option key={row.code} value={row.code}>{row.name}</option>)}
                        </select>
                      </label>
                      <ContinueButton busy={busy === "plans" || busy === "bill"} label={busy ? "Please wait…" : "Continue"} onClick={continueCategory} />
                      {plans.length ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {plans.map((plan) => (
                            <button key={plan.id} type="button" onClick={() => update({ planId: plan.id }, true)} className={`rounded-2xl border p-4 text-left ${form.planId === plan.id ? "border-teal-600 bg-teal-50" : "border-slate-200"}`}>
                              <p className="text-lg font-semibold">{money(plan.amount)}</p>
                              <p className="text-sm text-slate-600">{plan.validity} · {plan.data}</p>
                              <p className="text-xs text-slate-500">{plan.calls}. {plan.benefits}. TEST</p>
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {category === "BROADBAND" ? (
                    <div className="space-y-4">
                      <SearchSelect label="Provider" query={broadbandQuery} onQuery={setBroadbandQuery} value={form.provider} onChange={(provider) => update({ provider })} options={broadband} placeholder="Choose a provider" empty="No providers match that search." />
                      <Field label="Customer ID / registered mobile" value={form.account} onChange={(account) => update({ account })} />
                      <ContinueButton busy={busy === "bill"} label={busy === "bill" ? "Please wait…" : "Continue"} onClick={continueCategory} />
                    </div>
                  ) : null}

                  {category === "GAS" ? (
                    <UtilityFields
                      providers={meta.gas}
                      form={form}
                      update={update}
                      onFetch={fetchBill}
                      busy={busy === "bill"}
                    />
                  ) : null}

                  {category === "ELECTRICITY" ? (
                    <div className="space-y-4">
                      <p className="text-sm text-slate-600">India only.</p>
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
                    <div className="space-y-4">
                      <p className="rounded-xl bg-cyan-50 px-3 py-2 text-sm text-cyan-950">Demonstration form only. Continuing checks these fields and does not fetch a bill or start a payment.</p>
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

                  {category === "METRO" ? (
                    <div className="space-y-4">
                      <label className="block text-sm font-medium text-slate-700">
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
                      <Field label="Recharge amount" value={form.amount} onChange={(amount) => update({ amount })} />
                    </div>
                  ) : null}

                  {bill ? <BillCard bill={bill} /> : null}
                  {fieldError ? <p className="mt-4 text-sm text-red-700">{fieldError}</p> : null}
                  {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
                  {category === "WATER" ? null : (
                  <div className="mt-6">
                    <button
                      type="button"
                      className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
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
                <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                  <h2 className="text-xl font-semibold">Review</h2>
                  <p className="mt-1 text-sm text-slate-600">The amount is locked on this travel desk. This is not a hold with an external provider.</p>
                  <ReceiptBody order={lock} />
                  {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
                  <div className="mt-6 flex gap-3">
                    <button type="button" className="rounded-xl border border-slate-200 px-4 py-2 text-sm" onClick={() => setStep("details")}>Back</button>
                    <button type="button" className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white" onClick={() => setStep("pay")}>Continue to mock payment</button>
                  </div>
                </div>
              ) : null}

              {step === "pay" && lock ? (
                <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                  <h2 className="text-xl font-semibold">Mock payment</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Pay {money(quotePaymentFee(lock.amount, payMethod).totalAmount, lock.currency)}.
                    Payment fee {money(quotePaymentFee(lock.amount, payMethod).feeAmount, lock.currency)}.
                    Simulated APL_MOCK_PAY. Card decline demo uses 0002.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {["UPI", "CARD", "NETBANKING", "WALLET"].map((id) => (
                      <button key={id} type="button" className={`rounded-full border px-3 py-1 text-sm ${payMethod === id ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200"}`} onClick={() => setPayMethod(id)}>{id}</button>
                    ))}
                  </div>
                  {!authenticated ? <p className="mt-3 text-sm"> <Link className="font-semibold text-teal-800 underline" href="/login">Sign in</Link> to continue.</p> : null}
                  <label className="mt-4 block text-sm font-medium text-slate-700">
                    Card last 4
                    <input className="mt-1 w-40 rounded-xl border border-slate-200 px-3 py-2" maxLength={4} value={cardLast4} onChange={(event) => setCardLast4(event.target.value.replace(/\D/g, "").slice(0, 4))} />
                  </label>
                  {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
                  <button type="button" className="mt-5 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50" disabled={busy === "pay" || (payMethod === "CARD" && cardLast4.length !== 4)} onClick={pay}>
                    {busy === "pay" ? "Processing…" : "Pay demonstration amount"}
                  </button>
                </div>
              ) : null}

              {step === "result" && receipt ? (
                <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                  <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">TEST / DEMO receipt</p>
                  <h2 className="mt-2 text-xl font-semibold">{receipt.status === "SUCCESS" ? "Recharge recorded" : "Recharge not completed"}</h2>
                  <ReceiptBody order={receipt} />
                  <button type="button" className="mt-6 rounded-xl border border-slate-200 px-4 py-2 text-sm" onClick={() => { setStep("details"); setReceipt(null); setLock(null); setIdempotencyKey(""); }}>Start another demonstration</button>
                </div>
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
        </section>
      </main>
      <Footer />
    </>
  );
}

function Field({ label, value, onChange, inputMode }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" inputMode={inputMode} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function ContinueButton({ busy, label, onClick }) {
  return (
    <button type="button" className="rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:opacity-60" disabled={busy} onClick={onClick}>
      {label}
    </button>
  );
}

function SearchSelect({ label, query, onQuery, value, onChange, options, placeholder, empty }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" placeholder={`Search ${label.toLowerCase()}`} value={query} onChange={(event) => onQuery(event.target.value)} />
      <select className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2" value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">{placeholder}</option>
        {options.map((row) => <option key={row.code} value={row.code}>{row.name}</option>)}
      </select>
      {options.length ? null : <span className="mt-1 block text-xs text-slate-500">{empty}</span>}
    </label>
  );
}

function UtilityFields({ providers, form, update, onFetch, busy }) {
  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-slate-700">
        Provider
        <select className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={form.provider} onChange={(event) => update({ provider: event.target.value })}>
          <option value="">Choose a provider</option>
          {providers.map((row) => <option key={row.code} value={row.code}>{row.name}{row.category ? ` · ${row.category}` : ""}</option>)}
        </select>
      </label>
      <Field label={providers.find((row) => row.code === form.provider)?.accountLabel || "Account or customer number"} value={form.account} onChange={(account) => update({ account })} />
      <button type="button" className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white" disabled={busy} onClick={onFetch}>
        {busy ? "Fetching test bill…" : "Fetch test bill"}
      </button>
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
  return (
    <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
      <div><dt className="text-slate-500">Reference</dt><dd className="font-mono">{order.reference}</dd></div>
      <div><dt className="text-slate-500">Status</dt><dd>{order.status}</dd></div>
      <div><dt className="text-slate-500">Provider</dt><dd>{order.providerName}</dd></div>
      <div><dt className="text-slate-500">Account</dt><dd>{order.accountMasked}</dd></div>
      <div><dt className="text-slate-500">Amount</dt><dd className="font-semibold">{money(order.amount, order.currency)}</dd></div>
    </dl>
  );
}
