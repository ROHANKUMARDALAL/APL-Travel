export const SERVICE_TABS = [
  { id: "all", label: "All" },
  { id: "holiday", label: "Holiday" },
  { id: "visa", label: "Visa" },
  { id: "group", label: "Group Departure" },
];

export function isGroupDeparture(row) {
  return row?.enquiryCategory === "GROUP_DEPARTURE";
}

export function serviceLabel(row) {
  if (isGroupDeparture(row)) return "Group Departure";
  const code = row?.serviceCode || "";
  if (code === "holiday") return "Holiday";
  if (code === "visa") return "Visa";
  if (code === "transfer") return "Transfer";
  return code ? code[0].toUpperCase() + code.slice(1) : "Enquiry";
}

export function statusClass(status) {
  if (status === "NEW") return "is-new";
  if (status === "CONTACTED" || status === "IN_PROGRESS") return "is-progress";
  if (status === "QUOTED") return "is-quoted";
  if (status === "CONFIRMED") return "is-done";
  if (status === "CANCELLED") return "is-cancelled";
  return "is-closed";
}

export function matchesTab(row, tab) {
  if (tab === "holiday") return row.serviceCode === "holiday" && !isGroupDeparture(row);
  if (tab === "visa") return row.serviceCode === "visa";
  if (tab === "group") return isGroupDeparture(row);
  return true;
}

export function formatWhen(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
}
