const fs = require("fs");
const path = require("path");

function arg(name, def=null){
  const i = process.argv.indexOf("--"+name);
  if(i === -1) return def;
  return process.argv[i+1] ?? def;
}

const mc = Number(arg("mc","3000"));
const label = String(arg("label","test"));
const outDir = arg("out","./tmp_testmode");
const now = new Date().toISOString();

fs.mkdirSync(outDir, { recursive: true });

const report = {
  at: now,
  label,
  mc,
  notes: [
    "This is TESTMODE simulation report (no real on-chain actions).",
    "Used for dry-running chest logic, fairness rules, and auditing."
  ],
  inputs: {
    totalSupply: 1_000_000_000,
    mc
  },
  outputs: {
    chestEventId: Math.floor(Date.now()/1000),
    winners: [],
    audit: []
  }
};

// Placeholder winners structure (will be replaced by real draw engine once wired)
report.outputs.winners = [
  { rank: 1, prize: "ROLE: Founding Legend", rule: "weighted_by_tickets" },
  { rank: 2, prize: "ROLE: Spore Captain", rule: "weighted_by_tickets" },
  { rank: 3, prize: "TOKEN: 0.05% of TEST pool", rule: "mc-tier payout" },
];

report.outputs.audit = [
  { step: "mc-tier", value: mc <= 3000 ? "seed" : (mc <= 10000000 ? "growth" : "scale") },
  { step: "anti-whale", value: "enabled" },
  { step: "anti-bot", value: "enabled" },
  { step: "randomness", value: "seeded (test)" },
];

const file = path.join(outDir, `scenario_${label}_mc${mc}_${Date.now()}.json`);
fs.writeFileSync(file, JSON.stringify(report, null, 2), "utf8");
console.log("✅ scenario report written:", file);
