# OJ MASTER ANCHOR — AISPORE (SSOT)

SSOT is the GitHub repo: markovalitalo6-code/AISPORE  
Local path (Marko): $HOME/hub/AI-WorkSpace/01_projects/ai-spore

## Read order (locked)
1) memory/OJ_START_HERE.md
2) memory/state.md
3) memory/decisions.md
4) memory/project.md

## Operating rules (locked)
- One step at a time (single command block).
- No new ideas/systems.
- WEB is source of truth; TG only announces/routes.
- Must preserve: weekly lock idempotency, admin gating, public readback, API/Web wiring.
- Every change updates SSOT memory files.

## Current verified facts (as of last SSOT update)
- Core loop verified: ticket calc → raffle → reward lock (admin) → readback (public).
- Weekly lock idempotency verified (same week returns same id/hash/winner; seed immutability).
- Admin gating verified via curl (401 w/o key; 200 w/ x-admin-key; public read endpoints).
- API :3100, WEB :3000, web rewrites /api → :3100
- Hardening A (rate limiting) merged and verified.
