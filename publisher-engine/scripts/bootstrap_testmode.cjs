const fs = require("fs");
const path = require("path");

function ensureDir(p){ fs.mkdirSync(p, { recursive: true }); }
function writeIfMissing(p, content){
  if (fs.existsSync(p)) return;
  fs.writeFileSync(p, content, "utf8");
  console.log("created", p);
}
function patchFile(p, fn){
  const s0 = fs.readFileSync(p,"utf8");
  const s1 = fn(s0);
  if (s1 !== s0){
    const bak = p + ".BAK_" + Date.now();
    fs.writeFileSync(bak, s0, "utf8");
    fs.writeFileSync(p, s1, "utf8");
    console.log("patched", p, "bak", bak);
  } else {
    console.log("nochange", p);
  }
}

const root = process.cwd();
ensureDir(path.join(root, "src/services/testmode"));
ensureDir(path.join(root, "exports"));

writeIfMissing("src/services/testmode/state.ts", `
export type TestModeState = {
  enabled: boolean;
  currentEventId: number;
  lastOpenAt: number;
};

const state: TestModeState = {
  enabled: false,
  currentEventId: 0,
  lastOpenAt: 0,
};

export function isTestMode(){ return state.enabled; }
export function setTestMode(v: boolean){ state.enabled = v; }
export function getEventId(){ return state.currentEventId; }
export function bumpEvent(){ state.currentEventId += 1; state.lastOpenAt = Date.now(); return state.currentEventId; }
export function getLastOpenAt(){ return state.lastOpenAt; }
`);

writeIfMissing("src/services/testmode/audit.ts", `
import fs from "fs";
import path from "path";

const outDir = path.resolve(process.cwd(), "exports");
function fileName(){
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const day = String(d.getDate()).padStart(2,"0");
  return path.join(outDir, \`audit_\${y}-\${m}-\${day}.log\`);
}

export function audit(line: string){
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.appendFileSync(fileName(), line + "\\n", "utf8");
}
`);

writeIfMissing("src/services/testmode/tickets.ts", `
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
  audit(\`TICKETS tg=\${tgId} +\${delta} reason=\${reason} total=\${row.score}\`);
  return row;
}

export function getTickets(tgId: number){
  return upsertUser(tgId);
}

export function topTickets(limit = 20){
  return Array.from(db.values()).sort((a,b)=>b.score-a.score).slice(0, limit);
}
`);

writeIfMissing("src/services/testmode/chest.ts", `
import fs from "fs";
import path from "path";
import { audit } from "./audit";
import { topTickets } from "./tickets";

export type Winner = { tgId: number; username?: string; weight: number; prize: string };

function pickWeighted(items: {tgId:number; username?:string; weight:number}[], count: number){
  const picked: Winner[] = [];
  const pool = items.slice();
  for (let i=0; i<count && pool.length; i++){
    const sum = pool.reduce((a,b)=>a + Math.max(0,b.weight), 0);
    if (sum <= 0) break;
    let r = Math.random() * sum;
    let idx = 0;
    for (; idx<pool.length; idx++){
      r -= Math.max(0, pool[idx].weight);
      if (r <= 0) break;
    }
    const w = pool.splice(Math.min(idx, pool.length-1), 1)[0];
    picked.push({ tgId: w.tgId, username: w.username, weight: w.weight, prize: "" });
  }
  return picked;
}

function outFile(eventId: number){
  const outDir = path.resolve(process.cwd(), "exports");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  return path.join(outDir, \`winners_event_\${eventId}.json\`);
}

export function runChestDraw(eventId: number){
  const top = topTickets(200);
  const candidates = top.map(x => ({ tgId: x.tgId, username: x.username, weight: Math.max(1, Math.floor(x.score)) }));
  const winners = pickWeighted(candidates, 3);

  const prizes = ["ROLE: Sporescout", "STATUS: Founding Aura", "TICKET: Bonus Entry"];
  winners.forEach((w,i)=> w.prize = prizes[i] || "STATUS");

  fs.writeFileSync(outFile(eventId), JSON.stringify({ eventId, winners, at: Date.now() }, null, 2), "utf8");
  audit(\`CHEST event=\${eventId} winners=\${winners.map(w=>w.tgId).join(",")}\`);
  return winners;
}
`);

