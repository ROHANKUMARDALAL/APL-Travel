"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getCountries, getCountryCallingCode } from "libphonenumber-js";
import PremiumSelect from "@/components/ui/PremiumSelect";
import CountrySelect from "@/components/recharge/CountrySelect";
import IsoDateField, { dateToIso } from "@/components/ui/IsoDateField";
import { apiPost } from "@/lib/api/client";
import { getSession } from "@/lib/auth";
import { useAuth } from "@/components/auth/useAuth";
import { today } from "@/lib/dateUtils";
import "@/app/visa-enquiry.css";

const VISA_TYPES = [
  { value: "TOURIST", label: "Tourist" },
  { value: "BUSINESS", label: "Business" },
  { value: "STUDENT", label: "Student" },
  { value: "WORK", label: "Work" },
  { value: "TRANSIT", label: "Transit" },
  { value: "MEDICAL", label: "Medical" },
  { value: "FAMILY_VISIT", label: "Family Visit" },
];
const TITLES = ["Mr", "Mrs", "Ms", "Mx", "Dr"].map((value) => ({ value, label: value }));
const GENDERS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
];

function flag(iso) {
  return String(iso || "").toUpperCase().replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

function blankTraveller() {
  return {
    title: "Mr", firstName: "", lastName: "", dateOfBirth: "", gender: "",
    nationality: "IN", phoneIso: "IN", dialCode: "+91", phone: "", email: "", passportNumber: "", passportExpiry: "",
  };
}

function addYears(iso, years) {
  const [year, month, day] = iso.split("-");
  return `${Number(year) + years}-${month}-${day}`;
}

function addDays(iso, days) {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function filled(traveller) {
  return ["firstName", "lastName", "dateOfBirth", "gender", "nationality", "phone", "email", "passportNumber", "passportExpiry"]
    .every((key) => String(traveller[key] || "").trim());
}

function dirty(traveller) {
  return ["firstName", "lastName", "email", "phone", "passportNumber"].some((key) => String(traveller[key] || "").trim());
}

function PassportMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="3" width="14" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="11" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 17.5h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default function VisaEnquiryForm() {
  const pathname = usePathname();
  const { ready, authenticated, user } = useAuth();
  const countries = useMemo(() => {
    const names = new Intl.DisplayNames(["en"], { type: "region" });
    return getCountries().map((iso) => ({
      iso,
      name: names.of(iso) || iso,
      dialCode: `+${getCountryCallingCode(iso)}`,
      flag: flag(iso),
    })).filter((country, index, list) => list.findIndex((item) => item.iso === country.iso) === index);
  }, []);
  const [visaType, setVisaType] = useState("TOURIST");
  const [destination, setDestination] = useState("");
  const [departure, setDeparture] = useState("");
  const [duration, setDuration] = useState("7");
  const [notes, setNotes] = useState("");
  const [travellers, setTravellers] = useState([blankTraveller()]);
  const [open, setOpen] = useState(0);
  const [step, setStep] = useState("form");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [idempotencyKey, setIdempotencyKey] = useState(() => (crypto.randomUUID ? crypto.randomUUID() : `visa-${Date.now()}`));
  const country = countries.find((item) => item.iso === destination);
  const stay = Number(duration);
  const returnDate = /^\d{4}-\d{2}-\d{2}$/.test(departure) && Number.isInteger(stay) && stay > 0 ? addDays(departure, stay) : "";

  useEffect(() => {
    if (!ready || !user) return;
    setTravellers((current) => current.map((row, index) => (index === 0 && !row.email ? { ...row, email: user.email || "" } : row)));
  }, [ready, user]);

  function resetForm() {
    setVisaType("TOURIST");
    setDestination("");
    setDeparture("");
    setDuration("7");
    setNotes("");
    setTravellers([blankTraveller()]);
    setOpen(0);
    setStep("form");
    setErrors({});
    setResult(null);
    setIdempotencyKey(crypto.randomUUID ? crypto.randomUUID() : `visa-${Date.now()}`);
  }

  function updateTraveller(index, patch) {
    setTravellers((current) => current.map((row, item) => (item === index ? { ...row, ...patch } : row)));
  }

  function setCount(next) {
    if (next < travellers.length && travellers.slice(next).some(dirty)) {
      if (!window.confirm("This removes traveller details you already entered. Continue?")) return;
    }
    setTravellers((current) => {
      if (next > current.length) return [...current, ...Array.from({ length: next - current.length }, () => blankTraveller())];
      return current.slice(0, next);
    });
    setOpen((current) => Math.min(current, next - 1));
  }

  function validate() {
    const next = {};
    if (!visaType) next.visaType = "Choose a visa type";
    if (!destination) next.destination = "Choose a destination country";
    if (!departure || departure < dateToIso(today())) next.departure = "Choose a departure date today or later";
    if (!Number.isInteger(stay) || stay < 1 || stay > 365) next.duration = "Enter 1 to 365 days";
    travellers.forEach((row, index) => {
      if (!row.firstName.trim()) next[`t${index}-first`] = "Enter a first name";
      if (!row.lastName.trim()) next[`t${index}-last`] = "Enter a last name";
      if (!row.dateOfBirth || row.dateOfBirth > dateToIso(today())) next[`t${index}-dob`] = "Enter a valid date of birth";
      if (!row.gender) next[`t${index}-gender`] = "Choose a gender";
      if (!row.nationality) next[`t${index}-nation`] = "Choose a nationality";
      if (!/^[0-9]{8,15}$/.test(row.phone.replace(/\D/g, ""))) next[`t${index}-phone`] = "Enter a valid phone number";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) next[`t${index}-email`] = "Enter a valid email";
      if (!/^[A-Za-z0-9]{6,12}$/.test(row.passportNumber.trim())) next[`t${index}-passport`] = "Enter a passport number";
      if (!row.passportExpiry || (returnDate && row.passportExpiry <= returnDate)) next[`t${index}-expiry`] = "Expiry must be after the stay";
    });
    setErrors(next);
    const first = Object.keys(next)[0];
    if (first) {
      const node = document.getElementById(first);
      node?.scrollIntoView({ behavior: "smooth", block: "center" });
      node?.querySelector("button, input, textarea")?.focus() || node?.focus();
      const traveller = first.match(/^t(\d+)/);
      if (traveller) setOpen(Number(traveller[1]));
    }
    return Object.keys(next).length === 0;
  }

  async function submit() {
    if (submitting) return;
    const session = getSession();
    if (!session?.loginToken) {
      window.location.href = `/login?next=${encodeURIComponent(pathname || "/visa")}`;
      return;
    }
    setSubmitting(true);
    try {
      const data = await apiPost("/enquiries", {
        serviceCode: "visa",
        visaType,
        destinationIso: destination,
        destinationCountry: country?.name || "",
        preferredDepartureDate: departure,
        durationDays: stay,
        travellerCount: travellers.length,
        specialRequirements: notes,
        idempotencyKey,
        travellers: travellers.map((row) => ({
          title: row.title,
          firstName: row.firstName.trim(),
          lastName: row.lastName.trim(),
          dateOfBirth: row.dateOfBirth,
          gender: row.gender,
          nationality: countries.find((item) => item.iso === row.nationality)?.name || "",
          nationalityIso: row.nationality,
          phone: `${row.dialCode}${row.phone.replace(/\D/g, "")}`,
          email: row.email.trim(),
          passportNumber: row.passportNumber.trim(),
          passportExpiry: row.passportExpiry,
        })),
      }, { token: session.loginToken });
      setResult({ ...data, submittedOn: new Date().toLocaleDateString() });
      setStep("done");
    } catch (error) {
      setErrors({ form: error.message || "Could not submit the enquiry" });
      setStep("review");
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "review") {
    return (
      <section className="visa-review">
        <header className="visa-hero">
          <p>Review</p>
          <h2>Review Visa Enquiry</h2>
          <p>Check the trip and each applicant before you send this assistance request.</p>
        </header>
        <dl className="visa-summary">
          <div><dt>Visa type</dt><dd>{VISA_TYPES.find((item) => item.value === visaType)?.label}</dd></div>
          <div><dt>Destination</dt><dd>{country ? `${country.flag} ${country.name}` : ""}</dd></div>
          <div><dt>Travel date</dt><dd>{departure}</dd></div>
          <div><dt>Duration</dt><dd>{stay} days · estimate {returnDate}</dd></div>
          <div><dt>Travellers</dt><dd>{travellers.length}</dd></div>
          <div><dt>Additional notes</dt><dd>{notes || "None"}</dd></div>
        </dl>
        {travellers.map((row, index) => (
          <article key={index}>
            <h3>{index === 0 ? "Traveller 1 · Lead applicant" : `Traveller ${index + 1} · Applicant`}</h3>
            <p>{row.title} {row.firstName} {row.lastName}</p>
            <p>{row.email} · {row.dialCode} {row.phone}</p>
            <p>Passport {row.passportNumber.replace(/.(?=.{2})/g, "•")} · expires {row.passportExpiry}</p>
          </article>
        ))}
        {errors.form ? <p className="visa-error">{errors.form}</p> : null}
        <div className="visa-actions">
          <button type="button" onClick={() => setStep("form")}>Edit Details</button>
          <button type="button" className="visa-submit" disabled={submitting} onClick={submit}>{submitting ? "Submitting…" : "Submit Visa Enquiry"}</button>
        </div>
      </section>
    );
  }

  return (
    <form className="visa-form" onSubmit={(event) => { event.preventDefault(); if (validate()) setStep("review"); }}>
      <header className="visa-hero">
        <p>Visa assistance</p>
        <h2>Tell us about the trip</h2>
        <p>This is an enquiry for assistance. It is not a visa application, approval, or payment.</p>
      </header>
      <section className="visa-card">
        <h3><PassportMark /> Visa requirements</h3>
        <div className="visa-grid">
          <div className="visa-field" id="visaType">
            <PremiumSelect label="Visa type" value={visaType} options={VISA_TYPES} onChange={setVisaType} />
            {errors.visaType ? <p className="visa-error">{errors.visaType}</p> : null}
          </div>
          <div className="visa-field" id="destination">
            <CountrySelect countries={countries} label="Destination country" value={destination} onChange={setDestination} />
            {errors.destination ? <p className="visa-error">{errors.destination}</p> : null}
          </div>
          <div className="visa-field" id="travellerCount">
            <span className="visa-label">Number of travellers</span>
            <div className="visa-stepper">
              <button type="button" onClick={() => setCount(Math.max(1, travellers.length - 1))} aria-label="Fewer travellers">−</button>
              <strong>{travellers.length}</strong>
              <button type="button" onClick={() => setCount(Math.min(10, travellers.length + 1))} aria-label="More travellers">+</button>
            </div>
          </div>
          <div className="visa-field" id="departure">
            <IsoDateField id="departure-date" label="Intended departure date" value={departure} min={dateToIso(today())} onChange={setDeparture} />
            {errors.departure ? <p className="visa-error">{errors.departure}</p> : null}
          </div>
          <label className="visa-field" id="duration">
            <span className="visa-label">Duration of stay</span>
            <input className="visa-control" inputMode="numeric" value={duration} onChange={(event) => setDuration(event.target.value.replace(/\D/g, "").slice(0, 3))} />
            {errors.duration ? <p className="visa-error">{errors.duration}</p> : null}
          </label>
          <div className="visa-field">
            <span className="visa-label">Expected return date</span>
            <span className="visa-control visa-return"><strong>{returnDate || "—"}</strong><em>Estimate</em></span>
          </div>
          <label className="visa-field visa-span">
            <span className="visa-label">Additional requirements</span>
            <textarea rows={3} maxLength={2000} value={notes} onChange={(event) => setNotes(event.target.value)} />
          </label>
        </div>
      </section>
      {travellers.map((row, index) => (
        <section key={index} className={`visa-person ${open === index ? "is-open" : ""}`}>
          <button type="button" className="visa-person-head" aria-expanded={open === index} onClick={() => setOpen(open === index ? -1 : index)}>
            <span>{index + 1}</span>
            <strong>Traveller {index + 1}</strong>
            {index === 0 ? <b>Lead Applicant</b> : <b className="is-plain">Applicant</b>}
            <em className={filled(row) ? "is-done" : ""}>{filled(row) ? "Complete" : "Incomplete"}</em>
          </button>
          <div className="visa-person-body">
            <div className="visa-grid">
              <div className="visa-field" id={`t${index}-first`}><PremiumSelect label="Title" value={row.title} options={TITLES} onChange={(title) => updateTraveller(index, { title })} /></div>
              <label className="visa-field"><span className="visa-label">First name</span><input className="visa-control" value={row.firstName} onChange={(event) => updateTraveller(index, { firstName: event.target.value })} />{errors[`t${index}-first`] ? <p className="visa-error">{errors[`t${index}-first`]}</p> : null}</label>
              <label className="visa-field" id={`t${index}-last`}><span className="visa-label">Last name</span><input className="visa-control" value={row.lastName} onChange={(event) => updateTraveller(index, { lastName: event.target.value })} />{errors[`t${index}-last`] ? <p className="visa-error">{errors[`t${index}-last`]}</p> : null}</label>
              <div className="visa-field" id={`t${index}-dob`}><IsoDateField id={`dob-${index}`} label="Date of birth" value={row.dateOfBirth} max={dateToIso(today())} onChange={(dateOfBirth) => updateTraveller(index, { dateOfBirth })} />{errors[`t${index}-dob`] ? <p className="visa-error">{errors[`t${index}-dob`]}</p> : null}</div>
              <div className="visa-field" id={`t${index}-gender`}><PremiumSelect label="Gender" value={row.gender} options={GENDERS} placeholder="Select" onChange={(gender) => updateTraveller(index, { gender })} />{errors[`t${index}-gender`] ? <p className="visa-error">{errors[`t${index}-gender`]}</p> : null}</div>
              <div className="visa-field" id={`t${index}-nation`}><CountrySelect countries={countries} label="Nationality" value={row.nationality} onChange={(nationality) => updateTraveller(index, { nationality })} />{errors[`t${index}-nation`] ? <p className="visa-error">{errors[`t${index}-nation`]}</p> : null}</div>
              <div className="visa-field" id={`t${index}-phone`}>
                <span className="visa-label">Contact number</span>
                <div className="visa-phone">
                  <CountrySelect countries={countries} hideLabel dialOnly value={row.phoneIso} onChange={(iso) => updateTraveller(index, { phoneIso: iso, dialCode: countries.find((item) => item.iso === iso)?.dialCode || row.dialCode })} />
                  <input className="visa-control" value={row.phone} inputMode="tel" aria-label="Phone number" onChange={(event) => updateTraveller(index, { phone: event.target.value.replace(/\D/g, "").slice(0, 15) })} />
                </div>
                {errors[`t${index}-phone`] ? <p className="visa-error">{errors[`t${index}-phone`]}</p> : null}
              </div>
              <label className="visa-field" id={`t${index}-email`}><span className="visa-label">Email address</span><input className="visa-control" type="email" value={row.email} onChange={(event) => updateTraveller(index, { email: event.target.value })} />{errors[`t${index}-email`] ? <p className="visa-error">{errors[`t${index}-email`]}</p> : null}</label>
              <label className="visa-field" id={`t${index}-passport`}><span className="visa-label">Passport number</span><input className="visa-control" value={row.passportNumber} maxLength={12} onChange={(event) => updateTraveller(index, { passportNumber: event.target.value.toUpperCase() })} />{errors[`t${index}-passport`] ? <p className="visa-error">{errors[`t${index}-passport`]}</p> : null}</label>
              <div className="visa-field" id={`t${index}-expiry`}><IsoDateField id={`expiry-${index}`} label="Passport expiry date" placeholder="Select expiry date" value={row.passportExpiry} min={dateToIso(today())} max={addYears(dateToIso(today()), 20)} onChange={(passportExpiry) => updateTraveller(index, { passportExpiry })} />{errors[`t${index}-expiry`] ? <p className="visa-error">{errors[`t${index}-expiry`]}</p> : null}</div>
            </div>
          </div>
        </section>
      ))}
      {!authenticated && ready ? <p>Sign in before submitting. You can complete the form first.</p> : null}
      <button className="visa-submit" type="submit">Review Visa Enquiry</button>
      {result && step === "done" ? (
        <div className="visa-modal" role="presentation">
          <section className="visa-modal-card" role="dialog" aria-modal="true" aria-labelledby="visa-success-title">
            <span className="visa-check" aria-hidden="true">✓</span>
            <h2 id="visa-success-title">Visa Enquiry Submitted Successfully!</h2>
            <p>We have received your assistance request. This is not a visa approval.</p>
            <dl>
              <div><dt>Reference</dt><dd>{result.enquiryReference}</dd></div>
              <div><dt>Submitted</dt><dd>{result.submittedOn}</dd></div>
              <div><dt>Status</dt><dd>{result.status || "NEW"}</dd></div>
            </dl>
            <div className="visa-actions">
              <Link className="visa-submit" href="/account/enquiries">View My Enquiries</Link>
              <button type="button" onClick={resetForm}>Close</button>
            </div>
          </section>
        </div>
      ) : null}
    </form>
  );
}
