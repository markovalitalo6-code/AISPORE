import React, { useEffect, useMemo, useState } from "react";

function isoWeekString(d = new Date()) {
  // ISO week: https://en.wikipedia.org/wiki/ISO_week_date
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  const year = date.getUTCFullYear();
  const ww = String(weekNo).padStart(2, "0");
  return `${year}-W${ww}`;
}

type RewardLockRecord = {
  id: string;
  week: string;
  entriesHash: string;
  winnerUserId: string;
  seed?: string;
  createdAt?: string;
  meta?: any;
};

export default function DrawPage() {
  const defaultWeek = useMemo(() => isoWeekString(), []);
  const [week, setWeek] = useState(defaultWeek);
  const [health, setHealth] = useState<string>("(loading)");
  const [data, setData] = useState<RewardLockRecord | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      // Health (optional, but helps confirm wiring)
      const h = await fetch("/api/health");
      setHealth(h.ok ? "OK" : `HTTP ${h.status}`);

      // Readback by week (public)
      const r = await fetch(`/api/reward/by-week/${encodeURIComponent(week)}`);
      if (!r.ok) {
        const txt = await r.text().catch(() => "");
        throw new Error(`by-week failed: HTTP ${r.status}${txt ? ` — ${txt}` : ""}`);
      }
      const json = (await r.json()) as RewardLockRecord;
      setData(json);
    } catch (e: any) {
      setData(null);
      setErr(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* once */ }, []);

  return (
    <div style={{ fontFamily: "ui-sans-serif, system-ui", padding: 24, maxWidth: 920, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, marginBottom: 6 }}>AISPORE — Draw State</h1>
      <div style={{ opacity: 0.75, marginBottom: 18 }}>
        Public readback view (no admin actions). API health: <b>{health}</b>
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 18, flexWrap: "wrap" }}>
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ opacity: 0.8 }}>Week</span>
          <input
            value={week}
            onChange={(e) => setWeek(e.target.value)}
            placeholder="2026-W09"
            style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", minWidth: 140 }}
          />
        </label>
        <button
          onClick={load}
          disabled={loading}
          style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #ddd", cursor: "pointer" }}
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
        <span style={{ opacity: 0.7 }}>Default: {defaultWeek}</span>
      </div>

      {err && (
        <div style={{ padding: 14, borderRadius: 12, border: "1px solid #f5c2c7", background: "#fff5f5", marginBottom: 18 }}>
          <b>Error:</b> {err}
        </div>
      )}

      <div style={{ padding: 16, borderRadius: 14, border: "1px solid #e5e5e5", background: "#fafafa" }}>
        <h2 style={{ fontSize: 18, marginTop: 0 }}>Locked record</h2>
        {!data ? (
          <div style={{ opacity: 0.75 }}>No record loaded yet.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", rowGap: 10, columnGap: 14 }}>
            <div style={{ opacity: 0.7 }}>week</div><div><b>{data.week}</b></div>
            <div style={{ opacity: 0.7 }}>id</div><div><code>{data.id}</code></div>
            <div style={{ opacity: 0.7 }}>entriesHash</div><div><code>{data.entriesHash}</code></div>
            <div style={{ opacity: 0.7 }}>winnerUserId</div><div><b>{data.winnerUserId}</b></div>
            <div style={{ opacity: 0.7 }}>createdAt</div><div><code>{data.createdAt ?? "(n/a)"}</code></div>
            <div style={{ opacity: 0.7 }}>seed (public)</div><div><code>{data.seed ?? "(n/a)"}</code></div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 18, opacity: 0.7, fontSize: 13 }}>
        Note: This page only reads public endpoints. It does not run raffle or lock.
      </div>
    </div>
  );
}
