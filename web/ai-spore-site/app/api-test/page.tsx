"use client";

import { useMemo, useState } from "react";

type AnyJson = any;

export default function ApiTestPage() {
  const [health, setHealth] = useState<AnyJson>(null);
  const [tickets, setTickets] = useState<AnyJson>(null);
  const [locked, setLocked] = useState<AnyJson>(null);
  const [byWeek, setByWeek] = useState<AnyJson>(null);
  const [raffle, setRaffle] = useState<AnyJson>(null);
  const [error, setError] = useState<string | null>(null);

  // Admin key (dev only). This is fine for local dev; later move to env/secure flow.
  const [adminKey, setAdminKey] = useState<string>("dev_admin");

  // Use Next rewrite proxy: /api/* -> http://localhost:3100/*
  const API = useMemo(() => "/api", []);

  const btn =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 font-semibold shadow-sm border border-black/10 bg-black text-white hover:opacity-90 active:opacity-80 transition";
  const btn2 =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 font-semibold shadow-sm border border-black/10 bg-white text-black hover:bg-black/5 active:bg-black/10 transition";
  const box =
    "rounded-xl border border-black/10 bg-white p-3 shadow-sm overflow-auto";

  async function pingHealth() {
    try {
      setError(null);
      const res = await fetch(`${API}/health`);
      const json = await res.json();
      setHealth(json);
    } catch (e: any) {
      setError(e?.message ?? "Health failed");
    }
  }

  async function calcTickets() {
    try {
      setError(null);
      const res = await fetch(`${API}/calc/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userAvgTokens7d: 500000,
          games7d: 5,
          activeRefs: 0,
          tierMinTokens: 1000,
          baseTickets: 10,
          bronzeMinTokens: 1000,
        }),
      });
      const json = await res.json();
      setTickets(json);
    } catch (e: any) {
      setError(e?.message ?? "Calc failed");
    }
  }

  async function lockWeekUI() {
    try {
      setError(null);
      const payload = {
        week: "WEEK_UI",
        seed: "WEEK_UI_SEED",
        entries: [
          { userId: "A", tickets: 1 },
          { userId: "B", tickets: 2 },
        ],
        winnerUserId: "A",
        totalTickets: 3,
      };

      const res = await fetch(`${API}/reward/lock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      setLocked(json);
    } catch (e: any) {
      setError(e?.message ?? "Lock failed");
    }
  }

  async function getByWeekUI() {
    try {
      setError(null);
      const res = await fetch(`${API}/reward/by-week/WEEK_UI`);
      const json = await res.json();
      setByWeek(json);
    } catch (e: any) {
      setError(e?.message ?? "By-week failed");
    }
  }

  async function runRaffle() {
    try {
      setError(null);
      const res = await fetch(`${API}/raffle/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seed: "WEEK_UI_SEED",
          entries: [
            { userId: "A", tickets: 22 },
            { userId: "B", tickets: 32 },
          ],
        }),
      });
      const json = await res.json();
      setRaffle(json);
    } catch (e: any) {
      setError(e?.message ?? "Raffle failed");
    }
  }

  return (
    <main style={{ padding: 24, fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>API Test</h1>
        <p style={{ opacity: 0.8, marginTop: 0 }}>
          Web → <code>/api/*</code> proxy → API (3100)
        </p>

        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr" }}>
          <div className={box}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <button className={btn2} onClick={pingHealth}>Ping Health</button>
              <button className={btn2} onClick={calcTickets}>Calc Tickets</button>
              <button className={btn2} onClick={runRaffle}>Run Raffle</button>
            </div>
          </div>

          <div className={box}>
            <h2 style={{ margin: "0 0 10px 0", fontSize: 16, fontWeight: 800 }}>
              Admin (dev)
            </h2>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontWeight: 700, opacity: 0.7 }}>x-admin-key</span>
                <input
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(0,0,0,0.12)",
                    minWidth: 220,
                  }}
                />
              </label>

              <button className={btn} onClick={lockWeekUI}>Lock WEEK_UI</button>
              <button className={btn2} onClick={getByWeekUI}>Get by-week WEEK_UI</button>
            </div>
          </div>

          {error && (
            <div className={box} style={{ borderColor: "rgba(255,0,0,0.25)" }}>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>ERROR</div>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{error}</pre>
            </div>
          )}

          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 1fr" }}>
            <div className={box}>
              <div style={{ fontWeight: 800, marginBottom: 8 }}>health</div>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                {health ? JSON.stringify(health, null, 2) : "(empty)"}
              </pre>
            </div>

            <div className={box}>
              <div style={{ fontWeight: 800, marginBottom: 8 }}>tickets</div>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                {tickets ? JSON.stringify(tickets, null, 2) : "(empty)"}
              </pre>
            </div>

            <div className={box}>
              <div style={{ fontWeight: 800, marginBottom: 8 }}>raffle</div>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                {raffle ? JSON.stringify(raffle, null, 2) : "(empty)"}
              </pre>
            </div>

            <div className={box}>
              <div style={{ fontWeight: 800, marginBottom: 8 }}>locked</div>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                {locked ? JSON.stringify(locked, null, 2) : "(empty)"}
              </pre>
            </div>

            <div className={box} style={{ gridColumn: "1 / -1" }}>
              <div style={{ fontWeight: 800, marginBottom: 8 }}>by-week</div>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                {byWeek ? JSON.stringify(byWeek, null, 2) : "(empty)"}
              </pre>
            </div>
          </div>
        </div>

        <style jsx global>{`
          body { background: #f6f7f9; }
          code { background: rgba(0,0,0,0.06); padding: 2px 6px; border-radius: 8px; }
          button { cursor: pointer; }
        `}</style>
      </div>
    </main>
  );
}

