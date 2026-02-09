import crypto from "node:crypto";

type Entry = { userId: string; tickets: number };

type LockBody = {
  week: string;
  seed: string;
  entries: Entry[];
  winnerUserId: string;
  totalTickets: number;
};

async function main() {
  const API_BASE = (process.env.API_BASE ?? "http://localhost:3100").replace(/\/+$/, "");
  const ADMIN_KEY = String(process.env.ADMIN_KEY ?? "").trim();

  if (!ADMIN_KEY) {
    console.error("RUN FAILED: Missing ADMIN_KEY env. Example: ADMIN_KEY=dev_admin pnpm exec ts-node scripts/run_weekly_lock.ts");
    process.exit(1);
  }

  // NOTE: v1 test data (replace later with real weekly inputs)
  const week = process.env.WEEK ?? "WEEK_1";
  const seed = process.env.SEED ?? "WEEK_1_SEED";
  const entries: Entry[] = [
    { userId: "A", tickets: 22 },
    { userId: "B", tickets: 32 },
  ];

  const totalTickets = entries.reduce((sum, e) => sum + Number(e.tickets || 0), 0);

  // v1: reproducible winner from seed + entries (same logic as /raffle/run should use)
  // For now we just call /raffle/run to keep single source of truth in API.
  const raffleRes = await fetch(`${API_BASE}/raffle/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ seed, entries }),
  });

  if (!raffleRes.ok) {
    const text = await raffleRes.text().catch(() => "");
    throw new Error(`raffle/run failed: ${raffleRes.status} ${text}`);
  }

  const raffleJson = (await raffleRes.json()) as { winnerUserId: string | null; totalTickets: number };

  const body: LockBody = {
    week,
    seed,
    entries,
    winnerUserId: raffleJson.winnerUserId ?? "",
    totalTickets: raffleJson.totalTickets ?? totalTickets,
  };

  // Optional: helpful local hash for logging (API stores its own entriesHash anyway)
  const entriesHash = crypto.createHash("sha256").update(JSON.stringify(entries)).digest("hex");

  const lockRes = await fetch(`${API_BASE}/reward/lock`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": ADMIN_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!lockRes.ok) {
    const text = await lockRes.text().catch(() => "");
    throw new Error(`reward/lock failed: ${lockRes.status} ${text}`);
  }

  const locked = await lockRes.json();

  console.log("=== WEEKLY LOCK DONE ===");
  console.log(JSON.stringify({ ...locked, localEntriesHash: entriesHash }, null, 2));

  // Also show readbacks
  const id = locked?.id;
  if (id) {
    const byId = await fetch(`${API_BASE}/reward/${id}`).then((r) => r.json()).catch(() => null);
    console.log("=== READBACK BY ID ===");
    console.log(JSON.stringify(byId, null, 2));
  }

  const byWeek = await fetch(`${API_BASE}/reward/by-week/${week}`).then((r) => r.json()).catch(() => null);
  console.log("=== READBACK BY WEEK ===");
  console.log(JSON.stringify(byWeek, null, 2));
}

main().catch((err: any) => {
  console.error("RUN FAILED:", err?.message ?? err);
  process.exit(1);
});

