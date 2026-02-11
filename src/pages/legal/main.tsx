import React from "react";
import ReactDOM from "react-dom/client";
import "../../styles.css";
import { ConsentProvider } from "../../consent/ConsentContext";
import { SiteLayout } from "../../shared/Layout";
import { LegalPage } from "./page";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConsentProvider>
      <SiteLayout title="Legal">
        <LegalPage />
      </SiteLayout>
    </ConsentProvider>
  </React.StrictMode>
);

