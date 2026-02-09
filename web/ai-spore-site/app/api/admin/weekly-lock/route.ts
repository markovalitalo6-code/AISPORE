import { NextResponse } from "next/server";

type Entry = { userId: string; tickets: number };

export async function POST(req: Request) {
  try {
    const ADMIN_KEY = String(process.env.ADMIN_KEY ?? "").trim();
    if (!ADMIN_KEY) {
      return NextResponse.json(
        { error: "Missing ADMIN_KEY in web env (set in .env.local)" },
        { status: 500 }
      );
    }

    const API_BASE = String(process.env.API_BASE ?? "http://localhost:3100").replace(/\/+$/, "");

    const body = (await req.json()) as {
      week: string;
      seed: string;
      entries: Entry[];
    };

    if (!body?.week || !body?.seed || !Array.isArray(body?.entries)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // 1) Ask API to pick winner reproducibly
    const raffleRes = await fetch(`${API_BASE}/raffle/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seed: body.seed, entries: body.entries }),
    });

    if (!raffleRes.ok) {
      const text = await raffleRes.text().catch(() => "");
      return NextResponse.json(
        { error: "raffle/run failed", status: raffleRes.status, details: text },
        { status: 500 }
      );
    }

    const raffleJson = (await raffleRes.json()) as {
      winnerUserId: string | null;
      totalTickets: number;
    };

    // 2) Lock reward (admin-only)
    const lockRes = await fetch(`${API_BASE}/reward/lock`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": ADMIN_KEY,
      },
      body: JSON.stringify({
        week: body.week,
        seed: body.seed,
        entries: body.entries,
        winnerUserId: raffleJson.winnerUserId ?? "",
        totalTickets: raffleJson.totalTickets ?? 0,
      }),
    });

    if (!lockRes.ok) {
      const text = await lockRes.text().catch(() => "");
      return NextResponse.json(
        { error: "reward/lock failed", status: lockRes.status, details: text },
        { status: 500 }
      );
    }

    const locked = await lockRes.json();

    // 3) Readbacks for UI convenience
    const byId = locked?.id
      ? await fetch(`${API_BASE}/reward/${locked.id}`).then((r) => r.json()).catch(() => null)
      : null;

    const byWeek = await fetch(`${API_BASE}/reward/by-week/${body.week}`).then((r) => r.json()).catch(() => null);

    return NextResponse.json({ locked, byId, byWeek });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}

