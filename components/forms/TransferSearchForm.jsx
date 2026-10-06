"use client";

import { useEffect, useState } from "react";
import DatePicker, { today } from "@/components/ui/DatePicker";
import { isBeforeDay, startOfDay } from "@/lib/dateUtils";
import { buildTransferSearchQuery } from "@/lib/searchQuery";

export default function TransferSearchForm({ onSearchChange, initialValues }) {
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
    () => initialValues?.travelDate || today(),
  );
  const [pickupTime, setPickupTime] = useState(
    () => initialValues?.pickupTime || "10:00",
  );
  const [passengers, setPassengers] = useState(
    () => Number(initialValues?.passengers || 1),
  );

  useEffect(() => {
    onSearchChange?.(
      buildTransferSearchQuery({
        pickup,
        dropoff,
        pickupKind,
        dropoffKind,
        travelDate,
        pickupTime,
        passengers,
      }),
    );
  }, [
    pickup,
    dropoff,
    pickupKind,
    dropoffKind,
    travelDate,
    pickupTime,
    passengers,
    onSearchChange,
  ]);

  function handleDateChange(next) {
    const clamped = isBeforeDay(next, today()) ? today() : startOfDay(next);
    setTravelDate(clamped);
  }

  return (
    <div className="search-form-grid bus-form-grid">
      <label className="field">
        <span className="field-label">Pickup</span>
        <input
          className="field-input"
          value={pickup}
          onChange={(e) => setPickup(e.target.value)}
          placeholder="Airport / hotel / address"
        />
      </label>
      <label className="field">
        <span className="field-label">Drop-off</span>
        <input
          className="field-input"
          value={dropoff}
          onChange={(e) => setDropoff(e.target.value)}
          placeholder="Hotel / city / address"
        />
      </label>
      <label className="field">
        <span className="field-label">Pickup type</span>
        <select
          className="field-input"
          value={pickupKind}
          onChange={(e) => setPickupKind(e.target.value)}
        >
          <option value="AIRPORT">Airport</option>
          <option value="HOTEL">Hotel</option>
          <option value="CITY">City</option>
          <option value="ADDRESS">Address</option>
        </select>
      </label>
      <label className="field">
        <span className="field-label">Drop-off type</span>
        <select
          className="field-input"
          value={dropoffKind}
          onChange={(e) => setDropoffKind(e.target.value)}
        >
          <option value="HOTEL">Hotel</option>
          <option value="AIRPORT">Airport</option>
          <option value="CITY">City</option>
          <option value="ADDRESS">Address</option>
        </select>
      </label>
      <DatePicker
        id="transfer-date"
        label="Pickup date"
        value={travelDate}
        minDate={today()}
        onChange={handleDateChange}
      />
      <label className="field">
        <span className="field-label">Pickup time</span>
        <input
          className="field-input"
          type="time"
          value={pickupTime}
          onChange={(e) => setPickupTime(e.target.value || "10:00")}
        />
      </label>
      <label className="field">
        <span className="field-label">Passengers</span>
        <input
          className="field-input"
          type="number"
          min={1}
          max={8}
          value={passengers}
          onChange={(e) =>
            setPassengers(Math.min(8, Math.max(1, Number(e.target.value) || 1)))
          }
        />
      </label>
    </div>
  );
}
