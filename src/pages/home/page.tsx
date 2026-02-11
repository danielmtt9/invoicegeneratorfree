import React from "react";

const ROLES = [
  { slug: "freelancers", label: "Freelancers" },
  { slug: "consultants", label: "Consultants" },
  { slug: "contractors", label: "Contractors" },
  { slug: "designers", label: "Designers" },
  { slug: "photographers", label: "Photographers" },
  { slug: "entrepreneurs", label: "Entrepreneurs" },
];

export default function Page() {
  return (
    <div className="homeLayout">
      <section className="panel homeHero">
        <div className="hd">
          <h2>Create polished invoices in minutes</h2>
        </div>
        <div className="bd">
          <p className="homeLead">
            Build invoices in your browser, keep your invoice content local, and download a professional PDF instantly.
          </p>
          <div className="homeHeroActions">
            <a className="btn primary" href="/invoice/">
              Open Invoice Builder
            </a>
            <a className="btn" href="/faq/">
              Read FAQ
            </a>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="hd">
          <h2>Who it&apos;s for</h2>
        </div>
        <div className="bd">
          <div className="roleGrid">
            {ROLES.map((role) => (
              <a key={role.slug} className="roleCard" href={`/${role.slug}/`}>
                <strong>{role.label}</strong>
                <span>View role-specific workflow</span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
