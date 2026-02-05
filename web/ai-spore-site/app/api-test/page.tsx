"use client";

import { useState } from "react";

type Health = { ok: boolean };
type TicketOut = {
  eligible: boolean;
  tickets: number;
  breakdown: { holdWeight: number; activityWeight: number; refWeight: number };
};
type RaffleResult = { winnerUserId: string | null; totalTickets: number };

type Entry = { userId: string; tickets: number };

export default function ApiTestPage() {
  const [health, setHealth] = useState<Health | null>(null);
  const [tickets, setTickets] = useState<TicketOut | null>(null);
  const [raffle, setRaffle] = useState<RaffleResult | null>(null);
  const [reveal, setReveal] = useState<{ userId: string; result: "WIN" | "LOSE" } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // demo-data
  const seed = "WEEK_1_SEED";
  const entries: Entry[] = [
    { userId: "A", tickets: 22 },
    { userId: "B", tickets: 32 },
  ];

  async function pingHealth() {
    try {
      setError(null);
      const res = await fetch("/api/health");
      const json = (await res.json()) as Health;
      setHealth(json);
    } catch (e: any) {
      setError(e?.message ?? "Health failed");
    }
  }

  async function calcTickets() {
    try {
      setError(null);
      const res = await fetch("/api/calc/tickets", {
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
      const json = (await res.json()) as TicketOut;
      setTickets(json);
    } catch (e: any) {
      setError(e?.message ?? "Calc failed");
    }
  }

  async function runRaffle() {
    try {
      setError(null);
      setReveal(null);
      const res = await fetch("/api/raffle/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seed, entries }),
      });
      const json = (await res.json()) as RaffleResult;
      setRaffle(json);
    } catch (e: any) {
      setError(e?.message ?? "Raffle failed");
    }
  }

  function openChest(userId: string) {
    if (!raffle?.winnerUserId) {
      setError("Run raffle first (no winner yet)");
      return;
    }
    const result: "WIN" | "LOSE" = userId === raffle.winnerUserId ? "WIN" : "LOSE";
    setReveal({ userId, result });
  }

  return (
    <main style={{ padding: 24, fontFamily: "monospace" }}>
      <h1 style={{ marginBottom: 12 }}>API Test</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center" }}>
        <span style={{ padding: "4px 10px", border: "1px solid #ddd", borderRadius: 999 }}>
          /api → localhost:3100
        </span>
        <span style={{ padding: "4px 10px", border: "1px solid #ddd", borderRadius: 999 }}>
          page: /api-test
        </span>
      </div>

      {/* 1) Health */}
      <section style={{ border: "1px solid #eee", borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>1) Health</div>
        <button
          onClick={pingHealth}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #111",
            background: "#111",
            color: "white",
            cursor: "pointer",
          }}
        >
          Ping Health
        </button>
        {health && (
          <pre style={{ marginTop: 12, background: "#f7f7f7", padding: 12, borderRadius: 10 }}>
            {JSON.stringify(health, null, 2)}
          </pre>
        )}
      </section>

      {/* 2) Calc Tickets */}
      <section style={{ border: "1px solid #eee", borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>2) Calc Tickets</div>
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>
          payload: 500k avg, games=5, tierMin=1000, base=10
        </div>
        <button
          onClick={calcTickets}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #111",
            background: "#111",
            color: "white",
            cursor: "pointer",
          }}
        >
          Calc Tickets
        </button>
        {tickets && (
          <pre style={{ marginTop: 12, background: "#f7f7f7", padding: 12, borderRadius: 10 }}>
            {JSON.stringify(tickets, null, 2)}
          </pre>
        )}
      </section>

      {/* 3) Run Raffle */}
      <section style={{ border: "1px solid #eee", borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>3) Run Raffle</div>
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>
          seed={seed}, A=22, B=32
        </div>
        <button
          onClick={runRaffle}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #111",
            background: "#111",
            color: "white",
            cursor: "pointer",
          }}
        >
          Run Raffle
        </button>
        {raffle && (
          <pre style={{ marginTop: 12, background: "#f7f7f7", padding: 12, borderRadius: 10 }}>
            {JSON.stringify(raffle, null, 2)}
          </pre>
        )}
      </section>

      {/* A) Chest Reveal (UI) */}
      <section style={{ border: "1px solid #eee", borderRadius: 12, padding: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>A) Chest Reveal (UI)</div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
          <button
            onClick={() => openChest("A")}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #ddd",
              background: "white",
              cursor: "pointer",
            }}
          >
            Open Chest (User A)
          </button>
          <button
            onClick={() => openChest("B")}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #ddd",
              background: "white",
              cursor: "pointer",
            }}
          >
            Open Chest (User B)
          </button>
        </div>

        {reveal && (
          <div
            style={{
              padding: 12,
              borderRadius: 10,
              border: "1px solid #ddd",
              background: reveal.result === "WIN" ? "#f0fff4" : "#fff5f5",
            }}
          >
            <div style={{ fontWeight: 700 }}>
              {reveal.userId} → {reveal.result === "WIN" ? "✅ WIN" : "❌ LOSE"}
            </div>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
              (winnerUserId = {raffle?.winnerUserId ?? "null"})
            </div>
          </div>
        )}
      </section>

      {error && (
        <pre style={{ color: "red", marginTop: 16 }}>
          ERROR: {error}
        </pre>
      )}
    </main>
  );
}

