"use client";

import DatePicker from "@/components/ui/DatePicker";
import { today } from "@/lib/dateUtils";
import { dobBoundsForType, dobErrorForType } from "@/lib/travellerAge";

export function FieldError({ message }) {
  if (!message) return null;
  return <p className="field-error">{message}</p>;
}

export function isValidAge(value) {
  if (value === "" || value == null) return false;
  const age = Number(value);
  return Number.isInteger(age) && age >= 0 && age <= 120;
}

export function ageFromDob(value) {
  if (!value) return "";
  const born = new Date(value);
  if (Number.isNaN(born.getTime())) return "";
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const month = now.getMonth() - born.getMonth();
  if (month < 0 || (month === 0 && now.getDate() < born.getDate())) age -= 1;
  return age >= 0 && age <= 120 ? String(age) : "";
}

function TravellerListIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="9" cy="7" r="3.2" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M19 8v6M22 11h-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ChooseTravellerButton({ onClick, children = "Choose from traveller list" }) {
  if (!onClick) return null;
  return (
    <button type="button" className="traveller-list-btn" onClick={onClick}>
      <TravellerListIcon />
      <span>{children}</span>
    </button>
  );
}

export function AgeField({ id, value, error, onChange }) {
  return (
    <div className="search-field checkout-age-field">
      <label className="field-label" htmlFor={id}>
        Age
      </label>
      <input
        id={id}
        className={`field-input ${error ? "is-invalid" : ""}`}
        inputMode="numeric"
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, "").slice(0, 3))}
        placeholder="Age"
        aria-required="true"
      />
      <FieldError message={error} />
    </div>
  );
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

function TravellerDobField({ id, type, value, error, onChange }) {
  const bounds = dobBoundsForType(type || "adult", today());
  const helper = error || dobErrorForType(value, type || "adult");
  return (
    <div className="search-field">
      <DatePicker
        id={id}
        label="Date of birth"
        value={isoToDate(value)}
        minDate={bounds.minDate}
        maxDate={bounds.maxDate}
        placeholder="Select date of birth"
        onChange={(date) => onChange(dateToIso(date))}
      />
      <FieldError message={helper} />
    </div>
  );
}

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
          <ChooseTravellerButton onClick={onSelectSaved ? () => onSelectSaved(person) : null} />
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
            <TravellerDobField
              id={`dob-${person.id}`}
              type={person.type || "adult"}
              value={person.dob}
              error={errors[`${person.id}-dob`]}
              onChange={(dob) => onChangeTraveller(person.id, { dob })}
            />
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
        The lead guest should match the name on the payment card later. Age is required for every guest.
      </p>

      <div className="guest-block">
        <h3 className="guest-block-title">Lead guest</h3>
        <ChooseTravellerButton onClick={onOpenTravellers || null} />
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
          <AgeField
            id="lead-age"
            value={leadGuest.age}
            error={errors.leadAge}
            onChange={(age) => onChangeLead({ ...leadGuest, age })}
          />
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
            <AgeField
              id={`add-age-${guest.id}`}
              value={guest.age}
              error={errors[`addAge-${guest.id}`]}
              onChange={(age) => onChangeAdditional(guest.id, { age })}
            />
          </div>
        </div>
      ))}

      <h3 className="booking-subsection-title">Contact information</h3>
      <ContactFields values={contact} errors={errors} onChange={onChangeContact} />
    </section>
  );
}

export function BusPassengerForm({
  passengers,
  onChangePassenger,
  contact,
  onChangeContact,
  errors,
  onOpenTravellers,
}) {
  const people = passengers?.length ? passengers : [];
  return (
    <section className="booking-section" id="traveller">
      <h2 className="booking-section-title">Passenger information</h2>
      <p className="booking-section-copy">
        One passenger for each selected seat, up to 6. Age is required for every passenger.
      </p>
      {people.length ? (
        people.map((passenger, index) => (
          <div key={passenger.seat || passenger.id} className="guest-block">
            <h3 className="guest-block-title">
              Seat {passenger.seat || index + 1}
            </h3>
            <ChooseTravellerButton
              onClick={onOpenTravellers ? () => onOpenTravellers(passenger) : null}
            />
            <div className="booking-form-grid">
              <div className="search-field">
                <label className="field-label" htmlFor={`bus-first-${passenger.seat}`}>
                  First name
                </label>
                <input
                  id={`bus-first-${passenger.seat}`}
                  className={`field-input ${errors[`${passenger.seat}-firstName`] ? "is-invalid" : ""}`}
                  value={passenger.firstName}
                  onChange={(event) =>
                    onChangePassenger(passenger.seat, { firstName: event.target.value })
                  }
                  placeholder="Aisha"
                  autoComplete="given-name"
                />
                <FieldError message={errors[`${passenger.seat}-firstName`]} />
              </div>
              <div className="search-field">
                <label className="field-label" htmlFor={`bus-last-${passenger.seat}`}>
                  Last name
                </label>
                <input
                  id={`bus-last-${passenger.seat}`}
                  className={`field-input ${errors[`${passenger.seat}-lastName`] ? "is-invalid" : ""}`}
                  value={passenger.lastName}
                  onChange={(event) =>
                    onChangePassenger(passenger.seat, { lastName: event.target.value })
                  }
                  placeholder="Meridian"
                  autoComplete="family-name"
                />
                <FieldError message={errors[`${passenger.seat}-lastName`]} />
              </div>
              <AgeField
                id={`bus-age-${passenger.seat}`}
                value={passenger.age}
                error={errors[`${passenger.seat}-age`]}
                onChange={(age) => onChangePassenger(passenger.seat, { age })}
              />
            </div>
          </div>
        ))
      ) : (
        <p className="booking-section-copy">Select at least one seat to add a passenger.</p>
      )}

      <h3 className="booking-subsection-title">Contact information</h3>
      <ContactFields values={contact} errors={errors} onChange={onChangeContact} />
    </section>
  );
}

