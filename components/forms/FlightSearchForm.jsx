"use client";

import { useCallback, useEffect, useState } from "react";
import DatePicker, { addDays, today } from "@/components/ui/DatePicker";
import LocationSuggest from "@/components/ui/LocationSuggest";
import TravellerPicker from "@/components/ui/TravellerPicker";
import FareTypeSelect from "@/components/ui/FareTypeSelect";
import TripTypeToggle from "@/components/forms/TripTypeToggle";
import { isBeforeDay, startOfDay } from "@/lib/dateUtils";
import { buildFlightSearchQuery, fromDateParam } from "@/lib/searchQuery";
import { searchAirports } from "@/lib/api/search";

function cityLabel(city) {
  return `${city.cityName} (${city.cityCode})`;
}

function blankLeg(departDate) {
  return {
    fromText: "",
    toText: "",
    originCityCode: "",
    destinationCityCode: "",
    departDate: departDate || today(),
  };
}

function legFromInitial(leg) {
  const depart =
    leg?.depart instanceof Date
      ? leg.depart
      : fromDateParam(leg?.depart) || today();
  return {
    fromText: leg?.from || "",
    toText: leg?.to || "",
    originCityCode: leg?.originCityCode || "",
    destinationCityCode: leg?.destinationCityCode || "",
    departDate: depart,
  };
}

