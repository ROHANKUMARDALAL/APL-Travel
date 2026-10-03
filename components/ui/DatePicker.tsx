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

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;
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
] as const;

export type DatePickerProps = {
  id?: string;
  label?: string;
  value?: Date | null;
  onChange: (date: Date | null) => void;
  minDate?: Date | null;
  maxDate?: Date | null;
  placeholder?: string;
};

function monthFullyOutsideRange(year: number, month: number, minDate: Date | null, maxDate: Date | null) {
  const monthStart = startOfDay(new Date(year, month, 1));
  const monthEnd = startOfDay(new Date(year, month + 1, 0));
  if (minDate && isBeforeDay(monthEnd, minDate)) return true;
  if (maxDate && isBeforeDay(maxDate, monthStart)) return true;
  return false;
}

export default function DatePicker({
  id,
  label,
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = "Select date",
}: DatePickerProps) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  const rootRef = useRef<HTMLDivElement | null>(null);
  const yearPanelRef = useRef<HTMLDivElement | null>(null);
  const monthPanelRef = useRef<HTMLDivElement | null>(null);
  const selectedYearRef = useRef<HTMLButtonElement | null>(null);
  const selectedMonthRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const [yearOpen, setYearOpen] = useState(false);
  const [monthOpen, setMonthOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => startOfDay(value || minDate || today()));

  const effectiveMin = minDate ? startOfDay(minDate) : null;
  const effectiveMax = maxDate ? startOfDay(maxDate) : null;

  useEffect(() => {
    if (value) setViewDate(startOfDay(value));
  }, [value]);

  const minTime = effectiveMin ? effectiveMin.getTime() : null;
  const maxTime = effectiveMax ? effectiveMax.getTime() : null;

  useEffect(() => {
    setViewDate((current) => {
      const next = clampDate(current, effectiveMin, effectiveMax);
      return next.getTime() === current.getTime() ? current : next;
    });
  }, [minTime, maxTime]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setYearOpen(false);
        setMonthOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (yearOpen) setYearOpen(false);
        else if (monthOpen) setMonthOpen(false);
        else setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [yearOpen, monthOpen]);

  useEffect(() => {
    if (!yearOpen) return;
    const selected = selectedYearRef.current;
    const panel = yearPanelRef.current;
    if (!selected || !panel) return;
    const top = selected.offsetTop - panel.clientHeight / 2 + selected.clientHeight / 2;
    panel.scrollTop = Math.max(0, top);
  }, [yearOpen, viewDate]);

  useEffect(() => {
    if (!monthOpen) return;
    const selected = selectedMonthRef.current;
    const panel = monthPanelRef.current;
    if (!selected || !panel) return;
    const top = selected.offsetTop - panel.clientHeight / 2 + selected.clientHeight / 2;
    panel.scrollTop = Math.max(0, top);
  }, [monthOpen, viewDate]);

  const cells = useMemo(() => getMonthMatrix(viewDate), [viewDate]);

  function closePanels() {
    setYearOpen(false);
    setMonthOpen(false);
  }

  function openCalendar() {
    closePanels();
    if (value) {
      setViewDate(startOfDay(value));
    } else if (effectiveMin && effectiveMax) {
      const span = effectiveMax.getFullYear() - effectiveMin.getFullYear();
      const preferred =
        span > 20
          ? startOfDay(new Date(effectiveMax.getFullYear() - 30, effectiveMax.getMonth(), 1))
          : startOfDay(
              new Date(
                effectiveMin.getFullYear() + Math.floor(span / 2),
                effectiveMin.getMonth(),
                1,
              ),
            );
      setViewDate(clampDate(preferred, effectiveMin, effectiveMax));
    } else {
      setViewDate(startOfDay(effectiveMin || today()));
    }
    setOpen(true);
  }

  function selectDay(day: Date | null) {
    if (!day) return;
    if (effectiveMin && isBeforeDay(day, effectiveMin)) return;
    if (effectiveMax && isBeforeDay(effectiveMax, day)) return;
    onChange(clampDate(day, effectiveMin, effectiveMax));
    closePanels();
    setOpen(false);
  }

  function shiftMonth(delta: number) {
    closePanels();
    setViewDate((current) => {
      const next = new Date(current);
      next.setMonth(next.getMonth() + delta);
      return startOfDay(next);
    });
  }

  function showMonth(year: number, month: number) {
    const day = Math.min(viewDate.getDate(), new Date(year, month + 1, 0).getDate());
    setViewDate(startOfDay(new Date(year, month, day)));
  }

  function selectYear(year: number) {
    showMonth(year, viewDate.getMonth());
    setYearOpen(false);
  }

  function selectMonth(month: number) {
    showMonth(viewDate.getFullYear(), month);
    setMonthOpen(false);
  }

  const minYear = effectiveMin ? effectiveMin.getFullYear() : viewDate.getFullYear() - 100;
  const maxYear = effectiveMax
    ? effectiveMax.getFullYear()
    : effectiveMin
      ? effectiveMin.getFullYear() + 2
      : viewDate.getFullYear() + 2;
  const years: number[] = [];
  for (let year = maxYear; year >= minYear; year -= 1) years.push(year);

  const display = value ? formatDateLabel(value) : placeholder;
  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();
  const panelOpen = yearOpen || monthOpen;

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
              <button
                type="button"
                className={`calendar-select calendar-month-trigger ${monthOpen ? "is-open" : ""}`}
                aria-haspopup="listbox"
                aria-expanded={monthOpen}
                aria-label="Month"
                onClick={() => {
                  setYearOpen(false);
                  setMonthOpen((prev) => !prev);
                }}
              >
                {MONTHS[currentMonth]}
              </button>
              <button
                type="button"
                className={`calendar-select calendar-year-trigger ${yearOpen ? "is-open" : ""}`}
                aria-haspopup="listbox"
                aria-expanded={yearOpen}
                aria-label="Year"
                onClick={() => {
                  setMonthOpen(false);
                  setYearOpen((prev) => !prev);
                }}
              >
                {currentYear}
              </button>
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

          {yearOpen ? (
            <div
              ref={yearPanelRef}
              className="calendar-picker-panel calendar-year-panel"
              role="listbox"
              aria-label="Select year"
            >
              <div className="calendar-picker-grid calendar-year-grid">
                {years.map((year) => {
                  const selected = year === currentYear;
                  return (
                    <button
                      key={year}
                      ref={selected ? selectedYearRef : undefined}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      className={`calendar-picker-option calendar-year-option ${selected ? "is-selected" : ""}`}
                      onClick={() => selectYear(year)}
                    >
                      {year}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {monthOpen ? (
            <div
              ref={monthPanelRef}
              className="calendar-picker-panel calendar-month-panel"
              role="listbox"
              aria-label="Select month"
            >
              <div className="calendar-picker-grid calendar-month-grid">
                {MONTHS.map((month, index) => {
                  const selected = index === currentMonth;
                  const disabled = monthFullyOutsideRange(
                    currentYear,
                    index,
                    effectiveMin,
                    effectiveMax,
                  );
                  return (
                    <button
                      key={month}
                      ref={selected ? selectedMonthRef : undefined}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      disabled={disabled}
                      className={`calendar-picker-option calendar-month-option ${selected ? "is-selected" : ""}`}
                      onClick={() => selectMonth(index)}
                    >
                      {month.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {!panelOpen ? (
            <>
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
                  const selected = Boolean(value && isSameDay(day, value));
                  const isToday = isSameDay(day, today());

                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      disabled={Boolean(disabled)}
                      className={`calendar-day ${selected ? "is-selected" : ""} ${isToday ? "is-today" : ""}`}
                      onClick={() => selectDay(day)}
                    >
                      {day.getDate()}
                    </button>
                  );
                })}
              </div>
            </>
          ) : null}

          <div className="calendar-footer">
            <button
              type="button"
              className="calendar-today-btn"
              onClick={() => {
                const base =
                  effectiveMin && isBeforeDay(today(), effectiveMin) ? effectiveMin : today();
                selectDay(clampDate(base, effectiveMin, effectiveMax));
              }}
            >
              Today
            </button>
            <button
              type="button"
              className="calendar-clear-btn"
              onClick={() => {
                closePanels();
                setOpen(false);
              }}
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
