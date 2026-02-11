import React from "react";
import ReactDOM from "react-dom/client";
import "../../styles.css";
import { ConsentProvider } from "../../consent/ConsentContext";
import { SiteLayout } from "../../shared/Layout";
import { FaqPage } from "./page";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConsentProvider>
      <SiteLayout title="FAQ">
        <FaqPage />
      </SiteLayout>
    </ConsentProvider>
  </React.StrictMode>
);

