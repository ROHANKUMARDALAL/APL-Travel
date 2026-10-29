"use client";

import { useEffect, useId, useRef, useState } from "react";

function Chevron() {
  return (
    <svg className="premium-select-chevron" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M5 7.5 10 12.5 15 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function PremiumSelect({
  id,
  label,
  labelHidden = false,
  value,
  options,
  onChange,
  disabled = false,
  placeholder = "Select",
  ariaLabel,
  className = "",
}) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  const listId = `${fieldId}-list`;
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const optionRefs = useRef([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [menuStyle, setMenuStyle] = useState(null);
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const selected = options.find((option) => option.value === value) || null;

  function measure() {
    const trigger = triggerRef.current;
    if (!trigger) return null;
    const rect = trigger.getBoundingClientRect();
    const width = Math.max(rect.width, 168);
    const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8);
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < 220 && rect.top > spaceBelow;
    return {
      left,
      width,
      top: openUp ? undefined : rect.bottom + 6,
      bottom: openUp ? window.innerHeight - rect.top + 6 : undefined,
    };
  }

  function openMenu(index = selectedIndex) {
    if (disabled) return;
    setMenuStyle(measure());
    setActiveIndex(index);
    setOpen(true);
  }

  function closeMenu(restoreFocus = false) {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }

  function choose(option) {
    if (!option || option.disabled) return;
    onChange(option.value);
    closeMenu(true);
  }

  function moveActive(step) {
    const total = options.length;
    if (!total) return;
    let next = activeIndex;
    for (let hop = 0; hop < total; hop += 1) {
      next = (next + step + total) % total;
      if (!options[next]?.disabled) break;
    }
    setActiveIndex(next);
  }

  useEffect(() => {
    if (!open) return undefined;
    function onPointerDown(event) {
      if (!rootRef.current?.contains(event.target)) closeMenu(false);
    }
    function place() {
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

  useEffect(() => {
    if (!open) return;
    optionRefs.current[activeIndex]?.focus();
  }, [open, activeIndex]);

  function onTriggerKeyDown(event) {
    if (disabled) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      openMenu(event.key === "ArrowUp" ? options.length - 1 : selectedIndex);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (open) closeMenu(false);
      else openMenu(selectedIndex);
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      closeMenu(true);
    }
  }

  function onOptionKeyDown(event, index) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveActive(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveActive(-1);
    } else if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(options.length - 1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      choose(options[index]);
    } else if (event.key === "Escape" || event.key === "Tab") {
      if (event.key === "Escape") event.preventDefault();
      closeMenu(true);
    }
  }

  return (
    <div className={`premium-select ${className}`.trim()} ref={rootRef}>
      {label ? (
        <label className={labelHidden ? "sr-only" : "field-label"} htmlFor={fieldId}>
          {label}
        </label>
      ) : null}
      <button
        id={fieldId}
        ref={triggerRef}
        type="button"
        className={`premium-select-trigger ${open ? "is-open" : ""} ${selected ? "" : "is-placeholder"}`}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel || label || placeholder}
        onClick={() => (open ? closeMenu(false) : openMenu(selectedIndex))}
        onKeyDown={onTriggerKeyDown}
      >
        <span className="premium-select-value">{selected?.label || placeholder}</span>
        <Chevron />
      </button>
      {open ? (
        <div
          id={listId}
          className="premium-select-menu"
          role="listbox"
          aria-label={ariaLabel || label || placeholder}
          style={menuStyle || undefined}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                ref={(node) => {
                  optionRefs.current[index] = node;
                }}
                type="button"
                role="option"
                aria-selected={isSelected}
                disabled={option.disabled}
                tabIndex={index === activeIndex ? 0 : -1}
                className={`premium-select-option ${isSelected ? "is-selected" : ""} ${index === activeIndex ? "is-active" : ""}`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => choose(option)}
                onKeyDown={(event) => onOptionKeyDown(event, index)}
              >
                <span>{option.label}</span>
                {isSelected ? (
                  <svg className="premium-select-check" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M5 10.2 8.2 13.4 15 6.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
