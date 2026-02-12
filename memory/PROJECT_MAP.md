# PROJECT_MAP — AISPORE

## Repo Root
/Users/omistaja/hub/AI-WorkSpace/01_projects/ai-spore

## Key Directories
- memory/ — SSOT docs, anchors, decisions, state
- build/specs/ — authoritative specs (LOCKED lives here)
- src/api/ — Express API (ts-node), off-chain event ledger (jsonl)
- web/ai-spore-site/ — Next.js site (draw/live/test pages, /api rewrites)
- src/api/scripts/ — local scripts / runners (if present)
- agent-runtime/ — (future) local-first agent runner infra (must not modify SSOT/LOCKED)

## Services
- API: http://localhost:3100
- Web: http://localhost:3000

## DB / Storage (local, append-only)
- src/api/data/events/*.jsonl  (events ledger: tickets, draw, payout, treasury)

## Core Commands (typical)
From repo root:
- pnpm install
- pnpm dev
- pnpm build
- pnpm test

## LOCKED SPEC
- build/specs/C_v1_LOCKED_*.md
