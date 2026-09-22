"use client";

import { useEffect, useState } from "react";
import DatePicker, { addDays, today } from "@/components/ui/DatePicker";
import RoomGuestPicker from "@/components/ui/RoomGuestPicker";
import { isBeforeDay, startOfDay } from "@/lib/dateUtils";
import { buildHotelSearchQuery } from "@/lib/searchQuery";

export default function HotelSearchForm({ onSearchChange, initialValues }) {
  const [city, setCity] = useState(() => initialValues?.destination || "London");
  const [checkIn, setCheckIn] = useState(
    () => initialValues?.checkInDate || today(),
  );
  const [checkOut, setCheckOut] = useState(
    () => initialValues?.checkOutDate || addDays(today(), 1),
  );
  const [occupancy, setOccupancy] = useState(
    () => initialValues?.occupancy || { guests: 2, rooms: 1 },
  );

  useEffect(() => {
    onSearchChange?.(
      buildHotelSearchQuery({
        destination: city,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        guests: occupancy.guests,
        rooms: occupancy.rooms,
      }),
    );
  }, [city, checkIn, checkOut, occupancy, onSearchChange]);

  function handleCheckInChange(next) {
    const clamped = isBeforeDay(next, today()) ? today() : startOfDay(next);
    setCheckIn(clamped);
    setCheckOut(addDays(clamped, 1));
  }

  function handleCheckOutChange(next) {
    const minCheckout = addDays(checkIn, 1);
    if (isBeforeDay(next, minCheckout)) {
      setCheckOut(minCheckout);
      return;
    }
    setCheckOut(startOfDay(next));
  }

  return (
    <div className="search-form-grid hotel-form-grid">
      <div className="search-field">
        <label className="field-label" htmlFor="hotel-city">
          Destination
        </label>
        <input
          id="hotel-city"
          className="field-input"
          type="text"
          value={city}
          placeholder="London"
          onChange={(event) => setCity(event.target.value)}
        />
      </div>

      <DatePicker
        id="hotel-checkin"
        label="Check-in"
        value={checkIn}
        minDate={today()}
        onChange={handleCheckInChange}
      />

      <DatePicker
        id="hotel-checkout"
        label="Check-out"
        value={checkOut}
        minDate={addDays(checkIn, 1)}
        onChange={handleCheckOutChange}
      />

      <RoomGuestPicker value={occupancy} onChange={setOccupancy} />
    </div>
  );
}
