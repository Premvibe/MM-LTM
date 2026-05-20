import axios from "axios";

let baseURL = import.meta.env.VITE_API_URL || "https://mm-ltm-backend.onrender.com/api";

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
