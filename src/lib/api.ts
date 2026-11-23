import axios, { AxiosAdapter, AxiosResponse } from "axios";

let baseURL = import.meta.env.VITE_API_URL || "https://mm-ltm-backend.onrender.com/api";

if (import.meta.env.DEV && !import.meta.env.VITE_API_URL) {
  baseURL = "http://localhost:5001/api";
}

// Ensure baseURL ends with /api
if (baseURL && !baseURL.endsWith("/api") && !baseURL.endsWith("/api/")) {
  baseURL = baseURL.replace(/\/$/, "") + "/api";
}

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ---------------------------------------------------------------------------
// Short-lived GET cache
//
// Many pages request the same lists (/fellows, /centres, /sessions ...) every
// time they mount. This cache serves repeat GETs for a short time and shares
// identical requests that are already in flight, so moving between pages
// doesn't refetch everything.
//
// - Any POST/PUT/PATCH/DELETE clears the whole cache, so edits show up
//   immediately on the next fetch.
// - Notifications, auth and drive requests are never cached.
// - Each caller gets its own copy of the data, so in-place edits such as
//   `res.data.sort(...)` can't corrupt the cached copy.
// ---------------------------------------------------------------------------
const CACHE_TTL_MS = 60_000;
const UNCACHED_PREFIXES = ["/notifications", "/auth", "/drive"];

const cache = new Map<string, { time: number; response: AxiosResponse }>();
const inFlight = new Map<string, Promise<AxiosResponse>>();
// Bumped on every clear, so a GET that started before a write can't refill the cache with old data
let generation = 0;

export function clearApiCache() {
  generation++;
  cache.clear();
  inFlight.clear();
}

const cloneResponse = (res: AxiosResponse): AxiosResponse => ({
  ...res,
  data: typeof res.data === "object" && res.data !== null ? structuredClone(res.data) : res.data,
});

const networkAdapter = axios.getAdapter(axios.defaults.adapter);

const cachingAdapter: AxiosAdapter = async (config) => {
  const method = (config.method || "get").toLowerCase();

  if (method !== "get") {
    try {
      return await networkAdapter(config);
    } finally {
      clearApiCache();
    }
  }

  const path = (config.url || "").split("?")[0];
  if (UNCACHED_PREFIXES.some((p) => path.startsWith(p))) {
    return networkAdapter(config);
  }

  const key = api.getUri(config);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.time < CACHE_TTL_MS) {
    return cloneResponse({ ...hit.response, config });
  }

  let pending = inFlight.get(key);
  if (!pending) {
    const startedAt = generation;
    const request = networkAdapter(config)
      .then((res) => {
        if (startedAt === generation && res.status >= 200 && res.status < 300) {
          cache.set(key, { time: Date.now(), response: res });
        }
        return res;
      })
      .finally(() => {
        if (inFlight.get(key) === request) inFlight.delete(key);
      });
    pending = request;
    inFlight.set(key, request);
  }
  const res = await pending;
  return cloneResponse({ ...res, config });
};

api.defaults.adapter = cachingAdapter;

/** Append extra query params to a path that may already have a query string, e.g. "/sessions?role=fellow&email=…". */
export function withQuery(path: string, extra: Record<string, string | number | boolean | undefined>) {
  const parts = Object.entries(extra)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  if (!parts.length) return path;
  return path + (path.includes("?") ? "&" : "?") + parts.join("&");
}

export default api;
