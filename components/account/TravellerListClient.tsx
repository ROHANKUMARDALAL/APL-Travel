"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import AccountShell from "@/components/account/AccountShell";
import DatePicker from "@/components/ui/DatePicker";
import CountrySelect from "@/components/ui/CountrySelect";
import DocumentTypeSelect, { type DocumentType } from "@/components/ui/DocumentTypeSelect";
import GenderSelect, { type TravellerGender } from "@/components/ui/GenderSelect";
import PassengerTypeSelect, {
  type PassengerType,
} from "@/components/ui/PassengerTypeSelect";
import TitleSelect, { type TravellerTitle } from "@/components/ui/TitleSelect";
import { defaultCountryForCurrency } from "@/data/countries";
import { getActiveCurrencyCode } from "@/data/markets";
import { today } from "@/lib/dateUtils";
import {
  dobBoundsForType,
  dobErrorForType,
  isDobValidForType,
} from "@/lib/travellerAge";
import { genderFromTitle, genderLabel } from "@/lib/travellerIdentity";
import { isUnauthorizedError } from "@/lib/api/client";
import {
  fetchSavedTravellers,
  removeSavedTraveller,
  saveTravellerProfile,
} from "@/lib/api/travellers";
import { ensureValidSession, getCurrentUser, logout } from "@/lib/auth";

type TravellerForm = {
  title: TravellerTitle;
  firstName: string;
  lastName: string;
  gender: TravellerGender;
  dob: string;
  type: PassengerType;
  hasDocument: boolean;
  documentType: DocumentType;
  passport: string;
  passportIssueDate: string;
  passportExpiry: string;
  passportIssueCountry: string;
};

type SavedTraveller = {
  id: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: string;
  travellerType?: PassengerType | string;
  documentType?: string;
  passportNumber?: string;
  passportIssueDate?: string;
  passportExpiry?: string;
  passportIssueCountry?: string;
  nationality?: string;
  title?: string;
};

const EMPTY_FORM: TravellerForm = {
  title: "Mr",
  firstName: "",
  lastName: "",
  gender: "male",
  dob: "",
  type: "adult",
  hasDocument: false,
  documentType: "passport",
  passport: "",
  passportIssueDate: "",
  passportExpiry: "",
  passportIssueCountry: "",
};

