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
  emptyHint = "No matches",
}) {
  const listId = useId();
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [typedQuery, setTypedQuery] = useState("");

  useEffect(() => {
    const query = typedQuery.trim();
    if (query.length < 3) {
      setOptions([]);
      setOpen(false);
      setLoading(false);
      return undefined;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setOpen(true);
      try {
        const next = await fetchOptions(query);
        setOptions(
          (next || []).filter((option) =>
            [option.title, option.code].some((field) => lettersInOrder(field, query)),
          ),
        );
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [typedQuery, fetchOptions]);

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
        onChange={(event) => {
          const next = event.target.value;
          onTextChange(next);
          setTypedQuery(next.trim());
        }}
      />
      {open && typedQuery.trim().length >= 3 ? (
        <ul className="location-suggest-list" id={listId} role="listbox">
          {loading ? <li className="location-suggest-empty">Searching…</li> : null}
          {!loading && options.length === 0 ? (
            <li className="location-suggest-empty">{emptyHint}</li>
          ) : null}
          {options.map((option) => (
            <li key={option.id}>
              <button
                type="button"
                className="location-suggest-option"
                role="option"
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
