const KEY = "apl-catalog";

function readAll() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.sessionStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

export function rememberCatalog(service, items) {
  if (typeof window === "undefined") return;
  const all = readAll();
  const bucket = { ...(all[service] || {}) };
  for (const item of items || []) {
    if (item?.id) bucket[item.id] = item;
  }
  all[service] = bucket;
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // ignore quota
  }
}

export function readCatalogItem(service, id) {
  if (!id) return null;
  return readAll()?.[service]?.[id] || null;
}