export function TransferPassengerForm({
  passengers,
  onChangePassenger,
  contact,
  onChangeContact,
  errors,
  transferNotes,
  onChangeNotes,
  onOpenTravellers,
}) {
  const people = passengers?.length ? passengers : [];
  return (
    <section className="booking-section" id="traveller">
      <h2 className="booking-section-title">Passenger information</h2>
      <p className="booking-section-copy">
        Add names for everyone travelling in the vehicle. Age is required for each passenger.
      </p>
      {people.map((passenger, index) => (
        <div key={passenger.id || index} className="guest-block">
          <h3 className="guest-block-title">
            {index === 0 ? "Lead passenger" : `Passenger ${index + 1}`}
          </h3>
          <ChooseTravellerButton
            onClick={onOpenTravellers ? () => onOpenTravellers(passenger, index) : null}
          />
          <div className="booking-form-grid">
            <div className="search-field">
              <label className="field-label" htmlFor={`xfer-first-${passenger.id}`}>
                First name
              </label>
              <input
                id={`xfer-first-${passenger.id}`}
                className={`field-input ${errors[`${passenger.id}-firstName`] ? "is-invalid" : ""}`}
                value={passenger.firstName}
                onChange={(event) =>
                  onChangePassenger(passenger.id, { firstName: event.target.value })
                }
                placeholder="Aisha"
                autoComplete="given-name"
              />
              <FieldError message={errors[`${passenger.id}-firstName`]} />
            </div>
            <div className="search-field">
              <label className="field-label" htmlFor={`xfer-last-${passenger.id}`}>
                Last name
              </label>
              <input
                id={`xfer-last-${passenger.id}`}
                className={`field-input ${errors[`${passenger.id}-lastName`] ? "is-invalid" : ""}`}
                value={passenger.lastName}
                onChange={(event) =>
                  onChangePassenger(passenger.id, { lastName: event.target.value })
                }
                placeholder="Meridian"
                autoComplete="family-name"
              />
              <FieldError message={errors[`${passenger.id}-lastName`]} />
            </div>
            <AgeField
              id={`xfer-age-${passenger.id}`}
              value={passenger.age}
              error={errors[`${passenger.id}-age`]}
              onChange={(age) => onChangePassenger(passenger.id, { age })}
            />
          </div>
        </div>
      ))}

      <h3 className="booking-subsection-title">Transfer notes (optional)</h3>
      <p className="booking-section-copy">
        Flight number and pickup instructions help the driver. They are optional for mock bookings.
      </p>
      <div className="booking-form-grid">
        <div className="search-field">
          <label className="field-label" htmlFor="xfer-flight-number">
            Flight number
          </label>
          <input
            id="xfer-flight-number"
            className="field-input"
            value={transferNotes?.flightNumber || ""}
            onChange={(event) =>
              onChangeNotes?.({ ...transferNotes, flightNumber: event.target.value })
            }
            placeholder="AI101"
            autoComplete="off"
          />
        </div>
        <div className="search-field">
          <label className="field-label" htmlFor="xfer-pickup-instructions">
            Pickup instructions
          </label>
          <input
            id="xfer-pickup-instructions"
            className="field-input"
            value={transferNotes?.pickupInstructions || ""}
            onChange={(event) =>
              onChangeNotes?.({
                ...transferNotes,
                pickupInstructions: event.target.value,
              })
            }
            placeholder="Meet at Arrivals Gate 3"
            autoComplete="off"
          />
        </div>
      </div>

      <h3 className="booking-subsection-title">Contact information</h3>
      <ContactFields values={contact} errors={errors} onChange={onChangeContact} />
    </section>
  );
}

