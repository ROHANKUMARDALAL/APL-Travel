import { getLocale } from "@/data/markets";

/**
 * Calendar helpers.
 * Travel dates are calendar dates for the trip/service (depart, check-in, etc.),
 * not the shopper’s local wall-clock timezone. Validation stays date-only.
 */

export function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function today() {
  return startOfDay(new Date());
}

export function addDays(date, days) {
  const next = startOfDay(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function isSameDay(a, b) {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isBeforeDay(a, b) {
  return startOfDay(a).getTime() < startOfDay(b).getTime();
}

export function isAfterDay(a, b) {
  return startOfDay(a).getTime() > startOfDay(b).getTime();
}

export function clampDate(date, minDate, maxDate) {
  let next = startOfDay(date);
  if (minDate && isBeforeDay(next, minDate)) next = startOfDay(minDate);
  if (maxDate && isAfterDay(next, maxDate)) next = startOfDay(maxDate);
  return next;
}

export function formatDateLabel(date, marketId) {
  if (!date) return "";
  return date.toLocaleDateString(getLocale(marketId), {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatMonthYear(date, marketId) {
  return date.toLocaleDateString(getLocale(marketId), {
    month: "long",
    year: "numeric",
  });
}

export function getMonthMatrix(viewDate) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const first = new Date(year, month, 1);
  const startOffset = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];

  for (let i = 0; i < startOffset; i += 1) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day));
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  return cells;
}
