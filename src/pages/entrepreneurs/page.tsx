import React from "react";

export default function Page() {
  return (
    <section className="panel">
      <div className="hd">
        <h2>Built for entrepreneurs</h2>
      </div>
      <div className="bd" style={{ display: "grid", gap: 16 }}>
        <p>
          Create clean invoices quickly with a privacy-first workflow. Your invoice content stays on your device and PDFs
          are generated in-browser.
        </p>
        <ul>
          <li>Searchable global currencies and editable tax presets</li>
          <li>Live preview, brand color, and template switching</li>
          <li>Optional Stripe payment link and QR code in PDF</li>
        </ul>
        <p>
          <a className="btn primary" href="/">
            Open Invoice Builder
          </a>
        </p>
      </div>
    </section>
  );
}
