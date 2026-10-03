"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { countryFlagEmoji, filterCountries, findCountryByName } from "@/data/countries";

type CountrySelectProps = {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

export default function CountrySelect({
  id,
  label = "Country",
  value,
  onChange,
  disabled = false,
  placeholder = "Search country",
}: CountrySelectProps) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  const searchId = `${fieldId}-search`;
  const rootRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const options = useMemo(() => filterCountries(query), [query]);
  const selected = useMemo(() => findCountryByName(value), [value]);
  const selectedFlag = selected ? countryFlagEmoji(selected.code) : "🏳️";

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const timer = window.setTimeout(() => searchRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  return (
    <div className="choice-select country-select search-field" ref={rootRef}>
      {label ? (
        <label className="field-label" htmlFor={fieldId}>
          {label}
        </label>
      ) : null}

      <button
        id={fieldId}
        type="button"
        disabled={disabled}
        className={`choice-select-trigger ${open ? "is-open" : ""} ${!value ? "is-placeholder" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          setOpen((prev) => !prev);
          setQuery("");
        }}
      >
        <span className="choice-select-trigger-main">
          <span className="country-flag" aria-hidden="true">
            {value ? selectedFlag : "🌐"}
          </span>
          <span className="choice-select-copy">
            <span className="choice-select-label">{value || placeholder}</span>
            <span className="choice-select-sub">
              {value ? "Passport issue country" : "Type to search all countries"}
            </span>
          </span>
        </span>
        <span className="choice-select-caret" aria-hidden="true">
          ▾
        </span>
      </button>

      {open ? (
        <div className="choice-select-menu country-select-menu" role="listbox" aria-label={label}>
          <div className="country-select-search">
            <label className="visually-hidden" htmlFor={searchId}>
              Search country
            </label>
            <input
              ref={searchRef}
              id={searchId}
              type="search"
              className="country-select-search-input"
              value={query}
              placeholder="Search country (e.g. In, En, Aus)"
              autoComplete="off"
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && options[0]) {
                  event.preventDefault();
                  onChange(options[0].name);
                  setOpen(false);
                  setQuery("");
                }
              }}
            />
          </div>
          <div className="country-select-list">
            {options.length ? (
              options.map((option) => {
                const active = option.name === value;
                return (
                  <button
                    key={option.code}
                    type="button"
                    role="option"
                    aria-selected={active}
                    className={`choice-select-option country-select-option ${active ? "is-selected" : ""}`}
                    onClick={() => {
                      onChange(option.name);
                      setOpen(false);
                      setQuery("");
                    }}
                  >
                    <span className="country-flag" aria-hidden="true">
                      {countryFlagEmoji(option.code)}
                    </span>
                    <span className="choice-select-copy">
                      <span className="choice-select-label">{option.name}</span>
                      <span className="choice-select-sub">{option.code}</span>
                    </span>
                  </button>
                );
              })
            ) : (
              <p className="country-select-empty">No countries match “{query}”.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
