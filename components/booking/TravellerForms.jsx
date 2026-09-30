"use client";

import DatePicker from "@/components/ui/DatePicker";
import { today } from "@/lib/dateUtils";

export function FieldError({ message }) {
  if (!message) return null;
  return <p className="field-error">{message}</p>;
}

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

const BIRTH_MIN = new Date(1920, 0, 1);

export function ContactFields({ values, errors, onChange }) {
  return (
    <div className="booking-form-grid">
      <div className="search-field">
        <label className="field-label" htmlFor="contact-email">
          Email
        </label>
        <input
          id="contact-email"
          className={`field-input ${errors.email ? "is-invalid" : ""}`}
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={(e) => onChange({ ...values, email: e.target.value })}
          placeholder="you@example.com"
        />
        <FieldError message={errors.email} />
      </div>
      <div className="search-field">
        <label className="field-label" htmlFor="contact-phone">
          Phone
        </label>
        <input
          id="contact-phone"
          className={`field-input ${errors.phone ? "is-invalid" : ""}`}
          type="tel"
          autoComplete="tel"
          value={values.phone}
          onChange={(e) => onChange({ ...values, phone: e.target.value })}
          placeholder="+1 555 0100"
        />
        <FieldError message={errors.phone} />
      </div>
    </div>
  );
}

export function FlightTravellerForm({
  travellers,
  onChangeTraveller,
  contact,
  onChangeContact,
  errors,
  showPassport,
  savedTravellers = [],
  onSelectSaved,
  onSaveTraveller,
  contactHint = "",
}) {
  return (
    <section className="booking-section" id="traveller">
      <h2 className="booking-section-title">Traveller information</h2>
      <p className="booking-section-copy">
        Select a saved traveller or enter names exactly as they appear on travel documents. You can edit any field after selecting.
      </p>

      {travellers.map((person, index) => (
        <div key={person.id} className="guest-block">
          <h3 className="guest-block-title">
            Traveller {index + 1}
            {person.type !== "adult" ? ` · ${person.type}` : ""}
          </h3>
          {onSelectSaved ? (
            <div className="booking-form-grid">
              <div className="search-field search-field-action">
                <button
                  type="button"
                  className="traveller-list-btn"
                  onClick={() => onSelectSaved(person)}
                >
                  Choose from traveller list
                </button>
              </div>
              <div className="search-field search-field-action">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => onSaveTraveller?.(person)}
                >
                  Save to traveller list
                </button>
              </div>
            </div>
          ) : null}
          <div className="booking-form-grid">
            <div className="search-field">
              <label className="field-label" htmlFor={`title-${person.id}`}>
                Title
              </label>
              <select
                id={`title-${person.id}`}
                className="field-select"
                value={person.title}
                onChange={(e) =>
                  onChangeTraveller(person.id, { title: e.target.value })
                }
              >
                <option value="Mr">Mr</option>
                <option value="Ms">Ms</option>
                <option value="Mrs">Mrs</option>
                <option value="Mx">Mx</option>
              </select>
            </div>
            <div className="search-field">
              <label className="field-label" htmlFor={`first-${person.id}`}>
                First name
              </label>
              <input
                id={`first-${person.id}`}
                className={`field-input ${errors[`${person.id}-firstName`] ? "is-invalid" : ""}`}
                value={person.firstName}
                onChange={(e) =>
                  onChangeTraveller(person.id, { firstName: e.target.value })
                }
                placeholder="Aisha"
                autoComplete="given-name"
              />
              <FieldError message={errors[`${person.id}-firstName`]} />
            </div>
            <div className="search-field">
              <label className="field-label" htmlFor={`last-${person.id}`}>
                Last name
              </label>
              <input
                id={`last-${person.id}`}
                className={`field-input ${errors[`${person.id}-lastName`] ? "is-invalid" : ""}`}
                value={person.lastName}
                onChange={(e) =>
                  onChangeTraveller(person.id, { lastName: e.target.value })
                }
                placeholder="Meridian"
                autoComplete="family-name"
              />
              <FieldError message={errors[`${person.id}-lastName`]} />
            </div>
            <div className="search-field">
              <DatePicker
                id={`dob-${person.id}`}
                label="Date of birth"
                value={isoToDate(person.dob)}
                minDate={BIRTH_MIN}
                maxDate={today()}
                placeholder="Select date of birth"
                onChange={(date) => onChangeTraveller(person.id, { dob: dateToIso(date) })}
              />
              <FieldError message={errors[`${person.id}-dob`]} />
            </div>
            <div className="search-field">
              <label className="field-label" htmlFor={`gender-${person.id}`}>
                Gender
              </label>
              <select
                id={`gender-${person.id}`}
                className="field-select"
                value={person.gender}
                onChange={(e) =>
                  onChangeTraveller(person.id, { gender: e.target.value })
                }
              >
                <option value="">Select</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="unspecified">Prefer not to say</option>
              </select>
              <FieldError message={errors[`${person.id}-gender`]} />
            </div>
            <div className="search-field">
              <label className="field-label" htmlFor={`nat-${person.id}`}>
                Nationality
              </label>
              <input
                id={`nat-${person.id}`}
                className={`field-input ${errors[`${person.id}-nationality`] ? "is-invalid" : ""}`}
                value={person.nationality}
                onChange={(e) =>
                  onChangeTraveller(person.id, { nationality: e.target.value })
                }
                placeholder="e.g. United Arab Emirates"
              />
              <FieldError message={errors[`${person.id}-nationality`]} />
            </div>
            {showPassport ? (
              <>
                <div className="search-field">
                  <label className="field-label" htmlFor={`pass-${person.id}`}>
                    Passport number
                  </label>
                  <input
                    id={`pass-${person.id}`}
                    className={`field-input ${errors[`${person.id}-passport`] ? "is-invalid" : ""}`}
                    value={person.passport}
                    onChange={(e) =>
                      onChangeTraveller(person.id, { passport: e.target.value })
                    }
                  />
                  <FieldError message={errors[`${person.id}-passport`]} />
                </div>
                <div className="search-field">
                  <DatePicker
                    id={`pass-exp-${person.id}`}
                    label="Passport expiry"
                    value={isoToDate(person.passportExpiry)}
                    minDate={today()}
                    maxDate={new Date(today().getFullYear() + 20, 11, 31)}
                    placeholder="Select expiry"
                    onChange={(date) =>
                      onChangeTraveller(person.id, { passportExpiry: dateToIso(date) })
                    }
                  />
                  <FieldError message={errors[`${person.id}-passportExpiry`]} />
                </div>
              </>
            ) : null}
          </div>
        </div>
      ))}

      <h3 className="booking-subsection-title">Contact information</h3>
      <p className="booking-section-copy">
        {contactHint || "Booking confirmation and updates will be sent here."}
      </p>
      <ContactFields values={contact} errors={errors} onChange={onChangeContact} />
    </section>
  );
}

