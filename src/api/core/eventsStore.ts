import fs from "fs";
import path from "path";
import crypto from "crypto";

export type EventType = "tickets" | "draw" | "payout" | "treasury";

export type BaseEvent = {
  id: string;
  type: EventType;
  ts: number;          // event time (ms)
  createdAt: number;   // write time (ms)
};

export type AnyEvent = BaseEvent & Record<string, any>;

function genIdHex(bytes = 12) {
  return crypto.randomBytes(bytes).toString("hex");
}

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function fileFor(type: EventType) {
  // src/api/data/events/*.jsonl (local, append-only)
  return path.resolve(__dirname, `../data/events/${type}.jsonl`);
}

export const eventsStore = {
  append(type: EventType, payload: Record<string, any>) {
    const f = fileFor(type);
    ensureDir(path.dirname(f));

    const ev: AnyEvent = {
      id: genIdHex(12),
      type,
      ts: typeof payload.ts === "number" ? payload.ts : Date.now(),
      createdAt: Date.now(),
      ...payload,
    };

    fs.appendFileSync(f, JSON.stringify(ev) + "\n", "utf8");
    return ev;
  },

  tail(type: EventType, limit = 50) {
    const f = fileFor(type);
    if (!fs.existsSync(f)) return [];

    // simple tail: read all, slice (OK for v1)
    const lines = fs.readFileSync(f, "utf8").split("\n").filter(Boolean);
    const slice = lines.slice(Math.max(0, lines.length - limit));
    return slice.map((l) => JSON.parse(l));
  },
};
