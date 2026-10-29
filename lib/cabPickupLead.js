export const CAB_LEAD_MS = 2 * 60 * 60 * 1000;
export const CAB_TIME_ZONE = "Asia/Kolkata";
export const CAB_LEAD_MESSAGE = "Please select a pickup time at least 2 hours from now.";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function isSupportedTimeZone(value) {
  if (!value || typeof value !== "string") return false;
  try {
    Intl.DateTimeFormat("en-US", { timeZone: value }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export function resolveCabTimeZone(source) {
  const zone = source?.timeZone || source?.timezone;
  return isSupportedTimeZone(zone) ? zone : CAB_TIME_ZONE;
}

export function zonedParts(date, timeZone = CAB_TIME_ZONE) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).formatToParts(date).map((part) => [part.type, part.value]),
  );
  const hour = parts.hour === "24" ? "00" : parts.hour;
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${hour}:${parts.minute}`,
    timeZone,
  };
}

export function minimumPickup(now = new Date(), timeZone = CAB_TIME_ZONE) {
  return zonedParts(new Date(now.getTime() + CAB_LEAD_MS), timeZone);
}

export function isPickupAllowed(date, time, now = new Date(), timeZone = CAB_TIME_ZONE) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || "")) || !/^\d{2}:\d{2}$/.test(String(time || ""))) return false;
  const earliest = minimumPickup(now, timeZone);
  return `${date}T${time}` >= `${earliest.date}T${earliest.time}`;
}

export function formatEarliestPickup(earliest) {
  const [, month, day] = earliest.date.split("-");
  const [hourText, minute] = earliest.time.split(":");
  const hour = Number(hourText);
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${Number(day)} ${MONTHS[Number(month) - 1]} ${earliest.date.slice(0, 4)}, ${hour12}:${minute} ${suffix}`;
}

export function dateFromIso(iso) {
  const [year, month, day] = String(iso).split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function toIsoDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}
