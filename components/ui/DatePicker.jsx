"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  addDays,
  clampDate,
  formatDateLabel,
  getMonthMatrix,
  isBeforeDay,
  isSameDay,
  startOfDay,
  today,
} from "@/lib/dateUtils";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function DatePicker({
  id,
  label,
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = "Select date",
}) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => startOfDay(value || minDate || today()));

  const effectiveMin = minDate ? startOfDay(minDate) : null;
  const effectiveMax = maxDate ? startOfDay(maxDate) : null;

  useEffect(() => {
    if (value) setViewDate(startOfDay(value));
  }, [value]);

  useEffect(() => {
    function onPointerDown(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }
    function onKeyDown(event) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const cells = useMemo(() => getMonthMatrix(viewDate), [viewDate]);

  function openCalendar() {
    if (value) {
      setViewDate(startOfDay(value));
    } else if (effectiveMin && effectiveMax) {
      const preferredYear = effectiveMax.getFullYear() - 30;
      const year = Math.min(
        effectiveMax.getFullYear(),
        Math.max(effectiveMin.getFullYear(), preferredYear),
      );
      setViewDate(startOfDay(new Date(year, 0, 1)));
    } else {
      setViewDate(startOfDay(effectiveMin || today()));
    }
    setOpen(true);
  }

  function selectDay(day) {
    if (!day) return;
    if (effectiveMin && isBeforeDay(day, effectiveMin)) return;
    if (effectiveMax && isBeforeDay(effectiveMax, day)) return;
    onChange(clampDate(day, effectiveMin, effectiveMax));
    setOpen(false);
  }

  function shiftMonth(delta) {
    setViewDate((current) => {
      const next = new Date(current);
      next.setMonth(next.getMonth() + delta);
      return startOfDay(next);
    });
  }

  function showMonth(year, month) {
    const day = Math.min(viewDate.getDate(), new Date(year, month + 1, 0).getDate());
    setViewDate(startOfDay(new Date(year, month, day)));
  }

  const minYear = effectiveMin ? effectiveMin.getFullYear() : viewDate.getFullYear() - 100;
  const maxYear = effectiveMax
    ? effectiveMax.getFullYear()
    : effectiveMin
      ? effectiveMin.getFullYear() + 2
      : viewDate.getFullYear() + 2;
  const years = [];
  for (let year = maxYear; year >= minYear; year -= 1) years.push(year);

  const display = value ? formatDateLabel(value) : placeholder;

  return (
    <div className="date-picker" ref={rootRef}>
      {label ? (
        <label className="field-label" htmlFor={fieldId}>
          {label}
        </label>
      ) : null}

      <button
        id={fieldId}
        type="button"
        className={`date-picker-trigger ${open ? "is-open" : ""} ${!value ? "is-placeholder" : ""}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={openCalendar}
      >
        <span className="date-picker-value">{display}</span>
        <span className="date-picker-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
            <path
              d="M7 3v2M17 3v2M4 9h16M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </button>

      {open ? (
        <div className="calendar-popover" role="dialog" aria-label={label || "Choose date"}>
          <div className="calendar-header">
            <button
              type="button"
              className="calendar-nav-btn"
              aria-label="Previous month"
              onClick={() => shiftMonth(-1)}
            >
              ‹
            </button>
            <div className="calendar-selects">
              <select
                className="calendar-select"
                aria-label="Month"
                value={viewDate.getMonth()}
                onChange={(event) => showMonth(viewDate.getFullYear(), Number(event.target.value))}
              >
                {MONTHS.map((month, index) => (
                  <option key={month} value={index}>
                    {month}
                  </option>
                ))}
              </select>
              <select
                className="calendar-select"
                aria-label="Year"
                value={viewDate.getFullYear()}
                onChange={(event) => showMonth(Number(event.target.value), viewDate.getMonth())}
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="calendar-nav-btn"
              aria-label="Next month"
              onClick={() => shiftMonth(1)}
            >
              ›
            </button>
          </div>

          <div className="calendar-weekdays">
            {WEEKDAYS.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="calendar-grid">
            {cells.map((day, index) => {
              if (!day) {
                return <span key={`empty-${index}`} className="calendar-day is-empty" />;
              }

              const disabled =
                (effectiveMin && isBeforeDay(day, effectiveMin)) ||
                (effectiveMax && isBeforeDay(effectiveMax, day));
              const selected = value && isSameDay(day, value);
              const isToday = isSameDay(day, today());

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  disabled={disabled}
                  className={`calendar-day ${selected ? "is-selected" : ""} ${isToday ? "is-today" : ""}`}
                  onClick={() => selectDay(day)}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          <div className="calendar-footer">
            <button
              type="button"
              className="calendar-today-btn"
              onClick={() => {
                const base = effectiveMin && isBeforeDay(today(), effectiveMin)
                  ? effectiveMin
                  : today();
                selectDay(clampDate(base, effectiveMin, effectiveMax));
              }}
            >
              Today
            </button>
            <button
              type="button"
              className="calendar-clear-btn"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export { addDays, today };
