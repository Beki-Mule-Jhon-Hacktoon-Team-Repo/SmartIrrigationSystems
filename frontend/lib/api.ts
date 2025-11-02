export const API_BASE = "http://localhost:5000";

export async function fetchJson(url: string, opts: RequestInit = {}) {
  // ensure Content-Type for JSON bodies
  const headers = Object.assign(
    { "Content-Type": "application/json" },
    opts.headers || {}
  );
  const final = Object.assign({}, opts, { headers });
  const res = await fetch(
    url.startsWith("http") ? url : API_BASE ? `${API_BASE}${url}` : url,
    final
  );
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (e) {
    data = text;
  }
  if (!res.ok) {
    const err = new Error(
      data && data.message ? data.message : `Request failed: ${res.status}`
    );
    // @ts-ignore
    err.status = res.status;
    // @ts-ignore
    err.body = data;
    throw err;
  }
  return data;
}
