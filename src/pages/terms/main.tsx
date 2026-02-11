import React from "react";
import ReactDOM from "react-dom/client";
import "../../styles.css";
import { ConsentProvider } from "../../consent/ConsentContext";
import { SiteLayout } from "../../shared/Layout";
import { TermsPage } from "./page";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConsentProvider>
      <SiteLayout title="Terms of Use">
        <TermsPage />
      </SiteLayout>
    </ConsentProvider>
  </React.StrictMode>
);

