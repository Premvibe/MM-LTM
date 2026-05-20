import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Clear dynamic import / chunk load error flags upon successful startup
try {
  sessionStorage.removeItem("vite-preload-error-reload");
  sessionStorage.removeItem("chunk-load-error-reload");
} catch (e) {
  // Ignore sessionStorage block/errors
}

// Handle Vite dynamic import errors globally
window.addEventListener("vite:preloadError", () => {
  try {
    const hasReloaded = sessionStorage.getItem("vite-preload-error-reload");
    if (!hasReloaded) {
      sessionStorage.setItem("vite-preload-error-reload", "true");
      window.location.reload();
    }
  } catch (e) {
    window.location.reload();
  }
});

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

