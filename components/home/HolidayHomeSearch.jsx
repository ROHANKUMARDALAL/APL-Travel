"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import IsoDateField, { dateToIso } from "@/components/ui/IsoDateField";
import { today } from "@/lib/dateUtils";
import { apiGet } from "@/lib/api/client";

const RECENT_KEY = "apl-holiday-recent";
const ORIGINS = [
  ["Delhi", "India"],
  ["Mumbai", "India"],
  ["Bengaluru", "India"],
  ["Hyderabad", "India"],
  ["Chennai", "India"],
  ["Kolkata", "India"],
  ["Ahmedabad", "India"],
  ["Pune", "India"],
  ["Jaipur", "India"],
  ["Goa", "India"],
  ["Dubai", "United Arab Emirates"],
  ["Singapore", "Singapore"],
  ["London", "United Kingdom"],
  ["Bangkok", "Thailand"],
];

function readRecent() {
  if (typeof window === "undefined") return [];
  try {
    const rows = JSON.parse(window.localStorage.getItem(RECENT_KEY) || "[]");
    return Array.isArray(rows) ? rows.slice(0, 4) : [];
  } catch {
    return [];
  }
}

function remember(search) {
  const rows = readRecent().filter((row) => row.destination !== search.destination || row.departure !== search.departure);
  window.localStorage.setItem(RECENT_KEY, JSON.stringify([search, ...rows].slice(0, 4)));
}

function placeLabel(city, country) {
  return country ? `${city}, ${country}` : city;
}

