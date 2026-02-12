import 'dotenv/config';
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import OpenAI from 'openai';

const MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
const CMD_RAW = process.env.AGENT_CMD || 'cd web/ai-spore-site && pnpm -s build';
const CMD = (CMD_RAW === "echo_OK") ? "echo OK" : CMD_RAW;
const MAX = Number(process.env.AGENT_MAX_ITERS || 6);

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function sh(cmd: string) {
  return execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
}

function readFileSafe(p: string, maxChars = 12000) {
  try {
    const t = fs.readFileSync(p, 'utf8');
    return t.length > maxChars ? t.slice(0, maxChars) + '\n...[clipped]' : t;
  } catch {
    return '(missing)';
  }
}

async function run(goal: string) {
  let lastError = '';

  for (let i = 1; i <= MAX; i++) {
    const readme = readFileSafe('README.md');

    const messages = [
      {
        role: 'system' as const,
        content: [
          'You are a local code agent.',
          'Respond with VALID JSON ONLY.',
          'JSON schema: {"readme":"<FULL NEW README.md CONTENT>"}',
          'No other keys. No prose. No markdown. No code fences.',
          'Make minimal wording improvements without changing meaning.',
          'Do not modify anything except README.md.',
        ].join('\n'),
      },
      {
        role: 'user' as const,
        content: [
          `GOAL: ${goal}`,
          '',
          lastError ? `PREVIOUS ERROR:\n${lastError}\n` : '',
          'CURRENT README.md (exact):',
          '---',
          readme,
          '---',
          '',
          'Return JSON with the FULL updated README.md content in "readme".',
        ].join('\n'),
      },
    ];

    const resp = await client.chat.completions.create({
      model: MODEL,
      messages,
      temperature: 0,
    });

    const raw = (resp.choices[0]?.message?.content || '').trim();

    let obj: any;
    try {
      obj = JSON.parse(raw);
    } catch {
      lastError = `Model did not return valid JSON. First 200 chars:\n${raw.slice(0, 200)}`;
      continue;
    }

    const newReadme = String(obj?.readme || '');
    if (!newReadme || newReadme.length < 20) {
      lastError = 'JSON missing "readme" or content too short.';
      continue;
    }

    // write file directly (no git apply)
    fs.writeFileSync('agent-runtime/work.patch', patch, 'utf8');
    try {
      // run command as verification
      sh("git apply --check agent-runtime/work.patch");
      sh("git apply agent-runtime/work.patch");
      sh(`ALLOW_PATHS="${process.env.ALLOW_PATHS || "README.md"}" bash scripts/safety-check.sh`);
      const out = sh(CMD);
      // If nothing changed, treat as failure and retry with a stricter instruction.
      const changed = sh("git status --porcelain").trim();
      if (!changed) {
        lastError = "No changes produced by agent. Must output a real unified diff within ALLOW_PATHS.";
        sh("git reset --hard");
        continue;
      }

      fs.mkdirSync('agent-runtime/logs', { recursive: true });
      fs.writeFileSync(`agent-runtime/logs/run_${Date.now()}.log`, out, 'utf8');

      console.log(`✅ Agent succeeded (iter ${i}/${MAX})`);
      console.log(sh('git diff --stat'));
      return;
    } catch (e: any) {
      lastError = String(e?.message || e);
      try { sh('git reset --hard'); } catch {}
    }
  }

  console.log('❌ Agent failed after max iterations');
  console.log(lastError);
  process.exit(1);
}

const goal = process.argv.slice(2).join(' ').trim();
if (!goal) {
  console.error('usage: pnpm agent:run "your goal"');
  process.exit(1);
}
run(goal);
