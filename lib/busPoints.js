const KEY = "apl-bus-points";

export function busPointKey(searchId, busId) {
  return `${searchId || ""}:${busId || ""}`;
}

function readAll() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.sessionStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

export function readBusPoints(searchId, busId) {
  const saved = readAll()[busPointKey(searchId, busId)];
  if (!saved?.boarding?.code || !saved?.dropping?.code) return null;
  if (saved.searchId !== searchId || saved.busId !== busId) return null;
  return saved;
}

export function saveBusPoints(searchId, busId, selection) {
  if (typeof window === "undefined") return;
  const all = readAll();
  all[busPointKey(searchId, busId)] = {
    searchId,
    busId,
    boarding: selection.boarding,
    dropping: selection.dropping,
  };
  window.sessionStorage.setItem(KEY, JSON.stringify(all));
}

export function pointClock(baseTime, point) {
  if (point?.time) return point.time;
  const match = String(baseTime || "").match(/^(\d{1,2}):(\d{2})/);
  if (!match) return "";
  const offset = Number(point?.timeOffsetMinutes) || 0;
  const total = (Number(match[1]) * 60 + Number(match[2]) + offset + 1440) % 1440;
  const hours = String(Math.floor(total / 60)).padStart(2, "0");
  const minutes = String(total % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
}