function isoToDate(value: string): Date | null {
  if (!value) return null;
  const [year, month, day] = String(value).split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function dateToIso(date: Date | null): string {
  if (!date) return "";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function typeLabel(type?: string): string {
  if (type === "child") return "Child";
  if (type === "infant") return "Infant";
  return "Adult";
}

function ageFromDob(value?: string): string {
  if (!value) return "";
  const born = isoToDate(value);
  if (!born) return "";
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const month = now.getMonth() - born.getMonth();
  if (month < 0 || (month === 0 && now.getDate() < born.getDate())) age -= 1;
  return age >= 0 && age <= 120 ? String(age) : "";
}

function PersonIcon({ type }: { type?: string }) {
  const label = typeLabel(type);
  return (
    <span className="traveller-card-icon" aria-hidden="true" title={label}>
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
        <path
          d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.2 0-7 2.1-7 4.5V20h14v-1.5C19 16.1 16.2 14 12 14Z"
          fill="currentColor"
        />
      </svg>
    </span>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
      <path
        d="M5 7h14M10 11v6M14 11v6M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-9 0 1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function typeCounts(list: SavedTraveller[]) {
  const counts: Record<string, number> = { adult: 0, child: 0, infant: 0 };
  return list.map((person) => {
    const key = String(person.travellerType || "adult").toLowerCase();
    const bucket = key in counts ? key : "adult";
    counts[bucket] += 1;
    return { ...person, badge: `${typeLabel(bucket)} ${counts[bucket]}` };
  });
}

export default function TravellerListClient() {
  const [travellers, setTravellers] = useState<SavedTraveller[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<TravellerForm>(EMPTY_FORM);
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [dobError, setDobError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadTravellers = useCallback(async () => {
    try {
      const sessionUser = await ensureValidSession();
      if (!sessionUser) {
        logout();
        if (typeof window !== "undefined") {
          const next = encodeURIComponent("/account/travellers");
          window.location.assign(`/login?next=${next}`);
        }
        return null;
      }

      const rows = (await fetchSavedTravellers()) as SavedTraveller[];
      setTravellers(rows || []);
      setLoadError("");
      return rows || [];
    } catch (err) {
      if (isUnauthorizedError(err)) {
        logout();
        if (typeof window !== "undefined") {
          const next = encodeURIComponent("/account/travellers");
          window.location.assign(`/login?next=${next}`);
        }
        return null;
      }
      setLoadError("Your traveller list could not be loaded. Try again in a moment.");
      return null;
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    loadTravellers()
      .catch(() => null)
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [loadTravellers]);

  const cards = useMemo(() => typeCounts(travellers), [travellers]);
  const dobBounds = useMemo(() => dobBoundsForType(form.type, today()), [form.type]);

  function preferredIssueCountry() {
    const currency = getCurrentUser()?.currency || getActiveCurrencyCode();
    return defaultCountryForCurrency(currency);
  }

  function update(patch: Partial<TravellerForm>) {
    setForm((prev) => {
      const next = { ...prev, ...patch };

      if (patch.title) {
        next.gender = genderFromTitle(patch.title) as TravellerGender;
      }

      if (patch.hasDocument === false) {
        next.documentType = "passport";
        next.passport = "";
        next.passportIssueDate = "";
        next.passportExpiry = "";
        next.passportIssueCountry = "";
      }

      if (patch.hasDocument === true && !next.passportIssueCountry) {
        next.passportIssueCountry = preferredIssueCountry();
      }

      if (patch.documentType === "passport" && !next.passportIssueCountry) {
        next.passportIssueCountry = preferredIssueCountry();
      }

      if (patch.documentType && patch.documentType !== "passport") {
        next.passport = "";
        next.passportIssueDate = "";
        next.passportExpiry = "";
        next.passportIssueCountry = "";
      }

      if (patch.type && next.dob && !isDobValidForType(next.dob, patch.type)) {
        next.dob = "";
        setDobError("");
      } else if (patch.dob !== undefined) {
        setDobError(dobErrorForType(patch.dob, next.type));
      } else if (patch.type && next.dob) {
        setDobError(dobErrorForType(next.dob, next.type));
      }
      return next;
    });
  }

  async function addTraveller(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setFormError("Enter a first name and last name.");
      return;
    }
    if (form.dob) {
      const ageMessage = dobErrorForType(form.dob, form.type);
      if (ageMessage) {
        setDobError(ageMessage);
        setFormError(ageMessage);
        return;
      }
    }
    setSaving(true);
    setFormError("");
    setLoadError("");
    try {
      const saved = (await saveTravellerProfile(form)) as SavedTraveller | null;
      if (saved?.id) {
        setTravellers((prev) => [saved, ...prev.filter((row) => row.id !== saved.id)]);
      }
      const refreshed = await loadTravellers();
      if (refreshed) {
        setForm(EMPTY_FORM);
        setDobError("");
        setFormOpen(false);
      } else if (saved?.id) {
        // Keep the optimistic card even if a follow-up fetch fails.
        setForm(EMPTY_FORM);
        setDobError("");
        setFormOpen(false);
        setLoadError("");
      } else {
        setFormError("This traveller could not be saved.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "This traveller could not be saved.";
      setFormError(message);
    } finally {
      setSaving(false);
    }
  }

  async function removeTraveller(id: string) {
    setFormError("");
    setLoadError("");
    try {
      await removeSavedTraveller(id);
      setTravellers((prev) => prev.filter((row) => row.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : "This traveller could not be removed.";
      setFormError(message);
    }
  }

  const bannerError = formError || (travellers.length === 0 ? loadError : "");

  return (
    <AccountShell title="My traveller list">
      <p className="section-copy account-lede">
        Passengers saved on this account. Pick them during flight, hotel, or bus booking.
      </p>
      <div className="account-inline-actions">
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            setForm({
              ...EMPTY_FORM,
              passportIssueCountry: preferredIssueCountry(),
            });
            setDobError("");
            setFormOpen(true);
          }}
        >
          Add new traveller
        </button>
        {loadError && travellers.length > 0 ? (
          <button type="button" className="btn-ghost" onClick={() => loadTravellers()}>
            Retry sync
          </button>
        ) : null}
      </div>
      {bannerError ? <p className="field-error">{bannerError}</p> : null}

      {formOpen ? (
        <form className="checkout-section account-panel traveller-form-panel" onSubmit={addTraveller}>
          <div>
            <h2 className="checkout-section-title">Add traveller</h2>
            <p className="traveller-form-section-copy">
              Save passenger details once, then reuse them for flight, hotel, or bus checkout.
            </p>
          </div>

          <section className="traveller-form-section">
            <h3 className="traveller-form-section-title">Identity</h3>
            <div className="traveller-identity-grid">
              <div className="traveller-identity-row traveller-identity-row-compact">
                <TitleSelect
                  id="new-title"
                  value={form.title}
                  onChange={(title) => update({ title })}
                />
                <GenderSelect
                  id="new-gender"
                  value={form.gender}
                  onChange={(gender) => update({ gender })}
                />
              </div>
              <div className="traveller-identity-row">
                <div className="search-field">
                  <label className="field-label" htmlFor="new-first">
                    First name
                  </label>
                  <input
                    id="new-first"
                    className="field-input"
                    value={form.firstName}
                    onChange={(event) => update({ firstName: event.target.value })}
                    placeholder="As on travel document"
                    autoComplete="given-name"
                  />
                </div>
                <div className="search-field">
                  <label className="field-label" htmlFor="new-last">
                    Last name
                  </label>
                  <input
                    id="new-last"
                    className="field-input"
                    value={form.lastName}
                    onChange={(event) => update({ lastName: event.target.value })}
                    placeholder="As on travel document"
                    autoComplete="family-name"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="traveller-form-section">
            <h3 className="traveller-form-section-title">Passenger category</h3>
            <p className="traveller-form-section-copy">
              Type controls the allowed date of birth range for Adult, Child, and Infant.
            </p>
            <div className="booking-form-grid">
              <PassengerTypeSelect
                id="new-type"
                value={form.type}
                onChange={(type) => update({ type })}
              />
              <div className="search-field">
                <DatePicker
                  id="new-dob"
                  label="Date of birth"
                  value={isoToDate(form.dob)}
                  minDate={dobBounds.minDate}
                  maxDate={dobBounds.maxDate}
                  placeholder="Select date of birth"
                  onChange={(date) => update({ dob: dateToIso(date) })}
                />
                {dobError ? <p className="field-error">{dobError}</p> : null}
              </div>
            </div>
          </section>

          <section className="traveller-form-section">
            <h3 className="traveller-form-section-title">Travel document</h3>
            <p className="traveller-form-section-copy">
              Optional. Only passport details are saved for booking validation right now.
            </p>

            <label className="traveller-doc-check" htmlFor="new-has-document">
              <input
                id="new-has-document"
                type="checkbox"
                checked={form.hasDocument}
                onChange={(event) => update({ hasDocument: event.target.checked })}
              />
              <span>
                <strong>Add a travel document</strong>
                <small>Show document type and passport fields when needed</small>
              </span>
            </label>

            {form.hasDocument ? (
              <div className="traveller-doc-fields">
                <div className="booking-form-grid">
                  <DocumentTypeSelect
                    id="new-document-type"
                    value={form.documentType}
                    onChange={(documentType) => update({ documentType })}
                  />
                </div>

                {form.documentType === "passport" ? (
                  <div className="booking-form-grid">
                    <div className="search-field">
                      <label className="field-label" htmlFor="new-passport">
                        Passport number
                      </label>
                      <input
                        id="new-passport"
                        className="field-input"
                        value={form.passport}
                        onChange={(event) => update({ passport: event.target.value })}
                        placeholder="Passport number"
                      />
                    </div>
                    <div className="search-field">
                      <DatePicker
                        id="new-passport-issue"
                        label="Passport issue date"
                        value={isoToDate(form.passportIssueDate)}
                        minDate={new Date(1980, 0, 1)}
                        maxDate={today()}
                        placeholder="Select issue date"
                        onChange={(date) => update({ passportIssueDate: dateToIso(date) })}
                      />
                    </div>
                    <div className="search-field">
                      <DatePicker
                        id="new-passport-exp"
                        label="Passport expiry date"
                        value={isoToDate(form.passportExpiry)}
                        minDate={today()}
                        maxDate={new Date(today().getFullYear() + 20, 11, 31)}
                        placeholder="Select expiry date"
                        onChange={(date) => update({ passportExpiry: dateToIso(date) })}
                      />
                    </div>
                    <CountrySelect
                      id="new-passport-country"
                      label="Passport issue country"
                      value={form.passportIssueCountry}
                      onChange={(passportIssueCountry) => update({ passportIssueCountry })}
                      placeholder="Search all countries"
                    />
                  </div>
                ) : (
                  <p className="traveller-form-section-copy">
                    Only passport is accepted as a valid travel document for bookings. Choose
                    Passport to enter number, issue date, expiry date, and issue country.
                  </p>
                )}
              </div>
            ) : null}
          </section>

          <div className="account-inline-actions">
            <button className="btn-primary" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save traveller"}
            </button>
            <button className="btn-ghost" type="button" onClick={() => setFormOpen(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {loading ? <p className="section-copy">Loading travellers…</p> : null}
      {!loading && travellers.length === 0 && !loadError ? (
        <p className="section-copy">No travellers saved on this account yet.</p>
      ) : null}

      <div className="traveller-list grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((person) => {
          const fullName =
            [person.title, person.firstName, person.lastName].filter(Boolean).join(" ") || "Traveller";
          const age = ageFromDob(person.dateOfBirth);
          return (
            <article
              key={person.id}
              className="traveller-card min-w-0 overflow-hidden rounded-xl border border-[color:var(--line)] bg-white transition-all duration-200 hover:shadow-md"
            >
              <div className="traveller-card-split grid min-w-0 grid-cols-[5.5rem_minmax(0,1fr)]">
                <div className="traveller-card-accent flex min-w-0 flex-col items-center justify-center gap-2 border-r border-cyan-100 bg-cyan-50 px-2 py-4 text-center dark:border-cyan-900/40 dark:bg-cyan-950/30">
                  <PersonIcon type={person.travellerType} />
                  <span className="traveller-card-badge break-words text-[0.68rem] font-extrabold uppercase tracking-[0.08em] text-[color:var(--brand-deep)]">
                    {person.badge}
                  </span>
                  <span className="traveller-card-status rounded-full bg-white/80 px-2 py-0.5 text-[0.65rem] font-bold text-[color:var(--brand)]">
                    Saved
                  </span>
                </div>

                <div className="traveller-card-body relative min-w-0 overflow-hidden p-3.5 sm:p-4">
                  <button
                    type="button"
                    className="traveller-remove-btn absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-600 hover:text-white"
                    aria-label={`Remove ${fullName}`}
                    title={`Remove ${fullName}`}
                    onClick={() => removeTraveller(person.id)}
                  >
                    <TrashIcon />
                    <span>Remove</span>
                  </button>

                  <h2 className="traveller-card-name mb-3 max-w-[calc(100%-5.5rem)] truncate text-base font-extrabold text-[color:var(--ink)] sm:text-lg">
                    {fullName}
                  </h2>

                  <dl className="traveller-card-facts grid min-w-0 gap-2 text-sm">
                    <div className="traveller-fact min-w-0">
                      <dt className="text-[0.68rem] font-bold uppercase tracking-[0.06em] text-[color:var(--ink-muted)]">
                        Age / DOB
                      </dt>
                      <dd className="break-words font-semibold text-[color:var(--ink)]">
                        {person.dateOfBirth
                          ? `${person.dateOfBirth}${age ? ` · ${age} yrs` : ""}`
                          : "Not added"}
                      </dd>
                    </div>
                    <div className="traveller-fact min-w-0">
                      <dt className="text-[0.68rem] font-bold uppercase tracking-[0.06em] text-[color:var(--ink-muted)]">
                        Gender
                      </dt>
                      <dd className="break-words font-semibold text-[color:var(--ink)]">
                        {genderLabel(person.gender)}
                      </dd>
                    </div>
                    <div className="traveller-fact min-w-0">
                      <dt className="text-[0.68rem] font-bold uppercase tracking-[0.06em] text-[color:var(--ink-muted)]">
                        Passport / ID
                      </dt>
                      <dd className="break-words font-semibold text-[color:var(--ink)]">
                        {person.passportNumber
                          ? [
                              person.passportNumber,
                              person.passportIssueCountry || person.nationality,
                              person.passportIssueDate ? `Issued ${person.passportIssueDate}` : "",
                              person.passportExpiry ? `Exp ${person.passportExpiry}` : "",
                            ]
                              .filter(Boolean)
                              .join(" · ")
                          : "Not added"}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </AccountShell>
  );
}
