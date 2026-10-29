"use client";

import { useEffect, useState } from "react";
import DatePicker from "@/components/ui/DatePicker";
import PremiumSelect from "@/components/ui/PremiumSelect";
import {
  CAB_LEAD_MESSAGE,
  CAB_TIME_ZONE,
  dateFromIso,
  formatEarliestPickup,
  isPickupAllowed,
  minimumPickup,
  toIsoDate,
} from "@/lib/cabPickupLead";
import { buildTransferSearchQuery } from "@/lib/searchQuery";

const LOCATION_KINDS = [
  { value: "AIRPORT", label: "Airport" },
  { value: "HOTEL", label: "Hotel" },
  { value: "CITY", label: "City" },
  { value: "ADDRESS", label: "Address" },
];

const TRIP_TYPES = [
  ["AIRPORT_TRANSFER", "Airport Transfer"],
  ["OUTSTATION", "Outstation"],
  ["LOCAL", "Local"],
];

const TRIP_KINDS = {
  AIRPORT_TRANSFER: ["AIRPORT", "HOTEL"],
  OUTSTATION: ["CITY", "CITY"],
  LOCAL: ["CITY", "ADDRESS"],
};

export default function TransferSearchForm({ onSearchChange, initialValues, submit }) {
  const opening = minimumPickup(new Date(), CAB_TIME_ZONE);
  const [tripType, setTripType] = useState(
    () => initialValues?.tripType || "AIRPORT_TRANSFER",
  );
  const [pickup, setPickup] = useState(
    () => initialValues?.pickup || "Delhi Airport (DEL)",
  );
  const [dropoff, setDropoff] = useState(
    () => initialValues?.dropoff || "The Leela Palace Delhi",
  );
  const [pickupKind, setPickupKind] = useState(
    () => initialValues?.pickupKind || "AIRPORT",
  );
  const [dropoffKind, setDropoffKind] = useState(
    () => initialValues?.dropoffKind || "HOTEL",
  );
  const [travelDate, setTravelDate] = useState(
    () => initialValues?.travelDate || dateFromIso(opening.date),
  );
  const [pickupTime, setPickupTime] = useState(
    () => initialValues?.pickupTime || opening.time,
  );
  const [passengers, setPassengers] = useState(
    () => Number(initialValues?.passengers || 1),
  );
  const [scheduleTouched, setScheduleTouched] = useState(
    () => Boolean(initialValues?.travelDate || initialValues?.pickupTime),
  );
  const [clock, setClock] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 15000);
    const refresh = () => setClock(new Date());
    window.addEventListener("focus", refresh);
    window.addEventListener("apl-cab-clock", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("apl-cab-clock", refresh);
    };
  }, []);

  const earliest = minimumPickup(clock, CAB_TIME_ZONE);

  useEffect(() => {
    if (scheduleTouched) return;
    setTravelDate(dateFromIso(earliest.date));
    setPickupTime(earliest.time);
  }, [earliest.date, earliest.time, scheduleTouched]);
  const selectedDate = toIsoDate(travelDate);
  const allowed = isPickupAllowed(selectedDate, pickupTime, clock, CAB_TIME_ZONE);
  const timeLimited = selectedDate === earliest.date;

  useEffect(() => {
    const query = buildTransferSearchQuery({
      tripType,
      pickup,
      dropoff,
      pickupKind,
      dropoffKind,
      travelDate,
      pickupTime,
      passengers,
    });
    onSearchChange?.({
      ...query,
      timeZone: CAB_TIME_ZONE,
      error: allowed ? "" : CAB_LEAD_MESSAGE,
    });
  }, [
    tripType,
    pickup,
    dropoff,
    pickupKind,
    dropoffKind,
    travelDate,
    pickupTime,
    passengers,
    allowed,
    onSearchChange,
  ]);

  function selectTrip(next) {
    const [nextPickup, nextDrop] = TRIP_KINDS[next] || TRIP_KINDS.AIRPORT_TRANSFER;
    setTripType(next);
    setPickupKind(nextPickup);
    setDropoffKind(nextDrop);
  }

  return (
    <div className="search-form-grid cab-search-grid">
      <div className="field cab-trip-field">
        <span className="field-label">Trip type</span>
        <div className="cab-trip-types" role="radiogroup" aria-label="Trip type">
          {TRIP_TYPES.map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={tripType === value}
              className={tripType === value ? "is-on" : ""}
              onClick={() => selectTrip(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <label className="field">
        <span className="field-label">Pickup</span>
        <input
          className="field-input"
          value={pickup}
          onChange={(event) => setPickup(event.target.value)}
          placeholder="Airport / hotel / address"
        />
      </label>
      <label className="field">
        <span className="field-label">Drop-off</span>
        <input
          className="field-input"
          value={dropoff}
          onChange={(event) => setDropoff(event.target.value)}
          placeholder="Hotel / city / address"
        />
      </label>
      <PremiumSelect
        id="transfer-pickup-kind"
        label="Pickup type"
        value={pickupKind}
        onChange={setPickupKind}
        options={LOCATION_KINDS}
      />
      <PremiumSelect
        id="transfer-dropoff-kind"
        label="Drop-off type"
        value={dropoffKind}
        onChange={setDropoffKind}
        options={LOCATION_KINDS}
      />
      <DatePicker
        id="transfer-date"
        label="Pickup date"
        value={travelDate}
        minDate={dateFromIso(earliest.date)}
        onChange={(next) => {
          setScheduleTouched(true);
          setTravelDate(next);
        }}
      />
      <label className="field">
        <span className="field-label">Pickup time</span>
        <input
          className="field-input"
          type="time"
          value={pickupTime}
          min={timeLimited ? earliest.time : undefined}
          onChange={(event) => {
            setScheduleTouched(true);
            setPickupTime(event.target.value);
          }}
        />
      </label>
      <div className="cab-action-row">
        <label className="field">
          <span className="field-label">Passengers</span>
          <input
            className="field-input"
            type="number"
            min={1}
            max={8}
            value={passengers}
            onChange={(event) =>
              setPassengers(Math.min(8, Math.max(1, Number(event.target.value) || 1)))
            }
          />
        </label>
        {submit}
      </div>
      {allowed ? null : (
        <p className="field-error cab-lead-note">
          {CAB_LEAD_MESSAGE} Earliest pickup: {formatEarliestPickup(earliest)}.
        </p>
      )}
    </div>
  );
}
