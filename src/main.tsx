import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register Service Worker for offline capability
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      console.log('[SW] Registered:', reg.scope);

      // Detect waiting worker on first load
      if (reg.waiting) {
        window.dispatchEvent(new CustomEvent('sw-update-available', { detail: reg.waiting }));
      }

      // Detect new worker entering waiting state
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            window.dispatchEvent(new CustomEvent('sw-update-available', { detail: newWorker }));
          }
        });
      });

      // Check for updates every 30 minutes
      setInterval(() => reg.update(), 30 * 60 * 1000);
    }).catch((err) => {
      console.warn('[SW] Registration failed:', err);
    });
  });

  // Reload all tabs when a new SW takes over
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