export function HotelGuestForm({
  leadGuest,
  onChangeLead,
  additionalGuests,
  onChangeAdditional,
  contact,
  onChangeContact,
  errors,
  onOpenTravellers,
}) {
  return (
    <section className="booking-section" id="traveller">
      <h2 className="booking-section-title">Guest information</h2>
      <p className="booking-section-copy">
        The lead guest should match the name on the payment card later.
      </p>

      <div className="guest-block">
        <h3 className="guest-block-title">Lead guest</h3>
        {onOpenTravellers ? (
          <button type="button" className="traveller-list-btn" onClick={onOpenTravellers}>
            Choose from traveller list
          </button>
        ) : null}
        <div className="booking-form-grid">
          <div className="search-field">
            <label className="field-label" htmlFor="lead-first">
              First name
            </label>
            <input
              id="lead-first"
              className={`field-input ${errors.leadFirst ? "is-invalid" : ""}`}
              value={leadGuest.firstName}
              onChange={(e) => onChangeLead({ ...leadGuest, firstName: e.target.value })}
              placeholder="Aisha"
              autoComplete="given-name"
            />
            <FieldError message={errors.leadFirst} />
          </div>
          <div className="search-field">
            <label className="field-label" htmlFor="lead-last">
              Last name
            </label>
            <input
              id="lead-last"
              className={`field-input ${errors.leadLast ? "is-invalid" : ""}`}
              value={leadGuest.lastName}
              onChange={(e) => onChangeLead({ ...leadGuest, lastName: e.target.value })}
              placeholder="Meridian"
              autoComplete="family-name"
            />
            <FieldError message={errors.leadLast} />
          </div>
        </div>
      </div>

      {additionalGuests.map((guest, index) => (
        <div key={guest.id} className="guest-block">
          <h3 className="guest-block-title">Additional guest {index + 1}</h3>
          <div className="booking-form-grid">
            <div className="search-field">
              <label className="field-label" htmlFor={`add-first-${guest.id}`}>
                First name
              </label>
              <input
                id={`add-first-${guest.id}`}
                className="field-input"
                value={guest.firstName}
                onChange={(e) =>
                  onChangeAdditional(guest.id, { firstName: e.target.value })
                }
              />
            </div>
            <div className="search-field">
              <label className="field-label" htmlFor={`add-last-${guest.id}`}>
                Last name
              </label>
              <input
                id={`add-last-${guest.id}`}
                className="field-input"
                value={guest.lastName}
                onChange={(e) =>
                  onChangeAdditional(guest.id, { lastName: e.target.value })
                }
              />
            </div>
          </div>
        </div>
      ))}

      <h3 className="booking-subsection-title">Contact information</h3>
      <ContactFields values={contact} errors={errors} onChange={onChangeContact} />
    </section>
  );
}

export function BusPassengerForm({ passenger, onChangePassenger, contact, onChangeContact, errors, onOpenTravellers }) {
  return (
    <section className="booking-section" id="traveller">
      <h2 className="booking-section-title">Passenger information</h2>
      <div className="guest-block">
        {onOpenTravellers ? (
          <button type="button" className="traveller-list-btn" onClick={onOpenTravellers}>
            Choose from traveller list
          </button>
        ) : null}
        <div className="booking-form-grid">
          <div className="search-field">
            <label className="field-label" htmlFor="bus-first">
              First name
            </label>
            <input
              id="bus-first"
              className={`field-input ${errors.firstName ? "is-invalid" : ""}`}
              value={passenger.firstName}
              onChange={(e) =>
                onChangePassenger({ ...passenger, firstName: e.target.value })
              }
              placeholder="Aisha"
              autoComplete="given-name"
            />
            <FieldError message={errors.firstName} />
          </div>
          <div className="search-field">
            <label className="field-label" htmlFor="bus-last">
              Last name
            </label>
            <input
              id="bus-last"
              className={`field-input ${errors.lastName ? "is-invalid" : ""}`}
              value={passenger.lastName}
              onChange={(e) =>
                onChangePassenger({ ...passenger, lastName: e.target.value })
              }
              placeholder="Meridian"
              autoComplete="family-name"
            />
            <FieldError message={errors.lastName} />
          </div>
        </div>
      </div>

      <h3 className="booking-subsection-title">Contact information</h3>
      <ContactFields values={contact} errors={errors} onChange={onChangeContact} />
    </section>
  );
}
