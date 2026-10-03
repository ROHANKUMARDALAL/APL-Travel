const KEY = "apl-search-results";

function readAll() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.sessionStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

export function searchCacheKey(service, searchParams) {
  const params =
    typeof searchParams?.toString === "function"
      ? new URLSearchParams(searchParams.toString())
      : new URLSearchParams(searchParams || {});
  params.delete("simulate");
  const sorted = [...params.entries()].sort(([a], [b]) => a.localeCompare(b));
  return `${service}::${new URLSearchParams(sorted).toString()}`;
}

export function cacheSearchResults(service, key, items) {
  if (typeof window === "undefined" || !key) return;
  const all = readAll();
  all[key] = {
    service,
    items: items || [],
    savedAt: Date.now(),
  };
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // ignore quota
  }
}

export function readSearchResults(service, key) {
  if (typeof window === "undefined" || !key) return null;
  const entry = readAll()?.[key];
  if (!entry || entry.service !== service || !Array.isArray(entry.items)) return null;
  return entry.items;
}
