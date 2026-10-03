import { addDays, isAfterDay, isBeforeDay, startOfDay, today } from "@/lib/dateUtils";

const BIRTH_MIN = new Date(1920, 0, 1);

export const TRAVELLER_TYPES = [
  {
    value: "adult",
    label: "Adult",
    ageLabel: "12+ yrs",
    description: "Adult (12+ yrs)",
  },
  {
    value: "child",
    label: "Child",
    ageLabel: "2 – 12 yrs",
    description: "Child (2 - 12 yrs)",
  },
  {
    value: "infant",
    label: "Infant",
    ageLabel: "0 – 2 yrs",
    description: "Infant (0 - 2 yrs)",
  },
];

function yearsBefore(base, years) {
  const next = startOfDay(base);
  next.setFullYear(next.getFullYear() - years);
  return startOfDay(next);
}

export function bookingAsOfDate(asOf) {
  return asOf ? startOfDay(asOf) : today();
}

/**
 * DOB windows relative to the booking/action date.
 * Adult: on/before today-12y
 * Child: today-12y … today-2y
 * Infant: today-2y … today
 */
export function dobBoundsForType(type, asOf) {
  const asOfDay = bookingAsOfDate(asOf);
  const twelveYearsAgo = yearsBefore(asOfDay, 12);
  const twoYearsAgo = yearsBefore(asOfDay, 2);

  if (type === "infant") {
    return {
      minDate: twoYearsAgo,
      maxDate: asOfDay,
      message: "Infant must be between 0 and 2 years of age on booking date",
    };
  }

  if (type === "child") {
    return {
      minDate: twelveYearsAgo,
      maxDate: twoYearsAgo,
      message: "Child must be between 2 and 12 years of age on booking date",
    };
  }

  return {
    minDate: BIRTH_MIN,
    maxDate: twelveYearsAgo,
    message: "Adult must be at least 12 years of age on booking date",
  };
}

export function isDobValidForType(isoOrDate, type, asOf) {
  if (!isoOrDate) return false;
  const date =
    isoOrDate instanceof Date
      ? startOfDay(isoOrDate)
      : (() => {
          const [year, month, day] = String(isoOrDate).split("-").map(Number);
          if (!year || !month || !day) return null;
          return startOfDay(new Date(year, month - 1, day));
        })();
  if (!date) return false;
  const { minDate, maxDate } = dobBoundsForType(type, asOf);
  if (minDate && isBeforeDay(date, minDate)) return false;
  if (maxDate && isAfterDay(date, maxDate)) return false;
  return true;
}

export function dobErrorForType(isoOrDate, type, asOf) {
  if (!isoOrDate) return "";
  if (isDobValidForType(isoOrDate, type, asOf)) return "";
  return dobBoundsForType(type, asOf).message;
}

export function preferredDobViewDate(type, asOf) {
  const { minDate, maxDate } = dobBoundsForType(type, asOf);
  if (type === "adult") {
    return yearsBefore(bookingAsOfDate(asOf), 30);
  }
  if (type === "child") {
    return addDays(minDate, Math.floor((maxDate.getTime() - minDate.getTime()) / (2 * 86400000)));
  }
  return maxDate;
}

export { BIRTH_MIN };