export default function HolidayHomeSearch({ initial = {}, variant = "home" }) {
  const router = useRouter();
  const [from, setFrom] = useState(initial.from || "");
  const [destination, setDestination] = useState(initial.destination || "");
  const [departure, setDeparture] = useState(initial.departure || "");
  const [adults, setAdults] = useState(Number(initial.adults) || 2);
  const [children, setChildren] = useState(Number(initial.children) || 0);
  const [rooms, setRooms] = useState(Number(initial.rooms) || 1);
  const [childAges, setChildAges] = useState(initial.childAges || "");
  const [travelType, setTravelType] = useState(initial.travelType || "");
  const [minPrice, setMinPrice] = useState(initial.minPrice || "");
  const [maxPrice, setMaxPrice] = useState(initial.maxPrice || "");
  const [minDays, setMinDays] = useState(initial.minDays || "");
  const [maxDays, setMaxDays] = useState(initial.maxDays || "");
  const [guestsOpen, setGuestsOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [error, setError] = useState("");
  const [recent, setRecent] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [destinationOpen, setDestinationOpen] = useState(false);
  const [matches, setMatches] = useState([]);
  const [matchState, setMatchState] = useState("idle");
  const [activeIndex, setActiveIndex] = useState(-1);
  const destinationRef = useRef(null);
  const searchSeq = useRef(0);

  useEffect(() => {
    setRecent(readRecent());
  }, []);

  useEffect(() => {
    let ignore = false;
    apiGet("/holidays/destinations")
      .then((data) => {
        if (!ignore) setSuggestions(data.destinations || []);
      })
      .catch(() => {
        if (!ignore) setSuggestions([]);
      });
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    const query = destination.trim();
    if (!destinationOpen || query.length < 3) {
      searchSeq.current += 1;
      setMatches([]);
      setMatchState(query.length < 3 ? "short" : "idle");
      setActiveIndex(-1);
      return undefined;
    }
    const seq = searchSeq.current + 1;
    searchSeq.current = seq;
    setMatchState("loading");
    const timer = window.setTimeout(() => {
      apiGet(`/holidays/destinations?q=${encodeURIComponent(query)}`)
        .then((data) => {
          if (seq !== searchSeq.current) return;
          setMatches(data.destinations || []);
          setMatchState("ready");
          setActiveIndex(-1);
        })
        .catch(() => {
          if (seq !== searchSeq.current) return;
          setMatches([]);
          setMatchState("error");
        });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [destination, destinationOpen]);

  useEffect(() => {
    function onPointerDown(event) {
      if (!destinationRef.current?.contains(event.target)) setDestinationOpen(false);
    }
    function onKeyDown(event) {
      if (event.key === "Escape") setDestinationOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const originMatches = from.trim().length < 1
    ? []
    : ORIGINS.filter(([city, country]) => placeLabel(city, country).toLowerCase().includes(from.trim().toLowerCase())).slice(0, 6);

  function chooseDestination(item) {
    setDestination(item.name);
    setDestinationOpen(false);
    setActiveIndex(-1);
  }

  function onDestinationKeyDown(event) {
    if (!destinationOpen && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      setDestinationOpen(true);
      return;
    }
    if (!destinationOpen || !matches.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % matches.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? matches.length - 1 : index - 1));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      chooseDestination(matches[activeIndex]);
    }
  }

  function ages() {
    return childAges.split(",").map((age) => age.trim()).filter(Boolean);
  }

  function search(event) {
    event.preventDefault();
    if (!destination.trim()) {
      setError("Choose a destination.");
      return;
    }
    if (adults < 1) {
      setError("At least one adult is required.");
      return;
    }
    if (rooms > adults) {
      setError("Rooms cannot exceed the number of adults.");
      return;
    }
    if (children > 0 && ages().length !== children) {
      setError("Enter an age for each child.");
      return;
    }
    if (ages().some((age) => Number(age) < 0 || Number(age) > 17 || Number.isNaN(Number(age)))) {
      setError("Child ages must be between 0 and 17.");
      return;
    }
    const params = new URLSearchParams();
    if (from.trim()) params.set("from", from.trim());
    params.set("destination", destination.split(",")[0].trim());
    params.set("destinationLabel", destination.trim());
    if (departure) params.set("departure", departure);
    params.set("adults", String(adults));
    params.set("children", String(children));
    params.set("rooms", String(rooms));
    if (childAges.trim()) params.set("childAges", childAges.trim());
    if (travelType) params.set("travelType", travelType);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (minDays) params.set("minDays", minDays);
    if (maxDays) params.set("maxDays", maxDays);
    const saved = {
      from: from.trim(),
      destination: destination.trim(),
      departure,
      adults,
      children,
      rooms,
      travelType,
    };
    remember(saved);
    setRecent(readRecent());
    setError("");
    router.push(`/holidays?${params.toString()}`);
  }

  function applyRecent(row) {
    setFrom(row.from || "");
    setDestination(row.destination || "");
    setDeparture(row.departure || "");
    setAdults(row.adults || 2);
    setChildren(row.children || 0);
    setRooms(row.rooms || 1);
    setTravelType(row.travelType || "");
  }

  function step(setter, value, min, max) {
    setter(Math.min(max, Math.max(min, value)));
  }

  const guestLabel = `${adults} adult${adults === 1 ? "" : "s"} · ${children} child${children === 1 ? "" : "ren"} · ${rooms} room${rooms === 1 ? "" : "s"}`;

  return (
    <form className={`holiday-search ${variant === "results" ? "is-results" : ""}`} onSubmit={search}>
      <div className="holiday-search-grid">
        <label className="holiday-field">
          <span>From city</span>
          <input value={from} placeholder="Delhi, India" autoComplete="off" onChange={(event) => setFrom(event.target.value)} />
          {originMatches.length ? (
            <ul className="holiday-suggest">
              {originMatches.map(([city, country]) => (
                <li key={city}>
                  <button type="button" onClick={() => setFrom(placeLabel(city, country))}>{placeLabel(city, country)}</button>
                </li>
              ))}
            </ul>
          ) : null}
          {from ? <button type="button" className="holiday-clear" onClick={() => setFrom("")}>Clear</button> : null}
        </label>
        <div className="holiday-field" ref={destinationRef}>
          <label htmlFor="holiday-destination">To city, state or country</label>
          <input
            id="holiday-destination"
            role="combobox"
            aria-expanded={destinationOpen}
            aria-controls="holiday-destination-list"
            aria-autocomplete="list"
            value={destination}
            placeholder="Goa, Kerala, Singapore"
            autoComplete="off"
            onFocus={() => setDestinationOpen(true)}
            onClick={() => setDestinationOpen(true)}
            onKeyDown={onDestinationKeyDown}
            onChange={(event) => {
              setDestination(event.target.value);
              setDestinationOpen(true);
            }}
          />
          {destinationOpen ? (
            <ul className="holiday-suggest" id="holiday-destination-list" role="listbox">
              {destination.trim().length < 3 ? (
                <li className="holiday-suggest-status">Type at least 3 characters to search</li>
              ) : null}
              {destination.trim().length >= 3 && matchState === "loading" ? (
                <li className="holiday-suggest-status">Searching destinations…</li>
              ) : null}
              {destination.trim().length >= 3 && matchState === "error" ? (
                <li className="holiday-suggest-status">Destinations could not be loaded. Try again.</li>
              ) : null}
              {destination.trim().length >= 3 && matchState === "ready" && !matches.length ? (
                <li className="holiday-suggest-status">No matching destinations</li>
              ) : null}
              {matches.map((item, index) => (
                <li key={item.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={index === activeIndex}
                    className={index === activeIndex ? "is-active" : ""}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => chooseDestination(item)}
                  >
                    <span className="holiday-option">
                      {item.name}
                      <small>{item.type}{item.hierarchy ? ` · ${item.hierarchy}` : ""}</small>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {destination ? (
            <button type="button" className="holiday-clear" onClick={() => { setDestination(""); setDestinationOpen(false); }}>
              Clear
            </button>
          ) : null}
        </div>
        <div className="holiday-field">
          <IsoDateField
            id="holiday-departure"
            label="Departure date"
            value={departure}
            min={dateToIso(today())}
            placeholder="Select departure"
            clearable
            onChange={setDeparture}
          />
        </div>
        <div className="holiday-field holiday-guests">
          <span>Rooms and guests</span>
          <button type="button" className="holiday-guest-trigger" aria-expanded={guestsOpen} onClick={() => setGuestsOpen((open) => !open)}>
            {guestLabel}
          </button>
          {guestsOpen ? (
            <div className="holiday-guest-panel">
              <Counter label="Adults" hint="Age 18+" value={adults} min={1} max={9} onChange={(value) => step(setAdults, value, 1, 9)} />
              <Counter label="Children" hint="Age 0–17" value={children} min={0} max={6} onChange={(value) => step(setChildren, value, 0, 6)} />
              <Counter label="Rooms" hint="One adult per room" value={rooms} min={1} max={4} onChange={(value) => step(setRooms, value, 1, 4)} />
              {children > 0 ? (
                <label className="holiday-ages">
                  Child ages
                  <input value={childAges} placeholder="8, 5" onChange={(event) => setChildAges(event.target.value)} />
                </label>
              ) : null}
              <button type="button" className="holiday-done" onClick={() => setGuestsOpen(false)}>Done</button>
            </div>
          ) : null}
        </div>
      </div>
      <div className="holiday-search-actions">
        <button type="button" className="holiday-filter-toggle" aria-expanded={filtersOpen} onClick={() => setFiltersOpen((open) => !open)}>
          {filtersOpen ? "Hide filters" : "Budget, duration and type"}
        </button>
        <button className="holiday-search-btn" type="submit">Search Holidays</button>
      </div>
      {filtersOpen ? (
        <div className="holiday-filters">
          <label>Min budget<input type="number" min="0" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} /></label>
          <label>Max budget<input type="number" min="0" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} /></label>
          <label>Min days<input type="number" min="1" value={minDays} onChange={(event) => setMinDays(event.target.value)} /></label>
          <label>Max days<input type="number" min="1" value={maxDays} onChange={(event) => setMaxDays(event.target.value)} /></label>
          <label>
            Holiday type
            <select value={travelType} onChange={(event) => setTravelType(event.target.value)}>
              <option value="">Domestic and international</option>
              <option value="domestic">Domestic</option>
              <option value="international">International</option>
            </select>
          </label>
        </div>
      ) : null}
      {suggestions.length ? (
        <div className="holiday-popular">
          <p>Suggested destinations</p>
          <div>
            {suggestions.map((item) => (
              <button key={item.id} type="button" onClick={() => chooseDestination(item)}>
                {item.name} · {item.type}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {error ? <p className="holiday-error">{error}</p> : null}
      {recent.length ? (
        <div className="holiday-recent">
          <p>Recent searches</p>
          <div>
            {recent.map((row) => (
              <button key={`${row.destination}-${row.departure}`} type="button" onClick={() => applyRecent(row)}>
                {row.from ? `${row.from} → ` : ""}{row.destination}{row.departure ? ` · ${row.departure}` : ""}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </form>
  );
}

function Counter({ label, hint, value, min, max, onChange }) {
  return (
    <div className="counter-row">
      <div>
        <p className="counter-label">{label}</p>
        <p className="counter-hint">{hint}</p>
      </div>
      <div className="counter-controls">
        <button type="button" className="counter-btn" aria-label={`Decrease ${label}`} disabled={value <= min} onClick={() => onChange(value - 1)}>−</button>
        <span>{value}</span>
        <button type="button" className="counter-btn" aria-label={`Increase ${label}`} disabled={value >= max} onClick={() => onChange(value + 1)}>+</button>
      </div>
    </div>
  );
}
