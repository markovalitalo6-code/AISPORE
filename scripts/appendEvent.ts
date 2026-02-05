import fs from "node:fs";
import path from "node:path";

type AnyObj = Record<string, any>;

const ROOT = process.cwd();
const EVENTS_PATH = path.join(ROOT, "web/ai-spore-site/public/events.jsonl");

function isoNow() {
  return new Date().toISOString();
}

// ultra-kevyt “id” (riittää audit trailiin)
function makeId(ts: string) {
  return ts.replace(/[-:.TZ]/g, "") + "-" + Math.random().toString(16).slice(2, 10);
}

function ensureFile(filePath: string) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, "", "utf8");
  }
}

function appendJsonl(filePath: string, obj: AnyObj) {
  ensureFile(filePath);
  fs.appendFileSync(filePath, JSON.stringify(obj) + "\n", "utf8");
}

function main() {
  const [type, ...rest] = process.argv.slice(2);
  if (!type) {
    console.error('Usage: pnpm exec tsx scripts/appendEvent.ts "<type>" \'{"k":"v"}\'');
    process.exit(1);
  }

  const payloadRaw = rest.join(" ").trim();
  let payload: AnyObj = {};
  if (payloadRaw) {
    try {
      payload = JSON.parse(payloadRaw);
    } catch (e) {
      console.error("Payload must be valid JSON. Example:", '{"note":"hello"}');
      process.exit(1);
    }
  }

  const ts = isoNow();
  const event = {
    id: makeId(ts),
    ts,
    type,
    v: 1,
    ...payload,
  };

  appendJsonl(EVENTS_PATH, event);
  console.log("✅ appended event:", event);
  console.log("📄", EVENTS_PATH);
}

main();
