import React from "react";

export function PrivacyPage() {
  return (
    <div className="panel">
      <div className="hd">
        <h2>Overview</h2>
      </div>
      <div className="bd" style={{ display: "grid", gap: 10 }}>
        <div className="fine">
          Invoice Generator is a free web tool. It does not require accounts, and we do not ask for your name or email to
          create an invoice. This policy explains what we collect, why we collect it, and your choices.
        </div>

        <section>
          <h3 style={{ margin: "10px 0 6px" }}>Invoice content</h3>
          <div className="fineMuted">
            Your invoice fields (From/Bill To/items/notes) stay in your browser. We do not upload or store invoice content
            on our servers as part of normal use.
          </div>
        </section>

        <section>
          <h3 style={{ margin: "10px 0 6px" }}>Analytics (opt-in)</h3>
          <div className="fineMuted">
            If you choose to accept analytics cookies, we record basic usage events such as page views and PDF download
            clicks. This helps us understand which pages are used and improve the site.
          </div>
          <ul className="fineMuted" style={{ margin: "8px 0 0", paddingLeft: 18 }}>
            <li>Event type (page_view, invoice_pdf_download)</li>
            <li>Page path (e.g. /faq/)</li>
            <li>Referrer host (if provided by your browser)</li>
            <li>Truncated browser user-agent (for debugging and bot filtering)</li>
            <li>Hashed IP address (we store a salted hash, not the raw IP)</li>
            <li>Anonymous visitor ID cookie (ig_vid) used to estimate unique visitors</li>
          </ul>
        </section>

        <section>
          <h3 style={{ margin: "10px 0 6px" }}>Retention</h3>
          <div className="fineMuted">Analytics events are retained for up to 90 days and then deleted automatically.</div>
        </section>

        <section>
          <h3 style={{ margin: "10px 0 6px" }}>Your choices</h3>
          <div className="fineMuted">
            You can enable or disable analytics at any time via “Cookie settings” in the footer. We also respect Do Not
            Track (DNT) where supported.
          </div>
        </section>

        <section>
          <h3 style={{ margin: "10px 0 6px" }}>Contact</h3>
          <div className="fineMuted">
            Questions? Email{" "}
            <a className="link" href="mailto:support@invoicegenerator.cloud">
              support@invoicegenerator.cloud
            </a>
            .
          </div>
        </section>

        <div className="fineMuted">
          This policy is provided for transparency and does not constitute legal advice.
        </div>
      </div>
    </div>
  );
}

