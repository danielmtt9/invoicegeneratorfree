import React from "react";
import ReactDOM from "react-dom/client";
import { SiteLayout } from "../../shared/Layout";
import "../../styles.css";
import Page from "./page";
import { ConsentProvider } from "../../consent/ConsentContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConsentProvider>
      <SiteLayout title="Invoice Generator for Entrepreneurs">
        <Page />
      </SiteLayout>
    </ConsentProvider>
  </React.StrictMode>
);
