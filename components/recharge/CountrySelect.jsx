"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

function matches(country, query) {
  const text = query.trim().toLowerCase();
  if (!text) return true;
  const compact = text.replace(/\s+/g, "");
  if (country.name.toLowerCase().includes(text)) return true;
  if (country.iso.toLowerCase().startsWith(compact)) return true;
  if (/^\+?\d+$/.test(compact)) {
    return String(country.dialCode || "").replace("+", "") === compact.replace("+", "");
  }
  return false;
}

export default function CountrySelect({
  countries,
  value,
  onChange,
  label = "Country",
  hideLabel = false,
  dialOnly = false,
}) {
  const fieldId = useId();
  const listId = `${fieldId}-list`;
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const listRef = useRef(null);
  const searchRef = useRef(null);
  const optionRefs = useRef([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [menuStyle, setMenuStyle] = useState(null);

  const list = useMemo(() => {
    const seen = new Set();
    return (countries || [])
      .filter((country) => {
        if (!country?.iso || seen.has(country.iso)) return false;
        seen.add(country.iso);
        return true;
      })
      .slice()
      .sort((left, right) => left.name.localeCompare(right.name) || left.iso.localeCompare(right.iso));
  }, [countries]);
  const visible = useMemo(() => list.filter((country) => matches(country, query)), [list, query]);
  const selected = list.find((country) => country.iso === value) || null;

  function measure() {
    const trigger = triggerRef.current;
    if (!trigger) return null;
    const rect = trigger.getBoundingClientRect();
    const width = Math.max(rect.width, 320);
    const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8);
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < 280 && rect.top > spaceBelow;
    return {
      left,
      width,
      top: openUp ? undefined : rect.bottom + 6,
      bottom: openUp ? window.innerHeight - rect.top + 6 : undefined,
    };
  }

  function openMenu() {
    const index = Math.max(0, visible.findIndex((country) => country.iso === value));
    setMenuStyle(measure());
    setActiveIndex(index);
    setOpen(true);
  }

  function closeMenu(restoreFocus = false) {
    setOpen(false);
    setQuery("");
    if (restoreFocus) triggerRef.current?.focus();
  }

  function choose(country) {
    if (!country) return;
    onChange(country.iso);
    closeMenu(true);
  }

  function reveal(index) {
    const listNode = listRef.current;
    const option = optionRefs.current[index];
    if (!listNode || !option) return;
    const top = option.offsetTop;
    const bottom = top + option.offsetHeight;
    if (top < listNode.scrollTop) listNode.scrollTop = top;
    else if (bottom > listNode.scrollTop + listNode.clientHeight) listNode.scrollTop = bottom - listNode.clientHeight;
  }

  useEffect(() => {
    if (!open) return undefined;
    searchRef.current?.focus();
    const selectedIndex = Math.max(0, visible.findIndex((country) => country.iso === value));
    const option = optionRefs.current[selectedIndex];
    if (option && listRef.current) listRef.current.scrollTop = option.offsetTop;
    function onPointerDown(event) {
      if (!rootRef.current?.contains(event.target)) closeMenu(false);
    }
    function place(event) {
      if (listRef.current && event?.target && listRef.current.contains(event.target)) return;
      setMenuStyle(measure());
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  function onSearchKeyDown(event) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      const next = Math.min(visible.length - 1, activeIndex + 1);
      setActiveIndex(next);
      reveal(next);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      const next = Math.max(0, activeIndex - 1);
      setActiveIndex(next);
      reveal(next);
    } else if (event.key === "Enter") {
      event.preventDefault();
      choose(visible[activeIndex]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      closeMenu(true);
    }
  }

  return (
    <div className="rch-country" ref={rootRef}>
      <span className={`rch-label${hideLabel ? " is-hidden" : ""}`} id={fieldId}>{label}</span>
      <button
        type="button"
        className={`rch-country-trigger ${open ? "is-open" : ""}${dialOnly ? " is-dial" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={hideLabel ? (dialOnly ? "Dialing code" : label) : undefined}
        aria-labelledby={hideLabel ? undefined : fieldId}
        ref={triggerRef}
        onClick={() => (open ? closeMenu(false) : openMenu())}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (!open) openMenu();
          } else if (event.key === "Escape" && open) {
            event.preventDefault();
            closeMenu(true);
          }
        }}
      >
        <span>{selected ? (dialOnly ? `${selected.flag} ${selected.dialCode}` : `${selected.flag} ${selected.name}`) : (dialOnly ? "Code" : "Choose a country")}</span>
        {!dialOnly && selected ? <strong>{selected.dialCode}</strong> : null}
      </button>
      {open ? (
        <div className="rch-country-menu" style={menuStyle || undefined}>
          <input
            ref={searchRef}
            className="rch-country-search"
            value={query}
            placeholder="Search name, ISO, or dial code"
            aria-label="Search countries"
            aria-controls={listId}
            aria-activedescendant={visible[activeIndex] ? `${fieldId}-${visible[activeIndex].iso}` : undefined}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
              if (listRef.current) listRef.current.scrollTop = 0;
            }}
            onKeyDown={onSearchKeyDown}
          />
          <div id={listId} className="rch-country-list" role="listbox" aria-label="Countries" ref={listRef}>
            {visible.length ? visible.map((country, index) => {
              const isSelected = country.iso === value;
              return (
                <button
                  key={country.iso}
                  id={`${fieldId}-${country.iso}`}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  ref={(node) => { optionRefs.current[index] = node; }}
                  className={`rch-country-option ${isSelected ? "is-selected" : ""} ${index === activeIndex ? "is-active" : ""}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => choose(country)}
                >
                  <span className="rch-country-flag" aria-hidden="true">{country.flag}</span>
                  <span className="rch-country-name">{country.name}</span>
                  <span className="rch-country-dial">{country.dialCode}</span>
                  {isSelected ? <span className="rch-country-check" aria-hidden="true">✓</span> : <span className="rch-country-check" />}
                </button>
              );
            }) : <p className="rch-country-empty">No countries found</p>}
          </div>
        </div>
      ) : null}
    </div>
  );
}
