import React, { useEffect } from "react";
import { SITE } from "./site";
import { useConsent } from "../consent/ConsentContext";
import { pageView } from "../lib/track";

function A(props: { href: string; children: React.ReactNode }) {
  return (
    <a className="link" href={props.href}>
      {props.children}
    </a>
  );
}

export function SiteLayout(props: { title: string; children: React.ReactNode; showNavHome?: boolean }) {
  const consent = useConsent();

  useEffect(() => {
    pageView();
  }, []);

  return (
    <div className="shell">
      <header className="hdr">
        <div className="hdrInner">
          <a className="brand" href="/">
            <img className="brandMark" src="/brand/logo-mark.svg" alt="" aria-hidden="true" />
            <div className="brandText">
              <div className="brandName">{SITE.name}</div>
              <div className="brandTag">A product of {SITE.company}</div>
            </div>
          </a>
          <nav className="nav">
            {props.showNavHome !== false && (
              <>
                <A href="/invoice/">Invoice Builder</A>
                <A href="/faq/">FAQ</A>
                <A href="/privacy/">Privacy</A>
                <A href="/cookies/">Cookies</A>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="main">
        <div className="container">
          <h1 className="pageTitle">{props.title}</h1>
          {props.children}
        </div>
      </main>

      <footer className="ftr">
        <div className="ftrInner">
          <div className="ftrLeft">
            <div className="fine">
              Invoice Generator is a product of {SITE.company}. Support:{" "}
              <a className="link" href={`mailto:${SITE.supportEmail}`}>
                {SITE.supportEmail}
              </a>
              .
            </div>
            <div className="fineMuted">Free tool. No account required. PDF generated in your browser.</div>
          </div>
          <div className="ftrRight">
            <A href="/terms/">Terms</A>
            <A href="/legal/">Legal</A>
            <button className="linkBtn" type="button" onClick={consent.openSettings}>
              Cookie settings
            </button>
          </div>
        </div>
      </footer>

      <CookieBanner />
      <CookieSettingsModal />
    </div>
  );
}

function CookieBanner() {
  const consent = useConsent();
  if (consent.analytics === "dnt") return null;
  if (!consent.bannerOpen) return null;

  return (
    <div className="cookieBanner" role="dialog" aria-label="Cookie consent">
      <div className="cookieCard">
        <div className="cookieTitle">Analytics cookies</div>
        <div className="cookieText">
          We use a first-party analytics cookie to understand usage (page views and anonymous unique visitors). Accept to
          help improve the site.{" "}
          <a className="link" href="/cookies/">
            Learn more
          </a>
          .
        </div>
        <div className="cookieActions">
          <button className="btn" type="button" onClick={consent.denyAnalytics}>
            No thanks
          </button>
          <button className="btn primary" type="button" onClick={consent.acceptAnalytics}>
            Accept analytics
          </button>
        </div>
      </div>
    </div>
  );
}

function CookieSettingsModal() {
  const consent = useConsent();
  if (!consent.settingsOpen) return null;

  return (
    <div className="modalBackdrop" role="dialog" aria-modal="true" aria-label="Cookie settings">
      <div className="modalCard">
        <div className="modalHd">
          <div className="modalTitle">Cookie settings</div>
          <button className="iconBtn" type="button" onClick={consent.closeSettings} aria-label="Close">
            ×
          </button>
        </div>
        <div className="modalBd">
          <div className="settingRow">
            <div>
              <div className="settingName">Analytics</div>
              <div className="settingDesc">Helps us understand page views and anonymous unique visitors.</div>
            </div>
            <div className="settingActions">
              <button className="btn" type="button" onClick={consent.denyAnalytics}>
                Disable
              </button>
              <button className="btn primary" type="button" onClick={consent.acceptAnalytics}>
                Enable
              </button>
            </div>
          </div>
          <div className="fineMuted">
            Do Not Track is respected. Read our{" "}
            <a className="link" href="/privacy/">
              Privacy Policy
            </a>{" "}
            and{" "}
            <a className="link" href="/cookies/">
              Cookies Policy
            </a>
            .
          </div>
        </div>
      </div>
    </div>
  );
}
