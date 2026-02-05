const API = process.env.API_URL ?? "http://localhost:3100";

type Entry = { userId: string; tickets: number };

async function main() {
  const week = process.env.WEEK ?? "WEEK_1";
  const seed = process.env.SEED ?? "WEEK_1_SEED";

  // MVP: test entries (myöhemmin: snapshot->tickets pipeline)
  const entries: Entry[] = [
    { userId: "A", tickets: 22 },
    { userId: "B", tickets: 32 },
  ];

  // first compute winner via API raffle endpoint (single source in API)
  const raffleRes = await fetch(`${API}/raffle/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ seed, entries }),
  });

  if (!raffleRes.ok) {
    const t = await raffleRes.text();
    throw new Error(`raffle/run failed: ${raffleRes.status} ${t}`);
  }

  const raffle = (await raffleRes.json()) as {
    winnerUserId: string | null;
    totalTickets: number;
  };

  // lock it
  const lockRes = await fetch(`${API}/reward/lock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      week,
      seed,
      entries,
      winnerUserId: raffle.winnerUserId,
      totalTickets: raffle.totalTickets,
    }),
  });

  if (!lockRes.ok) {
    const t = await lockRes.text();
    throw new Error(`reward/lock failed: ${lockRes.status} ${t}`);
  }

  const locked = await lockRes.json();
  console.log("=== WEEKLY LOCK DONE ===");
  console.log(JSON.stringify(locked, null, 2));
}

main().catch((e) => {
  console.error("RUN FAILED:", e?.message ?? e);
  process.exit(1);
});

