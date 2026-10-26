const inflight = new Map();

export function shouldCoalesce(method, path) {
  if (String(method || "").toUpperCase() !== "POST") return false;
  const clean = String(path || "").split("?")[0];
  return /\/(search|details|revalidate)$/.test(clean);
}

export function coalesceKey(method, path, body, token) {
  return `${String(method).toUpperCase()} ${path} ${token || ""} ${
    body === undefined ? "" : JSON.stringify(body)
  }`;
}

export function shareInflight(key, factory) {
  const existing = inflight.get(key);
  if (existing) return existing;
  const promise = Promise.resolve()
    .then(factory)
    .finally(() => {
      if (inflight.get(key) === promise) inflight.delete(key);
    });
  inflight.set(key, promise);
  return promise;
}