export default function FlightSearchForm({
  onSearchChange,
  initialValues,
  heading = "",
}) {
  const initialTrip = initialValues?.tripType || "oneway";
  const [tripType, setTripType] = useState(initialTrip);
  const [fromText, setFromText] = useState(
    () => initialValues?.from || "Delhi (DEL)",
  );
  const [toText, setToText] = useState(() => initialValues?.to || "Mumbai (BOM)");
  const [originCityCode, setOriginCityCode] = useState(
    () => initialValues?.originCityCode || "DEL",
  );
  const [destinationCityCode, setDestinationCityCode] = useState(
    () => initialValues?.destinationCityCode || "BOM",
  );
  const [departDate, setDepartDate] = useState(
    () => initialValues?.departDate || today(),
  );
  const [returnDate, setReturnDate] = useState(() => {
    if (initialTrip !== "return") return null;
    return initialValues?.returnDate || addDays(initialValues?.departDate || today(), 2);
  });
  const [legs, setLegs] = useState(() => {
    if (initialTrip === "multi" && initialValues?.legs?.length >= 2) {
      return initialValues.legs.map(legFromInitial);
    }
    const depart = initialValues?.departDate || today();
    return [
      {
        fromText: initialValues?.from || "Delhi (DEL)",
        toText: initialValues?.to || "Mumbai (BOM)",
        originCityCode: initialValues?.originCityCode || "DEL",
        destinationCityCode: initialValues?.destinationCityCode || "BOM",
        departDate: depart,
      },
      {
        fromText: initialValues?.to || "Mumbai (BOM)",
        toText: "",
        originCityCode: initialValues?.destinationCityCode || "BOM",
        destinationCityCode: "",
        departDate: addDays(depart, 2),
      },
    ];
  });
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

  const loadCities = useCallback(async (query) => {
    const cities = await searchAirports(query);
    return cities.map((city) => ({
      id: city.cityCode,
      code: city.cityCode,
      title: city.cityName,
      subtitle: `${city.country} · ${city.airportCount} airport${city.airportCount === 1 ? "" : "s"}`,
      city,
    }));
  }, []);

  const searchError = (() => {
    if (tripType === "multi") {
      for (let index = 0; index < legs.length; index += 1) {
        const leg = legs[index];
        const label = `flight ${index + 1}`;
        if (!leg.originCityCode || !leg.destinationCityCode) {
          return `Choose both cities for ${label} from the suggestions.`;
        }
        if (leg.originCityCode === leg.destinationCityCode) {
          return `Departure and arrival must differ for ${label}.`;
        }
        if (index > 0 && isBeforeDay(leg.departDate, legs[index - 1].departDate)) {
          return `Flight ${index + 1} must depart on or after flight ${index}.`;
        }
      }
      return "";
    }
    if (!originCityCode || !destinationCityCode) {
      return "Choose departure and arrival cities from the suggestions.";
    }
    if (originCityCode === destinationCityCode) {
      return "Departure and arrival cities must be different.";
    }
    if (tripType === "return" && !returnDate) {
      return "Choose a return date.";
    }
    return "";
  })();

  useEffect(() => {
    onSearchChange?.(
      buildFlightSearchQuery({
        tripType,
        from: fromText,
        to: toText,
        originCityCode,
        destinationCityCode,
        departDate,
        returnDate: tripType === "return" ? returnDate : null,
        legs:
          tripType === "multi"
            ? legs.map((leg) => ({
                from: leg.fromText,
                to: leg.toText,
                originCityCode: leg.originCityCode,
                destinationCityCode: leg.destinationCityCode,
                depart: leg.departDate,
              }))
            : [],
        adults: travellers.adults,
        children: travellers.children,
        infants: travellers.infants,
        fareType,
        error: searchError,
      }),
    );
  }, [
    tripType,
    fromText,
    toText,
    originCityCode,
    destinationCityCode,
    departDate,
    returnDate,
    legs,
    travellers,
    fareType,
    searchError,
    onSearchChange,
  ]);

  function selectTrip(next) {
    setTripType(next);
    if (next === "return" && !returnDate) {
      setReturnDate(addDays(departDate, 2));
    }
    if (next === "oneway") setReturnDate(null);
    if (next === "multi") {
      setLegs((current) => {
        const nextLegs = current.length >= 2 ? [...current] : [blankLeg(departDate), blankLeg(addDays(departDate, 2))];
        nextLegs[0] = {
          ...nextLegs[0],
          fromText,
          toText,
          originCityCode,
          destinationCityCode,
          departDate,
        };
        if (!nextLegs[1].fromText) {
          nextLegs[1] = {
            ...nextLegs[1],
            fromText: toText,
            originCityCode: destinationCityCode,
            departDate: nextLegs[1].departDate || addDays(departDate, 2),
          };
        }
        return nextLegs;
      });
    }
  }

  function handleDepartChange(next) {
    const clamped = isBeforeDay(next, today()) ? today() : startOfDay(next);
    setDepartDate(clamped);
    setReturnDate((prev) => {
      if (prev && isBeforeDay(prev, clamped)) return clamped;
      return prev;
    });
  }

  function handleReturnChange(next) {
    const chosen = isBeforeDay(next, departDate) ? startOfDay(departDate) : startOfDay(next);
    setReturnDate(chosen);
    setTripType("return");
  }

  function swapCities() {
    setFromText(toText);
    setToText(fromText);
    setOriginCityCode(destinationCityCode);
    setDestinationCityCode(originCityCode);
  }

  function updateLeg(index, patch) {
    setLegs((current) => current.map((leg, legIndex) => (legIndex === index ? { ...leg, ...patch } : leg)));
  }

  function updateLegDate(index, next) {
    setLegs((current) => {
      const floor = index === 0 ? today() : current[index - 1]?.departDate || today();
      const chosen = isBeforeDay(next, floor) ? startOfDay(floor) : startOfDay(next);
      const nextLegs = current.map((leg) => ({ ...leg }));
      nextLegs[index] = { ...nextLegs[index], departDate: chosen };
      for (let later = index + 1; later < nextLegs.length; later += 1) {
        const previousDate = nextLegs[later - 1].departDate;
        if (isBeforeDay(nextLegs[later].departDate, previousDate)) {
          nextLegs[later] = { ...nextLegs[later], departDate: startOfDay(previousDate) };
        }
      }
      return nextLegs;
    });
  }

  function swapLeg(index) {
    setLegs((current) =>
      current.map((leg, legIndex) => {
        if (legIndex !== index) return leg;
        return {
          ...leg,
          fromText: leg.toText,
          toText: leg.fromText,
          originCityCode: leg.destinationCityCode,
          destinationCityCode: leg.originCityCode,
        };
      }),
    );
  }

  return (
    <>
      <div className="search-heading-row">
        {heading ? (
          <h2 className="search-service-title">
            {heading} <span>· flight</span>
          </h2>
        ) : null}
        <TripTypeToggle value={tripType} onChange={selectTrip} />
      </div>

      {tripType === "multi" ? (
        <div className="multi-city-list">
          {legs.map((leg, index) => (
            <div className="multi-city-leg" key={`leg-${index}`}>
              <div className="multi-city-leg-head">
                <p>Flight {index + 1}</p>
                {legs.length > 2 ? (
                  <button
                    type="button"
                    className="multi-city-remove"
                    onClick={() => setLegs((current) => current.filter((_, legIndex) => legIndex !== index))}
                  >
                    Remove
                  </button>
                ) : null}
              </div>
              <div className="search-form-grid flight-form-grid flight-form-grid-multi">
                <div className="city-swap-group">
                  <LocationSuggest
                    id={`flight-from-${index}`}
                    label="From"
                    value={leg.fromText}
                    placeholder="Delhi"
                    fetchOptions={loadCities}
                    onTextChange={(text) => updateLeg(index, { fromText: text, originCityCode: "" })}
                    onSelect={(option) =>
                      updateLeg(index, {
                        fromText: cityLabel(option.city),
                        originCityCode: option.city.cityCode,
                      })
                    }
                  />
                  <button
                    type="button"
                    className="city-swap-btn"
                    aria-label={`Swap cities for flight ${index + 1}`}
                    onClick={() => swapLeg(index)}
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                      <path
                        d="M7 7h11l-2.5-2.5M17 17H6l2.5 2.5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <LocationSuggest
                    id={`flight-to-${index}`}
                    label="To"
                    value={leg.toText}
                    placeholder="Mumbai"
                    fetchOptions={loadCities}
                    onTextChange={(text) => updateLeg(index, { toText: text, destinationCityCode: "" })}
                    onSelect={(option) =>
                      updateLeg(index, {
                        toText: cityLabel(option.city),
                        destinationCityCode: option.city.cityCode,
                      })
                    }
                  />
                </div>
                <DatePicker
                  id={`flight-depart-${index}`}
                  label="Depart"
                  value={leg.departDate}
                  minDate={index === 0 ? today() : legs[index - 1].departDate}
                  onChange={(next) => updateLegDate(index, next)}
                />
              </div>
            </div>
          ))}
          {legs.length < 5 ? (
            <button
              type="button"
              className="multi-city-add"
              onClick={() => {
                const last = legs[legs.length - 1];
                setLegs((current) => [
                  ...current,
                  {
                    fromText: last?.toText || "",
                    toText: "",
                    originCityCode: last?.destinationCityCode || "",
                    destinationCityCode: "",
                    departDate: addDays(last?.departDate || today(), 1),
                  },
                ]);
              }}
            >
              Add another city
            </button>
          ) : null}
          <div className="search-form-grid flight-form-grid flight-form-grid-extras">
            <TravellerPicker value={travellers} onChange={setTravellers} />
            <FareTypeSelect value={fareType} onChange={setFareType} />
          </div>
        </div>
      ) : (
        <div className="search-form-grid flight-form-grid">
          <div className="city-swap-group">
            <LocationSuggest
              id="flight-from"
              label="From"
              value={fromText}
              placeholder="Delhi"
              fetchOptions={loadCities}
              onTextChange={(text) => {
                setFromText(text);
                setOriginCityCode("");
              }}
              onSelect={(option) => {
                setFromText(cityLabel(option.city));
                setOriginCityCode(option.city.cityCode);
              }}
            />
            <button type="button" className="city-swap-btn" aria-label="Swap cities" onClick={swapCities}>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                <path
                  d="M7 7h11l-2.5-2.5M17 17H6l2.5 2.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <LocationSuggest
              id="flight-to"
              label="To"
              value={toText}
              placeholder="Mumbai"
              fetchOptions={loadCities}
              onTextChange={(text) => {
                setToText(text);
                setDestinationCityCode("");
              }}
              onSelect={(option) => {
                setToText(cityLabel(option.city));
                setDestinationCityCode(option.city.cityCode);
              }}
            />
          </div>

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
            placeholder="Add return"
            onChange={handleReturnChange}
          />

          <TravellerPicker value={travellers} onChange={setTravellers} />
          <FareTypeSelect value={fareType} onChange={setFareType} />
        </div>
      )}
    </>
  );
}
