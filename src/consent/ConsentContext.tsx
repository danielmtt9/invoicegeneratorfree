import React, { createContext, useContext, useMemo, useState } from "react";
import { ANALYTICS } from "../shared/site";
import { deleteCookie, getCookie, setCookie } from "../lib/cookies";
import { isDoNotTrackEnabled } from "../lib/track";

type ConsentState = {
  analytics: "unknown" | "granted" | "denied" | "dnt";
  bannerOpen: boolean;
  settingsOpen: boolean;
  acceptAnalytics: () => void;
  denyAnalytics: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  closeBanner: () => void;
};

const Ctx = createContext<ConsentState | null>(null);

function inferAnalyticsState(): ConsentState["analytics"] {
  if (isDoNotTrackEnabled()) return "dnt";
  if (getCookie(ANALYTICS.optOutCookie) === "1") return "denied";
  if (getCookie(ANALYTICS.consentCookie) === "1") return "granted";
  return "unknown";
}

export function ConsentProvider(props: { children: React.ReactNode }) {
  const [analytics, setAnalytics] = useState<ConsentState["analytics"]>(() => inferAnalyticsState());
  const [bannerOpen, setBannerOpen] = useState(() => analytics === "unknown");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const api = useMemo<ConsentState>(() => {
    function acceptAnalytics() {
      deleteCookie(ANALYTICS.optOutCookie);
      setCookie(ANALYTICS.consentCookie, "1", { days: 365, sameSite: "Lax", secure: true });
      setAnalytics("granted");
      setBannerOpen(false);
      setSettingsOpen(false);
    }

    function denyAnalytics() {
      deleteCookie(ANALYTICS.consentCookie);
      setCookie(ANALYTICS.optOutCookie, "1", { days: 365, sameSite: "Lax", secure: true });
      setAnalytics(isDoNotTrackEnabled() ? "dnt" : "denied");
      setBannerOpen(false);
      setSettingsOpen(false);
    }

    return {
      analytics,
      bannerOpen,
      settingsOpen,
      acceptAnalytics,
      denyAnalytics,
      openSettings: () => setSettingsOpen(true),
      closeSettings: () => setSettingsOpen(false),
      closeBanner: () => setBannerOpen(false)
    };
  }, [analytics, bannerOpen, settingsOpen]);

  return <Ctx.Provider value={api}>{props.children}</Ctx.Provider>;
}

export function useConsent() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useConsent must be used within ConsentProvider");
  return v;
}

