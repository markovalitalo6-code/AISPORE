import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import dotenv from "dotenv";
import OpenAI from "openai";

/**
 * Robust patch-based agent runner (future-proof)
 * - Loads .env via DOTENV_CONFIG_PATH (e.g. .env.agent)
 * - Calls OpenAI -> expects JSON { patch: "diff --git ..." }
 * - Normalizes patch (strips ``` fences)
 * - Enforces: must start with "diff --git "
 * - Enforces: touched paths must be within ALLOW_PATHS
 * - git reset/clean, git apply --check + apply, then safety-check allowlist
 * - Retries up to AGENT_MAX_ITERS
 */

function sh(cmd: string): string {
  return execSync(cmd, { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" });
}

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

function normalizePatchText(t: string): string {
  let s = String(t || "").trim();

  // Strip markdown fences if model returned ```diff ... ``` or ``` ... ```
  if (s.startsWith("```")) {
    const lines = s.split("\n");
    // drop first fence line
    lines.shift();
    // drop last fence line if present
    if (lines.length && lines[lines.length - 1].trim().startsWith("```")) lines.pop();
    s = lines.join("\n").trim();
  }

  // Some models might wrap in extra whitespace
  return s.trim() + "\n";
}

function parseAllowList(raw: string): string[] {
  // allow "docs/" or "docs/,scripts/" or "docs/ scripts/"
  return raw
    .split(/[,\s]+/g)
    .map((x) => x.trim())
    .filter(Boolean);
}

function isAllowedPath(filePath: string, allowList: string[]): boolean {
  const p = filePath.replace(/^(\.\/)+/, "");
  for (const a0 of allowList) {
    const a = a0.replace(/^(\.\/)+/, "");
    if (!a) continue;
    if (a.endsWith("/")) {
      if (p.startsWith(a)) return true;
    } else {
      if (p === a) return true;
      // also accept "docs" meaning "docs/"
      if (a === "docs" && p.startsWith("docs/")) return true;
    }
  }
  return false;
}

function touchedPathsFromPatch(patch: string): string[] {
  const out: string[] = [];
  const re = /^diff --git a\/(.+?) b\/(.+?)\s*$/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(patch))) {
    const a = m[1];
    // prefer a-path unless it's /dev/null
    if (a && a !== "/dev/null") out.push(a);
  }
  return Array.from(new Set(out));
}

async function run(goal: string) {
  dotenv.config({ path: process.env.DOTENV_CONFIG_PATH || ".env" });

  const apiKey = process.env.OPENAI_API_KEY || "";
  if (!apiKey) {
    console.error("❌ OPENAI_API_KEY missing (check DOTENV_CONFIG_PATH / .env.agent).");
    process.exit(1);
  }

  const MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  const MAX = Number(process.env.AGENT_MAX_ITERS || 6);
  const allowRaw = process.env.ALLOW_PATHS || "README.md";
  const allowList = parseAllowList(allowRaw);
  const CMD = process.env.AGENT_CMD || "echo_OK";

  const client = new OpenAI({ apiKey });

  ensureDir("agent-runtime");
  ensureDir("agent-runtime/logs");

  let lastError = "unknown";
  for (let i = 1; i <= MAX; i++) {
    // keep prompt extremely explicit to stop README “helpfulness”
    const strict = [
      "You are a code agent. Return ONLY JSON.",
      `Goal: ${goal}`,
      "",
      "HARD REQUIREMENTS:",
      '1) Return JSON in the shape: {"patch":"..."}',
      '2) patch MUST be a valid unified git diff and MUST start with: diff --git',
      "3) patch MUST apply with: git apply",
      `4) patch MUST ONLY modify files inside ALLOW_PATHS: ${allowRaw}`,
      "5) Do NOT modify README unless README is inside ALLOW_PATHS explicitly.",
      "6) Do NOT include markdown fences. No ``` blocks.",
      "",
      "If you are unsure, make the smallest safe change inside ALLOW_PATHS.",
      "",
      "Return ONLY JSON. No commentary.",
    ].join("\n");

    let raw = "";
    if (process.env.AGENT_PATCH_JSON && process.env.AGENT_PATCH_JSON.trim().length > 0) {
      raw = process.env.AGENT_PATCH_JSON.trim();
    } else {
      try {
        const resp = await client.chat.completions.create({
          model: MODEL,
          temperature: 0,
          messages: [{ role: "user", content: strict }],
        });
        raw = (resp.choices[0]?.message?.content || "").trim();
      } catch (e: any) {
        lastError = `OpenAI call failed: ${String(e?.message || e)}`;
        continue;
      }
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

    // Guard 1: must be git-style diff
    if (!patch.trimStart().startsWith("diff --git ")) {
      lastError =
        'Invalid patch: missing "diff --git" header. Model must output git-style unified diff.';
      continue;
    }

    // Guard 2: reject wrapped lines / broken continuations (prevents corrupt patches)
    if (/\\\n/.test(patch) || /\\\r\n/.test(patch) || /\\$/.test(patch.split("\n").slice(0,200).join("\n"))) {
      lastError = "Invalid patch: contains wrapped lines (\\ + newline). Regenerate patch with no wrapped lines.";
      continue;
    }

    // Guard 2: enforce ALLOW_PATHS by parsing diff headers
    const touched = touchedPathsFromPatch(patch);
    if (!touched.length) {
      lastError = "Invalid patch: no diff --git file headers found.";
      continue;
    }
    const bad = touched.filter((p) => !isAllowedPath(p, allowList));
    if (bad.length) {
      lastError = `Patch touches disallowed paths: ${bad.join(", ")} (ALLOW_PATHS=${allowRaw})`;
      continue;
    }

    const patchPath = path.join("agent-runtime", "work.patch");
    fs.writeFileSync(patchPath, patch, "utf8");

    try {
      // Ensure clean working tree before applying
      sh("git reset --hard");
      sh("git clean -fd");

      // Apply patch
      sh(`git apply --check "${patchPath}"`);
      sh(`git apply "${patchPath}"`);

      // Enforce allowlist (must run after patch applied)
      sh(`ALLOW_PATHS="${allowRaw}" bash scripts/safety-check.sh`);

      // Require real changes
      const changed = sh("git status --porcelain").trim();
      if (!changed) {
        lastError = "No changes produced by agent. Must output a real unified diff within ALLOW_PATHS.";
        sh("git reset --hard");
        continue;
      }

      // Optional verification command (kept for future)
      const out = sh(CMD);
      fs.writeFileSync(path.join("agent-runtime", "logs", `run_${Date.now()}.log`), out, "utf8");

      console.log(`✅ Agent succeeded (iter ${i}/${MAX})`);
      console.log(sh("git diff --stat"));
      return;
    } catch (e: any) {
      lastError = String(e?.message || e);
      try {
        sh("git reset --hard");
        sh("git clean -fd");
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