writeIfMissing("src/services/testmode/ai.ts", `
export type AIDecision = {
  allowOpen: boolean;
  reason: string;
};

export function aiGateOpen(): AIDecision {
  // Stub: myöhemmin LLM + signals.
  return { allowOpen: true, reason: "testmode stub allow" };
}
`);

const handler = "src/channels/telegram/handler.ts";
if (fs.existsSync(handler)){
  patchFile(handler, (s) => {
    if (!s.includes("AISPORE_TESTMODE_V1")){
      s = s.replace(/(const\\s+FOUNDING_GROUP_ID\\s*=\\s*process\\.env\\.TELEGRAM_CHAT_ID;)/m,
        `$1\n\n// AISPORE_TESTMODE_V1\nimport { isTestMode, setTestMode, bumpEvent } from "../../services/testmode/state";\nimport { addTickets, getTickets, topTickets } from "../../services/testmode/tickets";\nimport { runChestDraw } from "../../services/testmode/chest";\nimport { aiGateOpen } from "../../services/testmode/ai";\n`
      );
    }

    if (!s.includes('bot.command("testmode_on"')){
      s = s.replace(/bot\\.command\\("status"[\\s\\S]*?\\}\\);/m, (m)=> m + `\n\n  bot.command("testmode_on", async (ctx)=>{\n    if (ctx.chat?.type !== "private") return;\n    const uid = String(ctx.from?.id || "");\n    const owner = String(process.env.OWNER_TELEGRAM_ID || "");\n    if (!owner || uid !== owner) { await ctx.reply("⛔ admin only"); return; }\n    setTestMode(true);\n    await ctx.reply("✅ Test mode enabled");\n  });\n\n  bot.command("testmode_off", async (ctx)=>{\n    if (ctx.chat?.type !== "private") return;\n    const uid = String(ctx.from?.id || "");\n    const owner = String(process.env.OWNER_TELEGRAM_ID || "");\n    if (!owner || uid !== owner) { await ctx.reply("⛔ admin only"); return; }\n    setTestMode(false);\n    await ctx.reply("🛑 Test mode disabled");\n  });\n\n  bot.command("ticket", async (ctx)=>{\n    const id = ctx.from?.id || 0;\n    const u = ctx.from?.username ? String(ctx.from.username) : \"\";\n    addTickets(id, 1, \"ticket_view\");\n    const t = getTickets(id);\n    await ctx.reply(\"🎟 Ticket score: \" + t.score + (u ? \" (@\"+u+\")\" : \"\"));\n  });\n\n  bot.command("chest_open", async (ctx)=>{\n    if (ctx.chat?.type !== \"private\") return;\n    const uid = String(ctx.from?.id || \"\");\n    const owner = String(process.env.OWNER_TELEGRAM_ID || \"\");\n    if (!owner || uid !== owner) { await ctx.reply(\"⛔ admin only\"); return; }\n    if (!isTestMode()) { await ctx.reply(\"ℹ️ Test mode is OFF\"); return; }\n    const gate = aiGateOpen();\n    if (!gate.allowOpen){ await ctx.reply(\"AI gate blocked: \" + gate.reason); return; }\n    const eid = bumpEvent();\n    const winners = runChestDraw(eid);\n    const lines = winners.map((w,i)=> (i+1)+\") \" + (w.username?\"@\"+w.username:\"tg:\"+w.tgId) + \" — \" + w.prize);\n    await ctx.reply(\"🧰 CHEST OPEN (event #\"+eid+\")\\n\" + lines.join(\"\\n\"));\n  });\n\n  bot.command("winners", async (ctx)=>{\n    const top = topTickets(10);\n    const lines = top.map((x,i)=> (i+1)+\") \" + (x.username?\"@\"+x.username:\"tg:\"+x.tgId) + \" — \" + x.score);\n    await ctx.reply(\"🏆 Ticket leaderboard (top 10)\\n\" + lines.join(\"\\n\"));\n  });\n`);
    }
    return s;
  });
} else {
  console.log("handler.ts not found, skipping patch");
}

console.log("✅ bootstrap_testmode done");
