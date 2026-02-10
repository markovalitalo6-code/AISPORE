import React, { useEffect, useMemo, useState } from "react";

function isoWeekString(d = new Date()) {
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
};

export default function ChestPage() {
  const defaultWeek = useMemo(() => isoWeekString(), []);
  const [week, setWeek] = useState(defaultWeek);
  const [record, setRecord] = useState<RewardLockRecord | null>(null);
  const [status, setStatus] = useState<"idle"|"loading"|"locked"|"not_locked"|"error">("idle");
  const [err, setErr] = useState<string | null>(null);
  const [opened, setOpened] = useState(false);

  async function load() {
    setStatus("loading");
    setErr(null);
    setOpened(false);
    try {
      const r = await fetch(`/api/reward/by-week/${encodeURIComponent(week)}`);
      if (r.status === 404) {
        setRecord(null);
        setStatus("not_locked");
        return;
      }
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const json = (await r.json()) as RewardLockRecord;
      setRecord(json);
      setStatus("locked");
    } catch (e: any) {
      setRecord(null);
      setStatus("error");
      setErr(e?.message ?? String(e));
    }
  }

  useEffect(() => { load(); }, []);

  const banner = (() => {
    if (status === "loading") return { text: "Loading…", tone: "#666" };
    if (status === "locked") return { text: "LOCKED ✅ Winner ready", tone: "#0a7a32" };
    if (status === "not_locked") return { text: "NOT LOCKED (yet) ⏳", tone: "#a16207" };
    if (status === "error") return { text: "ERROR", tone: "#b91c1c" };
    return { text: "—", tone: "#666" };
  })();

  return (
    <div style={{ fontFamily: "ui-sans-serif, system-ui", padding: 24, maxWidth: 920, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, marginBottom: 6 }}>AISPORE — Chest / Event</h1>
      <div style={{ marginBottom: 16, padding: "10px 12px", borderRadius: 12, border: "1px solid #e5e5e5" }}>
        <b style={{ color: banner.tone }}>{banner.text}</b>
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
          disabled={status === "loading"}
          style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #ddd", cursor: "pointer" }}
        >
          {status === "loading" ? "Loading…" : "Refresh"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ padding: 16, borderRadius: 16, border: "1px solid #e5e5e5", background: "#fafafa" }}>
          <h2 style={{ marginTop: 0, fontSize: 18 }}>Chest</h2>
          <div
            style={{
              height: 220,
              borderRadius: 18,
              border: "1px solid #e5e5e5",
              background: opened ? "#fef3c7" : "#111827",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: opened ? "#111827" : "#f9fafb",
              fontSize: 18
            }}
          >
            {opened ? (record ? `WINNER: ${record.winnerUserId}` : "No lock yet") : "CLOSED CHEST"}
          </div>

          <button
            onClick={() => setOpened(true)}
            disabled={status !== "locked"}
            style={{
              marginTop: 12,
              width: "100%",
              padding: "10px 12px",
              borderRadius: 14,
              border: "1px solid #ddd",
              cursor: status === "locked" ? "pointer" : "not-allowed",
              opacity: status === "locked" ? 1 : 0.5
            }}
          >
            Open chest (read-only)
          </button>

          <div style={{ marginTop: 10, fontSize: 13, opacity: 0.7 }}>
            This page does not lock anything. It only reads public by-week.
          </div>
        </div>

        <div style={{ padding: 16, borderRadius: 16, border: "1px solid #e5e5e5", background: "#fff" }}>
          <h2 style={{ marginTop: 0, fontSize: 18 }}>Public lock details</h2>

          {err && (
            <div style={{ padding: 12, borderRadius: 12, border: "1px solid #f5c2c7", background: "#fff5f5", marginBottom: 12 }}>
              <b>Error:</b> {err}
            </div>
          )}

          {!record ? (
            <div style={{ opacity: 0.75 }}>No record loaded.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", rowGap: 10, columnGap: 14 }}>
              <div style={{ opacity: 0.7 }}>week</div><div><b>{record.week}</b></div>
              <div style={{ opacity: 0.7 }}>id</div><div><code>{record.id}</code></div>
              <div style={{ opacity: 0.7 }}>entriesHash</div><div><code>{record.entriesHash}</code></div>
              <div style={{ opacity: 0.7 }}>winnerUserId</div><div><b>{record.winnerUserId}</b></div>
              <div style={{ opacity: 0.7 }}>createdAt</div><div><code>{record.createdAt ?? "(n/a)"}</code></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
