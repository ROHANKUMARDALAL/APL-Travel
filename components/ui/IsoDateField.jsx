"use client";

import DatePicker from "@/components/ui/DatePicker";

export function isoToDate(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function dateToIso(date) {
  if (!date) return "";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export default function IsoDateField({
  id,
  label,
  value,
  onChange,
  min,
  max,
  placeholder = "Select date",
  clearable = false,
  compact = false,
  align = "start",
  rangeStart,
  rangeEnd,
}) {
  return (
    <DatePicker
      id={id}
      label={label}
      value={isoToDate(value)}
      minDate={isoToDate(min)}
      maxDate={isoToDate(max)}
      rangeStart={isoToDate(rangeStart)}
      rangeEnd={isoToDate(rangeEnd)}
      placeholder={placeholder}
      clearable={clearable}
      compact={compact}
      align={align}
      onChange={(date) => onChange(dateToIso(date))}
    />
  );
}
