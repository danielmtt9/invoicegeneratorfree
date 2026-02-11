import { ANALYTICS, SITE } from "../shared/site";
import { getCookie, setCookie } from "./cookies";
import { randomId } from "./ids";

const ALLOWED_EVENTS = new Set(["page_view", "invoice_pdf_download"]);

export function isDoNotTrackEnabled() {
  return typeof navigator !== "undefined" && navigator.doNotTrack === "1";
}

export function analyticsAllowed() {
  if (isDoNotTrackEnabled()) return false;
  if (getCookie(ANALYTICS.optOutCookie) === "1") return false;
  return getCookie(ANALYTICS.consentCookie) === "1";
}

export function getOrCreateVisitorId() {
  const existing = getCookie(ANALYTICS.visitorIdCookie);
  if (existing && existing.length >= 12) return existing;
  const vid = randomId(28);
  setCookie(ANALYTICS.visitorIdCookie, vid, { days: 365, sameSite: "Lax", secure: true });
  return vid;
}

export async function track(event: string, meta?: Record<string, unknown>) {
  if (!ALLOWED_EVENTS.has(event)) return;
  if (!analyticsAllowed()) return;

  const vid = getOrCreateVisitorId();
  let refHost = "";
  if (document.referrer) {
    try {
      refHost = new URL(document.referrer).host;
    } catch {
      refHost = "";
    }
  }
  const payload = {
    event,
    path: location.pathname,
    referrer: refHost,
    vid,
    meta: meta ?? {}
  };

  // Keep minimal; rely on server timestamp.
  await fetch("/api/track.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload),
    keepalive: true
  }).catch(() => {});
}

export function pageView() {
  void track("page_view");
}

export function assertSiteHost() {
  // If you deploy to a different domain, update SITE.canonicalOrigin and PHP SITE_HOST.
  void SITE.domain;
}
