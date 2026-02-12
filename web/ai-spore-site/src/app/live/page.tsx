"use client";

import { useEffect, useMemo, useState } from "react";

type Feed = {
  ok: boolean;
  week: string | null;
  latestTreasury: any | null;
  latestDraw: any | null;
  draws: any[];
  pendingPayouts: any[];
};

function short(id?: string) {
  if (!id) return "";
  return id.length <= 10 ? id : `${id.slice(0, 5)}…${id.slice(-4)}`;
}

function fmtTs(ms?: number) {
  if (!ms) return "—";
  const d = new Date(ms);
  return d.toLocaleString();
}

function tierLabel(draw: any): string {
  const t = Number(draw?.mcTier ?? draw?.mc ?? 0);
  if (!t) return "—";
  return `MC TIER ${t.toLocaleString()}`;
}

function glowClass(draw: any) {
  const t = Number(draw?.mcTier ?? draw?.mc ?? 0);
  if (t >= 40000) return "shadow-[0_0_40px_rgba(0,255,255,0.45)] border-cyan-300/50";
  if (t >= 20000) return "shadow-[0_0_36px_rgba(255,0,255,0.35)] border-fuchsia-300/50";
  if (t >= 12000) return "shadow-[0_0_34px_rgba(255,255,0,0.25)] border-yellow-300/50";
  if (t >= 8000)  return "shadow-[0_0_32px_rgba(0,255,0,0.22)] border-emerald-300/50";
  if (t >= 5000)  return "shadow-[0_0_28px_rgba(0,160,255,0.22)] border-sky-300/50";
  return "shadow-[0_0_24px_rgba(255,255,255,0.12)] border-white/15";
}

