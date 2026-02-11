import React from "react";
import { SITE } from "../../shared/site";

export function TermsPage() {
  return (
    <div className="panel">
      <div className="hd">
        <h2>Plain-English summary (non-binding)</h2>
      </div>
      <div className="bd" style={{ display: "grid", gap: 10 }}>
        <div className="fineMuted">
          This is a free tool. You are responsible for checking invoice accuracy and compliance. We provide the site
          “as-is” and limit liability as far as permitted by law.
        </div>
      </div>

      <div className="hd">
        <h2>Terms</h2>
      </div>
      <div className="bd" style={{ display: "grid", gap: 10 }}>
        <div className="fine">
          These Terms of Use apply to Invoice Generator (the “Service”), a product of {SITE.company}. By using the Service,
          you agree to these Terms.
        </div>

        <section>
          <h3 style={{ margin: "10px 0 6px" }}>1. The Service</h3>
          <div className="fineMuted">
            The Service helps you draft invoices in your browser and download a PDF. We do not provide legal, tax, or
            accounting advice.
          </div>
        </section>

        <section>
          <h3 style={{ margin: "10px 0 6px" }}>2. Your responsibility</h3>
          <div className="fineMuted">
            You are responsible for the accuracy of invoice data you enter and for ensuring your invoices comply with
            applicable laws, regulations, and tax requirements.
          </div>
        </section>

        <section>
          <h3 style={{ margin: "10px 0 6px" }}>3. Acceptable use</h3>
          <div className="fineMuted">
            You may not misuse the Service, including attempting to disrupt it, probe or exploit vulnerabilities, scrape
            it at scale, or use it for unlawful activity.
          </div>
        </section>

        <section>
          <h3 style={{ margin: "10px 0 6px" }}>4. Intellectual property</h3>
          <div className="fineMuted">
            The Service, its design, and branding are owned by {SITE.company}. You retain rights to the content you enter
            into invoices.
          </div>
        </section>

        <section>
          <h3 style={{ margin: "10px 0 6px" }}>5. Disclaimers</h3>
          <div className="fineMuted">
            The Service is provided “as-is” and “as-available” without warranties of any kind, including implied
            warranties of merchantability, fitness for a particular purpose, and non-infringement.
          </div>
        </section>

        <section>
          <h3 style={{ margin: "10px 0 6px" }}>6. Limitation of liability</h3>
          <div className="fineMuted">
            To the maximum extent permitted by law, {SITE.company} will not be liable for any indirect, incidental,
            special, consequential, or punitive damages, or any loss of profits or revenues, arising out of your use of
            the Service.
          </div>
        </section>

        <section>
          <h3 style={{ margin: "10px 0 6px" }}>7. Changes</h3>
          <div className="fineMuted">We may update the Service and these Terms from time to time.</div>
        </section>

        <section>
          <h3 style={{ margin: "10px 0 6px" }}>8. Contact</h3>
          <div className="fineMuted">
            Contact{" "}
            <a className="link" href={`mailto:${SITE.supportEmail}`}>
              {SITE.supportEmail}
            </a>
            .
          </div>
        </section>

        <div className="fineMuted">These Terms are provided for general informational purposes and are not legal advice.</div>
      </div>
    </div>
  );
}

