#!/usr/bin/env bash
set -euo pipefail

REPO="markovalitalo6-code/AISPORE"
LABEL="run-agent"

# 1) Get newest issue with label
NUM="${1:-}"
if [[ -z "${NUM:-}" ]]; then
NUM="$(gh issue list --repo "$REPO" --label "$LABEL" --limit 1 --json number -q '.[0].number' || true)"
fi
if [[ -z "${NUM}" || "${NUM}" == "null" ]]; then
  echo "No issues found with label $LABEL"
  exit 0
fi

TITLE="$(gh issue view "$NUM" --repo "$REPO" --json title -q '.title')"
BODY="$(gh issue view "$NUM" --repo "$REPO" --json body -q '.body')"
URL="$(gh issue view "$NUM" --repo "$REPO" --json url -q '.url')"

# ---- allowlist parsing (default: README only) ----
ALLOW="README.md"
ALLOW_LINE="$(printf '%s\n' "$BODY" | sed -n 's/^[[:space:]]*ALLOW:[[:space:]]*//p' | head -n 1 || true)"
if [[ -n "${ALLOW_LINE:-}" ]]; then
  # normalize whitespace
  ALLOW="$(echo "$ALLOW_LINE" | tr -s ' ' | sed 's/^ *//;s/ *$//')"
fi

# hard blocklist regardless of ALLOW
if echo " $ALLOW " | rg -q '(^| )memory/|(^| )build/specs/|LOCKED'; then
  gh issue comment "$NUM" --repo "$REPO" --body "❌ Refusing: ALLOW contains forbidden paths (memory/ or build/specs/*LOCKED*)."
  gh issue edit "$NUM" --repo "$REPO" --remove-label "run-agent" --add-label "agent-done" || true
  exit 0
fi
# -----------------------------------------------


echo "== Picking issue #$NUM =="
echo "Title: $TITLE"
echo "URL:   $URL"
# Always mark issue processed to avoid infinite loops (even if no PR / no changes).
mark_done() {
  if [[ -n "${NUM:-}" && -n "${REPO:-}" ]]; then
    gh issue edit "$NUM" --repo "$REPO" --remove-label "run-agent" --add-label "agent-done" >/dev/null 2>&1 || true
  fi
}
trap mark_done EXIT

echo

BR="agent/issue-${NUM}-$(date +%Y%m%d-%H%M%S)"

# 2) Fresh sync
git fetch origin
git checkout infra/agent-runner
git pull --ff-only

# 3) Create work branch (reset if exists locally)
if git show-ref --verify --quiet "refs/heads/$BR"; then
  git branch -D "$BR"
fi
git checkout -b "$BR"

# 4) Run agent using issue as prompt (safe: no code fences)
PROMPT="Issue #$NUM: $TITLE

$BODY

Constraints:
- Follow repository SSOT rules.
- Do not modify memory/* or build/specs/*LOCKED*.
- If task is unclear, make the smallest safe improvement.
"
ALLOW_PATHS="$ALLOW" pnpm agent:run "$PROMPT"

# 5) Commit changes (if any)
if [[ -z "$(git status --porcelain)" ]]; then
  echo "No changes produced. Exiting without PR."
  gh issue comment "$NUM" --repo "$REPO" --body "Runner executed but produced no changes."
  exit 0
fi

git add -A
git commit -m "agent: issue #$NUM — $TITLE"

# 6) Push branch and open PR
git push -u origin "$BR"

PR_URL="$(gh pr create --repo "$REPO" \
  --title "Agent: #$NUM — $TITLE" \
  --body "Automated change from issue #$NUM ($URL).

- Source issue: $URL
- Label: $LABEL
" \
  --head "$BR" \
  --base infra/agent-runner
)"

echo "PR: $PR_URL"

# 7) Comment back on issue with PR link
gh issue comment "$NUM" --repo "$REPO" --body "✅ Created PR: $PR_URL"

# mark processed

gh issue edit "$NUM" --repo "$REPO" --remove-label "run-agent" --add-label "agent-done"
echo "Done."