export default function LivePage() {
  const [week, setWeek] = useState("2026-W07");
  const [feed, setFeed] = useState<Feed | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setErr(null);
    try {
      const r = await fetch(`/api/public/feed?week=${encodeURIComponent(week)}`, { cache: "no-store" });
      if (!r.ok) {
        const txt = await r.text().catch(() => "");
        throw new Error(`feed failed: HTTP ${r.status}${txt ? ` — ${txt}` : ""}`);
      }
      const j = (await r.json()) as Feed;
      setFeed(j);
    } catch (e: any) {
      setErr(e?.message ?? String(e));
      setFeed(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [week]);

  const treasury = feed?.latestTreasury ?? null;
  const latest = feed?.latestDraw ?? null;

  const caps = latest?.caps ?? null;

  const headline = useMemo(() => {
    if (!latest) return { title: "No draw yet", sub: "Waiting for the first trigger…" };
    return {
      title: `Winner ${short(latest.winnerUserId)}`,
      sub: `${tierLabel(latest)} • ${fmtTs(latest.createdAt)}`
    };
  }, [latest]);

  return (
    <div className="min-h-screen bg-[#05060a] text-white">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(900px 500px at 20% 15%, rgba(0,255,180,0.20), transparent 60%)," +
            "radial-gradient(800px 500px at 80% 20%, rgba(255,0,255,0.18), transparent 60%)," +
            "radial-gradient(900px 600px at 50% 90%, rgba(0,120,255,0.16), transparent 60%)"
        }}
      />
      <div className="relative mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-xs tracking-[0.22em] text-white/60">AISPORE • LIVE FEED</div>
            <h1 className="mt-1 text-3xl md:text-4xl font-semibold">
              Launch Dashboard
            </h1>
            <div className="mt-1 text-sm text-white/65">
              Auto-refresh 5s • Public feed • Read-only
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-xs text-white/60">Week</div>
            <input
              value={week}
              onChange={(e) => setWeek(e.target.value)}
              className="w-36 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-white/30"
              placeholder="2026-W07"
            />
            <button
              onClick={() => load()}
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
            >
              Refresh
            </button>
          </div>
        </div>

        {err && (
          <div className="mt-5 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm">
            <div className="font-semibold text-red-200">Feed error</div>
            <div className="mt-1 text-red-200/80">{err}</div>
          </div>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-12">
          {/* Treasury */}
          <div className="md:col-span-4">
            <div className="rounded-2xl border border-white/15 bg-white/5 p-5 shadow-[0_0_24px_rgba(255,255,255,0.08)]">
              <div className="text-xs tracking-[0.22em] text-white/60">TREASURY</div>
              <div className="mt-3 text-3xl font-semibold">
                {treasury?.balanceSol != null ? `${Number(treasury.balanceSol).toFixed(2)} SOL` : "—"}
              </div>
              <div className="mt-1 text-sm text-white/60">
                {treasury?.note ? treasury.note : "Latest snapshot"}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="text-white/60 text-xs">MC (snapshot)</div>
                  <div className="mt-1 font-medium">{treasury?.mc ?? "—"}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="text-white/60 text-xs">Source</div>
                  <div className="mt-1 font-medium">{treasury?.source ?? "—"}</div>
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3 text-sm">
                <div className="text-white/60 text-xs">Daily cap status (from latest draw)</div>
                <div className="mt-1 flex flex-wrap gap-x-6 gap-y-1">
                  <span>Distributed24h: <span className="text-white/90">{caps?.distributed24h ?? "—"}</span></span>
                  <span>DailyCap: <span className="text-white/90">{caps?.dailyCap ?? "—"}</span></span>
                  <span>Remaining: <span className="text-white/90">{caps?.remainingDaily ?? "—"}</span></span>
                </div>
              </div>
            </div>
          </div>

          {/* Hero draw */}
          <div className="md:col-span-8">
            <div className={`rounded-2xl border bg-white/5 p-6 ${glowClass(latest)}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs tracking-[0.22em] text-white/60">LATEST DRAW</div>
                  <div className="mt-2 text-4xl font-semibold">{headline.title}</div>
                  <div className="mt-2 text-sm text-white/65">{headline.sub}</div>
                </div>

                <div className="rounded-xl border border-white/15 bg-black/25 px-4 py-3 text-sm">
                  <div className="text-white/60 text-xs">Payout</div>
                  <div className="mt-1 text-2xl font-semibold">
                    {latest?.payoutAmount != null ? `${Number(latest.payoutAmount).toFixed(3)} SOL` : "—"}
                  </div>
                  <div className="mt-1 text-xs text-white/60">
                    Tickets: <span className="text-white/85">{latest?.totalTickets ?? "—"}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3 text-sm">
                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="text-white/60 text-xs">Draw ID</div>
                  <div className="mt-1 font-medium">{short(latest?.id)}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="text-white/60 text-xs">Treasury Before</div>
                  <div className="mt-1 font-medium">{latest?.treasuryBefore ?? "—"}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="text-white/60 text-xs">Treasury After</div>
                  <div className="mt-1 font-medium">{latest?.treasuryAfter ?? "—"}</div>
                </div>
              </div>

              <div className="mt-5 text-xs text-white/55">
                {loading ? "Loading…" : feed ? `Draws: ${feed.draws?.length ?? 0} • Pending payouts: ${feed.pendingPayouts?.length ?? 0}` : "—"}
              </div>
            </div>
          </div>

          {/* Pending payouts */}
          <div className="md:col-span-6">
            <div className="rounded-2xl border border-white/15 bg-white/5 p-5">
              <div className="flex items-center justify-between">
                <div className="text-xs tracking-[0.22em] text-white/60">PENDING PAYOUTS</div>
                <div className="text-xs text-white/55">{feed?.pendingPayouts?.length ?? 0}</div>
              </div>
              <div className="mt-3 divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10 bg-black/20">
                {(feed?.pendingPayouts ?? []).slice(0, 10).map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between px-4 py-3 text-sm">
                    <div className="flex flex-col">
                      <div className="font-medium">User {short(p.userId)}</div>
                      <div className="text-xs text-white/55">Draw {short(p.drawId)} • {fmtTs(p.createdAt)}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{Number(p.amount ?? 0).toFixed(3)} SOL</div>
                      <div className="text-xs text-white/55">{p.status ?? "—"}</div>
                    </div>
                  </div>
                ))}
                {(feed?.pendingPayouts ?? []).length === 0 && (
                  <div className="px-4 py-6 text-sm text-white/55">No pending payouts.</div>
                )}
              </div>
            </div>
          </div>

          {/* Draw history */}
          <div className="md:col-span-6">
            <div className="rounded-2xl border border-white/15 bg-white/5 p-5">
              <div className="flex items-center justify-between">
                <div className="text-xs tracking-[0.22em] text-white/60">DRAW HISTORY</div>
                <div className="text-xs text-white/55">{feed?.draws?.length ?? 0}</div>
              </div>

              <div className="mt-3 divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10 bg-black/20">
                {(feed?.draws ?? []).map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between px-4 py-3 text-sm">
                    <div className="flex flex-col">
                      <div className="font-medium">{tierLabel(d)}</div>
                      <div className="text-xs text-white/55">
                        Winner {short(d.winnerUserId)} • {fmtTs(d.createdAt)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{short(d.id)}</div>
                      <div className="text-xs text-white/55">Tickets {d.totalTickets ?? "—"}</div>
                    </div>
                  </div>
                ))}
                {(feed?.draws ?? []).length === 0 && (
                  <div className="px-4 py-6 text-sm text-white/55">No draws yet.</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-xs text-white/40">
          AISPORE v1 — holding = participation (no staking / ROI language). This page is read-only.
        </div>
      </div>
    </div>
  );
}
