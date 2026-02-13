import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import OpenAI from "openai";

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const MAX = Number(process.env.AGENT_MAX || 6);
const CMD = process.env.AGENT_CMD || 'bash -lc "true"';

function sh(cmd: string) {
  return execSync(cmd, { stdio: ["ignore", "pipe", "pipe"] }).toString("utf8");
}

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

function normalizePatchText(t: string) {
  let s = String(t || "").trim();

  // Strip markdown fences if model returned ```diff ... ```
  if (s.startsWith("```")) {
    const lines = s.split("\n");
    // drop first fence
    lines.shift();
    // drop last fence if present
    if (lines.length && lines[lines.length - 1].startsWith("```")) lines.pop();
    s = lines.join("\n").trim();
  }

  return s;
}

function readContextForPrompt() {
  // Keep this cheap and safe. We don’t need repo-wide dumps.
  // Agent MUST rely on ALLOW_PATHS restriction + safety-check.
  const head = sh("git rev-parse --short HEAD").trim();
  return `REPO_HEAD=${head}`;
}

async function run(goal: string) {
  const allow = process.env.ALLOW_PATHS || "README.md";
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  let lastError = "";

  for (let i = 1; i <= MAX; i++) {
    const context = readContextForPrompt();

    const prompt = [
      `TASK: ${goal}`,
      ``,
      `ALLOW_PATHS: ${allow}`,
      `RULES:`,
      `- Return ONLY valid JSON.`,
      `- JSON shape MUST be: {"patch":"..."} (string).`,
      `- patch MUST be a git unified diff that starts with: diff --git`,
      `- patch MUST apply with: git apply`,
      `- patch MUST only touch files within ALLOW_PATHS.`,
      `- Do NOT include markdown fences unless inside the patch string (prefer NO fences).`,
      ``,
      `CONTEXT:`,
      context,
      lastError ? `\nLAST_ERROR:\n${lastError}\n` : "",
    ].join("\n");

    let raw = "";
    try {
      const resp = await client.chat.completions.create({
        model: MODEL,
        temperature: 0,
        messages: [{ role: "user", content: prompt }],
      });
      raw = (resp.choices[0]?.message?.content || "").trim();
    } catch (e: any) {
      lastError = `OpenAI call failed: ${String(e?.message || e)}`;
      continue;
    }

    let obj: any;
    try {
      obj = JSON.parse(raw);
    } catch {
      lastError = `Model did not return valid JSON. First 200 chars:\n${raw.slice(0, 200)}`;
      continue;
    }

    const patchTextRaw = String(obj?.patch || "");
    if (!patchTextRaw || patchTextRaw.length < 20) {
      lastError = 'JSON missing "patch" or patch too short.';
      continue;
    }

    const patch = normalizePatchText(patchTextRaw);

    // HARD GUARD: must be real git diff
    if (!patch.startsWith("diff --git ")) {
      lastError =
        'Invalid patch: missing "diff --git " header. Model returned non-git patch format.';
      continue;
    }

    ensureDir("agent-runtime");
    ensureDir("agent-runtime/logs");

    const patchPath = path.join("agent-runtime", "work.patch");
    fs.writeFileSync(patchPath, patch, "utf8");

    try {
      // Ensure clean working tree before applying
      sh("git reset --hard");
      sh("git clean -fd");

      // Apply patch
      sh(`git apply --check "${patchPath}"`);
      sh(`git apply "${patchPath}"`);

      // Enforce allowlist AFTER patch applied
      sh(`ALLOW_PATHS="${allow}" bash scripts/safety-check.sh`);

      // Require real changes (non-empty)
      const changed = sh("git status --porcelain").trim();
      if (!changed) {
        lastError = "No changes produced by agent. Must output a real unified diff within ALLOW_PATHS.";
        sh("git reset --hard");
        continue;
      }

      // Optional verification command
      const out = sh(CMD);
      fs.writeFileSync(path.join("agent-runtime", "logs", `run_${Date.now()}.log`), out, "utf8");

      console.log(`✅ Agent succeeded (iter ${i}/${MAX})`);
      console.log(sh("git diff --stat"));
      return;
    } catch (e: any) {
      lastError = String(e?.message || e);
      try {
        sh("git reset --hard");
      } catch {}
      continue;
    }
  }

  console.log("❌ Agent failed after max iterations");
  console.log(lastError);
  process.exit(1);
}

const goal = process.argv.slice(2).join(" ").trim();
if (!goal) {
  console.error('usage: pnpm agent:run "your goal"');
  process.exit(1);
}

run(goal);
