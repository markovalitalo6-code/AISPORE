
import { audit } from "./audit";

type TicketRow = { tgId: number; score: number; last: number; username?: string };
const db = new Map<number, TicketRow>();

export function upsertUser(tgId: number, username?: string){
  const row = db.get(tgId) || { tgId, score: 0, last: 0, username };
  if (username) row.username = username;
  db.set(tgId, row);
  return row;
}

export function addTickets(tgId: number, delta: number, reason: string){
  const row = upsertUser(tgId);
  row.score += Math.max(0, Math.floor(delta));
  row.last = Date.now();
  db.set(tgId, row);
  audit(`TICKETS tg=${tgId} +${delta} reason=${reason} total=${row.score}`);
  return row;
}

export function getTickets(tgId: number){
  return upsertUser(tgId);
}

export function topTickets(limit = 20){
  return Array.from(db.values()).sort((a,b)=>b.score-a.score).slice(0, limit);
}
