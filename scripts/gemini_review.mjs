import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("Missing GEMINI_API_KEY");
  process.exit(1);
}

const diff = process.env.PR_DIFF || "";
const prTitle = process.env.PR_TITLE || "";
const prBody = process.env.PR_BODY || "";
const repo = process.env.GITHUB_REPOSITORY || "";
const ref = process.env.GITHUB_REF || "";

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const prompt = `
You are a senior security+backend+tokenomics reviewer for the AISPORE repo.
Repo: ${repo}
Ref: ${ref}

PR title: ${prTitle}
PR description:
${prBody}

TASK:
- Review the diff below.
- Output ONLY markdown.
- Sections:
  1) Summary (3-6 bullets)
  2) High-risk issues (must-fix before merge)
  3) Medium-risk issues
  4) Low-risk/nits
  5) Tests/verification checklist (concrete commands)
  6) AISPORE-specific audit: reward locking, ticket calc, anti-whale/sybil, treasury caps, API/web wiring

DIFF:
\`\`\`diff
${diff.slice(0, 180000)}
\`\`\`
`;

const result = await model.generateContent(prompt);
const text = result?.response?.text?.() ?? "No response from Gemini.";
console.log(text);
