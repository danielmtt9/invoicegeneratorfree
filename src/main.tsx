import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";
import { ConsentProvider } from "./consent/ConsentContext";
import { SiteLayout } from "./shared/Layout";
import { FEATURES } from "./shared/features";

if (FEATURES.pwa && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js");
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConsentProvider>
      <SiteLayout title="Create an invoice">
        <App />
      </SiteLayout>
    </ConsentProvider>
  </React.StrictMode>
);
