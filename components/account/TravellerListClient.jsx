"use client";

import { useEffect, useState } from "react";
import AccountShell from "@/components/account/AccountShell";
import DatePicker from "@/components/ui/DatePicker";
import { today } from "@/lib/dateUtils";
import {
  fetchSavedTravellers,
  removeSavedTraveller,
  saveTravellerProfile,
} from "@/lib/api/travellers";

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  dob: "",
  type: "adult",
  passport: "",
  passportExpiry: "",
};

const BIRTH_MIN = new Date(1920, 0, 1);

function isoToDate(value) {
  if (!value) return null;
  const [year, month, day] = String(value).split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function dateToIso(date) {
  if (!date) return "";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function typeLabel(type) {
  if (type === "child") return "Child";
  if (type === "infant") return "Infant";
  return "Adult";
}

export default function TravellerListClient() {
  const [travellers, setTravellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let ignore = false;
    fetchSavedTravellers()
      .then((rows) => {
        if (!ignore) setTravellers(rows);
      })
      .catch(() => {
        if (!ignore) setError("Your traveller list could not be loaded.");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  function update(patch) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  async function addTraveller(event) {
    event.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError("Enter a first name and last name.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const saved = await saveTravellerProfile(form);
      if (saved) {
        setTravellers((prev) => [saved, ...prev.filter((row) => row.id !== saved.id)]);
        setForm(EMPTY_FORM);
        setFormOpen(false);
      }
    } catch (err) {
      setError(err?.message || "This traveller could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function removeTraveller(id) {
    setError("");
    try {
      await removeSavedTraveller(id);
      setTravellers((prev) => prev.filter((row) => row.id !== id));
    } catch (err) {
      setError(err?.message || "This traveller could not be removed.");
    }
  }

  return (
    <AccountShell title="My traveller list">
      <p className="section-copy account-lede">
        Passengers saved on this account. Pick them during flight, hotel, or bus booking.
      </p>
      <div className="account-inline-actions">
        <button type="button" className="btn-primary" onClick={() => setFormOpen(true)}>
          Add new traveller
        </button>
      </div>
      {error ? <p className="field-error">{error}</p> : null}

      {formOpen ? (
        <form className="checkout-section account-panel" onSubmit={addTraveller}>
          <h2 className="checkout-section-title">Add traveller</h2>
          <div className="booking-form-grid">
            <div className="search-field">
              <label className="field-label" htmlFor="new-first">
                First name
              </label>
              <input
                id="new-first"
                className="field-input"
                value={form.firstName}
                onChange={(event) => update({ firstName: event.target.value })}
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
              />
            </div>
            <div className="search-field">
              <DatePicker
                id="new-dob"
                label="Date of birth"
                value={isoToDate(form.dob)}
                minDate={BIRTH_MIN}
                maxDate={today()}
                placeholder="Select date of birth"
                onChange={(date) => update({ dob: dateToIso(date) })}
              />
            </div>
            <div className="search-field">
              <label className="field-label" htmlFor="new-type">
                Type
              </label>
              <select
                id="new-type"
                className="field-select"
                value={form.type}
                onChange={(event) => update({ type: event.target.value })}
              >
                <option value="adult">Adult</option>
                <option value="child">Child</option>
                <option value="infant">Infant</option>
              </select>
            </div>
            <div className="search-field">
              <label className="field-label" htmlFor="new-passport">
                Passport number
              </label>
              <input
                id="new-passport"
                className="field-input"
                value={form.passport}
                onChange={(event) => update({ passport: event.target.value })}
              />
            </div>
            <div className="search-field">
              <DatePicker
                id="new-passport-exp"
                label="Passport expiry"
                value={isoToDate(form.passportExpiry)}
                minDate={today()}
                maxDate={new Date(today().getFullYear() + 20, 11, 31)}
                placeholder="Select expiry"
                onChange={(date) => update({ passportExpiry: dateToIso(date) })}
              />
            </div>
          </div>
          <p className="result-card-meta">Passport details are optional.</p>
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
      {!loading && travellers.length === 0 ? (
        <p className="section-copy">No travellers saved on this account yet.</p>
      ) : null}
      <div className="traveller-list">
        {travellers.map((person) => (
          <article key={person.id} className="checkout-section traveller-card">
            <p className="result-card-kicker">{typeLabel(person.travellerType)}</p>
            <h2 className="checkout-section-title">
              {person.firstName} {person.lastName}
            </h2>
            <p className="result-card-meta">
              Date of birth: {person.dateOfBirth || "Not added"}
            </p>
            <p className="result-card-meta">
              Passport: {person.passportNumber || "Not added"}
              {person.passportExpiry ? ` · Expires ${person.passportExpiry}` : ""}
            </p>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => removeTraveller(person.id)}
            >
              Remove
            </button>
          </article>
        ))}
      </div>
    </AccountShell>
  );
}
