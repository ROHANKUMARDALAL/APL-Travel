"use client";

import { useCallback, useEffect, useState } from "react";
import DatePicker, { addDays, today } from "@/components/ui/DatePicker";
import RoomGuestPicker from "@/components/ui/RoomGuestPicker";
import LocationSuggest from "@/components/ui/LocationSuggest";
import { isBeforeDay, startOfDay } from "@/lib/dateUtils";
import { buildHotelSearchQuery } from "@/lib/searchQuery";
import { searchHotelCities } from "@/lib/api/search";

export default function HotelSearchForm({ onSearchChange, initialValues }) {
  const [city, setCity] = useState(() => initialValues?.destination || "New Delhi");
  const [cityCode, setCityCode] = useState(() => initialValues?.cityCode || "130443");
  const [checkIn, setCheckIn] = useState(
    () => initialValues?.checkInDate || today(),
  );
  const [checkOut, setCheckOut] = useState(
    () => initialValues?.checkOutDate || addDays(today(), 1),
  );
  const [occupancy, setOccupancy] = useState(
    () => initialValues?.occupancy || { guests: 2, rooms: 1 },
  );

  const loadCities = useCallback(async (query) => {
    const cities = await searchHotelCities(query);
    return cities.map((entry) => ({
      id: entry.cityCode,
      code: entry.cityCode,
      title: entry.cityName,
      subtitle: [entry.state, entry.country].filter(Boolean).join(", "),
      city: entry,
    }));
  }, []);

  useEffect(() => {
    onSearchChange?.(
      buildHotelSearchQuery({
        destination: city,
        cityCode,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        guests: occupancy.guests,
        rooms: occupancy.rooms,
      }),
    );
  }, [city, cityCode, checkIn, checkOut, occupancy, onSearchChange]);

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
      <LocationSuggest
        id="hotel-city"
        label="Destination"
        value={city}
        placeholder="New Delhi"
        fetchOptions={loadCities}
        onTextChange={(text) => {
          setCity(text);
          setCityCode("");
        }}
        onSelect={(option) => {
          setCity(option.city.cityName);
          setCityCode(option.city.cityCode);
        }}
      />

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
