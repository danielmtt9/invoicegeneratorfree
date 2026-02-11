import React from "react";

function Code(props: { children: React.ReactNode }) {
  return (
    <code style={{ padding: "1px 6px", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 8, background: "rgba(0,0,0,0.18)" }}>
      {props.children}
    </code>
  );
}

export function CookiesPage() {
  return (
    <div className="panel">
      <div className="hd">
        <h2>How we use cookies</h2>
      </div>
      <div className="bd" style={{ display: "grid", gap: 10 }}>
        <div className="fineMuted">
          We use cookies to remember your analytics preference and (if you opt in) to estimate anonymous unique visitors.
        </div>

        <section>
          <h3 style={{ margin: "10px 0 6px" }}>Analytics cookies (opt-in)</h3>
          <ul className="fineMuted" style={{ margin: 0, paddingLeft: 18 }}>
            <li>
              <Code>ig_analytics</Code>: set to <Code>1</Code> when you accept analytics.
            </li>
            <li>
              <Code>ig_vid</Code>: an anonymous visitor ID used only to estimate unique visitors (not a login, not your
              name/email).
            </li>
          </ul>
        </section>

        <section>
          <h3 style={{ margin: "10px 0 6px" }}>Opt-out cookie</h3>
          <div className="fineMuted">
            If you decline analytics, we set <Code>ig_no_track</Code> to <Code>1</Code> to remember your choice.
          </div>
        </section>

        <section>
          <h3 style={{ margin: "10px 0 6px" }}>Do Not Track</h3>
          <div className="fineMuted">If your browser sends Do Not Track (DNT), analytics are disabled.</div>
        </section>

        <section>
          <h3 style={{ margin: "10px 0 6px" }}>Change your choice</h3>
          <div className="fineMuted">Use “Cookie settings” in the footer to enable or disable analytics at any time.</div>
        </section>
      </div>
    </div>
  );
}

