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

// ---------------------------------------------------------------------------
// Auth token
//
// Login returns a token, stored with the user in localStorage. It is sent on
// every request. Routes that require it (donors, sponsorships, replacing a
// fellow) answer 401 + code AUTH_REQUIRED when it is missing or expired, and
// AuthContext then logs the user out so they can sign in again.
// ---------------------------------------------------------------------------
export const AUTH_EXPIRED_EVENT = "manzil:auth-expired";

api.interceptors.request.use((config) => {
  try {
    const saved = localStorage.getItem("manzil_user");
    const token = saved ? JSON.parse(saved)?.token : undefined;
    if (token) config.headers.set("Authorization", `Bearer ${token}`);
  } catch {
    // No stored user, nothing to attach
  }
  return config;
});

api.interceptors.response.use(undefined, (error) => {
  if (error?.response?.status === 401 && error.response.data?.code === "AUTH_REQUIRED") {
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
  }
  return Promise.reject(error);
});

// ---------------------------------------------------------------------------
// Program model: High touch (this app's own backend) or Mid touch
//
// Admins and managers can switch to Mid touch. Their requests then go to the
// Mid touch backend, which has its own database (facilitators, centres,
// students, sessions ...). Logins and the Managers page always stay on the
// High touch backend, because admin accounts live only there. Fellows are
// always High touch.
// ---------------------------------------------------------------------------
export type ProgramModel = "high" | "mid";

const PROGRAM_MODEL_KEY = "manzil_program_model";
const HIGH_TOUCH_ONLY_PREFIXES = ["/auth", "/admins"];

export let MIDTOUCH_API_URL = import.meta.env.VITE_MIDTOUCH_API_URL || "https://mm-ltm-midtouch-backend.onrender.com/api";
if (import.meta.env.DEV && !import.meta.env.VITE_MIDTOUCH_API_URL) {
  MIDTOUCH_API_URL = "http://localhost:5002/api";
}
if (!MIDTOUCH_API_URL.endsWith("/api") && !MIDTOUCH_API_URL.endsWith("/api/")) {
  MIDTOUCH_API_URL = MIDTOUCH_API_URL.replace(/\/$/, "") + "/api";
}

// Facilitators sign in on this app's login page, then use the Mid touch app at /mid-touch
// (same domain, so it reads the login saved under this key).
export const MIDTOUCH_APP_PATH = import.meta.env.VITE_MIDTOUCH_APP_PATH || "/mid-touch/";
export const MIDTOUCH_USER_KEY = "manzil_midtouch_user";

const storedUser = (): { role?: string; programModel?: string } | undefined => {
  try {
    const saved = localStorage.getItem("manzil_user");
    return saved ? JSON.parse(saved) : undefined;
  } catch {
    return undefined;
  }
};

/** Mid touch is available to every signed-in user except fellows. */
export const canUseMidTouch = (role?: string) => !!role && role !== "fellow";

/** A Program Manager – Mid Touch works only in Mid touch. */
export const isMidTouchOnly = (user?: { role?: string; programModel?: string } | null) =>
  !!user && canUseMidTouch(user.role) && user.programModel === "mid";

export function getProgramModel(): ProgramModel {
  try {
    const user = storedUser();
    if (isMidTouchOnly(user)) return "mid";
    if (localStorage.getItem(PROGRAM_MODEL_KEY) === "mid" && canUseMidTouch(user?.role)) return "mid";
  } catch {
    // Storage unavailable: default to High touch
  }
  return "high";
}

export function setProgramModel(model: ProgramModel) {
  try {
    if (model === "mid") localStorage.setItem(PROGRAM_MODEL_KEY, "mid");
    else localStorage.removeItem(PROGRAM_MODEL_KEY);
  } catch {
    // Storage unavailable: the choice lasts until the page reloads
  }
  clearApiCache();
}

api.interceptors.request.use((config) => {
  const path = (config.url || "").split("?")[0];
  if (getProgramModel() === "mid" && !HIGH_TOUCH_ONLY_PREFIXES.some((p) => path.startsWith(p))) {
    config.baseURL = MIDTOUCH_API_URL;
  }
  return config;
});

/** Append extra query params to a path that may already have a query string, e.g. "/sessions?role=fellow&email=…". */
export function withQuery(path: string, extra: Record<string, string | number | boolean | undefined>) {
  const parts = Object.entries(extra)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  if (!parts.length) return path;
  return path + (path.includes("?") ? "&" : "?") + parts.join("&");
}

export default api;

/** The server's error message from a failed request, or the fallback text. */
export function apiErrorMessage(error: unknown, fallback: string): string {
  return (axios.isAxiosError(error) && error.response?.data?.message) || fallback;
}

/** True when the request failed because the user needs to log in again (handled globally above). */
export function isAuthError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 401;
}
