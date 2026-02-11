import React from "react";

function Q(props: { q: string; children: React.ReactNode }) {
  return (
    <section className="panel" style={{ marginBottom: 12 }}>
      <div className="hd">
        <h2>{props.q}</h2>
      </div>
      <div className="bd">{props.children}</div>
    </section>
  );
}

export function FaqPage() {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <Q q="Is this really free?">
        Yes. The public invoice generator is free to use and does not require an account.
      </Q>
      <Q q="Do you store my invoices?">
        No. Your invoice content stays in your browser. The PDF is generated client-side on your device.
      </Q>
      <Q q="What data do you collect?">
        If you opt in to analytics, we collect basic usage events (like page views and PDF download clicks) to understand
        traffic and improve the site. We do not collect names, emails, or invoice content.
      </Q>
      <Q q="How do I disable analytics?">
        Use “Cookie settings” in the footer to disable analytics at any time. We also respect Do Not Track where supported.
      </Q>
      <Q q="Can I use these invoices for tax or legal purposes?">
        This tool is provided as-is and is not legal, tax, or accounting advice. You are responsible for ensuring your
        invoices comply with your local laws and requirements.
      </Q>
      <Q q="Support">
        Email{" "}
        <a className="link" href="mailto:support@invoicegenerator.cloud">
          support@invoicegenerator.cloud
        </a>{" "}
        with questions or issues.
      </Q>
    </div>
  );
}

