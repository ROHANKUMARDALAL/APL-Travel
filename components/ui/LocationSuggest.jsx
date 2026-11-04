"use client";

import { useEffect, useId, useRef, useState } from "react";

function lettersInOrder(value, query) {
  const text = String(value || "").toLowerCase();
  const needle = String(query || "").toLowerCase();
  if (!text || !needle) return false;
  let index = 0;
  for (const char of text) {
    if (char === needle[index]) index += 1;
    if (index === needle.length) return true;
  }
  return false;
}

export default function LocationSuggest({
  id,
  label,
  value,
  placeholder,
  onTextChange,
  onSelect,
  fetchOptions,
  loadPopular,
  minQuery = 3,
  emptyHint = "No matches",
}) {
  const listId = useId();
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [typedQuery, setTypedQuery] = useState("");
  const requestRef = useRef(0);

  useEffect(() => {
    const query = typedQuery.trim();
    if (query.length < minQuery) {
      if (!query && loadPopular) return undefined;
      setOptions([]);
      setOpen(false);
      setLoading(false);
      return undefined;
    }

    const ticket = requestRef.current + 1;
    requestRef.current = ticket;
    const timer = setTimeout(async () => {
      setLoading(true);
      setFailed(false);
      setOpen(true);
      try {
        const next = await fetchOptions(query);
        if (ticket !== requestRef.current) return;
        const filtered = (next || []).filter((option) => {
          const fields = [option.title];
          if (option.code && option.code !== "CITY") fields.push(option.code);
          if (option.subtitle) fields.push(option.subtitle);
          return fields.some((field) => lettersInOrder(field, query));
        });
        setOptions(filtered);
        setActiveIndex(0);
      } catch {
        if (ticket !== requestRef.current) return;
        setOptions([]);
        setFailed(true);
      } finally {
        if (ticket === requestRef.current) setLoading(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [typedQuery, fetchOptions, minQuery, loadPopular]);

  useEffect(() => {
    function onDocClick(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div className="search-field location-suggest" ref={rootRef}>
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className="field-input"
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        onFocus={() => {
          if (typedQuery.trim().length >= minQuery || !loadPopular) return;
          const ticket = requestRef.current + 1;
          requestRef.current = ticket;
          setLoading(true);
          setFailed(false);
          setOpen(true);
          loadPopular()
            .then((next) => {
              if (ticket !== requestRef.current) return;
              setOptions(next || []);
              setActiveIndex(0);
            })
            .catch(() => {
              if (ticket !== requestRef.current) return;
              setOptions([]);
              setFailed(true);
            })
            .finally(() => {
              if (ticket === requestRef.current) setLoading(false);
            });
        }}
        onKeyDown={(event) => {
          if (!open || options.length === 0) {
            if (event.key === "Escape") setOpen(false);
            return;
          }
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((index) => Math.min(options.length - 1, index + 1));
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((index) => Math.max(0, index - 1));
          } else if (event.key === "Enter" && options[activeIndex]) {
            event.preventDefault();
            onSelect(options[activeIndex]);
            setOpen(false);
          } else if (event.key === "Escape") {
            setOpen(false);
          }
        }}
        onChange={(event) => {
          const next = event.target.value;
          onTextChange(next);
          setTypedQuery(next.trim());
        }}
      />
      {open ? (
        <ul className="location-suggest-list" id={listId} role="listbox">
          {loading ? <li className="location-suggest-empty">Searching…</li> : null}
          {!loading && failed ? <li className="location-suggest-empty">City search is unavailable</li> : null}
          {!loading && !failed && options.length === 0 ? (
            <li className="location-suggest-empty">{emptyHint}</li>
          ) : null}
          {options.map((option, index) => (
            <li key={option.id}>
              <button
                type="button"
                className={`location-suggest-option${index === activeIndex ? " is-active" : ""}`}
                role="option"
                aria-selected={index === activeIndex}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => {
                  onSelect(option);
                  setOpen(false);
                }}
              >
                <span className="location-suggest-code">{option.code}</span>
                <span>
                  <strong>{option.title}</strong>
                  {option.subtitle ? <small>{option.subtitle}</small> : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
