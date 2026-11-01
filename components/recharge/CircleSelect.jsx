"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

export default function CircleSelect({ circles, value, onChange, disabled }) {
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
  const list = circles || [];
  const visible = useMemo(() => {
    const text = query.trim().toLowerCase();
    return list.filter((row) => !text || row.name.toLowerCase().includes(text));
  }, [list, query]);
  const selected = list.find((row) => row.code === value) || null;

  function measure() {
    const trigger = triggerRef.current;
    if (!trigger) return null;
    const rect = trigger.getBoundingClientRect();
    const width = Math.max(rect.width, 280);
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
    if (disabled) return;
    setMenuStyle(measure());
    setActiveIndex(Math.max(0, visible.findIndex((row) => row.code === value)));
    setOpen(true);
  }

  function closeMenu(restoreFocus = false) {
    setOpen(false);
    setQuery("");
    if (restoreFocus) triggerRef.current?.focus();
  }

  function choose(row) {
    if (!row) return;
    onChange(row.code);
    closeMenu(true);
  }

  function reveal(index) {
    const option = optionRefs.current[index];
    const listNode = listRef.current;
    if (!option || !listNode) return;
    const top = option.offsetTop;
    const bottom = top + option.offsetHeight;
    if (top < listNode.scrollTop) listNode.scrollTop = top;
    else if (bottom > listNode.scrollTop + listNode.clientHeight) listNode.scrollTop = bottom - listNode.clientHeight;
  }

  useEffect(() => {
    if (!open) return undefined;
    searchRef.current?.focus();
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
      <span className="rch-label" id={fieldId}>Region / Circle</span>
      <button
        type="button"
        className={`rch-country-trigger ${open ? "is-open" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={fieldId}
        disabled={disabled}
        ref={triggerRef}
        onClick={() => (open ? closeMenu(false) : openMenu())}
        onKeyDown={(event) => {
          if (disabled) return;
          if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (!open) openMenu();
          } else if (event.key === "Escape" && open) {
            event.preventDefault();
            closeMenu(true);
          }
        }}
      >
        <span>{selected ? selected.name : disabled ? "Choose an operator first" : "Choose a region"}</span>
        {selected ? <span className="rch-country-check" aria-hidden="true">✓</span> : null}
      </button>
      {open ? (
        <div className="rch-country-menu" style={menuStyle || undefined}>
          <input
            ref={searchRef}
            className="rch-country-search"
            value={query}
            placeholder="Search region"
            aria-label="Search regions"
            aria-controls={listId}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
              if (listRef.current) listRef.current.scrollTop = 0;
            }}
            onKeyDown={onSearchKeyDown}
          />
          <div id={listId} className="rch-country-list" role="listbox" aria-label="Regions" ref={listRef}>
            {visible.length ? visible.map((row, index) => {
              const isSelected = row.code === value;
              return (
                <button
                  key={row.code}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  ref={(node) => { optionRefs.current[index] = node; }}
                  className={`rch-country-option rch-circle-option ${isSelected ? "is-selected" : ""} ${index === activeIndex ? "is-active" : ""}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => choose(row)}
                >
                  <span className="rch-country-name">{row.name}</span>
                  {isSelected ? <span className="rch-country-check" aria-hidden="true">✓</span> : <span className="rch-country-check" />}
                </button>
              );
            }) : <p className="rch-country-empty">No regions found</p>}
          </div>
        </div>
      ) : null}
    </div>
  );
}
