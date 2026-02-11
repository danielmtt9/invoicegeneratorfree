import React from "react";
import { SITE } from "../../shared/site";

export function LegalPage() {
  return (
    <div className="panel">
      <div className="hd">
        <h2>Disclaimers</h2>
      </div>
      <div className="bd" style={{ display: "grid", gap: 10 }}>
        <div className="fineMuted">
          Invoice Generator is a product of {SITE.company}. The Service is provided for convenience. It is not legal, tax,
          or accounting advice.
        </div>
        <div className="fineMuted">
          You are responsible for ensuring your invoices meet the requirements of your customers, industry, and applicable
          laws.
        </div>
        <div className="fineMuted">
          For support, contact{" "}
          <a className="link" href={`mailto:${SITE.supportEmail}`}>
            {SITE.supportEmail}
          </a>
          .
        </div>
      </div>
    </div>
  );
}

