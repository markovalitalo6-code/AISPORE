#!/usr/bin/env tsx

/**
 * Agent runner (patch-based)
 * - Asks model for JSON { patch: "<unified diff>" }
 * - Writes patch to agent-runtime/work.patch
 * - git apply --check + git apply
 * - runs safety-check allowlist (ALLOW_PATHS)
 * - runs verification CMD (AGENT_CMD)
 * - requires real changes (git status --porcelain)
 */

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config({ path: process.env.DOTENV_CONFIG_PATH || ".env.agent" });

const MODEL = process.env.AGENT_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini";
const MAX = Number(process.env.AGENT_MAX_ITERS || 6);

// Default command can be a cheap no-op. You can set AGENT_CMD in .env.agent.
const CMD = process.env.AGENT_CMD || "echo OK";

function sh(cmd: string) {
  return execSync(cmd, { stdio: "pipe", encoding: "utf8", shell: "/bin/zsh" });
}

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

function readFileIfExists(p: string) {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return "";
  }
}

async function run(goal: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("❌ OPENAI_API_KEY missing in .env.agent (or environment).");
    process.exit(1);
  }

  const client = new OpenAI({ apiKey });

  const allow = (process.env.ALLOW_PATHS || "README.md").trim();

  // Provide a small context payload to the model. Keep it tight.
  // NOTE: if you want richer context later, add curated file reads here.
  const readme = readFileIfExists("README.md");

  let lastError = "";

  for (let i = 1; i <= MAX; i++) {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: [
          "You are a cautious repo automation agent.",
          "Return ONLY valid JSON (no markdown).",
          "You MUST return a unified diff patch in field `patch`.",
          "The patch MUST apply with `git apply`.",
          "Only modify files within ALLOW_PATHS provided.",
          "Do NOT touch memory/* or build/specs/*LOCKED*.",
          "If unsure, do the smallest safe improvement.",
        ].join("\n"),
      },
      {
        role: "user",
        content: [
          `GOAL: ${goal}`,
          ``,
          `ALLOW_PATHS: ${allow}`,
          ``,
          `CURRENT README.md (exact):`,
          `---`,
          readme,
          `---`,
          ``,
          `Return JSON like: {"patch":"<unified diff>"} `,
        ].join("\n"),
      },
    ];

    let raw = "";
    try {
      const resp = await client.chat.completions.create({
        model: MODEL,
        messages,
        temperature: 0,
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

    const patchText = String(obj?.patch || "");
    if (!patchText || patchText.length < 20) {
      lastError = 'JSON missing "patch" or patch too short.';
      continue;
    }

    ensureDir("agent-runtime");
    ensureDir("agent-runtime/logs");

    const patchPath = path.join("agent-runtime", "work.patch");
    fs.writeFileSync(patchPath, patchText, "utf8");

    try {
      // Ensure clean working tree before applying
      sh("git reset --hard");
      sh("git clean -fd");

      // Apply patch
      sh(`git apply --check "${patchPath}"`);
      sh(`git apply "${patchPath}"`);

      // Enforce allowlist (must run after patch applied)
      sh(`ALLOW_PATHS="${allow}" bash scripts/safety-check.sh`);

      // Require real changes
      const changed = sh("git status --porcelain").trim();
      if (!changed) {
        lastError = "No changes produced by agent. Must output a real unified diff within ALLOW_PATHS.";
        sh("git reset --hard");
        continue;
      }

      // Verification command (optional)
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
