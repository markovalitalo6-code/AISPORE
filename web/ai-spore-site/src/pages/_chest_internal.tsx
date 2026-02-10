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

type Phase = "closed" | "opening" | "opened";

export default function ChestPage() {
  const defaultWeek = useMemo(() => isoWeekString(), []);
  const [week, setWeek] = useState(defaultWeek);
  const [record, setRecord] = useState<RewardLockRecord | null>(null);
  const [status, setStatus] = useState<"idle"|"loading"|"locked"|"not_locked"|"error">("idle");
  const [err, setErr] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("closed");

  async function load() {
    setStatus("loading");
    setErr(null);
    setPhase("closed");
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

  function openChest() {
    if (status !== "locked") return;
    if (phase === "opened" || phase === "opening") return;
    setPhase("opening");
    window.setTimeout(() => setPhase("opened"), 950);
  }

  const banner = (() => {
    if (status === "loading") return { text: "Loading…", tone: "#666" };
    if (status === "locked") return { text: "LOCKED ✅ Winner ready", tone: "#0a7a32" };
    if (status === "not_locked") return { text: "NOT LOCKED (yet) ⏳", tone: "#a16207" };
    if (status === "error") return { text: "ERROR", tone: "#b91c1c" };
    return { text: "—", tone: "#666" };
  })();

  const canOpen = status === "locked";

  return (
    <div style={{ fontFamily: "ui-sans-serif, system-ui", padding: 24, maxWidth: 920, margin: "0 auto" }}>
      <style jsx global>{`
        @keyframes lidOpen {
          0%   { transform: translate(-50%, -100%) rotateX(0deg); }
          100% { transform: translate(-50%, -100%) rotateX(70deg); }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.25; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.55; transform: translate(-50%, -50%) scale(1.05); }
        }
        @keyframes popIn {
          0% { opacity: 0; transform: translateY(10px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

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

          {/* Chest stage */}
          <div
            style={{
              height: 240,
              borderRadius: 18,
              border: "1px solid #e5e5e5",
              background: "#0b1220",
              position: "relative",
              overflow: "hidden"
            }}
          >
            {/* Glow when locked */}
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: 260,
                height: 260,
                borderRadius: 260,
                background: canOpen ? "#fbbf24" : "#94a3b8",
                filter: "blur(40px)",
                transform: "translate(-50%, -50%)",
                opacity: canOpen ? 0.35 : 0.15,
                animation: canOpen ? "glowPulse 1.6s ease-in-out infinite" : "none"
              }}
            />

            {/* Base */}
            <div
              style={{
                position: "absolute",
                left: "50%",
                bottom: 54,
                width: 280,
                height: 110,
                transform: "translateX(-50%)",
                borderRadius: 18,
                background: "#111827",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 14px 30px rgba(0,0,0,0.35)"
              }}
            />

            {/* Lid */}
            <div
              style={{
                position: "absolute",
                left: "50%",
                bottom: 164,
                width: 280,
                height: 70,
                transform: "translate(-50%, -100%) rotateX(0deg)",
                transformOrigin: "50% 100%",
                borderRadius: 18,
                background: "#0f172a",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 10px 18px rgba(0,0,0,0.35)",
                animation: phase === "opening" ? "lidOpen 0.9s ease-out forwards" : "none"
              }}
            />

            {/* Content */}
            <div
              style={{
                position: "absolute",
                left: "50%",
                bottom: 88,
                transform: "translateX(-50%)",
                color: "#f9fafb",
                textAlign: "center",
                width: "80%"
              }}
            >
              {phase === "closed" && (
                <div style={{ opacity: 0.9 }}>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>CLOSED</div>
                  <div style={{ fontSize: 13, opacity: 0.7, marginTop: 6 }}>
                    {canOpen ? "Winner is ready — open the chest." : "Waiting for weekly lock."}
                  </div>
                </div>
              )}

              {phase === "opening" && (
                <div style={{ opacity: 0.9 }}>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>OPENING…</div>
                  <div style={{ fontSize: 13, opacity: 0.7, marginTop: 6 }}>Revealing…</div>
                </div>
              )}

              {phase === "opened" && (
                <div style={{ animation: "popIn 0.25s ease-out" }}>
                  <div style={{ fontSize: 13, opacity: 0.8 }}>WINNER</div>
                  <div style={{ fontSize: 26, fontWeight: 900, marginTop: 4 }}>
                    {record ? record.winnerUserId : "—"}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
                    (read-only from public by-week)
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={openChest}
            disabled={!canOpen}
            style={{
              marginTop: 12,
              width: "100%",
              padding: "10px 12px",
              borderRadius: 14,
              border: "1px solid #ddd",
              cursor: canOpen ? "pointer" : "not-allowed",
              opacity: canOpen ? 1 : 0.5,
              fontWeight: 700
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
