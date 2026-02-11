import React from "react";

const BENEFITS = [
  "Invoice content stays on your device",
  "Download a polished PDF in seconds",
  "No account signup required",
  "Global currency support",
  "Smart totals with balance due",
  "Local draft convenience for repeat invoicing",
];

const PROFESSIONALS = ["Freelancers", "Consultants", "Contractors", "Designers", "Photographers", "Entrepreneurs"];

export default function Page() {
  return (
    <div className="homeLayout">
      <section className="panel homeHero">
        <div className="hd">
          <div className="homeEyebrow">Privacy-first invoicing for modern independent businesses</div>
          <h2 className="homeTitle">Create invoices your clients can trust in minutes</h2>
        </div>
        <div className="bd">
          <p className="homeSubtext">
            Create polished invoices in your browser, keep invoice data local on your device, and download
            professional PDFs whenever you need them.
          </p>
          <div className="homeHeroActions">
            <a className="btn primary" href="/invoice/">
              Create Your First Invoice
            </a>
            <a className="btn" href="/faq/">
              See how it works
            </a>
          </div>
        </div>
      </section>

      <section className="panel trustBlock">
        <div className="bd">
          <div className="trustIcon" aria-hidden="true">
            🛡
          </div>
          <div className="trustCopy">
            <h3>Your data, your control</h3>
            <p>
              Unlike tools that store your invoice details in the cloud, invoice content stays local in your browser.
              We do not collect your client list, pricing, or invoice line items.
            </p>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="hd">
          <h2>Why users choose this platform</h2>
        </div>
        <div className="bd">
          <div className="benefitGrid">
            {BENEFITS.map((item) => (
              <div key={item} className="benefitItem">
                <span className="benefitCheck" aria-hidden="true">
                  ✓
                </span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="hd">
          <h2>Built for professionals</h2>
        </div>
        <div className="bd">
          <div className="roleGrid">
            {PROFESSIONALS.map((name) => (
              <article key={name} className="roleCard" aria-label={name}>
                <strong>{name}</strong>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="panel homeCtaBand">
        <div className="bd">
          <div>
            <h3>Ready to send your next invoice?</h3>
            <p>Start now and create a client-ready PDF in just a few steps.</p>
          </div>
          <a className="btn primary" href="/invoice/">
            Create Your First Invoice
          </a>
        </div>
      </section>
    </div>
  );
}
