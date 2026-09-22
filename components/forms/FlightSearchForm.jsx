"use client";

import { useEffect, useState } from "react";
import DatePicker, { addDays, today } from "@/components/ui/DatePicker";
import CitySwapFields from "@/components/ui/CitySwapFields";
import TravellerPicker from "@/components/ui/TravellerPicker";
import FareTypeSelect from "@/components/ui/FareTypeSelect";
import { isBeforeDay, startOfDay } from "@/lib/dateUtils";
import { buildFlightSearchQuery } from "@/lib/searchQuery";

export default function FlightSearchForm({ onSearchChange, initialValues }) {
  const [fromCity, setFromCity] = useState(
    () => initialValues?.from || "New York (JFK)",
  );
  const [toCity, setToCity] = useState(() => initialValues?.to || "London (LHR)");
  const [departDate, setDepartDate] = useState(
    () => initialValues?.departDate || today(),
  );
  const [returnDate, setReturnDate] = useState(
    () => initialValues?.returnDate || addDays(today(), 2),
  );
  const [travellers, setTravellers] = useState(
    () =>
      initialValues?.travellers || {
        adults: 1,
        children: 0,
        infants: 0,
      },
  );
  const [fareType, setFareType] = useState(
    () => initialValues?.fareType || "normal",
  );

  useEffect(() => {
    onSearchChange?.(
      buildFlightSearchQuery({
        from: fromCity,
        to: toCity,
        departDate,
        returnDate,
        adults: travellers.adults,
        children: travellers.children,
        infants: travellers.infants,
        fareType,
      }),
    );
  }, [fromCity, toCity, departDate, returnDate, travellers, fareType, onSearchChange]);

  function handleDepartChange(next) {
    const clamped = isBeforeDay(next, today()) ? today() : startOfDay(next);
    setDepartDate(clamped);
    setReturnDate((prev) => {
      if (prev && isBeforeDay(prev, clamped)) return clamped;
      return prev;
    });
  }

  function handleReturnChange(next) {
    if (isBeforeDay(next, departDate)) {
      setReturnDate(startOfDay(departDate));
      return;
    }
    setReturnDate(startOfDay(next));
  }

  function swapCities() {
    setFromCity(toCity);
    setToCity(fromCity);
  }

  return (
    <div className="search-form-grid flight-form-grid">
      <CitySwapFields
        fromId="flight-from"
        toId="flight-to"
        fromValue={fromCity}
        toValue={toCity}
        onFromChange={setFromCity}
        onToChange={setToCity}
        onSwap={swapCities}
        fromPlaceholder="New York (JFK)"
        toPlaceholder="London (LHR)"
      />

      <DatePicker
        id="flight-depart"
        label="Depart"
        value={departDate}
        minDate={today()}
        onChange={handleDepartChange}
      />

      <DatePicker
        id="flight-return"
        label="Return"
        value={returnDate}
        minDate={departDate}
        onChange={handleReturnChange}
      />

      <TravellerPicker value={travellers} onChange={setTravellers} />
      <FareTypeSelect value={fareType} onChange={setFareType} />
    </div>
  );
}
