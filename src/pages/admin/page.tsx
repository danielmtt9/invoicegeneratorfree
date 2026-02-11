import React, { useEffect, useMemo, useState } from "react";

type WindowKey = "24h" | "7d" | "30d";

type Summary = {
  window: WindowKey;
  total_events: number;
  page_views: number;
  unique_visitors: number;
  top_pages: Array<{ path: string; count: number }>;
  top_referrers: Array<{ referrer: string; count: number }>;
};

type RecentEvent = {
  ts: string;
  event: string;
  path: string;
  referrer: string;
  vid: string;
};

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return (await res.json()) as T;
}

export function AdminPage() {
  const [w, setW] = useState<WindowKey>("24h");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [recent, setRecent] = useState<RecentEvent[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const windowLabel = useMemo(() => ({ "24h": "Last 24 hours", "7d": "Last 7 days", "30d": "Last 30 days" }[w]), [w]);

  useEffect(() => {
    let alive = true;
    setBusy(true);
    setErr(null);
    Promise.all([
      getJSON<Summary>(`/admin-api/summary.php?window=${encodeURIComponent(w)}`),
      getJSON<RecentEvent[]>(`/admin-api/recent.php?window=${encodeURIComponent(w)}&limit=120`)
    ])
      .then(([s, r]) => {
        if (!alive) return;
        setSummary(s);
        setRecent(r);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setErr(e instanceof Error ? e.message : String(e));
        setSummary(null);
        setRecent(null);
      })
      .finally(() => {
        if (!alive) return;
        setBusy(false);
      });

    return () => {
      alive = false;
    };
  }, [w]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="panel">
        <div className="hd">
          <h2>{windowLabel}</h2>
        </div>
        <div className="bd">
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="btn" type="button" onClick={() => setW("24h")}>
                24h
              </button>
              <button className="btn" type="button" onClick={() => setW("7d")}>
                7d
              </button>
              <button className="btn" type="button" onClick={() => setW("30d")}>
                30d
              </button>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <a className="btn" href={`/admin-api/export.csv.php?window=${encodeURIComponent(w)}`}>
                Export CSV
              </a>
              <button
                className="btn danger"
                type="button"
                onClick={async () => {
                  setBusy(true);
                  setErr(null);
                  try {
                    await getJSON<{ deleted: number }>(`/admin-api/cleanup.php?run=1`);
                    // Refresh
                    const s = await getJSON<Summary>(`/admin-api/summary.php?window=${encodeURIComponent(w)}`);
                    const r = await getJSON<RecentEvent[]>(`/admin-api/recent.php?window=${encodeURIComponent(w)}&limit=120`);
                    setSummary(s);
                    setRecent(r);
                  } catch (e: unknown) {
                    setErr(e instanceof Error ? e.message : String(e));
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Run cleanup
              </button>
            </div>
          </div>

          {busy && <div className="fineMuted" style={{ marginTop: 10 }}>Loading…</div>}
          {err && <div className="fine" style={{ marginTop: 10, color: "var(--danger)" }}>{err}</div>}

          {summary && (
            <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
                <div className="panel" style={{ background: "var(--paper)" }}>
                  <div className="hd"><h2>Page views</h2></div>
                  <div className="bd"><div style={{ fontSize: 28, fontWeight: 700 }}>{summary.page_views}</div></div>
                </div>
                <div className="panel" style={{ background: "var(--paper)" }}>
                  <div className="hd"><h2>Unique visitors</h2></div>
                  <div className="bd"><div style={{ fontSize: 28, fontWeight: 700 }}>{summary.unique_visitors}</div></div>
                </div>
                <div className="panel" style={{ background: "var(--paper)" }}>
                  <div className="hd"><h2>Total events</h2></div>
                  <div className="bd"><div style={{ fontSize: 28, fontWeight: 700 }}>{summary.total_events}</div></div>
                </div>
              </div>

              <div className="grid">
                <div className="panel">
                  <div className="hd"><h2>Top pages</h2></div>
                  <div className="bd">
                    <table>
                      <thead><tr><th>Path</th><th className="num">Count</th></tr></thead>
                      <tbody>
                        {summary.top_pages.map((p) => (
                          <tr key={p.path}><td>{p.path}</td><td className="num">{p.count}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="panel">
                  <div className="hd"><h2>Top referrers</h2></div>
                  <div className="bd">
                    <table>
                      <thead><tr><th>Referrer</th><th className="num">Count</th></tr></thead>
                      <tbody>
                        {summary.top_referrers.map((r) => (
                          <tr key={r.referrer}><td>{r.referrer || "(direct)"}</td><td className="num">{r.count}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="panel">
        <div className="hd">
          <h2>Recent events</h2>
        </div>
        <div className="bd">
          {recent && (
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Event</th>
                    <th>Path</th>
                    <th>Referrer</th>
                    <th>VID</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((e, i) => (
                    <tr key={`${e.ts}-${i}`}>
                      <td style={{ whiteSpace: "nowrap" }}>{e.ts}</td>
                      <td>{e.event}</td>
                      <td>{e.path}</td>
                      <td>{e.referrer || "(direct)"}</td>
                      <td style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>{e.vid}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!recent && !busy && !err && <div className="fineMuted">No data yet.</div>}
        </div>
      </div>
    </div>
  );
}

