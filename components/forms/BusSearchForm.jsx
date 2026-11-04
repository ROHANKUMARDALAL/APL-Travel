"use client";

import { useCallback, useEffect, useState } from "react";
import DatePicker, { today } from "@/components/ui/DatePicker";
import LocationSuggest from "@/components/ui/LocationSuggest";
import { isBeforeDay, startOfDay } from "@/lib/dateUtils";
import { buildBusSearchQuery } from "@/lib/searchQuery";
import { searchBusCities } from "@/lib/api/search";

function readyCity(value) {
  return String(value || "").trim().length >= 2;
}

export default function BusSearchForm({ onSearchChange, initialValues, searching = false, showErrors = false }) {
  const [fromCity, setFromCity] = useState(() => initialValues?.from || "");
  const [toCity, setToCity] = useState(() => initialValues?.to || "");
  const [fromId, setFromId] = useState(() => initialValues?.fromId || "");
  const [toId, setToId] = useState(() => initialValues?.toId || "");
  const [travelDate, setTravelDate] = useState(() => {
    const next = initialValues?.travelDate;
    return next && !isBeforeDay(next, today()) ? next : today();
  });
  const loadCities = useCallback((query) => searchBusCities(query), []);
  const loadPopular = useCallback(() => searchBusCities(""), []);

  const fromError = readyCity(fromCity) ? "" : "Choose a departure city";
  const toError = readyCity(toCity) ? "" : "Choose a destination city";
  const sameError = readyCity(fromCity) && readyCity(toCity) && fromCity.trim().toLowerCase() === toCity.trim().toLowerCase()
    ? "Choose two different cities"
    : "";
  const dateError = !travelDate || isBeforeDay(travelDate, today()) ? "Choose today or a later date" : "";
  const error = fromError || toError || sameError || dateError;

  useEffect(() => {
    onSearchChange?.({
      ...buildBusSearchQuery({ from: fromCity, to: toCity, travelDate }),
      fromId,
      toId,
      error,
    });
  }, [fromCity, toCity, fromId, toId, travelDate, error, onSearchChange]);

  function handleDateChange(next) {
    if (!next || isBeforeDay(next, today())) return;
    setTravelDate(startOfDay(next));
  }

  function swapCities() {
    if (fromError || toError || sameError) return;
    setFromCity(toCity);
    setToCity(fromCity);
    setFromId(toId);
    setToId(fromId);
  }

  return (
    <div className="search-form-grid bus-form-grid">
      <div className="city-swap-group">
        <div>
          <LocationSuggest
            id="bus-from"
            label="From"
            value={fromCity}
            placeholder="Departure city"
            minQuery={1}
            fetchOptions={loadCities}
            loadPopular={loadPopular}
            emptyHint="No cities found"
            onTextChange={(text) => { setFromCity(text); setFromId(""); }}
            onSelect={(option) => { setFromCity(option.title); setFromId(option.id || ""); }}
          />
          {showErrors && fromError ? <p className="field-error">{fromError}</p> : null}
        </div>
        <button type="button" className="city-swap-btn" aria-label="Swap cities" onClick={swapCities} disabled={Boolean(fromError || toError || sameError)}>
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
            <path d="M7 7h11l-2.5-2.5M17 17H6l2.5 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div>
          <LocationSuggest
            id="bus-to"
            label="To"
            value={toCity}
            placeholder="Destination city"
            minQuery={1}
            fetchOptions={loadCities}
            loadPopular={loadPopular}
            emptyHint="No cities found"
            onTextChange={(text) => { setToCity(text); setToId(""); }}
            onSelect={(option) => { setToCity(option.title); setToId(option.id || ""); }}
          />
          {showErrors && (toError || sameError) ? <p className="field-error">{toError || sameError}</p> : null}
        </div>
      </div>
      <div>
        <DatePicker id="bus-date" label="Travel date" value={travelDate} minDate={today()} onChange={handleDateChange} />
        {showErrors && dateError ? <p className="field-error">{dateError}</p> : null}
      </div>
      <button type="submit" className="home-search-btn bus-inline-search" disabled={searching} aria-busy={searching}>
        {searching ? <span className="home-search-spinner" aria-hidden="true" /> : (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
            <path d="M16 16.5 20 20.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        )}
        {searching ? "Searching…" : "Search Buses"}
      </button>
    </div>
  );
}
