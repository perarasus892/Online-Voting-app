import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Service worker registration for PWA features
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.log('SW registration failed: ', err);
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
