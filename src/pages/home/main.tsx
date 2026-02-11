import React from "react";
import ReactDOM from "react-dom/client";
import "../../styles.css";
import { ConsentProvider } from "../../consent/ConsentContext";
import { SiteLayout } from "../../shared/Layout";
import Page from "./page";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConsentProvider>
      <SiteLayout title="Privacy-first invoice generator">
        <Page />
      </SiteLayout>
    </ConsentProvider>
  </React.StrictMode>
);
