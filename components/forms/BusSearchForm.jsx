"use client";

import { useEffect, useState } from "react";
import DatePicker, { today } from "@/components/ui/DatePicker";
import CitySwapFields from "@/components/ui/CitySwapFields";
import { isBeforeDay, startOfDay } from "@/lib/dateUtils";
import { buildBusSearchQuery } from "@/lib/searchQuery";

export default function BusSearchForm({ onSearchChange, initialValues }) {
  const [fromCity, setFromCity] = useState(
    () => initialValues?.from || "New York",
  );
  const [toCity, setToCity] = useState(() => initialValues?.to || "Boston");
  const [travelDate, setTravelDate] = useState(
    () => initialValues?.travelDate || today(),
  );

  useEffect(() => {
    onSearchChange?.(
      buildBusSearchQuery({
        from: fromCity,
        to: toCity,
        travelDate,
      }),
    );
  }, [fromCity, toCity, travelDate, onSearchChange]);

  function handleDateChange(next) {
    const clamped = isBeforeDay(next, today()) ? today() : startOfDay(next);
    setTravelDate(clamped);
  }

  function swapCities() {
    setFromCity(toCity);
    setToCity(fromCity);
  }

  return (
    <div className="search-form-grid bus-form-grid">
      <CitySwapFields
        fromId="bus-from"
        toId="bus-to"
        fromValue={fromCity}
        toValue={toCity}
        onFromChange={setFromCity}
        onToChange={setToCity}
        onSwap={swapCities}
        fromPlaceholder="New York"
        toPlaceholder="Boston"
      />

      <DatePicker
        id="bus-date"
        label="Travel date"
        value={travelDate}
        minDate={today()}
        onChange={handleDateChange}
      />
    </div>
  );
}
