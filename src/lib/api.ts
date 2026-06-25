import axios from "axios";

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

export default api;
